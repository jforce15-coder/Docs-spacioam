/* ============================================================
   SPACIO AM — Block-based paginated document engine
   ------------------------------------------------------------
   Renders a contract as real Letter-sized sheets, each with the
   SAME membrete background image, and a text column inset at
   left 32% / right 9% / top 9% / bottom 8%.

   Pagination works on a list of structured BLOCKS (never by
   slicing a text string), packing them into pages by measured
   height with an anti-orphan rule.

   Per-clause editing: any editable unit (intro · cuerpo · each
   clause) can be overridden through the `edits` map. Edits are
   applied BEFORE flattening so pagination re-measures the new
   text. A hover pencil on each unit opens an inline editor.
   ============================================================ */

/* Sheet geometry (px, Letter 8.5×11 at 96dpi → 816×1056) */
const SHEET_W = 816;
const SHEET_H = 1056;
const COL_LEFT = 261;   // 32% of 816
const COL_WIDTH = 481;  // → right edge at 742px, i.e. 9% right inset
const COL_TOP = 95;     // 9% of 1056
const CONTENT_H = 876;  // 1056 − 95 (top) − 85 (bottom 8%)
const MEMBRETE = "assets/letterhead-cover.jpeg";

/* ─── Rich inline text: **bold** and ⟦placeholder⟧ ─────── */
/* Placeholders are peach until filled; they may appear on their own OR
   nested inside a **bold** run (e.g. "**Q⟦monto⟧ por unidad**"). Both
   cases must render the ⟦…⟧ in peach. */
function parseRich(text) {
  if (text == null) return null;
  const parts = String(text).split(/(\*\*[^*]+\*\*|⟦[^⟧]+⟧)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) {
      const inner = p.slice(2, -2);
      // A bold run may still contain ⟦placeholder⟧ tokens — keep them peach.
      if (inner.includes("⟦")) {
        const sub = inner.split(/(⟦[^⟧]+⟧)/g).map((s, j) =>
          s.startsWith("⟦") && s.endsWith("⟧")
            ? <span key={j} className="blk-ph">{s.slice(1, -1)}</span>
            : <React.Fragment key={j}>{s}</React.Fragment>
        );
        return <strong key={i}>{sub}</strong>;
      }
      return <strong key={i}>{inner}</strong>;
    }
    if (p.startsWith("⟦") && p.endsWith("⟧"))
      return <span key={i} className="blk-ph">{p.slice(1, -1)}</span>;
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}

/* ─── Serialize a clause's blocks into editable raw text ── */
function serializeBlocks(blocks) {
  return (blocks || []).map((b) => {
    if (b.t === "ol") return b.items.map((it, i) => `${i + 1}. ${it}`).join("\n");
    if (b.t === "ul") return b.items.map((it) => `- ${it}`).join("\n");
    return b.text || "";
  }).join("\n\n");
}

/* ─── Parse edited raw text back into structured blocks ─── */
function parseRaw(raw) {
  const chunks = String(raw || "").split(/\n{2,}/).map((c) => c.trim()).filter(Boolean);
  return chunks.map((chunk) => {
    const lines = chunk.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const allUl = lines.length > 0 && lines.every((l) => /^[-–•]\s+/.test(l));
    const allOl = lines.length > 0 && lines.every((l) => /^\d+[.)]\s+/.test(l));
    if (allUl) return { t: "ul", items: lines.map((l) => l.replace(/^[-–•]\s+/, "")) };
    if (allOl) return { t: "ol", items: lines.map((l) => l.replace(/^\d+[.)]\s+/, "")) };
    return { t: "p", text: lines.join(" ") };
  });
}

