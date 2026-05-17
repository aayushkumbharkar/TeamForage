import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('Member')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name || !email || !password) return toast.error('Please fill in all fields')
    if (password.length < 8) return toast.error('Password must be at least 8 characters')
    setLoading(true)
    try {
      await signup(name, email, password, role)
      toast.success('Account created! Welcome to TeamForge')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="gradient-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ width: '100%', maxWidth: 440 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 24, color: '#fff', marginBottom: 16,
          }}>T</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>Create your account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>
            Start managing your team's projects
          </p>
        </div>

        <div className="glass-card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label className="input-label" htmlFor="signup-name">Full Name</label>
              <input id="signup-name" className="input-field" type="text" placeholder="John Doe"
                value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="input-label" htmlFor="signup-email">Email</label>
              <input id="signup-email" className="input-field" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="input-label" htmlFor="signup-password">Password</label>
              <input id="signup-password" className="input-field" type="password" placeholder="Min. 8 characters"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label className="input-label" htmlFor="signup-role">Role</label>
              <select id="signup-role" className="input-field" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '14px 24px', fontSize: 15 }}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
