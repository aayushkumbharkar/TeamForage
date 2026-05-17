from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from app.models import User, ProjectMember


def require_admin(f):
    """Decorator: requires the current user to have global Admin role."""
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        if user.role != "Admin":
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated


def require_project_role(required_role="Admin"):
    """Decorator factory: requires user to have a specific role in the project.
    Expects 'project_id' in kwargs or request JSON.
    """
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            from flask import request
            user_id = get_jwt_identity()
            
            # Try to get project_id from URL params first, then from request body
            project_id = kwargs.get("project_id")
            if not project_id:
                data = request.get_json(silent=True) or {}
                project_id = data.get("project_id")
            
            if not project_id:
                return jsonify({"error": "Project ID is required"}), 400

            membership = ProjectMember.query.filter_by(
                user_id=user_id, project_id=project_id
            ).first()

            if not membership:
                return jsonify({"error": "You are not a member of this project"}), 403

            if required_role == "Admin" and membership.role != "Admin":
                return jsonify({"error": "Project Admin access required"}), 403

            return f(*args, **kwargs)
        return decorated
    return decorator


def require_project_member(f):
    """Decorator: requires user to be any member of the project."""
    @wraps(f)
    def decorated(*args, **kwargs):
        from flask import request
        user_id = get_jwt_identity()
        
        project_id = kwargs.get("project_id")
        if not project_id:
            data = request.get_json(silent=True) or {}
            project_id = data.get("project_id")

        if not project_id:
            return jsonify({"error": "Project ID is required"}), 400

        membership = ProjectMember.query.filter_by(
            user_id=user_id, project_id=project_id
        ).first()

        if not membership:
            return jsonify({"error": "You are not a member of this project"}), 403

        return f(*args, **kwargs)
    return decorated


def get_current_user():
    """Helper to get the current authenticated user object."""
    user_id = get_jwt_identity()
    return User.query.get(user_id)
