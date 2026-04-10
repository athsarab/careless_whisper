from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_socketio import SocketIO

from config import Config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
socketio = SocketIO()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    CORS(app, origins=app.config["CORS_ORIGINS"], supports_credentials=True)
    socketio.init_app(
        app,
        cors_allowed_origins=app.config["CORS_ORIGINS"],
        async_mode=app.config["SOCKETIO_ASYNC_MODE"],
    )

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.probes import probes_bp
    from app.routes.receipts import receipts_bp
    from app.routes.analysis import analysis_bp
    from app.routes.devices import devices_bp
    from app.routes.admin import admin_bp
    from app.routes.simulator import simulator_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(probes_bp, url_prefix="/api/probes")
    app.register_blueprint(receipts_bp, url_prefix="/api/receipts")
    app.register_blueprint(analysis_bp, url_prefix="/api/analysis")
    app.register_blueprint(devices_bp, url_prefix="/api/devices")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(simulator_bp, url_prefix="/api/simulator")

    # Register socket events
    from app import sockets  # noqa: F401

    return app
