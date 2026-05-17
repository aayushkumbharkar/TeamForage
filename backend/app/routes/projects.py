from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Project, ProjectMember, User
from app.utils.permissions import require_project_role, get_current_user

projects_bp = Blueprint("projects", __name__)


@projects_bp.route("", methods=["POST"])
@jwt_required()
def create_project():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400
    name = data.get("name", "").strip()
    description = data.get("description", "").strip()
    if not name:
        return jsonify({"error": "Project name is required"}), 400

    user_id = get_jwt_identity()
    project = Project(name=name, description=description, created_by=user_id)
    db.session.add(project)
    db.session.flush()
    membership = ProjectMember(user_id=user_id, project_id=project.id, role="Admin")
    db.session.add(membership)
    db.session.commit()
    return jsonify({"message": "Project created", "project": project.to_dict(include_members=True, include_stats=True)}), 201


@projects_bp.route("", methods=["GET"])
@jwt_required()
def list_projects():
    user_id = get_jwt_identity()
    memberships = ProjectMember.query.filter_by(user_id=user_id).all()
    project_ids = [m.project_id for m in memberships]
    projects = Project.query.filter(Project.id.in_(project_ids)).all()
    return jsonify({"projects": [p.to_dict(include_members=True, include_stats=True) for p in projects]}), 200


@projects_bp.route("/<project_id>", methods=["GET"])
@jwt_required()
def get_project(project_id):
    user_id = get_jwt_identity()
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404
    membership = ProjectMember.query.filter_by(user_id=user_id, project_id=project_id).first()
    if not membership:
        return jsonify({"error": "You are not a member of this project"}), 403
    return jsonify({"project": project.to_dict(include_members=True, include_stats=True)}), 200


@projects_bp.route("/<project_id>", methods=["PUT"])
@jwt_required()
@require_project_role("Admin")
def update_project(project_id):
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404
    data = request.get_json()
    if data.get("name"):
        project.name = data["name"].strip()
    if "description" in data:
        project.description = data.get("description", "").strip()
    db.session.commit()
    return jsonify({"message": "Project updated", "project": project.to_dict(include_members=True, include_stats=True)}), 200


@projects_bp.route("/<project_id>", methods=["DELETE"])
@jwt_required()
@require_project_role("Admin")
def delete_project(project_id):
    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404
    db.session.delete(project)
    db.session.commit()
    return jsonify({"message": "Project deleted"}), 200


@projects_bp.route("/<project_id>/members", methods=["GET"])
@jwt_required()
def list_members(project_id):
    user_id = get_jwt_identity()
    membership = ProjectMember.query.filter_by(user_id=user_id, project_id=project_id).first()
    if not membership:
        return jsonify({"error": "You are not a member of this project"}), 403
    members = ProjectMember.query.filter_by(project_id=project_id).all()
    return jsonify({"members": [m.to_dict() for m in members]}), 200


@projects_bp.route("/<project_id>/members", methods=["POST"])
@jwt_required()
@require_project_role("Admin")
def add_member(project_id):
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400
    user_email = data.get("email", "").strip().lower()
    member_role = data.get("role", "Member")
    if not user_email:
        return jsonify({"error": "Member email is required"}), 400
    if member_role not in ("Admin", "Member"):
        return jsonify({"error": "Role must be Admin or Member"}), 400

    project = Project.query.get(project_id)
    if not project:
        return jsonify({"error": "Project not found"}), 404
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({"error": f"No user found with email {user_email}"}), 404
    existing = ProjectMember.query.filter_by(user_id=user.id, project_id=project_id).first()
    if existing:
        return jsonify({"error": "User is already a member of this project"}), 409

    membership = ProjectMember(user_id=user.id, project_id=project_id, role=member_role)
    db.session.add(membership)
    db.session.commit()
    return jsonify({"message": f"{user.name} added as {member_role}", "member": membership.to_dict()}), 201


@projects_bp.route("/<project_id>/members/<user_id>", methods=["DELETE"])
@jwt_required()
@require_project_role("Admin")
def remove_member(project_id, user_id):
    membership = ProjectMember.query.filter_by(user_id=user_id, project_id=project_id).first()
    if not membership:
        return jsonify({"error": "User is not a member of this project"}), 404
    if membership.role == "Admin":
        admin_count = ProjectMember.query.filter_by(project_id=project_id, role="Admin").count()
        if admin_count <= 1:
            return jsonify({"error": "Cannot remove the last admin"}), 400
    db.session.delete(membership)
    db.session.commit()
    return jsonify({"message": "Member removed"}), 200
