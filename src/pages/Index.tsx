import { useEffect, useRef, useState, useCallback } from "react";

// ─────────────────────────────────────────────
// REVEAL — scroll reveal
// ─────────────────────────────────────────────
function Reveal({
  children, delay = 0, from = "bottom",
}: {
  children: React.ReactNode; delay?: number; from?: "bottom" | "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVis(true); },
      { threshold: 0.08 }
    );
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  const transforms: Record<string, string> = {
    bottom: "translateY(44px)", left: "translateX(-44px)", right: "translateX(44px)",
  };
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "none" : transforms[from],
      transition: `opacity .95s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .95s cubic-bezier(.22,1,.36,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// HERO TEXT LINE — appears on scroll threshold
// ─────────────────────────────────────────────
function HeroLine({
  children, show, delay = 0, italic = false,
}: {
  children: React.ReactNode; show: boolean; delay?: number; italic?: boolean;
}) {
  return (
    <div style={{ overflow: "hidden", lineHeight: 1 }}>
      <div style={{
        display: "block",
        fontStyle: italic ? "italic" : "normal",
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(100%)",
        transition: `opacity .9s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .9s cubic-bezier(.22,1,.36,1) ${delay}ms`,
        paddingBottom: "0.1em",
      }}>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// LERP UTILS
// ─────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function easeInOut(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
function smoothLerp(cur: number, target: number, f: number) { return cur + (target - cur) * f; }

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const GIF_HERO        = "/IMG_2047.gif";
const GIF_FLOAT       = "/IMG_2049.gif";

const FEATURES = [
  { num: "01", title: "Pipeline Intelligente",  desc: "Gestisci lead e opportunità con una vista chiara. Ogni deal al posto giusto, sempre.",  from: "left"   as const },
  { num: "02", title: "Automazioni Potenti",     desc: "Elimina il lavoro manuale. Flussi automatici per email, follow-up e notifiche.",         from: "bottom" as const },
  { num: "03", title: "Analisi in Tempo Reale",  desc: "Dashboard con metriche che contano davvero per il tuo business.",                        from: "right"  as const },
  { num: "04", title: "Integrazioni Native",     desc: "Connettiti con gli strumenti che già usi. Tutto sincronizzato.",                         from: "bottom" as const },
];

const STATS_MARQUEE = [
  "3× Più Conversioni", "80% Tempo Risparmiato", "10k+ Aziende Attive", "99.9% Uptime",
];

// ─────────────────────────────────────────────
// ZIG-ZAG PATHS (x: 0=left, 1=right of viewport)
// A starts off-left, B starts off-right
// Meet at center (~p=0.50), bounce, exit opposite
// ─────────────────────────────────────────────
const PATH_A = [
  { p: 0.00, x: -0.20 },
  { p: 0.14, x:  0.68 },
  { p: 0.28, x:  0.04 },
  { p: 0.42, x:  0.62 },
  { p: 0.50, x:  0.36 }, // impact
  { p: 0.58, x:  0.04 },
  { p: 0.72, x:  0.64 },
  { p: 0.86, x:  0.04 },
  { p: 1.00, x: -0.24 },
];

const PATH_B = [
  { p: 0.00, x:  1.20 },
  { p: 0.14, x:  0.24 },
  { p: 0.28, x:  0.88 },
  { p: 0.42, x:  0.30 },
  { p: 0.50, x:  0.54 }, // impact
  { p: 0.58, x:  0.88 },
  { p: 0.72, x:  0.28 },
  { p: 0.86, x:  0.88 },
  { p: 1.00, x:  1.24 },
];

function getX(path: typeof PATH_A, progress: number): number {
  const p = Math.max(0, Math.min(1, progress));
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i], b = path[i + 1];
    if (p >= a.p && p <= b.p) {
      const t = (p - a.p) / (b.p - a.p);
      return lerp(a.x, b.x, easeInOut(t));
    }
  }
  return path[path.length - 1].x;
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
export default function Index() {
  const [scrollY, setScrollY]         = useState(0);
  const [scrolled, setScrolled]       = useState(false);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [scrollPct, setScrollPct]     = useState(0);
  const [heroProgress, setHeroProgress] = useState(0); // 0→1 while in hero

  // Hero text reveal stages (triggered by scroll)
  const [showLine1, setShowLine1] = useState(false);
  const [showLine2, setShowLine2] = useState(false);
  const [showLine3, setShowLine3] = useState(false);
  const [showSub,   setShowSub]   = useState(false);
  const [showBtns,  setShowBtns]  = useState(false);

  // Floating gif refs
  const wrapARef    = useRef<HTMLDivElement>(null);
  const wrapBRef    = useRef<HTMLDivElement>(null);
  const impactRef   = useRef<HTMLDivElement>(null);
  const zoneStartRef = useRef<HTMLDivElement>(null);
  const zoneEndRef   = useRef<HTMLDivElement>(null);
  const heroRef      = useRef<HTMLElement>(null);

  // Smooth animation values
  const curAX = useRef(-300);
  const curBX = useRef(2000);
  const curAY = useRef(0);
  const curBY = useRef(0);
  const curProgress = useRef(0);
  const rafRef = useRef(0);

  // ── SCROLL HANDLER ──
  const onScroll = useCallback(() => {
    const sy = window.scrollY;
    setScrollY(sy);
    setScrolled(sy > 60);

    const docH = document.body.scrollHeight - window.innerHeight;
    setScrollPct(docH > 0 ? (sy / docH) * 100 : 0);

    // Hero parallax + text reveal
    const VH = window.innerHeight;
    const heroP = Math.min(sy / VH, 1);
    setHeroProgress(heroP);

    // Staggered text reveal based on scroll depth in hero
    setShowLine1(heroP >= 0);
    setShowLine2(heroP >= 0.04);
    setShowLine3(heroP >= 0.09);
    setShowSub(heroP >= 0.15);
    setShowBtns(heroP >= 0.20);

    // Floating zone progress
    const startEl = zoneStartRef.current;
    const endEl   = zoneEndRef.current;
    if (!startEl || !endEl) return;

    const startY = startEl.getBoundingClientRect().top + sy;
    const endY   = endEl.getBoundingClientRect().top + sy;
    const zoneH  = endY - startY;
    curProgress.current = Math.max(0, Math.min(1, (sy - startY) / zoneH));
  }, []);

  // ── ANIMATION LOOP ──
  useEffect(() => {
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      const wA  = wrapARef.current;
      const wB  = wrapBRef.current;
      const imp = impactRef.current;
      if (!wA || !wB) return;

      const p   = curProgress.current;
      const VW  = window.innerWidth;
      const VH  = window.innerHeight;
      const VS  = VW < 768 ? 90 : 150; // video size px

      // Target X positions
      const tAX = getX(PATH_A, p) * VW - VS / 2;
      const tBX = getX(PATH_B, p) * VW - VS / 2;

      // Target Y — travel from 10% to 80% of viewport height
      const tY  = lerp(VH * 0.10, VH * 0.82, p);

      // Smooth interpolation
      curAX.current = smoothLerp(curAX.current, tAX, 0.07);
      curBX.current = smoothLerp(curBX.current, tBX, 0.07);
      curAY.current = smoothLerp(curAY.current, tY,  0.05);
      curBY.current = smoothLerp(curBY.current, tY,  0.05);

      // Rotation toward movement direction
      const rotA = Math.max(-14, Math.min(14, (tAX - curAX.current) * 0.5));
      const rotB = Math.max(-14, Math.min(14, (tBX - curBX.current) * 0.5));

      // Impact intensity
      const distImpact = Math.abs(p - 0.50);
      const isImpact   = distImpact < 0.06 && p > 0.02;
      const intensity  = isImpact ? Math.max(0, 1 - distImpact / 0.06) : 0;
      const scale      = 1 + intensity * 0.18;

      // Fade in/out
      const fadeIn  = p < 0.04 ? p / 0.04 : 1;
      const fadeOut = p > 0.92 ? Math.max(0, 1 - (p - 0.92) / 0.08) : 1;
      const opacity = Math.min(fadeIn, fadeOut);

      // Apply to DOM
      wA.style.transform = `translate(${curAX.current}px, ${curAY.current}px) rotate(${rotA}deg) scale(${scale})`;
      wB.style.transform = `translate(${curBX.current}px, ${curBY.current}px) rotate(${rotB}deg) scale(${scale})`;
      wA.style.opacity   = String(opacity);
      wB.style.opacity   = String(opacity);

      // Impact effect
      if (imp) {
        imp.style.opacity   = String(intensity * 0.9);
        imp.style.transform = `translate(-50%, -50%) scale(${0.3 + intensity * 0.7})`;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── SCROLL LISTENER ──
  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    // Trigger on load to show first line immediately
    setTimeout(() => setShowLine1(true), 300);
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  return (
    <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", background: "#fff", color: "#0a0a0a", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Instrument+Mono:wght@300;400&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        html{scroll-behavior:smooth;}
        ::selection{background:#0a0a0a;color:#fff;}
        .mono{font-family:'Instrument Mono',monospace;letter-spacing:.12em;text-transform:uppercase;}

        @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:none;}}
        @keyframes marquee{from{transform:translateX(0);}to{transform:translateX(-50%);}}
        @keyframes rotateSlow{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes impactRing{
          0%{transform:translate(-50%,-50%) scale(.2);opacity:.8;}
          100%{transform:translate(-50%,-50%) scale(2.4);opacity:0;}
        }

        /* NAV */
        .nav-lk{font-family:'Instrument Mono',monospace;font-size:11px;letter-spacing:.13em;text-transform:uppercase;text-decoration:none;opacity:.55;transition:opacity .2s;}
        .nav-lk:hover{opacity:1;}

        /* BUTTONS */
        .btn-w{display:inline-block;padding:16px 44px;background:#fff;color:#0a0a0a;font-family:'Instrument Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;border:1.5px solid rgba(255,255,255,.75);transition:all .3s;}
        .btn-w:hover{background:transparent;color:#fff;}
        .btn-ghost{display:inline-block;padding:16px 44px;background:transparent;color:#fff;font-family:'Instrument Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;border:1.5px solid rgba(255,255,255,.3);transition:all .3s;}
        .btn-ghost:hover{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.6);}
        .btn-crm{display:inline-block;padding:20px 64px;background:#fff;color:#0a0a0a;font-family:'Instrument Mono',monospace;font-size:12px;letter-spacing:.18em;text-transform:uppercase;text-decoration:none;border:1.5px solid #fff;transition:all .3s;}
        .btn-crm:hover{background:transparent;color:#fff;}

        /* FEATURE CARD */
        .fcard{border:1px solid #e4e4e4;padding:40px 32px 44px;background:#fff;position:relative;overflow:hidden;transition:border-color .35s,box-shadow .35s,transform .35s;}
        .fcard::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:#0a0a0a;transform:scaleX(0);transform-origin:left;transition:transform .45s cubic-bezier(.22,1,.36,1);}
        .fcard:hover::after{transform:scaleX(1);}
        .fcard:hover{border-color:#bbb;transform:translateY(-5px);box-shadow:0 16px 48px rgba(0,0,0,.07);}
        .bnum{position:absolute;bottom:-12px;right:8px;font-family:'Cormorant Garamond',serif;font-size:110px;font-weight:600;color:rgba(0,0,0,.04);line-height:1;pointer-events:none;user-select:none;transition:color .35s;}
        .fcard:hover .bnum{color:rgba(0,0,0,.08);}

        /* FLOATING GIF */
        .fgif{
          position:fixed;top:0;left:0;
          pointer-events:none;z-index:50;
          will-change:transform,opacity;
          border-radius:4px;
          overflow:hidden;
        }
        .fgif img{
          display:block;width:100%;height:100%;
          object-fit:cover;
        }

        /* IMPACT */
        .impact{
          position:fixed;top:50%;left:50%;
          width:260px;height:260px;
          pointer-events:none;z-index:49;
          opacity:0;
          transform:translate(-50%,-50%) scale(.3);
          transition:opacity .08s;
        }

        /* GRAIN */
        .grain{position:fixed;inset:0;pointer-events:none;z-index:9998;opacity:.025;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:180px;}

        /* MOBILE */
        @media(max-width:768px){
          .desk-only{display:none!important;}
          .mob-only{display:flex!important;}
          .hero-btns{flex-direction:column!important;align-items:center!important;gap:12px!important;}
          .features-g{grid-template-columns:1fr!important;}
          .stats-g{grid-template-columns:1fr 1fr!important;}
        }
        @media(min-width:769px){.mob-only{display:none!important;}}

        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#ccc;border-radius:2px;}
      `}</style>

      <div className="grain" />

      {/* SCROLL PROGRESS BAR */}
      <div style={{
        position:"fixed",top:0,left:0,zIndex:300,
        height:2,background:"#fff",width:`${scrollPct}%`,
        transition:"width .08s linear",mixBlendMode:"difference",
      }} />

      {/* ── FLOATING GIF A ── */}
      <div
        ref={wrapARef}
        className="fgif"
        style={{
          width:  typeof window !== "undefined" && window.innerWidth < 768 ? 90 : 150,
          height: typeof window !== "undefined" && window.innerWidth < 768 ? 90 : 150,
          opacity: 0,
        }}
      >
        <img src={GIF_FLOAT} alt="" loading="eager" />
      </div>

      {/* ── FLOATING GIF B (mirrored) ── */}
      <div
        ref={wrapBRef}
        className="fgif"
        style={{
          width:  typeof window !== "undefined" && window.innerWidth < 768 ? 90 : 150,
          height: typeof window !== "undefined" && window.innerWidth < 768 ? 90 : 150,
          opacity: 0,
          transform: "scaleX(-1)",
        }}
      >
        <img src={GIF_FLOAT} alt="" loading="eager" />
      </div>

      {/* ── IMPACT EFFECT ── */}
      <div ref={impactRef} className="impact">
        <div style={{ position:"absolute",inset:0,background:"radial-gradient(circle,rgba(255,255,255,.2) 0%,transparent 70%)",borderRadius:"50%" }} />
        <div style={{ position:"absolute",inset:-48,border:"1px solid rgba(255,255,255,.28)",borderRadius:"50%" }} />
        <div style={{ position:"absolute",inset:-96,border:"1px solid rgba(255,255,255,.10)",borderRadius:"50%" }} />
        <div style={{
          position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
          fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(24px,4vw,52px)",
          fontWeight:300,fontStyle:"italic",color:"rgba(0,0,0,.06)",
          whiteSpace:"nowrap",
        }}>
          Artemisia
        </div>
      </div>

      {/* ── NAV ── */}
      <nav style={{
        position:"fixed",top:0,left:0,right:0,zIndex:200,
        padding:"22px 32px",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        background: scrolled ? "rgba(255,255,255,.96)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid #ebebeb" : "none",
        transition:"all .4s ease",
      }}>
        <div style={{
          fontFamily:"'Cormorant Garamond',serif",fontSize:19,fontWeight:600,
          letterSpacing:".2em",color:scrolled?"#0a0a0a":"#fff",transition:"color .4s",
        }}>
          ARTEMISIA
        </div>
        <div className="desk-only" style={{ display:"flex",gap:36,alignItems:"center" }}>
          <a href="#features" className="nav-lk" style={{ color:scrolled?"#0a0a0a":"#fff" }}>Funzioni</a>
          <a href="#pricing"  className="nav-lk" style={{ color:scrolled?"#0a0a0a":"#fff" }}>Prezzi</a>
          <a href="/crm" style={{
            padding:"11px 28px",
            background:scrolled?"#0a0a0a":"transparent",
            color:scrolled?"#fff":"#fff",
            fontFamily:"'Instrument Mono',monospace",fontSize:10,
            letterSpacing:".14em",textTransform:"uppercase",textDecoration:"none",
            border:`1.5px solid ${scrolled?"#0a0a0a":"rgba(255,255,255,.5)"}`,
            transition:"all .3s",
          }}>Accedi al CRM</a>
        </div>
        {/* Hamburger */}
        <button
          className="mob-only"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background:"none",border:"none",flexDirection:"column",gap:5,padding:4 }}
        >
          {[0,1,2].map(i => (
            <span key={i} style={{
              display:"block",width:22,height:1.5,
              background:scrolled?"#0a0a0a":"#fff",transition:"all .3s",
              transform:menuOpen&&i===0?"rotate(45deg) translate(4px,4px)":menuOpen&&i===2?"rotate(-45deg) translate(4px,-4px)":"none",
              opacity:menuOpen&&i===1?0:1,
            }} />
          ))}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ position:"fixed",inset:0,zIndex:199,background:"#0a0a0a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:48 }}>
          {[["#features","Funzioni"],["#pricing","Prezzi"],["/crm","CRM"]].map(([href,label],i) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{
              fontFamily:"'Cormorant Garamond',serif",fontSize:48,fontWeight:300,
              color:"#fff",textDecoration:"none",opacity:0,
              animation:`fadeUp .5s ease ${i*100}ms forwards`,
            }}>{label}</a>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════
          HERO — GIF background + scroll reveal text
      ══════════════════════════════════ */}
      <section
        ref={heroRef}
        style={{ position:"relative",height:"100vh",overflow:"hidden" }}
      >
        {/* GIF background with parallax */}
        <div style={{
          position:"absolute",inset:"-10% 0",
          transform: `translateY(${heroProgress * 30}%)`,
          transition:"transform 0s",
          willChange:"transform",
        }}>
          <img
            src={GIF_HERO}
            alt=""
            loading="eager"
            style={{ width:"100%",height:"100%",objectFit:"cover",display:"block" }}
          />
        </div>

        {/* Dark overlay — lightens as you scroll */}
        <div style={{
          position:"absolute",inset:0,
          background: `linear-gradient(to bottom,
            rgba(0,0,0,${0.55 - heroProgress * 0.1}) 0%,
            rgba(0,0,0,${0.18 - heroProgress * 0.05}) 40%,
            rgba(0,0,0,${0.75 - heroProgress * 0.1}) 100%)`,
        }} />

        {/* Hero content */}
        <div style={{
          position:"relative",zIndex:2,height:"100%",
          display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",
          textAlign:"center",padding:"80px 24px 0",
        }}>
          {/* Label */}
          <div
            className="mono"
            style={{
              fontSize:10,color:"rgba(255,255,255,.42)",marginBottom:32,
              opacity: showLine1 ? 1 : 0,
              transform: showLine1 ? "none" : "translateY(16px)",
              transition:"opacity .7s ease 0ms, transform .7s ease 0ms",
            }}
          >
            — Software CRM per il Business Moderno
          </div>

          {/* Title with scroll-reveal lines */}
          <h1 style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize:"clamp(56px,11vw,124px)",
            fontWeight:300,lineHeight:.95,
            color:"#fff",letterSpacing:"-.02em",
            marginBottom:36,
          }}>
            <HeroLine show={showLine1} delay={0}>Il tuo</HeroLine>
            <HeroLine show={showLine2} delay={80} italic>business</HeroLine>
            <HeroLine show={showLine3} delay={160}>al centro.</HeroLine>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize:19,fontWeight:300,
            color:"rgba(255,255,255,.7)",
            lineHeight:1.7,maxWidth:420,marginBottom:52,
            opacity: showSub ? 1 : 0,
            transform: showSub ? "none" : "translateY(20px)",
            transition:"opacity .9s cubic-bezier(.22,1,.36,1) 0ms, transform .9s cubic-bezier(.22,1,.36,1) 0ms",
          }}>
            Gestisci clienti, pipeline e automazioni da un'unica piattaforma elegante.
          </p>

          {/* Buttons */}
          <div
            className="hero-btns"
            style={{
              display:"flex",gap:16,
              opacity: showBtns ? 1 : 0,
              transform: showBtns ? "none" : "translateY(20px)",
              transition:"opacity .9s cubic-bezier(.22,1,.36,1) 0ms, transform .9s cubic-bezier(.22,1,.36,1) 0ms",
            }}
          >
            <a href="/crm" className="btn-w">Inizia Gratis</a>
            <a href="#features" className="btn-ghost">Scopri di più</a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position:"absolute",bottom:36,left:"50%",transform:"translateX(-50%)",
          zIndex:2,
          opacity: showBtns ? 1 : 0,
          transition:"opacity .9s ease 400ms",
        }}>
          <svg viewBox="0 0 68 68" style={{ width:56,height:56,animation:"rotateSlow 9s linear infinite" }}>
            <defs><path id="cr" d="M 34,34 m -24,0 a 24,24 0 1,1 48,0 a 24,24 0 1,1 -48,0" /></defs>
            <text style={{ fontSize:7.8,fill:"rgba(255,255,255,.5)",fontFamily:"'Instrument Mono',monospace",letterSpacing:"2.4px" }}>
              <textPath href="#cr">SCROLL · SCROLL · SCROLL ·</textPath>
            </text>
          </svg>
          <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:2 }}>
            <div style={{ width:1,height:12,background:"rgba(255,255,255,.5)" }} />
            <div style={{ borderLeft:"4px solid transparent",borderRight:"4px solid transparent",borderTop:"5px solid rgba(255,255,255,.5)" }} />
          </div>
        </div>
      </section>

      {/* ── ZONE START — floating GIFs begin here ── */}
      <div ref={zoneStartRef} style={{ height:0 }} />

      {/* ══════════════════════════════════
          MARQUEE
      ══════════════════════════════════ */}
      <div style={{ overflow:"hidden",background:"#0a0a0a",padding:"26px 0" }}>
        <div style={{ display:"flex",whiteSpace:"nowrap",animation:"marquee 22s linear infinite" }}>
          {[...Array(4)].flatMap(() =>
            STATS_MARQUEE.map((s, i) => (
              <span key={`${s}-${i}`} style={{ display:"inline-flex",alignItems:"center",gap:28,padding:"0 40px" }}>
                <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:300,color:"#fff" }}>{s}</span>
                <span style={{ color:"rgba(255,255,255,.15)",fontSize:14 }}>✦</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* ══════════════════════════════════
          FEATURES
      ══════════════════════════════════ */}
      <section id="features" style={{ padding:"120px 32px",maxWidth:1200,margin:"0 auto" }}>
        <Reveal from="left">
          <span className="mono" style={{ fontSize:10,opacity:.3,display:"block",marginBottom:20 }}>— Funzionalità</span>
        </Reveal>
        <Reveal delay={80}>
          <h2 style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize:"clamp(38px,6vw,80px)",
            fontWeight:300,lineHeight:1,marginBottom:72,
          }}>
            Tutto ciò che<br /><em>serve davvero.</em>
          </h2>
        </Reveal>
        <div className="features-g" style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:2 }}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.num} from={f.from} delay={i * 80}>
              <div className="fcard">
                <div className="bnum">{f.num}</div>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:28 }}>
                  <span className="mono" style={{ fontSize:10,opacity:.3 }}>{f.num}</span>
                </div>
                <h3 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:400,marginBottom:14,lineHeight:1.2 }}>{f.title}</h3>
                <p style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:300,lineHeight:1.8,opacity:.58 }}>{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════
          STATS
      ══════════════════════════════════ */}
      <section style={{ background:"#f6f6f6",padding:"100px 32px" }}>
        <div style={{ maxWidth:1200,margin:"0 auto" }}>
          <Reveal from="left">
            <span className="mono" style={{ fontSize:10,opacity:.3,display:"block",marginBottom:56 }}>— Numeri che parlano</span>
          </Reveal>
          <div className="stats-g" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:32 }}>
            {[
              { val:"3×",    label:"Più conversioni" },
              { val:"80%",   label:"Tempo risparmiato" },
              { val:"10k+",  label:"Aziende attive" },
              { val:"99.9%", label:"Uptime garantito" },
            ].map((s, i) => (
              <Reveal key={s.val} from={i % 2 === 0 ? "left" : "right"} delay={i * 80}>
                <div style={{ borderTop:"1px solid #d8d8d8",paddingTop:28 }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(48px,5vw,72px)",fontWeight:300,lineHeight:1,marginBottom:10 }}>{s.val}</div>
                  <div className="mono" style={{ fontSize:9,opacity:.38 }}>{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════
          TESTIMONIAL
      ══════════════════════════════════ */}
      <section style={{ padding:"120px 32px",maxWidth:860,margin:"0 auto",textAlign:"center" }}>
        <Reveal>
          <div style={{ fontSize:64,opacity:.07,lineHeight:1,marginBottom:16,fontFamily:"Georgia,serif" }}>"</div>
          <blockquote style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize:"clamp(20px,3vw,34px)",
            fontWeight:300,lineHeight:1.55,fontStyle:"italic",marginBottom:40,
          }}>
            Artemisia ha trasformato il nostro processo di vendita. In tre mesi abbiamo triplicato le conversioni e ridotto il tempo di gestione dell'80%.
          </blockquote>
          <div style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:14 }}>
            <div style={{ width:38,height:38,borderRadius:"50%",background:"#e0e0e0" }} />
            <div style={{ textAlign:"left" }}>
              <div className="mono" style={{ fontSize:10,opacity:.65 }}>Marco Ferretti</div>
              <div className="mono" style={{ fontSize:9,opacity:.32 }}>CEO, Nexlabs Milano</div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── ZONE END — floating GIFs exit here ── */}
      <div ref={zoneEndRef} style={{ height:0 }} />

      {/* ══════════════════════════════════
          CTA
      ══════════════════════════════════ */}
      <section id="crm" style={{ background:"#0a0a0a",padding:"160px 32px",position:"relative",overflow:"hidden" }}>
        {[480,760,1040].map((size, i) => (
          <div key={i} style={{
            position:"absolute",width:size,height:size,
            borderRadius:"50%",border:"1px solid rgba(255,255,255,.04)",
            top:"50%",left:"50%",transform:"translate(-50%,-50%)",
            pointerEvents:"none",
          }} />
        ))}
        <div style={{ maxWidth:700,margin:"0 auto",textAlign:"center",position:"relative" }}>
          <Reveal from="left">
            <span className="mono" style={{ fontSize:10,color:"rgba(255,255,255,.25)",display:"block",marginBottom:28 }}>
              — Pronto a iniziare?
            </span>
          </Reveal>
          <Reveal delay={80}>
            <h2 style={{
              fontFamily:"'Cormorant Garamond',serif",
              fontSize:"clamp(52px,9vw,104px)",
              fontWeight:300,lineHeight:.92,
              color:"#fff",letterSpacing:"-.02em",marginBottom:32,
            }}>
              Entra nel<br /><em>tuo CRM.</em>
            </h2>
          </Reveal>
          <Reveal from="right" delay={140}>
            <p style={{
              fontFamily:"'Cormorant Garamond',serif",
              fontSize:20,fontWeight:300,
              color:"rgba(255,255,255,.4)",
              lineHeight:1.75,marginBottom:56,
            }}>
              Accedi alla dashboard, gestisci i tuoi clienti e fai crescere il tuo business da oggi.
            </p>
            <a href="/crm" className="btn-crm">Apri il CRM →</a>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding:"36px 32px",background:"#0a0a0a",
        display:"flex",justifyContent:"space-between",alignItems:"center",
        borderTop:"1px solid #1a1a1a",flexWrap:"wrap",gap:16,
      }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:600,letterSpacing:".2em",color:"#fff" }}>
          ARTEMISIA
        </div>
        <div className="mono" style={{ fontSize:9,color:"rgba(255,255,255,.25)" }}>
          © 2025 — Tutti i diritti riservati
        </div>
      </footer>
    </div>
  );
}
