import { useEffect, useRef, useState } from "react";

// ── Scroll reveal with different animation types ──
type AnimType = "fadeUp" | "fadeLeft" | "fadeRight" | "scaleUp" | "fadeDown";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.12 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({
  children, delay = 0, type = "fadeUp", className = ""
}: {
  children: React.ReactNode;
  delay?: number;
  type?: AnimType;
  className?: string;
}) {
  const { ref, visible } = useReveal();

  const transforms: Record<AnimType, string> = {
    fadeUp:    "translateY(48px)",
    fadeDown:  "translateY(-32px)",
    fadeLeft:  "translateX(-48px)",
    fadeRight: "translateX(48px)",
    scaleUp:   "scale(0.92)",
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : transforms[type],
        transition: `opacity 0.9s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.9s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Hero text reveal letter by letter ──
function SplitText({ text, delay = 0 }: { text: string; delay?: number }) {
  return (
    <>
      {text.split("").map((char, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            opacity: 0,
            transform: "translateY(20px)",
            animation: `charIn 0.6s cubic-bezier(.22,1,.36,1) ${delay + i * 30}ms forwards`,
          }}
        >
          {char === " " ? "\u00a0" : char}
        </span>
      ))}
    </>
  );
}

const features = [
  { num: "01", title: "Pipeline Intelligente",  desc: "Gestisci lead e opportunità con una vista chiara e intuitiva. Ogni deal al posto giusto, sempre.",      icon: "◈", anim: "fadeLeft"  as AnimType },
  { num: "02", title: "Automazioni Potenti",     desc: "Elimina il lavoro manuale. Imposta flussi automatici per email, follow-up e notifiche.",                  icon: "◎", anim: "scaleUp"  as AnimType },
  { num: "03", title: "Analisi in Tempo Reale",  desc: "Dashboard personalizzabili con metriche che contano davvero per il tuo business.",                        icon: "◐", anim: "fadeRight" as AnimType },
  { num: "04", title: "Integrazioni Native",     desc: "Connettiti con gli strumenti che già usi. Tutto sincronizzato, tutto sotto controllo.",                   icon: "◉", anim: "fadeUp"   as AnimType },
];

const stats = ["3× Più Conversioni", "80% Tempo Risparmiato", "10k+ Aziende Attive", "99.9% Uptime"];

export default function Index() {
  const [scrolled, setScrolled]   = useState(false);
  const [menuOpen, setMenuOpen]   = useState(false);
  const [cursor, setCursor]       = useState({ x: -100, y: -100 });
  const [cursorBig, setCursorBig] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
      const max = document.body.scrollHeight - window.innerHeight;
      setScrollPct(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    const onMove = (e: MouseEvent) => setCursor({ x: e.clientX, y: e.clientY });
    window.addEventListener("scroll", onScroll);
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div
      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", background: "#fff", color: "#0a0a0a", overflowX: "hidden" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Instrument+Mono:wght@300;400&display=swap');
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        html { scroll-behavior:smooth; }
        ::selection { background:#0a0a0a; color:#fff; }

        .mono { font-family:'Instrument Mono',monospace; letter-spacing:.12em; text-transform:uppercase; }

        @keyframes charIn {
          to { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(30px); }
          to   { opacity:1; transform:none; }
        }
        @keyframes marquee {
          from { transform:translateX(0); }
          to   { transform:translateX(-50%); }
        }
        @keyframes rotateSlow {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }

        /* BUTTONS */
        .btn-w {
          display:inline-block; padding:15px 36px;
          background:#fff; color:#0a0a0a;
          font-family:'Instrument Mono',monospace; font-size:10px;
          letter-spacing:.16em; text-transform:uppercase; text-decoration:none;
          border:1.5px solid rgba(255,255,255,.8);
          transition:background .3s,color .3s,border-color .3s;
        }
        .btn-w:hover { background:transparent; color:#fff; border-color:#fff; }

        .btn-ghost {
          display:inline-block; padding:15px 36px;
          background:transparent; color:#fff;
          font-family:'Instrument Mono',monospace; font-size:10px;
          letter-spacing:.16em; text-transform:uppercase; text-decoration:none;
          border:1.5px solid rgba(255,255,255,.35);
          transition:background .3s,border-color .3s;
        }
        .btn-ghost:hover { background:rgba(255,255,255,.08); border-color:rgba(255,255,255,.7); }

        .btn-crm-light {
          display:inline-block; padding:18px 52px;
          background:#fff; color:#0a0a0a;
          font-family:'Instrument Mono',monospace; font-size:11px;
          letter-spacing:.16em; text-transform:uppercase; text-decoration:none;
          border:1.5px solid #fff;
          transition:background .3s,color .3s;
        }
        .btn-crm-light:hover { background:transparent; color:#fff; }

        /* FEATURE CARD */
        .fcard {
          border:1px solid #e4e4e4; padding:40px 32px 44px;
          background:#fff; position:relative; overflow:hidden;
          transition:border-color .35s, box-shadow .35s, transform .35s;
        }
        .fcard::after {
          content:''; position:absolute; top:0; left:0; right:0; height:2px;
          background:#0a0a0a; transform:scaleX(0); transform-origin:left;
          transition:transform .45s cubic-bezier(.22,1,.36,1);
        }
        .fcard:hover::after { transform:scaleX(1); }
        .fcard:hover { border-color:#bbb; transform:translateY(-6px); box-shadow:0 16px 48px rgba(0,0,0,.07); }
        .fcard .bg-num {
          position:absolute; bottom:-16px; right:8px;
          font-family:'Cormorant Garamond',serif; font-size:120px; font-weight:600;
          color:rgba(0,0,0,.04); line-height:1; pointer-events:none; user-select:none;
          transition:color .35s;
        }
        .fcard:hover .bg-num { color:rgba(0,0,0,.07); }

        .nav-lk {
          font-family:'Instrument Mono',monospace; font-size:11px;
          letter-spacing:.13em; text-transform:uppercase; text-decoration:none;
          opacity:.55; transition:opacity .2s;
        }
        .nav-lk:hover { opacity:1; }

        /* MOBILE */
        @media (max-width:768px) {
          .desktop-only { display:none !important; }
          .mobile-only  { display:flex !important; }
          .hero-btns    { flex-direction:column !important; align-items:center !important; gap:12px !important; }
          .features-grid{ grid-template-columns:1fr !important; }
          .stats-grid   { grid-template-columns:1fr 1fr !important; }
          .cursor-el    { display:none !important; }
        }
        @media (min-width:769px) {
          .mobile-only { display:none !important; }
        }

        .grain {
          position:fixed; inset:0; pointer-events:none; z-index:9999; opacity:.022;
          background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size:180px;
        }
      `}</style>

      {/* ── CUSTOM CURSOR (desktop only) ── */}
      <div
        className="cursor-el"
        style={{
          position: "fixed", zIndex: 99999, pointerEvents: "none",
          left: cursor.x, top: cursor.y,
          transform: "translate(-50%,-50%)",
        }}
      >
        <div style={{
          width: cursorBig ? 52 : 32,
          height: cursorBig ? 52 : 32,
          borderRadius: "50%",
          border: `1px solid ${scrolled ? "rgba(10,10,10,.45)" : "rgba(255,255,255,.55)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "width .25s, height .25s, border-color .4s",
        }}>
          <div style={{
            width: 4, height: 4, borderRadius: "50%",
            background: scrolled ? "#0a0a0a" : "#fff",
            transition: "background .4s",
          }} />
        </div>
      </div>

      {/* ── SCROLL PROGRESS BAR ── */}
      <div style={{
        position: "fixed", top: 0, left: 0, zIndex: 200,
        height: 2, background: "#0a0a0a",
        width: `${scrollPct}%`,
        transition: "width .1s linear",
      }} />

      <div className="grain" />

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "22px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(255,255,255,.96)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid #ebebeb" : "1px solid transparent",
        transition: "all .4s ease",
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: 19, fontWeight: 600, letterSpacing: ".2em",
          color: scrolled ? "#0a0a0a" : "#fff",
          transition: "color .4s",
        }}>
          ARTEMISIA
        </div>

        <div className="desktop-only" style={{ display: "flex", gap: 36, alignItems: "center" }}>
          <a href="#features" className="nav-lk" style={{ color: scrolled ? "#0a0a0a" : "#fff" }}>Funzioni</a>
          <a href="#pricing"  className="nav-lk" style={{ color: scrolled ? "#0a0a0a" : "#fff" }}>Prezzi</a>
          <a href="/crm" style={{
            padding: "11px 28px",
            background: scrolled ? "#0a0a0a" : "#fff",
            color: scrolled ? "#fff" : "#0a0a0a",
            fontFamily: "'Instrument Mono',monospace", fontSize: 10,
            letterSpacing: ".14em", textTransform: "uppercase", textDecoration: "none",
            border: `1.5px solid ${scrolled ? "#0a0a0a" : "#fff"}`,
            transition: "all .3s",
          }}>
            Accedi al CRM
          </a>
        </div>

        <button
          className="mobile-only"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ background: "none", border: "none", flexDirection: "column", gap: 5, padding: 4 }}
        >
          {[0,1,2].map(i => (
            <span key={i} style={{
              display: "block", width: 22, height: 1.5,
              background: scrolled ? "#0a0a0a" : "#fff",
              transition: "all .3s",
              transform:
                menuOpen && i === 0 ? "rotate(45deg) translate(4px,4px)" :
                menuOpen && i === 2 ? "rotate(-45deg) translate(4px,-4px)" : "none",
              opacity: menuOpen && i === 1 ? 0 : 1,
            }} />
          ))}
        </button>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 99,
          background: "#0a0a0a",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 48,
        }}>
          {[["#features","Funzioni"],["#pricing","Prezzi"],["/crm","CRM"]].map(([href, label], i) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: 48, fontWeight: 300,
                color: "#fff", textDecoration: "none",
                opacity: 0,
                animation: `fadeUp .5s ease ${i * 100}ms forwards`,
              }}
            >
              {label}
            </a>
          ))}
        </div>
      )}

      {/* ── HERO ── */}
      <section style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
        <video
          autoPlay muted loop playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        >
          <source src="/kling_20260207_Image_to_Video__913_0.mp4" type="video/mp4" />
        </video>

        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,.5) 0%, rgba(0,0,0,.2) 40%, rgba(0,0,0,.7) 100%)",
        }} />

        {/* Centered */}
        <div style={{
          position: "relative", zIndex: 2,
          height: "100%",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          textAlign: "center",
          padding: "80px 24px 0",
        }}>
          <div
            className="mono"
            style={{
              fontSize: 10, color: "rgba(255,255,255,.4)",
              marginBottom: 28,
              opacity: 0, animation: "fadeUp .8s ease .3s forwards",
            }}
          >
            — Software CRM per il Business Moderno
          </div>

          <h1 style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: "clamp(58px,11vw,124px)",
            fontWeight: 300, lineHeight: .92,
            color: "#fff", letterSpacing: "-.02em",
            marginBottom: 36,
          }}>
            <span style={{ display: "block" }}>
              <SplitText text="Il tuo" delay={400} />
            </span>
            <span style={{ display: "block", fontStyle: "italic" }}>
              <SplitText text="business" delay={650} />
            </span>
            <span style={{ display: "block" }}>
              <SplitText text="al centro." delay={900} />
            </span>
          </h1>

          <p style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: 19, fontWeight: 300,
            color: "rgba(255,255,255,.68)",
            lineHeight: 1.7, maxWidth: 420,
            marginBottom: 48,
            opacity: 0, animation: "fadeUp .9s ease 1.3s forwards",
          }}>
            Gestisci clienti, pipeline e automazioni da un'unica piattaforma elegante.
          </p>

          <div
            className="hero-btns"
            style={{
              display: "flex", gap: 16, alignItems: "center",
              opacity: 0, animation: "fadeUp .9s ease 1.5s forwards",
            }}
          >
            <a href="/crm" className="btn-w">Inizia Gratis</a>
            <a href="#features" className="btn-ghost">Scopri di più</a>
          </div>
        </div>

        {/* ── UNIQUE SCROLL INDICATOR — rotating SVG text ── */}
        <div style={{
          position: "absolute", bottom: 36, left: "50%",
          transform: "translateX(-50%)",
          zIndex: 2,
          opacity: 0, animation: "fadeUp .8s ease 2s forwards",
        }}>
          <div style={{ position: "relative", width: 68, height: 68 }}>
            <svg viewBox="0 0 68 68" style={{ width: 68, height: 68, animation: "rotateSlow 9s linear infinite" }}>
              <defs>
                <path id="c" d="M 34,34 m -24,0 a 24,24 0 1,1 48,0 a 24,24 0 1,1 -48,0" />
              </defs>
              <text style={{ fontSize: 7.8, fill: "rgba(255,255,255,.5)", fontFamily: "'Instrument Mono',monospace", letterSpacing: "2.4px" }}>
                <textPath href="#c">SCROLL · SCROLL · SCROLL ·</textPath>
              </text>
            </svg>
            {/* down arrow center */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            }}>
              <div style={{ width: 1, height: 12, background: "rgba(255,255,255,.6)" }} />
              <div style={{
                borderLeft: "4px solid transparent",
                borderRight: "4px solid transparent",
                borderTop: "5px solid rgba(255,255,255,.6)",
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div style={{ overflow: "hidden", background: "#0a0a0a", padding: "26px 0" }}>
        <div style={{ display: "flex", whiteSpace: "nowrap", animation: "marquee 22s linear infinite" }}>
          {[...Array(4)].flatMap(() =>
            stats.map((s, i) => (
              <span key={`${s}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 28, padding: "0 40px" }}>
                <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 300, color: "#fff" }}>{s}</span>
                <span style={{ color: "rgba(255,255,255,.15)", fontSize: 14 }}>✦</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "120px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <Reveal type="fadeLeft">
          <span className="mono" style={{ fontSize: 10, opacity: .3, display: "block", marginBottom: 20 }}>— Funzionalità</span>
        </Reveal>
        <Reveal type="fadeUp" delay={80}>
          <h2 style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: "clamp(38px,6vw,80px)",
            fontWeight: 300, lineHeight: 1, marginBottom: 72,
          }}>
            Tutto ciò che<br /><em>serve davvero.</em>
          </h2>
        </Reveal>

        <div
          className="features-grid"
          style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 2 }}
        >
          {features.map((f, i) => (
            <Reveal key={f.num} type={f.anim} delay={i * 90}>
              <div className="fcard">
                <div className="bg-num">{f.num}</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
                  <span className="mono" style={{ fontSize: 10, opacity: .3 }}>{f.num}</span>
                  <span style={{ fontSize: 18, opacity: .18 }}>{f.icon}</span>
                </div>
                <h3 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 400, marginBottom: 14, lineHeight: 1.2 }}>
                  {f.title}
                </h3>
                <p style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontWeight: 300, lineHeight: 1.8, opacity: .58 }}>
                  {f.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: "#f6f6f6", padding: "100px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Reveal type="fadeDown">
            <span className="mono" style={{ fontSize: 10, opacity: .3, display: "block", marginBottom: 56 }}>— Numeri che parlano</span>
          </Reveal>
          <div
            className="stats-grid"
            style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 32 }}
          >
            {[
              { val: "3×",    label: "Più conversioni" },
              { val: "80%",   label: "Tempo risparmiato" },
              { val: "10k+",  label: "Aziende attive" },
              { val: "99.9%", label: "Uptime garantito" },
            ].map((s, i) => (
              <Reveal key={s.val} type={i % 2 === 0 ? "fadeUp" : "scaleUp"} delay={i * 100}>
                <div style={{ borderTop: "1px solid #d8d8d8", paddingTop: 28 }}>
                  <div style={{
                    fontFamily: "'Cormorant Garamond',serif",
                    fontSize: "clamp(48px,5vw,72px)",
                    fontWeight: 300, lineHeight: 1, marginBottom: 10,
                  }}>
                    {s.val}
                  </div>
                  <div className="mono" style={{ fontSize: 9, opacity: .38 }}>{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIAL ── */}
      <section style={{ padding: "120px 32px", maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
        <Reveal type="scaleUp">
          <div style={{ fontSize: 64, opacity: .08, lineHeight: 1, marginBottom: 20, fontFamily: "Georgia,serif" }}>"</div>
          <blockquote style={{
            fontFamily: "'Cormorant Garamond',serif",
            fontSize: "clamp(20px,3vw,34px)",
            fontWeight: 300, lineHeight: 1.55,
            fontStyle: "italic", marginBottom: 40,
          }}>
            Artemisia ha trasformato il nostro processo di vendita. In tre mesi abbiamo triplicato le conversioni e ridotto il tempo di gestione dell'80%.
          </blockquote>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#e0e0e0" }} />
            <div style={{ textAlign: "left" }}>
              <div className="mono" style={{ fontSize: 10, opacity: .65 }}>Marco Ferretti</div>
              <div className="mono" style={{ fontSize: 9, opacity: .32 }}>CEO, Nexlabs Milano</div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── CTA ── */}
      <section id="crm" style={{ background: "#0a0a0a", padding: "140px 32px", position: "relative", overflow: "hidden" }}>
        {[500, 800, 1100].map((size, i) => (
          <div key={i} style={{
            position: "absolute", width: size, height: size,
            borderRadius: "50%", border: "1px solid rgba(255,255,255,.04)",
            top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none",
          }} />
        ))}

        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <Reveal type="fadeDown">
            <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,.28)", display: "block", marginBottom: 28 }}>
              — Pronto a iniziare?
            </span>
          </Reveal>
          <Reveal type="scaleUp" delay={80}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: "clamp(48px,8vw,96px)",
              fontWeight: 300, lineHeight: .95,
              color: "#fff", letterSpacing: "-.02em", marginBottom: 28,
            }}>
              Entra nel<br /><em>tuo CRM.</em>
            </h2>
          </Reveal>
          <Reveal type="fadeUp" delay={160}>
            <p style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: 19, fontWeight: 300,
              color: "rgba(255,255,255,.42)", lineHeight: 1.75, marginBottom: 52,
            }}>
              Accedi alla dashboard, gestisci i tuoi clienti e fai crescere il tuo business da oggi.
            </p>
            <a href="/crm" className="btn-crm-light">
              Apri il CRM →
            </a>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: "36px 32px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderTop: "1px solid #ebebeb", flexWrap: "wrap", gap: 16,
      }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 17, fontWeight: 600, letterSpacing: ".2em" }}>
          ARTEMISIA
        </div>
        <div className="mono" style={{ fontSize: 9, opacity: .28 }}>© 2025 — Tutti i diritti riservati</div>
      </footer>
    </div>
  );
}
