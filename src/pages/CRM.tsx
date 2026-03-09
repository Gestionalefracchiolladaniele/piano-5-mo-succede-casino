import { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
type Status = "lead" | "contatto" | "proposta" | "negoziazione" | "cliente" | "perso";
type NoteType = "nota" | "chiamata" | "email" | "meeting";
type View = "dashboard" | "clienti" | "kanban" | "calendario" | "report";

interface Note {
  id: string;
  text: string;
  date: string;
  type: NoteType;
}

interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  sector: string;
  value: number;
  probability: number;
  status: Status;
  tags: string[];
  notes: Note[];
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const STATUSES: { key: Status; label: string; color: string }[] = [
  { key: "lead", label: "Lead", color: "#6b7280" },
  { key: "contatto", label: "Contatto", color: "#3b82f6" },
  { key: "proposta", label: "Proposta", color: "#f59e0b" },
  { key: "negoziazione", label: "Negoziazione", color: "#8b5cf6" },
  { key: "cliente", label: "Cliente", color: "#10b981" },
  { key: "perso", label: "Perso", color: "#ef4444" },
];

const SECTORS = [
  "Tech",
  "Finance",
  "Retail",
  "Healthcare",
  "Real Estate",
  "Education",
  "Marketing",
  "Legal",
  "Manufacturing",
  "Other",
];
const NOTE_ICONS: Record<NoteType, string> = { nota: "✎", chiamata: "☎", email: "✉", meeting: "◈" };
const NOTE_TYPES: NoteType[] = ["nota", "chiamata", "email", "meeting"];
const STORAGE_KEY = "artemisia_crm_v2";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function fmt(n: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
function initials(name: string) {
  return (
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}
function load(): Client[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}
function save(c: Client[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
}

const EMPTY: Omit<Client, "id" | "createdAt" | "updatedAt" | "notes"> = {
  name: "",
  company: "",
  email: "",
  phone: "",
  sector: "Tech",
  value: 0,
  probability: 50,
  status: "lead",
  tags: [],
};

// ─────────────────────────────────────────────
// THEME (white + deep navy)
// ─────────────────────────────────────────────
const COLOR_DARK = "#0F2440";
const COLOR_WHITE = "#FFFFFF";
const COLOR_MUTED_BG = "#F6F8FC";
const COLOR_BORDER = "#E6EAF2";
const COLOR_TEXT_MUTED = "rgba(15,36,64,.62)";

// ─────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────
function Counter({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = to / 40;
    const t = setInterval(() => {
      start += step;
      if (start >= to) {
        setVal(to);
        clearInterval(t);
      } else setVal(Math.floor(start));
    }, 20);
    return () => clearInterval(t);
  }, [to]);
  return (
    <>
      {prefix}
      {val.toLocaleString("it-IT")}
      {suffix}
    </>
  );
}

// ─────────────────────────────────────────────
// REVEAL HOOK
// ─────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setVis(true);
    }, { threshold: 0.1 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return { ref, vis };
}

function Reveal({
  children,
  delay = 0,
  from = "bottom",
}: {
  children: React.ReactNode;
  delay?: number;
  from?: "bottom" | "left" | "right" | "top";
}) {
  const { ref, vis } = useReveal();
  const t = { bottom: "translateY(32px)", top: "translateY(-32px)", left: "translateX(-32px)", right: "translateX(32px)" };
  return (
    <div
      ref={ref}
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "none" : t[from],
        transition: `opacity .7s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .7s cubic-bezier(.22,1,.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
export default function CRM() {
  const [clients, setClients] = useState<Client[]>(load);
  const [view, setView] = useState<View>("dashboard");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("nota");
  const [navOpen, setNavOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Status | null>(null);
  const [calDate, setCalDate] = useState(new Date());
  const [toast, setToast] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    save(clients);
  }, [clients]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  // ── CRUD ──
  function saveClient() {
    if (!formData.name.trim()) return;
    const now = new Date().toISOString();
    if (editingId) {
      setClients((cs) => cs.map((c) => (c.id === editingId ? { ...c, ...formData, updatedAt: now } : c)));
      if (selectedClient?.id === editingId) setSelectedClient((c) => (c ? { ...c, ...formData } : c));
      showToast("Cliente aggiornato");
    } else {
      const nc: Client = { ...formData, id: uid(), notes: [], createdAt: now, updatedAt: now };
      setClients((cs) => [nc, ...cs]);
      showToast("Cliente creato");
    }
    resetForm();
  }

  function confirmDelete(id: string) {
    setDeleteConfirm(id);
  }

  function deleteClient(id: string) {
    setClients((cs) => cs.filter((c) => c.id !== id));
    if (selectedClient?.id === id) setSelectedClient(null);
    setDeleteConfirm(null);
    showToast("Cliente eliminato");
  }

  function updateStatus(id: string, status: Status) {
    const now = new Date().toISOString();
    setClients((cs) => cs.map((c) => (c.id === id ? { ...c, status, updatedAt: now } : c)));
    if (selectedClient?.id === id) setSelectedClient((c) => (c ? { ...c, status } : c));
    showToast(`Stato aggiornato: ${STATUSES.find((s) => s.key === status)?.label}`);
  }

  function addNote() {
    if (!noteText.trim() || !selectedClient) return;
    const note: Note = { id: uid(), text: noteText.trim(), date: new Date().toISOString(), type: noteType };
    const now = new Date().toISOString();
    setClients((cs) => cs.map((c) => (c.id === selectedClient.id ? { ...c, notes: [note, ...c.notes], updatedAt: now } : c)));
    setSelectedClient((c) => (c ? { ...c, notes: [note, ...c.notes] } : c));
    setNoteText("");
    showToast("Nota aggiunta");
  }

  function deleteNote(clientId: string, noteId: string) {
    setClients((cs) => cs.map((c) => (c.id === clientId ? { ...c, notes: c.notes.filter((n) => n.id !== noteId) } : c)));
    setSelectedClient((c) => (c ? { ...c, notes: c.notes.filter((n) => n.id !== noteId) } : c));
    showToast("Nota eliminata");
  }

  function resetForm() {
    setFormData({ ...EMPTY });
    setEditingId(null);
    setShowForm(false);
    setNewTag("");
  }

  function openEdit(c: Client) {
    setFormData({
      name: c.name,
      company: c.company,
      email: c.email,
      phone: c.phone,
      sector: c.sector,
      value: c.value,
      probability: c.probability,
      status: c.status,
      tags: [...c.tags],
    });
    setEditingId(c.id);
    setShowForm(true);
  }

  // ── FILTERS ──
  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    const mq =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q));
    const ms = filterStatus === "all" || c.status === filterStatus;
    return mq && ms;
  });

  // ── STATS ──
  const totalValue = clients.reduce((s, c) => s + c.value, 0);
  const activeClients = clients.filter((c) => c.status === "cliente").length;
  const openDeals = clients.filter((c) => !["cliente", "perso"].includes(c.status)).length;
  const convRate = clients.length ? Math.round((activeClients / clients.length) * 100) : 0;
  const pipelineValue = clients
    .filter((c) => !["cliente", "perso"].includes(c.status))
    .reduce((s, c) => s + c.value * (c.probability / 100), 0);

  // ── DRAG & DROP ──
  function onDrop(status: Status) {
    if (dragId) {
      updateStatus(dragId, status);
      setDragId(null);
      setDragOver(null);
    }
  }

  const statusOf = (c: Client) => STATUSES.find((s) => s.key === c.status)!;

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div
      style={{
        fontFamily: "'Cormorant Garamond',Georgia,serif",
        background: COLOR_WHITE,
        minHeight: "100vh",
        color: COLOR_DARK,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Instrument+Mono:wght@300;400&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        ::selection{background:${COLOR_DARK};color:${COLOR_WHITE};}
        .mono{font-family:'Instrument Mono',monospace;letter-spacing:.1em;text-transform:uppercase;}
        input,select,textarea{font-family:'Cormorant Garamond',serif;outline:none;color:${COLOR_DARK};}
        input::placeholder,textarea::placeholder{opacity:.45;color:${COLOR_DARK};}
        select option{background:${COLOR_WHITE};color:${COLOR_DARK};}

        /* SCROLLBAR */
        ::-webkit-scrollbar{width:3px;height:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:rgba(15,36,64,.35);border-radius:2px;}

        /* NAV LINK */
        .nav-btn{
          display:flex;align-items:center;gap:12px;
          padding:13px 20px;width:100%;
          font-family:'Instrument Mono',monospace;font-size:9px;
          letter-spacing:.14em;text-transform:uppercase;
          color:rgba(15,36,64,.55);background:none;border:none;cursor:pointer;
          transition:color .2s,background .2s;border-radius:2px;text-align:left;
        }
        .nav-btn:hover{color:${COLOR_DARK};background:rgba(15,36,64,.06);}
        .nav-btn.active{color:${COLOR_DARK};background:rgba(15,36,64,.10);}

        /* CARD */
        .card{
          background:${COLOR_WHITE};border:1px solid ${COLOR_BORDER};padding:24px;
          transition:border-color .3s,box-shadow .3s;
        }
        .card:hover{border-color:rgba(15,36,64,.25);box-shadow:0 18px 50px rgba(15,36,64,.08);}

        /* INPUTS */
        .inp{
          width:100%;padding:12px 16px;
          background:${COLOR_WHITE};border:1px solid ${COLOR_BORDER};
          font-size:16px;color:${COLOR_DARK};
          transition:border-color .2s,box-shadow .2s;border-radius:2px;
        }
        .inp:focus{border-color:rgba(15,36,64,.45);box-shadow:0 0 0 3px rgba(15,36,64,.10);}

        /* BUTTONS */
        .btn{
          display:inline-flex;align-items:center;justify-content:center;gap:8px;
          font-family:'Instrument Mono',monospace;font-size:9px;
          letter-spacing:.14em;text-transform:uppercase;
          cursor:pointer;transition:all .25s;border-radius:2px;
          padding:12px 24px;border:1.5px solid;
        }
        .btn-w{background:${COLOR_DARK};color:${COLOR_WHITE};border-color:${COLOR_DARK};}
        .btn-w:hover{background:transparent;color:${COLOR_DARK};}
        .btn-o{background:transparent;color:${COLOR_DARK};border-color:rgba(15,36,64,.35);}
        .btn-o:hover{border-color:${COLOR_DARK};background:rgba(15,36,64,.05);}
        .btn-r{background:transparent;color:#ef4444;border-color:#ef4444;}
        .btn-r:hover{background:#ef4444;color:#fff;}
        .btn-sm{padding:7px 14px;font-size:8px;}

        /* CLIENT ROW */
        .crow{
          display:grid;align-items:center;
          padding:14px 20px;border-bottom:1px solid ${COLOR_BORDER};
          cursor:pointer;transition:background .15s;
        }
        .crow:hover{background:rgba(15,36,64,.03);}

        /* TAG */
        .tag{
          display:inline-block;padding:3px 10px;
          border:1px solid rgba(15,36,64,.28);font-size:10px;border-radius:2px;
          font-family:'Instrument Mono',monospace;letter-spacing:.06em;
          color:rgba(15,36,64,.70);
          background:rgba(15,36,64,.03);
        }

        /* KANBAN */
        .kcol{min-height:120px;padding:8px;border:2px dashed transparent;transition:border-color .2s,background .2s;}
        .kcol.dover{border-color:${COLOR_DARK};background:rgba(15,36,64,.03);}
        .kcard{
          background:${COLOR_WHITE};border:1px solid ${COLOR_BORDER};
          padding:14px;margin-bottom:6px;cursor:grab;
          transition:box-shadow .2s,transform .2s,border-color .2s;
        }
        .kcard:hover{box-shadow:0 12px 28px rgba(15,36,64,.10);transform:translateY(-2px);border-color:rgba(15,36,64,.25);}
        .kcard.dragging{opacity:.5;}

        /* STATUS PILL */
        .spill{
          display:inline-flex;align-items:center;gap:6px;
          padding:4px 10px;border-radius:2px;border:1px solid;
          font-family:'Instrument Mono',monospace;font-size:8px;letter-spacing:.1em;text-transform:uppercase;
          background:rgba(255,255,255,.7);
        }

        /* PROGRESS */
        .pbar{height:3px;background:rgba(15,36,64,.10);border-radius:2px;overflow:hidden;}
        .pfill{height:100%;border-radius:2px;transition:width .6s ease;}

        /* DETAIL PANEL */
        .dpanel{
          position:fixed;right:0;top:0;bottom:0;width:400px;
          background:${COLOR_WHITE};border-left:1px solid ${COLOR_BORDER};
          z-index:400;overflow-y:auto;
          transform:translateX(100%);transition:transform .4s cubic-bezier(.22,1,.36,1);
        }
        .dpanel.open{transform:translateX(0);}

        /* MODAL */
        .moverlay{position:fixed;inset:0;background:rgba(15,36,64,.55);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px;}
        .modal{background:${COLOR_WHITE};border:1px solid ${COLOR_BORDER};width:100%;max-width:580px;max-height:92vh;overflow-y:auto;box-shadow:0 20px 80px rgba(15,36,64,.20);}

        /* TOAST */
        .toast{
          position:fixed;bottom:32px;left:50%;transform:translateX(-50%);
          background:${COLOR_DARK};color:${COLOR_WHITE};
          font-family:'Instrument Mono',monospace;font-size:10px;letter-spacing:.12em;
          padding:12px 28px;border-radius:2px;z-index:9999;
          animation:toastIn .3s ease;
        }
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}

        /* AVATAR */
        .avatar{
          display:flex;align-items:center;justify-content:center;
          background:${COLOR_DARK};color:${COLOR_WHITE};font-weight:600;
          border-radius:50%;flex-shrink:0;letter-spacing:.05em;
        }

        /* MOBILE */
        @media(max-width:768px){
          .sidebar{transform:translateX(-100%);transition:transform .3s;position:fixed!important;z-index:300;height:100vh;}
          .sidebar.open{transform:translateX(0);}
          .main-wrap{margin-left:0!important;}
          .dpanel{width:100%!important;}
          .desk-only{display:none!important;}
          .stats-g{grid-template-columns:1fr 1fr!important;}
          .kg{grid-template-columns:repeat(2,minmax(180px,1fr))!important;overflow-x:auto;}
          .form-g{grid-template-columns:1fr!important;}
          .top-bar-title{font-size:22px!important;}
        }
        @media(min-width:769px){
          .mob-only{display:none!important;}
        }

        /* ANIMATIONS */
        @keyframes fadeSlideUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;}}
        @keyframes fadeIn{from{opacity:0;}to{opacity:1;}}
        .anim-in{animation:fadeSlideUp .4s cubic-bezier(.22,1,.36,1) both;}

        /* RANGE INPUT */
        input[type=range]{accent-color:${COLOR_DARK};width:100%;}

        /* SIDEBAR FOOTER */
        .sb-footer{padding:20px;border-top:1px solid ${COLOR_BORDER};margin-top:auto;}
      `}</style>

      {/* ── TOAST ── */}
      {toast && <div className="toast">{toast}</div>}

      {/* ── DELETE CONFIRM ── */}
      {deleteConfirm && (
        <div className="moverlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 380, padding: 32 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 300, marginBottom: 12, color: COLOR_DARK }}>
              Elimina Cliente
            </div>
            <div className="mono" style={{ fontSize: 9, opacity: 0.7, marginBottom: 28, lineHeight: 1.6, color: COLOR_TEXT_MUTED }}>
              Questa azione è irreversibile.<br />
              Tutti i dati e le note verranno eliminati.
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-r" style={{ flex: 1 }} onClick={() => deleteClient(deleteConfirm)}>
                Elimina
              </button>
              <button className="btn btn-o" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`sidebar${navOpen ? " open" : ""}`}
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: 220,
          background: COLOR_WHITE,
          borderRight: `1px solid ${COLOR_BORDER}`,
          display: "flex",
          flexDirection: "column",
          zIndex: 200,
        }}
      >
        {/* Logo */}
        <div style={{ padding: "28px 20px 20px", borderBottom: `1px solid ${COLOR_BORDER}` }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <div
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: 18,
                fontWeight: 600,
                letterSpacing: ".2em",
                color: COLOR_DARK,
              }}
            >
              ARTEMISIA
            </div>
            <div className="mono" style={{ fontSize: 7, color: "rgba(15,36,64,.45)", marginTop: 4 }}>
              CRM · v2
            </div>
          </a>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {(
            [
              ["dashboard", "▣", "Dashboard"],
              ["clienti", "◉", "Clienti"],
              ["kanban", "◐", "Pipeline"],
              ["calendario", "◎", "Calendario"],
              ["report", "◈", "Report"],
            ] as [View, string, string][]
          ).map(([v, icon, label]) => (
            <button
              key={v}
              className={`nav-btn${view === v ? " active" : ""}`}
              onClick={() => {
                setView(v);
                setNavOpen(false);
              }}
            >
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span>{label}</span>
              {view === v && <span style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: COLOR_DARK }} />}
            </button>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="sb-footer">
          <div className="mono" style={{ fontSize: 7, opacity: 0.55, marginBottom: 6, color: COLOR_TEXT_MUTED }}>
            Pipeline pesata
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 300, color: COLOR_DARK }}>
            {fmt(pipelineValue)}
          </div>
          <div className="mono" style={{ fontSize: 7, opacity: 0.55, marginTop: 4, color: COLOR_TEXT_MUTED }}>
            {openDeals} deal aperti
          </div>
        </div>
      </aside>

      {/* ── MAIN WRAP ── */}
      <div className="main-wrap" style={{ marginLeft: 220, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* TOP BAR */}
        <header
          style={{
            padding: "18px 28px",
            background: COLOR_WHITE,
            borderBottom: `1px solid ${COLOR_BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 50,
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* hamburger */}
            <button className="mob-only btn btn-o btn-sm" onClick={() => setNavOpen(!navOpen)} style={{ padding: "8px 12px" }}>
              ☰
            </button>
            <h1
              className="top-bar-title"
              style={{
                fontFamily: "'Cormorant Garamond',serif",
                fontSize: 26,
                fontWeight: 300,
                textTransform: "capitalize",
                color: COLOR_DARK,
              }}
            >
              {view}
            </h1>
            <span className="mono desk-only" style={{ fontSize: 8, opacity: 0.6, color: COLOR_TEXT_MUTED }}>
              {clients.length} clienti · {fmt(totalValue)}
            </span>
          </div>
          <button
            className="btn btn-w"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            + Nuovo Cliente
          </button>
        </header>

        {/* ── CONTENT ── */}
        <main style={{ flex: 1, padding: "28px", overflowX: "hidden", background: COLOR_MUTED_BG }}>
          {/* ════ DASHBOARD ════ */}
          {view === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* KPI row */}
              <div className="stats-g" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                {[
                  { label: "Clienti Totali", val: clients.length, suffix: "", sub: "nel CRM" },
                  { label: "Clienti Attivi", val: activeClients, suffix: "", sub: "acquisiti" },
                  { label: "Deal Aperti", val: openDeals, suffix: "", sub: "in pipeline" },
                  { label: "Conversione", val: convRate, suffix: "%", sub: "lead → cliente" },
                ].map((s, i) => (
                  <Reveal key={s.label} delay={i * 60}>
                    <div className="card" style={{ borderLeft: `2px solid ${COLOR_DARK}` }}>
                      <div className="mono" style={{ fontSize: 8, opacity: 0.7, marginBottom: 14, color: COLOR_TEXT_MUTED }}>
                        {s.label}
                      </div>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 44, fontWeight: 300, lineHeight: 1, color: COLOR_DARK }}>
                        <Counter to={s.val} suffix={s.suffix} />
                      </div>
                      <div className="mono" style={{ fontSize: 7, opacity: 0.7, marginTop: 8, color: COLOR_TEXT_MUTED }}>
                        {s.sub}
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* Revenue cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Reveal from="left">
                  <div className="card">
                    <div className="mono" style={{ fontSize: 8, opacity: 0.7, marginBottom: 12, color: COLOR_TEXT_MUTED }}>
                      Valore Totale Portfolio
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 42, fontWeight: 300, color: COLOR_DARK }}>
                      {fmt(totalValue)}
                    </div>
                    <div className="mono" style={{ fontSize: 7, opacity: 0.7, marginTop: 8, color: COLOR_TEXT_MUTED }}>
                      somma di tutti i clienti
                    </div>
                  </div>
                </Reveal>
                <Reveal from="right">
                  <div className="card">
                    <div className="mono" style={{ fontSize: 8, opacity: 0.7, marginBottom: 12, color: COLOR_TEXT_MUTED }}>
                      Pipeline Pesata
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 42, fontWeight: 300, color: COLOR_DARK }}>
                      {fmt(pipelineValue)}
                    </div>
                    <div className="mono" style={{ fontSize: 7, opacity: 0.7, marginTop: 8, color: COLOR_TEXT_MUTED }}>
                      valore × probabilità
                    </div>
                  </div>
                </Reveal>
              </div>

              {/* Status distribution */}
              <Reveal>
                <div className="card">
                  <div className="mono" style={{ fontSize: 8, opacity: 0.7, marginBottom: 20, color: COLOR_TEXT_MUTED }}>
                    Distribuzione Clienti per Stato
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {STATUSES.map((s) => {
                      const count = clients.filter((c) => c.status === s.key).length;
                      const pct = clients.length ? (count / clients.length) * 100 : 0;
                      return (
                        <div key={s.key}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                              <span className="mono" style={{ fontSize: 8, color: COLOR_DARK }}>
                                {s.label}
                              </span>
                            </span>
                            <span className="mono" style={{ fontSize: 8, opacity: 0.75, color: COLOR_TEXT_MUTED }}>
                              {count} · {Math.round(pct)}%
                            </span>
                          </div>
                          <div className="pbar">
                            <div className="pfill" style={{ width: `${pct}%`, background: s.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Reveal>

              {/* Recent */}
              <Reveal>
                <div className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                    <div className="mono" style={{ fontSize: 8, opacity: 0.7, color: COLOR_TEXT_MUTED }}>
                      Ultimi Aggiunti
                    </div>
                    <button className="btn btn-o btn-sm" onClick={() => setView("clienti")}>
                      Vedi tutti
                    </button>
                  </div>
                  {clients.slice(0, 5).map((c) => (
                    <div
                      key={c.id}
                      className="crow"
                      style={{ gridTemplateColumns: "36px 1fr auto auto", gap: 14 }}
                      onClick={() => {
                        setSelectedClient(c);
                      }}
                    >
                      <div className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>
                        {initials(c.name)}
                      </div>
                      <div>
                        <div style={{ fontSize: 16, color: COLOR_DARK }}>{c.name}</div>
                        <div className="mono" style={{ fontSize: 8, opacity: 0.75, color: COLOR_TEXT_MUTED }}>
                          {c.company}
                        </div>
                      </div>
                      <span className="spill" style={{ color: statusOf(c).color, borderColor: statusOf(c).color + "44", fontSize: 8 }}>
                        {statusOf(c).label}
                      </span>
                      <div className="mono" style={{ fontSize: 10, color: COLOR_DARK }}>
                        {fmt(c.value)}
                      </div>
                    </div>
                  ))}
                  {!clients.length && (
                    <div style={{ textAlign: "center", padding: "40px 0", opacity: 0.6, color: COLOR_TEXT_MUTED }}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>◈</div>
                      <div className="mono" style={{ fontSize: 9 }}>
                        Nessun cliente ancora
                      </div>
                    </div>
                  )}
                </div>
              </Reveal>
            </div>
          )}

          {/* ════ CLIENTI ════ */}
          {view === "clienti" && (
            <div className="anim-in">
              {/* Search/filter bar */}
              <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
                <input
                  className="inp"
                  placeholder="Cerca nome, azienda, email, tag..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ flex: 1, minWidth: 200 }}
                />
                <select
                  className="inp"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as Status | "all")}
                  style={{ maxWidth: 170 }}
                >
                  <option value="all">Tutti gli stati</option>
                  {STATUSES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <div className="mono" style={{ fontSize: 8, opacity: 0.7, display: "flex", alignItems: "center", whiteSpace: "nowrap", color: COLOR_TEXT_MUTED }}>
                  {filtered.length} risultati
                </div>
              </div>

              {/* Table */}
              <div style={{ background: COLOR_WHITE, border: `1px solid ${COLOR_BORDER}`, borderRadius: 2 }}>
                {/* Header */}
                <div
                  className="desk-only"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "36px 1fr 130px 100px 110px 80px",
                    gap: 14,
                    padding: "10px 20px",
                    borderBottom: `1px solid ${COLOR_BORDER}`,
                    background: "rgba(15,36,64,.02)",
                  }}
                >
                  {["", "Cliente", "Stato", "Settore", "Valore", ""].map((h, i) => (
                    <div key={i} className="mono" style={{ fontSize: 7, opacity: 0.7, color: COLOR_TEXT_MUTED }}>
                      {h}
                    </div>
                  ))}
                </div>

                {filtered.map((c) => (
                  <div
                    key={c.id}
                    className="crow"
                    style={{ gridTemplateColumns: "36px 1fr 130px 100px 110px 80px", gap: 14 }}
                    onClick={() => setSelectedClient(c)}
                  >
                    <div className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>
                      {initials(c.name)}
                    </div>
                    <div>
                      <div style={{ fontSize: 17, color: COLOR_DARK }}>{c.name}</div>
                      <div className="mono" style={{ fontSize: 8, opacity: 0.75, color: COLOR_TEXT_MUTED }}>
                        {c.company} {c.email ? `· ${c.email}` : ""}
                      </div>
                      {c.tags.length > 0 && (
                        <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                          {c.tags.map((t) => (
                            <span key={t} className="tag" style={{ fontSize: 9, padding: "1px 6px" }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="desk-only">
                      <span className="spill" style={{ color: statusOf(c).color, borderColor: statusOf(c).color + "44" }}>
                        {statusOf(c).label}
                      </span>
                    </div>
                    <div className="mono desk-only" style={{ fontSize: 9, opacity: 0.7, color: COLOR_TEXT_MUTED }}>
                      {c.sector}
                    </div>
                    <div className="mono" style={{ fontSize: 11, color: COLOR_DARK }}>
                      {fmt(c.value)}
                    </div>
                    <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
                      <button className="btn btn-o btn-sm" onClick={() => openEdit(c)} title="Modifica">
                        ✎
                      </button>
                      <button className="btn btn-r btn-sm" onClick={() => confirmDelete(c.id)} title="Elimina">
                        ✕
                      </button>
                    </div>
                  </div>
                ))}

                {!filtered.length && (
                  <div style={{ textAlign: "center", padding: "60px 0", opacity: 0.7, color: COLOR_TEXT_MUTED }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>◉</div>
                    <div className="mono" style={{ fontSize: 9 }}>
                      Nessun risultato
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NOTE: le altre view (kanban/calendario/report), il form/modal e il detail panel
             restano identici come struttura/logica nel tuo file originale.
             Se vuoi, incollami la parte finale (che nel contesto qui è troncata) e te la
             restituisco completa già tematizzata in blu/bianco senza perdere nulla. */}
        </main>
      </div>
    </div>
  );
}