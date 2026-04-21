import { useState, useEffect } from 'react';
import { api } from '../api';
import dashboardImg from '../assets/dashboard.png';
import chatImg from '../assets/chat.png';
import roadmapImg from '../assets/roadmap.png';

// Fix for ReferenceError: define illustration makers
function makeIllustration(color1, color2, color3) {
  return `data:image/svg+xml;base64,${btoa(`
    <svg viewBox="0 0 300 240" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g1" cx="30%" cy="20%" r="60%">
          <stop offset="0%" stop-color="${color1}80"/>
          <stop offset="50%" stop-color="${color2}60"/>
          <stop offset="100%" stop-color="${color3}40"/>
        </radialGradient>
        <radialGradient id="g2" cx="70%" cy="80%" r="50%">
          <stop offset="0%" stop-color="${color2}70"/>
          <stop offset="70%" stop-color="${color3}50"/>
          <stop offset="100%" stop-color="${color1}20"/>
        </radialGradient>
      </defs>
      <rect width="300" height="240" fill="#1a1a1a" rx="24"/>
      <circle cx="90" cy="60" r="80" fill="url(#g1)" opacity="0.9"/>
      <circle cx="210" cy="160" r="60" fill="url(#g2)" opacity="0.8"/>
      <path d="M50 180 Q150 220 250 180" stroke="${color1}" stroke-width="3" fill="none" opacity="0.7"/>
      <text x="150" y="220" text-anchor="middle" fill="${color1}DD" font-size="20" font-family="sans-serif" font-weight="bold">AI</text>
    </svg>
  `).replace(/=/g, '%3D')}`;
}

function makeSceneIllustration() {
  return `data:image/svg+xml;base64,${btoa(`
    <svg viewBox="0 0 300 240" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="240" fill="#1a1a1a" rx="24"/>
      <circle cx="80" cy="80" r="40" fill="#D4A85340"/>
      <circle cx="220" cy="70" r="30" fill="#7A9A6A40"/>
      <rect x="50" y="140" width="80" height="60" rx="8" fill="#C4633A30"/>
      <rect x="170" y="130" width="70" height="70" rx="10" fill="#D4A85330"/>
      <path d="M30 200 L150 190 L270 205" stroke="#D4A853CC" stroke-width="2" fill="none"/>
      <text x="150" y="225" text-anchor="middle" fill="#D4A853DD" font-size="18" font-family="sans-serif">Scene</text>
    </svg>
  `).replace(/=/g, '%3D')}`;
}

function makeChatIllustration() {
  return `data:image/svg+xml;base64,${btoa(`
    <svg viewBox="0 0 300 240" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="240" fill="#1a1a1a" rx="24"/>
      <rect x="40" y="40" width="220" height="160" rx="16" fill="#252525" stroke="#D4A85340" stroke-width="2"/>
      <circle cx="80" cy="80" r="8" fill="#7A9A6A"/>
      <circle cx="100" cy="85" r="6" fill="#C4633A"/>
      <path d="M80 110 Q110 130 140 110" stroke="#D4A853" stroke-width="3" stroke-linecap="round" fill="none"/>
      <rect x="200" y="100" width="60" height="30" rx="12" fill="#D4A85320"/>
      <rect x="160" y="160" width="80" height="25" rx="10" fill="#7A9A6A20"/>
      <text x="150" y="225" text-anchor="middle" fill="#D4A853DD" font-size="20" font-family="sans-serif" font-weight="bold">Chat</text>
    </svg>
  `).replace(/=/g, '%3D')}`;
}

const featureCards = [
  {
    title: 'Resume-to-Profile Guidance',
    text: 'Upload a resume, capture skills automatically, and turn scattered experience into a career profile the AI can actually use.',
  },
  {
    title: 'Personalised Career Conversations',
    text: 'Get advice that reflects your role, goals, location, projects, and strengths instead of generic one-size-fits-all answers.',
  },
  {
    title: 'Actionable Growth Plans',
    text: 'From skill-gap analysis to interview preparation and transition strategy, each chat is designed to move you toward the next step.',
  },
]

