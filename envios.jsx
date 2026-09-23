/* ══════════════════════════════════════════════════════════════
   Spacio AM — Piezas de envío
   · PropiedadPicker   → vincula un co-hosting a una propiedad de EPI
   · ProgramarEnvio    → "Ahora" o fecha + hora de Guatemala
   · TituloEditable    → renombrar el documento en el detalle
   · AvisoProgramado   → bloque del detalle con Enviar ahora / Cancelar
   ══════════════════════════════════════════════════════════════ */

function PropiedadPicker({ value, onChange, block = true }) {
  const S = window.SpacioSync;
  const [list, setList] = React.useState(() => (S && S.propiedadesCache ? S.propiedadesCache() : []));
  const [estado, setEstado] = React.useState(list.length ? "listo" : "cargando");
  const [intento, setIntento] = React.useState(0);
  React.useEffect(() => {
    let vivo = true;
    if (!S || !S.propiedades) { setEstado("error"); return; }
    S.propiedades().then((r) => {
      if (!vivo) return;
      if (r.ok) { setList(r.list); setEstado("listo"); }
      else setEstado(r.list && r.list.length ? "listo" : "error");
    });
    return () => { vivo = false; };
  }, [intento]);

  if (estado === "error" && !list.length) {
    return (
      <div className="prop-err">
        <span>No pudimos traer las propiedades de EPI.</span>
        <button type="button" className="sa-btn ghost sm" onClick={() => { setEstado("cargando"); setIntento((n) => n + 1); }}>Reintentar</button>
      </div>
    );
  }
  const opts = [{ value: "", label: "Sin propiedad vinculada" }]
    .concat(list.map((p) => ({ value: String(p.id), label: p.name })));
  return (
    <window.PanelSelect
      block={block}
      value={value ? String(value) : ""}
      placeholder={estado === "cargando" ? "Cargando propiedades…" : "Elige una propiedad"}
      options={opts}
      searchable
      onChange={(id) => {
        const p = list.find((x) => String(x.id) === String(id));
        onChange(p ? { id: String(p.id), name: p.name } : null);
      }}
    />
  );
}

/* Cuándo sale el correo. Todo en hora de Guatemala, sin importar la zona
   del dispositivo. value = { modo: "ahora"|"programar", fecha, hora } */
function ProgramarEnvio({ value, onChange }) {
  const GT = window.SpacioSync.GT;
  const set = (k, v) => onChange(Object.assign({}, value, { [k]: v }));
  const siete = GT.proxima(7);
  const iso = value.modo === "programar" ? GT.aISO(value.fecha, value.hora) : null;
  const pasado = iso && new Date(iso).getTime() < Date.now() + 2 * 60000;
  const ahoraGT = GT.etiqueta(new Date().toISOString());
  return (
    <div className="prog-envio">
      <div className="sa-eyebrow">Cuándo enviar</div>
      <window.PanelSeg size="sm" value={value.modo}
        onChange={(m) => onChange(m === "programar" && !value.fecha ? { modo: m, fecha: siete.fecha, hora: siete.hora } : Object.assign({}, value, { modo: m }))}
        options={[{ value: "ahora", label: "Enviar ahora" }, { value: "programar", label: "Programar" }]} />
      {value.modo === "programar" && (
        <>
          <div className="prog-grid">
            <label className="sa-field">
              <span>Fecha</span>
              <input type="date" value={value.fecha || ""} min={GT.fecha()} onChange={(e) => set("fecha", e.target.value)} />
            </label>
            <label className="sa-field">
              <span>Hora (Guatemala)</span>
              <input type="time" step="900" value={value.hora || ""} onChange={(e) => set("hora", e.target.value)} />
            </label>
          </div>
          <div className="prog-rapidos">
            <button type="button" className={"sa-chip" + (value.fecha === siete.fecha && value.hora === "07:00" ? " on" : "")}
              onClick={() => onChange({ modo: "programar", fecha: siete.fecha, hora: "07:00" })}>
              {(siete.fecha === GT.fecha() ? "Hoy" : "Mañana") + " · 7:00 a. m."}
            </button>
            <button type="button" className={"sa-chip" + (value.fecha === GT.proxima(9).fecha && value.hora === "09:00" ? " on" : "")}
              onClick={() => { const n = GT.proxima(9); onChange({ modo: "programar", fecha: n.fecha, hora: "09:00" }); }}>
              {(GT.proxima(9).fecha === GT.fecha() ? "Hoy" : "Mañana") + " · 9:00 a. m."}
            </button>
          </div>
          <div className={"prog-resumen" + (pasado ? " err" : "")}>
            <span>{!iso ? "Elige fecha y hora."
              : pasado ? "Esa hora ya pasó en Guatemala. Elige una hora futura."
              : <>Sale el <b>{GT.etiqueta(iso)}</b>, hora de Guatemala.</>}</span>
            <span className="prog-ahora">Ahora en Guatemala: {ahoraGT}</span>
          </div>
        </>
      )}
    </div>
  );
}
ProgramarEnvio.valido = (v) => {
  if (!v || v.modo !== "programar") return true;
  const iso = window.SpacioSync.GT.aISO(v.fecha, v.hora);
  return !!iso && new Date(iso).getTime() >= Date.now() + 2 * 60000;
};

