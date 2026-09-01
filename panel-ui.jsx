/* ══════════════════════════════════════════════════════════════
   Controles editoriales del panel — portados del Dashboard de
   Propietarios (mi-spacioam/ui.jsx): Select con popover, búsqueda
   y check peach, y Segmented tipo píldora.
   ══════════════════════════════════════════════════════════════ */
function PIcon({ name, size = 15, stroke = "currentColor" }) {
  const ns = window.SpacioAMDesignSystem_2c08fe;
  if (ns && ns.Icon) return React.createElement(ns.Icon, { name, size, stroke });
  return null;
}

function PanelSeg({ options, value, onChange, size = "md" }) {
  const pad = size === "sm" ? "7px 12px" : "9px 16px";
  const fs = size === "sm" ? 10.5 : 11;
  return (
    <div style={{ display: "inline-flex", padding: 3, background: "var(--beige-soft)", borderRadius: 999, gap: 2 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} type="button" onClick={() => onChange(o.value)} style={{
            border: "none", cursor: "pointer", padding: pad, borderRadius: 999,
            fontFamily: "var(--sans)", fontSize: fs, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase",
            background: active ? "var(--alabaster)" : "transparent",
            color: active ? "var(--ink)" : "var(--earth)",
            boxShadow: active ? "var(--shadow-xs)" : "none",
            transition: "all .18s var(--ease)", whiteSpace: "nowrap",
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

function PanelSelect({ value, options, onChange, icon, minWidth = 240, searchable, placeholder, block }) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setQ(""); } };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const showSearch = searchable != null ? searchable : options.length > 6;
  const shown = q
    ? options.filter((o) => (String(o.label) + " " + (o.sub || "")).toLowerCase().includes(q.toLowerCase()))
    : options;
  const cur = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ position: "relative", width: block ? "100%" : undefined }}>
      <button type="button" onClick={() => setOpen((o) => !o)} style={{
        display: "flex", alignItems: "center", gap: 10, cursor: "pointer", width: block ? "100%" : undefined,
        background: "var(--alabaster)", border: "1px solid var(--ink-08)", borderRadius: 999,
        padding: "12px 16px", fontFamily: "var(--sans)", fontSize: 12.5, letterSpacing: "0.06em",
        color: "var(--ink)", boxShadow: "var(--shadow-xs)", transition: "border-color .18s var(--ease)",
      }}>
        {icon && <PIcon name={icon} size={15} stroke="var(--earth)" />}
        <span style={{ fontWeight: 500, textAlign: "left", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {cur ? cur.label : (placeholder || "")}
        </span>
        {cur && cur.sub && <span style={{ fontSize: 9.5, letterSpacing: ".16em", textTransform: "uppercase", color: "var(--fg-muted)", flexShrink: 0 }}>{cur.sub}</span>}
        <PIcon name="chevronDown" size={14} stroke="var(--earth)" />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", left: 0, right: block ? 0 : "auto", zIndex: 60, minWidth,
          background: "var(--alabaster)", border: "1px solid var(--ink-08)", borderRadius: 16,
          boxShadow: "var(--shadow-md)", padding: 6, animation: "sa-fade .18s var(--ease)",
          maxHeight: 380, display: "flex", flexDirection: "column",
        }}>
          {showSearch && (
            <div style={{ padding: "4px 4px 8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--beige-soft)", border: "1px solid var(--ink-08)", borderRadius: 10, padding: "9px 11px" }}>
                <PIcon name="search" size={14} stroke="var(--earth)" />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…"
                  style={{ border: "none", outline: "none", background: "transparent", width: "100%", fontFamily: "var(--sans)", fontSize: 12.5, letterSpacing: "0.03em", color: "var(--ink)" }} />
              </div>
            </div>
          )}
          <div style={{ overflowY: "auto", minHeight: 0 }}>
            {shown.map((o) => {
              const active = o.value === value;
              return (
                <button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false); setQ(""); }} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                  border: "none", cursor: "pointer", background: active ? "var(--beige-soft)" : "transparent",
                  borderRadius: 11, padding: "11px 12px", fontFamily: "var(--sans)", fontSize: 12.5,
                  letterSpacing: "0.04em", color: "var(--ink)", transition: "background .14s var(--ease)",
                }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--beige-30)"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                  {o.sub ? (
                    <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontWeight: 500 }}>{o.label}</span>
                      <span style={{ fontSize: 10.5, color: "var(--fg-muted)", letterSpacing: "0.06em" }}>{o.sub}</span>
                    </span>
                  ) : <span style={{ fontWeight: active ? 500 : 400 }}>{o.label}</span>}
                  {active && <span style={{ marginLeft: "auto", display: "inline-flex" }}><PIcon name="check" size={15} stroke="var(--peach)" /></span>}
                </button>
              );
            })}
            {shown.length === 0 && <div style={{ padding: "16px 12px", textAlign: "center", fontFamily: "var(--sans)", fontSize: 12, color: "var(--fg-muted)" }}>Sin resultados</div>}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { PanelSelect, PanelSeg, PIcon });
