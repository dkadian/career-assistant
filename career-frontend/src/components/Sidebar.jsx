import { useState } from 'react'

export default function Sidebar({ user, profile, sessions, activeSessionId, onNewSession, onSelectSession, onEditProfile, onDeleteSession, onRenameSession, onLogout }) {
  const [hoveredId, setHoveredId] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

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
          <div className="premium-gradient" style={{ width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg)', fontWeight: 800, fontSize: '18px', boxShadow: '0 8px 20px rgba(212,168,83,0.2)' }}>P</div>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'22px', fontWeight: 700, color:'var(--text)', letterSpacing: '-0.5px' }}>Pathfinder</span>
        </div>
        <div style={{ fontSize:'10px', letterSpacing:'2.5px', textTransform:'uppercase', color:'var(--gold)', fontWeight: 700, opacity: 0.8, paddingLeft: '44px' }}>AI Counsellor</div>
      </div>

      <div style={{ padding:'20px 24px', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--text3)', marginBottom:'12px', fontWeight: 700 }}>Career Profile</div>
        {profile?.current_role ? (
          <div 
            className="glass-morphism" 
            style={{ borderRadius:'16px', padding:'14px 16px', cursor:'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', border: '1px solid rgba(255,255,255,0.08)' }} 
            onClick={onEditProfile}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'rgba(212,168,83,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
          >
            <div style={{ fontSize:'14px', fontWeight: 600, color:'var(--text)', marginBottom:'2px' }}>{user?.name}</div>
            <div style={{ fontSize:'12px', color:'var(--text2)', opacity: 0.8 }}>{profile.current_role}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
               <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--sage)' }} />
               <span style={{ fontSize:'10px', color:'var(--sage)', fontWeight: 700, textTransform: 'uppercase' }}>Profile Active</span>
            </div>
          </div>
        ) : (
          <button 
            style={{ width:'100%', padding:'12px', background:'rgba(212,168,83,0.05)', border:'1px dashed rgba(212,168,83,0.3)', borderRadius:'14px', color:'var(--gold)', fontSize:'12px', fontWeight: 600, transition: 'all 0.2s' }} 
            onClick={onEditProfile}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,168,83,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(212,168,83,0.05)'}
          >
            + Complete your profile
          </button>
        )}
      </div>

      <div style={{ flex:1, padding:'20px 24px', overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'12px' }}>
          <div style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase', color:'var(--text3)', fontWeight: 700 }}>Conversations</div>
          <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{sessions.length}</div>
        </div>
        
        <button 
          className="premium-gradient"
          style={{ width:'100%', padding:'12px', border:'none', borderRadius:'14px', color:'var(--bg)', fontSize:'13px', fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'20px', boxShadow: '0 8px 20px rgba(212,168,83,0.2)', transition: 'all 0.3s' }} 
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
                background: sess.id===activeSessionId ? 'rgba(212,168,83,0.08)' : 'transparent', 
                borderColor: sess.id===activeSessionId ? 'rgba(212,168,83,0.2)' : 'transparent' 
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
                  <button title="Delete" style={{ background:'rgba(196,99,58,0.1)', border:'none', color:'var(--rust)', fontSize:'12px', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => { e.stopPropagation(); onDeleteSession(sess.id) }}>×</button>
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
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,99,58,0.1)'; e.currentTarget.style.color = 'var(--rust)'; e.currentTarget.style.borderColor = 'rgba(196,99,58,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          >
            ⎋
          </button>
        )}
      </div>
    </aside>
  )
}
