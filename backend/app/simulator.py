"""
Sample data simulator — generates realistic probe/receipt data
with statistical noise for demo and testing purposes.
"""
import random
import threading
import time
from datetime import datetime, timezone, timedelta
from app import db, socketio
from app.models import Probe, Receipt, AnalysisResult, TestDevice

_sim_thread = None
_sim_running = False


def _simulate_rtt(device_scenario="online"):
    """Generate realistic RTT based on scenario."""
    if device_scenario == "online":
        base = random.gauss(150, 40)  # ~150ms avg when online
    elif device_scenario == "offline":
        base = random.gauss(3500, 800)  # slow delivery store
    elif device_scenario == "screen_off":
        base = random.gauss(600, 150)  # delayed wake
    else:
        base = random.gauss(300, 100)
    return max(50, round(base, 2))


def _simulation_loop():
    """Background loop that continuously generates probes + receipts."""
    global _sim_running
    from app import create_app
    app = create_app()

    with app.app_context():
        while _sim_running:
            devices = TestDevice.query.filter_by(consent_verified=True).all()
            if not devices:
                time.sleep(5)
                continue

            device = random.choice(devices)
            scenarios = ["online", "online", "online", "screen_off", "offline"]
            scenario = random.choice(scenarios)

            # Create probe
            probe = Probe(
                device_id=device.id,
                probe_type=random.choice(["silent", "delivery"]),
                status="pending",
                sent_at=datetime.now(timezone.utc),
            )
            db.session.add(probe)
            db.session.commit()
            socketio.emit("probe:sent", probe.to_dict())

            # Simulate delay before receipt
            rtt = _simulate_rtt(scenario)
            time.sleep(min(rtt / 1000.0, 4.0))

            if not _sim_running:
                break

            # Num acks = linked device estimate
            num_acks = random.choices([1, 2, 3], weights=[60, 30, 10])[0]
            for i in range(num_acks):
                received_at = datetime.now(timezone.utc)
                actual_rtt = (received_at - probe.sent_at.replace(tzinfo=timezone.utc)).total_seconds() * 1000
                receipt = Receipt(
                    probe_id=probe.id,
                    received_at=received_at,
                    ack_source=f"device-{i+1}",
                    rtt_ms=round(actual_rtt + random.gauss(0, 10), 2),
                    raw_payload={"scenario": scenario, "sim": True, "ack_index": i},
                )
                db.session.add(receipt)

            probe.status = "received"
            db.session.commit()

            last_receipt = receipt
            socketio.emit("receipt:captured", last_receipt.to_dict())
            socketio.emit("simulator:tick", {
                "device_id": device.id,
                "scenario": scenario,
                "rtt_ms": round(actual_rtt, 2),
                "num_acks": num_acks,
            })

            time.sleep(random.uniform(2, 6))


def start_simulator():
    global _sim_thread, _sim_running
    if _sim_running:
        return False
    _sim_running = True
    _sim_thread = threading.Thread(target=_simulation_loop, daemon=True)
    _sim_thread.start()
    return True


def stop_simulator():
    global _sim_running
    _sim_running = False
    return True


def is_running():
    return _sim_running
