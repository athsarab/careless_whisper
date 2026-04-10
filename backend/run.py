import eventlet
eventlet.monkey_patch()

from app import create_app, socketio

app = create_app()

if __name__ == "__main__":
    with app.app_context():
        from app import db
        db.create_all()
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)
