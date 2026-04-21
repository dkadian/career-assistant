import { useState, useEffect } from 'react'
import { api } from '../api'

export default function ProfileModal({ profile, userId, onSave, onClose }) {
  const apiObj = api
  const [step, setStep] = useState(1)
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

  const handleSave = async () => {
    setLoading(true); setError(''); setStatus('')
    try {
      const payload = { ...form, years_experience: parseInt(form.years_experience) || null, skills, interests }
      await apiObj.saveProfile(userId, payload)
      onSave(payload)
    } catch (e) { setError('Failed to save. Please try again.') }
    finally { setLoading(false) }
  }

  const inp = { width: '100%', padding: '12px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', fontSize: '14px', color: 'var(--text)', outline: 'none', transition: 'all 0.2s' }
  const lbl = { display: 'block', fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px', marginTop: '4px' }
  const tagBox = { display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', minHeight: '100px', alignContent: 'flex-start' }
  const tag = { background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--gold)', padding: '5px 12px', borderRadius: '999px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(var(--bg-rgb), 0.8)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="glass-morphism" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '32px', padding: '40px', width: '580px', maxWidth: '100%', boxShadow: '0 40px 100px rgba(0,0,0,0.4)', animation: 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative', overflow: 'hidden' }}>
        
        {/* Progress bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--surface2)' }}>
          <div style={{ width: `${(step / 3) * 100}%`, height: '100%', background: 'var(--gold)', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 0 15px var(--gold-glow)' }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--gold)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>Step {step} of 3</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '32px', fontWeight: 600, color: 'var(--text)', lineHeight: 1.1 }}>
              {step === 1 ? 'Basic Details' : step === 2 ? 'Skills & Expertise' : 'Goals & Future'}
            </h2>
          </div>
          <button style={{ background: 'var(--surface2)', border: 'none', color: 'var(--text3)', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onClick={onClose} onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--surface2)'}>×</button>
        </div>

        {error && <div style={{ background: 'var(--surface)', border: '1px solid var(--rust)', color: 'var(--rust)', padding: '12px 16px', borderRadius: '14px', fontSize: '13px', marginBottom: '24px', animation: 'fadeIn 0.3s ease' }}>{error}</div>}
        {status && <div style={{ background: 'var(--surface)', border: '1px solid var(--sage)', color: 'var(--sage)', padding: '12px 16px', borderRadius: '14px', fontSize: '13px', marginBottom: '24px', animation: 'fadeIn 0.3s ease' }}>{status}</div>}

        <div style={{ minHeight: '340px' }}>
          {step === 1 && (
            <div style={{ animation: 'slideInRight 0.4s ease' }}>
              <div style={{ marginBottom: '24px' }}>
                <label style={lbl}>Automatic Profile Setup</label>
                <div style={{ background: 'var(--surface)', border: '1px dashed var(--border2)', borderRadius: '20px', padding: '24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text2)', marginBottom: '16px' }}>Upload your resume to instantly fill your profile with extracted skills and experience.</div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input type="file" id="resume-up" accept=".pdf,.docx" style={{ display: 'none' }} onChange={e => setResumeFile(e.target.files[0])} />
                    <label htmlFor="resume-up" style={{ flex: 1, padding: '12px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text2)', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {resumeFile ? resumeFile.name : 'Select PDF or DOCX...'}
                    </label>
                    <button 
                      style={{ padding: '12px 24px', background: 'var(--gold)', color: 'var(--bg)', border: 'none', borderRadius: '12px', fontWeight: 700, fontSize: '13px', opacity: uploading || !resumeFile ? 0.6 : 1, transition: 'all 0.2s', cursor: uploading || !resumeFile ? 'default' : 'pointer' }} 
                      onClick={handleResumeUpload} 
                      disabled={uploading || !resumeFile}
                    >
                      {uploading ? 'Parsing...' : 'Fill Profile'}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {[['Current Role','current_role','e.g. Software Engineer'],['Years Experience','years_experience','e.g. 5'],['Education','education','e.g. Masters in CS'],['Location','location','e.g. Remote / New York']].map(([l,k,p]) => (
                  <div key={k}>
                    <label style={lbl}>{l}</label>
                    <input 
                      style={inp} 
                      placeholder={p} 
                      value={form[k]} 
                      onChange={e => setForm({...form,[k]:e.target.value})} 
                      onFocus={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.background = 'var(--surface2)' }}
                      onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface)' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ animation: 'slideInRight 0.4s ease' }}>
              <label style={lbl}>Technical Skills</label>
              <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '12px' }}>Press Enter to add tags manually or review extracted skills below.</p>
              <div style={{ ...tagBox, marginBottom: '24px' }}>
                {skills.map(s => (
                  <span key={s} style={tag}>
                    {s}
                    <span style={{ cursor: 'pointer', opacity: 0.6, fontSize: '16px' }} onClick={() => setSkills(skills.filter(v => v !== s))}>×</span>
                  </span>
                ))}
                <input 
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: 'var(--text)', minWidth: '120px', flex: 1, padding: '4px' }} 
                  placeholder="Type skill & enter..." 
                  value={skillInput} 
                  onChange={e => setSkillInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && addTag(skillInput, skills, setSkills, setSkillInput)} 
                />
              </div>

              <label style={lbl}>Areas of Interest</label>
              <div style={tagBox}>
                {interests.map(i => (
                  <span key={i} style={{ ...tag, background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--rust)' }}>
                    {i}
                    <span style={{ cursor: 'pointer', opacity: 0.6, fontSize: '16px' }} onClick={() => setInterests(interests.filter(v => v !== i))}>×</span>
                  </span>
                ))}
                <input 
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '14px', color: 'var(--text)', minWidth: '120px', flex: 1, padding: '4px' }} 
                  placeholder="Type interest & enter..." 
                  value={interestInput} 
                  onChange={e => setInterestInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && addTag(interestInput, interests, setInterests, setInterestInput)} 
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ animation: 'slideInRight 0.4s ease' }}>
              <label style={lbl}>Career Goals & Objectives</label>
              <p style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '12px' }}>Describe what you are looking for in your next role or long-term growth.</p>
              <textarea 
                style={{ ...inp, resize: 'none', lineHeight: 1.6, minHeight: '220px', padding: '20px' }} 
                placeholder="I want to transition into AI Engineering and work on large scale language models..." 
                value={form.career_goals} 
                onChange={e => setForm({...form, career_goals: e.target.value})} 
                onFocus={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.background = 'var(--surface2)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.background = 'var(--surface)' }}
              />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '40px', paddingTop: '24px', borderTop: '1px solid var(--border)' }}>
          {step > 1 ? (
            <button 
              style={{ padding: '12px 24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', color: 'var(--text2)', fontSize: '14px', fontWeight: 600, transition: 'all 0.2s' }} 
              onClick={() => setStep(step - 1)}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
            >
              Back
            </button>
          ) : (
            <button style={{ padding: '12px 24px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '14px', color: 'var(--text3)', fontSize: '14px' }} onClick={onClose}>Cancel</button>
          )}

          {step < 3 ? (
            <button 
              className="premium-gradient"
              style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '14px', color: 'var(--bg)', fontSize: '15px', fontWeight: 700, boxShadow: '0 10px 20px var(--gold-glow)', transition: 'all 0.3s' }} 
              onClick={() => setStep(step + 1)}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Continue
            </button>
          ) : (
            <button 
              className="premium-gradient"
              style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '14px', color: 'var(--bg)', fontSize: '15px', fontWeight: 700, boxShadow: '0 10px 20px var(--gold-glow)', transition: 'all 0.3s', opacity: loading ? 0.7 : 1 }} 
              onClick={handleSave} 
              disabled={loading}
              onMouseEnter={e => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={e => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {loading ? 'Saving Profile...' : 'Complete Profile'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
