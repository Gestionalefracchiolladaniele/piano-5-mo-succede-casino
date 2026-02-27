import { useEffect, useRef, useState } from "react";

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function Reveal({ children, delay = 0, className = "" }: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0px)" : "translateY(36px)",
        transition: `opacity 0.9s cubic-bezier(.22,1,.36,1) ${delay}ms, transform 0.9s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const features = [
  {
    num: "01",
    title: "Pipeline Intelligente",
    desc: "Gestisci lead e opportunità con una vista chiara e intuitiva. Ogni deal al posto giusto, sempre.",
    icon: "◈",
  },
  {
    num: "02",
    title: "Automazioni Potenti",
    desc: "Elimina il lavoro manuale. Imposta flussi automatici per email, follow-up e notifiche.",
    icon: "◎",
  },
  {
    num: "03",
    title: "Analisi in Tempo Reale",
    desc: "Dashboard personalizzabili con metriche che contano davvero per il tuo business.",
    icon: "◐",
  },
  {
    num: "04",
    title: "Integrazioni Native",
    desc: "Connettiti con gli strumenti che già usi. Tutto sincronizzato, tutto sotto controllo.",
    icon: "◉",
  },
];

const stats = ["3× Più Conversioni", "80% Tempo Risparmiato", "10k+ Aziende Attive", "99.9% Uptime"];

export default function Index() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", background: "#fff", color: "#0a0a0a", overflowX: "hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Instrument+Mono:wght@300;400&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        ::selection { background: #0a0a0a; color: #fff; }

        .mono {
          font-family: 'Instrument Mono', monospace;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        /* NAV LINKS */
        .nav-a {
          font-family: 'Instrument Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #fff;
          text-decoration: none;
          opacity: 0.7;
          transition: opacity 0.2s;
        }
        .nav-a:hover { opacity: 1; }
        .nav-a-dark {
          font-family: 'Instrument Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #0a0a0a;
          text-decoration: none;
          opacity: 0.5;
          transition: opacity 0.2s;
        }
        .nav-a-dark:hover { opacity: 1; }

        /* BUTTONS */
        .btn-white {
          display: inline-block;
          padding: 16px 40px;
          background: #fff;
          color: #0a0a0a;
          font-family: 'Instrument Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          border: 1.5px solid #fff;
          cursor: pointer;
          transition: background 0.3s, color 0.3s;
          white-space: nowrap;
        }
        .btn-white:hover { background: transparent; color: #fff; }

        .btn-black {
          display: inline-block;
          padding: 16px 40px;
          background: #0a0a0a;
          color: #fff;
          font-family: 'Instrument Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          border: 1.5px solid #0a0a0a;
          cursor: pointer;
          transition: background 0.3s, color 0.3s;
          white-space: nowrap;
        }
        .btn-black:hover { background: transparent; color: #0a0a0a; }

        .btn-outline-dark {
          display: inline-block;
          padding: 16px 40px;
          background: transparent;
          color: #0a0a0a;
          font-family: 'Instrument Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          text-decoration: none;
          border: 1.5px solid #0a0a0a;
          cursor: pointer;
          transition: background 0.3s, color 0.3s;
          white-space: nowrap;
        }
        .btn-outline-dark:hover { background: #0a0a0a; color: #fff; }

        /* FEATURE CARD */
        .feature-card {
          border: 1px solid #e8e8e8;
          padding: 40px 32px;
          transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
          background: #fff;
          position: relative;
          overflow: hidden;
        }
        .feature-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: #0a0a0a;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.4s ease;
        }
        .feature-card:hover::before { transform: scaleX(1); }
        .feature-card:hover {
          border-color: #0a0a0a;
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.08);
        }

        /* MARQUEE */
        .marquee-wrap { overflow: hidden; }
        .marquee-track {
          display: flex;
          white-space: nowrap;
          animation: marquee 20s linear infinite;
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        /* MOBILE */
        @media (max-width: 768px) {
          .hero-title { font-size: clamp(52px, 14vw, 80px) !important; }
          .hero-sub { font-size: 18px !important; }
          .section-pad { padding: 80px 24px !important; }
          .section-title { font-size: clamp(36px, 10vw, 56px) !important; }
          .features-grid { grid-template-columns: 1fr !important; }
          .hero-btns { flex-direction: column !important; align-items: flex-start !important; gap: 12px !important; }
          .nav-desktop { display: none !important; }
          .nav-mobile-btn { display: flex !important; }
          .cta-title { font-size: clamp(40px, 12vw, 72px) !important; }
          .stat-value { font-size: 52px !important; }
        }
        @media (min-width: 769px) {
          .nav-mobile-btn { display: none !important; }
        }

        /* GRAIN */
        .grain {
          position: fixed; inset: 0;
          pointer-events: none; z-index: 9999;
          opacity: 0.025;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          background-size: 180px;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="grain" />

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        padding: "20px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid #ebebeb" : "1px solid transparent",
        transition: "all 0.4s ease",
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: "0.18em",
          color: scrolled ? "#0a0a0a" : "#fff",
          transition: "color 0.4s",
        }}>
          ARTEMISIA
        </div>

        {/* Desktop nav */}
        <div className="nav-desktop" style={{ display: "flex", gap: 36, alignItems: "center" }}>
          <a href="#features" className={scrolled ? "nav-a-dark" : "nav-a"}>Funzioni</a>
          <a href="#pricing" className={scrolled ? "nav-a-dark" : "nav-a"}>Prezzi</a>
          <a href="/crm" className={scrolled ? "btn-black" : "btn-white"} style={{ padding: "11px 28px" }}>
            Accedi al CRM
          </a>
        </div>

        {/* Mobile hamburger */}
        <button
          className="nav-mobile-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            flexDirection: "column", gap: 5, padding: 4,
          }}
        >
          {[0,1,2].map(i => (
            <span key={i} style={{
              display: "block", width: 22, height: 1.5,
              background: scrolled ? "#0a0a0a" : "#fff",
              transition: "all 0.3s",
              transform: menuOpen && i === 0 ? "rotate(45deg) translate(4px, 4px)" :
                         menuOpen && i === 2 ? "rotate(-45deg) translate(4px, -4px)" : "none",
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
          alignItems: "center", justifyContent: "center",
          gap: 40,
        }}>
          {["#features", "#pricing", "/crm"].map((href, i) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 42, fontWeight: 300,
                color: "#fff", textDecoration: "none",
                opacity: 0, animation: `fadeUp 0.5s ease ${i * 100}ms forwards`,
              }}
            >
              {["Funzioni", "Prezzi", "CRM"][i]}
            </a>
          ))}
        </div>
      )}

      {/* ── HERO VIDEO ── */}
      <section style={{ position: "relative", height: "100vh", overflow: "hidden" }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
          }}
        >
          <source src="/kling_20260207_Image_to_Video__913_0.mp4" type="video/mp4" />
        </video>

        {/* Overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.7) 100%)",
        }} />

        {/* Hero content */}
        <div style={{
          position: "relative", zIndex: 2,
          height: "100%", display: "flex",
          flexDirection: "column", justifyContent: "flex-end",
          padding: "0 32px 72px",
          maxWidth: 1200,
        }}>
          <div
            className="mono"
            style={{
              fontSize: 11, color: "rgba(255,255,255,0.5)",
              marginBottom: 24,
              animation: "fadeUp 1s ease 0.3s both",
            }}
          >
            — Software CRM per il Business Moderno
          </div>

          <h1
            className="hero-title"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(60px, 10vw, 120px)",
              fontWeight: 300,
              lineHeight: 0.9,
              color: "#fff",
              letterSpacing: "-0.02em",
              marginBottom: 32,
              animation: "fadeUp 1s ease 0.5s both",
            }}
          >
            Il tuo<br />
            <em style={{ fontStyle: "italic" }}>business</em><br />
            al centro.
          </h1>

          <p
            className="hero-sub"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 20, fontWeight: 300,
              color: "rgba(255,255,255,0.75)",
              lineHeight: 1.7, maxWidth: 480,
              marginBottom: 48,
              animation: "fadeUp 1s ease 0.7s both",
            }}
          >
            Gestisci clienti, pipeline e automazioni da un'unica piattaforma elegante.
          </p>

          <div
            className="hero-btns"
            style={{
              display: "flex", gap: 16, alignItems: "center",
              animation: "fadeUp 1s ease 0.9s both",
            }}
          >
            <a href="/crm" className="btn-white">Inizia Gratis</a>
            <a href="#features" className="btn-white" style={{ background: "transparent", color: "#fff" }}>
              Scopri di più
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div style={{
          position: "absolute", bottom: 32, right: 32, zIndex: 2,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
          animation: "fadeUp 1s ease 1.2s both",
        }}>
          <div style={{
            width: 1, height: 56,
            background: "rgba(255,255,255,0.4)",
            animation: "pulseH 2s ease-in-out infinite",
          }} />
          <span className="mono" style={{ fontSize: 9, color: "rgba(255,255,255,0.4)" }}>scroll</span>
        </div>

        <style>{`
          @keyframes pulseH {
            0%,100% { transform: scaleY(1); opacity: 0.4; }
            50% { transform: scaleY(0.4); opacity: 0.8; }
          }
        `}</style>
      </section>

      {/* ── MARQUEE ── */}
      <div className="marquee-wrap" style={{ background: "#0a0a0a", padding: "28px 0", borderTop: "1px solid #1a1a1a" }}>
        <div className="marquee-track">
          {[...Array(4)].flatMap(() =>
            stats.map((s, i) => (
              <span key={`${s}-${i}`} style={{ display: "inline-flex", alignItems: "center", gap: 32, padding: "0 48px" }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 300, color: "#fff" }}>
                  {s}
                </span>
                <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 18 }}>×</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" className="section-pad" style={{ padding: "120px 32px", maxWidth: 1200, margin: "0 auto" }}>
        <Reveal>
          <div style={{ marginBottom: 72 }}>
            <span className="mono" style={{ fontSize: 10, opacity: 0.35, display: "block", marginBottom: 20 }}>
              — Funzionalità
            </span>
            <h2
              className="section-title"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(40px, 6vw, 80px)",
                fontWeight: 300, lineHeight: 1,
              }}
            >
              Tutto ciò che<br />
              <em>serve davvero.</em>
            </h2>
          </div>
        </Reveal>

        <div
          className="features-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 2,
          }}
        >
          {features.map((f, i) => (
            <Reveal key={f.num} delay={i * 80}>
              <div className="feature-card">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
                  <span className="mono" style={{ fontSize: 10, opacity: 0.3 }}>{f.num}</span>
                  <span style={{ fontSize: 20, opacity: 0.15 }}>{f.icon}</span>
                </div>
                <h3 style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 26, fontWeight: 400,
                  marginBottom: 16, lineHeight: 1.2,
                }}>
                  {f.title}
                </h3>
                <p style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 17, fontWeight: 300,
                  lineHeight: 1.75, opacity: 0.6,
                }}>
                  {f.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: "#f7f7f7", padding: "100px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Reveal>
            <span className="mono" style={{ fontSize: 10, opacity: 0.35, display: "block", marginBottom: 64 }}>
              — Numeri che parlano
            </span>
          </Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 48 }}>
            {[
              { val: "3×", label: "Più conversioni" },
              { val: "80%", label: "Tempo risparmiato" },
              { val: "10k+", label: "Aziende attive" },
              { val: "99.9%", label: "Uptime garantito" },
            ].map((s, i) => (
              <Reveal key={s.val} delay={i * 100}>
                <div style={{ borderTop: "1px solid #ddd", paddingTop: 32 }}>
                  <div
                    className="stat-value"
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                      fontSize: 72, fontWeight: 300,
                      lineHeight: 1, marginBottom: 12,
                    }}
                  >
                    {s.val}
                  </div>
                  <div className="mono" style={{ fontSize: 10, opacity: 0.4 }}>{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section id="crm" style={{ background: "#0a0a0a", padding: "140px 32px", position: "relative", overflow: "hidden" }}>
        {/* Decorative circles */}
        {[500, 800, 1100].map((size, i) => (
          <div key={i} style={{
            position: "absolute",
            width: size, height: size,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.04)",
            top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }} />
        ))}

        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <Reveal>
            <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", display: "block", marginBottom: 32 }}>
              — Pronto a iniziare?
            </span>
            <h2
              className="cta-title"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: "clamp(48px, 8vw, 96px)",
                fontWeight: 300, lineHeight: 0.95,
                color: "#fff", letterSpacing: "-0.02em",
                marginBottom: 32,
              }}
            >
              Entra nel<br />
              <em>tuo CRM.</em>
            </h2>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 20, fontWeight: 300,
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.7, marginBottom: 56,
            }}>
              Accedi alla dashboard, gestisci i tuoi clienti e fai crescere il tuo business da oggi.
            </p>
            <a href="/crm" className="btn-white">
              Apri il CRM →
            </a>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: "40px 32px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderTop: "1px solid #ebebeb",
        flexWrap: "wrap", gap: 16,
      }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 18, fontWeight: 600, letterSpacing: "0.18em",
        }}>
          ARTEMISIA
        </div>
        <div className="mono" style={{ fontSize: 10, opacity: 0.3 }}>
          © 2025 — Tutti i diritti riservati
        </div>
      </footer>
    </div>
  );
}
