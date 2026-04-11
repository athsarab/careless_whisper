from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
from sqlalchemy import or_
from flask import current_app
from app import db
from app.models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "")

    user = User.query.filter(
        or_(User.username == username, User.email == username)
    ).first()
    if not user or not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=user.id, additional_claims={"role": user.role})
    return jsonify({"token": token, "user": user.to_dict()})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
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
    if not current_app.config.get("AUTH_ALLOW_SEED", False):
        return jsonify({"error": "Seed endpoint disabled"}), 403

    data = request.get_json(silent=True) or {}
    force = bool(data.get("force")) or request.args.get("force", "").lower() in {"1", "true", "yes"}
    users = data.get("users", [])

    if not isinstance(users, list) or not users:
        return jsonify({
            "error": "Provide users list",
            "example": {
                "users": [
                    {"username": "admin", "password": "StrongPass1!", "role": "admin", "email": "admin@sdra.local"},
                    {"username": "researcher1", "password": "StrongPass2!", "role": "researcher", "email": "r1@sdra.local"},
                ],
                "force": False,
            },
        }), 400

    created = 0
    updated = 0
    for item in users:
        username = (item.get("username") or "").strip()
        password = item.get("password") or ""
        role = (item.get("role") or "researcher").strip().lower()
        email = (item.get("email") or f"{username}@sdra.local").strip()

        if not username or not password:
            continue

        if role not in {"admin", "researcher"}:
            role = "researcher"

        existing = User.query.filter_by(username=username).first()
        if existing and not force:
            continue

        pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        if existing:
            existing.email = email
            existing.role = role
            existing.password_hash = pw_hash
            updated += 1
        else:
            db.session.add(User(
                username=username,
                email=email,
                password_hash=pw_hash,
                role=role,
            ))
            created += 1

    db.session.commit()
    return jsonify({
        "message": "Seed complete",
        "created": created,
        "updated": updated,
        "skipped_existing_without_force": max(0, len(users) - created - updated),
    })
