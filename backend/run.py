import eventlet
eventlet.monkey_patch()
import os

from app import create_app, socketio

app = create_app()

if __name__ == "__main__":
    debug_mode = os.getenv("FLASK_DEBUG", "true").lower() in {"1", "true", "yes"}

    with app.app_context():
        from app import db
        from app.bootstrap import bootstrap_predefined_users
        db.create_all()
        created = bootstrap_predefined_users(app.config.get("PREDEFINED_USERS", ""))
        if created:
            print(f"[AUTH] Created {created} predefined user(s) from PREDEFINED_USERS")
    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=debug_mode,
        use_reloader=False,
    )
