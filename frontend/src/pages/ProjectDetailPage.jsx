import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import {
  HiOutlinePlus, HiOutlineTrash, HiOutlineArrowLeft,
  HiOutlineUserAdd, HiOutlineClock, HiOutlineExclamation,
} from 'react-icons/hi'

const STATUS_ORDER = ['Todo', 'In Progress', 'Done']
const STATUS_COLORS = { Todo: '#6366f1', 'In Progress': '#f59e0b', Done: '#10b981' }
const PRIORITY_BADGE = { Low: 'badge-low', Medium: 'badge-medium', High: 'badge-high', Critical: 'badge-critical' }

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  // Task modal
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigned_to: '', priority: '', due_date: '' })
  const [saving, setSaving] = useState(false)

  // Member modal
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [memberRole, setMemberRole] = useState('Member')

  const isProjectAdmin = members.find(m => m.user_id === user?.id)?.role === 'Admin'

  const fetchAll = async () => {
    try {
      const [projRes, taskRes, memRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/tasks?project_id=${projectId}`),
        api.get(`/projects/${projectId}/members`),
      ])
      setProject(projRes.data.project)
      setTasks(taskRes.data.tasks)
      setMembers(memRes.data.members)
    } catch {
      toast.error('Failed to load project')
      navigate('/projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [projectId])

  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!taskForm.title.trim()) return toast.error('Task title is required')
    setSaving(true)
    try {
      const payload = {
        title: taskForm.title,
        description: taskForm.description,
        project_id: projectId,
        assigned_to: taskForm.assigned_to || null,
        priority: taskForm.priority || null,
        due_date: taskForm.due_date || null,
      }
      await api.post('/tasks', payload)
      toast.success('Task created!')
      setShowTaskModal(false)
      setTaskForm({ title: '', description: '', assigned_to: '', priority: '', due_date: '' })
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create task')
    } finally {
      setSaving(false)
    }
  }

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await api.put(`/tasks/${taskId}/status`, { status: newStatus })
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
      toast.success(`Moved to ${newStatus}`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status')
    }
  }

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return
    try {
      await api.delete(`/tasks/${taskId}`)
      setTasks(prev => prev.filter(t => t.id !== taskId))
      toast.success('Task deleted')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete task')
    }
  }

  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!memberEmail.trim()) return toast.error('Email is required')
    try {
      await api.post(`/projects/${projectId}/members`, { email: memberEmail, role: memberRole })
      toast.success('Member added!')
      setShowMemberModal(false)
      setMemberEmail('')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add member')
    }
  }

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member?')) return
    try {
      await api.delete(`/projects/${projectId}/members/${userId}`)
      toast.success('Member removed')
      fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Cannot remove member')
    }
  }

  if (loading) {
    return (
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div className="shimmer-loading" style={{ width: 200, height: 32, borderRadius: 8, marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {[1,2,3].map(i => <div key={i} className="shimmer-loading" style={{ height: 400, borderRadius: 16 }} />)}
        </div>
      </div>
    )
  }

  const getRiskColor = (risk) => {
    if (risk >= 0.8) return '#ef4444'
    if (risk >= 0.5) return '#f59e0b'
    if (risk >= 0.3) return '#3b82f6'
    return '#10b981'
  }

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate('/projects')} className="btn-secondary"
            style={{ padding: '8px 12px' }}>
            <HiOutlineArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.3px' }}>{project?.name}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
              {project?.description || 'No description'} · {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {isProjectAdmin && (
            <>
              <button className="btn-secondary" onClick={() => setShowMemberModal(true)}>
                <HiOutlineUserAdd size={16} /> Add Member
              </button>
              <button className="btn-primary" onClick={() => setShowTaskModal(true)}>
                <HiOutlinePlus size={16} /> Add Task
              </button>
            </>
          )}
        </div>
      </motion.div>

      {/* Members Row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {members.map(m => (
          <div key={m.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 14px 6px 6px',
            background: 'rgba(99, 102, 241, 0.06)', borderRadius: 30,
            border: '1px solid var(--border)', fontSize: 13,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: 11, color: '#fff',
            }}>
              {m.user_name?.charAt(0)?.toUpperCase()}
            </div>
            <span>{m.user_name}</span>
            <span className={`badge ${m.role === 'Admin' ? 'badge-admin' : 'badge-member'}`}
              style={{ fontSize: 10, padding: '1px 6px' }}>{m.role}</span>
            {isProjectAdmin && m.user_id !== user?.id && (
              <button onClick={() => handleRemoveMember(m.user_id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0, lineHeight: 1 }}>
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {STATUS_ORDER.map(status => {
          const columnTasks = tasks.filter(t => t.status === status)
          return (
            <div key={status} className="task-column">
              <div className="task-column-header">
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[status] }} />
                {status}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                  {columnTasks.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {columnTasks.map(task => (
                  <motion.div key={task.id} className="glass-card"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ padding: 16, cursor: 'default' }}
                    whileHover={{ scale: 1.01 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{task.title}</div>
                      {isProjectAdmin && (
                        <button onClick={() => handleDeleteTask(task.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
                          <HiOutlineTrash size={14} />
                        </button>
                      )}
                    </div>

                    {task.description && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                        {task.description.length > 80 ? task.description.slice(0, 80) + '...' : task.description}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                      <span className={`badge ${PRIORITY_BADGE[task.priority]}`}>{task.priority}</span>
                      {task.due_date && (
                        <span className="badge" style={{
                          background: task.is_overdue ? 'rgba(239,68,68,0.15)' : 'rgba(100,116,139,0.15)',
                          color: task.is_overdue ? '#fca5a5' : '#94a3b8',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          {task.is_overdue && <HiOutlineExclamation size={12} />}
                          <HiOutlineClock size={12} /> {task.due_date}
                        </span>
                      )}
                    </div>

                    {/* Overdue Risk Bar */}
                    {task.overdue_risk > 0 && task.status !== 'Done' && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                          <span>Risk</span>
                          <span>{Math.round(task.overdue_risk * 100)}%</span>
                        </div>
                        <div className="risk-bar">
                          <div className="risk-bar-fill" style={{
                            width: `${task.overdue_risk * 100}%`,
                            background: getRiskColor(task.overdue_risk),
                          }} />
                        </div>
                      </div>
                    )}

                    {/* Assignee + Status Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                      {task.assignee_name ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                          <div style={{
                            width: 20, height: 20, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 600, fontSize: 9, color: '#fff',
                          }}>{task.assignee_name.charAt(0).toUpperCase()}</div>
                          {task.assignee_name}
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Unassigned</span>
                      )}

                      {/* Move buttons */}
                      <div style={{ display: 'flex', gap: 4 }}>
                        {STATUS_ORDER.filter(s => s !== task.status).map(s => (
                          <button key={s} onClick={() => handleStatusChange(task.id, s)}
                            style={{
                              background: `${STATUS_COLORS[s]}20`, border: 'none', cursor: 'pointer',
                              padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                              color: STATUS_COLORS[s],
                            }}>
                            {s === 'Todo' ? '← Todo' : s === 'In Progress' ? '⟳ WIP' : '✓ Done'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {columnTasks.length === 0 && (
                  <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontSize: 13 }}>
                    No tasks
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <motion.div className="modal-content" initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Create Task</h2>
            <form onSubmit={handleCreateTask}>
              <div style={{ marginBottom: 20 }}>
                <label className="input-label">Title</label>
                <input className="input-field" placeholder="Task title"
                  value={taskForm.title} onChange={e => setTaskForm(p => ({...p, title: e.target.value}))} autoFocus />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="input-label">Description</label>
                <textarea className="input-field" rows={3} placeholder="Details..."
                  value={taskForm.description} onChange={e => setTaskForm(p => ({...p, description: e.target.value}))}
                  style={{ resize: 'vertical', fontFamily: 'Inter, sans-serif' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label className="input-label">Assign To</label>
                  <select className="input-field" value={taskForm.assigned_to}
                    onChange={e => setTaskForm(p => ({...p, assigned_to: e.target.value}))}>
                    <option value="">Unassigned</option>
                    {members.map(m => (
                      <option key={m.user_id} value={m.user_id}>{m.user_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="input-label">Priority</label>
                  <select className="input-field" value={taskForm.priority}
                    onChange={e => setTaskForm(p => ({...p, priority: e.target.value}))}>
                    <option value="">Auto-detect</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 28 }}>
                <label className="input-label">Due Date</label>
                <input className="input-field" type="date" value={taskForm.due_date}
                  onChange={e => setTaskForm(p => ({...p, due_date: e.target.value}))} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <motion.div className="modal-content" initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Add Team Member</h2>
            <form onSubmit={handleAddMember}>
              <div style={{ marginBottom: 20 }}>
                <label className="input-label">Email Address</label>
                <input className="input-field" type="email" placeholder="member@example.com"
                  value={memberEmail} onChange={e => setMemberEmail(e.target.value)} autoFocus />
              </div>
              <div style={{ marginBottom: 28 }}>
                <label className="input-label">Role</label>
                <select className="input-field" value={memberRole} onChange={e => setMemberRole(e.target.value)}>
                  <option value="Member">Member</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Add Member</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
