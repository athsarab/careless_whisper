from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from functools import wraps
from app.simulator import start_simulator, stop_simulator, is_running

simulator_bp = Blueprint("simulator", __name__)


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper


@simulator_bp.route("/start", methods=["POST"])
@admin_required
def start():
    result = start_simulator()
    return jsonify({"started": result, "running": is_running()})


@simulator_bp.route("/stop", methods=["POST"])
@admin_required
def stop():
    result = stop_simulator()
    return jsonify({"stopped": result, "running": is_running()})


@simulator_bp.route("/status", methods=["GET"])
@jwt_required()
def status():
    return jsonify({"running": is_running()})