/* ─── Apply the edits map onto a contract (immutable copy) ─ */
function applyEdits(contract, edits) {
  if (!edits || !Object.keys(edits).length) return contract;
  const c = { ...contract };
  if (edits.intro != null) c.intro = edits.intro;
  if (edits.cuerpo != null && contract.body) c.body = parseRaw(edits.cuerpo);
  if (contract.clauses) {
    c.clauses = contract.clauses.map((cl) =>
      edits[cl.ord] != null ? { ...cl, blocks: parseRaw(edits[cl.ord]) } : cl
    );
  }
  return c;
}

/* ─── Flatten a contract structure into a flat block list ── */
function flattenContract(contract) {
  const blocks = [];
  if (contract.intro)
    blocks.push({ k: "intro", text: contract.intro, editKey: "intro", editTitle: "Introducción", showEdit: true });

  // Letter-style free body (no clause heading)
  if (contract.body && contract.body.length) {
    let firstBody = true;
    contract.body.forEach((bl) => {
      const meta = firstBody ? { editKey: "cuerpo", editTitle: "Cuerpo de la carta", showEdit: true } : {};
      if (bl.t === "p") blocks.push({ k: "p", text: bl.text, ...meta });
      else if (bl.t === "ol")
        bl.items.forEach((it, i) =>
          blocks.push({ k: "li", mk: (i + 1) + ".", text: it, ...(i === 0 ? meta : {}) }));
      else if (bl.t === "ul")
        bl.items.forEach((it, i) => blocks.push({ k: "li", mk: "—", text: it, ...(i === 0 ? meta : {}) }));
      firstBody = false;
    });
  }

  (contract.clauses || []).forEach((c) => {
    blocks.push({ k: "head", ord: c.ord, label: c.label, editKey: c.ord, editTitle: `${c.ord}. ${c.label || ""}`.trim(), showEdit: true });
    (c.blocks || []).forEach((bl) => {
      if (bl.t === "p") blocks.push({ k: "p", text: bl.text });
      else if (bl.t === "ol")
        (bl.items || []).forEach((it, i) =>
          blocks.push({ k: "li", mk: String.fromCharCode(97 + i) + ")", text: it }));
      else if (bl.t === "ul")
        (bl.items || []).forEach((it) => blocks.push({ k: "li", mk: "—", text: it }));
    });
  });
  if (contract.signatures) blocks.push({ k: "sig", sig: contract.signatures });
  return blocks;
}

/* ─── Firmas reales estampadas sobre la línea ───────────────
   El contrato define sus "parties"; cuando el documento ya fue
   enviado a firma, este contexto trae las firmas capturadas y
   las coloca encima de la línea correspondiente. Puede haber 1
   o 2 firmantes por la otra parte (co-hosting con dos dueños).
   ─────────────────────────────────────────────────────────── */
const FirmasCtx = React.createContext(null);

function normNombre(s) {
  return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z ]/g, "").trim().toUpperCase();
}

function buildSigRows(parties, firmas) {
  const base = parties.map((p) => ({ name: p.name, role: p.role, img: null }));
  if (!firmas) return base;
  const signers = (firmas.signers || []).slice();
  const spacio = firmas.spacio || null;
  const usados = {};
  base.forEach((row) => {
    const n = normNombre(row.name);
    signers.forEach((sg, i) => {
      if (usados[i] || !n) return;
      if (normNombre(sg.nombre) === n) { row.img = sg.img || null; row.name = sg.nombre; usados[i] = true; }
    });
  });
  /* la última línea siempre es Spacio AM */
  if (spacio && base.length) {
    const last = base[base.length - 1];
    if (!last.img) last.img = spacio.img || null;
  }
  /* firmantes adicionales (2.º dueño) → línea propia junto a la primera */
  const extra = signers.filter((sg, i) => !usados[i]);
  if (extra.length) {
    const rol = base.length ? base[0].role : "";
    const ins = extra.map((sg) => ({ name: sg.nombre, role: rol, img: sg.img || null }));
    if (!base.length) return ins;
    if (!base[0].img && ins.length) {
      base[0] = Object.assign({}, base[0], ins.shift());
      base[0].role = rol;
    }
    base.splice(1, 0, ...ins);
  }
  return base;
}

