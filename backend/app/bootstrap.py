import bcrypt
from app import db
from app.models import User


def _normalize_role(value: str) -> str:
    role = (value or "").strip().lower()
    return role if role in {"admin", "researcher"} else "researcher"


def bootstrap_predefined_users(raw_users: str) -> int:
    """
    PREDEFINED_USERS format (semicolon separated):
    username|password|role|email;username2|password2|role|email2
    """
    if not raw_users.strip():
        return 0

    count = 0
    for chunk in raw_users.split(";"):
        item = chunk.strip()
        if not item:
            continue

        parts = [p.strip() for p in item.split("|")]
        if len(parts) < 3:
            continue

        username, plain_password, role = parts[0], parts[1], _normalize_role(parts[2])
        email = parts[3] if len(parts) > 3 and parts[3] else f"{username}@sdra.local"

        if not username or not plain_password:
            continue

        user = User.query.filter_by(username=username).first()
        if not user:
            pw_hash = bcrypt.hashpw(plain_password.encode(), bcrypt.gensalt()).decode()
            db.session.add(
                User(
                    username=username,
                    email=email,
                    password_hash=pw_hash,
                    role=role,
                )
            )
            count += 1

    if count:
        db.session.commit()
    return count