function TituloEditable({ doc, puede, onGuardar }) {
  const F = window.Docs;
  const [edit, setEdit] = React.useState(false);
  const [txt, setTxt] = React.useState(F.titulo(doc));
  React.useEffect(() => { setTxt(F.titulo(doc)); setEdit(false); }, [doc.id, doc.nombre]);
  if (!edit) {
    return (
      <div className="titulo-edit">
        <h2 className="sa-modal-title">{F.titulo(doc)}</h2>
        {puede && <button type="button" className="titulo-btn" onClick={() => setEdit(true)}>Renombrar</button>}
      </div>
    );
  }
  const guardar = () => { onGuardar(txt.trim()); setEdit(false); };
  return (
    <div className="titulo-form">
      <input value={txt} autoFocus maxLength={120} placeholder={doc.tipoLabel}
        onChange={(e) => setTxt(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") guardar(); if (e.key === "Escape") setEdit(false); }} />
      <div className="titulo-acc">
        <button type="button" className="sa-btn dark sm" disabled={!txt.trim()} onClick={guardar}>Guardar</button>
        <button type="button" className="sa-btn ghost sm" onClick={() => { setTxt(doc.tipoLabel); }}>Usar el del tipo</button>
        <button type="button" className="sa-btn ghost sm" onClick={() => setEdit(false)}>Cancelar</button>
      </div>
      <span className="titulo-nota">Cambia el nombre en el registro, la hoja y los próximos correos. El contenido del contrato no cambia.</span>
    </div>
  );
}

function AvisoProgramado({ doc, gestion, busy, onEnviarAhora, onCancelar }) {
  const p = doc.programado || {};
  return (
    <div className="sa-aviso-correo neutro">
      <b>Envío programado</b>
      <span>El correo de firma sale el <b>{p.etiqueta || window.SpacioSync.GT.etiqueta(p.sendAt)}</b> a {(doc.firmantes || []).map((f) => f.email).join(", ")}. Puedes cerrar el navegador: sale solo.</span>
      {p.error && <span className="sa-sin-correo">No se pudo registrar en el servidor ({p.error}). Usa Enviar ahora o vuelve a programarlo.</span>}
      {gestion && (
        <div className="aviso-acc">
          <button type="button" className="sa-btn dark sm" disabled={!!busy} onClick={onEnviarAhora}>{busy || "Enviar ahora"}</button>
          <button type="button" className="sa-btn ghost sm" disabled={!!busy} onClick={onCancelar}>Cancelar envío</button>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { PropiedadPicker, ProgramarEnvio, TituloEditable, AvisoProgramado });
