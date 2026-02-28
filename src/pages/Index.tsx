import { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────
function loadScript(src: string): Promise<void> {
  return new Promise((res) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement("script");
    s.src = src; s.async = true;
    s.onload = () => res();
    document.head.appendChild(s);
  });
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function easeInOut(t: number) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }

// ─────────────────────────────────────────────
// SPLIT TEXT
// ─────────────────────────────────────────────
function SplitText({ text, delay = 0, italic = false }: { text: string; delay?: number; italic?: boolean }) {
  return (
    <span style={{ fontStyle: italic ? "italic" : "normal" }}>
      {text.split("").map((ch, i) => (
        <span key={i} style={{
          display: "inline-block", opacity: 0, transform: "translateY(24px)",
          animation: `charIn .55s cubic-bezier(.22,1,.36,1) ${delay + i * 35}ms forwards`,
        }}>
          {ch === " " ? "\u00a0" : ch}
        </span>
      ))}
    </span>
  );
}

// ─────────────────────────────────────────────
// REVEAL
// ─────────────────────────────────────────────
function Reveal({ children, delay = 0, from = "bottom" }: {
  children: React.ReactNode; delay?: number; from?: "bottom" | "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  const t = { bottom: "translateY(40px)", left: "translateX(-40px)", right: "translateX(40px)" };
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0, transform: vis ? "none" : t[from],
      transition: `opacity .9s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .9s cubic-bezier(.22,1,.36,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const VIDEO_SRC = "/kling_20260207_Image_to_Video__913_0.mp4";
const FEATURES = [
  { num: "01", title: "Pipeline Intelligente",  desc: "Gestisci lead e opportunità con una vista chiara. Ogni deal al posto giusto, sempre.",     from: "left"   as const },
  { num: "02", title: "Automazioni Potenti",     desc: "Elimina il lavoro manuale. Flussi automatici per email, follow-up e notifiche.",            from: "bottom" as const },
  { num: "03", title: "Analisi in Tempo Reale",  desc: "Dashboard con metriche che contano davvero per il tuo business.",                           from: "right"  as const },
  { num: "04", title: "Integrazioni Native",     desc: "Connettiti con gli strumenti che già usi. Tutto sincronizzato.",                            from: "bottom" as const },
];
const STATS = ["3× Più Conversioni", "80% Tempo Risparmiato", "10k+ Aziende Attive", "99.9% Uptime"];

// ─────────────────────────────────────────────
// ZIG-ZAG PATH — normalized 0-1 coords
// Videos travel from top to bottom of section
// A: starts left, B: starts right — mirror paths
// They meet at center (impact) then exit screen
// ─────────────────────────────────────────────
const PATH_A = [
  { x: -0.15, y: 0.00 },  // start: off left
  { x:  0.72, y: 0.15 },  // zig right
  { x:  0.05, y: 0.30 },  // zag left
  { x:  0.65, y: 0.45 },  // zig right
  { x:  0.42, y: 0.52 },  // → center (impact)
  { x:  0.05, y: 0.62 },  // bounce left
  { x:  0.68, y: 0.76 },  // zig right
  { x:  0.05, y: 0.88 },  // zag left
  { x: -0.20, y: 1.05 },  // exit off left
];

const PATH_B = [
  { x:  1.15, y: 0.00 },  // start: off right
  { x:  0.22, y: 0.15 },  // zig left
  { x:  0.88, y: 0.30 },  // zag right
  { x:  0.28, y: 0.45 },  // zig left
  { x:  0.48, y: 0.52 },  // → center (impact)
  { x:  0.88, y: 0.62 },  // bounce right
  { x:  0.25, y: 0.76 },  // zig left
  { x:  0.88, y: 0.88 },  // zag right
  { x:  1.20, y: 1.05 },  // exit off right
];

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────
export default function Index() {
  const [scrolled, setScrolled]     = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [scrollPct, setScrollPct]   = useState(0);
  const [gsapReady, setGsapReady]   = useState(false);
  const [impacting, setImpacting]   = useState(false);

  const videoARef  = useRef<HTMLVideoElement>(null);
  const videoBRef  = useRef<HTMLVideoElement>(null);
  const wrapARef   = useRef<HTMLDivElement>(null);
  const wrapBRef   = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef  = useRef<HTMLDivElement>(null);
  const impactRef  = useRef<HTMLDivElement>(null);
  const killRef    = useRef<(() => void) | null>(null);

  // Load GSAP
  useEffect(() => {
    Promise.all([
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"),
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"),
    ]).then(() => setGsapReady(true));
  }, []);

  // Nav + scroll progress
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      const max = document.body.scrollHeight - window.innerHeight;
      setScrollPct(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // GSAP scroll animation
  useEffect(() => {
    if (!gsapReady) return;
    const gsap = (window as any).gsap;
    const ST   = (window as any).ScrollTrigger;
    if (!gsap || !ST) return;
    gsap.registerPlugin(ST);

    const vA   = videoARef.current;
    const vB   = videoBRef.current;
    const wA   = wrapARef.current;
    const wB   = wrapBRef.current;
    const sec  = sectionRef.current;
    const imp  = impactRef.current;
    if (!vA || !vB || !wA || !wB || !sec) return;

    vA.pause(); vB.pause();
    vA.currentTime = 0; vB.currentTime = 0;

    const isMobile = window.innerWidth < 768;
    const VW = window.innerWidth;
    const VH = window.innerHeight;
    const VSIZE = isMobile ? 110 : 200;

    // Set initial positions
    const initAx = PATH_A[0].x * VW - VSIZE / 2;
    const initBx = PATH_B[0].x * VW - VSIZE / 2;
    gsap.set(wA, { x: initAx, y: 0, opacity: 1 });
    gsap.set(wB, { x: initBx, y: 0, opacity: 1 });

    let lastImpact = false;

    const trigger = ST.create({
      trigger: sec,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self: any) => {
        const p = self.progress; // 0 → 1
        const sH = VH; // sticky height = viewport height

        // ── VIDEO SCRUB ──
        if (vA.readyState >= 2 && vA.duration) {
          vA.currentTime = Math.min(vA.duration * p, vA.duration - 0.01);
        }
        if (vB.readyState >= 2 && vB.duration) {
          vB.currentTime = Math.min(vB.duration * p, vB.duration - 0.01);
        }

        // ── PATH INTERPOLATION ──
        const totalPts = PATH_A.length - 1;
        const rawIdx   = p * totalPts;
        const lo       = Math.min(Math.floor(rawIdx), totalPts - 1);
        const hi       = Math.min(lo + 1, totalPts);
        const t        = rawIdx - lo;
        const et       = easeInOut(t);

        // A position
        const ax = lerp(PATH_A[lo].x, PATH_A[hi].x, et) * VW - VSIZE / 2;
        const ay = lerp(PATH_A[lo].y, PATH_A[hi].y, et) * sH;

        // B position
        const bx = lerp(PATH_B[lo].x, PATH_B[hi].x, et) * VW - VSIZE / 2;
        const by = lerp(PATH_B[lo].y, PATH_B[hi].y, et) * sH;

        gsap.set(wA, { x: ax, y: ay, force3D: true });
        gsap.set(wB, { x: bx, y: by, force3D: true });

        // ── ROTATION (tilt toward movement direction) ──
        if (lo < totalPts) {
          const dxA = PATH_A[hi].x - PATH_A[lo].x;
          const dxB = PATH_B[hi].x - PATH_B[lo].x;
          const rotA = Math.atan2(PATH_A[hi].y - PATH_A[lo].y, PATH_A[hi].x - PATH_A[lo].x) * (180 / Math.PI) * 0.3;
          const rotB = Math.atan2(PATH_B[hi].y - PATH_B[lo].y, PATH_B[hi].x - PATH_B[lo].x) * (180 / Math.PI) * 0.3;
          gsap.set(wA, { rotation: rotA });
          gsap.set(wB, { rotation: rotB });
        }

        // ── IMPACT ZONE (around p=0.52) ──
        const impactCenter = 0.52;
        const impactRadius = 0.04;
        const distToImpact = Math.abs(p - impactCenter);
        const isImpacting  = distToImpact < impactRadius;

        if (isImpacting) {
          const intensity = 1 - distToImpact / impactRadius;
          const scale     = 1 + intensity * 0.18;
          gsap.set([wA, wB], { scale });
          if (imp) {
            gsap.set(imp, {
              opacity: intensity * 0.9,
              scale: 0.5 + intensity * 0.5,
            });
          }
          if (!lastImpact) setImpacting(true);
        } else {
          gsap.set([wA, wB], { scale: 1 });
          if (imp) gsap.set(imp, { opacity: 0, scale: 0.5 });
          if (lastImpact) setImpacting(false);
        }
        lastImpact = isImpacting;

        // ── FADE OUT as videos exit screen ──
        const fadeStart = 0.92;
        if (p > fadeStart) {
          const fadeOut = 1 - (p - fadeStart) / (1 - fadeStart);
          gsap.set([wA, wB], { opacity: fadeOut });
        } else {
          gsap.set([wA, wB], { opacity: 1 });
        }
      },
    });

    killRef.current = () => {
      trigger.kill();
    };

    return () => { killRef.current?.(); };
  }, [gsapReady]);

  return (
    <div style={{
      fontFamily: "'Cormorant Garamond',Georgia,serif",
      background: "#fff", color: "#0a0a0a", overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Instrument+Mono:wght@300;400&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        html{scroll-behavior:smooth;}
        ::selection{background:#0a0a0a;color:#fff;}
        .mono{font-family:'Instrument Mono',monospace;letter-spacing:.12em;text-transform:uppercase;}

        @keyframes charIn{to{opacity:1;transform:translateY(0);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(28px);}to{opacity:1;transform:none;}}
        @keyframes marquee{from{transform:translateX(0);}to{transform:translateX(-50%);}}
        @keyframes rotateSlow{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes impactPulse{
          0%{transform:translate(-50%,-50%) scale(.3);opacity:.9;}
          100%{transform:translate(-50%,-50%) scale(2.5);opacity:0;}
        }

        /* NAV */
        .nav-lk{font-family:'Instrument Mono',monospace;font-size:11px;letter-spacing:.13em;text-transform:uppercase;text-decoration:none;opacity:.55;transition:opacity .2s;}
        .nav-lk:hover{opacity:1;}

        /* BUTTONS */
        .btn-w{display:inline-block;padding:16px 42px;background:#fff;color:#0a0a0a;font-family:'Instrument Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;border:1.5px solid rgba(255,255,255,.75);transition:background .3s,color .3s;}
        .btn-w:hover{background:transparent;color:#fff;}
        .btn-ghost{display:inline-block;padding:16px 42px;background:transparent;color:#fff;font-family:'Instrument Mono',monospace;font-size:10px;letter-spacing:.16em;text-transform:uppercase;text-decoration:none;border:1.5px solid rgba(255,255,255,.28);transition:all .3s;}
        .btn-ghost:hover{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.55);}
        .btn-crm{display:inline-block;padding:20px 64px;background:#fff;color:#0a0a0a;font-family:'Instrument Mono',monospace;font-size:12px;letter-spacing:.18em;text-transform:uppercase;text-decoration:none;border:1.5px solid #fff;transition:background .3s,color .3s;}
        .btn-crm:hover{background:transparent;color:#fff;}

        /* FEATURE CARD */
        .fcard{border:1px solid #e4e4e4;padding:40px 32px 44px;background:#fff;position:relative;overflow:hidden;transition:border-color .35s,box-shadow .35s,transform .35s;}
        .fcard::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:#0a0a0a;transform:scaleX(0);transform-origin:left;transition:transform .45s cubic-bezier(.22,1,.36,1);}
        .fcard:hover::after{transform:scaleX(1);}
        .fcard:hover{border-color:#bbb;transform:translateY(-5px);box-shadow:0 16px 48px rgba(0,0,0,.07);}
        .bnum{position:absolute;bottom:-12px;right:8px;font-family:'Cormorant Garamond',serif;font-size:110px;font-weight:600;color:rgba(0,0,0,.04);line-height:1;pointer-events:none;user-select:none;transition:color .35s;}
        .fcard:hover .bnum{color:rgba(0,0,0,.07);}

        /* VIDEO WRAP */
        .vwrap{
          position:absolute;top:0;left:0;
          will-change:transform;
          filter:drop-shadow(0 12px 40px rgba(0,0,0,.5));
          z-index:10;
          border-radius:3px;
          overflow:hidden;
        }
        .vwrap video{display:block;width:100%;height:100%;object-fit:cover;}
        .vwrap-border{position:absolute;inset:0;border:1px solid rgba(255,255,255,.2);border-radius:3px;pointer-events:none;z-index:2;}

        /* GRAIN */
        .grain{position:fixed;inset:0;pointer-events:none;z-index:9998;opacity:.022;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:180px;}

        /* MOBILE */
        @media(max-width:768px){
          .desk-only{display:none!important;}
          .mob-only{display:flex!important;}
          .hero-btns{flex-direction:column!important;align-items:center!important;gap:12px!important;}
          .features-g{grid-template-columns:1fr!important;}
        }
        @media(min-width:769px){.mob-only{display:none!important;}}
      `}</style>

      <div className="grain" />

      {/* SCROLL PROGRESS */}
      <div style={{
        position:"fixed",top:0,left:0,zIndex:300,
        height:2,background:"#fff",width:`${scrollPct}%`,
        transition:"width .08s linear",
      }} />

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
          letterSpacing:".2em",
          color: scrolled ? "#0a0a0a" : "#fff",
          transition:"color .4s",
        }}>
          ARTEMISIA
        </div>
        <div className="desk-only" style={{ display:"flex",gap:36,alignItems:"center" }}>
          <a href="#features" className="nav-lk" style={{ color:scrolled?"#0a0a0a":"#fff" }}>Funzioni</a>
          <a href="#pricing"  className="nav-lk" style={{ color:scrolled?"#0a0a0a":"#fff" }}>Prezzi</a>
          <a href="/crm" style={{
            padding:"11px 28px",
            background: scrolled ? "#0a0a0a" : "transparent",
            color:"#fff",
            fontFamily:"'Instrument Mono',monospace",fontSize:10,
            letterSpacing:".14em",textTransform:"uppercase",textDecoration:"none",
            border:"1.5px solid",
            borderColor: scrolled ? "#0a0a0a" : "rgba(255,255,255,.5)",
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
        <div style={{
          position:"fixed",inset:0,zIndex:199,background:"#0a0a0a",
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:48,
        }}>
          {[["#features","Funzioni"],["#pricing","Prezzi"],["/crm","CRM"]].map(([href,label],i) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)} style={{
              fontFamily:"'Cormorant Garamond',serif",fontSize:48,fontWeight:300,
              color:"#fff",textDecoration:"none",opacity:0,
              animation:`fadeUp .5s ease ${i*100}ms forwards`,
            }}>{label}</a>
          ))}
        </div>
      )}

      {/* ══════════════════════════════
          HERO — fullscreen video
      ══════════════════════════════ */}
      <section style={{ position:"relative",height:"100vh",overflow:"hidden" }}>
        <video
          autoPlay muted loop playsInline
          style={{ position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover" }}
        >
          <source src={VIDEO_SRC} type="video/mp4" />
        </video>

        {/* Overlay */}
        <div style={{
          position:"absolute",inset:0,
          background:"linear-gradient(to bottom,rgba(0,0,0,.52) 0%,rgba(0,0,0,.18) 45%,rgba(0,0,0,.72) 100%)",
        }} />

        {/* Hero content — centered */}
        <div style={{
          position:"relative",zIndex:2,height:"100%",
          display:"flex",flexDirection:"column",
          alignItems:"center",justifyContent:"center",
          textAlign:"center",padding:"80px 24px 0",
        }}>
          <div
            className="mono"
            style={{ fontSize:10,color:"rgba(255,255,255,.42)",marginBottom:28,opacity:0,animation:"fadeUp .8s ease .3s forwards" }}
          >
            — Software CRM per il Business Moderno
          </div>

          <h1 style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize:"clamp(58px,11vw,124px)",
            fontWeight:300,lineHeight:.92,
            color:"#fff",letterSpacing:"-.02em",marginBottom:36,
          }}>
            <span style={{ display:"block" }}><SplitText text="Il tuo" delay={400} /></span>
            <span style={{ display:"block" }}><SplitText text="business" delay={650} italic /></span>
            <span style={{ display:"block" }}><SplitText text="al centro." delay={900} /></span>
          </h1>

          <p style={{
            fontFamily:"'Cormorant Garamond',serif",
            fontSize:19,fontWeight:300,
            color:"rgba(255,255,255,.68)",
            lineHeight:1.7,maxWidth:420,marginBottom:52,
            opacity:0,animation:"fadeUp .9s ease 1.3s forwards",
          }}>
            Gestisci clienti, pipeline e automazioni da un'unica piattaforma elegante.
          </p>

          <div
            className="hero-btns"
            style={{ display:"flex",gap:16,opacity:0,animation:"fadeUp .9s ease 1.5s forwards" }}
          >
            <a href="/crm" className="btn-w">Inizia Gratis</a>
            <a href="#features" className="btn-ghost">Scopri di più</a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position:"absolute",bottom:36,left:"50%",transform:"translateX(-50%)",
          zIndex:2,opacity:0,animation:"fadeUp .8s ease 2s forwards",
        }}>
          <svg viewBox="0 0 68 68" style={{ width:60,height:60,animation:"rotateSlow 9s linear infinite" }}>
            <defs><path id="cr" d="M 34,34 m -24,0 a 24,24 0 1,1 48,0 a 24,24 0 1,1 -48,0" /></defs>
            <text style={{ fontSize:7.8,fill:"rgba(255,255,255,.45)",fontFamily:"'Instrument Mono',monospace",letterSpacing:"2.4px" }}>
              <textPath href="#cr">SCROLL · SCROLL · SCROLL ·</textPath>
            </text>
          </svg>
          <div style={{
            position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",
            display:"flex",flexDirection:"column",alignItems:"center",gap:2,
          }}>
            <div style={{ width:1,height:12,background:"rgba(255,255,255,.5)" }} />
            <div style={{ borderLeft:"4px solid transparent",borderRight:"4px solid transparent",borderTop:"5px solid rgba(255,255,255,.5)" }} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          MARQUEE
      ══════════════════════════════ */}
      <div style={{ overflow:"hidden",background:"#0a0a0a",padding:"26px 0" }}>
        <div style={{ display:"flex",whiteSpace:"nowrap",animation:"marquee 22s linear infinite" }}>
          {[...Array(4)].flatMap(() =>
            STATS.map((s,i) => (
              <span key={`${s}-${i}`} style={{ display:"inline-flex",alignItems:"center",gap:28,padding:"0 40px" }}>
                <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:300,color:"#fff" }}>{s}</span>
                <span style={{ color:"rgba(255,255,255,.15)",fontSize:14 }}>✦</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* ══════════════════════════════
          GSAP ZIG-ZAG SCROLL SECTION
      ══════════════════════════════ */}
      <section
        ref={sectionRef}
        style={{ position:"relative",height:"600vh",background:"#0a0a0a" }}
      >
        {/* Sticky viewport */}
        <div
          ref={stickyRef}
          style={{ position:"sticky",top:0,height:"100vh",overflow:"hidden" }}
        >
          {/* Subtle grid background */}
          <div style={{
            position:"absolute",inset:0,
            backgroundImage:"linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px)",
            backgroundSize:"80px 80px",pointerEvents:"none",
          }} />

          {/* Section label */}
          <div style={{
            position:"absolute",top:40,left:"50%",transform:"translateX(-50%)",
            zIndex:5,textAlign:"center",pointerEvents:"none",
          }}>
            <div className="mono" style={{ fontSize:9,color:"rgba(255,255,255,.2)",letterSpacing:".2em" }}>
              — Scorri per esplorare
            </div>
          </div>

          {/* ── IMPACT EFFECT (center, visible during impact) ── */}
          <div
            ref={impactRef}
            style={{
              position:"absolute",top:"50%",left:"50%",
              transform:"translate(-50%,-50%)",
              width:300,height:300,
              pointerEvents:"none",zIndex:8,
              opacity:0,
            }}
          >
            {/* Radial glow */}
            <div style={{
              position:"absolute",inset:0,
              background:"radial-gradient(circle,rgba(255,255,255,.2) 0%,transparent 70%)",
              borderRadius:"50%",
            }} />
            {/* Ring 1 */}
            <div style={{
              position:"absolute",inset:-40,
              border:"1px solid rgba(255,255,255,.3)",
              borderRadius:"50%",
            }} />
            {/* Ring 2 */}
            <div style={{
              position:"absolute",inset:-90,
              border:"1px solid rgba(255,255,255,.12)",
              borderRadius:"50%",
            }} />
            {/* Impact word */}
            <div style={{
              position:"absolute",top:"50%",left:"50%",
              transform:"translate(-50%,-50%)",
              fontFamily:"'Cormorant Garamond',serif",
              fontSize:"clamp(32px,6vw,72px)",
              fontWeight:300,fontStyle:"italic",
              color:"rgba(255,255,255,.12)",
              whiteSpace:"nowrap",letterSpacing:"-.02em",
            }}>
              Artemisia
            </div>
          </div>

          {/* ── VIDEO A ── */}
          <div
            ref={wrapARef}
            className="vwrap"
            style={{ width:200,height:200 }}
          >
            <video
              ref={videoARef}
              muted playsInline preload="auto"
              style={{ width:"100%",height:"100%",objectFit:"cover" }}
            >
              <source src={VIDEO_SRC} type="video/mp4" />
            </video>
            <div className="vwrap-border" />
          </div>

          {/* ── VIDEO B (mirrored) ── */}
          <div
            ref={wrapBRef}
            className="vwrap"
            style={{ width:200,height:200 }}
          >
            <video
              ref={videoBRef}
              muted playsInline preload="auto"
              style={{ width:"100%",height:"100%",objectFit:"cover",transform:"scaleX(-1)" }}
            >
              <source src={VIDEO_SRC} type="video/mp4" />
            </video>
            <div className="vwrap-border" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          FEATURES
      ══════════════════════════════ */}
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
        <div
          className="features-g"
          style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:2 }}
        >
          {FEATURES.map((f,i) => (
            <Reveal key={f.num} from={f.from} delay={i*80}>
              <div className="fcard">
                <div className="bnum">{f.num}</div>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:28 }}>
                  <span className="mono" style={{ fontSize:10,opacity:.3 }}>{f.num}</span>
                </div>
                <h3 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:400,marginBottom:14,lineHeight:1.2 }}>
                  {f.title}
                </h3>
                <p style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:17,fontWeight:300,lineHeight:1.8,opacity:.58 }}>
                  {f.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════
          STATS
      ══════════════════════════════ */}
      <section style={{ background:"#f6f6f6",padding:"100px 32px" }}>
        <div style={{ maxWidth:1200,margin:"0 auto" }}>
          <Reveal from="left">
            <span className="mono" style={{ fontSize:10,opacity:.3,display:"block",marginBottom:56 }}>— Numeri che parlano</span>
          </Reveal>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:32 }}>
            {[
              { val:"3×",    label:"Più conversioni" },
              { val:"80%",   label:"Tempo risparmiato" },
              { val:"10k+",  label:"Aziende attive" },
              { val:"99.9%", label:"Uptime garantito" },
            ].map((s,i) => (
              <Reveal key={s.val} from={i%2===0?"left":"right"} delay={i*80}>
                <div style={{ borderTop:"1px solid #d8d8d8",paddingTop:28 }}>
                  <div style={{
                    fontFamily:"'Cormorant Garamond',serif",
                    fontSize:"clamp(48px,5vw,72px)",
                    fontWeight:300,lineHeight:1,marginBottom:10,
                  }}>{s.val}</div>
                  <div className="mono" style={{ fontSize:9,opacity:.38 }}>{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          TESTIMONIAL
      ══════════════════════════════ */}
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

      {/* ══════════════════════════════
          CTA — APRI IL CRM
      ══════════════════════════════ */}
      <section id="crm" style={{ background:"#0a0a0a",padding:"160px 32px",position:"relative",overflow:"hidden" }}>
        {/* Decorative rings */}
        {[480,760,1040].map((size,i) => (
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
            <a href="/crm" className="btn-crm">
              Apri il CRM →
            </a>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
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
