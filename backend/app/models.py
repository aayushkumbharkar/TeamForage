import uuid
from datetime import datetime, date
from app import db


def generate_uuid():
    return str(uuid.uuid4())


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="Member")  # Admin / Member
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    created_projects = db.relationship("Project", backref="creator", lazy="dynamic")
    assigned_tasks = db.relationship("Task", backref="assignee", lazy="dynamic", foreign_keys="Task.assigned_to")
    memberships = db.relationship("ProjectMember", backref="user", lazy="dynamic")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_by = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    members = db.relationship("ProjectMember", backref="project", lazy="dynamic", cascade="all, delete-orphan")
    tasks = db.relationship("Task", backref="project", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self, include_members=False, include_stats=False):
        data = {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "created_by": self.created_by,
            "creator_name": self.creator.name if self.creator else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_members:
            data["members"] = [m.to_dict() for m in self.members.all()]
        if include_stats:
            tasks = self.tasks.all()
            data["task_stats"] = {
                "total": len(tasks),
                "todo": sum(1 for t in tasks if t.status == "Todo"),
                "in_progress": sum(1 for t in tasks if t.status == "In Progress"),
                "done": sum(1 for t in tasks if t.status == "Done"),
            }
        return data


class ProjectMember(db.Model):
    __tablename__ = "project_members"

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    project_id = db.Column(db.String(36), db.ForeignKey("projects.id"), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="Member")  # Admin / Member
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("user_id", "project_id", name="uq_user_project"),)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "project_id": self.project_id,
            "role": self.role,
            "user_name": self.user.name if self.user else None,
            "user_email": self.user.email if self.user else None,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
        }


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, nullable=True)
    assigned_to = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=True)
    project_id = db.Column(db.String(36), db.ForeignKey("projects.id"), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="Todo")  # Todo / In Progress / Done
    priority = db.Column(db.String(20), nullable=False, default="Medium")  # Low / Medium / High / Critical
    due_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def overdue_risk(self):
        """Calculate overdue risk score (0.0 - 1.0)."""
        from app.utils.smart_features import calculate_overdue_risk
        return calculate_overdue_risk(self)

    @property
    def is_overdue(self):
        if self.status == "Done" or not self.due_date:
            return False
        return self.due_date < date.today()

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "assigned_to": self.assigned_to,
            "assignee_name": self.assignee.name if self.assignee else None,
            "project_id": self.project_id,
            "project_name": self.project.name if self.project else None,
            "status": self.status,
            "priority": self.priority,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "overdue_risk": round(self.overdue_risk, 2),
            "is_overdue": self.is_overdue,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
