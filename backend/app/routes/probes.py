from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timezone
from app import db, socketio
from app.models import Probe, TestDevice

probes_bp = Blueprint("probes", __name__)


@probes_bp.route("", methods=["GET"])
@jwt_required()
def list_probes():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 20, type=int)
    device_id = request.args.get("device_id")

    q = Probe.query.order_by(Probe.sent_at.desc())
    if device_id:
        q = q.filter_by(device_id=device_id)

    pagination = q.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        "probes": [p.to_dict() for p in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "page": page,
    })


@probes_bp.route("/send", methods=["POST"])
@jwt_required()
def send_probe():
    identity = get_jwt_identity()
    data = request.get_json()
    device_id = data.get("device_id")
    probe_type = data.get("probe_type", "silent")

    device = TestDevice.query.get(device_id)
    if not device:
        return jsonify({"error": "Device not found"}), 404
    if not device.consent_verified:
        return jsonify({"error": "Device has not verified consent"}), 403

    probe = Probe(
        device_id=device_id,
        probe_type=probe_type,
        status="pending",
        researcher_id=identity["id"],
        sent_at=datetime.now(timezone.utc),
    )
    db.session.add(probe)
    db.session.commit()

    # Emit socket event
    socketio.emit("probe:sent", probe.to_dict())

    return jsonify(probe.to_dict()), 201


@probes_bp.route("/<probe_id>", methods=["GET"])
@jwt_required()
def get_probe(probe_id):
    probe = Probe.query.get_or_404(probe_id)
    return jsonify(probe.to_dict())


@probes_bp.route("/stats", methods=["GET"])
@jwt_required()
def probe_stats():
    total = Probe.query.count()
    pending = Probe.query.filter_by(status="pending").count()
    received = Probe.query.filter_by(status="received").count()
    timeout = Probe.query.filter_by(status="timeout").count()
    return jsonify({
        "total": total,
        "pending": pending,
        "received": received,
        "timeout": timeout,
    })