/* ─── Render a single block ────────────────────────────── */
function Block({ b, editable, onEdit }) {
  if (!b) return null;
  const pencil = editable && b.showEdit ? (
    <button
      type="button"
      className="blk-edit"
      title={`Editar: ${b.editTitle}`}
      onClick={(e) => { e.preventDefault(); onEdit(b.editKey, b.editTitle); }}
      aria-label={`Editar: ${b.editTitle}`}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
      </svg>
    </button>
  ) : null;

  if (b.k === "intro")
    return <p className="blk-intro">{pencil}{parseRich(b.text)}</p>;
  if (b.k === "p")
    return <p className="blk-p">{pencil}{parseRich(b.text)}</p>;
  if (b.k === "head")
    return (
      <p className="blk-head">
        {pencil}
        <span className="ord">{b.ord}.</span>{" "}
        <span className="lbl">{b.label}</span>
      </p>
    );
  if (b.k === "li")
    return (
      <div className="blk-li">
        {pencil}
        <span className="mk">{b.mk}</span>
        <span className="tx">{parseRich(b.text)}</span>
      </div>
    );
  if (b.k === "sig") {
    const s = b.sig;
    const firmas = React.useContext(FirmasCtx);
    const rows = buildSigRows(s.parties || [], firmas);
    return (
      <div className="blk-sig">
        <div className="s-date">{s.date}</div>
        <div className="s-rows">
          {rows.map((p, i) => (
            <div className="s-line" key={i}>
              <div className="s-ink">{p.img ? <img src={p.img} alt="" /> : null}</div>
              <div className="s-rule" />
              <div className="s-name">{parseRich(p.name)}</div>
              <div className="s-role">{p.role}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

/* ─── Clause editor modal ──────────────────────────────── */
function ClauseEditor({ open, title, value, onSave, onCancel, onReset, canReset }) {
  const [draft, setDraft] = React.useState(value || "");
  React.useEffect(() => { setDraft(value || ""); }, [value, open]);
  if (!open) return null;
  const node = (
    <div className="clause-editor-overlay" onMouseDown={onCancel}>
      <div className="clause-editor" onMouseDown={(e) => e.stopPropagation()}>
        <div className="clause-editor-head">
          <div className="clause-editor-eyebrow">Editar cláusula</div>
          <div className="clause-editor-title">{title}</div>
        </div>
        <textarea
          className="clause-editor-area"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          spellCheck={true}
        />
        <div className="clause-editor-hint">
          Usa <b>**texto**</b> para negritas · una línea en blanco separa párrafos ·
          líneas con “- ” forman viñetas · “1. ” forman lista numerada.
        </div>
        <div className="clause-editor-actions">
          {canReset && (
            <button type="button" className="ce-btn ce-reset" onClick={onReset}>
              Restablecer original
            </button>
          )}
          <div className="ce-spacer" />
          <button type="button" className="ce-btn ce-cancel" onClick={onCancel}>Cancelar</button>
          <button type="button" className="ce-btn ce-save" onClick={() => onSave(draft)}>Guardar</button>
        </div>
      </div>
    </div>
  );
  return ReactDOM.createPortal(node, document.body);
}

/* ─── Paginated contract ───────────────────────────────── */
function PaginatedContract({ contract, edits, onEdit, onReset }) {
  const editable = typeof onEdit === "function";
  const effective = React.useMemo(() => applyEdits(contract, edits), [contract, edits]);
  const sig = JSON.stringify(effective);
  const blocks = React.useMemo(() => flattenContract(effective), [sig]);
  const [pages, setPages] = React.useState(null);
  const measRef = React.useRef(null);
  const titleRef = React.useRef(null);

  // Modal state
  const [modal, setModal] = React.useState({ open: false, key: null, title: "" });

  const openEditor = (key, title) => setModal({ open: true, key, title });
  const closeEditor = () => setModal({ open: false, key: null, title: "" });

  /* Publica las secciones editables para el panel izquierdo. */
  React.useEffect(() => {
    if (!editable) return;
    const secciones = [];
    if (contract.intro) secciones.push({ key: "intro", title: "Introducción" });
    if (contract.body && contract.body.length) secciones.push({ key: "cuerpo", title: "Cuerpo de la carta" });
    (contract.clauses || []).forEach((c) => secciones.push({ key: c.ord, title: `${c.ord}. ${c.label || ""}`.trim() }));
    window.__saSections = { secciones: secciones, abrir: openEditor };
    window.dispatchEvent(new Event("sa-sections"));
    return () => { window.__saSections = null; };
  }, [sig, editable]);

  // Serialized raw text for the unit currently being edited
  const currentRaw = React.useMemo(() => {
    if (!modal.open) return "";
    const key = modal.key;
    if (edits && edits[key] != null) return edits[key];
    if (key === "intro") return contract.intro || "";
    if (key === "cuerpo") return serializeBlocks(contract.body);
    const cl = (contract.clauses || []).find((c) => c.ord === key);
    return cl ? serializeBlocks(cl.blocks) : "";
  }, [modal, edits, contract]);

  React.useLayoutEffect(() => {
    let cancelled = false;
    const doMeasure = () => {
      if (cancelled || !measRef.current) return;
      const nodes = [...measRef.current.querySelectorAll("[data-blk]")];
      if (nodes.length !== blocks.length) return;
      const heights = nodes.map((n) => n.offsetHeight);
      const titleH = titleRef.current ? titleRef.current.offsetHeight : 0;

      const out = [];
      let cur = [];
      let acc = 0;
      for (let i = 0; i < blocks.length; i++) {
        const cap = out.length === 0 ? CONTENT_H - titleH : CONTENT_H;
        const h = heights[i] || 0;
        const need = blocks[i].k === "head" ? h + (heights[i + 1] || 0) : h;
        if (acc + need > cap && cur.length) {
          out.push(cur);
          cur = [];
          acc = 0;
        }
        cur.push(i);
        acc += h;
      }
      if (cur.length) out.push(cur);
      if (!cancelled) setPages(out);
    };

    const kick = () => setTimeout(doMeasure, 0);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(kick);
    kick();
    return () => { cancelled = true; };
  }, [sig]);

  const pageList = pages || [blocks.map((_, i) => i)];

  return (
    <div className="paginated-doc">
      {/* Hidden measurer — identical typography & column width */}
      <div className="measure-col" ref={measRef} aria-hidden="true">
        <div ref={titleRef} className="sheet-title">{effective.title}</div>
        {blocks.map((b, i) => (
          <div data-blk key={i}><Block b={b} /></div>
        ))}
      </div>

      {/* Real sheets */}
      {pages && pageList.map((idxs, p) => (
        <div className="sheet" key={p}>
          <img className="sheet-bg" src={MEMBRETE} alt="" crossOrigin="anonymous" />
          <div className="sheet-col">
            {p === 0 && <div className="sheet-title">{effective.title}</div>}
            {idxs.map((i) => (
              blocks[i] ? <Block key={i} b={blocks[i]} editable={editable} onEdit={openEditor} /> : null
            ))}
          </div>
        </div>
      ))}

      <ClauseEditor
        open={modal.open}
        title={modal.title}
        value={currentRaw}
        canReset={!!(edits && edits[modal.key] != null)}
        onSave={(v) => { onEdit(modal.key, v); closeEditor(); }}
        onReset={() => { onReset && onReset(modal.key); closeEditor(); }}
        onCancel={closeEditor}
      />
    </div>
  );
}

Object.assign(window, {
  PaginatedContract, parseRich, flattenContract, serializeBlocks, parseRaw, applyEdits,
  SHEET_W, SHEET_H, FirmasCtx, buildSigRows, normNombre,
});
