from datetime import date
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Task, ProjectMember
from app.utils.smart_features import suggest_priority

tasks_bp = Blueprint("tasks", __name__)


@tasks_bp.route("", methods=["POST"])
@jwt_required()
def create_task():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    title = data.get("title", "").strip()
    project_id = data.get("project_id")
    if not title:
        return jsonify({"error": "Task title is required"}), 400
    if not project_id:
        return jsonify({"error": "Project ID is required"}), 400

    user_id = get_jwt_identity()
    membership = ProjectMember.query.filter_by(user_id=user_id, project_id=project_id).first()
    if not membership:
        return jsonify({"error": "You are not a member of this project"}), 403
    if membership.role != "Admin":
        return jsonify({"error": "Only project admins can create tasks"}), 403

    description = data.get("description", "").strip()
    assigned_to = data.get("assigned_to")
    status = data.get("status", "Todo")
    due_date_str = data.get("due_date")
    priority = data.get("priority")

    if status not in ("Todo", "In Progress", "Done"):
        return jsonify({"error": "Status must be Todo, In Progress, or Done"}), 400

    # Parse due date
    due_date = None
    if due_date_str:
        try:
            due_date = date.fromisoformat(due_date_str)
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    # Validate assignee is a project member
    if assigned_to:
        assignee_membership = ProjectMember.query.filter_by(user_id=assigned_to, project_id=project_id).first()
        if not assignee_membership:
            return jsonify({"error": "Assignee must be a project member"}), 400

    # Smart priority suggestion if not provided
    if not priority:
        priority = suggest_priority(title, description, due_date)
    elif priority not in ("Low", "Medium", "High", "Critical"):
        return jsonify({"error": "Priority must be Low, Medium, High, or Critical"}), 400

    task = Task(
        title=title, description=description, assigned_to=assigned_to,
        project_id=project_id, status=status, priority=priority, due_date=due_date,
    )
    db.session.add(task)
    db.session.commit()

    return jsonify({"message": "Task created", "task": task.to_dict()}), 201


@tasks_bp.route("", methods=["GET"])
@jwt_required()
def list_tasks():
    user_id = get_jwt_identity()
    project_id = request.args.get("project_id")
    assigned_to = request.args.get("assigned_to")
    status = request.args.get("status")

    query = Task.query

    if project_id:
        membership = ProjectMember.query.filter_by(user_id=user_id, project_id=project_id).first()
        if not membership:
            return jsonify({"error": "You are not a member of this project"}), 403
        query = query.filter_by(project_id=project_id)
    else:
        # Only show tasks from user's projects
        memberships = ProjectMember.query.filter_by(user_id=user_id).all()
        project_ids = [m.project_id for m in memberships]
        query = query.filter(Task.project_id.in_(project_ids))

    if assigned_to == "me":
        query = query.filter_by(assigned_to=user_id)
    elif assigned_to:
        query = query.filter_by(assigned_to=assigned_to)

    if status:
        query = query.filter_by(status=status)

    tasks = query.order_by(Task.created_at.desc()).all()
    return jsonify({"tasks": [t.to_dict() for t in tasks]}), 200


@tasks_bp.route("/<task_id>", methods=["GET"])
@jwt_required()
def get_task(task_id):
    user_id = get_jwt_identity()
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    membership = ProjectMember.query.filter_by(user_id=user_id, project_id=task.project_id).first()
    if not membership:
        return jsonify({"error": "You are not a member of this project"}), 403

    return jsonify({"task": task.to_dict()}), 200


@tasks_bp.route("/<task_id>", methods=["PUT"])
@jwt_required()
def update_task(task_id):
    user_id = get_jwt_identity()
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    membership = ProjectMember.query.filter_by(user_id=user_id, project_id=task.project_id).first()
    if not membership:
        return jsonify({"error": "You are not a member of this project"}), 403

    # Members can only update their own tasks
    if membership.role != "Admin" and task.assigned_to != user_id:
        return jsonify({"error": "You can only update tasks assigned to you"}), 403

    data = request.get_json()
    if data.get("title"):
        task.title = data["title"].strip()
    if "description" in data:
        task.description = data.get("description", "").strip()
    if data.get("status"):
        if data["status"] not in ("Todo", "In Progress", "Done"):
            return jsonify({"error": "Invalid status"}), 400
        task.status = data["status"]
    if data.get("priority"):
        if data["priority"] not in ("Low", "Medium", "High", "Critical"):
            return jsonify({"error": "Invalid priority"}), 400
        task.priority = data["priority"]
    if "due_date" in data:
        if data["due_date"]:
            try:
                task.due_date = date.fromisoformat(data["due_date"])
            except ValueError:
                return jsonify({"error": "Invalid date format"}), 400
        else:
            task.due_date = None
    if "assigned_to" in data:
        if data["assigned_to"]:
            am = ProjectMember.query.filter_by(user_id=data["assigned_to"], project_id=task.project_id).first()
            if not am:
                return jsonify({"error": "Assignee must be a project member"}), 400
        task.assigned_to = data["assigned_to"]

    db.session.commit()
    return jsonify({"message": "Task updated", "task": task.to_dict()}), 200


@tasks_bp.route("/<task_id>/status", methods=["PUT"])
@jwt_required()
def update_task_status(task_id):
    user_id = get_jwt_identity()
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    membership = ProjectMember.query.filter_by(user_id=user_id, project_id=task.project_id).first()
    if not membership:
        return jsonify({"error": "You are not a member of this project"}), 403
    if membership.role != "Admin" and task.assigned_to != user_id:
        return jsonify({"error": "You can only update tasks assigned to you"}), 403

    data = request.get_json()
    new_status = data.get("status")
    if new_status not in ("Todo", "In Progress", "Done"):
        return jsonify({"error": "Status must be Todo, In Progress, or Done"}), 400

    task.status = new_status
    db.session.commit()
    return jsonify({"message": "Status updated", "task": task.to_dict()}), 200


@tasks_bp.route("/<task_id>", methods=["DELETE"])
@jwt_required()
def delete_task(task_id):
    user_id = get_jwt_identity()
    task = Task.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    membership = ProjectMember.query.filter_by(user_id=user_id, project_id=task.project_id).first()
    if not membership or membership.role != "Admin":
        return jsonify({"error": "Only project admins can delete tasks"}), 403

    db.session.delete(task)
    db.session.commit()
    return jsonify({"message": "Task deleted"}), 200
