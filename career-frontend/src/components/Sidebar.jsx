import { useState } from 'react'

export default function Sidebar({ user, profile, sessions, activeSessionId, onNewSession, onSelectSession, onEditProfile, onDeleteSession, onRenameSession, onLogout }) {
  const [hoveredId, setHoveredId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  // Calculate profile completion percentage
  const completionScore = () => {
    if (!profile) return 0;
    const fields = [
      profile.current_role,
      profile.years_experience,
      profile.education,
      profile.location,
      profile.career_goals,
      profile.skills?.length > 0,
      profile.interests?.length > 0
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const progress = completionScore();
  
  // Dynamic context levels based on completion
  const getContextStatus = () => {
    if (progress === 0) return { label: 'Awaiting Data', color: 'var(--text3)', level: 'Zero' };
    if (progress < 30) return { label: 'Calibrating...', color: 'var(--gold)', level: 'Low' };
    if (progress < 70) return { label: 'Contextual', color: 'var(--gold)', level: 'Partial' };
    if (progress < 100) return { label: 'High Precision', color: 'var(--sage)', level: 'Deep' };
    return { label: 'Full Intelligence', color: 'var(--sage)', level: 'Maximum' };
  };

  const status = getContextStatus();

  function formatDate(iso) {
    const d = new Date(iso), now = new Date(), diff = now - d
    if (diff < 86400000) return 'Today'
    if (diff < 172800000) return 'Yesterday'
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <aside style={{ width:'300px', minWidth:'300px', background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', height:'100vh', position: 'relative', zIndex: 10 }}>
      <div style={{ padding:'32px 24px 24px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'6px' }}>
          <div className="premium-gradient" style={{ width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg)', fontWeight: 800, fontSize: '18px', boxShadow: '0 8px 20px rgba(99,102,241,0.2)' }}>P</div>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'22px', fontWeight: 700, color:'var(--text)', letterSpacing: '-0.5px' }}>Pathfinder</span>
        </div>
        <div style={{ fontSize:'10px', letterSpacing:'2.5px', textTransform:'uppercase', color:'var(--gold)', fontWeight: 700, opacity: 0.8, paddingLeft: '44px' }}>AI Counsellor</div>
      </div>

      <div style={{ padding:'24px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'16px' }}>
          <div style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--text3)', fontWeight: 700 }}>AI Intelligence Core</div>
          <div style={{ fontSize:'10px', color: status.color, fontWeight: 800 }}>{progress}%</div>
        </div>

        <div 
          onClick={onEditProfile}
          className="glass-morphism"
          style={{ 
            borderRadius:'24px', 
            padding:'20px', 
            cursor:'pointer', 
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', 
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.02), rgba(0,0,0,0.1))',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.boxShadow = 'none' }}
        >
          {/* Circular Gauge Background */}
          <div style={{ position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1 }}>
            <svg width="100" height="100" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" />
              <circle cx="50" cy="50" r="40" fill="none" stroke={status.color} strokeWidth="8" strokeDasharray={`${(progress / 100) * 251.2} 251.2`} strokeLinecap="round" transform="rotate(-90 50 50)" />
            </svg>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 1 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: status.color }}>
                {progress === 100 ? '✦' : '⚙'}
              </div>
              <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', width: '14px', height: '14px', borderRadius: '50%', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: status.color, animation: progress < 100 ? 'pulse 2s infinite' : 'none' }} />
              </div>
            </div>
            <div>
              <div style={{ fontSize:'15px', fontWeight: 700, color:'var(--text)', marginBottom:'2px' }}>{user?.name?.split(' ')[0] || 'User'}</div>
              <div style={{ fontSize:'11px', color: status.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {status.label}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text2)', lineHeight: 1.5, opacity: 0.9 }}>
            {progress === 100 ? 'Full profile intelligence unlocked.' : 
             progress < 30 ? 'Add roles & skills to sharpen AI.' :
             progress < 70 ? 'Ready for tailored career advice.' : 
             'High precision active for planning.'}
          </div>

          {/* Quick Tip */}
          {progress < 100 && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '10px', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: 'var(--gold)' }}>💡</span>
              <span>Tip: {!profile?.career_goals ? 'Add goals for +20%' : !profile?.skills?.length ? 'Add skills for +20%' : 'Finish to maximize accuracy'}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ flex:1, padding:'20px 24px', overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'12px' }}>
          <div style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--text3)', fontWeight: 700 }}>Conversations</div>
          <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{sessions.length}</div>
        </div>
        
        <button 
          className="premium-gradient"
          style={{ width:'100%', padding:'12px', border:'none', borderRadius:'14px', color:'var(--bg)', fontSize:'13px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'20px', boxShadow: '0 8px 20px rgba(99,102,241,0.2)', transition: 'all 0.3s' }} 
          onClick={onNewSession}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <span style={{ fontSize: '18px' }}>+</span> New Session
        </button>

        <div style={{ flex:1, overflowY:'auto', paddingRight: '4px' }} className="custom-scroll">
          {sessions.length === 0 && (
            <div style={{ fontSize:'12px', color:'var(--text3)', textAlign:'center', padding:'40px 0', opacity: 0.6 }}>
              No history yet
            </div>
          )}
          {sessions.map(sess => (
            <div key={sess.id}
              style={{ 
                padding:'12px 14px', 
                borderRadius:'14px', 
                cursor:'pointer', 
                marginBottom:'6px', 
                border:'1px solid transparent', 
                display:'flex', 
                alignItems:'center', 
                justifyContent:'space-between', 
                transition: 'all 0.2s ease',
                background: sess.id===activeSessionId ? 'rgba(99,102,241,0.08)' : 'transparent', 
                borderColor: sess.id===activeSessionId ? 'rgba(99,102,241,0.2)' : 'transparent' 
              }}
              onMouseEnter={() => setHoveredId(sess.id)} onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectSession(sess.id)}>
              <div style={{ flex:1, minWidth:0 }}>
                {editingId === sess.id ? (
                  <input
                    autoFocus
                    style={{ width:'100%', background:'var(--surface2)', border:'1px solid var(--gold)', borderRadius:'8px', color:'var(--text)', fontSize:'13px', padding:'4px 8px', outline:'none' }}
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        onRenameSession(sess.id, editTitle)
                        setEditingId(null)
                      } else if (e.key === 'Escape') {
                        setEditingId(null)
                      }
                    }}
                    onBlur={() => {
                      onRenameSession(sess.id, editTitle)
                      setEditingId(null)
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <>
                    <div style={{ fontSize:'14px', color: sess.id===activeSessionId ? 'var(--gold)' : 'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', fontWeight: sess.id===activeSessionId ? 600 : 400 }}>{sess.title}</div>
                    <div style={{ fontSize:'11px', color:'var(--text3)', marginTop: '2px' }}>{formatDate(sess.updated_at)}</div>
                  </>
                )}
              </div>
              {hoveredId === sess.id && editingId !== sess.id && (
                <div style={{ display:'flex', gap:'6px', animation: 'fadeIn 0.2s ease' }}>
                  <button title="Rename" style={{ background:'rgba(255,255,255,0.05)', border:'none', color:'var(--text3)', fontSize:'12px', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { e.stopPropagation(); setEditingId(sess.id); setEditTitle(sess.title) }}>✎</button>
                  <button title="Delete" style={{ background:'rgba(244,63,94,0.1)', border:'none', color:'var(--rust)', fontSize:'12px', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { e.stopPropagation(); onDeleteSession(sess.id) }}>×</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding:'20px 24px', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', gap:'12px' }}>
        <div style={{ width:'40px', height:'40px', background:'linear-gradient(135deg,var(--gold),var(--rust))', borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:700, color:'var(--bg)', flexShrink:0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>{initials}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:'14px', color:'var(--text)', fontWeight: 600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name || 'Guest'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--sage)', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize:'11px', color:'var(--sage)', fontWeight: 600 }}>Active Now</span>
          </div>
        </div>
        {user && (
          <button 
            style={{ 
              background:'rgba(255,255,255,0.03)', 
              border:'1px solid rgba(255,255,255,0.08)', 
              color:'var(--text2)', 
              width: '32px',
              height: '32px',
              borderRadius:'10px', 
              fontSize:'16px', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition:'all 0.2s'
            }} 
            title="Log out"
            onClick={onLogout}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.color = 'var(--rust)'; e.currentTarget.style.borderColor = 'rgba(244,63,94,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          >
            ⎋
          </button>
        )}
      </div>
    </aside>
  )
}
