import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { HiOutlineClipboardCheck, HiOutlineExclamation, HiOutlineLightningBolt, HiOutlineChartBar } from 'react-icons/hi'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const COLORS = { Todo: '#6366f1', 'In Progress': '#f59e0b', Done: '#10b981' }
const PRIORITY_COLORS = { Low: '#64748b', Medium: '#3b82f6', High: '#f59e0b', Critical: '#ef4444' }

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const end = value
    if (end === 0) { setDisplay(0); return }
    const duration = 800
    const step = Math.max(1, Math.floor(end / (duration / 16)))
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setDisplay(end); clearInterval(timer) }
      else setDisplay(start)
    }, 16)
    return () => clearInterval(timer)
  }, [value])
  return <span>{display}</span>
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/insights'),
    ]).then(([statsRes, insightsRes]) => {
      setStats(statsRes.data.stats)
      setInsights(insightsRes.data.insights)
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ marginBottom: 32 }}>
          <div className="shimmer-loading" style={{ width: 300, height: 32, borderRadius: 8, marginBottom: 8 }} />
          <div className="shimmer-loading" style={{ width: 200, height: 20, borderRadius: 8 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
          {[1,2,3,4].map(i => <div key={i} className="shimmer-loading" style={{ height: 140, borderRadius: 16 }} />)}
        </div>
      </div>
    )
  }

  const statusData = insights ? Object.entries(insights.status_distribution).map(([name, value]) => ({ name, value })) : []
  const priorityData = insights ? Object.entries(insights.priority_distribution).map(([name, value]) => ({ name, value })) : []

  const cardAnim = { hidden: { opacity: 0, y: 20 }, visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }) }

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px' }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
          Here's what's happening across your projects
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 20, marginBottom: 32 }}>
        {[
          { label: 'Total Tasks', value: stats?.total_tasks || 0, icon: HiOutlineClipboardCheck, color: 'accent', iconColor: '#6366f1' },
          { label: 'Completed', value: stats?.completed_tasks || 0, icon: HiOutlineLightningBolt, color: 'success', iconColor: '#10b981' },
          { label: 'Overdue', value: stats?.overdue_tasks || 0, icon: HiOutlineExclamation, color: 'danger', iconColor: '#ef4444' },
          { label: 'My Tasks', value: stats?.my_tasks || 0, icon: HiOutlineChartBar, color: 'info', iconColor: '#3b82f6' },
        ].map((card, i) => (
          <motion.div key={card.label} className={`stat-card ${card.color}`} custom={i} initial="hidden" animate="visible" variants={cardAnim}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 8 }}>{card.label}</div>
                <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-1px', lineHeight: 1 }}>
                  <AnimatedNumber value={card.value} />
                </div>
              </div>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${card.iconColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <card.icon size={22} color={card.iconColor} />
              </div>
            </div>
            {card.label === 'Completed' && stats?.total_tasks > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                  <span>Completion rate</span>
                  <span>{stats.completion_rate}%</span>
                </div>
                <div className="risk-bar">
                  <div className="risk-bar-fill" style={{
                    width: `${stats.completion_rate}%`,
                    background: 'linear-gradient(90deg, #10b981, #34d399)',
                  }} />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Alerts */}
      {insights?.alerts?.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="glass-card" style={{ padding: 20, marginBottom: 32 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>🔔 Alerts</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {insights.alerts.map((alert, i) => (
              <div key={i} style={{
                padding: '10px 16px', background: 'rgba(99, 102, 241, 0.06)',
                borderRadius: 10, fontSize: 13, color: 'var(--text-secondary)',
                borderLeft: '3px solid var(--accent)',
              }}>{alert}</div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20, marginBottom: 32 }}>
        {/* Status Distribution Pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Status Distribution</div>
          {statusData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  dataKey="value" paddingAngle={4} stroke="none">
                  {statusData.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No tasks yet
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 8 }}>
            {statusData.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[d.name] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </motion.div>

        {/* Priority Bar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Priority Breakdown</div>
          {priorityData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={priorityData} barCategoryGap="30%">
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#1a1f35', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, fontSize: 13 }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry) => (
                    <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No tasks yet
            </div>
          )}
        </motion.div>
      </div>

      {/* High Risk Tasks */}
      {insights?.high_risk_tasks?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="glass-card" style={{ padding: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>🔴 High Overdue Risk Tasks</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {insights.high_risk_tasks.map((t) => (
              <div key={t.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 18px', background: 'rgba(239, 68, 68, 0.06)',
                borderRadius: 12, borderLeft: '3px solid var(--danger)',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Due: {t.due_date || 'No date'}
                  </div>
                </div>
                <div style={{
                  padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                  background: `rgba(239, 68, 68, ${t.risk * 0.3})`,
                  color: '#fca5a5',
                }}>
                  {Math.round(t.risk * 100)}% risk
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
