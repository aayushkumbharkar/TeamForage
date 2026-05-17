# TeamForge 🔨

A modern, full-stack team project management platform — a simplified Trello/Asana alternative with smart AI-powered insights.

![Dark Mode Dashboard](https://img.shields.io/badge/UI-Dark%20Mode-1a1f35?style=for-the-badge)
![Flask](https://img.shields.io/badge/Backend-Flask-000000?style=for-the-badge&logo=flask)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react)
![PostgreSQL](https://img.shields.io/badge/DB-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql)

## ✨ Features

### 🔐 Authentication & Security
- JWT-based authentication (access + refresh tokens)
- Bcrypt password hashing
- Protected API routes with role validation

### 👥 Role-Based Access Control
| Role | Permissions |
|------|------------|
| **Admin** | Create projects, add/remove members, assign tasks, manage everything |
| **Member** | View projects, update assigned tasks, view dashboard |

### 📋 Project Management
- Create and manage multiple projects
- Add team members by email
- Project-level roles (Admin / Member)
- Task statistics per project

### ✅ Task Lifecycle
- **Kanban Board** with 3 columns: Todo → In Progress → Done
- One-click status transitions
- Priority levels: Low, Medium, High, Critical
- Due dates with overdue tracking
- Task assignment to team members

### 📊 Smart Dashboard
- **Animated stat cards** — Total tasks, Completed, Overdue, My Tasks
- **Status distribution** — Pie chart (Recharts)
- **Priority breakdown** — Bar chart
- **Smart alerts** — Overdue warnings, high-risk task notifications
- **Completion rate** — Progress tracking

### 🧠 AI-Powered Smart Features
- **Overdue Risk Score (0.0–1.0)** — Computed per-task based on deadline proximity, status, and assignment
- **Priority Prediction** — Auto-suggests priority from keywords ("urgent", "critical", "blocker") and due date urgency
- **Dashboard Insights** — Automated alerts and risk analysis

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, Flask, Flask-JWT-Extended, Flask-Bcrypt |
| ORM | SQLAlchemy + Flask-Migrate (Alembic) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Charts | Recharts |
| Animations | Framer Motion |
| Notifications | React Hot Toast |
| Deployment | Render (backend + DB) / Vercel (frontend) |

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate        # Windows
# source venv/bin/activate     # macOS/Linux
pip install -r requirements.txt
python wsgi.py
```
Backend runs on `http://127.0.0.1:5000`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173` (auto-proxies API calls to Flask)

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register new user |
| POST | `/auth/login` | Login → JWT tokens |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/projects` | Create project |
| GET | `/projects` | List user's projects |
| GET | `/projects/:id` | Project details |
| PUT | `/projects/:id` | Update (Admin) |
| DELETE | `/projects/:id` | Delete (Admin) |
| POST | `/projects/:id/members` | Add member |
| DELETE | `/projects/:id/members/:uid` | Remove member |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tasks` | Create task |
| GET | `/tasks` | List/filter tasks |
| PUT | `/tasks/:id` | Update task |
| PUT | `/tasks/:id/status` | Change status |
| DELETE | `/tasks/:id` | Delete (Admin) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard/stats` | Aggregated metrics |
| GET | `/dashboard/insights` | AI-powered insights |

## 🗂️ Project Structure
```
teamforge/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── routes/
│   │   │   ├── auth.py          # Auth endpoints
│   │   │   ├── projects.py      # Project CRUD
│   │   │   ├── tasks.py         # Task CRUD
│   │   │   └── dashboard.py     # Stats & insights
│   │   └── utils/
│   │       ├── permissions.py   # RBAC decorators
│   │       └── smart_features.py # AI features
│   ├── config.py
│   ├── wsgi.py
│   ├── requirements.txt
│   ├── Procfile
│   └── render.yaml
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api.js               # Axios + JWT interceptor
│   │   ├── context/AuthContext.jsx
│   │   ├── components/Layout.jsx
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── SignupPage.jsx
│   │       ├── DashboardPage.jsx
│   │       ├── ProjectsPage.jsx
│   │       └── ProjectDetailPage.jsx
│   ├── index.html
│   └── vite.config.js
└── .gitignore
```

## 🌐 Deployment

### Render (Backend + PostgreSQL)
1. Push repo to GitHub
2. Create **Web Service** on Render → connect repo
3. Add **PostgreSQL** database
4. Set environment variables:
   - `JWT_SECRET_KEY` — strong random secret
   - `FLASK_ENV` — `production`
   - `DATABASE_URL` — auto-linked from PostgreSQL
5. Build: `pip install -r requirements.txt`
6. Start: `gunicorn "app:create_app()" --bind 0.0.0.0:$PORT`

### Vercel (Frontend)
1. Import frontend directory on Vercel
2. Set `VITE_API_URL` → Render backend URL
3. Build: `npm run build` → Output: `dist/`

## 📝 License

MIT