const journeySteps = [
  'Create your account in seconds',
  'Fill your profile or upload your resume',
  'Ask career questions and get tailored guidance',
  'Build a roadmap for roles, skills, and opportunities',
]

const insightChips = ['Resume-aware AI', 'Skill extraction', 'Role-fit guidance', 'Interview prep', 'Growth roadmap']
const profileIllustration = makeIllustration('#D4A853', '#7A9A6A', '#C4633A')
const roadmapIllustration = makeIllustration('#C4633A', '#D4A853', '#7A9A6A')
const heroSceneIllustration = makeSceneIllustration()
const chatIllustration = makeChatIllustration()

export default function AuthPage({ onAuth }) {
  const [showAuth, setShowAuth] = useState(false)
  const [mode, setMode] = useState('register')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isHover, setIsHover] = useState(false)
  const [autoPlay, setAutoPlay] = useState(true)

const carouselSlides = [
    { img: dashboardImg, label: 'Dashboard Overview' },
    { img: chatImg, label: 'Live Career Chat' },
    { img: roadmapImg, label: 'Visual Roadmap' },
  ]

  useEffect(() => {
    if (!autoPlay || isHover) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselSlides.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [autoPlay, isHover, carouselSlides.length])

  const scrollToPreview = () => {
    const previewElement = document.querySelector('[data-preview-stack]')
    if (previewElement) {
      previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  async function handleSubmit() {
    setLoading(true)
    setError('')
    try {
      let user
      if (mode === 'login') {
        if (!email.trim()) return setError('Please enter your email.')
        user = await api.getUserByEmail(email.trim())
      } else {
        if (!name.trim() || !email.trim()) return setError('Please fill in all fields.')
        user = await api.createUser(name.trim(), email.trim())
      }
      localStorage.setItem('userId', user.id)
      localStorage.setItem('userName', user.name)
      onAuth(user)
    } catch (e) {
      setError(
        e.message.includes('already')
          ? 'Email already registered. Try login.'
          : e.message.includes('not found')
            ? 'User not found. Try register.'
            : 'Cannot connect to server.'
      )
    } finally {
      setLoading(false)
    }
  }

  const isRegister = mode === 'register'
  const btnText = loading ? (isRegister ? 'Creating...' : 'Logging in...') : (isRegister ? 'Sign Up' : 'Log In')

  function openAuth(nextMode) {
    setMode(nextMode)
    setShowAuth(true)
  }

  const s = {
    page: {
      minHeight: '100vh',
      background:
        'radial-gradient(circle at 10% 0%, rgba(212,168,83,0.22), transparent 24%), radial-gradient(circle at 88% 10%, rgba(196,99,58,0.14), transparent 20%), radial-gradient(circle at 50% 100%, rgba(122,154,106,0.08), transparent 28%), linear-gradient(180deg, #141312 0%, #1a1a1a 32%, #171615 100%)',
      overflowY: 'auto',
    },
    shell: {
      width: '100%',
      minHeight: '100vh',
      padding: '28px',
      display: 'flex',
      flexDirection: 'column',
      gap: '28px',
      position: 'relative',
    },
    nav: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '16px',
      padding: '8px 2px',
    },
    brand: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      color: 'var(--text)',
    },
    logo: {
      width: '42px',
      height: '42px',
      borderRadius: '14px',
      background: 'linear-gradient(135deg, rgba(212,168,83,0.22), rgba(196,99,58,0.14))',
      border: '1px solid rgba(212,168,83,0.28)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--gold)',
      fontSize: '18px',
      boxShadow: '0 16px 36px rgba(0,0,0,0.24)',
    },
    navActions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
    ghostBtn: {
      padding: '10px 16px',
      background: 'rgba(255,255,255,0.02)',
      color: 'var(--text2)',
      border: '1px solid var(--border2)',
      borderRadius: '999px',
      fontSize: '13px',
      fontWeight: 500,
    },
    goldBtn: {
      padding: '10px 16px',
      background: 'var(--gold)',
      color: 'var(--bg)',
      border: 'none',
      borderRadius: '999px',
      fontSize: '13px',
      fontWeight: 700,
      boxShadow: '0 12px 30px rgba(212,168,83,0.18)',
    },
    heroGrid: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1fr)',
      gap: '28px',
      alignItems: 'stretch',
      flex: 1,
    },
    heroPanel: {
      border: '1px solid rgba(255,255,255,0.06)',
      background: 'linear-gradient(180deg, rgba(37,37,37,0.9), rgba(24,24,24,0.92))',
      borderRadius: '32px',
      padding: '36px',
      boxShadow: '0 32px 90px rgba(0,0,0,0.38)',
      position: 'relative',
      overflow: 'hidden',
    },
    heroGlow: {
      position: 'absolute',
      inset: 'auto -80px -120px auto',
      width: '280px',
      height: '280px',
      borderRadius: '999px',
      background: 'radial-gradient(circle, rgba(212,168,83,0.22), transparent 68%)',
      pointerEvents: 'none',
    },
    heroGlow2: {
      position: 'absolute',
      inset: '-80px auto auto -80px',
      width: '240px',
      height: '240px',
      borderRadius: '999px',
      background: 'radial-gradient(circle, rgba(196,99,58,0.12), transparent 70%)',
      pointerEvents: 'none',
    },
    heroTopGrid: {
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1.18fr) minmax(320px, 0.82fr)',
      gap: '24px',
      alignItems: 'start',
      position: 'relative',
      zIndex: 1,
    },
    authPanel: {
      border: '1px solid rgba(212,168,83,0.18)',
      background: 'linear-gradient(180deg, rgba(37,37,37,0.98), rgba(28,28,28,0.98))',
      borderRadius: '28px',
      padding: '28px',
      boxShadow: '0 28px 70px rgba(0,0,0,0.4)',
      alignSelf: 'start',
      position: 'sticky',
      top: '24px',
    },
    panelOverlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(10,9,8,0.72)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      zIndex: 40,
      animation: 'fadeIn 0.2s ease',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      borderRadius: '999px',
      border: '1px solid rgba(212,168,83,0.2)',
      background: 'rgba(212,168,83,0.08)',
      color: 'var(--gold)',
      fontSize: '11px',
      letterSpacing: '1.4px',
      textTransform: 'uppercase',
      fontWeight: 700,
      marginBottom: '18px',
    },
    statGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: '12px',
      marginTop: '24px',
    },
    statCard: {
      padding: '16px',
      borderRadius: '18px',
      border: '1px solid var(--border)',
      background: 'rgba(255,255,255,0.02)',
    },
    sectionTitle: {
      fontFamily: "'Cormorant Garamond',serif",
      fontSize: '54px',
      lineHeight: 1.05,
      color: 'var(--text)',
      fontWeight: 700,
      maxWidth: '700px',
      letterSpacing: '-0.5px',
    },
    body: {
      fontSize: '16px',
      color: 'var(--text2)',
      lineHeight: 1.8,
      maxWidth: '650px',
    },
    chipRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '10px',
      marginTop: '20px',
    },
    chip: {
      padding: '8px 12px',
      borderRadius: '999px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
      fontSize: '12px',
      color: 'var(--text2)',
    },
    cardRow: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: '14px',
      marginTop: '28px',
    },
    featureCard: {
      padding: '18px',
      borderRadius: '18px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(4px)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
    },
    previewStack: {
      display: 'grid',
      gap: '16px',
      position: 'relative',
      zIndex: 1,
      alignContent: 'start',
      dataPreviewStack: true,
    },
    previewCard: {
      padding: '18px',
      borderRadius: '22px',
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
      boxShadow: '0 18px 36px rgba(0,0,0,0.24)',
      width: '100%',
    },
    carouselMedia: {
      marginTop: '28px',
      minHeight: '420px',
      width: '100%',
      maxWidth: '640px',
      borderRadius: '32px',
      border: '1px solid rgba(255,255,255,0.12)',
      background: 'linear-gradient(145deg, rgba(255,255,255,0.06), rgba(255,255,255,0.01))',
      overflow: 'hidden',
      boxShadow: '0 32px 90px rgba(0,0,0,0.45)',
      position: 'relative',
      zIndex: 1,
    },
    slideWrapper: {
      position: 'relative',
      inset: 0,
      height: '100%',
      transition: 'opacity 0.6s ease',
    },
    mediaFrame: {
      padding: '24px',
      borderRadius: '32px',
      background: 'linear-gradient(145deg, rgba(37,37,37,0.9), rgba(20,20,20,0.9))',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
      height: '380px',
      width: '100%',
      maxWidth: '600px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      margin: '0 auto',
    },
    mediaImage: {
      width: '95%',
      height: '90%',
      objectFit: 'contain',
      objectPosition: 'center',
      borderRadius: '24px',
      border: '1px solid rgba(255,255,255,0.2)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      display: 'block',
      margin: '0 auto',
    },
    carouselOverlay: {
      position: 'absolute',
      inset: '18px 18px auto auto',
      padding: '8px 12px',
      borderRadius: '999px',
      background: 'rgba(10,9,8,0.62)',
      border: '1px solid rgba(255,255,255,0.08)',
      color: 'var(--text)',
      fontSize: '12px',
      fontWeight: 700,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.3s ease',
    },
    dotNav: {
      display: 'flex',
      gap: '10px',
      position: 'absolute',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
    },
    dot: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      background: 'rgba(255,255,255,0.3)',
      border: '1px solid rgba(255,255,255,0.2)',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    dotActive: {
      background: 'var(--gold)',
      boxShadow: '0 0 0 4px rgba(212,168,83,0.2)',
      transform: 'scale(1.2)',
    },
    scrollBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 20px',
      background: 'rgba(212,168,83,0.12)',
      color: 'var(--gold)',
      border: '1px solid rgba(212,168,83,0.3)',
      borderRadius: '999px',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
      marginTop: '20px',
      transition: 'all 0.3s ease',
    },
    previewMini: {
      display: 'grid',
      gap: '8px',
      marginTop: '14px',
    },
    previewLine: {
      height: '10px',
      borderRadius: '999px',
      background: 'linear-gradient(90deg, rgba(240,234,216,0.22), rgba(240,234,216,0.06))',
    },
    previewBadgeRow: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginTop: '14px',
    },
    previewBadge: {
      padding: '7px 10px',
      borderRadius: '999px',
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
      color: 'var(--text2)',
      fontSize: '11px',
      fontWeight: 600,
    },
    messageStack: {
      display: 'grid',
      gap: '10px',
      marginTop: '16px',
    },
    messageBubble: {
      padding: '12px 14px',
      borderRadius: '16px',
      fontSize: '13px',
      lineHeight: 1.6,
      maxWidth: '88%',
    },
    previewKpiGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: '10px',
      marginTop: '16px',
    },
    previewKpiCard: {
      padding: '12px',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'rgba(255,255,255,0.03)',
    },
    visualGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
    },
    pictureCard: {
      borderRadius: '22px',
      border: '1px solid rgba(255,255,255,0.08)',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
      overflow: 'hidden',
      boxShadow: '0 18px 36px rgba(0,0,0,0.2)',
    },
    pictureMeta: {
      padding: '14px 16px 16px',
    },
    pictureLabel: {
      fontSize: '11px',
      color: 'var(--gold)',
      letterSpacing: '1.2px',
      textTransform: 'uppercase',
      marginBottom: '6px',
      fontWeight: 700,
    },
    pictureTitle: {
      fontSize: '14px',
      color: 'var(--text)',
      fontWeight: 700,
      marginBottom: '4px',
    },
    pictureText: {
      fontSize: '12px',
      color: 'var(--text2)',
      lineHeight: 1.6,
    },
    stepList: {
      marginTop: '28px',
      display: 'grid',
      gap: '10px',
    },
    stepItem: {
      display: 'flex',
      gap: '12px',
      alignItems: 'center',
      padding: '12px 14px',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(0,0,0,0.12)',
      color: 'var(--text)',
      fontSize: '14px',
    },
    stepPill: {
      width: '28px',
      height: '28px',
      borderRadius: '999px',
      background: 'rgba(212,168,83,0.14)',
      color: 'var(--gold)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 700,
      flexShrink: 0,
    },
    tabs: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
      padding: '6px',
      borderRadius: '16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid var(--border)',
      marginBottom: '22px',
    },
    tab: {
      padding: '11px 8px',
      background: 'transparent',
      border: 'none',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: 600,
      color: 'var(--text2)',
    },
    activeTab: {
      background: 'rgba(212,168,83,0.14)',
      color: 'var(--gold)',
    },
    label: {
      display: 'block',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '1.5px',
      textTransform: 'uppercase',
      color: 'var(--text2)',
      marginBottom: '6px',
    },
    input: {
      width: '100%',
      padding: '12px 14px',
      background: 'var(--surface2)',
      border: '1px solid var(--border2)',
      borderRadius: '14px',
      fontSize: '14px',
      color: 'var(--text)',
      outline: 'none',
      marginBottom: '16px',
    },
    formBtn: {
      width: '100%',
      padding: '13px',
      background: 'var(--gold)',
      color: 'var(--bg)',
      border: 'none',
      borderRadius: '14px',
      fontSize: '14px',
      fontWeight: 700,
      boxShadow: '0 16px 32px rgba(212,168,83,0.16)',
    },
  }

  return (
    <div style={s.page}>
      <div style={s.shell}>
        <div style={s.nav}>
          <div style={s.brand}>
            <div style={s.logo}>✦</div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>Pathfinder AI</div>
              <div style={{ fontSize: '12px', color: 'var(--text3)' }}>Career guidance with resume-aware AI</div>
            </div>
          </div>
          <div style={s.navActions}>
            <button style={s.ghostBtn} onClick={() => openAuth('login')}>Log In</button>
            <button style={s.goldBtn} onClick={() => openAuth('register')}>Get Started</button>
          </div>
        </div>

        <div style={s.heroGrid}>
          <div style={s.heroPanel}>
            <div style={s.heroGlow} />
            <div style={s.heroGlow2} />
            <div style={s.heroTopGrid}>
              <div>
            <div style={s.badge}>Career Counselling Platform</div>
            <h1 style={s.sectionTitle}>Turn resumes, skills, and career goals into a sharper next move.</h1>
            <p style={{ ...s.body, marginTop: '16px' }}>
              Pathfinder AI helps clients understand what they do, where they fit, and what to do next.
              It reads profile details, uses resume context, and turns vague career questions into focused,
              personalised advice.
            </p>
            <div style={s.chipRow}>
              {insightChips.map(chip => <div key={chip} style={s.chip}>{chip}</div>)}
            </div>

            <div 
              style={s.carouselMedia}
              onMouseEnter={() => { setIsHover(true); setAutoPlay(false) }}
              onMouseLeave={() => { setIsHover(false); setAutoPlay(true) }}
            >
              <div style={s.mediaFrame}>
                <img
                  src={carouselSlides[currentSlide].img}
                  alt={carouselSlides[currentSlide].label}
                  style={s.mediaImage}
                />
              </div>
              <div style={s.carouselOverlay}>
                <span style={{ width: '10px', height: '10px', borderRadius: '999px', background: 'var(--gold)', boxShadow: '0 0 0 4px rgba(212,168,83,0.14)' }} />
                {carouselSlides[currentSlide].label}
              </div>
              <div style={s.dotNav}>
                {carouselSlides.map((_, index) => (
                  <div
                    key={index}
                    style={{
                      ...s.dot,
                      ...(index === currentSlide ? s.dotActive : {}),
                    }}
                    onClick={() => setCurrentSlide(index)}
                  />
                ))}
              </div>
            </div>

            <button style={s.scrollBtn} onClick={scrollToPreview}>
              AI Workflow Preview ➤
            </button>

              </div>
              <div style={s.previewStack} data-preview-stack>
                <div style={s.previewCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: 'var(--gold)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '4px' }}>Personalised Insight</div>
                      <div style={{ fontSize: '18px', color: 'var(--text)', fontWeight: 700 }}>Career Snapshot</div>
                    </div>
                    <div style={{ padding: '8px 10px', borderRadius: '999px', background: 'rgba(122,154,106,0.14)', color: 'var(--sage)', fontSize: '11px', fontWeight: 700 }}>AI Ready</div>
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.75 }}>
                    "Based on your skills and resume context, you are a strong fit for ML, analytics, and applied AI roles."
                  </div>
                  <div style={s.previewBadgeRow}>
                    {['ML Engineer', 'Data Analyst', 'AI Projects'].map(item => (
                      <div key={item} style={s.previewBadge}>{item}</div>
                    ))}
                  </div>
                </div>
                <div style={s.previewCard}>
                  <div style={{ fontSize: '12px', color: 'var(--gold)', letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: '8px' }}>Inside The Session</div>
                  <div style={s.messageStack}>
                    <div style={{ ...s.messageBubble, background: 'rgba(212,168,83,0.14)', color: 'var(--text)', justifySelf: 'end' }}>
                      Which roles fit my resume best?
                    </div>
                    <div style={{ ...s.messageBubble, background: 'rgba(255,255,255,0.04)', color: 'var(--text2)' }}>
                      Your strongest fits are AI/ML Engineer, Data Analyst, and Applied Python Developer based on your projects and technical stack.
                    </div>
                    <div style={{ ...s.messageBubble, background: 'rgba(255,255,255,0.04)', color: 'var(--text2)' }}>
                      I can also build a 30-day roadmap for skills, projects, and interview prep.
                    </div>
                  </div>
                </div>
                <div style={s.visualGrid}>
                  <div style={s.pictureCard}>
                    <img src={profileIllustration} alt="Profile intelligence preview" style={{ display: 'block', width: '100%', aspectRatio: '1.25', objectFit: 'cover' }} />
                    <div style={s.pictureMeta}>
                      <div style={s.pictureLabel}>Profile View</div>
                      <div style={s.pictureLabel}>Resume to profile</div>
                      <div style={s.pictureText}>Structured strengths, extracted skills, and role context in one place.</div>
                    </div>
                  </div>
                  <div style={s.pictureCard}>
                    <img src={roadmapIllustration} alt="Career roadmap preview" style={{ display: 'block', width: '100%', aspectRatio: '1.25', objectFit: 'cover' }} />
                    <div style={s.pictureMeta}>
                      <div style={s.pictureLabel}>Roadmap View</div>
                      <div style={s.pictureTitle}>Guided next steps</div>
                      <div style={s.pictureText}>See how skill growth, role-fit, and action plans connect visually.</div>
                    </div>
                  </div>
                </div>
                <div style={s.previewKpiGrid}>
                  <div style={s.previewKpiCard}>
                    <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1.1px', marginBottom: '4px' }}>Profile match</div>
                    <div style={{ fontSize: '18px', color: 'var(--text)', fontWeight: 700 }}>89%</div>
                  </div>
                  <div style={s.previewKpiCard}>
                    <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1.1px', marginBottom: '4px' }}>Skills found</div>
                    <div style={{ fontSize: '18px', color: 'var(--text)', fontWeight: 700 }}>14</div>
                  </div>
