from datetime import date


# Keywords that suggest higher priority
URGENT_KEYWORDS = {"urgent", "critical", "blocker", "asap", "emergency", "hotfix", "p0", "showstopper"}
HIGH_KEYWORDS = {"important", "high", "priority", "deadline", "p1", "breaking"}


def calculate_overdue_risk(task):
    """Calculate overdue risk score (0.0 - 1.0) for a task.
    
    Factors:
    - Days remaining until due date
    - Current task status
    - Whether task is assigned
    """
    if task.status == "Done":
        return 0.0

    if not task.due_date:
        return 0.3  # No deadline = moderate baseline risk

    days_remaining = (task.due_date - date.today()).days

    if days_remaining < 0:
        return 1.0  # Already overdue
    if days_remaining == 0:
        return 0.95  # Due today
    if days_remaining <= 1:
        return 0.85  # Due tomorrow
    if days_remaining <= 3:
        return 0.7   # Due within 3 days
    if days_remaining <= 7:
        return 0.4   # Due within a week

    # Base risk decreases linearly over 14 days
    base_risk = max(0.0, 1.0 - (days_remaining / 14.0))

    # Status multiplier: "Todo" tasks with close deadlines are riskier
    status_multipliers = {
        "Todo": 1.3,
        "In Progress": 0.9,
    }
    multiplier = status_multipliers.get(task.status, 1.0)

    # Unassigned tasks are riskier
    if not task.assigned_to:
        multiplier *= 1.2

    return min(1.0, round(base_risk * multiplier, 2))


def suggest_priority(title, description="", due_date=None):
    """Suggest task priority based on keywords and due date urgency.
    
    Returns: 'Low', 'Medium', 'High', or 'Critical'
    """
    text = f"{title} {description or ''}".lower()
    
    # Check for urgent keywords
    words = set(text.split())
    if words & URGENT_KEYWORDS:
        return "Critical"
    if words & HIGH_KEYWORDS:
        return "High"

    # Check due date urgency
    if due_date:
        if isinstance(due_date, str):
            try:
                due_date = date.fromisoformat(due_date)
            except ValueError:
                return "Medium"
        
        days_until = (due_date - date.today()).days
        if days_until <= 1:
            return "Critical"
        if days_until <= 3:
            return "High"
        if days_until <= 7:
            return "Medium"
    
    return "Medium"


def get_smart_insights(tasks):
    """Generate dashboard insights from a list of tasks.
    
    Returns a dict with various insight metrics.
    """
    total = len(tasks)
    if total == 0:
        return {
            "total_tasks": 0,
            "completed": 0,
            "overdue": 0,
            "high_risk_tasks": [],
            "priority_distribution": {"Low": 0, "Medium": 0, "High": 0, "Critical": 0},
            "status_distribution": {"Todo": 0, "In Progress": 0, "Done": 0},
            "completion_rate": 0,
            "alerts": [],
        }

    completed = sum(1 for t in tasks if t.status == "Done")
    overdue = sum(1 for t in tasks if t.is_overdue)
    
    # High risk = overdue_risk > 0.7 and not done
    high_risk = [
        {"id": t.id, "title": t.title, "risk": round(t.overdue_risk, 2), "due_date": t.due_date.isoformat() if t.due_date else None}
        for t in tasks
        if t.overdue_risk > 0.7 and t.status != "Done"
    ]
    high_risk.sort(key=lambda x: x["risk"], reverse=True)

    # Priority distribution
    priority_dist = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    for t in tasks:
        if t.priority in priority_dist:
            priority_dist[t.priority] += 1

    # Status distribution
    status_dist = {"Todo": 0, "In Progress": 0, "Done": 0}
    for t in tasks:
        if t.status in status_dist:
            status_dist[t.status] += 1

    completion_rate = round((completed / total) * 100, 1) if total > 0 else 0

    # Generate alerts
    alerts = []
    if overdue > 0:
        alerts.append(f"⚠️ {overdue} task{'s' if overdue > 1 else ''} overdue")
    if len(high_risk) > 0:
        alerts.append(f"🔴 {len(high_risk)} task{'s' if len(high_risk) > 1 else ''} at high overdue risk")
    if completion_rate > 80:
        alerts.append(f"🎉 Great progress! {completion_rate}% completion rate")
    elif completion_rate < 30 and total >= 5:
        alerts.append(f"📊 Only {completion_rate}% completed — team may need support")

    return {
        "total_tasks": total,
        "completed": completed,
        "overdue": overdue,
        "high_risk_tasks": high_risk[:5],  # Top 5
        "priority_distribution": priority_dist,
        "status_distribution": status_dist,
        "completion_rate": completion_rate,
        "alerts": alerts,
    }
