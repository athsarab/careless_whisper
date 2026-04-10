from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
from app import db
from app.models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "")

    user = User.query.filter_by(username=username).first()
    if not user or not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity={"id": user.id, "role": user.role})
    return jsonify({"token": token, "user": user.to_dict()})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    identity = get_jwt_identity()
    user = User.query.get(identity["id"])
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.to_dict())


@auth_bp.route("/logout", methods=["POST"])
@jwt_required()
def logout():
    return jsonify({"message": "Logged out"})


# Seed default admin account (call once)
@auth_bp.route("/seed", methods=["POST"])
def seed():
    if User.query.filter_by(username="admin").first():
        return jsonify({"message": "Already seeded"}), 200

    pw_hash = bcrypt.hashpw("admin123".encode(), bcrypt.gensalt()).decode()
    admin = User(username="admin", email="admin@sdra.local", password_hash=pw_hash, role="admin")
    researcher_pw = bcrypt.hashpw("research123".encode(), bcrypt.gensalt()).decode()
    researcher = User(username="researcher", email="researcher@sdra.local",
                      password_hash=researcher_pw, role="researcher")
    db.session.add_all([admin, researcher])
    db.session.commit()
    return jsonify({"message": "Seeded admin + researcher accounts"})
