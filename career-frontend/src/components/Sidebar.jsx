import { useState } from 'react'

export default function Sidebar({ user, profile, sessions, activeSessionId, onNewSession, onSelectSession, onEditProfile, onDeleteSession, onLogout }) {
  const [hoveredId, setHoveredId] = useState(null)
  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  function formatDate(iso) {
    const d = new Date(iso), now = new Date(), diff = now - d
    if (diff < 86400000) return 'Today'
    if (diff < 172800000) return 'Yesterday'
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  return (
    <aside style={{ width:'280px', minWidth:'280px', background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', height:'100vh' }}>
      <div style={{ padding:'28px 22px 20px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
          <span style={{ fontSize:'22px', color:'var(--gold)' }}>P</span>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'20px', fontWeight:600, color:'var(--text)' }}>Pathfinder</span>
        </div>
        <span style={{ fontSize:'10px', letterSpacing:'2px', textTransform:'uppercase', color:'var(--gold-dim)', paddingLeft:'32px' }}>Career Counsellor</span>
      </div>
      <div style={{ padding:'16px 22px', borderBottom:'1px solid var(--border)' }}>
        <div style={{ fontSize:'10px', letterSpacing:'2px', textTransform:'uppercase', color:'var(--text3)', marginBottom:'10px' }}>Profile</div>
        {profile?.current_role ? (
          <div style={{ background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:'var(--radius-sm)', padding:'12px 14px', cursor:'pointer' }} onClick={onEditProfile}>
            <div style={{ fontSize:'14px', fontWeight:500, color:'var(--text)', marginBottom:'2px' }}>{user?.name}</div>
            <div style={{ fontSize:'12px', color:'var(--text2)' }}>{profile.current_role}{profile.years_experience ? ' · ' + profile.years_experience + ' yrs' : ''}</div>
            <div style={{ fontSize:'11px', color:'var(--text3)', marginTop:'5px' }}>Click to edit</div>
          </div>
        ) : (
          <button style={{ width:'100%', padding:'9px', background:'transparent', border:'1px dashed var(--gold-dim)', borderRadius:'var(--radius-sm)', color:'var(--gold)', fontSize:'12px' }} onClick={onEditProfile}>+ Set up career profile</button>
        )}
      </div>
      <div style={{ flex:1, padding:'16px 22px', overflow:'hidden', display:'flex', flexDirection:'column' }}>
        <div style={{ fontSize:'10px', letterSpacing:'2px', textTransform:'uppercase', color:'var(--text3)', marginBottom:'10px' }}>Conversations</div>
        <button style={{ width:'100%', padding:'10px', background:'var(--gold)', border:'none', borderRadius:'var(--radius-sm)', color:'var(--bg)', fontSize:'13px', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'12px' }} onClick={onNewSession}>
          + New Session
        </button>
        <div style={{ flex:1, overflowY:'auto', scrollbarWidth:'thin' }}>
          {sessions.length === 0 && <div style={{ fontSize:'12px', color:'var(--text3)', textAlign:'center', padding:'20px 0' }}>No sessions yet</div>}
          {sessions.map(sess => (
            <div key={sess.id}
              style={{ padding:'10px 12px', borderRadius:'var(--radius-sm)', cursor:'pointer', marginBottom:'3px', border:'1px solid transparent', display:'flex', alignItems:'center', justifyContent:'space-between', background: sess.id===activeSessionId ? 'var(--gold-glow)' : hoveredId===sess.id ? 'var(--surface2)' : 'transparent', borderColor: sess.id===activeSessionId ? 'rgba(212,168,83,0.3)' : 'transparent' }}
              onMouseEnter={() => setHoveredId(sess.id)} onMouseLeave={() => setHoveredId(null)}
              onClick={() => onSelectSession(sess.id)}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:'13px', color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', marginBottom:'2px' }}>{sess.title}</div>
                <div style={{ fontSize:'11px', color:'var(--text3)' }}>{formatDate(sess.updated_at)}</div>
              </div>
              {hoveredId === sess.id && (
                <button style={{ background:'none', border:'none', color:'var(--text3)', fontSize:'12px', padding:'2px 4px', marginLeft:'6px' }} onClick={e => { e.stopPropagation(); onDeleteSession(sess.id) }}>X</button>
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding:'16px 22px', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'10px' }}>
        <div style={{ width:'32px', height:'32px', background:'linear-gradient(135deg,var(--gold),var(--rust))', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:600, color:'var(--bg)', flexShrink:0 }}>{initials}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:'13px', color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name || 'Guest'}</div>
          <div style={{ fontSize:'11px', color:'var(--sage)', marginTop:'2px' }}>Online</div>
        </div>
        {user && (
          <button 
            style={{ 
              background:'none', 
              border:'1px solid var(--border2)', 
              color:'var(--text2)', 
              padding:'6px 12px', 
              borderRadius:'var(--radius-sm)', 
              fontSize:'12px', 
              fontWeight:500,
              whiteSpace:'nowrap',
              opacity: 0.8,
              transition:'opacity 0.2s'
            }} 
            onClick={onLogout}
            onMouseEnter={e => e.target.style.opacity = '1'}
            onMouseLeave={e => e.target.style.opacity = '0.8'}
          >
            Log out
          </button>
        )}
      </div>
    </aside>
  )
}
