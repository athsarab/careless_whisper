from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime, timezone
import numpy as np
from app import db, socketio
from app.models import Receipt, Probe, AnalysisResult, TestDevice

analysis_bp = Blueprint("analysis", __name__)


def _compute_analysis(device_id):
    """Core RTT analysis engine."""
    probes = Probe.query.filter_by(device_id=device_id).all()
    probe_ids = [p.id for p in probes]

    receipts = Receipt.query.filter(Receipt.probe_id.in_(probe_ids)).all()
    rtts = [r.rtt_ms for r in receipts if r.rtt_ms is not None]

    if not rtts:
        return None

    avg_rtt = float(np.mean(rtts))
    var_rtt = float(np.var(rtts))
    std_rtt = float(np.std(rtts))

    # Heuristic: Online probability — low RTT + low variance = highly likely online
    online_prob = max(0.0, min(1.0, 1.0 - (avg_rtt / 5000.0)))

    # Heuristic: Screen active — very low RTT (<200ms) suggests screen is on
    fast_responses = sum(1 for r in rtts if r < 200)
    screen_prob = fast_responses / len(rtts) if rtts else 0.0

    # Linked device estimate: multiple acks per probe suggest multiple devices
    acks_per_probe = {}
    for r in receipts:
        acks_per_probe.setdefault(r.probe_id, 0)
        acks_per_probe[r.probe_id] += 1

    avg_acks = np.mean(list(acks_per_probe.values())) if acks_per_probe else 1
    linked_device_count = max(1, round(avg_acks))

    notes = (
        f"Analyzed {len(receipts)} receipts from {len(probes)} probes. "
        f"Avg RTT: {avg_rtt:.1f}ms, Std: {std_rtt:.1f}ms. "
        f"Estimated {linked_device_count} linked device(s)."
    )

    return {
        "online_probability": round(online_prob, 3),
        "screen_active_prob": round(screen_prob, 3),
        "linked_device_count": linked_device_count,
        "avg_rtt_ms": round(avg_rtt, 2),
        "variance_rtt_ms": round(var_rtt, 2),
        "notes": notes,
        "rtt_series": rtts[-50:],  # last 50 for chart
    }


@analysis_bp.route("/rtt", methods=["GET"])
@jwt_required()
def rtt_overview():
    device_id = request.args.get("device_id")
    q = Receipt.query
    if device_id:
        probes = Probe.query.filter_by(device_id=device_id).all()
        probe_ids = [p.id for p in probes]
        q = q.filter(Receipt.probe_id.in_(probe_ids))

    receipts = q.order_by(Receipt.received_at.asc()).limit(200).all()
    series = [{"time": r.received_at.isoformat(), "rtt": r.rtt_ms} for r in receipts]
    return jsonify({"series": series, "count": len(series)})


@analysis_bp.route("/status/<device_id>", methods=["GET"])
@jwt_required()
def device_status(device_id):
    result = _compute_analysis(device_id)
    if not result:
        return jsonify({"error": "No data for this device"}), 404
    return jsonify(result)


@analysis_bp.route("/run", methods=["POST"])
@jwt_required()
def run_analysis():
    data = request.get_json()
    device_id = data.get("device_id")

    if not device_id:
        return jsonify({"error": "device_id required"}), 400

    device = TestDevice.query.get(device_id)
    if not device:
        return jsonify({"error": "Device not found"}), 404

    result_data = _compute_analysis(device_id)
    if not result_data:
        return jsonify({"error": "No receipt data to analyze"}), 422

    ar = AnalysisResult(
        device_id=device_id,
        analyzed_at=datetime.now(timezone.utc),
        online_probability=result_data["online_probability"],
        screen_active_prob=result_data["screen_active_prob"],
        linked_device_count=result_data["linked_device_count"],
        avg_rtt_ms=result_data["avg_rtt_ms"],
        variance_rtt_ms=result_data["variance_rtt_ms"],
        notes=result_data["notes"],
    )
    db.session.add(ar)
    db.session.commit()

    payload = ar.to_dict()
    payload["rtt_series"] = result_data["rtt_series"]
    socketio.emit("analysis:updated", payload)

    return jsonify(payload), 201


@analysis_bp.route("/history/<device_id>", methods=["GET"])
@jwt_required()
def analysis_history(device_id):
    results = (
        AnalysisResult.query.filter_by(device_id=device_id)
        .order_by(AnalysisResult.analyzed_at.desc())
        .limit(20)
        .all()
    )
    return jsonify([r.to_dict() for r in results])


@analysis_bp.route("/summary", methods=["GET"])
@jwt_required()
def summary():
    latest = AnalysisResult.query.order_by(AnalysisResult.analyzed_at.desc()).limit(10).all()
    total_receipts = Receipt.query.count()
    total_probes = Probe.query.count()
    return jsonify({
        "total_probes": total_probes,
        "total_receipts": total_receipts,
        "latest_analyses": [r.to_dict() for r in latest],
    })
