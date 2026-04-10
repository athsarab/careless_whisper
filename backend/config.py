import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "sdra-cybersec-secret-2024-xK9mP")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "sdra-jwt-secret-2024-zL8nQ")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)

    # Neon PostgreSQL
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "postgresql://neondb_owner:npg_eqM9SXv4TQyd@ep-round-dream-a-ngur44i.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "connect_args": {"sslmode": "require"},
    }

    # Socket.IO
    SOCKETIO_ASYNC_MODE = "eventlet"
    CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
