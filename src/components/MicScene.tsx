import { useEffect, useRef, useState, useCallback } from "react";

// ─────────────────────────────────────────────
// IMAGE PATHS — exact filenames from GitHub public/
// ─────────────────────────────────────────────
const MIC_ONLY   = "/unnamed_9_-removebg-preview.png";
const HAND_OPEN  = "/IMG_20260228_222718-removebg-preview.png";
const HAND_MID   = "/unnamed_11_-removebg-preview.png";
const HAND_GRIP  = "/IMG_20260228_222748-removebg-preview.png";

// ─────────────────────────────────────────────
// SMOOTH LERP
// ─────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

// ─────────────────────────────────────────────
// MIC SCENE — full scroll-driven sequence
// Usage: drop <MicScene /> in your page/landing
// The section is 400vh tall — scroll drives everything
// ─────────────────────────────────────────────
export default function MicScene() {
  const sectionRef = useRef<HTMLElement>(null);
  const micRef     = useRef<HTMLDivElement>(null);
  const handRef    = useRef<HTMLDivElement>(null);
  const glowRef    = useRef<HTMLDivElement>(null);
  const textRef    = useRef<HTMLDivElement>(null);
  const rafRef     = useRef(0);

  // Smooth current values
  const cur = useRef({
    micY:      -120,   // mic starts above viewport
    micScale:  0.6,
    micOpacity: 0,
    handY:     120,    // hand starts below viewport
    handOpacity: 0,
    handFrame: 0,      // 0=open, 1=mid, 2=grip
    glowScale: 0,
    glowOpacity: 0,
    textOpacity: 0,
    textY: 30,
  });

  const target = useRef({ ...cur.current });
  const [handFrame, setHandFrame] = useState(0); // 0=open, 1=mid, 2=grip
  const [showMic, setShowMic]     = useState(true); // hide mic when hand grips

  const getProgress = useCallback(() => {
    const sec = sectionRef.current;
    if (!sec) return 0;
    const rect   = sec.getBoundingClientRect();
    const totalH = sec.offsetHeight - window.innerHeight;
    return Math.max(0, Math.min(1, -rect.top / totalH));
  }, []);

  // ── ANIMATION LOOP ──
  useEffect(() => {
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);

      const mic   = micRef.current;
      const hand  = handRef.current;
      const glow  = glowRef.current;
      const text  = textRef.current;
      if (!mic || !hand) return;

      const p = getProgress();

      // ── PHASE 1: 0–0.25 — mic descends from top ──
      if (p < 0.25) {
        const t = p / 0.25;
        target.current.micY       = lerp(-140, 0, easeOut(t));
        target.current.micScale   = lerp(0.6, 1, easeOut(t));
        target.current.micOpacity = lerp(0, 1, easeOut(t));
        target.current.handY      = 140;
        target.current.handOpacity = 0;
        target.current.glowOpacity = 0;
        target.current.textOpacity = 0;
      }
      // ── PHASE 2: 0.25–0.50 — mic steady, hand rises ──
      else if (p < 0.50) {
        const t = (p - 0.25) / 0.25;
        target.current.micY       = 0;
        target.current.micScale   = 1;
        target.current.micOpacity = 1;
        target.current.handY      = lerp(140, 20, easeOut(t));
        target.current.handOpacity = lerp(0, 1, easeOut(t));
        target.current.glowOpacity = 0;
        target.current.textOpacity = 0;
      }
      // ── PHASE 3: 0.50–0.65 — hand closes on mic ──
      else if (p < 0.65) {
        const t = (p - 0.50) / 0.15;
        target.current.micY       = lerp(0, 10, t);
        target.current.handY      = lerp(20, 0, easeOut(t));
        target.current.handOpacity = 1;
        target.current.micOpacity = 1;
        // Frame swap
        const frame = t < 0.4 ? 0 : t < 0.75 ? 1 : 2;
        if (frame !== cur.current.handFrame) {
          cur.current.handFrame = frame;
          setHandFrame(frame);
          if (frame === 2) setShowMic(false);
          else setShowMic(true);
        }
        // Glow on grip
        const glowT = Math.max(0, (t - 0.7) / 0.3);
        target.current.glowScale   = lerp(0.5, 1.4, glowT);
        target.current.glowOpacity = lerp(0, 0.7, glowT);
      }
      // ── PHASE 4: 0.65–1.0 — everything drops, text appears ──
      else {
        const t = (p - 0.65) / 0.35;
        target.current.micY       = lerp(10, 60, easeIn(t));
        target.current.handY      = lerp(0, 60, easeIn(t));
        target.current.glowScale  = lerp(1.4, 0.8, t);
        target.current.glowOpacity = lerp(0.7, 0, t);
        target.current.textOpacity = lerp(0, 1, easeOut(Math.min(1, t * 2)));
        target.current.textY       = lerp(30, 0, easeOut(Math.min(1, t * 2)));
      }

      // ── SMOOTH LERP everything ──
      const F = 0.1;
      const c = cur.current;
      c.micY        = lerp(c.micY,        target.current.micY,        F);
      c.micScale    = lerp(c.micScale,    target.current.micScale,    F);
      c.micOpacity  = lerp(c.micOpacity,  target.current.micOpacity,  F);
      c.handY       = lerp(c.handY,       target.current.handY,       F);
      c.handOpacity = lerp(c.handOpacity, target.current.handOpacity, F);
      c.glowScale   = lerp(c.glowScale,   target.current.glowScale,   F);
      c.glowOpacity = lerp(c.glowOpacity, target.current.glowOpacity, F);
      c.textOpacity = lerp(c.textOpacity, target.current.textOpacity, F);
      c.textY       = lerp(c.textY,       target.current.textY,       F);

      // ── APPLY to DOM ──
      mic.style.transform  = `translateX(-50%) translateY(calc(-50% + ${c.micY}px)) scale(${c.micScale})`;
      mic.style.opacity    = String(c.micOpacity);

      hand.style.transform = `translateX(-50%) translateY(calc(-50% + ${c.handY}px))`;
      hand.style.opacity   = String(c.handOpacity);

      if (glow) {
        glow.style.transform = `translate(-50%,-50%) scale(${c.glowScale})`;
        glow.style.opacity   = String(c.glowOpacity);
      }

      if (text) {
        text.style.opacity   = String(c.textOpacity);
        text.style.transform = `translateX(-50%) translateY(${c.textY}px)`;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [getProgress]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Instrument+Mono:wght@300;400&display=swap');

        .mic-scene *{box-sizing:border-box;margin:0;padding:0;}

        /* SPOTLIGHT — radial from top center */
        @keyframes spotPulse{
          0%,100%{opacity:.18;}
          50%{opacity:.28;}
        }
        @keyframes particleFall{
          0%{transform:translateY(-20px) rotate(0deg);opacity:.8;}
          100%{transform:translateY(100px) rotate(180deg);opacity:0;}
        }
        @keyframes goldShimmer{
          0%{filter:drop-shadow(0 0 12px rgba(212,175,55,.3));}
          50%{filter:drop-shadow(0 0 28px rgba(212,175,55,.8)) drop-shadow(0 0 56px rgba(212,175,55,.4));}
          100%{filter:drop-shadow(0 0 12px rgba(212,175,55,.3));}
        }
        @keyframes textReveal{
          from{opacity:0;letter-spacing:.6em;}
          to{opacity:1;letter-spacing:.2em;}
        }
        @keyframes curtainL{from{transform:translateX(0);}to{transform:translateX(-100%);}}
        @keyframes curtainR{from{transform:translateX(0);}to{transform:translateX(100%);}}
      `}</style>

      {/* ══════════════════════════════
          SCROLL DRIVER — 400vh tall
      ══════════════════════════════ */}
      <section
        ref={sectionRef}
        className="mic-scene"
        style={{ position: "relative", height: "400vh", background: "#000" }}
      >
        {/* ── STICKY STAGE ── */}
        <div style={{
          position: "sticky", top: 0,
          height: "100vh", overflow: "hidden",
          background: "radial-gradient(ellipse 60% 55% at 50% 0%, #1a0a00 0%, #000 65%)",
        }}>

          {/* SPOTLIGHT CONE from top */}
          <div style={{
            position: "absolute",
            top: 0, left: "50%",
            transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "220px solid transparent",
            borderRight: "220px solid transparent",
            borderTop: "85vh solid rgba(255,200,80,.07)",
            pointerEvents: "none",
            animation: "spotPulse 3s ease-in-out infinite",
            filter: "blur(18px)",
          }} />

          {/* Second, tighter spotlight */}
          <div style={{
            position: "absolute",
            top: 0, left: "50%",
            transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "90px solid transparent",
            borderRight: "90px solid transparent",
            borderTop: "70vh solid rgba(255,215,100,.06)",
            pointerEvents: "none",
            animation: "spotPulse 3s ease-in-out infinite .5s",
            filter: "blur(6px)",
          }} />

          {/* GOLD DUST PARTICLES */}
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              top: `${10 + Math.random() * 30}%`,
              left: `${30 + i * 6}%`,
              width: 3, height: 3,
              borderRadius: "50%",
              background: "#d4af37",
              animation: `particleFall ${2 + Math.random() * 2}s ease-in ${i * 0.3}s infinite`,
              opacity: 0,
            }} />
          ))}

          {/* FLOOR REFLECTION LINE */}
          <div style={{
            position: "absolute",
            bottom: "20%",
            left: "10%", right: "10%",
            height: 1,
            background: "linear-gradient(90deg, transparent, rgba(212,175,55,.15), transparent)",
          }} />

          {/* ── GLOW BURST at impact ── */}
          <div ref={glowRef} style={{
            position: "absolute",
            top: "48%", left: "50%",
            width: 320, height: 320,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,175,55,.35) 0%, rgba(212,175,55,.1) 40%, transparent 70%)",
            transform: "translate(-50%,-50%) scale(0.5)",
            opacity: 0,
            pointerEvents: "none",
            filter: "blur(8px)",
          }} />

          {/* ── MICROPHONE ── */}
          {showMic && (
            <div ref={micRef} style={{
              position: "absolute",
              top: "46%", left: "50%",
              transform: "translateX(-50%) translateY(-50%)",
              width: "clamp(120px, 18vw, 200px)",
              opacity: 0,
              animation: "goldShimmer 2.5s ease-in-out infinite",
              willChange: "transform, opacity",
              zIndex: 10,
            }}>
              <img
                src={MIC_ONLY}
                alt="Microfono"
                style={{ width: "100%", height: "auto", display: "block", filter: "drop-shadow(0 8px 32px rgba(0,0,0,.8))" }}
              />
            </div>
          )}

          {/* ── HAND (frame swap) ── */}
          <div ref={handRef} style={{
            position: "absolute",
            top: "56%", left: "50%",
            transform: "translateX(-50%) translateY(-50%)",
            width: "clamp(160px, 24vw, 260px)",
            opacity: 0,
            willChange: "transform, opacity",
            zIndex: handFrame === 2 ? 12 : 8,
          }}>
            {/* Invisible ref div — swap image inside */}
            <img
              src={handFrame === 0 ? HAND_OPEN : handFrame === 1 ? HAND_MID : HAND_GRIP}
              alt="Mano"
              style={{
                width: "100%", height: "auto", display: "block",
                filter: "drop-shadow(0 12px 40px rgba(0,0,0,.9))",
                transition: "opacity .12s ease",
              }}
            />
          </div>

          {/* ── SCROLL HINT (visible at start) ── */}
          <div style={{
            position: "absolute",
            bottom: 36,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
            opacity: 0.4,
            pointerEvents: "none",
          }}>
            <div style={{
              fontFamily: "'Instrument Mono',monospace",
              fontSize: 9, letterSpacing: ".2em",
              textTransform: "uppercase", color: "rgba(255,255,255,.5)",
              marginBottom: 4,
            }}>
              Scorri
            </div>
            <div style={{ width: 1, height: 32, background: "linear-gradient(to bottom, rgba(212,175,55,.6), transparent)" }} />
          </div>

          {/* ── CTA TEXT (appears after grip) ── */}
          <div ref={textRef} style={{
            position: "absolute",
            bottom: "14%",
            left: "50%",
            transform: "translateX(-50%) translateY(30px)",
            textAlign: "center",
            opacity: 0,
            willChange: "transform, opacity",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}>
            <div style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: "clamp(28px, 5vw, 52px)",
              fontWeight: 300,
              color: "#fff",
              letterSpacing: ".08em",
              lineHeight: 1.1,
              marginBottom: 16,
            }}>
              <em>Il palco è pronto.</em>
            </div>
            <div style={{
              fontFamily: "'Instrument Mono',monospace",
              fontSize: "clamp(9px, 1.1vw, 11px)",
              letterSpacing: ".22em",
              textTransform: "uppercase",
              color: "rgba(212,175,55,.8)",
              marginBottom: 28,
            }}>
              — Scopri il percorso —
            </div>
            <a
              href="#portfolio"
              style={{
                display: "inline-block",
                padding: "14px 44px",
                border: "1px solid rgba(212,175,55,.6)",
                color: "#d4af37",
                fontFamily: "'Instrument Mono',monospace",
                fontSize: 10,
                letterSpacing: ".18em",
                textTransform: "uppercase",
                textDecoration: "none",
                background: "transparent",
                transition: "all .3s",
                pointerEvents: "auto",
              }}
              onMouseEnter={e => {
                (e.target as HTMLElement).style.background = "rgba(212,175,55,.12)";
                (e.target as HTMLElement).style.borderColor = "#d4af37";
              }}
              onMouseLeave={e => {
                (e.target as HTMLElement).style.background = "transparent";
                (e.target as HTMLElement).style.borderColor = "rgba(212,175,55,.6)";
              }}
            >
              Entra in scena
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

// ── EASING FUNCTIONS ──
function easeOut(t: number) { return 1 - Math.pow(1 - t, 3); }
function easeIn(t: number)  { return t * t * t; }
