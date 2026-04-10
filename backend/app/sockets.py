from app import socketio


@socketio.on("connect")
def handle_connect():
    print("Client connected:", socketio.server.manager.rooms)


@socketio.on("disconnect")
def handle_disconnect():
    print("Client disconnected")


@socketio.on("ping_server")
def handle_ping(data):
    socketio.emit("pong_client", {"status": "ok"})
