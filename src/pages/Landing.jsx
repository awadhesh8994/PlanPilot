import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

/* ─── Inject fonts + global styles ─────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cyan: #00f0ff;
    --purple: #b400ff;
    --bg: #04060f;
    --surface: rgba(255,255,255,0.03);
    --border: rgba(0,240,255,0.12);
  }

  html { scroll-behavior: smooth; }
  body {
    background: var(--bg);
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    overflow-x: hidden;
    cursor: none;
  }
  ::selection { background: rgba(0,240,255,0.25); color: #fff; }

  /* scanlines */
  .scanline {
    position: fixed; inset: 0; pointer-events: none; z-index: 9999;
    background: repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px);
  }

  @keyframes rotateRing { to { transform: rotate(360deg); } }
  @keyframes counterRing { to { transform: rotate(-360deg); } }
  @keyframes floatY { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
  @keyframes fadeUp { from{opacity:0;transform:translateY(36px)} to{opacity:1;transform:none} }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
  @keyframes ripple { 0%{transform:translate(-50%,-50%) scale(0.85);opacity:0.7} 100%{transform:translate(-50%,-50%) scale(2.6);opacity:0} }
  @keyframes cursorAnim { 0%,100%{box-shadow:0 0 12px 3px rgba(0,240,255,0.7)} 50%{box-shadow:0 0 18px 5px rgba(180,0,255,0.7)} }
  @keyframes shimmer { from{background-position:-200% center} to{background-position:200% center} }
  @keyframes gridPan { 0%{background-position:0 0} 100%{background-position:72px 72px} }

  .reveal {
    opacity: 0;
    transform: translateY(44px);
    transition: opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1);
  }
  .reveal.visible { opacity: 1; transform: none; }

  .fcard {
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(0,240,255,0.1);
    border-radius: 22px;
    padding: 36px 30px;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(16px);
    transition: transform 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease;
    cursor: none;
  }
  .fcard::after {
    content:''; position:absolute; inset:0;
    background: linear-gradient(135deg, rgba(0,240,255,0.05), transparent 60%);
    opacity:0; transition: opacity 0.35s;
  }
  .fcard:hover {
    transform: translateY(-8px) scale(1.015);
    border-color: rgba(0,240,255,0.32);
    box-shadow: 0 0 50px rgba(0,240,255,0.08), 0 24px 60px rgba(0,0,0,0.5);
  }
  .fcard:hover::after { opacity:1; }

  .btn-p {
    display:inline-flex; align-items:center; gap:10px; justify-content:center;
    padding:15px 40px; border-radius:100px;
    border:1.5px solid var(--cyan);
    background:linear-gradient(135deg,rgba(0,240,255,0.1),rgba(180,0,255,0.07));
    color:var(--cyan);
    font-family:'Orbitron',monospace; font-size:12px; font-weight:700; letter-spacing:0.12em;
    cursor:none; transition:all 0.25s;
    box-shadow:0 0 22px rgba(0,240,255,0.2), inset 0 0 22px rgba(0,240,255,0.04);
  }
  .btn-p:hover {
    box-shadow:0 0 50px rgba(0,240,255,0.45),0 0 100px rgba(0,240,255,0.12),inset 0 0 30px rgba(0,240,255,0.1);
    transform:translateY(-3px) scale(1.02);
  }
  .btn-g {
    display:inline-flex; align-items:center; gap:8px;
    padding:15px 34px; border-radius:100px;
    border:1px solid rgba(255,255,255,0.14);
    background:transparent; color:rgba(255,255,255,0.55);
    font-family:'DM Sans',sans-serif; font-size:14px; font-weight:400;
    cursor:none; transition:all 0.25s;
  }
  .btn-g:hover { border-color:rgba(255,255,255,0.35); color:#fff; transform:translateY(-2px); }

  .tag {
    display:inline-flex; align-items:center; gap:7px;
    font-family:'Orbitron',monospace; font-size:9px; letter-spacing:0.22em;
    color:var(--cyan); border:1px solid rgba(0,240,255,0.22);
    padding:5px 15px; border-radius:100px;
  }
  .tag::before {
    content:''; width:5px; height:5px; background:var(--cyan);
    border-radius:50%; box-shadow:0 0 6px var(--cyan);
    animation: blink 1.6s ease-in-out infinite;
  }

  .neon-text {
    background: linear-gradient(270deg, var(--cyan), var(--purple), var(--cyan));
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: shimmer 4s linear infinite;
  }

  .step-line::after {
    content:''; display:block;
    width:1px; height:40px;
    background:linear-gradient(to bottom,rgba(0,240,255,0.3),transparent);
    margin:16px auto 0;
  }

  @media (max-width: 768px) {
    .feat-grid { grid-template-columns: 1fr !important; }
    .feat-grid > div { grid-column: auto !important; }
    .stats-grid { grid-template-columns: repeat(2,1fr) !important; }
    nav { padding: 16px 24px !important; }
  }
`

/* ─── Custom Cursor ─────────────────────────────────────────── */
function Cursor() {
  const dot = useRef(null)
  const ring = useRef(null)
  const pos = useRef({ x: -100, y: -100 })
  const rpos = useRef({ x: -100, y: -100 })

  useEffect(() => {
    const onMove = (e) => { pos.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMove)
    let raf
    const loop = () => {
      rpos.current.x += (pos.current.x - rpos.current.x) * 0.1
      rpos.current.y += (pos.current.y - rpos.current.y) * 0.1
      if (dot.current) { dot.current.style.left = pos.current.x + 'px'; dot.current.style.top = pos.current.y + 'px' }
      if (ring.current) { ring.current.style.left = rpos.current.x + 'px'; ring.current.style.top = rpos.current.y + 'px' }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf) }
  }, [])

  return (
    <>
      <div ref={dot} style={{ position:'fixed', width:6, height:6, background:'#00f0ff', borderRadius:'50%', pointerEvents:'none', zIndex:99999, transform:'translate(-50%,-50%)', boxShadow:'0 0 12px 3px rgba(0,240,255,0.9)' }} />
      <div ref={ring} style={{ position:'fixed', width:34, height:34, border:'1px solid rgba(0,240,255,0.5)', borderRadius:'50%', pointerEvents:'none', zIndex:99998, transform:'translate(-50%,-50%)', animation:'cursorAnim 2.5s ease-in-out infinite' }} />
    </>
  )
}

/* ─── HUD Cockpit Ring ──────────────────────────────────────── */
function HUDRing({ size = 600 }) {
  return (
    <svg viewBox="0 0 400 400" width={size} height={size}>
      {/* Tick marks outer */}
      {Array.from({ length: 36 }).map((_, i) => {
        const a = (i * 10 * Math.PI) / 180
        const r1 = 190, r2 = i % 9 === 0 ? 174 : i % 3 === 0 ? 180 : 184
        return <line key={i} x1={200 + r1 * Math.cos(a)} y1={200 + r1 * Math.sin(a)} x2={200 + r2 * Math.cos(a)} y2={200 + r2 * Math.sin(a)} stroke={i % 9 === 0 ? 'rgba(0,240,255,0.55)' : 'rgba(0,240,255,0.15)'} strokeWidth={i % 9 === 0 ? 2 : 0.8} />
      })}
      {/* Outer spinning ring */}
      <circle cx="200" cy="200" r="190" fill="none" stroke="rgba(0,240,255,0.1)" strokeWidth="1" strokeDasharray="5 4" style={{ animation:'rotateRing 60s linear infinite', transformOrigin:'200px 200px' }} />
      {/* Mid counter ring */}
      <circle cx="200" cy="200" r="155" fill="none" stroke="rgba(180,0,255,0.12)" strokeWidth="1" strokeDasharray="3 8" style={{ animation:'counterRing 30s linear infinite', transformOrigin:'200px 200px' }} />
      {/* Static ring */}
      <circle cx="200" cy="200" r="120" fill="none" stroke="rgba(0,240,255,0.18)" strokeWidth="1.5" />
      {/* Arc accent - glowing */}
      <path d="M200 80 A120 120 0 0 1 309 260" fill="none" stroke="url(#hudG)" strokeWidth="3" strokeLinecap="round" filter="url(#blur1)" />
      <path d="M200 80 A120 120 0 0 1 309 260" fill="none" stroke="url(#hudG)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Crosshair */}
      <line x1="200" y1="168" x2="200" y2="188" stroke="rgba(0,240,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="200" y1="212" x2="200" y2="232" stroke="rgba(0,240,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="168" y1="200" x2="188" y2="200" stroke="rgba(0,240,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="212" y1="200" x2="232" y2="200" stroke="rgba(0,240,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Center pip */}
      <circle cx="200" cy="200" r="3.5" fill="#00f0ff" filter="url(#blur1)" />
      {/* Corner brackets */}
      {[[170,170],[230,170],[170,230],[230,230]].map(([x,y],i)=>{
        const dx=i%2===0?8:-8, dy=i<2?8:-8
        return <g key={i}><line x1={x} y1={y} x2={x+dx} y2={y} stroke="rgba(0,240,255,0.4)" strokeWidth="1.5"/><line x1={x} y1={y} x2={x} y2={y+dy} stroke="rgba(0,240,255,0.4)" strokeWidth="1.5"/></g>
      })}
      <defs>
        <linearGradient id="hudG" x1="0%" y1="0%" x2="100%" y2="100%"><stop stopColor="#00f0ff"/><stop offset="1" stopColor="#b400ff"/></linearGradient>
        <filter id="blur1"><feGaussianBlur stdDeviation="3"/></filter>
      </defs>
    </svg>
  )
}

/* ─── Feature icons ─────────────────────────────────────────── */
const icons = {
  dashboard: (
    <svg viewBox="0 0 44 44" fill="none" width="38" height="38">
      <rect x="2" y="2" width="16" height="16" rx="3" stroke="#00f0ff" strokeWidth="1.4"/>
      <rect x="22" y="2" width="20" height="9" rx="3" stroke="#b400ff" strokeWidth="1.4"/>
      <rect x="22" y="14" width="20" height="4" rx="2" fill="rgba(0,240,255,0.1)" stroke="#00f0ff" strokeWidth="1"/>
      <rect x="2" y="22" width="40" height="20" rx="3" stroke="url(#dg)" strokeWidth="1.4"/>
      {[7,14,21,28,35].map((x,i)=><line key={i} x1={x} y1={38} x2={x} y2={38-(i===3?10:i===1?8:i===4?6:i===2?5:3)} stroke={i%2===0?'#00f0ff':'#b400ff'} strokeWidth="2.5" strokeLinecap="round"/>)}
      <circle cx="10" cy="10" r="4" stroke="#00f0ff" strokeWidth="1.4"/>
      <path d="M8.5 10l1.2 1.3L12 8.5" stroke="#00f0ff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <defs><linearGradient id="dg" x1="2" y1="22" x2="42" y2="42"><stop stopColor="#00f0ff"/><stop offset="1" stopColor="#b400ff"/></linearGradient></defs>
    </svg>
  ),
  tasks: (
    <svg viewBox="0 0 44 44" fill="none" width="38" height="38">
      <rect x="4" y="2" width="36" height="40" rx="5" stroke="url(#tg)" strokeWidth="1.4"/>
      <circle cx="11" cy="16" r="2.5" fill="#00f0ff" style={{filter:'drop-shadow(0 0 4px #00f0ff)'}}/>
      <line x1="17" y1="16" x2="36" y2="16" stroke="#00f0ff" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="11" cy="25" r="2.5" stroke="#b400ff" strokeWidth="1.4"/>
      <line x1="17" y1="25" x2="36" y2="25" stroke="rgba(255,255,255,0.25)" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="11" cy="34" r="2.5" stroke="rgba(255,255,255,0.18)" strokeWidth="1.4"/>
      <line x1="17" y1="34" x2="28" y2="34" stroke="rgba(255,255,255,0.12)" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="16" y1="8" x2="28" y2="8" stroke="#00f0ff" strokeWidth="2" strokeLinecap="round"/>
      <defs><linearGradient id="tg" x1="4" y1="2" x2="40" y2="42"><stop stopColor="#00f0ff"/><stop offset="1" stopColor="#b400ff"/></linearGradient></defs>
    </svg>
  ),
  habits: (
    <svg viewBox="0 0 44 44" fill="none" width="38" height="38">
      <circle cx="22" cy="22" r="17" stroke="rgba(0,240,255,0.2)" strokeWidth="1.4"/>
      <path d="M22 5 A17 17 0 0 1 36.7 30" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M36.7 30 A17 17 0 0 1 7.3 30" stroke="#b400ff" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M7.3 30 A17 17 0 0 1 22 5" stroke="rgba(0,240,255,0.2)" strokeWidth="1.2" strokeDasharray="3 3" strokeLinecap="round"/>
      <circle cx="22" cy="5" r="2.5" fill="#00f0ff" style={{filter:'drop-shadow(0 0 5px #00f0ff)'}}/>
      <circle cx="36.7" cy="30" r="2.5" fill="#00f0ff"/>
      <text x="16" y="26" fill="url(#hg)" fontSize="9" fontWeight="bold" fontFamily="Orbitron,monospace">75%</text>
      <defs><linearGradient id="hg" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#00f0ff"/><stop offset="1" stopColor="#b400ff"/></linearGradient></defs>
    </svg>
  ),
  pomodoro: (
    <svg viewBox="0 0 44 44" fill="none" width="38" height="38">
      <circle cx="22" cy="25" r="15" stroke="url(#pg)" strokeWidth="1.4"/>
      <path d="M22 10 A15 15 0 0 1 37 25" stroke="#b400ff" strokeWidth="2.8" strokeLinecap="round"/>
      <line x1="22" y1="25" x2="22" y2="13" stroke="#00f0ff" strokeWidth="2" strokeLinecap="round"/>
      <line x1="22" y1="25" x2="31" y2="19" stroke="#b400ff" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="22" cy="25" r="2.5" fill="url(#pg)"/>
      <line x1="18" y1="7" x2="26" y2="7" stroke="#00f0ff" strokeWidth="2" strokeLinecap="round"/>
      <line x1="22" y1="7" x2="22" y2="10" stroke="#00f0ff" strokeWidth="2"/>
      <defs><linearGradient id="pg" x1="7" y1="10" x2="37" y2="40"><stop stopColor="#00f0ff"/><stop offset="1" stopColor="#b400ff"/></linearGradient></defs>
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 44 44" fill="none" width="38" height="38">
      <circle cx="22" cy="22" r="6" stroke="#00f0ff" strokeWidth="1.4"/>
      <path d="M22 3v5M22 36v5M3 22h5M36 22h5M7.1 7.1l3.5 3.5M33.4 33.4l3.5 3.5M36.9 7.1l-3.5 3.5M10.6 33.4l-3.5 3.5" stroke="url(#sg)" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="22" cy="22" r="2.5" fill="#00f0ff" style={{filter:'drop-shadow(0 0 5px #00f0ff)'}}/>
      <defs><linearGradient id="sg" x1="3" y1="3" x2="41" y2="41"><stop stopColor="#00f0ff"/><stop offset="1" stopColor="#b400ff"/></linearGradient></defs>
    </svg>
  ),
}

const FEATURES = [
  { num:'01', label:'DASHBOARD', title:'Mission Control', desc:'Every metric, streak, and session unified in one command center. The full picture before you begin.', icon: icons.dashboard, span:'1 / span 5' },
  { num:'02', label:'TASKS', title:'Capture & Conquer', desc:'Smart task management with priorities, tags, and deadlines. Zero inbox anxiety. Total operational clarity.', icon: icons.tasks, span:'6 / span 7' },
  { num:'03', label:'HABITS', title:'Streak Intelligence', desc:'Build daily habits with visual progress rings. Compound consistency into unstoppable momentum.', icon: icons.habits, span:'1 / span 4' },
  { num:'04', label:'POMODORO', title:'Deep Work Engine', desc:'Precision-tuned focus sessions synced with your tasks. Enter the zone. Ship what matters.', icon: icons.pomodoro, span:'5 / span 4' },
  { num:'05', label:'SETTINGS', title:'Your Cockpit', desc:'Themes, preferences, and notifications — configure PlanPilot exactly how your brain works.', icon: icons.settings, span:'9 / span 4' },
]

/* ─── Scroll reveal ─────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const delay = parseFloat(e.target.dataset.delay || 0)
          setTimeout(() => e.target.classList.add('visible'), delay)
          io.unobserve(e.target)
        }
      })
    }, { threshold: 0.12 })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* ─── Landing Page ──────────────────────────────────────────── */
export default function Landing() {
  const navigate = useNavigate()
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 })
  useReveal()

  useEffect(() => {
    const style = document.createElement('style')
    style.id = 'planpilot-landing-css'
    style.textContent = GLOBAL_CSS
    document.head.appendChild(style)
    return () => document.getElementById('planpilot-landing-css')?.remove()
  }, [])

  useEffect(() => {
    const h = (e) => setMouse({ x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight })
    window.addEventListener('mousemove', h)
    return () => window.removeEventListener('mousemove', h)
  }, [])

  const px = (mouse.x - 0.5) * 28
  const py = (mouse.y - 0.5) * 18

  return (
    <div style={{ background:'#04060f', minHeight:'100vh', overflowX:'hidden' }}>
      <Cursor />
      <div className="scanline" />

      {/* ── NAV ──────────────────────────────────────────────── */}
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:1000,
        padding:'18px 52px', display:'flex', alignItems:'center', justifyContent:'space-between',
        borderBottom:'1px solid rgba(0,240,255,0.05)',
        backdropFilter:'blur(24px)', background:'rgba(4,6,15,0.75)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <svg viewBox="0 0 32 32" fill="none" width="28" height="28">
            <circle cx="16" cy="16" r="12" stroke="url(#ng)" strokeWidth="1.5" strokeDasharray="3 2" style={{ animation:'rotateRing 20s linear infinite', transformOrigin:'16px 16px' }}/>
            <circle cx="16" cy="16" r="7" stroke="url(#ng)" strokeWidth="1.2"/>
            <circle cx="16" cy="16" r="2.5" fill="url(#ng)"/>
            <defs><linearGradient id="ng" x1="4" y1="4" x2="28" y2="28"><stop stopColor="#00f0ff"/><stop offset="1" stopColor="#b400ff"/></linearGradient></defs>
          </svg>
          <span style={{ fontFamily:'Orbitron,monospace', fontSize:15, fontWeight:700, letterSpacing:'0.1em' }}>
            PLAN<span style={{ color:'#00f0ff' }}>PILOT</span>
          </span>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button className="btn-g" onClick={() => navigate('/login')} style={{ padding:'9px 22px', fontSize:13 }}>Login</button>
          <button className="btn-p" onClick={() => navigate('/register')} style={{ padding:'9px 22px', fontSize:10 }}>Launch Free</button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{
        minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
        position:'relative', padding:'120px 52px 80px', overflow:'hidden', textAlign:'center',
      }}>
        {/* Grid bg */}
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          backgroundImage:`
            radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,240,255,0.055) 0%, transparent 60%),
            radial-gradient(ellipse 45% 45% at 80% 18%, rgba(180,0,255,0.07) 0%, transparent 50%),
            linear-gradient(rgba(0,240,255,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,240,255,0.022) 1px, transparent 1px)
          `,
          backgroundSize:'auto,auto,72px 72px,72px 72px',
          animation:'gridPan 20s linear infinite',
        }}/>

        {/* HUD ring — parallax */}
        <div style={{
          position:'absolute', top:'50%', left:'50%', pointerEvents:'none',
          transform:`translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`,
          transition:'transform 0.08s linear', opacity:0.55,
          width:'min(700px,90vw)', height:'min(700px,90vw)',
        }}>
          <HUDRing size="100%" />
        </div>

        {/* Corner HUD brackets */}
        {[{top:100,left:52},{top:100,right:52},{bottom:80,left:52},{bottom:80,right:52}].map((pos,i)=>(
          <div key={i} style={{
            position:'absolute', ...pos, width:22, height:22, pointerEvents:'none',
            borderTop: i<2?'2px solid rgba(0,240,255,0.38)':'none',
            borderBottom: i>=2?'2px solid rgba(0,240,255,0.38)':'none',
            borderLeft: i%2===0?'2px solid rgba(0,240,255,0.38)':'none',
            borderRight: i%2!==0?'2px solid rgba(0,240,255,0.38)':'none',
          }}/>
        ))}

        {/* Hero copy */}
        <div style={{ position:'relative', zIndex:10, maxWidth:760 }}>
          <div className="tag" style={{ marginBottom:28, animation:'fadeUp 0.8s ease both' }}>
            MISSION CONTROL FOR PRODUCTIVITY
          </div>

          <h1 style={{
            fontFamily:'Orbitron,monospace',
            fontSize:'clamp(46px, 8.5vw, 92px)',
            fontWeight:900, lineHeight:1.0,
            letterSpacing:'-0.025em', marginBottom:28,
            animation:'fadeUp 0.8s 0.1s ease both',
          }}>
            <span style={{ display:'block', color:'#fff' }}>PLAN.</span>
            <span className="neon-text" style={{ display:'block' }}>PILOT.</span>
            <span style={{ display:'block', color:'#fff' }}>LAND.</span>
          </h1>

          <p style={{
            fontSize:18, lineHeight:1.8, color:'rgba(255,255,255,0.46)',
            maxWidth:500, margin:'0 auto 52px',
            animation:'fadeUp 0.8s 0.2s ease both',
          }}>
            One cockpit for tasks, habits & deep focus.<br/>
            Turn intention into execution — every single day.
          </p>

          <div style={{
            display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap',
            animation:'fadeUp 0.8s 0.32s ease both',
          }}>
            <button className="btn-p" onClick={() => navigate('/register')}>
              🚀 LAUNCH FREE
            </button>
            <button className="btn-g" onClick={() => navigate('/login')}>
              I have an account →
            </button>
          </div>

          {/* Scroll indicator */}
          <div style={{
            marginTop:80, display:'flex', flexDirection:'column',
            alignItems:'center', gap:8, opacity:0.3,
            animation:'fadeUp 1s 0.6s ease both',
          }}>
            <span style={{ fontFamily:'Orbitron', fontSize:8, letterSpacing:'0.25em' }}>SCROLL</span>
            <div style={{
              width:1, height:50,
              background:'linear-gradient(to bottom, var(--cyan), transparent)',
              animation:'floatY 2s ease-in-out infinite',
            }}/>
          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────── */}
      <section className="reveal stats-grid" style={{
        borderTop:'1px solid rgba(0,240,255,0.07)',
        borderBottom:'1px solid rgba(0,240,255,0.07)',
        background:'rgba(0,240,255,0.018)',
        display:'grid', gridTemplateColumns:'repeat(4,1fr)',
      }}>
        {[
          {val:'5',unit:'MODULES',desc:'Fully integrated'},
          {val:'∞',unit:'HABITS',desc:'Track any routine'},
          {val:'25',unit:'MIN FOCUS',desc:'Perfect work block'},
          {val:'100',unit:'% FREE',desc:'No credit card'},
        ].map((s,i)=>(
          <div key={i} style={{
            padding:'44px 32px', textAlign:'center',
            borderRight:i<3?'1px solid rgba(0,240,255,0.07)':'none',
          }}>
            <div style={{
              fontFamily:'Orbitron,monospace', fontSize:50, fontWeight:900, lineHeight:1,
              background:'linear-gradient(135deg,var(--cyan),var(--purple))',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
            }}>
              {s.val}{s.val!=='∞'&&s.val!=='100'?<span style={{fontSize:28}}>+</span>:''}
            </div>
            <div style={{ fontFamily:'Orbitron,monospace', fontSize:9, letterSpacing:'0.22em', color:'var(--cyan)', marginTop:8 }}>{s.unit}</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)', marginTop:5 }}>{s.desc}</div>
          </div>
        ))}
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section style={{ padding:'clamp(72px,11vw,130px) clamp(24px,5vw,80px)' }}>
        <div className="reveal" style={{ textAlign:'center', marginBottom:80 }}>
          <div className="tag" style={{ marginBottom:22 }}>SYSTEMS OVERVIEW</div>
          <h2 style={{
            fontFamily:'Orbitron,monospace',
            fontSize:'clamp(28px, 5vw, 50px)',
            fontWeight:700, letterSpacing:'-0.02em',
            background:'linear-gradient(135deg,#fff 40%,rgba(255,255,255,0.38))',
            WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
          }}>
            Everything You Need<br/>To Hit Your Targets
          </h2>
        </div>

        <div className="feat-grid" style={{
          display:'grid', gridTemplateColumns:'repeat(12,1fr)',
          gap:20, maxWidth:1200, margin:'0 auto',
        }}>
          {FEATURES.map((f,i)=>(
            <div key={i} className={`fcard reveal`} data-delay={i*90} style={{ gridColumn:f.span }}>
              {/* Feature number */}
              <span style={{ position:'absolute', top:22, right:26, fontFamily:'Orbitron,monospace', fontSize:10, color:'rgba(0,240,255,0.28)', letterSpacing:'0.15em' }}>{f.num}</span>
              {/* Icon box */}
              <div style={{
                width:60, height:60, borderRadius:16,
                background:'rgba(0,240,255,0.05)', border:'1px solid rgba(0,240,255,0.14)',
                display:'flex', alignItems:'center', justifyContent:'center', marginBottom:22,
              }}>
                {f.icon}
              </div>
              <div style={{ fontFamily:'Orbitron,monospace', fontSize:8, letterSpacing:'0.2em', color:'rgba(0,240,255,0.55)', marginBottom:10 }}>{f.label}</div>
              <h3 style={{ fontSize:19, fontWeight:600, marginBottom:12, color:'#fff' }}>{f.title}</h3>
              <p style={{ fontSize:13.5, lineHeight:1.75, color:'rgba(255,255,255,0.42)' }}>{f.desc}</p>
              {/* Corner glow */}
              <div style={{ position:'absolute', bottom:0, right:0, width:70, height:70, background:'radial-gradient(circle at 100% 100%, rgba(0,240,255,0.07), transparent)', borderRadius:'0 0 22px 0' }}/>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────── */}
      <section style={{
        padding:'clamp(60px,10vw,120px) clamp(24px,5vw,80px)',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          background:'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(180,0,255,0.055), transparent)',
        }}/>
        <div className="reveal" style={{ textAlign:'center', marginBottom:72 }}>
          <div className="tag" style={{ marginBottom:22, borderColor:'rgba(180,0,255,0.28)', color:'#b400ff' }}>
            <span style={{ width:5, height:5, background:'#b400ff', borderRadius:'50%', boxShadow:'0 0 6px #b400ff', animation:'blink 1.6s ease-in-out infinite', display:'inline-block' }}/>
            FLIGHT PLAN
          </div>
          <h2 style={{ fontFamily:'Orbitron,monospace', fontSize:'clamp(28px,5vw,50px)', fontWeight:700, letterSpacing:'-0.02em', color:'#fff' }}>
            Three Steps to Orbit
          </h2>
        </div>

        <div style={{ maxWidth:820, margin:'0 auto' }}>
          {[
            { step:'01', title:'Set Your Course', body:'Create tasks, define habits, and configure your focus sessions. Chart the destination — precisely.' },
            { step:'02', title:'Engage Systems', body:'Work through sessions. The timer keeps you honest. Habits compound. Tasks dissolve.' },
            { step:'03', title:'Review & Ascend', body:'The dashboard reveals your patterns. Iterate. Optimize. Hit higher targets every cycle.' },
          ].map((s,i)=>(
            <div key={i} className={`reveal ${i<2?'step-line':''}`} data-delay={i*110} style={{
              display:'flex', gap:28, padding:'36px 0',
              borderBottom:i<2?'1px solid rgba(0,240,255,0.06)':'none',
              alignItems:'flex-start',
            }}>
              <div style={{
                minWidth:72, height:72, borderRadius:18,
                border:'1px solid rgba(0,240,255,0.2)', background:'rgba(0,240,255,0.04)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'Orbitron,monospace', fontSize:18, fontWeight:900, color:'#00f0ff',
                flexShrink:0,
              }}>{s.step}</div>
              <div style={{ paddingTop:16 }}>
                <h3 style={{ fontSize:21, fontWeight:600, color:'#fff', marginBottom:10 }}>{s.title}</h3>
                <p style={{ fontSize:15, lineHeight:1.8, color:'rgba(255,255,255,0.42)', maxWidth:500 }}>{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section style={{
        padding:'clamp(90px,13vw,160px) clamp(24px,5vw,80px)',
        position:'relative', overflow:'hidden', textAlign:'center',
      }}>
        {/* Pulsing rings */}
        {[160,240,320].map((r,i)=>(
          <div key={i} style={{
            position:'absolute', top:'50%', left:'50%',
            width:r*2, height:r*2,
            border:`1px solid rgba(0,240,255,${0.07-i*0.02})`,
            borderRadius:'50%',
            animation:`ripple ${4+i*1.5}s ease-out infinite`,
            animationDelay:`${i*1.4}s`,
            pointerEvents:'none',
          }}/>
        ))}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none', background:'radial-gradient(ellipse 55% 55% at 50% 50%, rgba(0,240,255,0.065), transparent)' }}/>

        <div className="reveal" style={{ position:'relative', zIndex:2 }}>
          <div className="tag" style={{ marginBottom:28 }}>READY FOR LIFTOFF</div>
          <h2 style={{
            fontFamily:'Orbitron,monospace',
            fontSize:'clamp(34px,7vw,72px)',
            fontWeight:900, letterSpacing:'-0.025em',
            lineHeight:1.05, marginBottom:22,
          }}>
            <span style={{ color:'#fff' }}>Your Pilot Seat </span>
            <span className="neon-text">Awaits.</span>
          </h2>
          <p style={{ fontSize:17, color:'rgba(255,255,255,0.42)', maxWidth:420, margin:'0 auto 56px' }}>
            Free forever. No credit card. No noise.<br/>Just clarity.
          </p>
          <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
            <button className="btn-p" onClick={() => navigate('/register')} style={{ padding:'18px 56px', fontSize:13 }}>
              🚀 CREATE FREE ACCOUNT
            </button>
            <button className="btn-g" onClick={() => navigate('/login')} style={{ padding:'18px 36px' }}>
              Sign in instead →
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer style={{
        borderTop:'1px solid rgba(0,240,255,0.06)',
        padding:'26px 52px',
        display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12,
      }}>
        <span style={{ fontFamily:'Orbitron,monospace', fontSize:11, color:'rgba(255,255,255,0.18)', letterSpacing:'0.12em' }}>
          PLAN<span style={{ color:'rgba(0,240,255,0.38)' }}>PILOT</span> © {new Date().getFullYear()}
        </span>
        <span style={{ fontSize:12, color:'rgba(255,255,255,0.14)', letterSpacing:'0.05em', fontStyle:'italic' }}>
          Built for those who execute.
        </span>
      </footer>
    </div>
  )
}