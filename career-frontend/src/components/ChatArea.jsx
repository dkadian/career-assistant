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
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/(<br\s*\/?>)/gi, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/:--+\s*$/gm, ':')
    .replace(/\|\s*[-:]+\s*\|/g, match => `\n${match}\n`)
    .replace(/(\|[^\n]+\|)(?=\|)/g, '$1\n')
    .replace(/\n{3,}/g, '\n\n')

  const lines = cleaned.split('\n')
  const normalized = []

  for (let rawLine of lines) {
    let line = rawLine.trim()

    if (!line || /^([*-]|\|\*)$/.test(line)) {
      continue
    }

    line = line
      .replace(/^\*\s*(Week|Phase|Month|Step)\b\s*/i, '## $1 ')
      .replace(/^\*\s*(Video|Tip|Tips|Example|Examples|Resources|Next Steps|Roadmap)\b:?\s*$/i, '### $1')
      .replace(/^\s*[*-]?\s*o\s*[*-]?\s*\*?([^*\n:][^:\n]*):\*?\s*$/i, '- **$1:**')
      .replace(/^\s*[*-]\s*\*?([^*\n:][^:\n]*):\*?\s*$/i, '- **$1:**')
      .replace(/^\s*\d+\.\s+\*(.+?)\*?\s*$/i, (_, textPart) => `1. **${textPart.trim()}**`)
      .replace(/(^|[\s(])\*([A-Za-z][A-Za-z0-9/+.# -]{1,40})\*(?=$|[\s),.:;!?])/g, '$1**$2**')
      .replace(/(^|[\s(])\*([A-Za-z][A-Za-z0-9/+.# -]{1,40})(?=$|[\s),.:;!?])/g, '$1$2')
      .replace(/(^|[\s(])([A-Za-z][A-Za-z0-9/+.# -]{1,40})\*(?=$|[\s),.:;!?])/g, '$1$2')

    const shouldMergeIntoPrevious =
      normalized.length > 0 &&
      /^[-*]\s+(to|and|or|for|with|together|plus)\b/i.test(line) &&
      !/^[-*]\s+\*\*/.test(normalized[normalized.length - 1]) &&
      !/^(#{1,3}|\d+\.)\s/.test(normalized[normalized.length - 1])

    if (shouldMergeIntoPrevious) {
      normalized[normalized.length - 1] += ' ' + line.replace(/^[-*]\s+/, '')
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

export default function ChatArea({ user, session, messages, setMessages, onSessionsRefresh }) {
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
  const endRef = useRef(null)
  const taRef = useRef(null)
  const initials = (user?.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  function resize() {
    const t = taRef.current; if (!t) return
    t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 140) + 'px'
  }

  async function send(text) {
    const msg = (text || input).trim()
    if (!msg || isTyping || !session) return
    setInput(''); if (taRef.current) taRef.current.style.height = 'auto'
    const userMsg = { role:'user', content:msg, created_at: new Date().toISOString(), id:'tmp-'+Date.now() }
    setMessages(prev => [...prev, userMsg])
    setIsTyping(true)
    try {
      const streamRes = await api.sendMessage(session.id, user.id, msg, true)
      const asstMsg = { role:'assistant', content:'', created_at: new Date().toISOString(), id:'tmp-asst-'+Date.now() }
      setMessages(prev => [...prev, asstMsg])
      
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
              const delta = data
              if (delta) {
                fullReply += delta
                setMessages(prev => prev.map(m => m.id === asstMsg.id ? { ...m, content: fullReply } : m))
              }
            }
          }

          if (done) {
            if (buffer.startsWith('data: ')) {
              const data = buffer.slice(6)
              if (data && data !== '[DONE]') {
                fullReply += data
                setMessages(prev => prev.map(m => m.id === asstMsg.id ? { ...m, content: fullReply } : m))
              }
            }
            break
          }
        }
      } finally {
        reader.releaseLock()
      }
      onSessionsRefresh()
    } catch(e) {
      setMessages(prev => prev.slice(0, -1).concat({ role:'assistant', content: 'Error: ' + e.message, created_at: new Date().toISOString(), id:'err-'+Date.now() }))
    } finally { 
      setIsTyping(false) 
    }
  }

    const h = new Date().getHours()
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'

  useEffect(() => {
    // Force refresh on AI response to fix markdown rendering
    setRefreshKey(Date.now())
  }, [messages.length])

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden' }}>
      <div style={{ padding:'20px 32px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'var(--surface)' }}>
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'20px', fontWeight:600, color:'var(--text)' }}>{session ? session.title : greeting + ', ' + (user?.name?.split(' ')[0]||'')}</div>
          <div style={{ fontSize:'12px', color:'var(--text2)', marginTop:'2px' }}>{session ? messages.length + ' messages' : 'Your personal career counsellor'}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'var(--sage)', background:'rgba(122,154,106,0.08)', border:'1px solid rgba(122,154,106,0.2)', padding:'5px 12px', borderRadius:'20px' }}>
          <span style={{ display:'inline-block', width:'6px', height:'6px', background:'var(--sage)', borderRadius:'50%', animation:'pulse 2s infinite' }} />
          AI Online
        </div>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:'28px 32px', display:'flex', flexDirection:'column', gap:'20px' }}>
        {!session || messages.length === 0 ? (
          <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'40px 20px', animation:'fadeUp 0.5s ease both' }}>
            <div style={{ fontSize:'40px', marginBottom:'20px', width:'72px', height:'72px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:'20px', display:'flex', alignItems:'center', justifyContent:'center' }}>🧭</div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'28px', fontWeight:600, color:'var(--text)', lineHeight:1.25, marginBottom:'12px' }}>Where would you like your career to go?</h2>
            <p style={{ fontSize:'14px', color:'var(--text2)', maxWidth:'380px', lineHeight:1.7, marginBottom:'32px' }}>I am here to guide your professional journey from career pivots to salary negotiations.</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', width:'100%', maxWidth:'460px' }}>
              {SUGGESTIONS.map(sg => (
                <button key={sg.label} style={{ padding:'12px 14px', background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text)', fontSize:'13px', textAlign:'left', display:'flex', alignItems:'center', gap:'8px', lineHeight:1.4 }} onClick={() => send(sg.msg)}>
                  <span style={{ fontSize:'16px', flexShrink:0 }}>{sg.icon}</span>{sg.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={msg.id||i} style={{ display:'flex', gap:'10px', alignItems:'flex-end', justifyContent: msg.role==='user' ? 'flex-end' : 'flex-start', animation:'fadeUp 0.3s ease both' }}>
                {msg.role==='assistant' && <div style={{ width:'30px', height:'30px', borderRadius:'50%', flexShrink:0, background:'var(--surface2)', border:'1px solid var(--border2)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Cormorant Garamond',serif", fontSize:'14px', color:'var(--gold)' }}>P</div>}
                <div style={{ display:'flex', flexDirection:'column', gap:'4px', maxWidth:'75%' }}>
                  <div style={{ padding:'12px 16px', borderRadius:'14px', fontSize:'14px', lineHeight:1.7, ...(msg.role==='user' ? { borderBottomRightRadius:'4px', background:'var(--gold)', color:'var(--bg)' } : { borderBottomLeftRadius:'4px', background:'var(--surface2)', border:'1px solid var(--border)', color:'var(--text)' }) }}>
{msg.role==='assistant' ? (
                      <ReactMarkdown key={refreshKey + msg.content.slice(0,10)} remarkPlugins={[remarkGfm]} components={markdownComponents}>
                        {normalizeMarkdown(msg.content)}
                      </ReactMarkdown>
                    ) : msg.content}
                  </div>
                  <div style={{ fontSize:'10px', color:'var(--text3)', padding:'0 4px', textAlign: msg.role==='user' ? 'right' : 'left' }}>
                    {new Date(msg.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                  </div>
                </div>
                {msg.role==='user' && <div style={{ width:'30px', height:'30px', borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg,var(--gold),var(--rust))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'11px', fontWeight:600, color:'var(--bg)' }}>{initials}</div>}
              </div>
            ))}
            </>
        )}
        <div ref={endRef} />
      </div>
      <div style={{ padding:'16px 32px 24px', borderTop:'1px solid var(--border)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'flex-end', gap:'10px', background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:'var(--radius)', padding:'10px 12px' }}>
          <textarea ref={taRef} style={{ flex:1, border:'none', outline:'none', background:'transparent', color:'var(--text)', fontSize:'14px', lineHeight:1.6, resize:'none', minHeight:'22px', maxHeight:'140px' }}
            placeholder={session ? 'Ask me anything about your career...' : 'Click New Session to start...'}
            value={input} onChange={e => { setInput(e.target.value); resize() }}
            onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            disabled={!session || isTyping} rows={1} />
          <button style={{ width:'34px', height:'34px', flexShrink:0, background:'var(--gold)', border:'none', borderRadius:'8px', color:'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', opacity:(!input.trim()||isTyping||!session)?0.4:1 }}
            onClick={() => send()} disabled={!input.trim()||isTyping||!session}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
        <div style={{ fontSize:'11px', color:'var(--text3)', textAlign:'center', marginTop:'8px' }}>Enter to send · Shift+Enter for new line</div>
      </div>
    </div>
  )
}
