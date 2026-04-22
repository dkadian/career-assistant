import { useState, useEffect, useCallback } from 'react'
import { api } from './api'
import AuthPage from './components/AuthPage'
import ProfileModal from './components/ProfileModal'
import Sidebar from './components/Sidebar'
import ChatArea from './components/ChatArea.jsx'

export default function App() {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [messages, setMessages] = useState([])
  const [showProfile, setShowProfile] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') !== 'light')

  useEffect(() => {
    const userId = localStorage.getItem('userId')
    const userName = localStorage.getItem('userName')
    if (userId && userName) {
      const u = { id: userId, name: userName }
      setUser(u)
      loadSessions(userId)
      loadProfile(userId)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.body.classList.remove('light-mode')
      localStorage.setItem('theme', 'dark')
    } else {
      document.body.classList.add('light-mode')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  const toggleTheme = () => setDarkMode(!darkMode)

  async function loadSessions(userId) {
    try { const data = await api.getSessions(userId); setSessions(data) } catch (e) {}
  }

  const refreshSessions = useCallback(() => {
    if (user) loadSessions(user.id)
  }, [user])
  async function loadProfile(userId) {
    try { const data = await api.getProfile(userId); setProfile(data) } catch (e) {}
  }
  async function handleAuth(userData) {
    setUser(userData)
    await Promise.all([loadSessions(userData.id), loadProfile(userData.id)])
    setShowProfile(true)
  }
  async function handleNewSession() {
    if (!user) return
    try {
      const session = await api.createSession(user.id)
      setSessions(prev => [session, ...prev])
      setActiveSession(session)
      setMessages([])
      setRefreshKey(k => k + 1)
    } catch (e) {}
  }
  async function handleSelectSession(sessionId) {
    try {
      const session = await api.getSession(sessionId)
      setActiveSession(session)
      setMessages(session.messages || [])
    } catch (e) {}
  }
  async function handleRenameSession(sessionId, newTitle) {
    try {
      const updated = await api.updateSession(sessionId, newTitle)
      setSessions(prev => prev.map(s => s.id === sessionId ? updated : s))
      if (activeSession?.id === sessionId) setActiveSession(updated)
    } catch (e) {}
  }
  async function handleDeleteSession(sessionId) {
    try {
      await api.deleteSession(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      if (activeSession?.id === sessionId) { setActiveSession(null); setMessages([]) }
    } catch (e) {}
  }

  function handleLogout() {
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    setUser(null)
    setSessions([])
    setActiveSession(null)
    setMessages([])
    setProfile(null)
  }

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div style={{ width: '32px', height: '32px', border: '2px solid var(--border)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)', position: 'relative' }}>
      {!user ? (
        <AuthPage onAuth={handleAuth} darkMode={darkMode} toggleTheme={toggleTheme} />
      ) : (
        <>
          {showProfile && <ProfileModal profile={profile} userId={user.id} onSave={p => { setProfile(p); setShowProfile(false) }} onClose={() => setShowProfile(false)} />}
          <Sidebar 
            user={user} 
            profile={profile} 
            sessions={sessions} 
            activeSessionId={activeSession?.id}
            darkMode={darkMode}
            toggleTheme={toggleTheme}
            onNewSession={handleNewSession} 
            onSelectSession={handleSelectSession}
            onEditProfile={() => setShowProfile(true)} 
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            onLogout={handleLogout} 
          />
          <ChatArea key={refreshKey} user={user} session={activeSession} messages={messages} setMessages={setMessages}
            onSessionsRefresh={refreshSessions} onRenameSession={handleRenameSession} />
        </>
      )}
    </div>
  )
}
