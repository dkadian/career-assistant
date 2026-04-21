import { useState, useEffect } from 'react'
import { api } from '../api'

export default function ProfileModal({ profile, userId, onSave, onClose }) {
  const apiObj = api

  const [form, setForm] = useState({ current_role: '', years_experience: '', education: '', career_goals: '', location: '' })
  const [skills, setSkills] = useState([])
  const [interests, setInterests] = useState([])
  const [status, setStatus] = useState('')

  function mergeUniqueTags(current, incoming) {
    const seen = new Set()
    return [...current, ...incoming].filter(item => {
      const value = item?.trim()
      if (!value) return false
      const key = value.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  useEffect(() => {
    if (profile) {
      setForm({
        current_role: profile.current_role || '',
        years_experience: profile.years_experience?.toString() || '',
        education: profile.education || '',
        career_goals: profile.career_goals || '',
        location: profile.location || ''
      })
      setSkills(profile.skills || [])
      setInterests(profile.interests || [])
    } else {
      setForm({ current_role: '', years_experience: '', education: '', career_goals: '', location: '' })
      setSkills([])
      setInterests([])
    }
  }, [profile])
  const [skillInput, setSkillInput] = useState('')
  const [interestInput, setInterestInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [resumeFile, setResumeFile] = useState(null)

  function addTag(val, list, setList, setInput) {
    if (!val.trim() || list.includes(val.trim())) return
    setList([...list, val.trim()]); setInput('')
  }

  async function handleResumeUpload() {
    if (!resumeFile || !userId) return
    setUploading(true)
    setError('')
    setStatus('')
    try {
      const result = await apiObj.uploadResume(userId, resumeFile)
      const mergedSkills = mergeUniqueTags(skills, result.skills || [])
      const mergedInterests = mergeUniqueTags(interests, result.interests || [])
      setSkills(mergedSkills)
      setInterests(mergedInterests)
      setStatus(`Resume processed. ${mergedSkills.length} skills and ${mergedInterests.length} interests are now filled in the form for your review.`)
    } catch (e) {
      setError('Upload failed: ' + e.message)
    } finally {
      setUploading(false)
      setResumeFile(null)
    }
  }

  async function handleSave() {
    setLoading(true); setError(''); setStatus('')
    try {
      const payload = { ...form, years_experience: parseInt(form.years_experience) || null, skills, interests }
      await apiObj.saveProfile(userId, payload)
      onSave(payload)
    } catch (e) { setError('Failed to save. Please try again.') }
    finally { setLoading(false) }
  }

  const inp = { width: '100%', padding: '10px 13px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '14px', color: 'var(--text)', outline: 'none' }
  const lbl = { display: 'block', fontSize: '11px', fontWeight: 500, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--text2)', marginBottom: '6px', marginTop: '14px' }
  const tagBox = { display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', minHeight: '44px', alignItems: 'center' }
  const tag = { background: 'var(--border2)', color: 'var(--text)', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,9,8,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px', overflowY: 'auto' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', padding: '36px', width: '520px', maxWidth: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.6)', animation: 'fadeUp 0.3s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '24px', fontWeight: 600, color: 'var(--text)' }}>Career Profile</h2>
            <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>Help me personalise your advice</p>
          </div>
          <button style={{ background: 'none', border: 'none', color: 'var(--text3)', fontSize: '18px' }} onClick={onClose}>X</button>
        </div>
        {error && <div style={{ background: 'rgba(196,99,58,0.1)', border: '1px solid rgba(196,99,58,0.3)', color: 'var(--rust)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}
        {status && <div style={{ background: 'rgba(198, 167, 108, 0.12)', border: '1px solid rgba(198, 167, 108, 0.35)', color: 'var(--gold)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '12px' }}>{status}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[['Current Role','current_role','e.g. Engineer'],['Years Exp','years_experience','e.g. 3'],['Education','education','e.g. BSc CS'],['Location','location','e.g. Mumbai']].map(([l,k,p]) => (
            <div key={k}><label style={lbl}>{l}</label><input style={inp} placeholder={p} value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})} /></div>
          ))}
        </div>
        <label style={lbl}>Skills (press Enter to add)</label>
        <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px' }}>Resume skills appear here after upload so the user can review, remove, or add anything missing before saving.</p>
        <div style={tagBox}>
          {skills.map(s => <span key={s} style={tag}>{s}<span style={{cursor:'pointer',color:'var(--text3)',fontSize:'14px',marginLeft:'4px'}} onClick={()=>setSkills(skills.filter(v=>v!==s))}>x</span></span>)}
          <input style={{border:'none',outline:'none',background:'transparent',fontSize:'13px',color:'var(--text)',minWidth:'80px',flex:1}} placeholder="e.g. Python" value={skillInput} onChange={e=>setSkillInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTag(skillInput,skills,setSkills,setSkillInput)} />
        </div>
        <label style={lbl}>Interests (press Enter to add)</label>
        <div style={tagBox}>
          {interests.map(i => <span key={i} style={tag}>{i}<span style={{cursor:'pointer',color:'var(--text3)',fontSize:'14px',marginLeft:'4px'}} onClick={()=>setInterests(interests.filter(v=>v!==i))}>x</span></span>)}
          <input style={{border:'none',outline:'none',background:'transparent',fontSize:'13px',color:'var(--text)',minWidth:'80px',flex:1}} placeholder="e.g. AI/ML" value={interestInput} onChange={e=>setInterestInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTag(interestInput,interests,setInterests,setInterestInput)} />
        </div>
        <label style={lbl}>Career Goals</label>
        <textarea style={{...inp,resize:'vertical',lineHeight:1.6,minHeight:'80px'}} placeholder="What do you want to achieve?" value={form.career_goals} onChange={e=>setForm({...form,career_goals:e.target.value})} />
        <div style={{marginBottom:'20px'}}>
          <label style={lbl}>Upload Resume (PDF/DOCX) - Auto-fill skills</label>
          <div style={{display:'flex',gap:'8px',alignItems:'end'}}>
            <input type="file" accept=".pdf,.docx" style={{flex:1,...inp,padding:'8px'}} onChange={e=>setResumeFile(e.target.files[0])} />
            <button style={{padding:'10px 16px',background:'var(--gold)',color:'var(--bg)',border:'none',borderRadius:'var(--radius-sm)',fontWeight:600,opacity:uploading?0.7:1,minWidth:'100px'}} onClick={handleResumeUpload} disabled={uploading||!resumeFile}>
              {uploading?'Processing...':'Upload'}
            </button>
          </div>
        </div>
        <div style={{display:'flex',gap:'10px',marginTop:'24px'}}>
          <button style={{padding:'11px 20px',background:'transparent',border:'1px solid var(--border2)',borderRadius:'var(--radius-sm)',color:'var(--text2)',fontSize:'14px'}} onClick={onClose}>Skip</button>
          <button style={{flex:1,padding:'11px',background:'var(--gold)',color:'var(--bg)',border:'none',borderRadius:'var(--radius-sm)',fontSize:'14px',fontWeight:600,opacity:loading?0.7:1}} onClick={handleSave} disabled={loading}>{loading?'Saving...':'Save Profile'}</button>
        </div>
      </div>
    </div>
  )
}
