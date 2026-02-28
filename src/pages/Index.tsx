import { useEffect, useRef, useState, useCallback } from "react";

// ─────────────────────────────────────────────
// IMAGE PATHS
// ─────────────────────────────────────────────
const MIC_ONLY  = "/unnamed_9_-removebg-preview.png";
const HAND_OPEN = "/IMG_20260228_222718-removebg-preview.png";
const HAND_MID  = "/unnamed_11_-removebg-preview.png";
const HAND_GRIP = "/IMG_20260228_222748-removebg-preview.png";

// ─────────────────────────────────────────────
// EASING
// ─────────────────────────────────────────────
function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }
function easeIn(t: number)  { return t * t * t; }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function phase(p: number, start: number, end: number) {
  return clamp((p - start) / (end - start), 0, 1);
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
    const o = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVis(true); },
      { threshold: 0.08 }
    );
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  const t: Record<string, string> = {
    bottom: "translateY(44px)", left: "translateX(-44px)", right: "translateX(44px)",
  };
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "none" : t[from],
      transition: `opacity .95s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .95s cubic-bezier(.22,1,.36,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
export default function Index() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [scrollPct, setScrollPct] = useState(0);

  // Hero text reveal
  const [showL1, setShowL1] = useState(true);
  const [showL2, setShowL2] = useState(false);
  const [showL3, setShowL3] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [showBtns, setShowBtns] = useState(false);

  // Mic scene state
  const [handFrame, setHandFrame]   = useState(0); // 0=open 1=mid 2=grip
  const [micVisible, setMicVisible] = useState(true);
  const [ctaVisible, setCtaVisible] = useState(false);

  // Mic scene refs
  const micSceneRef = useRef<HTMLElement>(null);
  const micRef      = useRef<HTMLDivElement>(null);
  const handRef     = useRef<HTMLDivElement>(null);
  const glowRef     = useRef<HTMLDivElement>(null);
  const ctaRef      = useRef<HTMLDivElement>(null);
  const rafRef      = useRef(0);

  // Smooth animation state
  const anim = useRef({
    micY: -160, micS: 0.5, micO: 0,
    handY: 200, handO: 0,
    glowS: 0.3, glowO: 0,
    ctaO: 0, ctaY: 40,
    frame: 0,
  });

  // ── SCROLL HANDLER ──
  const onScroll = useCallback(() => {
    const sy  = window.scrollY;
    const VH  = window.innerHeight;
    const docH = document.body.scrollHeight - window.innerHeight;

    setScrolled(sy > 60);
    setScrollPct(docH > 0 ? (sy / docH) * 100 : 0);

    // Hero text reveal
    const hp = clamp(sy / VH, 0, 1);
    setShowL2(hp >= 0.04);
    setShowL3(hp >= 0.09);
    setShowSub(hp >= 0.15);
    setShowBtns(hp >= 0.21);

    // Mic scene progress
    const sec = micSceneRef.current;
    if (sec) {
      const rect  = sec.getBoundingClientRect();
      const totalH = sec.offsetHeight - VH;
      const p     = clamp(-rect.top / totalH, 0, 1);
      const a     = anim.current;

      // Phase 1: 0–0.28 mic descends
      const p1 = easeOut(phase(p, 0, 0.28));
      // Phase 2: 0.28–0.52 hand rises
      const p2 = easeOut(phase(p, 0.28, 0.52));
      // Phase 3: 0.52–0.68 grip
      const p3 = phase(p, 0.52, 0.68);
      // Phase 4: 0.68–1.0 drop + cta
      const p4 = easeOut(phase(p, 0.68, 1.0));

      // Mic
      a.micY = lerp(-160, p4 > 0 ? lerp(0, 70, easeIn(p4)) : 0, p1);
      a.micS = lerp(0.5, 1, p1);
      a.micO = lerp(0, 1, p1);

      // Hand
      a.handY = lerp(200, p4 > 0 ? lerp(0, 70, easeIn(p4)) : 0, p2);
      a.handO = lerp(0, 1, p2);

      // Frame swap
      const newFrame = p3 < 0.38 ? 0 : p3 < 0.72 ? 1 : 2;
      if (newFrame !== a.frame) {
        a.frame = newFrame;
        setHandFrame(newFrame);
        setMicVisible(newFrame < 2);
      }

      // Glow
      const glowT = clamp((p3 - 0.65) / 0.35, 0, 1);
      a.glowS = lerp(0.3, p4 > 0 ? lerp(1.4, 0.6, p4) : 1.4, glowT);
      a.glowO = lerp(0, p4 > 0 ? lerp(0.75, 0, p4) : 0.75, glowT);

      // CTA text
      a.ctaO = lerp(0, 1, easeOut(clamp((p4 - 0.3) / 0.7, 0, 1)));
      a.ctaY = lerp(40, 0, easeOut(clamp((p4 - 0.3) / 0.7, 0, 1)));

      setCtaVisible(a.ctaO > 0.05);
    }
  }, []);

  // ── RAF LOOP — apply smooth values to DOM ──
  useEffect(() => {
    let prev = { ...anim.current };
    const smooth = { ...anim.current };
    const F = 0.09;

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const a = anim.current;

      smooth.micY  = lerp(smooth.micY,  a.micY,  F);
      smooth.micS  = lerp(smooth.micS,  a.micS,  F);
      smooth.micO  = lerp(smooth.micO,  a.micO,  F);
      smooth.handY = lerp(smooth.handY, a.handY, F);
      smooth.handO = lerp(smooth.handO, a.handO, F);
      smooth.glowS = lerp(smooth.glowS, a.glowS, F);
      smooth.glowO = lerp(smooth.glowO, a.glowO, F);
      smooth.ctaO  = lerp(smooth.ctaO,  a.ctaO,  F);
      smooth.ctaY  = lerp(smooth.ctaY,  a.ctaY,  F);

      const mic  = micRef.current;
      const hand = handRef.current;
      const glow = glowRef.current;
      const cta  = ctaRef.current;

      if (mic) {
        mic.style.transform = `translateX(-50%) translateY(calc(-50% + ${smooth.micY}px)) scale(${smooth.micS})`;
        mic.style.opacity   = String(smooth.micO);
      }
      if (hand) {
        hand.style.transform = `translateX(-50%) translateY(calc(-50% + ${smooth.handY}px))`;
        hand.style.opacity   = String(smooth.handO);
      }
      if (glow) {
        glow.style.transform = `translate(-50%,-50%) scale(${smooth.glowS})`;
        glow.style.opacity   = String(smooth.glowO);
      }
      if (cta) {
        cta.style.opacity   = String(smooth.ctaO);
        cta.style.transform = `translateX(-50%) translateY(${smooth.ctaY}px)`;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // ── SCROLL LISTENER ──
  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  return (
    <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", background: "#fff", color: "#0a0a0a", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Instrument+Mono:wght@300;400&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        html{scroll-behavior:smooth;}
        ::selection{background:#d4af37;color:#000;}
        .mono{font-family:'Instrument Mono',monospace;letter-spacing:.12em;text-transform:uppercase;}

        @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:none;}}
        @keyframes marquee{from{transform:translateX(0);}to{transform:translateX(-50%);}}
        @keyframes rotateSlow{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes spotPulse{0%,100%{opacity:.12;}50%{opacity:.22;}}
        @keyframes goldShimmer{
          0%,100%{filter:drop-shadow(0 0 10px rgba(212,175,55,.25));}
          50%{filter:drop-shadow(0 0 28px rgba(212,175,55,.75)) drop-shadow(0 0 48px rgba(212,175,55,.3));}
        }
        @keyframes particleDrift{
          0%{transform:translateY(0) rotate(0deg);opacity:.7;}
          100%{transform:translateY(120px) rotate(200deg);opacity:0;}
        }

        .nav-lk{font-family:'Instrument Mono',monospace;font-size:11px;letter-spacing:.13em;text-transform:uppercase;text-decoration:none;opacity:.55;transition:opacity .2s;}
        .nav-lk:hover{opacity:1;}

        .btn-gold{display:inline-block;padding:16px 48px;background:transparent;color:#d4af37;font-family:'Instrument Mono',monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;border:1px solid rgba(212,175,55,.6);transition:all .35s;}
        .btn-gold:hover{background:rgba(212,175,55,.1);border-color:#d4af37;}
        .btn-ghost-w{display:inline-block;padding:16px 48px;background:transparent;color:#fff;font-family:'Instrument Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;text-decoration:none;border:1.5px solid rgba(255,255,255,.3);transition:all .3s;}
        .btn-ghost-w:hover{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.6);}
        .btn-w{display:inline-block;padding:16px 48px;background:#fff;color:#0a0a0a;font-family:'Instrument Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;text-decoration:none;border:1.5px solid #fff;transition:all .3s;}
        .btn-w:hover{background:transparent;color:#fff;}

        .fcard{border:1px solid #e4e4e4;padding:40px 32px 44px;position:relative;overflow:hidden;transition:border-color .35s,box-shadow .35s,transform .35s;background:#fff;}
        .fcard::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:#d4af37;transform:scaleX(0);transform-origin:left;transition:transform .45s cubic-bezier(.22,1,.36,1);}
        .fcard:hover::after{transform:scaleX(1);}
        .fcard:hover{border-color:#ccc;transform:translateY(-5px);box-shadow:0 16px 48px rgba(0,0,0,.06);}
        .bnum{position:absolute;bottom:-12px;right:8px;font-family:'Cormorant Garamond',serif;font-size:110px;font-weight:600;color:rgba(0,0,0,.035);line-height:1;pointer-events:none;user-select:none;}

        .grain{position:fixed;inset:0;pointer-events:none;z-index:9998;opacity:.022;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:180px;}

        @media(max-width:768px){
          .desk-only{display:none!important;}
          .mob-only{display:flex!important;}
          .hero-btns{flex-direction:column!important;align-items:center!important;gap:12px!important;}
          .features-g{grid-template-columns:1fr!important;}
          .stats-g{grid-template-columns:1fr 1fr!important;}
          .mic-size{width:clamp(100px,22vw,150px)!important;}
          .hand-size{width:clamp(140px,30vw,200px)!important;}
        }
        @media(min-width:769px){.mob-only{display:none!important;}}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:#d4af37;border-radius:2px;}
      `}</style>

      <div className="grain" />

      {/* SCROLL PROGRESS */}
      <div style={{ position:"fixed",top:0,left:0,zIndex:300,height:2,background:"#d4af37",width:`${scrollPct}%`,transition:"width .08s linear" }} />

      {/* ── NAV ── */}
      <nav style={{
        position:"fixed",top:0,left:0,right:0,zIndex:200,
        padding:"22px 32px",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        background:scrolled?"rgba(10,10,10,.96)":"transparent",
        backdropFilter:scrolled?"blur(20px)":"none",
        borderBottom:scrolled?"1px solid #1a1a1a":"none",
        transition:"all .4s ease",
      }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,letterSpacing:".25em",color:"#fff",transition:"color .4s" }}>
          NOME ATTORE
        </div>
        <div className="desk-only" style={{ display:"flex",gap:36,alignItems:"center" }}>
          {["Bio","Spettacoli","Portfolio","Contatti"].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} className="nav-lk" style={{ color:"rgba(255,255,255,.6)" }}>{l}</a>
          ))}
        </div>
        <button className="mob-only" onClick={() => setMenuOpen(!menuOpen)} style={{ background:"none",border:"none",flexDirection:"column",gap:5,padding:4 }}>
          {[0,1,2].map(i => (
            <span key={i} style={{
              display:"block",width:22,height:1.5,background:"#fff",transition:"all .3s",
              transform:menuOpen&&i===0?"rotate(45deg) translate(4px,4px)":menuOpen&&i===2?"rotate(-45deg) translate(4px,-4px)":"none",
              opacity:menuOpen&&i===1?0:1,
            }} />
          ))}
        </button>
      </nav>

      {menuOpen && (
        <div style={{ position:"fixed",inset:0,zIndex:199,background:"#0a0a0a",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:48 }}>
          {["Bio","Spettacoli","Portfolio","Contatti"].map((l,i) => (
            <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setMenuOpen(false)} style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:48,fontWeight:300,color:"#fff",textDecoration:"none",opacity:0,animation:`fadeUp .5s ease ${i*80}ms forwards` }}>{l}</a>
          ))}
        </div>
      )}

      {/* ══════════════════════════════
          HERO — dark, cinematic
      ══════════════════════════════ */}
      <section style={{ position:"relative",height:"100vh",overflow:"hidden",background:"#0a0a0a" }}>
        {/* Spotlight from top */}
        <div style={{ position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"300px solid transparent",borderRight:"300px solid transparent",borderTop:"100vh solid rgba(212,175,55,.05)",pointerEvents:"none",animation:"spotPulse 4s ease-in-out infinite",filter:"blur(24px)" }} />

        {/* Vertical gold lines */}
        {[25, 50, 75].map(pct => (
          <div key={pct} style={{ position:"absolute",top:0,bottom:0,left:`${pct}%`,width:1,background:`linear-gradient(to bottom, transparent, rgba(212,175,55,.06) 30%, rgba(212,175,55,.06) 70%, transparent)`,pointerEvents:"none" }} />
        ))}

        {/* Hero content */}
        <div style={{ position:"relative",zIndex:2,height:"100%",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"80px 24px 0" }}>
          <div className="mono" style={{ fontSize:9,color:"rgba(212,175,55,.6)",marginBottom:32,letterSpacing:".3em",opacity:showL1?1:0,transform:showL1?"none":"translateY(12px)",transition:"all .7s ease" }}>
            — Attore · Performer · Artista
          </div>

          <h1 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(56px,12vw,130px)",fontWeight:300,lineHeight:.9,color:"#fff",letterSpacing:"-.01em",marginBottom:40 }}>
            {/* Line 1 */}
            <div style={{ overflow:"hidden",paddingBottom:".08em" }}>
              <div style={{ opacity:showL1?1:0,transform:showL1?"translateY(0)":"translateY(100%)",transition:"all .85s cubic-bezier(.22,1,.36,1) 0ms" }}>
                Ogni
              </div>
            </div>
            {/* Line 2 */}
            <div style={{ overflow:"hidden",paddingBottom:".08em" }}>
              <div style={{ fontStyle:"italic",color:"#d4af37",opacity:showL2?1:0,transform:showL2?"translateY(0)":"translateY(100%)",transition:"all .85s cubic-bezier(.22,1,.36,1) 50ms" }}>
                scena
              </div>
            </div>
            {/* Line 3 */}
            <div style={{ overflow:"hidden",paddingBottom:".08em" }}>
              <div style={{ opacity:showL3?1:0,transform:showL3?"translateY(0)":"translateY(100%)",transition:"all .85s cubic-bezier(.22,1,.36,1) 100ms" }}>
                racconta.
              </div>
            </div>
          </h1>

          <p style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:300,color:"rgba(255,255,255,.55)",lineHeight:1.75,maxWidth:400,marginBottom:52,opacity:showSub?1:0,transform:showSub?"none":"translateY(16px)",transition:"all .9s cubic-bezier(.22,1,.36,1)" }}>
            Vent'anni di palcoscenico, cinema e televisione. Un percorso unico tra emozione e tecnica.
          </p>

          <div className="hero-btns" style={{ display:"flex",gap:16,opacity:showBtns?1:0,transform:showBtns?"none":"translateY(16px)",transition:"all .9s cubic-bezier(.22,1,.36,1)" }}>
            <a href="#spettacoli" className="btn-gold">Scopri il portfolio</a>
            <a href="#contatti"   className="btn-ghost-w">Contattami</a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position:"absolute",bottom:32,left:"50%",transform:"translateX(-50%)",zIndex:2,opacity:showBtns?0.6:0,transition:"opacity .9s ease 300ms" }}>
          <svg viewBox="0 0 68 68" style={{ width:52,height:52,animation:"rotateSlow 10s linear infinite" }}>
            <defs><path id="cr" d="M 34,34 m -24,0 a 24,24 0 1,1 48,0 a 24,24 0 1,1 -48,0" /></defs>
            <text style={{ fontSize:7.5,fill:"rgba(212,175,55,.5)",fontFamily:"'Instrument Mono',monospace",letterSpacing:"2.2px" }}>
              <textPath href="#cr">SCROLL · SCROLL · SCROLL ·</textPath>
            </text>
          </svg>
          <div style={{ position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:2 }}>
            <div style={{ width:1,height:12,background:"rgba(212,175,55,.5)" }} />
            <div style={{ borderLeft:"4px solid transparent",borderRight:"4px solid transparent",borderTop:"5px solid rgba(212,175,55,.5)" }} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          MIC SCENE — 400vh scroll driven
      ══════════════════════════════ */}
      <section
        ref={micSceneRef}
        style={{ position:"relative", height:"400vh", background:"#000" }}
      >
        <div style={{ position:"sticky",top:0,height:"100vh",overflow:"hidden",background:"radial-gradient(ellipse 70% 60% at 50% 0%, #120800 0%, #000 70%)" }}>

          {/* Spotlight cone */}
          <div style={{ position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"250px solid transparent",borderRight:"250px solid transparent",borderTop:"90vh solid rgba(212,175,55,.06)",pointerEvents:"none",animation:"spotPulse 3.5s ease-in-out infinite",filter:"blur(20px)" }} />
          <div style={{ position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"100px solid transparent",borderRight:"100px solid transparent",borderTop:"75vh solid rgba(255,220,100,.05)",pointerEvents:"none",filter:"blur(6px)" }} />

          {/* Gold dust particles */}
          {[...Array(10)].map((_, i) => (
            <div key={i} style={{
              position:"absolute",
              top:`${8 + (i % 4) * 8}%`,
              left:`${28 + i * 5}%`,
              width: i % 3 === 0 ? 3 : 2,
              height: i % 3 === 0 ? 3 : 2,
              borderRadius:"50%",
              background:"#d4af37",
              animation:`particleDrift ${2.5 + (i % 3) * .8}s ease-in ${i * 0.28}s infinite`,
              opacity:0,
            }} />
          ))}

          {/* Floor line */}
          <div style={{ position:"absolute",bottom:"18%",left:"8%",right:"8%",height:1,background:"linear-gradient(90deg,transparent,rgba(212,175,55,.12),transparent)" }} />

          {/* GLOW BURST */}
          <div ref={glowRef} style={{
            position:"absolute",top:"48%",left:"50%",
            width:340,height:340,
            borderRadius:"50%",
            background:"radial-gradient(circle,rgba(212,175,55,.3) 0%,rgba(212,175,55,.08) 45%,transparent 70%)",
            transform:"translate(-50%,-50%) scale(0.3)",
            opacity:0,pointerEvents:"none",filter:"blur(10px)",
          }} />

          {/* MICROPHONE */}
          {micVisible && (
            <div ref={micRef} style={{
              position:"absolute",
              top:"44%",left:"50%",
              transform:"translateX(-50%) translateY(-50%)",
              opacity:0,
              willChange:"transform,opacity",
              zIndex:10,
              animation:"goldShimmer 2.8s ease-in-out infinite",
            }}>
              <img
                src={MIC_ONLY}
                alt="Microfono"
                className="mic-size"
                style={{ width:"clamp(110px,16vw,190px)",height:"auto",display:"block",filter:"drop-shadow(0 8px 40px rgba(0,0,0,.9))" }}
              />
            </div>
          )}

          {/* HAND */}
          <div ref={handRef} style={{
            position:"absolute",
            top:"56%",left:"50%",
            transform:"translateX(-50%) translateY(-50%)",
            opacity:0,
            willChange:"transform,opacity",
            zIndex: handFrame === 2 ? 12 : 8,
          }}>
            <img
              src={handFrame === 0 ? HAND_OPEN : handFrame === 1 ? HAND_MID : HAND_GRIP}
              alt="Mano"
              className="hand-size"
              style={{ width:"clamp(150px,22vw,240px)",height:"auto",display:"block",filter:"drop-shadow(0 16px 48px rgba(0,0,0,.95))",transition:"opacity .1s ease" }}
            />
          </div>

          {/* CTA overlay */}
          <div ref={ctaRef} style={{
            position:"absolute",bottom:"12%",left:"50%",
            transform:"translateX(-50%) translateY(40px)",
            textAlign:"center",opacity:0,
            willChange:"transform,opacity",pointerEvents:ctaVisible?"auto":"none",
            whiteSpace:"nowrap",
          }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(26px,4.5vw,52px)",fontWeight:300,color:"#fff",letterSpacing:".06em",lineHeight:1.1,marginBottom:14 }}>
              <em>Il palco è pronto.</em>
            </div>
            <div className="mono" style={{ fontSize:9,color:"rgba(212,175,55,.7)",marginBottom:28,letterSpacing:".24em" }}>
              — Scopri il percorso —
            </div>
            <a href="#spettacoli" className="btn-gold">Entra in scena</a>
          </div>

          {/* Scroll hint at top */}
          <div style={{ position:"absolute",bottom:28,left:"50%",transform:"translateX(-50%)",opacity:.3,pointerEvents:"none" }}>
            <div className="mono" style={{ fontSize:8,color:"rgba(255,255,255,.4)",textAlign:"center",letterSpacing:".18em" }}>Scorri</div>
            <div style={{ width:1,height:28,background:"linear-gradient(to bottom,rgba(212,175,55,.5),transparent)",margin:"6px auto 0" }} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          MARQUEE
      ══════════════════════════════ */}
      <div style={{ overflow:"hidden",background:"#0a0a0a",padding:"24px 0",borderTop:"1px solid #1a1a1a" }}>
        <div style={{ display:"flex",whiteSpace:"nowrap",animation:"marquee 24s linear infinite" }}>
          {[...Array(4)].flatMap(() =>
            ["Cinema","Teatro","Televisione","Doppiaggio","Regia","Palcoscenico"].map((s,i) => (
              <span key={`${s}-${i}`} style={{ display:"inline-flex",alignItems:"center",gap:24,padding:"0 32px" }}>
                <span style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:300,color:"rgba(255,255,255,.5)",fontStyle:"italic" }}>{s}</span>
                <span style={{ color:"rgba(212,175,55,.3)",fontSize:10 }}>✦</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* ══════════════════════════════
          BIO
      ══════════════════════════════ */}
      <section id="bio" style={{ padding:"120px 32px",maxWidth:1100,margin:"0 auto" }}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:80,alignItems:"center" }}>
          <Reveal from="left">
            <div>
              <div className="mono" style={{ fontSize:9,opacity:.3,marginBottom:20 }}>— Chi sono</div>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(36px,5vw,66px)",fontWeight:300,lineHeight:1,marginBottom:32 }}>
                Una carriera<br /><em style={{ color:"#d4af37" }}>costruita</em><br />sul palco.
              </h2>
              <p style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:300,lineHeight:1.85,opacity:.6,marginBottom:28 }}>
                Formatosi presso il Teatro Stabile, ha calcato i palchi di tutta Italia con ruoli protagonisti in opere classiche e contemporanee. La sua tecnica unisce tradizione e sperimentazione.
              </p>
              <p style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:300,lineHeight:1.85,opacity:.6,marginBottom:40 }}>
                Al cinema ha collaborato con i più importanti registi italiani, portando in scena personaggi complessi con una presenza magnetica.
              </p>
              <a href="#contatti" className="btn-gold" style={{ fontSize:10 }}>Collabora con me</a>
            </div>
          </Reveal>
          <Reveal from="right" delay={120}>
            {/* Photo placeholder */}
            <div style={{ aspectRatio:"3/4",background:"#111",position:"relative",overflow:"hidden" }}>
              <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
                <div className="mono" style={{ fontSize:9,opacity:.2 }}>Foto attore</div>
              </div>
              <div style={{ position:"absolute",bottom:0,left:0,right:0,height:"40%",background:"linear-gradient(to top,rgba(0,0,0,.4),transparent)" }} />
              <div style={{ position:"absolute",top:16,right:16,width:40,height:40,border:"1px solid rgba(212,175,55,.3)" }} />
              <div style={{ position:"absolute",bottom:16,left:16,width:40,height:40,border:"1px solid rgba(212,175,55,.3)" }} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════
          SPETTACOLI
      ══════════════════════════════ */}
      <section id="spettacoli" style={{ background:"#f8f8f6",padding:"100px 32px" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <Reveal from="left">
            <div className="mono" style={{ fontSize:9,opacity:.3,marginBottom:20 }}>— Spettacoli recenti</div>
          </Reveal>
          <Reveal delay={60}>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(36px,5vw,72px)",fontWeight:300,lineHeight:1,marginBottom:64 }}>
              Opere &<br /><em>produzioni.</em>
            </h2>
          </Reveal>
          <div className="features-g" style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:2 }}>
            {[
              { num:"01", title:"Amleto",       sub:"Teatro Stabile · 2024",   role:"Protagonista" },
              { num:"02", title:"La Locandiera", sub:"Tournée nazionale · 2023", role:"Mirandolino" },
              { num:"03", title:"L'Avaro",       sub:"Festival estivo · 2023",  role:"Arpagone" },
              { num:"04", title:"Otello",        sub:"Arena · 2022",            role:"Iago" },
            ].map((s,i) => (
              <Reveal key={s.num} from={i%2===0?"left":"right"} delay={i*60}>
                <div className="fcard">
                  <div className="bnum">{s.num}</div>
                  <div className="mono" style={{ fontSize:8,opacity:.3,marginBottom:20 }}>{s.num}</div>
                  <h3 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:400,marginBottom:8 }}>{s.title}</h3>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontStyle:"italic",color:"#d4af37",marginBottom:8 }}>{s.role}</div>
                  <div className="mono" style={{ fontSize:8,opacity:.3 }}>{s.sub}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          STATS
      ══════════════════════════════ */}
      <section style={{ background:"#0a0a0a",padding:"100px 32px" }}>
        <div style={{ maxWidth:1100,margin:"0 auto" }}>
          <div className="stats-g" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:32 }}>
            {[
              { val:"20+", label:"Anni di carriera" },
              { val:"80+", label:"Produzioni" },
              { val:"15",  label:"Premi vinti" },
              { val:"3",   label:"Lingue parlate" },
            ].map((s,i) => (
              <Reveal key={s.val} from={i%2===0?"left":"right"} delay={i*60}>
                <div style={{ borderTop:"1px solid #2a2a2a",paddingTop:28 }}>
                  <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(44px,5vw,68px)",fontWeight:300,lineHeight:1,marginBottom:10,color:"#d4af37" }}>{s.val}</div>
                  <div className="mono" style={{ fontSize:8,color:"rgba(255,255,255,.3)" }}>{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          CONTATTI CTA
      ══════════════════════════════ */}
      <section id="contatti" style={{ background:"#0a0a0a",padding:"160px 32px",position:"relative",overflow:"hidden",borderTop:"1px solid #111" }}>
        {[400,700,980].map((s,i) => (
          <div key={i} style={{ position:"absolute",width:s,height:s,borderRadius:"50%",border:"1px solid rgba(212,175,55,.04)",top:"50%",left:"50%",transform:"translate(-50%,-50%)",pointerEvents:"none" }} />
        ))}
        <div style={{ maxWidth:660,margin:"0 auto",textAlign:"center",position:"relative" }}>
          <Reveal from="left">
            <div className="mono" style={{ fontSize:9,color:"rgba(212,175,55,.5)",marginBottom:24,letterSpacing:".24em" }}>— Contatti</div>
          </Reveal>
          <Reveal delay={80}>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(48px,8vw,96px)",fontWeight:300,lineHeight:.92,color:"#fff",letterSpacing:"-.01em",marginBottom:28 }}>
              Scrivimi.<br /><em style={{ color:"#d4af37" }}>Creiamo.</em>
            </h2>
          </Reveal>
          <Reveal from="right" delay={140}>
            <p style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:19,fontWeight:300,color:"rgba(255,255,255,.38)",lineHeight:1.75,marginBottom:52 }}>
              Per produzioni, collaborazioni, interviste o qualsiasi progetto che richieda una presenza scenica autentica.
            </p>
            <a href="mailto:contatti@attore.it" className="btn-gold" style={{ fontSize:11 }}>
              Invia un messaggio →
            </a>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding:"32px",background:"#000",display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"1px solid #1a1a1a",flexWrap:"wrap",gap:12 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:600,letterSpacing:".25em",color:"#fff" }}>NOME ATTORE</div>
        <div className="mono" style={{ fontSize:8,color:"rgba(255,255,255,.2)" }}>© 2025 — Tutti i diritti riservati</div>
      </footer>
    </div>
  );
}
