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
  { key: "lead",         label: "Lead",         color: "#6b7280" },
  { key: "contatto",     label: "Contatto",     color: "#3b82f6" },
  { key: "proposta",     label: "Proposta",     color: "#f59e0b" },
  { key: "negoziazione", label: "Negoziazione", color: "#8b5cf6" },
  { key: "cliente",      label: "Cliente",      color: "#10b981" },
  { key: "perso",        label: "Perso",        color: "#ef4444" },
];

const SECTORS = ["Tech","Finance","Retail","Healthcare","Real Estate","Education","Marketing","Legal","Manufacturing","Other"];
const NOTE_ICONS: Record<NoteType, string> = { nota: "✎", chiamata: "☎", email: "✉", meeting: "◈" };
const NOTE_TYPES: NoteType[] = ["nota", "chiamata", "email", "meeting"];
const STORAGE_KEY = "artemisia_crm_v2";

function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function fmt(n: number) { return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n); }
function initials(name: string) { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) || "?"; }
function load(): Client[] { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; } }
function save(c: Client[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); }

const EMPTY: Omit<Client, "id" | "createdAt" | "updatedAt" | "notes"> = {
  name: "", company: "", email: "", phone: "",
  sector: "Tech", value: 0, probability: 50, status: "lead", tags: [],
};

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
      if (start >= to) { setVal(to); clearInterval(t); }
      else setVal(Math.floor(start));
    }, 20);
    return () => clearInterval(t);
  }, [to]);
  return <>{prefix}{val.toLocaleString("it-IT")}{suffix}</>;
}

// ─────────────────────────────────────────────
// REVEAL HOOK
// ─────────────────────────────────────────────
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    if (ref.current) o.observe(ref.current);
    return () => o.disconnect();
  }, []);
  return { ref, vis };
}

