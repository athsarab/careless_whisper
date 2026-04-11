import csv
import io
from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import jwt_required, get_jwt
from functools import wraps
import bcrypt
from fpdf import FPDF
from app import db
from app.models import User, Probe, Receipt, AnalysisResult, TestDevice

admin_bp = Blueprint("admin", __name__)


def admin_required(fn):
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper


@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict() for u in users])


@admin_bp.route("/users", methods=["POST"])
@admin_required
def create_user():
    data = request.get_json()
    pw_hash = bcrypt.hashpw(data["password"].encode(), bcrypt.gensalt()).decode()
    user = User(
        username=data["username"],
        email=data["email"],
        password_hash=pw_hash,
        role=data.get("role", "researcher"),
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@admin_bp.route("/users/<user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted"})


@admin_bp.route("/export/csv", methods=["GET"])
@admin_required
def export_csv():
    receipts = Receipt.query.order_by(Receipt.received_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["receipt_id", "probe_id", "received_at", "ack_source", "rtt_ms"])
    for r in receipts:
        writer.writerow([r.id, r.probe_id, r.received_at.isoformat(), r.ack_source, r.rtt_ms])

    response = make_response(output.getvalue())
    response.headers["Content-Disposition"] = "attachment; filename=sdra_export.csv"
    response.headers["Content-Type"] = "text/csv"
    return response


@admin_bp.route("/export/pdf", methods=["GET"])
@admin_required
def export_pdf():
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "SDRA Experiment Report", ln=True, align="C")
    pdf.set_font("Helvetica", "", 10)
    pdf.ln(5)

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Summary Statistics", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"Total Probes: {Probe.query.count()}", ln=True)
    pdf.cell(0, 6, f"Total Receipts: {Receipt.query.count()}", ln=True)
    pdf.cell(0, 6, f"Total Devices: {TestDevice.query.count()}", ln=True)
    pdf.ln(5)

    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 8, "Recent Analysis Results", ln=True)
    pdf.set_font("Helvetica", "", 9)

    results = AnalysisResult.query.order_by(AnalysisResult.analyzed_at.desc()).limit(10).all()
    for ar in results:
        device = TestDevice.query.get(ar.device_id)
        label = device.label if device else ar.device_id[:8]
        pdf.multi_cell(0, 5,
            f"Device: {label} | Online: {ar.online_probability*100:.1f}% | "
            f"Screen Active: {ar.screen_active_prob*100:.1f}% | "
            f"Linked Devices: {ar.linked_device_count} | "
            f"Avg RTT: {ar.avg_rtt_ms:.1f}ms | {ar.analyzed_at.strftime('%Y-%m-%d %H:%M')}"
        )
    pdf.ln(5)
    pdf.set_font("Helvetica", "I", 8)
    pdf.cell(0, 5, "For academic research purposes only. All tests conducted with consent.", ln=True)

    pdf_bytes = pdf.output()
    response = make_response(bytes(pdf_bytes))
    response.headers["Content-Disposition"] = "attachment; filename=sdra_report.pdf"
    response.headers["Content-Type"] = "application/pdf"
    return response


@admin_bp.route("/stats", methods=["GET"])
@admin_required
def admin_stats():
    return jsonify({
        "total_users": User.query.count(),
        "total_devices": TestDevice.query.count(),
        "total_probes": Probe.query.count(),
        "total_receipts": Receipt.query.count(),
        "total_analyses": AnalysisResult.query.count(),
    })