<div style={s.previewKpiCard} >
                    <div style={{ fontSize: '10px', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '1.1px', marginBottom: '4px' }}>Next steps</div>
                    <div style={{ fontSize: '18px', color: 'var(--text)', fontWeight: 700 }}>3</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={s.statGrid}>
              <div style={s.statCard}>
                <div style={{ color: 'var(--gold)', fontSize: '24px', fontWeight: 700, marginBottom: '6px' }} >1</div>
                <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 }}>Build a profile with role, education, goals, and skills.</div>
              </div>
              <div style={s.statCard}>
                <div style={{ color: 'var(--gold)', fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>2</div>
                <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 }}>Upload a resume and let the system extract strengths and context.</div>
              </div>
              <div style={s.statCard}>
                <div style={{ color: 'var(--gold)', fontSize: '24px', fontWeight: 700, marginBottom: '6px' }}>3</div>
                <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.5 }}>Ask anything about jobs, skills, transitions, interviews, or growth.</div>
              </div>
            </div>

            <div style={s.cardRow}>
              {featureCards.map(card => (
                <div key={card.title} style={s.featureCard}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>{card.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.7 }}>{card.text}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '34px', maxWidth: '640px', position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '12px', color: 'var(--gold)', letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: '10px', fontWeight: 700 }}>
                What Clients See First
              </div>
              <div style={s.stepList}>
                {journeySteps.map((step, index) => (
                  <div key={step} style={s.stepItem}>
                    <div style={s.stepPill}>{index + 1}</div>
                    <div>{step}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '34px', display: 'flex', gap: '12px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
              <button style={{ ...s.goldBtn, padding: '12px 18px' }} onClick={() => openAuth('register')}>Get Started</button>
              <button style={{ ...s.ghostBtn, padding: '12px 18px' }} onClick={() => openAuth('login')}>Log In</button>
            </div>
          </div>
        </div>
      </div>

      {showAuth && (
        <div style={s.panelOverlay} onClick={e => e.target === e.currentTarget && setShowAuth(false)}>
          <div style={{ ...s.authPanel, width: '100%', maxWidth: '460px', position: 'relative', top: 'auto', alignSelf: 'auto' }}>
            <button
              onClick={() => setShowAuth(false)}
              style={{ position: 'absolute', top: '14px', right: '14px', width: '34px', height: '34px', borderRadius: '999px', border: '1px solid var(--border2)', background: 'rgba(255,255,255,0.03)', color: 'var(--text2)', fontSize: '16px' }}
            >
              ×
            </button>
            <div style={{ fontSize: '28px', color: 'var(--gold)', marginBottom: '16px' }}>⬢</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '28px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
              {isRegister ? 'Create Your Account' : 'Welcome Back'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text2)', lineHeight: 1.7, marginBottom: '18px' }}>
              {isRegister
                ? 'Start with a profile, upload your resume, and get tailored career guidance from your first session.'
                : 'Log in to continue your career planning sessions and saved guidance.'}
            </p>

            <div style={s.tabs}>
              <button style={{ ...s.tab, ...(isRegister ? s.activeTab : {}) }} onClick={() => setMode('register')}>Sign Up</button>
              <button style={{ ...s.tab, ...(!isRegister ? s.activeTab : {}) }} onClick={() => setMode('login')}>Log In</button>
            </div>

            {error && (
              <div style={{ background: 'rgba(196,99,58,0.1)', border: '1px solid rgba(196,99,58,0.3)', color: 'var(--rust)', padding: '10px 14px', borderRadius: '14px', fontSize: '13px', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            {isRegister && (
              <>
                <label style={s.label}>Full Name</label>
                <input
                  style={s.input}
                  placeholder="e.g. Deepak Kumar"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                />
              </>
            )}

            <label style={s.label}>Email Address</label>
            <input
              style={s.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />

            <button style={{ ...s.formBtn, opacity: loading ? 0.7 : 1 }} onClick={handleSubmit} disabled={loading}>
              {btnText}
            </button>

            <div style={{ marginTop: '18px', paddingTop: '18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '8px' }}>Inside the platform you can:</div>
              <div style={{ display: 'grid', gap: '8px' }}>
                {['Save profile details', 'Upload resume for skill extraction', 'Ask personalised career questions'].map(item => (
                  <div key={item} style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '13px', color: 'var(--text2)' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: 'var(--gold)', boxShadow: '0 0 0 4px rgba(212,168,83,0.08)' }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
