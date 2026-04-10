import uuid
from datetime import datetime, timezone
from app import db


def gen_uuid():
    return str(uuid.uuid4())


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="researcher")  # admin | researcher
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat(),
        }


class TestDevice(db.Model):
    __tablename__ = "test_devices"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    phone_number = db.Column(db.String(30), unique=True, nullable=False)
    label = db.Column(db.String(100))
    consent_verified = db.Column(db.Boolean, default=False)
    added_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    probes = db.relationship("Probe", backref="device", lazy="dynamic")
    analysis_results = db.relationship("AnalysisResult", backref="device", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "phone_number": self.phone_number,
            "label": self.label,
            "consent_verified": self.consent_verified,
            "added_by": self.added_by,
            "created_at": self.created_at.isoformat(),
        }


class Probe(db.Model):
    __tablename__ = "probes"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    device_id = db.Column(db.String(36), db.ForeignKey("test_devices.id"), nullable=False)
    sent_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    probe_type = db.Column(db.String(30), default="silent")  # silent | read | delivery
    status = db.Column(db.String(20), default="pending")  # pending | received | timeout
    researcher_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)

    receipts = db.relationship("Receipt", backref="probe", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "device_id": self.device_id,
            "sent_at": self.sent_at.isoformat(),
            "probe_type": self.probe_type,
            "status": self.status,
            "researcher_id": self.researcher_id,
            "receipt_count": self.receipts.count(),
        }


class Receipt(db.Model):
    __tablename__ = "receipts"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    probe_id = db.Column(db.String(36), db.ForeignKey("probes.id"), nullable=False)
    received_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    ack_source = db.Column(db.String(100))
    rtt_ms = db.Column(db.Float)
    raw_payload = db.Column(db.JSON)

    def to_dict(self):
        return {
            "id": self.id,
            "probe_id": self.probe_id,
            "received_at": self.received_at.isoformat(),
            "ack_source": self.ack_source,
            "rtt_ms": self.rtt_ms,
            "raw_payload": self.raw_payload,
        }


class AnalysisResult(db.Model):
    __tablename__ = "analysis_results"
    id = db.Column(db.String(36), primary_key=True, default=gen_uuid)
    device_id = db.Column(db.String(36), db.ForeignKey("test_devices.id"), nullable=False)
    analyzed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    online_probability = db.Column(db.Float, default=0.0)
    screen_active_prob = db.Column(db.Float, default=0.0)
    linked_device_count = db.Column(db.Integer, default=1)
    avg_rtt_ms = db.Column(db.Float, default=0.0)
    variance_rtt_ms = db.Column(db.Float, default=0.0)
    notes = db.Column(db.Text)

    def to_dict(self):
        return {
            "id": self.id,
            "device_id": self.device_id,
            "analyzed_at": self.analyzed_at.isoformat(),
            "online_probability": self.online_probability,
            "screen_active_prob": self.screen_active_prob,
            "linked_device_count": self.linked_device_count,
            "avg_rtt_ms": self.avg_rtt_ms,
            "variance_rtt_ms": self.variance_rtt_ms,
            "notes": self.notes,
        }
