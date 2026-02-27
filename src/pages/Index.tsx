import { useEffect, useRef, useState } from "react";

// Hook for scroll-triggered animations
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

function RevealSection({ children, delay = 0, className = "" }: {
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
        transform: visible ? "translateY(0px)" : "translateY(40px)",
        transition: `opacity 0.8s ease ${delay}ms, transform 0.8s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const Index = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    const onMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("scroll", onScroll);
    window.addEventListener("mousemove", onMouseMove);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  const features = [
    { num: "01", title: "Pipeline Intelligente", desc: "Gestisci lead e opportunità con una vista chiara e intuitiva. Ogni deal al posto giusto, sempre." },
    { num: "02", title: "Automazioni Potenti", desc: "Elimina il lavoro manuale. Imposta flussi automatici per email, follow-up e notifiche." },
    { num: "03", title: "Analisi in Tempo Reale", desc: "Dashboard personalizzabili con metriche che contano davvero per il tuo business." },
    { num: "04", title: "Integrazioni Native", desc: "Connettiti con gli strumenti che già usi. Tutto sincronizzato, tutto sotto controllo." },
  ];

  const stats = [
    { value: "3×", label: "Più conversioni" },
    { value: "80%", label: "Tempo risparmiato" },
    { value: "10k+", label: "Aziende attive" },
  ];

  return (
    <div
      style={{
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        backgroundColor: "#ffffff",
        color: "#0a0a0a",
        overflowX: "hidden",
      }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Mono:wght@300;400&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        ::selection { background: #0a0a0a; color: #fff; }

        .btn-primary {
          display: inline-block;
          padding: 18px 52px;
          background: #0a0a0a;
          color: #fff;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          text-decoration: none;
          border: 1.5px solid #0a0a0a;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: color 0.35s ease;
        }
        .btn-primary::before {
          content: '';
          position: absolute;
          inset: 0;
          background: #fff;
          transform: translateX(-101%);
          transition: transform 0.35s ease;
        }
        .btn-primary:hover { color: #0a0a0a; }
        .btn-primary:hover::before { transform: translateX(0); }
        .btn-primary span { position: relative; z-index: 1; }

        .btn-outline {
          display: inline-block;
          padding: 18px 52px;
          background: transparent;
          color: #0a0a0a;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          text-decoration: none;
          border: 1.5px solid #0a0a0a;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          transition: color 0.35s ease;
        }
        .btn-outline::before {
          content: '';
          position: absolute;
          inset: 0;
          background: #0a0a0a;
          transform: translateX(-101%);
          transition: transform 0.35s ease;
        }
        .btn-outline:hover { color: #fff; }
        .btn-outline:hover::before { transform: translateX(0); }
        .btn-outline span { position: relative; z-index: 1; }

        .nav-link {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #0a0a0a;
          text-decoration: none;
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        .nav-link:hover { opacity: 1; }

        .feature-card {
          border-top: 1px solid #e0e0e0;
          padding: 48px 0;
          transition: border-color 0.3s;
        }
        .feature-card:hover { border-color: #0a0a0a; }

        .marquee-track {
          display: flex;
          white-space: nowrap;
          animation: marquee 18s linear infinite;
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .grain {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 9999;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 200px;
        }
      `}</style>

      {/* Grain overlay */}
      <div className="grain" />

      {/* Cursor glow */}
      <div
        style={{
          position: "fixed",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,0,0,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 9998,
          left: mousePos.x - 200,
          top: mousePos.y - 200,
          transition: "left 0.1s ease, top 0.1s ease",
        }}
      />

      {/* NAV */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: "24px 64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid #e8e8e8" : "1px solid transparent",
          transition: "all 0.4s ease",
        }}
      >
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, letterSpacing: "0.08em" }}>
          NEXUS
        </div>
        <div style={{ display: "flex", gap: 40, alignItems: "center" }}>
          <a href="#features" className="nav-link">Funzioni</a>
          <a href="#pricing" className="nav-link">Prezzi</a>
          <a href="#crm" className="btn-primary" style={{ padding: "12px 32px" }}>
            <span>Accedi al CRM</span>
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "120px 64px 80px",
          position: "relative",
        }}
      >
        {/* Background grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            pointerEvents: "none",
          }}
        />

        <div style={{ maxWidth: 900, position: "relative" }}>
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: 11,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              opacity: 0.4,
              marginBottom: 32,
              animation: "fadeIn 1s ease 0.2s both",
            }}
          >
            — Software CRM per il Business Moderno
          </div>

          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(64px, 9vw, 130px)",
              fontWeight: 300,
              lineHeight: 0.92,
              letterSpacing: "-0.02em",
              marginBottom: 48,
              animation: "slideUp 1s ease 0.4s both",
            }}
          >
            Il tuo<br />
            <em style={{ fontStyle: "italic", fontWeight: 300 }}>business</em><br />
            al centro.
          </h1>

          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 22,
              fontWeight: 300,
              lineHeight: 1.7,
              maxWidth: 520,
              opacity: 0.65,
              marginBottom: 56,
              animation: "slideUp 1s ease 0.6s both",
            }}
          >
            Gestisci clienti, pipeline e automazioni da un'unica piattaforma elegante.
            Smetti di usare fogli Excel.
          </p>

          <div
            style={{
              display: "flex",
              gap: 20,
              alignItems: "center",
              animation: "slideUp 1s ease 0.8s both",
            }}
          >
            <a href="#crm" className="btn-primary">
              <span>Inizia Gratis</span>
            </a>
            <a href="#features" className="btn-outline">
              <span>Scopri di più</span>
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            left: 64,
            display: "flex",
            alignItems: "center",
            gap: 16,
            animation: "fadeIn 1s ease 1.2s both",
          }}
        >
          <div
            style={{
              width: 1,
              height: 64,
              background: "#0a0a0a",
              opacity: 0.2,
              animation: "pulseHeight 2s ease-in-out infinite",
            }}
          />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.3 }}>
            Scroll
          </span>
        </div>

        <style>{`
          @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(30px) } to { opacity: 1; transform: translateY(0) } }
          @keyframes pulseHeight {
            0%, 100% { transform: scaleY(1); opacity: 0.2; }
            50% { transform: scaleY(0.5); opacity: 0.5; }
          }
        `}</style>
      </section>

      {/* STATS MARQUEE */}
      <section
        style={{
          borderTop: "1px solid #e0e0e0",
          borderBottom: "1px solid #e0e0e0",
          padding: "32px 0",
          overflow: "hidden",
          background: "#0a0a0a",
        }}
      >
        <div className="marquee-track">
          {[...Array(4)].flatMap(() =>
            stats.map((s, i) => (
              <div
                key={`${s.value}-${i}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 48,
                  padding: "0 64px",
                }}
              >
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 300, color: "#fff" }}>
                  {s.value}
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)" }}>
                  {s.label}
                </span>
                <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 24 }}>—</span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: "140px 64px", maxWidth: 1200, margin: "0 auto" }}>
        <RevealSection>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 80 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(40px, 5vw, 72px)", fontWeight: 300, lineHeight: 1.1 }}>
              Tutto ciò che<br />
              <em>serve davvero.</em>
            </h2>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", opacity: 0.4, maxWidth: 200, textAlign: "right" }}>
              Funzionalità progettate per chi fa sul serio
            </p>
          </div>
        </RevealSection>

        {features.map((f, i) => (
          <RevealSection key={f.num} delay={i * 100}>
            <div className="feature-card">
              <div style={{ display: "grid", gridTemplateColumns: "80px 1fr 2fr", gap: 48, alignItems: "center" }}>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, opacity: 0.3, letterSpacing: "0.1em" }}>
                  {f.num}
                </span>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 400 }}>
                  {f.title}
                </h3>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 300, lineHeight: 1.7, opacity: 0.6 }}>
                  {f.desc}
                </p>
              </div>
            </div>
          </RevealSection>
        ))}
      </section>

      {/* DIVIDER */}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #0a0a0a 30%, #0a0a0a 70%, transparent)", opacity: 0.1, margin: "0 64px" }} />

      {/* CTA SECTION */}
      <section
        id="crm"
        style={{
          padding: "160px 64px",
          textAlign: "center",
          background: "#0a0a0a",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circle */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.06)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 900,
            height: 900,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.03)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />

        <RevealSection>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 32 }}>
            — Pronto a iniziare?
          </div>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "clamp(48px, 7vw, 100px)",
              fontWeight: 300,
              lineHeight: 1,
              color: "#fff",
              marginBottom: 32,
              letterSpacing: "-0.02em",
            }}
          >
            Entra nel<br />
            <em>tuo CRM.</em>
          </h2>
          <p
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 20,
              fontWeight: 300,
              color: "rgba(255,255,255,0.5)",
              marginBottom: 56,
              maxWidth: 460,
              margin: "0 auto 56px",
              lineHeight: 1.7,
            }}
          >
            Accedi alla dashboard, gestisci i tuoi clienti e fai crescere il tuo business da oggi.
          </p>
          <a
            href="/crm"
            style={{
              display: "inline-block",
              padding: "20px 64px",
              background: "#fff",
              color: "#0a0a0a",
              fontFamily: "'DM Mono', monospace",
              fontSize: 13,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              textDecoration: "none",
              border: "1.5px solid #fff",
              transition: "all 0.35s ease",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
              (e.currentTarget as HTMLAnchorElement).style.color = "#fff";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = "#fff";
              (e.currentTarget as HTMLAnchorElement).style.color = "#0a0a0a";
            }}
          >
            Apri il CRM →
          </a>
        </RevealSection>
      </section>

      {/* FOOTER */}
      <footer
        style={{
          padding: "48px 64px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #e0e0e0",
        }}
      >
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, letterSpacing: "0.08em" }}>
          NEXUS
        </div>
        <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, opacity: 0.3, letterSpacing: "0.1em" }}>
          © 2025 — Tutti i diritti riservati
        </div>
      </footer>
    </div>
  );
};

export default Index;
