import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { api } from '../api'

const SUGGESTIONS = [
  { icon: '🔄', label: 'Career transition', msg: 'How do I successfully transition into a new industry?' },
  { icon: '💰', label: 'Salary negotiation', msg: 'How can I negotiate a higher salary?' },
  { icon: '📈', label: 'Skills and growth', msg: 'What skills should I develop to advance my career?' },
  { icon: '🎯', label: 'Interview prep', msg: 'Help me prepare for a senior-level job interview.' },
  { icon: '✍️', label: 'Resume tips', msg: 'How can I improve my resume to stand out?' },
  { icon: '🌱', label: 'Early career', msg: 'I just graduated. What are the best steps to start my career?' },
]

function normalizeMarkdown(text) {
  if (!text) return ''
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/(<br\s*\/?>)/gi, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/:--+\s*$/gm, ':')
    .replace(/\|\s*[-:]+\s*\|/g, match => `\n${match}\n`)
    .replace(/(\|[^\n]+\|)(?=\|)/g, '$1\n')
    .replace(/\n{4,}/g, '\n\n\n')

  const lines = cleaned.split('\n')
  const normalized = []

  for (let rawLine of lines) {
    let line = rawLine
    let trimmed = line.trim()

    if (!trimmed && !line) {
      normalized.push('')
      continue
    }
    
    if (/^([*-]|\|\*)$/.test(trimmed)) {
      continue
    }

    line = line
      .replace(/^\*\s*(Week|Phase|Month|Step)\b\s*/i, '## $1 ')
      .replace(/^\*\s*(Video|Tip|Tips|Example|Examples|Resources|Next Steps|Roadmap)\b:?\s*$/i, '### $1')
      .replace(/^\s*[*-]?\s*o\s*[*-]?\s*\*?([^*\n:][^:\n]*):\*?\s*$/i, '- **$1:**')
      .replace(/^\s*[*-]\s*\*?([^*\n:][^:\n]*):\*?\s*$/i, '- **$1:**')
      .replace(/^\s*\d+\.\s+\*(.+?)\*?\s*$/i, (_, textPart) => `1. **${textPart.trim()}**`)
      .replace(/(^|[\s(])\*([A-Za-z][A-Za-z0-9/+.# -]{1,40})\*(?=$|[\s),.:;!?])/g, '$1**$2**')

    const lastLine = normalized[normalized.length - 1]
    const shouldMergeIntoPrevious =
      normalized.length > 0 &&
      lastLine &&
      /^[-*]\s+(to|and|or|for|with|together|plus)\b/i.test(trimmed) &&
      !/^[-*]\s+\*\*/.test(lastLine) &&
      !/^(#{1,3}|\d+\.)\s/.test(lastLine)

    if (shouldMergeIntoPrevious) {
      normalized[normalized.length - 1] += ' ' + trimmed.replace(/^[-*]\s+/, '')
      continue
    }

    normalized.push(line)
  }

  return normalized.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

const markdownComponents = {
  p: ({ children }) => <p style={{ margin: '0 0 10px', lineHeight: 1.75 }}>{children}</p>,
  ul: ({ children }) => <ul style={{ margin: '6px 0 12px 20px', padding: 0, display: 'grid', gap: '8px' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ margin: '6px 0 12px 20px', padding: 0, display: 'grid', gap: '8px' }}>{children}</ol>,
  li: ({ children }) => <li style={{ lineHeight: 1.7 }}>{children}</li>,
  h1: ({ children }) => <h1 style={{ fontSize: '20px', margin: '8px 0 10px', lineHeight: 1.3 }}>{children}</h1>,
  h2: ({ children }) => <h2 style={{ fontSize: '18px', margin: '8px 0 10px', lineHeight: 1.35 }}>{children}</h2>,
  h3: ({ children }) => <h3 style={{ fontSize: '16px', margin: '8px 0 8px', lineHeight: 1.4 }}>{children}</h3>,
  strong: ({ children }) => <strong style={{ color: 'var(--text)' }}>{children}</strong>,
  em: ({ children }) => <em style={{ color: 'var(--text2)' }}>{children}</em>,
  code: ({ children }) => <code style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: '5px', fontSize: '12px' }}>{children}</code>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>{children}</a>,
  hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--border2)', margin: '12px 0' }} />,
  table: ({ children }) => <div style={{ overflowX: 'auto', margin: '16px 0', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}><table style={{ width: '100%', borderCollapse: 'collapse', borderSpacing: 0, background: 'var(--surface2)', borderRadius: '12px', overflow: 'hidden' }}>{children}</table></div>,
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children, index }) => <tr style={{ backgroundColor: index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>{children}</tr>,
  th: ({ children }) => <th style={{ textAlign: 'left', padding: '12px 16px', borderBottom: '1px solid var(--border2)', fontSize: '13px', color: 'var(--text)', fontWeight: 600, background: 'rgba(255,255,255,0.03)' }}>{children}</th>,
  td: ({ children }) => <td style={{ verticalAlign: 'top', padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: '13px', lineHeight: 1.65, background: 'rgba(255,255,255,0.01)' }}>{children}</td>,
}

function ChatArea({ user, session, messages, setMessages, onSessionsRefresh, onRenameSession }) {
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const lastAsstRef = useRef(null)
  const [selectedModel, setSelectedModel] = useState('off');
  const endRef = useRef(null)
  const taRef = useRef(null)
  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const isModelActive = selectedModel !== 'off';

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  function resize() {
    const t = taRef.current; if (!t) return
    t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 140) + 'px'
  }

  async function send(text) {
    const msg = (text || input).trim()
    if (!msg || isTyping || !session || selectedModel === 'off') {
      if (selectedModel === 'off') {
        alert('Please select a model first');
      }
      return;
    }
    setInput(''); if (taRef.current) taRef.current.style.height = 'auto';
    const userMsg = { role:'user', content:msg, created_at: new Date().toISOString(), id:'tmp-'+Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true)
    try {
      const useHf = selectedModel === 'openrouter';
      const useLm = selectedModel === 'lmstudio';
      const streamRes = await api.sendMessage(session.id, user.id, msg, true, useHf, useLm)
      const asstMsg = { role:'assistant', content:'', created_at: new Date().toISOString(), id:'tmp-asst-'+Date.now() }
      setMessages(prev => [...prev, asstMsg])
      lastAsstRef.current = asstMsg.id
      
      const reader = streamRes.body.getReader()
      const decoder = new TextDecoder()
      let fullReply = ''
      let buffer = ''
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) {
            buffer += decoder.decode()
          } else {
            buffer += decoder.decode(value, {stream: true})
          }

          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') break
              
              let delta = data
              try {
                const parsed = JSON.parse(data)
                if (typeof parsed === 'string') delta = parsed
              } catch (e) {
                if (data === '') delta = '\n'
              }

              if (delta !== '') {
                fullReply += delta
                setMessages(prev => prev.map(m => m.id === asstMsg.id ? { ...m, content: fullReply } : m))
              }
            }
          }

          if (done) {
            if (buffer.startsWith('data: ')) {
              const data = buffer.slice(6)
              if (data !== '[DONE]') {
                let delta = data
                try {
                  const parsed = JSON.parse(data)
                  if (typeof parsed === 'string') delta = parsed
                } catch (e) {
                  if (data === '') delta = '\n'
                }
                if (delta !== '') {
                  fullReply += delta
                  setMessages(prev => prev.map(m => m.id === asstMsg.id ? { ...m, content: fullReply } : m))
                }
              }
            }
            break
          }
        }
      } finally {
        reader.releaseLock()
      }
      onSessionsRefresh()
      // Auto-rename if first message
      if (messages.length === 0 && onRenameSession) {
        const title = msg.length > 30 ? msg.substring(0, 30) + '...' : msg
        onRenameSession(session.id, title)
      }
    } catch(e) {
      setMessages(prev => prev.slice(0, -1).concat({ role:'assistant', content: 'Error: ' + e.message, created_at: new Date().toISOString(), id:'err-'+Date.now() }))
    } finally { 
      setIsTyping(false) 
      lastAsstRef.current = null
    }
  }

  const h = new Date().getHours()
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    if (!isTyping && lastAsstRef.current && (selectedModel === 'openrouter' || selectedModel === 'lmstudio')) {
      setRefreshKey(Date.now())
    }
  }, [isTyping, selectedModel])

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background: 'var(--bg)' }}>
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, background: 'radial-gradient(circle at top right, var(--gold-glow), transparent 40%), radial-gradient(circle at bottom left, rgba(244,63,94,0.03), transparent 40%)', pointerEvents: 'none', opacity: 0.5 }}></div>
      <div className="glass-morphism" style={{ padding:'20px 32px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, zIndex: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* AI Bot Status Logo */}
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: '12px', 
            background: isModelActive ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${isModelActive ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isModelActive ? '0 0 20px rgba(99,102,241,0.15)' : 'none',
            animation: isModelActive ? 'float 4s ease-in-out infinite' : 'none'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              position: 'relative',
              opacity: isModelActive ? 1 : 0.4
            }}>
              {/* Bot Face */}
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="6" width="20" height="14" rx="5" stroke={isModelActive ? 'var(--gold)' : 'var(--text3)'} strokeWidth="2" />
                <path d="M7 11V13" stroke={isModelActive ? 'var(--gold)' : 'var(--text3)'} strokeWidth="2" strokeLinecap="round" />
                <path d="M17 11V13" stroke={isModelActive ? 'var(--gold)' : 'var(--text3)'} strokeWidth="2" strokeLinecap="round" />
                <path d="M10 16C10 16 11 17 12 17C13 17 14 16 14 16" stroke={isModelActive ? 'var(--gold)' : 'var(--text3)'} strokeWidth="1.5" strokeLinecap="round" />
                {isModelActive && (
                   <circle cx="12" cy="3" r="1.5" fill="var(--gold)" style={{ animation: 'pulse 1s infinite' }} />
                )}
              </svg>
            </div>
            {/* Status indicator pill */}
            <div style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: isModelActive ? 'var(--sage)' : 'var(--text3)',
              border: '2px solid var(--bg)',
              animation: isModelActive ? 'pulse 2s infinite' : 'none'
            }} />
          </div>

          <div>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'22px', fontWeight:700, color:'var(--text)', letterSpacing: '-0.3px' }}>{session ? session.title : greeting + ', ' + (user?.name?.split(' ')[0]||'')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop:'2px' }}>
              <div style={{ fontSize:'10px', color: isModelActive ? 'var(--gold)' : 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                {isModelActive ? `${selectedModel === 'openrouter' ? 'Cloud' : 'Local'} AI Active` : 'AI Sleeping'}
              </div>
              {isTyping && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--gold)', animation: 'pulse 1s infinite' }} />}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
          <div className="glass-morphism" style={{ display:'flex', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '3px', gap: '2px', border: '1px solid rgba(255,255,255,0.05)' }}>
            {[
              {value: 'off', label: 'Off', color: 'var(--text3)'},
              {value: 'openrouter', label: 'Cloud', color: 'var(--gold)'},
              {value: 'lmstudio', label: 'Local', color: 'var(--rust)'}
            ].map((opt) => (
              <button
                key={opt.value}
                style={{
                  padding: '8px 14px',
                  background: selectedModel === opt.value ? (opt.value === 'off' ? 'rgba(255,255,255,0.05)' : opt.color + '20') : 'transparent',
                  border: 'none',
                  color: selectedModel === opt.value ? opt.color : 'var(--text3)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
                onClick={() => setSelectedModel(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div style={{ flex:1, overflowY:'auto', padding:'32px', display:'flex', flexDirection:'column', gap:'24px' }}>
        {!session || messages.length === 0 ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'40px 20px', animation:'fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
            <div className="premium-gradient" style={{ width:'80px', height:'80px', borderRadius:'24px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'24px', boxShadow: '0 20px 40px rgba(99,102,241,0.15)', animation: 'float 6s ease-in-out infinite' }}>
              <span style={{ fontSize: '32px' }}>✦</span>
            </div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'36px', fontWeight:700, color:'var(--text)', lineHeight:1.1, marginBottom:'16px' }}>Ready to shape your future?</h2>
            <p style={{ fontSize:'15px', color:'var(--text2)', maxWidth:'420px', lineHeight:1.6, marginBottom:'40px', opacity: 0.8 }}>Choose a suggestion or type your own question to start your personalised career journey.</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', width:'100%', maxWidth:'520px' }}>
              {SUGGESTIONS.map(sg => (
                <button 
                  key={sg.label} 
                  className="glass-morphism"
                  style={{ padding:'16px', borderRadius:'18px', color:'var(--text)', fontSize:'13px', textAlign:'left', display:'flex', alignItems:'center', gap:'12px', lineHeight:1.4, transition: 'all 0.3s', border: '1px solid rgba(255,255,255,0.05)' }} 
                  onClick={() => send(sg.msg)}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
                >
                  <span style={{ fontSize:'20px', flexShrink:0 }}>{sg.icon}</span>
                  <span style={{ fontWeight: 600 }}>{sg.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={msg.id||i} style={{ display:'flex', gap:'16px', alignItems:'flex-start', justifyContent: msg.role==='user' ? 'flex-end' : 'flex-start', animation:'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both' }}>
                {msg.role==='assistant' && (
                  <div className="premium-gradient" style={{ width:'36px', height:'36px', borderRadius:'12px', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontWeight: 800, fontSize:'16px', color:'var(--bg)', boxShadow: '0 4px 12px rgba(99,102,241,0.2)', marginTop: '4px' }}>P</div>
                )}
                <div style={{ display:'flex', flexDirection:'column', gap:'6px', maxWidth:'80%' }}>
                  <div style={{ 
                    padding:'16px 20px', 
                    borderRadius:'20px', 
                    fontSize:'15px', 
                    lineHeight:1.7, 
                    position: 'relative',
                    ...(msg.role==='user' ? { 
                      borderBottomRightRadius:'4px', 
                      background:'linear-gradient(135deg, var(--gold), var(--gold-dim))', 
                      color:'var(--bg)',
                      fontWeight: 500,
                      boxShadow: '0 10px 25px rgba(99,102,241,0.15)'
                    } : { 
                      borderBottomLeftRadius:'4px', 
                      background:'rgba(255,255,255,0.03)', 
                      border:'1px solid rgba(255,255,255,0.08)', 
                      color:'var(--text)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                    }) 
                  }}>
                    {msg.role==='assistant' ? (
                      isTyping && msg.id === lastAsstRef.current && (selectedModel === 'openrouter' || selectedModel === 'lmstudio') ? (
                        <div 
                          key={'raw-' + msg.id}
                          style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontFamily: 'inherit' }}
                        >
                          {msg.content}
                          <span style={{ display: 'inline-block', width: '2px', height: '15px', background: 'var(--gold)', marginLeft: '2px', verticalAlign: 'middle', animation: 'pulse 0.8s infinite' }} />
                        </div>
                      ) : (
                        <ReactMarkdown 
                          key={'md-' + msg.id + msg.content.slice(-10)}
                          remarkPlugins={[remarkGfm]} 
                          components={markdownComponents}
                        >
                          {normalizeMarkdown(msg.content)}
                        </ReactMarkdown>
                      )
                    ) : msg.content}
                  </div>
                  <div style={{ fontSize:'10px', color:'var(--text3)', padding:'0 8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: msg.role==='user' ? 'right' : 'left' }}>
                    {new Date(msg.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                  </div>
                </div>
                {msg.role==='user' && (
                  <div style={{ width:'36px', height:'36px', borderRadius:'12px', flexShrink:0, background:'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'12px', fontWeight:700, color:'var(--gold)', marginTop: '4px' }}>{initials}</div>
                )}
              </div>
            ))}
          </>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ padding:'24px 32px 32px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
        <div 
          style={{ 
            display:'flex', 
            alignItems:'flex-end', 
            gap:'12px', 
            background:'var(--surface2)', 
            border:'1px solid var(--border)', 
            borderRadius:'18px', 
            padding:'10px 14px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative'
          }}
          onFocusCapture={e => e.currentTarget.style.borderColor = 'var(--gold)'}
          onBlurCapture={e => e.currentTarget.style.borderColor = 'var(--border)'}
        >
          <textarea 
            ref={taRef} 
            style={{ 
              flex:1, 
              border:'none', 
              outline:'none', 
              background:'transparent', 
              color:'var(--text)', 
              fontSize:'15px', 
              lineHeight:1.6, 
              resize:'none', 
              minHeight:'24px', 
              maxHeight:'140px', 
              padding: '6px 4px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
            placeholder={selectedModel === 'off' ? 'Choose a model above to begin...' : (session ? 'Describe your career challenge...' : 'Start a new session to chat...')}
            value={input} onChange={e => { setInput(e.target.value); resize() }}
            onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            disabled={!session || isTyping || selectedModel === 'off'} rows={1} />
          <button 
            className="premium-gradient"
            style={{ 
              width:'40px', 
              height:'40px', 
              flexShrink:0, 
              border:'none', 
              borderRadius:'14px', 
              color:'var(--bg)', 
              display:'flex', 
              alignItems:'center', 
              justifyContent:'center', 
              boxShadow: '0 5px 15px rgba(99,102,241,0.2)',
              transition: 'all 0.3s',
              opacity: (!input.trim()||isTyping||!session||selectedModel === 'off')?0.4:1,
              cursor: (!input.trim()||isTyping||!session||selectedModel === 'off')?'default':'pointer'
            }}
            onClick={() => send()} disabled={!input.trim()||isTyping||!session||selectedModel === 'off'}
            onMouseEnter={e => !isTyping && input.trim() && (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
        <div style={{ fontSize:'11px', color:'var(--text3)', textAlign:'center', marginTop:'12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.6 }}>
          Shift + Enter for new line • Personalised by your profile
        </div>
      </div>
    </div>
  )
}

export default ChatArea