function Reveal({ children, delay = 0, from = "bottom" }: { children: React.ReactNode; delay?: number; from?: "bottom" | "left" | "right" | "top" }) {
  const { ref, vis } = useReveal();
  const t = { bottom: "translateY(32px)", top: "translateY(-32px)", left: "translateX(-32px)", right: "translateX(32px)" };
  return (
    <div ref={ref} style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "none" : t[from],
      transition: `opacity .7s cubic-bezier(.22,1,.36,1) ${delay}ms, transform .7s cubic-bezier(.22,1,.36,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
export default function CRM() {
  const [clients, setClients]           = useState<Client[]>(load);
  const [view, setView]                 = useState<View>("dashboard");
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "all">("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showForm, setShowForm]         = useState(false);
  const [formData, setFormData]         = useState({ ...EMPTY });
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [newTag, setNewTag]             = useState("");
  const [noteText, setNoteText]         = useState("");
  const [noteType, setNoteType]         = useState<NoteType>("nota");
  const [navOpen, setNavOpen]           = useState(false);
  const [dragId, setDragId]             = useState<string | null>(null);
  const [dragOver, setDragOver]         = useState<Status | null>(null);
  const [calDate, setCalDate]           = useState(new Date());
  const [toast, setToast]               = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => { save(clients); }, [clients]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  // ── CRUD ──
  function saveClient() {
    if (!formData.name.trim()) return;
    const now = new Date().toISOString();
    if (editingId) {
      setClients(cs => cs.map(c => c.id === editingId ? { ...c, ...formData, updatedAt: now } : c));
      if (selectedClient?.id === editingId) setSelectedClient(c => c ? { ...c, ...formData } : c);
      showToast("Cliente aggiornato");
    } else {
      const nc: Client = { ...formData, id: uid(), notes: [], createdAt: now, updatedAt: now };
      setClients(cs => [nc, ...cs]);
      showToast("Cliente creato");
    }
    resetForm();
  }

  function confirmDelete(id: string) { setDeleteConfirm(id); }

  function deleteClient(id: string) {
    setClients(cs => cs.filter(c => c.id !== id));
    if (selectedClient?.id === id) setSelectedClient(null);
    setDeleteConfirm(null);
    showToast("Cliente eliminato");
  }

  function updateStatus(id: string, status: Status) {
    const now = new Date().toISOString();
    setClients(cs => cs.map(c => c.id === id ? { ...c, status, updatedAt: now } : c));
    if (selectedClient?.id === id) setSelectedClient(c => c ? { ...c, status } : c);
    showToast(`Stato aggiornato: ${STATUSES.find(s => s.key === status)?.label}`);
  }

  function addNote() {
    if (!noteText.trim() || !selectedClient) return;
    const note: Note = { id: uid(), text: noteText.trim(), date: new Date().toISOString(), type: noteType };
    const now = new Date().toISOString();
    setClients(cs => cs.map(c => c.id === selectedClient.id ? { ...c, notes: [note, ...c.notes], updatedAt: now } : c));
    setSelectedClient(c => c ? { ...c, notes: [note, ...c.notes] } : c);
    setNoteText("");
    showToast("Nota aggiunta");
  }

  function deleteNote(clientId: string, noteId: string) {
    setClients(cs => cs.map(c => c.id === clientId ? { ...c, notes: c.notes.filter(n => n.id !== noteId) } : c));
    setSelectedClient(c => c ? { ...c, notes: c.notes.filter(n => n.id !== noteId) } : c);
    showToast("Nota eliminata");
  }

  function resetForm() { setFormData({ ...EMPTY }); setEditingId(null); setShowForm(false); setNewTag(""); }

  function openEdit(c: Client) {
    setFormData({ name: c.name, company: c.company, email: c.email, phone: c.phone, sector: c.sector, value: c.value, probability: c.probability, status: c.status, tags: [...c.tags] });
    setEditingId(c.id);
    setShowForm(true);
  }

  // ── FILTERS ──
  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    const mq = !q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.tags.some(t => t.toLowerCase().includes(q));
    const ms = filterStatus === "all" || c.status === filterStatus;
    return mq && ms;
  });

  // ── STATS ──
  const totalValue    = clients.reduce((s, c) => s + c.value, 0);
  const activeClients = clients.filter(c => c.status === "cliente").length;
  const openDeals     = clients.filter(c => !["cliente","perso"].includes(c.status)).length;
  const convRate      = clients.length ? Math.round((activeClients / clients.length) * 100) : 0;
  const pipelineValue = clients.filter(c => !["cliente","perso"].includes(c.status)).reduce((s, c) => s + c.value * (c.probability / 100), 0);

  // ── DRAG & DROP ──
  function onDrop(status: Status) {
    if (dragId) { updateStatus(dragId, status); setDragId(null); setDragOver(null); }
  }

  const statusOf = (c: Client) => STATUSES.find(s => s.key === c.status)!;

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Instrument+Mono:wght@300;400&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        ::selection{background:#fff;color:#0a0a0a;}
        .mono{font-family:'Instrument Mono',monospace;letter-spacing:.1em;text-transform:uppercase;}
        input,select,textarea{font-family:'Cormorant Garamond',serif;outline:none;color:#fff;}
        input::placeholder,textarea::placeholder{opacity:.35;color:#fff;}
        select option{background:#1a1a1a;color:#fff;}

        /* SCROLLBAR */
        ::-webkit-scrollbar{width:3px;height:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#333;border-radius:2px;}

        /* NAV LINK */
        .nav-btn{
          display:flex;align-items:center;gap:12px;
          padding:13px 20px;width:100%;
          font-family:'Instrument Mono',monospace;font-size:9px;
          letter-spacing:.14em;text-transform:uppercase;
          color:rgba(255,255,255,.45);background:none;border:none;cursor:pointer;
          transition:color .2s,background .2s;border-radius:2px;text-align:left;
        }
        .nav-btn:hover{color:#fff;background:rgba(255,255,255,.06);}
        .nav-btn.active{color:#fff;background:rgba(255,255,255,.1);}

        /* CARD */
        .card{
          background:#141414;border:1px solid #222;padding:24px;
          transition:border-color .3s,box-shadow .3s;
        }
        .card:hover{border-color:#333;}

        /* INPUTS */
        .inp{
          width:100%;padding:12px 16px;
          background:#1a1a1a;border:1px solid #2a2a2a;
          font-size:16px;color:#fff;
          transition:border-color .2s;border-radius:2px;
        }
        .inp:focus{border-color:#555;}

        /* BUTTONS */
        .btn{
          display:inline-flex;align-items:center;justify-content:center;gap:8px;
          font-family:'Instrument Mono',monospace;font-size:9px;
          letter-spacing:.14em;text-transform:uppercase;
          cursor:pointer;transition:all .25s;border-radius:2px;
          padding:12px 24px;border:1.5px solid;
        }
        .btn-w{background:#fff;color:#0a0a0a;border-color:#fff;}
        .btn-w:hover{background:transparent;color:#fff;}
        .btn-o{background:transparent;color:#fff;border-color:#333;}
        .btn-o:hover{border-color:#fff;}
        .btn-r{background:transparent;color:#ef4444;border-color:#ef4444;}
        .btn-r:hover{background:#ef4444;color:#fff;}
        .btn-sm{padding:7px 14px;font-size:8px;}

        /* CLIENT ROW */
        .crow{
          display:grid;align-items:center;
          padding:14px 20px;border-bottom:1px solid #1a1a1a;
          cursor:pointer;transition:background .15s;
        }
        .crow:hover{background:rgba(255,255,255,.03);}

        /* TAG */
        .tag{
          display:inline-block;padding:3px 10px;
          border:1px solid #333;font-size:10px;border-radius:2px;
          font-family:'Instrument Mono',monospace;letter-spacing:.06em;
          color:rgba(255,255,255,.6);
        }

        /* KANBAN */
        .kcol{min-height:120px;padding:8px;border:2px dashed transparent;transition:border-color .2s,background .2s;}
        .kcol.dover{border-color:#fff;background:rgba(255,255,255,.03);}
        .kcard{
          background:#1a1a1a;border:1px solid #2a2a2a;
          padding:14px;margin-bottom:6px;cursor:grab;
          transition:box-shadow .2s,transform .2s,border-color .2s;
        }
        .kcard:hover{box-shadow:0 8px 24px rgba(0,0,0,.4);transform:translateY(-2px);border-color:#333;}
        .kcard.dragging{opacity:.4;}

        /* STATUS PILL */
        .spill{
          display:inline-flex;align-items:center;gap:6px;
          padding:4px 10px;border-radius:2px;border:1px solid;
          font-family:'Instrument Mono',monospace;font-size:8px;letter-spacing:.1em;text-transform:uppercase;
        }

        /* PROGRESS */
        .pbar{height:3px;background:#222;border-radius:2px;overflow:hidden;}
        .pfill{height:100%;border-radius:2px;transition:width .6s ease;}

        /* DETAIL PANEL */
        .dpanel{
          position:fixed;right:0;top:0;bottom:0;width:400px;
          background:#111;border-left:1px solid #222;
          z-index:400;overflow-y:auto;
          transform:translateX(100%);transition:transform .4s cubic-bezier(.22,1,.36,1);
        }
        .dpanel.open{transform:translateX(0);}

        /* MODAL */
        .moverlay{position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px;}
        .modal{background:#111;border:1px solid #222;width:100%;max-width:580px;max-height:92vh;overflow-y:auto;}

        /* TOAST */
        .toast{
          position:fixed;bottom:32px;left:50%;transform:translateX(-50%);
          background:#fff;color:#0a0a0a;
          font-family:'Instrument Mono',monospace;font-size:10px;letter-spacing:.12em;
          padding:12px 28px;border-radius:2px;z-index:9999;
          animation:toastIn .3s ease;
        }
        @keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}

        /* AVATAR */
        .avatar{
          display:flex;align-items:center;justify-content:center;
          background:#fff;color:#0a0a0a;font-weight:600;
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
        input[type=range]{accent-color:#fff;width:100%;}

        /* SIDEBAR FOOTER */
        .sb-footer{padding:20px;border-top:1px solid #1a1a1a;margin-top:auto;}
      `}</style>

      {/* ── TOAST ── */}
      {toast && <div className="toast">{toast}</div>}

      {/* ── DELETE CONFIRM ── */}
      {deleteConfirm && (
        <div className="moverlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 380, padding: 32 }} onClick={e => e.stopPropagation()}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 24, fontWeight: 300, marginBottom: 12 }}>Elimina Cliente</div>
            <div className="mono" style={{ fontSize: 9, opacity: .5, marginBottom: 28, lineHeight: 1.6 }}>
              Questa azione è irreversibile.<br />Tutti i dati e le note verranno eliminati.
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button className="btn btn-r" style={{ flex: 1 }} onClick={() => deleteClient(deleteConfirm)}>Elimina</button>
              <button className="btn btn-o" style={{ flex: 1 }} onClick={() => setDeleteConfirm(null)}>Annulla</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar${navOpen ? " open" : ""}`} style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: 220,
        background: "#0d0d0d", borderRight: "1px solid #1a1a1a",
        display: "flex", flexDirection: "column", zIndex: 200,
      }}>
        {/* Logo */}
        <div style={{ padding: "28px 20px 20px", borderBottom: "1px solid #1a1a1a" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 18, fontWeight: 600, letterSpacing: ".2em", color: "#fff" }}>
              ARTEMISIA
            </div>
            <div className="mono" style={{ fontSize: 7, color: "rgba(255,255,255,.25)", marginTop: 4 }}>CRM · v2</div>
          </a>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 8px" }}>
          {([
            ["dashboard",  "▣", "Dashboard"],
            ["clienti",    "◉", "Clienti"],
            ["kanban",     "◐", "Pipeline"],
            ["calendario", "◎", "Calendario"],
            ["report",     "◈", "Report"],
          ] as [View, string, string][]).map(([v, icon, label]) => (
            <button
              key={v}
              className={`nav-btn${view === v ? " active" : ""}`}
              onClick={() => { setView(v); setNavOpen(false); }}
            >
              <span style={{ fontSize: 14 }}>{icon}</span>
              <span>{label}</span>
              {view === v && <span style={{ marginLeft: "auto", width: 4, height: 4, borderRadius: "50%", background: "#fff" }} />}
            </button>
          ))}
        </nav>

        {/* Sidebar footer */}
        <div className="sb-footer">
          <div className="mono" style={{ fontSize: 7, opacity: .3, marginBottom: 6 }}>Pipeline pesata</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 20, fontWeight: 300 }}>{fmt(pipelineValue)}</div>
          <div className="mono" style={{ fontSize: 7, opacity: .25, marginTop: 4 }}>{openDeals} deal aperti</div>
        </div>
      </aside>

      {/* ── MAIN WRAP ── */}
      <div className="main-wrap" style={{ marginLeft: 220, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* TOP BAR */}
        <header style={{
          padding: "18px 28px",
          background: "#0a0a0a", borderBottom: "1px solid #1a1a1a",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 50,
          backdropFilter: "blur(12px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* hamburger */}
            <button className="mob-only btn btn-o btn-sm" onClick={() => setNavOpen(!navOpen)} style={{ padding: "8px 12px" }}>
              ☰
            </button>
            <h1 className="top-bar-title" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 300, textTransform: "capitalize" }}>
              {view}
            </h1>
            <span className="mono desk-only" style={{ fontSize: 8, opacity: .25 }}>
              {clients.length} clienti · {fmt(totalValue)}
            </span>
          </div>
          <button className="btn btn-w" onClick={() => { resetForm(); setShowForm(true); }}>
            + Nuovo Cliente
          </button>
        </header>

        {/* ── CONTENT ── */}
        <main style={{ flex: 1, padding: "28px", overflowX: "hidden" }}>

          {/* ════ DASHBOARD ════ */}
          {view === "dashboard" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* KPI row */}
              <div className="stats-g" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                {[
                  { label: "Clienti Totali",   val: clients.length,   suffix: "",  sub: "nel CRM" },
                  { label: "Clienti Attivi",   val: activeClients,    suffix: "",  sub: "acquisiti" },
                  { label: "Deal Aperti",       val: openDeals,        suffix: "",  sub: "in pipeline" },
                  { label: "Conversione",       val: convRate,         suffix: "%", sub: "lead → cliente" },
                ].map((s, i) => (
                  <Reveal key={s.label} delay={i * 60}>
                    <div className="card" style={{ borderLeft: "2px solid #fff" }}>
                      <div className="mono" style={{ fontSize: 8, opacity: .35, marginBottom: 14 }}>{s.label}</div>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 44, fontWeight: 300, lineHeight: 1 }}>
                        <Counter to={s.val} suffix={s.suffix} />
                      </div>
                      <div className="mono" style={{ fontSize: 7, opacity: .25, marginTop: 8 }}>{s.sub}</div>
                    </div>
                  </Reveal>
                ))}
              </div>

              {/* Revenue cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Reveal from="left">
                  <div className="card">
                    <div className="mono" style={{ fontSize: 8, opacity: .35, marginBottom: 12 }}>Valore Totale Portfolio</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 42, fontWeight: 300 }}>{fmt(totalValue)}</div>
                    <div className="mono" style={{ fontSize: 7, opacity: .25, marginTop: 8 }}>somma di tutti i clienti</div>
                  </div>
                </Reveal>
                <Reveal from="right">
                  <div className="card">
                    <div className="mono" style={{ fontSize: 8, opacity: .35, marginBottom: 12 }}>Pipeline Pesata</div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 42, fontWeight: 300 }}>{fmt(pipelineValue)}</div>
                    <div className="mono" style={{ fontSize: 7, opacity: .25, marginTop: 8 }}>valore × probabilità</div>
                  </div>
                </Reveal>
              </div>

              {/* Status distribution */}
              <Reveal>
                <div className="card">
                  <div className="mono" style={{ fontSize: 8, opacity: .35, marginBottom: 20 }}>Distribuzione Clienti per Stato</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {STATUSES.map(s => {
                      const count = clients.filter(c => c.status === s.key).length;
                      const pct = clients.length ? (count / clients.length) * 100 : 0;
                      return (
                        <div key={s.key}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                              <span className="mono" style={{ fontSize: 8 }}>{s.label}</span>
                            </span>
                            <span className="mono" style={{ fontSize: 8, opacity: .4 }}>{count} · {Math.round(pct)}%</span>
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
                    <div className="mono" style={{ fontSize: 8, opacity: .35 }}>Ultimi Aggiunti</div>
                    <button className="btn btn-o btn-sm" onClick={() => setView("clienti")}>Vedi tutti</button>
                  </div>
                  {clients.slice(0, 5).map(c => (
                    <div
                      key={c.id}
                      className="crow"
                      style={{ gridTemplateColumns: "36px 1fr auto auto", gap: 14 }}
                      onClick={() => { setSelectedClient(c); }}
                    >
                      <div className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>{initials(c.name)}</div>
                      <div>
                        <div style={{ fontSize: 16 }}>{c.name}</div>
                        <div className="mono" style={{ fontSize: 8, opacity: .35 }}>{c.company}</div>
                      </div>
                      <span className="spill" style={{ color: statusOf(c).color, borderColor: statusOf(c).color + "44", fontSize: 8 }}>
                        {statusOf(c).label}
                      </span>
                      <div className="mono" style={{ fontSize: 10 }}>{fmt(c.value)}</div>
                    </div>
                  ))}
                  {!clients.length && (
                    <div style={{ textAlign: "center", padding: "40px 0", opacity: .2 }}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>◈</div>
                      <div className="mono" style={{ fontSize: 9 }}>Nessun cliente ancora</div>
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
                  onChange={e => setSearch(e.target.value)}
                  style={{ flex: 1, minWidth: 200 }}
                />
                <select
                  className="inp"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as Status | "all")}
                  style={{ maxWidth: 170 }}
                >
                  <option value="all">Tutti gli stati</option>
                  {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
                <div className="mono" style={{ fontSize: 8, opacity: .3, display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
                  {filtered.length} risultati
                </div>
              </div>

              {/* Table */}
              <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 2 }}>
                {/* Header */}
                <div className="desk-only" style={{ display: "grid", gridTemplateColumns: "36px 1fr 130px 100px 110px 80px", gap: 14, padding: "10px 20px", borderBottom: "1px solid #1a1a1a" }}>
                  {["","Cliente","Stato","Settore","Valore",""].map((h, i) => (
                    <div key={i} className="mono" style={{ fontSize: 7, opacity: .3 }}>{h}</div>
                  ))}
                </div>

                {filtered.map(c => (
                  <div
                    key={c.id}
                    className="crow"
                    style={{ gridTemplateColumns: "36px 1fr 130px 100px 110px 80px", gap: 14 }}
                    onClick={() => setSelectedClient(c)}
                  >
                    <div className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>{initials(c.name)}</div>
                    <div>
                      <div style={{ fontSize: 17 }}>{c.name}</div>
                      <div className="mono" style={{ fontSize: 8, opacity: .35 }}>{c.company} {c.email ? `· ${c.email}` : ""}</div>
                      {c.tags.length > 0 && (
                        <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                          {c.tags.map(t => <span key={t} className="tag" style={{ fontSize: 9, padding: "1px 6px" }}>{t}</span>)}
                        </div>
                      )}
                    </div>
                    <div className="desk-only">
                      <span className="spill" style={{ color: statusOf(c).color, borderColor: statusOf(c).color + "44" }}>
                        {statusOf(c).label}
                      </span>
                    </div>
                    <div className="mono desk-only" style={{ fontSize: 9, opacity: .5 }}>{c.sector}</div>
                    <div className="mono" style={{ fontSize: 11 }}>{fmt(c.value)}</div>
                    <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                      <button className="btn btn-o btn-sm" onClick={() => openEdit(c)} title="Modifica">✎</button>
                      <button className="btn btn-r btn-sm" onClick={() => confirmDelete(c.id)} title="Elimina">✕</button>
                    </div>
                  </div>
                ))}

                {!filtered.length && (
                  <div style={{ textAlign: "center", padding: "60px 0", opacity: .2 }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>◉</div>
                    <div className="mono" style={{ fontSize: 9 }}>Nessun risultato</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ KANBAN ════ */}
          {view === "kanban" && (
            <div className="anim-in">
              <div className="mono" style={{ fontSize: 8, opacity: .3, marginBottom: 20 }}>
                Trascina le card per aggiornare lo stato · {fmt(pipelineValue)} in pipeline pesata
              </div>
              <div className="kg" style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10 }}>
                {STATUSES.map(s => {
                  const col = clients.filter(c => c.status === s.key);
                  return (
                    <div key={s.key}>
                      <div style={{ marginBottom: 10, padding: "0 4px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, flexShrink: 0 }} />
                          <span className="mono" style={{ fontSize: 8, color: s.color }}>{s.label}</span>
                          <span className="mono" style={{ fontSize: 8, opacity: .3, marginLeft: "auto" }}>{col.length}</span>
                        </div>
                        <div className="mono" style={{ fontSize: 7, opacity: .25 }}>
                          {fmt(col.reduce((sum, c) => sum + c.value, 0))}
                        </div>
                      </div>
                      <div
                        className={`kcol${dragOver === s.key ? " dover" : ""}`}
                        onDragOver={e => { e.preventDefault(); setDragOver(s.key); }}
                        onDragLeave={() => setDragOver(null)}
                        onDrop={() => onDrop(s.key)}
                      >
                        {col.map(c => (
                          <div
                            key={c.id}
                            className={`kcard${dragId === c.id ? " dragging" : ""}`}
                            draggable
                            onDragStart={() => setDragId(c.id)}
                            onDragEnd={() => { setDragId(null); setDragOver(null); }}
                            onClick={() => setSelectedClient(c)}
                          >
                            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                              <div className="avatar" style={{ width: 26, height: 26, fontSize: 9 }}>{initials(c.name)}</div>
                              <div>
                                <div style={{ fontSize: 13, fontWeight: 400 }}>{c.name}</div>
                                <div className="mono" style={{ fontSize: 7, opacity: .35 }}>{c.company}</div>
                              </div>
                            </div>
                            <div className="mono" style={{ fontSize: 10, marginBottom: 8 }}>{fmt(c.value)}</div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div className="pbar" style={{ flex: 1 }}>
                                <div className="pfill" style={{ width: `${c.probability}%`, background: s.color }} />
                              </div>
                              <span className="mono" style={{ fontSize: 7, opacity: .4 }}>{c.probability}%</span>
                            </div>
                          </div>
                        ))}
                        {!col.length && (
                          <div style={{ textAlign: "center", padding: "20px 0", opacity: .15 }}>
                            <div className="mono" style={{ fontSize: 7 }}>vuoto</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ CALENDARIO ════ */}
          {view === "calendario" && (
            <div className="anim-in">
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
                <button className="btn btn-o btn-sm" onClick={() => setCalDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; })}>←</button>
                <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 300, textTransform: "capitalize" }}>
                  {calDate.toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
                </h2>
                <button className="btn btn-o btn-sm" onClick={() => setCalDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; })}>→</button>
                <button className="btn btn-o btn-sm" onClick={() => setCalDate(new Date())}>Oggi</button>
              </div>

              <div style={{ background: "#111", border: "1px solid #1e1e1e", marginBottom: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", borderBottom: "1px solid #1a1a1a" }}>
                  {["L","M","M","G","V","S","D"].map((d, i) => (
                    <div key={i} className="mono" style={{ fontSize: 8, opacity: .3, textAlign: "center", padding: "10px 0" }}>{d}</div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)" }}>
                  {(() => {
                    const y = calDate.getFullYear(), m = calDate.getMonth();
                    const firstDay = new Date(y, m, 1).getDay();
                    const offset = firstDay === 0 ? 6 : firstDay - 1;
                    const dim = new Date(y, m + 1, 0).getDate();
                    const today = new Date();
                    const cells = [];
                    for (let i = 0; i < offset; i++)
                      cells.push(<div key={`e${i}`} style={{ minHeight: 72, borderRight: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a", background: "#0d0d0d" }} />);
                    for (let d = 1; d <= dim; d++) {
                      const isToday = today.getDate() === d && today.getMonth() === m && today.getFullYear() === y;
                      const dayC = clients.filter(c => c.notes.some(n => { const nd = new Date(n.date); return nd.getDate() === d && nd.getMonth() === m && nd.getFullYear() === y; }));
                      cells.push(
                        <div key={d} style={{ minHeight: 72, padding: 6, borderRight: "1px solid #1a1a1a", borderBottom: "1px solid #1a1a1a", background: isToday ? "#1a1a1a" : "transparent" }}>
                          <div className="mono" style={{ fontSize: 9, marginBottom: 4, color: isToday ? "#fff" : "rgba(255,255,255,.4)", fontWeight: isToday ? 600 : 300 }}>{d}</div>
                          {dayC.slice(0, 2).map(c => (
                            <div key={c.id} style={{ fontSize: 10, padding: "2px 4px", background: "rgba(255,255,255,.08)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", borderRadius: 1 }}>
                              {c.name}
                            </div>
                          ))}
                          {dayC.length > 2 && <div className="mono" style={{ fontSize: 7, opacity: .3 }}>+{dayC.length - 2}</div>}
                        </div>
                      );
                    }
                    return cells;
                  })()}
                </div>
              </div>

              {/* Activity feed */}
              <div className="card">
                <div className="mono" style={{ fontSize: 8, opacity: .3, marginBottom: 16 }}>Attività Recenti</div>
                {clients.flatMap(c => c.notes.map(n => ({ ...n, clientName: c.name }))).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10).map(n => (
                  <div key={n.id} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: "1px solid #1a1a1a" }}>
                    <div style={{ width: 32, height: 32, background: "#222", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>
                      {NOTE_ICONS[n.type]}
                    </div>
                    <div>
                      <div style={{ fontSize: 15 }}>{n.text}</div>
                      <div className="mono" style={{ fontSize: 8, opacity: .3, marginTop: 4 }}>
                        {n.clientName} · {new Date(n.date).toLocaleDateString("it-IT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                    </div>
                  </div>
                ))}
                {!clients.some(c => c.notes.length > 0) && (
                  <div className="mono" style={{ fontSize: 9, opacity: .2, textAlign: "center", padding: "24px 0" }}>Nessuna attività</div>
                )}
              </div>
            </div>
          )}

          {/* ════ REPORT ════ */}
          {view === "report" && (
            <div className="anim-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Summary */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
                {[
                  { label: "Valore Medio",   val: fmt(clients.length ? totalValue / clients.length : 0) },
                  { label: "Deal Massimo",   val: fmt(clients.length ? Math.max(...clients.map(c => c.value)) : 0) },
                  { label: "Note Totali",    val: clients.reduce((s, c) => s + c.notes.length, 0).toString() },
                ].map((s, i) => (
                  <Reveal key={s.label} delay={i * 60}>
                    <div className="card">
                      <div className="mono" style={{ fontSize: 7, opacity: .3, marginBottom: 10 }}>{s.label}</div>
                      <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 32, fontWeight: 300 }}>{s.val}</div>
                    </div>
                  </Reveal>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Sector */}
                <Reveal from="left">
                  <div className="card">
                    <div className="mono" style={{ fontSize: 8, opacity: .3, marginBottom: 20 }}>Valore per Settore</div>
                    {SECTORS.filter(sec => clients.some(c => c.sector === sec)).map(sec => {
                      const val = clients.filter(c => c.sector === sec).reduce((s, c) => s + c.value, 0);
                      const pct = totalValue ? (val / totalValue) * 100 : 0;
                      return (
                        <div key={sec} style={{ marginBottom: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                            <span className="mono" style={{ fontSize: 8 }}>{sec}</span>
                            <span className="mono" style={{ fontSize: 8, opacity: .4 }}>{fmt(val)}</span>
                          </div>
                          <div className="pbar"><div className="pfill" style={{ width: `${pct}%`, background: "#fff" }} /></div>
                        </div>
                      );
                    })}
                    {!clients.length && <div className="mono" style={{ fontSize: 8, opacity: .2 }}>Nessun dato</div>}
                  </div>
                </Reveal>

                {/* Funnel */}
                <Reveal from="right">
                  <div className="card">
                    <div className="mono" style={{ fontSize: 8, opacity: .3, marginBottom: 20 }}>Funnel di Conversione</div>
                    {STATUSES.map(s => {
                      const count = clients.filter(c => c.status === s.key).length;
                      const pct = clients.length ? (count / clients.length) * 100 : 0;
                      return (
                        <div key={s.key} style={{ marginBottom: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 5, height: 5, borderRadius: "50%", background: s.color, display: "inline-block" }} />
                              <span className="mono" style={{ fontSize: 8 }}>{s.label}</span>
                            </span>
                            <span className="mono" style={{ fontSize: 8, opacity: .4 }}>{count} ({Math.round(pct)}%)</span>
                          </div>
                          <div className="pbar"><div className="pfill" style={{ width: `${pct}%`, background: s.color }} /></div>
                        </div>
                      );
                    })}
                  </div>
                </Reveal>
              </div>

              {/* Export */}
              <Reveal>
                <div className="card">
                  <div className="mono" style={{ fontSize: 8, opacity: .3, marginBottom: 20 }}>Esporta Dati</div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button className="btn btn-w" onClick={() => {
                      const h = ["Nome","Azienda","Email","Telefono","Settore","Valore","Probabilità","Stato","Tags","Note"];
                      const rows = clients.map(c => [c.name,c.company,c.email,c.phone,c.sector,c.value,c.probability,c.status,c.tags.join(";"),c.notes.map(n=>n.text).join("|")]);
                      const csv = [h,...rows].map(r=>r.map(v=>`"${v}"`).join(",")).join("\n");
                      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download="artemisia.csv"; a.click();
                      showToast("CSV esportato");
                    }}>Esporta CSV</button>
                    <button className="btn btn-o" onClick={() => {
                      const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(clients,null,2)],{type:"application/json"})); a.download="artemisia.json"; a.click();
                      showToast("JSON esportato");
                    }}>Esporta JSON</button>
                    <button className="btn btn-o" onClick={() => {
                      localStorage.removeItem(STORAGE_KEY); setClients([]); showToast("Dati eliminati");
                    }} style={{ color: "#ef4444", borderColor: "#ef4444" }}>Reset Dati</button>
                  </div>
                </div>
              </Reveal>
            </div>
          )}
        </main>
      </div>

      {/* ── DETAIL PANEL ── */}
      <div className={`dpanel${selectedClient ? " open" : ""}`}>
        {selectedClient && (() => {
          const c = selectedClient;
          const st = statusOf(c);
          return (
            <>
              {/* Header */}
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #1a1a1a", position: "sticky", top: 0, background: "#111", zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  <div className="avatar" style={{ width: 44, height: 44, fontSize: 15 }}>{initials(c.name)}</div>
                  <div>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 400 }}>{c.name}</div>
                    <div className="mono" style={{ fontSize: 8, opacity: .35 }}>{c.company}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedClient(null)} style={{ background: "none", border: "none", cursor: "pointer", opacity: .35, fontSize: 18, color: "#fff", padding: 4 }}>✕</button>
              </div>

              <div style={{ padding: 24 }}>
                {/* Info grid */}
                <div style={{ marginBottom: 24 }}>
                  <div className="mono" style={{ fontSize: 7, opacity: .3, marginBottom: 12 }}>Informazioni Cliente</div>
                  {[
                    ["Email",    c.email],
                    ["Telefono", c.phone],
                    ["Settore",  c.sector],
                    ["Valore",   fmt(c.value)],
                    ["Probabilità", `${c.probability}%`],
                    ["Creato", new Date(c.createdAt).toLocaleDateString("it-IT")],
                  ].filter(([,v]) => v).map(([label, val]) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #1a1a1a" }}>
                      <span className="mono" style={{ fontSize: 8, opacity: .35 }}>{label}</span>
                      <span style={{ fontSize: 15 }}>{val}</span>
                    </div>
                  ))}
                </div>

                {/* Status */}
                <div style={{ marginBottom: 24 }}>
                  <div className="mono" style={{ fontSize: 7, opacity: .3, marginBottom: 12 }}>Aggiorna Stato</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {STATUSES.map(s => (
                      <button
                        key={s.key}
                        onClick={() => updateStatus(c.id, s.key)}
                        style={{
                          padding: "6px 12px",
                          border: `1.5px solid ${c.status === s.key ? s.color : "#2a2a2a"}`,
                          background: c.status === s.key ? s.color + "22" : "transparent",
                          color: c.status === s.key ? s.color : "rgba(255,255,255,.45)",
                          fontFamily: "'Instrument Mono',monospace",
                          fontSize: 8, letterSpacing: ".1em", textTransform: "uppercase",
                          cursor: "pointer", transition: "all .2s", borderRadius: 2,
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                {c.tags.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div className="mono" style={{ fontSize: 7, opacity: .3, marginBottom: 10 }}>Tag</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {c.tags.map(t => <span key={t} className="tag">{t}</span>)}
                    </div>
                  </div>
                )}

                {/* Add note */}
                <div style={{ marginBottom: 24 }}>
                  <div className="mono" style={{ fontSize: 7, opacity: .3, marginBottom: 12 }}>Aggiungi Attività</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
                    {NOTE_TYPES.map(t => (
                      <button key={t} onClick={() => setNoteType(t)} style={{
                        padding: "5px 12px",
                        border: `1px solid ${noteType === t ? "#fff" : "#2a2a2a"}`,
                        background: noteType === t ? "#fff" : "transparent",
                        color: noteType === t ? "#0a0a0a" : "rgba(255,255,255,.4)",
                        fontFamily: "'Instrument Mono',monospace", fontSize: 8, cursor: "pointer", transition: "all .2s", borderRadius: 2,
                      }}>
                        {NOTE_ICONS[t]} {t}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="inp"
                    placeholder="Descrivi l'attività..."
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    rows={3}
                    style={{ resize: "vertical", marginBottom: 8, background: "#1a1a1a" }}
                    onKeyDown={e => { if (e.key === "Enter" && e.metaKey) addNote(); }}
                  />
                  <button className="btn btn-w" style={{ width: "100%" }} onClick={addNote}>
                    Aggiungi Nota
                  </button>
                </div>

                {/* Timeline */}
                <div>
                  <div className="mono" style={{ fontSize: 7, opacity: .3, marginBottom: 14 }}>Storico ({c.notes.length})</div>
                  {c.notes.map(n => (
                    <div key={n.id} style={{ display: "flex", gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #1a1a1a" }}>
                      <div style={{ width: 30, height: 30, background: "#222", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, borderRadius: 2 }}>
                        {NOTE_ICONS[n.type]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, lineHeight: 1.5 }}>{n.text}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, alignItems: "center" }}>
                          <span className="mono" style={{ fontSize: 7, opacity: .3 }}>
                            {new Date(n.date).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <button onClick={() => deleteNote(c.id, n.id)} style={{ background: "none", border: "none", cursor: "pointer", opacity: .25, color: "#fff", fontSize: 11, padding: "0 2px" }}>✕</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!c.notes.length && (
                    <div className="mono" style={{ fontSize: 8, opacity: .2, textAlign: "center", padding: "20px 0" }}>Nessuna attività registrata</div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 10, marginTop: 24, paddingTop: 20, borderTop: "1px solid #1a1a1a" }}>
                  <button className="btn btn-o" style={{ flex: 1 }} onClick={() => { openEdit(c); setSelectedClient(null); }}>✎ Modifica</button>
                  <button className="btn btn-r" style={{ flex: 1 }} onClick={() => confirmDelete(c.id)}>✕ Elimina</button>
                </div>
              </div>
            </>
          );
        })()}
      </div>

      {/* Overlay for panel */}
      {selectedClient && (
        <div onClick={() => setSelectedClient(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 399 }} />
      )}

      {/* ── FORM MODAL ── */}
      {showForm && (
        <div className="moverlay" onClick={e => e.target === e.currentTarget && resetForm()}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div style={{ padding: "24px 28px", borderBottom: "1px solid #1e1e1e", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "#111", zIndex: 10 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 26, fontWeight: 300 }}>
                {editingId ? "Modifica Cliente" : "Nuovo Cliente"}
              </h2>
              <button onClick={resetForm} style={{ background: "none", border: "none", cursor: "pointer", opacity: .35, fontSize: 18, color: "#fff" }}>✕</button>
            </div>

            <div style={{ padding: "24px 28px" }}>
              {/* Fields */}
              <div className="form-g" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                {([
                  ["Nome *", "name", "text"],
                  ["Azienda", "company", "text"],
                  ["Email", "email", "email"],
                  ["Telefono", "phone", "tel"],
                ] as [string, keyof typeof formData, string][]).map(([label, key, type]) => (
                  <div key={key}>
                    <div className="mono" style={{ fontSize: 7, opacity: .35, marginBottom: 6 }}>{label}</div>
                    <input
                      className="inp"
                      type={type}
                      value={formData[key] as string}
                      onChange={e => setFormData(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={label.replace(" *", "")}
                    />
                  </div>
                ))}
              </div>

              <div className="form-g" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <div className="mono" style={{ fontSize: 7, opacity: .35, marginBottom: 6 }}>Settore</div>
                  <select className="inp" value={formData.sector} onChange={e => setFormData(f => ({ ...f, sector: e.target.value }))}>
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 7, opacity: .35, marginBottom: 6 }}>Stato</div>
                  <select className="inp" value={formData.status} onChange={e => setFormData(f => ({ ...f, status: e.target.value as Status }))}>
                    {STATUSES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-g" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                <div>
                  <div className="mono" style={{ fontSize: 7, opacity: .35, marginBottom: 6 }}>Valore (€)</div>
                  <input
                    className="inp"
                    type="number"
                    value={formData.value}
                    onChange={e => setFormData(f => ({ ...f, value: Number(e.target.value) }))}
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 7, opacity: .35, marginBottom: 6 }}>Probabilità: {formData.probability}%</div>
                  <div style={{ paddingTop: 12 }}>
                    <input
                      type="range" min={0} max={100}
                      value={formData.probability}
                      onChange={e => setFormData(f => ({ ...f, probability: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div style={{ marginBottom: 24 }}>
                <div className="mono" style={{ fontSize: 7, opacity: .35, marginBottom: 8 }}>Tag</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                  {formData.tags.map(t => (
                    <span key={t} className="tag" style={{ cursor: "pointer" }} onClick={() => setFormData(f => ({ ...f, tags: f.tags.filter(x => x !== t) }))}>
                      {t} ✕
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="inp"
                    placeholder="Scrivi tag + invio"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && newTag.trim()) {
                        setFormData(f => ({ ...f, tags: [...new Set([...f.tags, newTag.trim()])] }));
                        setNewTag("");
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                  <button className="btn btn-o" onClick={() => {
                    if (newTag.trim()) { setFormData(f => ({ ...f, tags: [...new Set([...f.tags, newTag.trim()])] })); setNewTag(""); }
                  }}>+</button>
                </div>
              </div>

              {/* Submit */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  className="btn btn-w"
                  style={{ flex: 1, opacity: !formData.name.trim() ? .4 : 1 }}
                  onClick={saveClient}
                  disabled={!formData.name.trim()}
                >
                  {editingId ? "Salva Modifiche" : "Crea Cliente"}
                </button>
                <button className="btn btn-o" onClick={resetForm}>Annulla</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile nav overlay */}
      {navOpen && <div onClick={() => setNavOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 299 }} />}
    </div>
  );
}
