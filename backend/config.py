import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-me")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-change-me")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    AUTH_ALLOW_SEED = os.getenv("AUTH_ALLOW_SEED", "false").lower() in {"1", "true", "yes"}
    PREDEFINED_USERS = os.getenv("PREDEFINED_USERS", "")

    # Database: prefer DATABASE_URL, fallback to local sqlite for quick dev startup
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        f"sqlite:///{os.path.join(BASE_DIR, 'sdra_dev.db')}",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

    # SSL options for hosted Postgres providers (for example Neon)
    if SQLALCHEMY_DATABASE_URI.startswith("postgresql"):
        sslmode = os.getenv("DB_SSLMODE")
        if sslmode:
            SQLALCHEMY_ENGINE_OPTIONS["connect_args"] = {"sslmode": sslmode}
        elif "neon.tech" in SQLALCHEMY_DATABASE_URI or "sslmode=require" in SQLALCHEMY_DATABASE_URI:
            SQLALCHEMY_ENGINE_OPTIONS["connect_args"] = {"sslmode": "require"}

    # Socket.IO
    SOCKETIO_ASYNC_MODE = "eventlet"
    CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
