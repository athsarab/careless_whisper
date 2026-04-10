from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from app import db
from app.models import TestDevice, User

devices_bp = Blueprint("devices", __name__)


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        identity = get_jwt_identity()
        if identity.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper


@devices_bp.route("", methods=["GET"])
@jwt_required()
def list_devices():
    devices = TestDevice.query.order_by(TestDevice.created_at.desc()).all()
    return jsonify([d.to_dict() for d in devices])


@devices_bp.route("", methods=["POST"])
@admin_required
def add_device():
    identity = get_jwt_identity()
    data = request.get_json()
    phone = data.get("phone_number", "").strip()
    label = data.get("label", "")
    consent = data.get("consent_verified", False)

    if not phone:
        return jsonify({"error": "phone_number required"}), 400

    if TestDevice.query.filter_by(phone_number=phone).first():
        return jsonify({"error": "Device already registered"}), 409

    device = TestDevice(
        phone_number=phone,
        label=label,
        consent_verified=consent,
        added_by=identity["id"],
    )
    db.session.add(device)
    db.session.commit()
    return jsonify(device.to_dict()), 201


@devices_bp.route("/<device_id>", methods=["PUT"])
@admin_required
def update_device(device_id):
    device = TestDevice.query.get_or_404(device_id)
    data = request.get_json()
    device.label = data.get("label", device.label)
    device.consent_verified = data.get("consent_verified", device.consent_verified)
    db.session.commit()
    return jsonify(device.to_dict())


@devices_bp.route("/<device_id>", methods=["DELETE"])
@admin_required
def delete_device(device_id):
    device = TestDevice.query.get_or_404(device_id)
    db.session.delete(device)
    db.session.commit()
    return jsonify({"message": "Device removed"})
