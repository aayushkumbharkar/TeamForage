import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill in all fields')
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed')
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
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: 24, color: '#fff', marginBottom: 16,
          }}>T</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>Welcome back</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>
            Sign in to your TeamForge workspace
          </p>
        </div>

        {/* Form */}
        <div className="glass-card" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 20 }}>
              <label className="input-label" htmlFor="login-email">Email</label>
              <input id="login-email" className="input-field" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label className="input-label" htmlFor="login-password">Password</label>
              <input id="login-password" className="input-field" type="password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '14px 24px', fontSize: 15 }}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
