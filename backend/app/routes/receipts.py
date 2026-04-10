from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime, timezone
from app import db, socketio
from app.models import Receipt, Probe

receipts_bp = Blueprint("receipts", __name__)


@receipts_bp.route("", methods=["GET"])
@jwt_required()
def list_receipts():
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 30, type=int)
    probe_id = request.args.get("probe_id")

    q = Receipt.query.order_by(Receipt.received_at.desc())
    if probe_id:
        q = q.filter_by(probe_id=probe_id)

    pagination = q.paginate(page=page, per_page=per_page, error_out=False)
    return jsonify({
        "receipts": [r.to_dict() for r in pagination.items],
        "total": pagination.total,
        "pages": pagination.pages,
        "page": page,
    })


@receipts_bp.route("/capture", methods=["POST"])
@jwt_required()
def capture_receipt():
    data = request.get_json()
    probe_id = data.get("probe_id")
    ack_source = data.get("ack_source", "device-primary")
    raw_payload = data.get("raw_payload", {})

    probe = Probe.query.get(probe_id)
    if not probe:
        return jsonify({"error": "Probe not found"}), 404

    received_at = datetime.now(timezone.utc)
    rtt_ms = (received_at - probe.sent_at.replace(tzinfo=timezone.utc)).total_seconds() * 1000

    receipt = Receipt(
        probe_id=probe_id,
        received_at=received_at,
        ack_source=ack_source,
        rtt_ms=round(rtt_ms, 2),
        raw_payload=raw_payload,
    )

    # Update probe status
    probe.status = "received"

    db.session.add(receipt)
    db.session.commit()

    payload = receipt.to_dict()
    socketio.emit("receipt:captured", payload)

    return jsonify(payload), 201


@receipts_bp.route("/probe/<probe_id>", methods=["GET"])
@jwt_required()
def receipts_for_probe(probe_id):
    receipts = Receipt.query.filter_by(probe_id=probe_id).all()
    return jsonify([r.to_dict() for r in receipts])
