from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Task, ProjectMember
from app.utils.smart_features import get_smart_insights

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/stats", methods=["GET"])
@jwt_required()
def get_stats():
    """Get aggregated dashboard stats for the current user."""
    user_id = get_jwt_identity()

    # Get all projects the user is in
    memberships = ProjectMember.query.filter_by(user_id=user_id).all()
    project_ids = [m.project_id for m in memberships]

    # All tasks across user's projects
    all_tasks = Task.query.filter(Task.project_id.in_(project_ids)).all()
    my_tasks = [t for t in all_tasks if t.assigned_to == user_id]

    total = len(all_tasks)
    completed = sum(1 for t in all_tasks if t.status == "Done")
    overdue = sum(1 for t in all_tasks if t.is_overdue)
    my_total = len(my_tasks)
    my_completed = sum(1 for t in my_tasks if t.status == "Done")
    my_overdue = sum(1 for t in my_tasks if t.is_overdue)

    return jsonify({
        "stats": {
            "total_tasks": total,
            "completed_tasks": completed,
            "overdue_tasks": overdue,
            "in_progress_tasks": sum(1 for t in all_tasks if t.status == "In Progress"),
            "my_tasks": my_total,
            "my_completed": my_completed,
            "my_overdue": my_overdue,
            "total_projects": len(project_ids),
            "completion_rate": round((completed / total) * 100, 1) if total > 0 else 0,
        }
    }), 200


@dashboard_bp.route("/insights", methods=["GET"])
@jwt_required()
def get_insights():
    """Get smart insights and risk analysis."""
    user_id = get_jwt_identity()

    memberships = ProjectMember.query.filter_by(user_id=user_id).all()
    project_ids = [m.project_id for m in memberships]
    all_tasks = Task.query.filter(Task.project_id.in_(project_ids)).all()

    insights = get_smart_insights(all_tasks)
    return jsonify({"insights": insights}), 200
