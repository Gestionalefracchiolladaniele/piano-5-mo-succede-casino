import { useEffect, useRef, useState, useCallback } from "react";

// ─────────────────────────────────────────────
// IMAGE PATHS
// ─────────────────────────────────────────────
const MIC_ONLY = "/unnamed_9_-removebg-preview.png";
const HAND_OPEN = "/IMG_20260228_222718-removebg-preview.png";
const HAND_MID = "/unnamed_11_-removebg-preview.png";
const HAND_GRIP = "/IMG_20260228_222748-removebg-preview.png";

// ─────────────────────────────────────────────
// EASING
// ─────────────────────────────────────────────
function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}
function easeIn(t: number) {
  return t * t * t;
}
function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}
function phase(p: number, start: number, end: number) {
  return clamp((p - start) / (end - start), 0, 1);
}

// ─────────────────────────────────────────────
// REVEAL
// ─────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  from = "bottom",
}: {
  children: React.ReactNode;
  delay?: number;
  from?: "bottom" | "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setVis(true);
    }, { threshold: 0.08 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  const t: Record<string, string> = {
    bottom: "translateY(44px)",
    left: "translateX(-44px)",
    right: "translateX(44px)",
  };
  return (
    <div
      ref={ref}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "none" : t[from],
        transition: `opacity .95s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .95s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
export default function Index() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);

  // Hero text reveal
  const [showL1, setShowL1] = useState(true);
  const [showL2, setShowL2] = useState(false);
  const [showL3, setShowL3] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [showBtns, setShowBtns] = useState(false);

  // Mic scene state
  const [handFrame, setHandFrame] = useState(0); // 0=open 1=mid 2=grip
  const [micVisible, setMicVisible] = useState(true);
  const [ctaVisible, setCtaVisible] = useState(false);

  // Mic scene refs
  const micSceneRef = useRef<HTMLElement>(null);
  const micRef = useRef<HTMLDivElement>(null);
  const handRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  // Smooth animation state
  const anim = useRef({
    micY: -160,
    micS: 0.5,
    micO: 0,
    handY: 200,
    handO: 0,
    glowS: 0.3,
    glowO: 0,
    ctaO: 0,
    ctaY: 40,
    frame: 0,
  });

  // ── SCROLL HANDLER ──
  const onScroll = useCallback(() => {
    const sy = window.scrollY;
    const VH = window.innerHeight;
    const docH = document.body.scrollHeight - window.innerHeight;

    setScrolled(sy > 40);
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
      const rect = sec.getBoundingClientRect();
      const totalH = sec.offsetHeight - VH;
      const p = clamp(-rect.top / totalH, 0, 1);
      const a = anim.current;

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
    const smooth = { ...anim.current };
    const F = 0.09;

    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const a = anim.current;

      smooth.micY = lerp(smooth.micY, a.micY, F);
      smooth.micS = lerp(smooth.micS, a.micS, F);
      smooth.micO = lerp(smooth.micO, a.micO, F);
      smooth.handY = lerp(smooth.handY, a.handY, F);
      smooth.handO = lerp(smooth.handO, a.handO, F);
      smooth.glowS = lerp(smooth.glowS, a.glowS, F);
      smooth.glowO = lerp(smooth.glowO, a.glowO, F);
      smooth.ctaO = lerp(smooth.ctaO, a.ctaO, F);
      smooth.ctaY = lerp(smooth.ctaY, a.ctaY, F);

      const mic = micRef.current;
      const hand = handRef.current;
      const glow = glowRef.current;
      const cta = ctaRef.current;

      if (mic) {
        mic.style.transform = `translateX(-50%) translateY(calc(-50% + ${smooth.micY}px)) scale(${smooth.micS})`;
        mic.style.opacity = String(smooth.micO);
      }
      if (hand) {
        hand.style.transform = `translateX(-50%) translateY(calc(-50% + ${smooth.handY}px))`;
        hand.style.opacity = String(smooth.handO);
      }
      if (glow) {
        glow.style.transform = `translate(-50%,-50%) scale(${smooth.glowS})`;
        glow.style.opacity = String(smooth.glowO);
      }
      if (cta) {
        cta.style.opacity = String(smooth.ctaO);
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
    <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", background: "#ffffff", color: "#0a0a0a", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Instrument+Mono:wght@300;400&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        html{scroll-behavior:smooth;}
        ::selection{background:rgba(59,130,246,.25);color:#00162e;}
        .mono{font-family:'Instrument Mono',monospace;letter-spacing:.12em;text-transform:uppercase;}

        /* Blue/white luxury palette */
        :root{
          --ink:#06142a;
          --blue:#2563eb;
          --blue2:#60a5fa;
          --ice:#eff6ff;
          --line:rgba(3,105,161,.16);
        }

        @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:none;}}
        @keyframes marquee{from{transform:translateX(0);}to{transform:translateX(-50%);}}
        @keyframes rotateSlow{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
        @keyframes spotPulse{0%,100%{opacity:.10;}50%{opacity:.18;}}
        @keyframes blueShimmer{
          0%,100%{filter:drop-shadow(0 0 10px rgba(37,99,235,.18));}
          50%{filter:drop-shadow(0 0 26px rgba(96,165,250,.45)) drop-shadow(0 0 46px rgba(37,99,235,.18));}
        }
        @keyframes particleDrift{
          0%{transform:translateY(0) rotate(0deg);opacity:.6;}
          100%{transform:translateY(120px) rotate(200deg);opacity:0;}
        }

        .nav-lk{font-family:'Instrument Mono',monospace;font-size:11px;letter-spacing:.13em;text-transform:uppercase;text-decoration:none;opacity:.62;transition:opacity .2s,color .2s;}
        .nav-lk:hover{opacity:1;color:#fff;}

        .btn-blue{display:inline-block;padding:16px 48px;background:linear-gradient(135deg, rgba(37,99,235,1), rgba(96,165,250,1));color:#fff;font-family:'Instrument Mono',monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;border:1px solid rgba(255,255,255,.18);transition:transform .25s,filter .25s,box-shadow .25s;box-shadow:0 18px 50px rgba(37,99,235,.26);}
        .btn-blue:hover{transform:translateY(-2px);filter:saturate(1.05);box-shadow:0 22px 70px rgba(37,99,235,.34);}
        .btn-ghost-w{display:inline-block;padding:16px 48px;background:rgba(255,255,255,.02);color:#fff;font-family:'Instrument Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;text-decoration:none;border:1.5px solid rgba(255,255,255,.26);transition:all .3s;backdrop-filter:blur(14px);}
        .btn-ghost-w:hover{background:rgba(255,255,255,.07);border-color:rgba(255,255,255,.5);}
        .btn-w{display:inline-block;padding:16px 48px;background:#fff;color:#06142a;font-family:'Instrument Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;text-decoration:none;border:1.5px solid #fff;transition:all .3s;}
        .btn-w:hover{background:transparent;color:#fff;}

        .fcard{border:1px solid var(--line);padding:38px 30px 42px;position:relative;overflow:hidden;transition:border-color .35s,box-shadow .35s,transform .35s;background:linear-gradient(180deg,#fff, #fbfdff);}
        .fcard::after{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,rgba(37,99,235,1),rgba(96,165,250,1));transform:scaleX(0);transform-origin:left;transition:transform .45s cubic-bezier(.22,1,.36,1);}
        .fcard:hover::after{transform:scaleX(1);}
        .fcard:hover{border-color:rgba(37,99,235,.35);transform:translateY(-5px);box-shadow:0 18px 56px rgba(6,20,42,.10);}
        .bnum{position:absolute;bottom:-12px;right:8px;font-family:'Cormorant Garamond',serif;font-size:110px;font-weight:600;color:rgba(37,99,235,.06);line-height:1;pointer-events:none;user-select:none;}

        .grain{position:fixed;inset:0;pointer-events:none;z-index:9998;opacity:.018;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:180px;}

        .glass{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(18px);}

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
        ::-webkit-scrollbar-thumb{background:linear-gradient(180deg,rgba(37,99,235,1),rgba(96,165,250,1));border-radius:2px;}
      `}</style>

      <div className="grain" />

      {/* SCROLL PROGRESS */}
      <div style={{ position: "fixed", top: 0, left: 0, zIndex: 300, height: 2, background: "linear-gradient(90deg, rgba(37,99,235,1), rgba(96,165,250,1))", width: `${scrollPct}%`, transition: "width .08s linear" }} />

      {/* ── NAV ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          padding: "22px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: scrolled ? "rgba(6,20,42,.92)" : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(255,255,255,.10)" : "none",
          transition: "all .4s ease",
        }}
      >
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 600, letterSpacing: ".25em", color: "#fff", transition: "color .4s" }}>
          BLUEMOTION
        </div>
        <div className="desk-only" style={{ display: "flex", gap: 36, alignItems: "center" }}>
          {["Servizi", "Come funziona", "Recensioni", "Contatti"].map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(/\s/g, "-")}`} className="nav-lk" style={{ color: "rgba(255,255,255,.72)" }}>
              {l}
            </a>
          ))}
        </div>
        <button className="mob-only" onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", flexDirection: "column", gap: 5, padding: 4 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                display: "block",
                width: 22,
                height: 1.5,
                background: "#fff",
                transition: "all .3s",
                transform: menuOpen && i === 0 ? "rotate(45deg) translate(4px,4px)" : menuOpen && i === 2 ? "rotate(-45deg) translate(4px,-4px)" : "none",
                opacity: menuOpen && i === 1 ? 0 : 1,
              }}
            />
          ))}
        </button>
      </nav>

      {menuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 199, background: "#06142a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40 }}>
          {["Servizi", "Come funziona", "Recensioni", "Contatti"].map((l, i) => (
            <a
              key={l}
              href={`#${l.toLowerCase().replace(/\s/g, "-")}`}
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: 46,
                fontWeight: 300,
                color: "#fff",
                textDecoration: "none",
                opacity: 0,
                animation: `fadeUp .5s ease ${i * 80}ms forwards`,
              }}
            >
              {l}
            </a>
          ))}
        </div>
      )}

      {/* ══════════════════════════════
          HERO — blue/white premium automotive service
      ══════════════════════════════ */}
      <section style={{ position: "relative", height: "100vh", overflow: "hidden", background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(96,165,250,.28) 0%, rgba(6,20,42,1) 58%, rgba(3,7,18,1) 100%)" }}>
        {/* Soft gradient ribbons */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <div style={{ position: "absolute", top: "-20%", left: "-10%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(96,165,250,.32) 0%, transparent 65%)", filter: "blur(10px)", opacity: 0.9 }} />
          <div style={{ position: "absolute", top: "10%", right: "-16%", width: 620, height: 620, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,.28) 0%, transparent 66%)", filter: "blur(16px)", opacity: 0.9 }} />
          <div style={{ position: "absolute", bottom: "-24%", left: "18%", width: 760, height: 760, borderRadius: "50%", background: "radial-gradient(circle, rgba(14,165,233,.20) 0%, transparent 64%)", filter: "blur(22px)", opacity: 0.85 }} />
        </div>

        {/* Elegant grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px)", backgroundSize: "74px 74px", maskImage: "radial-gradient(circle at 50% 20%, rgba(0,0,0,1) 0%, rgba(0,0,0,.7) 40%, rgba(0,0,0,0) 76%)", opacity: 0.35, pointerEvents: "none" }} />

        {/* Hero content */}
        <div style={{ position: "relative", zIndex: 2, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "86px 24px 0" }}>
          <div className="mono" style={{ fontSize: 9, color: "rgba(191,219,254,.75)", marginBottom: 26, letterSpacing: ".32em", opacity: showL1 ? 1 : 0, transform: showL1 ? "none" : "translateY(12px)", transition: "all .7s ease" }}>
            — Servizio auto premium • Prenotazione rapida • Trasparenza totale
          </div>

          <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(54px,11vw,122px)", fontWeight: 300, lineHeight: 0.92, color: "#fff", letterSpacing: "-.01em", marginBottom: 30 }}>
            <div style={{ overflow: "hidden", paddingBottom: ".08em" }}>
              <div style={{ opacity: showL1 ? 1 : 0, transform: showL1 ? "translateY(0)" : "translateY(100%)", transition: "all .85s cubic-bezier(.22,1,.36,1) 0ms" }}>La tua auto,</div>
            </div>
            <div style={{ overflow: "hidden", paddingBottom: ".08em" }}>
              <div style={{ fontStyle: "italic", color: "#93c5fd", opacity: showL2 ? 1 : 0, transform: showL2 ? "translateY(0)" : "translateY(100%)", transition: "all .85s cubic-bezier(.22,1,.36,1) 50ms" }}>perfetta</div>
            </div>
            <div style={{ overflow: "hidden", paddingBottom: ".08em" }}>
              <div style={{ opacity: showL3 ? 1 : 0, transform: showL3 ? "translateY(0)" : "translateY(100%)", transition: "all .85s cubic-bezier(.22,1,.36,1) 100ms" }}>in pochi click.</div>
            </div>
          </h1>

          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 300, color: "rgba(255,255,255,.62)", lineHeight: 1.78, maxWidth: 560, marginBottom: 40, opacity: showSub ? 1 : 0, transform: showSub ? "none" : "translateY(16px)", transition: "all .9s cubic-bezier(.22,1,.36,1)" }}>
            Dal ritiro alla consegna: manutenzione, pulizia e controlli con standard elevati. Preventivo chiaro, tempi certi, assistenza dedicata.
          </p>

          <div className="hero-btns" style={{ display: "flex", gap: 16, opacity: showBtns ? 1 : 0, transform: showBtns ? "none" : "translateY(16px)", transition: "all .9s cubic-bezier(.22,1,.36,1)" }}>
            <a href="#contatti" className="btn-blue">
              Richiedi preventivo
            </a>
            <a href="#servizi" className="btn-ghost-w">
              Scopri i servizi
            </a>
          </div>

          {/* mini trust row */}
          <div className="glass" style={{ marginTop: 46, padding: "14px 16px", borderRadius: 2, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10, maxWidth: 760, width: "100%" }}>
            [
              { t: "24/7", s: "Supporto rapido" },
              { t: "€", s: "Prezzi trasparenti" },
              { t: "✓", s: "Tecnici certificati" },
            ].map((x) => null)
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", zIndex: 2, opacity: showBtns ? 0.65 : 0, transition: "opacity .9s ease 300ms" }}>
          <svg viewBox="0 0 68 68" style={{ width: 52, height: 52, animation: "rotateSlow 10s linear infinite" }}>
            <defs>
              <path id="cr" d="M 34,34 m -24,0 a 24,24 0 1,1 48,0 a 24,24 0 1,1 -48,0" />
            </defs>
            <text style={{ fontSize: 7.5, fill: "rgba(147,197,253,.55)", fontFamily: "'Instrument Mono',monospace", letterSpacing: "2.2px" }}>
              <textPath href="#cr">SCROLL · SCROLL · SCROLL ·</textPath>
            </text>
          </svg>
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <div style={{ width: 1, height: 12, background: "rgba(147,197,253,.55)" }} />
            <div style={{ borderLeft: "4px solid transparent", borderRight: "4px solid transparent", borderTop: "5px solid rgba(147,197,253,.55)" }} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          MIC SCENE — keep existing scroll-driven animation, recolored blue
      ══════════════════════════════ */}
      <section ref={micSceneRef} style={{ position: "relative", height: "360vh", background: "#030712" }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden", background: "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(96,165,250,.18) 0%, rgba(3,7,18,1) 72%)" }}>
          {/* Spotlight cone */}
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "250px solid transparent", borderRight: "250px solid transparent", borderTop: "90vh solid rgba(96,165,250,.08)", pointerEvents: "none", animation: "spotPulse 3.5s ease-in-out infinite", filter: "blur(20px)" }} />
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "100px solid transparent", borderRight: "100px solid transparent", borderTop: "75vh solid rgba(37,99,235,.06)", pointerEvents: "none", filter: "blur(6px)" }} />

          {/* Blue particles */}
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: `${8 + (i % 4) * 8}%`,
                left: `${24 + i * 6}%`,
                width: i % 3 === 0 ? 3 : 2,
                height: i % 3 === 0 ? 3 : 2,
                borderRadius: "50%",
                background: i % 2 === 0 ? "#93c5fd" : "#60a5fa",
                animation: `particleDrift ${2.5 + (i % 3) * 0.8}s ease-in ${i * 0.28}s infinite`,
                opacity: 0,
              }}
            />
          ))}

          {/* Floor line */}
          <div style={{ position: "absolute", bottom: "18%", left: "8%", right: "8%", height: 1, background: "linear-gradient(90deg,transparent,rgba(147,197,253,.16),transparent)" }} />

          {/* GLOW BURST */}
          <div
            ref={glowRef}
            style={{
              position: "absolute",
              top: "48%",
              left: "50%",
              width: 340,
              height: 340,
              borderRadius: "50%",
              background: "radial-gradient(circle,rgba(96,165,250,.28) 0%,rgba(37,99,235,.10) 45%,transparent 70%)",
              transform: "translate(-50%,-50%) scale(0.3)",
              opacity: 0,
              pointerEvents: "none",
              filter: "blur(10px)",
            }}
          />

          {/* MICROPHONE */}
          {micVisible && (
            <div
              ref={micRef}
              style={{
                position: "absolute",
                top: "44%",
                left: "50%",
                transform: "translateX(-50%) translateY(-50%)",
                opacity: 0,
                willChange: "transform,opacity",
                zIndex: 10,
                animation: "blueShimmer 2.8s ease-in-out infinite",
              }}
            >
              <img
                src={MIC_ONLY}
                alt="Microfono"
                className="mic-size"
                style={{ width: "clamp(110px,16vw,190px)", height: "auto", display: "block", filter: "drop-shadow(0 10px 42px rgba(0,0,0,.92))" }}
              />
            </div>
          )}

          {/* HAND */}
          <div
            ref={handRef}
            style={{
              position: "absolute",
              top: "56%",
              left: "50%",
              transform: "translateX(-50%) translateY(-50%)",
              opacity: 0,
              willChange: "transform,opacity",
              zIndex: handFrame === 2 ? 12 : 8,
            }}
          >
            <img
              src={handFrame === 0 ? HAND_OPEN : handFrame === 1 ? HAND_MID : HAND_GRIP}
              alt="Mano"
              className="hand-size"
              style={{ width: "clamp(150px,22vw,240px)", height: "auto", display: "block", filter: "drop-shadow(0 16px 52px rgba(0,0,0,.95))", transition: "opacity .1s ease" }}
            />
          </div>

          {/* CTA overlay */}
          <div
            ref={ctaRef}
            style={{
              position: "absolute",
              bottom: "12%",
              left: "50%",
              transform: "translateX(-50%) translateY(40px)",
              textAlign: "center",
              opacity: 0,
              willChange: "transform,opacity",
              pointerEvents: ctaVisible ? "auto" : "none",
              whiteSpace: "nowrap",
            }}
          >
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(26px,4.5vw,52px)", fontWeight: 300, color: "#fff", letterSpacing: ".06em", lineHeight: 1.1, marginBottom: 14 }}>
              <em>Pronto a rimetterti in strada?</em>
            </div>
            <div className="mono" style={{ fontSize: 9, color: "rgba(191,219,254,.75)", marginBottom: 28, letterSpacing: ".24em" }}>
              — Richiedi un preventivo in 60 secondi —
            </div>
            <a href="#contatti" className="btn-blue">
              Parla con noi
            </a>
          </div>

          {/* Scroll hint at top */}
          <div style={{ position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)", opacity: 0.3, pointerEvents: "none" }}>
            <div className="mono" style={{ fontSize: 8, color: "rgba(255,255,255,.45)", textAlign: "center", letterSpacing: ".18em" }}>
              Scorri
            </div>
            <div style={{ width: 1, height: 28, background: "linear-gradient(to bottom,rgba(147,197,253,.55),transparent)", margin: "6px auto 0" }} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          MARQUEE
      ══════════════════════════════ */}
      <div style={{ overflow: "hidden", background: "#06142a", padding: "22px 0", borderTop: "1px solid rgba(255,255,255,.10)" }}>
        <div style={{ display: "flex", whiteSpace: "nowrap", animation: "marquee 24s linear infinite" }}>
          {[...Array(4)].flatMap(() =>
            ["Tagliando", "Diagnosi", "Igienizzazione", "Lavaggio", "Pickup&Delivery", "Assistenza"].map((s, i) => (
              <span key={`${s}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 24, padding: "0 32px" }}>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 300, color: "rgba(255,255,255,.62)", fontStyle: "italic" }}>{s}</span>
                <span style={{ color: "rgba(191,219,254,.35)", fontSize: 10 }}>✦</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* ══════════════════════════════
          SERVIZI
      ══════════════════════════════ */}
      <section id="servizi" style={{ padding: "110px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <Reveal from="left">
          <div className="mono" style={{ fontSize: 9, opacity: 0.35, marginBottom: 18, color: "rgba(6,20,42,.85)" }}>
            — Servizi
          </div>
        </Reveal>
        <Reveal delay={60}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(36px,5vw,70px)", fontWeight: 300, lineHeight: 1, marginBottom: 56, color: "#06142a" }}>
            Cura completa,<br />
            <em style={{ color: "#2563eb" }}>stile premium.</em>
          </h2>
        </Reveal>

        <div className="features-g" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 2 }}>
          {[
            { num: "01", title: "Manutenzione", sub: "Tagliando, freni, batteria", role: "Controlli certificati" },
            { num: "02", title: "Diagnosi", sub: "Elettronica e sensori", role: "Report chiaro" },
            { num: "03", title: "Pulizia Interni", sub: "Igienizzazione premium", role: "Cura dettagli" },
            { num: "04", title: "Pickup & Delivery", sub: "Ritiro e consegna", role: "Massima comodità" },
          ].map((s, i) => (
            <Reveal key={s.num} from={i % 2 === 0 ? "left" : "right"} delay={i * 60}>
              <div className="fcard">
                <div className="bnum">{s.num}</div>
                <div className="mono" style={{ fontSize: 8, opacity: 0.35, marginBottom: 18, color: "rgba(6,20,42,.75)" }}>{s.num}</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 400, marginBottom: 8, color: "#06142a" }}>{s.title}</h3>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontStyle: "italic", color: "#2563eb", marginBottom: 8 }}>{s.role}</div>
                <div className="mono" style={{ fontSize: 8, opacity: 0.35, color: "rgba(6,20,42,.75)" }}>{s.sub}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════
          COME FUNZIONA
      ══════════════════════════════ */}
      <section id="come-funziona" style={{ background: "linear-gradient(180deg, #eff6ff 0%, #ffffff 60%)", padding: "110px 32px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <Reveal from="left">
            <div className="mono" style={{ fontSize: 9, opacity: 0.35, marginBottom: 18, color: "rgba(6,20,42,.85)" }}>
              — Come funziona
            </div>
          </Reveal>
          <Reveal delay={60}>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(36px,5vw,66px)", fontWeight: 300, lineHeight: 1, marginBottom: 64, color: "#06142a" }}>
              Un flusso semplice.<br />
              <em style={{ color: "#2563eb" }}>Risultati impeccabili.</em>
            </h2>
          </Reveal>

          <div className="stats-g" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 28 }}>
            {[
              { val: "01", label: "Compila la richiesta" },
              { val: "02", label: "Ricevi il preventivo" },
              { val: "03", label: "Intervento/ritiro" },
              { val: "04", label: "Consegna e garanzia" },
            ].map((s, i) => (
              <Reveal key={s.val} from={i % 2 === 0 ? "left" : "right"} delay={i * 60}>
                <div style={{ borderTop: "1px solid rgba(37,99,235,.18)", paddingTop: 26 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(40px,5vw,62px)", fontWeight: 300, lineHeight: 1, marginBottom: 10, color: "#2563eb" }}>{s.val}</div>
                  <div className="mono" style={{ fontSize: 8, color: "rgba(6,20,42,.45)" }}>{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════
          RECENSIONI
      ══════════════════════════════ */}
      <section id="recensioni" style={{ padding: "110px 32px", maxWidth: 1100, margin: "0 auto" }}>
        <Reveal from="left">
          <div className="mono" style={{ fontSize: 9, opacity: 0.35, marginBottom: 18, color: "rgba(6,20,42,.85)" }}>
            — Recensioni
          </div>
        </Reveal>
        <Reveal delay={60}>
          <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(36px,5vw,66px)", fontWeight: 300, lineHeight: 1, marginBottom: 58, color: "#06142a" }}>
            Fiducia costruita<br />
            <em style={{ color: "#2563eb" }}>servizio dopo servizio.</em>
          </h2>
        </Reveal>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[
            { name: "Marco", text: "Preventivo chiaro, tempi rispettati. Auto riconsegnata perfetta.", city: "Milano" },
            { name: "Giulia", text: "Pulizia interni impeccabile. Servizio elegante e super comodo.", city: "Torino" },
            { name: "Luca", text: "Diagnosi rapida e spiegazione trasparente. Consigliatissimi.", city: "Roma" },
          ].map((r, i) => (
            <Reveal key={r.name} delay={i * 60}>
              <div style={{ border: "1px solid rgba(37,99,235,.16)", background: "linear-gradient(180deg,#fff,#fbfdff)", padding: 28, borderRadius: 2, boxShadow: "0 18px 56px rgba(6,20,42,.06)" }}>
                <div className="mono" style={{ fontSize: 8, color: "rgba(6,20,42,.35)", marginBottom: 14 }}>
                  ★★★★★
                </div>
                <div style={{ fontSize: 18, lineHeight: 1.7, color: "rgba(6,20,42,.78)", marginBottom: 16 }}>
                  “{r.text}”
                </div>
                <div className="mono" style={{ fontSize: 8, color: "rgba(6,20,42,.45)" }}>
                  {r.name} • {r.city}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════
          CONTATTI CTA
      ══════════════════════════════ */}
      <section id="contatti" style={{ background: "linear-gradient(180deg, rgba(6,20,42,1) 0%, rgba(3,7,18,1) 100%)", padding: "160px 32px", position: "relative", overflow: "hidden", borderTop: "1px solid rgba(255,255,255,.08)" }}>
        {[420, 740, 980].map((s, i) => (
          <div key={i} style={{ position: "absolute", width: s, height: s, borderRadius: "50%", border: "1px solid rgba(147,197,253,.08)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
        ))}
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <Reveal from="left">
            <div className="mono" style={{ fontSize: 9, color: "rgba(191,219,254,.70)", marginBottom: 24, letterSpacing: ".24em" }}>
              — Contatti
            </div>
          </Reveal>
          <Reveal delay={80}>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(48px,8vw,92px)", fontWeight: 300, lineHeight: 0.92, color: "#fff", letterSpacing: "-.01em", marginBottom: 24 }}>
              Raccontaci<br />
              <em style={{ color: "#93c5fd" }}>di cosa hai bisogno.</em>
            </h2>
          </Reveal>
          <Reveal from="right" delay={140}>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 19, fontWeight: 300, color: "rgba(255,255,255,.50)", lineHeight: 1.75, marginBottom: 46 }}>
              Invia una richiesta: ti rispondiamo con un preventivo e la prima disponibilità. Servizio pensato per chi vuole qualità e zero perdite di tempo.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <a href="mailto:contatti@bluemotion.it" className="btn-blue" style={{ fontSize: 11 }}>
                Invia un messaggio →
              </a>
              <a href="#servizi" className="btn-ghost-w" style={{ fontSize: 11 }}>
                Vedi i servizi
              </a>
            </div>
            <div className="mono" style={{ marginTop: 26, fontSize: 8, color: "rgba(255,255,255,.26)" }}>
              Risposta media: &lt; 2 ore • Preventivo gratuito
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "32px", background: "#030712", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,.08)", flexWrap: "wrap", gap: 12 }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 16, fontWeight: 600, letterSpacing: ".25em", color: "#fff" }}>BLUEMOTION</div>
        <div className="mono" style={{ fontSize: 8, color: "rgba(255,255,255,.22)" }}>© 2026 — Tutti i diritti riservati</div>
      </footer>
    </div>
  );
}
