from flask import Blueprint, request, jsonify, g
from message import send_email
from models import User  # adjust import to where your User model lives\

support_bp = Blueprint("support", __name__)

@support_bp.route("/api/support", methods=["POST"])
def support_request():
    """Handle support requests from the frontend"""
    try:
        data = request.get_json()
        issue_type = data.get("issueType")
        details = data.get("details")
        user_id = data.get("user_id")  # or pull from JWT/auth context

        if not issue_type or not details:
            return jsonify({"success": False, "error": "Missing required fields"}), 400

        # Get user (adjust depending on your auth system)
        user = User.query.filter_by(id=user_id).first() if user_id else None
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        subject = f"Invoice Support Request: {issue_type}"
        body = f"""
        <p><strong>From:</strong> {user.first_name} {user.last_name} ({user.email})</p>
        <p><strong>Issue Type:</strong> {issue_type}</p>
        <p><strong>Details:</strong><br>{details}</p>
        <hr>
        <small>This message was sent from the Envoyce support form.</small>
        """

        send_email("support@envoyce.xyz", subject, body)

        return jsonify({"success": True, "message": "Support request sent successfully"}), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
