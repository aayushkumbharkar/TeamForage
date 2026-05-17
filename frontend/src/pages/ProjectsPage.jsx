import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../api'
import toast from 'react-hot-toast'
import { HiOutlinePlus, HiOutlineFolder, HiOutlineUsers } from 'react-icons/hi'

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  const fetchProjects = () => {
    api.get('/projects').then(res => setProjects(res.data.projects))
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProjects() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formName.trim()) return toast.error('Project name is required')
    setCreating(true)
    try {
      await api.post('/projects', { name: formName, description: formDesc })
      toast.success('Project created!')
      setShowModal(false)
      setFormName('')
      setFormDesc('')
      fetchProjects()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>Projects</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <HiOutlinePlus size={18} /> New Project
        </button>
      </motion.div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {[1,2,3].map(i => <div key={i} className="shimmer-loading" style={{ height: 200, borderRadius: 16 }} />)}
        </div>
      ) : projects.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card"
          style={{ padding: 60, textAlign: 'center' }}>
          <HiOutlineFolder size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No projects yet</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            Create your first project to get started
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <HiOutlinePlus size={18} /> Create Project
          </button>
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {projects.map((project, i) => (
            <motion.div key={project.id} className="glass-card"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => navigate(`/projects/${project.id}`)}
              style={{ padding: 24, cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: `linear-gradient(135deg, ${['#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981'][i % 5]}, ${['#818cf8','#a78bfa','#f472b6','#fbbf24','#34d399'][i % 5]})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 18, color: '#fff',
                }}>
                  {project.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 12 }}>
                  <HiOutlineUsers size={14} />
                  {project.members?.length || 0}
                </div>
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{project.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, minHeight: 18 }}>
                {project.description || 'No description'}
              </div>
              {project.task_stats && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="badge badge-todo">{project.task_stats.todo} Todo</div>
                  <div className="badge badge-progress">{project.task_stats.in_progress} Active</div>
                  <div className="badge badge-done">{project.task_stats.done} Done</div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <motion.div className="modal-content" initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>Create Project</h2>
            <form onSubmit={handleCreate}>
              <div style={{ marginBottom: 20 }}>
                <label className="input-label">Project Name</label>
                <input className="input-field" placeholder="e.g. Mobile App Redesign"
                  value={formName} onChange={e => setFormName(e.target.value)} autoFocus />
              </div>
              <div style={{ marginBottom: 28 }}>
                <label className="input-label">Description (optional)</label>
                <textarea className="input-field" rows={3} placeholder="Brief description..."
                  value={formDesc} onChange={e => setFormDesc(e.target.value)}
                  style={{ resize: 'vertical', fontFamily: 'Inter, sans-serif' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
