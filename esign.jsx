/* ══════════════════════════════════════════════════════════════
   Spacio AM — Firma electrónica
   · SendModal         → 1 o 2 firmantes por la otra parte
   · SignExperience    → proceso guiado: documento + botón flotante
                          "Firmar ahora" → lightbox de firma
   · SignLightbox      → dibujar (default) · subir imagen · escribir
   · CertificadoSheet  → certificado con las firmas estampadas
   · downloadSignedPdf → contrato firmado + certificado
   ══════════════════════════════════════════════════════════════ */
const MEMBRETE_SHEET = "assets/letterhead-cover.jpeg";

/* ─── Firma escrita (nombre en serif itálica → imagen) ─────── */
function typedSignatureImage(nombre) {
  const cv = document.createElement("canvas");
  cv.width = 760; cv.height = 200;
  const ctx = cv.getContext("2d");
  ctx.fillStyle = "#3E3F3F";
  ctx.font = "italic 74px 'Valky', 'Cormorant Garamond', Georgia, serif";
  ctx.textBaseline = "middle";
  const txt = String(nombre || "").trim();
  const w = ctx.measureText(txt).width;
  ctx.fillText(txt, Math.max(8, (cv.width - w) / 2), cv.height / 2);
  return cv.toDataURL("image/png");
}

/* ─── Imagen subida → fondo transparente + recorte ─────────── */
function cleanSignatureImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      try {
        const max = 1400;
        const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
        const w = Math.max(1, Math.round(im.naturalWidth * k));
        const h = Math.max(1, Math.round(im.naturalHeight * k));
        const cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        const ctx = cv.getContext("2d");
        ctx.drawImage(im, 0, 0, w, h);
        const px = ctx.getImageData(0, 0, w, h);
        const d = px.data;
        let minX = w, minY = h, maxX = -1, maxY = -1;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const i = (y * w + x) * 4;
            const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            let a = d[i + 3] === 0 ? 0 : Math.round(255 * Math.min(1, Math.max(0, (232 - lum) / 150)));
            d[i] = 62; d[i + 1] = 63; d[i + 2] = 63; d[i + 3] = a;
            if (a > 28) {
              if (x < minX) minX = x; if (x > maxX) maxX = x;
              if (y < minY) minY = y; if (y > maxY) maxY = y;
            }
          }
        }
        ctx.putImageData(px, 0, 0);
        if (maxX < 0) { URL.revokeObjectURL(url); resolve(cv.toDataURL("image/png")); return; }
        const pad = Math.round(Math.max(w, h) * 0.02);
        const cx = Math.max(0, minX - pad), cy = Math.max(0, minY - pad);
        const cw = Math.min(w - cx, maxX - minX + pad * 2), ch = Math.min(h - cy, maxY - minY + pad * 2);
        const out = document.createElement("canvas");
        out.width = cw; out.height = ch;
        out.getContext("2d").drawImage(cv, cx, cy, cw, ch, 0, 0, cw, ch);
        URL.revokeObjectURL(url);
        resolve(out.toDataURL("image/png"));
      } catch (e) { URL.revokeObjectURL(url); reject(e); }
    };
    im.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No se pudo leer la imagen")); };
    im.src = url;
  });
}

/* ─── Pad de firma (dibujar) ───────────────────────────────── */
function SignaturePad({ onChange }) {
  const ref = React.useRef(null);
  const drawing = React.useRef(false);
  const [empty, setEmpty] = React.useState(true);

  React.useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const r = cv.getBoundingClientRect();
    cv.width = r.width * 2; cv.height = r.height * 2;
    const ctx = cv.getContext("2d");
    ctx.scale(2, 2); ctx.lineWidth = 2.2; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#3E3F3F";
  }, []);

  const pos = (ev) => {
    const r = ref.current.getBoundingClientRect();
    const p = ev.touches ? ev.touches[0] : ev;
    return { x: p.clientX - r.left, y: p.clientY - r.top };
  };
  const start = (ev) => { ev.preventDefault(); drawing.current = true; const ctx = ref.current.getContext("2d"); const { x, y } = pos(ev); ctx.beginPath(); ctx.moveTo(x, y); };
  const move = (ev) => {
    if (!drawing.current) return; ev.preventDefault();
    const ctx = ref.current.getContext("2d"); const { x, y } = pos(ev);
    ctx.lineTo(x, y); ctx.stroke(); if (empty) setEmpty(false);
  };
  const end = () => { if (!drawing.current) return; drawing.current = false; onChange(ref.current.toDataURL("image/png")); };
  const clear = () => {
    const cv = ref.current, ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, cv.width, cv.height); setEmpty(true); onChange(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className="sign-pad">
        <canvas ref={ref} onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
        {empty && <div className="sign-pad-hint">Firma aquí con el dedo o el mouse</div>}
      </div>
      <button className="sa-btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={clear}>Limpiar</button>
    </div>
  );
}

/* ─── Lightbox de firma ────────────────────────────────────── */
function SignLightbox({ doc, firmante, onClose, onFirmar, preview }) {
  const guardada = window.Firmas.get(firmante.email);
  const [modo, setModo] = React.useState(guardada ? "guardada" : "dibujar");
  const [drawn, setDrawn] = React.useState(null);
  const [subida, setSubida] = React.useState(null);
  const [escrita, setEscrita] = React.useState("");
  const [guardar, setGuardar] = React.useState(!!guardada);
  const [acepta, setAcepta] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState("");
  const fileRef = React.useRef(null);

  const img = modo === "guardada" ? (guardada && guardada.img)
    : modo === "dibujar" ? drawn
    : modo === "subir" ? subida
    : (escrita.trim() ? typedSignatureImage(escrita) : null);
  const metodo = modo === "guardada" ? (guardada && guardada.metodo) || "drawn" : modo === "dibujar" ? "drawn" : modo === "subir" ? "uploaded" : "typed";
  const listo = acepta && !!img;

  const pickFile = async (f) => {
    if (!f) return;
    setErr("");
    try { setSubida(await cleanSignatureImage(f)); }
    catch (e) { setErr("No pudimos procesar esa imagen. Intenta con una foto de tu firma sobre papel blanco."); }
  };

  const firmar = async () => {
    setBusy("Registrando tu firma…");
    if (!preview) {
      if (guardar) window.Firmas.save(firmante.email, { img, metodo });
      else if (guardada && !guardar) window.Firmas.remove(firmante.email);
    }
    await onFirmar({ img, metodo, guardar });
    setBusy("");
  };

  return (
    <div className="sa-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sa-modal sign-lightbox">
        <div className="sa-modal-head">
          <div>
            <div className="sa-eyebrow">{doc.folio} · Firma electrónica</div>
            <h2 className="sa-modal-title">Firma tu documento</h2>
            <p style={{ margin: "10px 0 0", fontSize: 12.5, letterSpacing: ".03em", color: "var(--earth)" }}>
              Firmas como <b style={{ color: "var(--ink)" }}>{firmante.nombre}</b> · {firmante.email}
            </p>
          </div>
          <button className="sa-x" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="sa-modal-body">
          <div className="sign-tabs">
            {guardada && <button className={modo === "guardada" ? "on" : ""} onClick={() => setModo("guardada")}>Mi firma</button>}
            <button className={modo === "dibujar" ? "on" : ""} onClick={() => setModo("dibujar")}>Dibujar</button>
            <button className={modo === "subir" ? "on" : ""} onClick={() => setModo("subir")}>Subir imagen</button>
            <button className={modo === "escribir" ? "on" : ""} onClick={() => setModo("escribir")}>Escribir</button>
          </div>

          {modo === "guardada" && (
            <div className="sign-preview-box">{guardada && <img src={guardada.img} alt="Tu firma guardada" />}</div>
          )}
          {modo === "dibujar" && <SignaturePad onChange={setDrawn} />}
          {modo === "subir" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {subida ? (
                <div className="sign-preview-box"><img src={subida} alt="Firma subida" /></div>
              ) : (
                <button className="sign-drop" onClick={() => fileRef.current.click()}>
                  <span className="sign-drop-t">Subir una imagen de tu firma</span>
                  <span className="sign-drop-h">PNG o foto sobre papel blanco. Le quitamos el fondo automáticamente.</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={(e) => pickFile(e.target.files[0])} />
              {subida && <button className="sa-btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => setSubida(null)}>Cambiar imagen</button>}
              {err && <div className="sa-login-err">{err}</div>}
            </div>
          )}
          {modo === "escribir" && (
            <>
              <label className="sa-field">
                <span>Escribe tu firma</span>
                <input value={escrita} placeholder={firmante.nombre} onChange={(e) => setEscrita(e.target.value)} autoFocus />
              </label>
              <div className="sign-typed"><span>{escrita || firmante.nombre}</span></div>
            </>
          )}

          <label className="sign-check">
            <input type="checkbox" checked={guardar} onChange={(e) => setGuardar(e.target.checked)} />
            <span>Guardar mi firma para futuros contratos de Spacio AM.</span>
          </label>
          <label className="sign-check">
            <input type="checkbox" checked={acepta} onChange={(e) => setAcepta(e.target.checked)} />
            <span>Leí el documento, acepto su contenido y firmo por medios electrónicos con el mismo valor que una firma manuscrita.</span>
          </label>

          <button className="sa-btn dark" disabled={!listo || !!busy} onClick={firmar}>{busy || "Firmar documento"}</button>
          <p className="sign-legal">Registramos tu nombre, correo, fecha, hora y la huella del documento para el certificado.</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal: enviar contrato para firma (1 o 2 firmantes) ─── */
function SendModal({ open, tipo, data, custom, edits, sugerido, onClose, onSent }) {
  const [f1, setF1] = React.useState({ nombre: "", email: "" });
  const [f2, setF2] = React.useState(null);
  const [mensaje, setMensaje] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => { if (open) { setF1({ nombre: sugerido || "", email: "" }); setF2(null); setMensaje(""); } }, [open, sugerido]);
  if (!open) return null;

  const ok = (f) => f && f.nombre.trim().length > 3 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim());
  const ready = ok(f1) && (!f2 || ok(f2));

  const send = () => {
    setBusy(true);
    const doc = window.Docs.create({
      tipo, data, custom, edits,
      firmantes: [f1].concat(f2 ? [f2] : []).map((f) => ({ nombre: f.nombre.trim(), email: f.email.trim().toLowerCase() })),
      contraparteNombre: data.contratanteNombre,
      mensaje: mensaje.trim(),
    });
    setBusy(false);
    if (window.SpacioSync) window.SpacioSync.push("crear", doc);
    onSent(doc);
  };

  const campos = (f, set, n) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="sa-eyebrow">Firmante {n}</div>
        {n === 2 && <button className="sa-btn ghost sm" onClick={() => setF2(null)}>Quitar</button>}
      </div>
      <label className="sa-field">
        <span>Nombre completo</span>
        <input value={f.nombre} placeholder="GABRIEL ASTURIAS MOREIRA" autoFocus={n === 1}
          onChange={(e) => set({ ...f, nombre: e.target.value.toUpperCase() })} />
      </label>
      <label className="sa-field">
        <span>Correo electrónico</span>
        <input value={f.email} placeholder="gabriel@ejemplo.com" type="email" autoCapitalize="none"
          onChange={(e) => set({ ...f, email: e.target.value })} />
      </label>
    </div>
  );

  return (
    <div className="sa-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sa-modal">
        <div className="sa-modal-head">
          <div>
            <div className="sa-eyebrow">Firma electrónica</div>
            <h2 className="sa-modal-title">Enviar contrato para firma</h2>
          </div>
          <button className="sa-x" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="sa-modal-body">
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, letterSpacing: ".02em", color: "var(--earth)" }}>
            {window.Docs.TIPO_LABEL[tipo] || "Documento"} · cada firmante recibe un enlace personal para revisar y firmar. Spacio AM contrafirma al final.
          </p>
          {campos(f1, setF1, 1)}
          {f2 ? campos(f2, setF2, 2) : (
            <button className="sa-btn ghost" onClick={() => setF2({ nombre: "", email: "" })}>Agregar segundo firmante</button>
          )}
          <label className="sa-field">
            <span>Mensaje (opcional)</span>
            <textarea rows={2} value={mensaje} placeholder="Cualquier nota que quieras incluir en el correo."
              onChange={(e) => setMensaje(e.target.value)} />
          </label>
          <div className="sa-note">
            El enlace solo funciona con el correo de cada firmante. Al completarse las firmas, todos reciben la copia en PDF con el certificado.
          </div>
          <div className="sa-actions">
            <button className="sa-btn dark" disabled={!ready || busy} onClick={send} style={{ flex: 1 }}>
              {busy ? "Enviando…" : "Enviar para firma"}
            </button>
            <button className="sa-btn ghost" onClick={onClose}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Modal: pedir datos al propietario ────────────────── */
function DataRequestModal({ open, tipo, sugerido, onClose, onSent }) {
  const CAMPOS = {
    persona: ["Nombre completo", "Número de DPI", "Edad", "Estado civil", "Nacionalidad", "Profesión u oficio", "Domicilio"],
    entidad: ["Nombre de la entidad", "Representante legal y su DPI", "Acta de nombramiento", "Registro Mercantil (número, folio, libro)"],
    propiedad: ["Dirección", "Edificio", "Apartamento y nivel"],
    fiscal: ["NIT", "Régimen fiscal", "¿Emite facturas?"],
    empleado: ["Nombre completo", "DPI", "Edad y estado civil", "Domicilio", "Número de IGSS (si aplica)"],
  };
  const esCohosting = String(tipo || "").indexOf("cohosting") === 0;
  const esEmpleado = String(tipo || "").indexOf("emp_") === 0;
  const grupos = esCohosting
    ? [["Datos personales", CAMPOS.persona], ["Si firma una sociedad", CAMPOS.entidad], ["Propiedad", CAMPOS.propiedad], ["Facturación", CAMPOS.fiscal]]
    : esEmpleado
    ? [["Datos del colaborador", CAMPOS.empleado]]
    : [["Datos personales", CAMPOS.persona], ["Facturación", CAMPOS.fiscal]];

  const [nombre, setNombre] = React.useState("");
  const [correo, setCorreo] = React.useState("");
  const [sel, setSel] = React.useState(() => grupos.map(() => true));
  const [preview, setPreview] = React.useState(false);
  React.useEffect(() => { if (open) { setNombre(sugerido || ""); setCorreo(""); setPreview(false); setSel(grupos.map(() => true)); } }, [open, sugerido]);
  if (!open) return null;

  const ready = nombre.trim().length > 3 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo.trim());
  const M = window.SpacioEmails;
  const mail = M.build("solicitudDatos", {
    base: location.href.replace(/[^/]*$/, ""),
    nombre: nombre || "Marcel", correo: correo,
    documento: (window.Docs.TIPO_LABEL[tipo] || "documento").toLowerCase(),
    campos: grupos.filter((g, i) => sel[i]).map((g) => [g[0], g[1].join(", ")]),
  });

  return (
    <div className="sa-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={"sa-modal" + (preview ? " wide" : "")}>
        <div className="sa-modal-head">
          <div>
            <div className="sa-eyebrow">Antes de redactar</div>
            <h2 className="sa-modal-title">Pedir datos al propietario</h2>
            <p style={{ margin: "10px 0 0", fontSize: 12.5, letterSpacing: ".03em", color: "var(--earth)" }}>
              Sale de {M.FROM_NAME} &lt;{M.FROM_EMAIL}&gt;
            </p>
          </div>
          <button className="sa-x" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="sa-modal-body">
          {preview ? (
            <>
              <div className="sa-mail-frame"><iframe title="Solicitud de datos" srcDoc={mail.html} /></div>
              <div className="sa-actions">
                <button className="sa-btn dark" onClick={() => { onSent(correo.trim().toLowerCase()); }}>Enviar solicitud</button>
                <button className="sa-btn ghost" onClick={() => setPreview(false)}>Volver</button>
              </div>
            </>
          ) : (
            <>
              <label className="sa-field">
                <span>Nombre</span>
                <input value={nombre} placeholder="MARCEL REICHE" autoFocus onChange={(e) => setNombre(e.target.value.toUpperCase())} />
              </label>
              <label className="sa-field">
                <span>Correo electrónico</span>
                <input value={correo} type="email" placeholder="marcel@ejemplo.com" autoCapitalize="none" onChange={(e) => setCorreo(e.target.value)} />
              </label>
              <div>
                <div className="sa-eyebrow" style={{ marginBottom: 10 }}>Qué vamos a pedirle</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {grupos.map((g, i) => (
                    <label key={g[0]} className="sign-check" style={{ fontSize: 12 }}>
                      <input type="checkbox" checked={sel[i]} onChange={(e) => setSel((s) => s.map((v, j) => j === i ? e.target.checked : v))} />
                      <span><b>{g[0]}</b><br /><span style={{ color: "var(--earth)" }}>{g[1].join(" · ")}</span></span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="sa-note">Le enviamos un enlace para llenar sus datos y adjuntar la foto de su DPI; al recibirlos, generas el documento sin volver a escribir nada.</div>
              <div className="sa-actions">
                <button className="sa-btn dark" disabled={!ready} onClick={() => setPreview(true)} style={{ flex: 1 }}>Ver el correo</button>
                <button className="sa-btn ghost" onClick={onClose}>Cancelar</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Firmas del documento → contexto de estampado ────────── */
function firmasDe(doc) {
  return {
    signers: (doc.firmantes || []).map((f) => ({ nombre: f.nombre, img: f.firma ? f.firma.img : null })),
    spacio: doc.firmaSpacio ? { nombre: doc.firmaSpacio.nombre, img: doc.firmaSpacio.img } : null,
  };
}

/* ─── Documento escalado (lectura) ────────────────────────── */
/* El zoom se calcula contra el ancho REAL disponible del contenedor,
   no contra un máximo fijo: así la hoja cabe también en teléfono. */
function useFitZoom(maxWidth) {
  const ref = React.useRef(null);
  const [zoom, setZoom] = React.useState(Math.min(1, maxWidth / 816));
  React.useLayoutEffect(() => {
    const medir = () => {
      const host = ref.current && ref.current.parentElement;
      if (!host) return;
      const cs = getComputedStyle(host);
      const disp = host.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
      const w = Math.max(240, Math.min(maxWidth, disp));
      setZoom(Math.min(1, w / 816));
    };
    medir();
    const t = setTimeout(medir, 250);
    window.addEventListener("resize", medir);
    let ro = null;
    if (window.ResizeObserver && ref.current && ref.current.parentElement) {
      ro = new ResizeObserver(medir);
      ro.observe(ref.current.parentElement);
    }
    return () => { window.removeEventListener("resize", medir); clearTimeout(t); if (ro) ro.disconnect(); };
  }, [maxWidth]);
  return [ref, zoom];
}

function ScaledDoc({ doc, width = 620, id }) {
  const [ref, zoom] = useFitZoom(width);
  return (
    <div id={id} ref={ref} style={{ width: 816, zoom: zoom, display: "flex", flexDirection: "column", gap: 20 }}>
      <FirmasCtx.Provider value={firmasDe(doc)}>
        <ContractDoc tipo={doc.tipo} data={doc.data} custom={doc.custom} edits={doc.edits} />
      </FirmasCtx.Provider>
    </div>
  );
}

/* Certificado con el mismo ajuste al contenedor. */
function ScaledCert({ doc, width = 506 }) {
  const [ref, zoom] = useFitZoom(width);
  return (
    <div ref={ref} style={{ width: 816, zoom: zoom }}>
      <CertificadoSheet doc={doc} />
    </div>
  );
}

/* ─── Certificado de firma electrónica ────────────────────── */
function CertificadoSheet({ doc }) {
  const F = window.Docs;
  const huella = F.hash(doc.folio + doc.tipo + JSON.stringify(doc.data)).slice(0, 8) + "·" + F.hash(doc.firmanteEmail || "").slice(0, 8);
  const partes = (doc.firmantes || []).map((f) => ({
    rol: (doc.firmantes.length > 1 ? "Firmante · " + f.id.replace("f", "") : "Firmante"),
    nombre: f.nombre, correo: f.email, firma: f.firma,
  })).concat([{ rol: "Por Spacio AM, Sociedad Anónima", nombre: doc.contraparteNombre, correo: doc.contraparteEmail, firma: doc.firmaSpacio }]);

  const metodoLbl = (m) => m === "drawn" ? "firma trazada" : m === "uploaded" ? "imagen de firma" : "firma escrita";

  return (
    <div className="sheet">
      <img className="sheet-bg" src={MEMBRETE_SHEET} alt="" crossOrigin="anonymous" />
      <div className="sheet-col">
        <div className="sheet-title">Certificado de firma electrónica</div>
        <div className="cert-meta">
          {[["Documento", doc.tipoLabel], ["Folio", doc.folio], ["Certificado", doc.certificado || "—"],
            ["Huella del documento", huella], ["Enviado", F.fmtDateTime(doc.enviado)]].map((r) => (
            <div className="cert-row" key={r[0]}><span>{r[0]}</span><b>{r[1]}</b></div>
          ))}
        </div>
        <div className="cert-partes">
          {partes.map((p, i) => (
            <div className="cert-parte" key={i}>
              <div className="cert-rol">{p.rol}</div>
              <div className="cert-box">{p.firma && p.firma.img ? <img src={p.firma.img} alt="" /> : <span>Pendiente de firma</span>}</div>
              <div className="cert-nombre">{p.nombre}</div>
              <div className="cert-datos">
                {p.correo}<br />
                {p.firma ? F.fmtDateTime(p.firma.ts) + " · " + metodoLbl(p.firma.metodo) : "—"}<br />
                {p.firma ? "Origen: " + (p.firma.ip || "registrado al firmar") : ""}
              </div>
            </div>
          ))}
        </div>
        <p className="cert-legal">
          Las partes aceptaron firmar este documento por medios electrónicos. Cada firma quedó registrada con nombre,
          correo, fecha, hora, método y huella del documento. Cualquier modificación posterior altera la huella y, con
          ella, invalida este certificado. Copia archivada por Spacio AM junto con el contrato firmado.
        </p>
      </div>
    </div>
  );
}

/* ─── PDF de la copia firmada ─────────────────────────────── */
async function downloadSignedPdf(doc, onStatus) {
  const say = onStatus || function () {};
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-20000px;top:0;width:816px;";
  document.body.appendChild(host);
  const root = ReactDOM.createRoot(host);
  try {
    say("Preparando la copia…");
    root.render(
      <div id="signed-doc" className="printing">
        <FirmasCtx.Provider value={firmasDe(doc)}>
          <ContractDoc tipo={doc.tipo} data={doc.data} custom={doc.custom} edits={doc.edits} />
        </FirmasCtx.Provider>
        <CertificadoSheet doc={doc} />
      </div>
    );
    await new Promise((r) => setTimeout(r, 700));
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 250));

    const sheets = [...host.querySelectorAll(".sheet")];
    if (!sheets.length) throw new Error("No se pudo componer el documento");
    const PAGE_W = 816, PAGE_H = 1056;
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: "px", format: [PAGE_W, PAGE_H], orientation: "portrait", hotfixes: ["px_scaling"], compress: true });
    for (let i = 0; i < sheets.length; i++) {
      say(`Página ${i + 1} de ${sheets.length}…`);
      const canvas = await window.html2canvas(sheets[i], {
        scale: 2, useCORS: true, backgroundColor: "#E8E4DC", width: PAGE_W, height: PAGE_H, windowWidth: PAGE_W,
      });
      if (i > 0) pdf.addPage([PAGE_W, PAGE_H], "portrait");
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, PAGE_W, PAGE_H, undefined, "FAST");
    }
    const nm = (doc.firmanteNombre || "Sin nombre").split(/\s+/).slice(0, 3).join(" ");
    pdf.save(`${doc.tipoLabel} FIRMADO - ${nm} (${doc.folio}).pdf`);
    say("");
  } finally {
    setTimeout(() => { root.unmount(); host.remove(); }, 60);
  }
}

/* ─── Experiencia del firmante ────────────────────────────── */
function SignExperience({ doc, onUpdate, onExit, stepOverride, onStepChange, preview, readOnly, volverAlPanel }) {
  const F = window.Docs;
  const [ownStep, setStep] = React.useState(doc.estado === "firmado" ? 3 : 1);
  const step = stepOverride || ownStep;
  const [lightbox, setLightbox] = React.useState(false);
  const [busy, setBusy] = React.useState("");
  const [live, setLive] = React.useState(doc);

  React.useEffect(() => { setLive(doc); }, [doc.id, doc.estado]);
  React.useEffect(() => {
    if (stepOverride || preview) return;
    if (doc.estado === "enviado") { const u = F.markVisto(doc.id); if (u) { setLive(u); if (onUpdate) onUpdate(u); } }
  }, [doc.id, stepOverride]);

  const current = live;
  const pendientes = (current.firmantes || []).filter((f) => !f.firma);
  const activo = pendientes[0] || (current.firmantes || [])[0] || { id: "f1", nombre: current.firmanteNombre, email: current.firmanteEmail };
  const guardada = window.Firmas.get(activo.email);
  const firmadoTodo = current.estado === "firmado";
  const esPreviewFirmado = !!preview && current.certificado === "VISTA PREVIA";

  const nav = (n) => {
    if (stepOverride) {
      if (n === 2 && !firmadoTodo) setLightbox(true);
      if (onStepChange) onStepChange(n);
      return;
    }
    if (n === 2 && !firmadoTodo) { setLightbox(true); return; }
    setStep(n);
  };

  React.useEffect(() => { if (stepOverride === 2 && !firmadoTodo) setLightbox(true); if (stepOverride && stepOverride !== 2) setLightbox(false); }, [stepOverride, firmadoTodo]);

  const firmar = async ({ img, metodo }) => {
    if (preview) {
      /* vista previa: se muestra el resultado sin escribir en el registro */
      const fs = (current.firmantes || []).map((f) => f.id === activo.id
        ? Object.assign({}, f, { firma: { img: img, metodo: metodo, ts: new Date().toISOString(), ip: "vista previa" } }) : f);
      const d = Object.assign({}, current, { firmantes: fs, estado: "parcial" });
      setLive(d); setLightbox(false);
      if (fs.filter((f) => !f.firma).length) return;
      setBusy("Contrafirmando por Spacio AM…");
      await new Promise((r) => setTimeout(r, 700));
      setLive(Object.assign({}, d, {
        estado: "firmado",
        firmaSpacio: { nombre: d.contraparteNombre, correo: d.contraparteEmail, img: typedSignatureImage(d.contraparteNombre), metodo: "typed", ts: new Date().toISOString(), ip: "vista previa" },
        certificado: "VISTA PREVIA",
      }));
      setBusy("");
      if (onStepChange) onStepChange(3); else setStep(3);
      return;
    }
    let d = F.signFirmante(current.id, activo.id, { img, metodo });
    setLive(d); if (onUpdate) onUpdate(d);
    setLightbox(false);
    if (F.faltanFirmas(d) > 0) { setBusy(""); return; }
    setBusy("Contrafirmando por Spacio AM…");
    await new Promise((r) => setTimeout(r, 800));
    d = F.signSpacio(current.id, { img: typedSignatureImage(d.contraparteNombre), metodo: "typed" });
    setLive(d); if (onUpdate) onUpdate(d);
    if (window.SpacioSync) window.SpacioSync.push("firmar", d);
    setBusy("");
    setStep(3);
  };

  const steps = [
    { n: 1, label: "Revisar" },
    { n: 2, label: "Firmar" },
    { n: 3, label: "Copia" },
  ];

  const topBar = (
    <div className="sign-top">
      <LogoPrimary width={92} />
      <div className="sign-steps">
        {steps.map((s) => (
          <button key={s.n} className={"sign-step" + (step === s.n ? " on" : step > s.n ? " done" : "")}
            onClick={() => nav(s.n)} disabled={!stepOverride && s.n === 3 && !firmadoTodo}>
            <i>{s.n}</i> {s.label}
          </button>
        ))}
      </div>
      <div className="sign-top-meta">
        <span className="sa-chip">Folio <b>{current.folio}</b></span>
        {onExit && <button className="sa-btn ghost sm" onClick={onExit}>Salir</button>}
      </div>
    </div>
  );

  /* ── Paso 3 · copia ── */
  if (step === 3) {
    return (
      <div className="sign-page">
        {topBar}
        <div className="sign-done">
          <div className="sign-done-ic"><Star size={30} color="#E9826A" /></div>
          <div className="sa-eyebrow">{firmadoTodo ? (esPreviewFirmado ? "Vista previa · copia firmada" : "Documento firmado") : "Vista previa"}</div>
          <h1 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: "clamp(28px,4vw,42px)", lineHeight: 1.1, margin: 0, color: "var(--ink)" }}>
            {firmadoTodo ? "Listo. Quedó firmado por ambas partes." : "Así se ve la copia firmada."}
          </h1>
          <p style={{ fontSize: 13.5, lineHeight: 1.7, letterSpacing: ".03em", color: "var(--earth)", margin: 0, textWrap: "pretty" }}>
            {firmadoTodo
              ? "Enviamos la copia en PDF con el certificado de firma a " + (current.firmantes || []).map((f) => f.email).join(", ") + " y a " + current.contraparteEmail + ". Queda archivada en el Drive de contratos de Spacio AM."
              : "Cuando todas las partes firmen, la copia en PDF con su certificado llega al correo de cada firmante y queda archivada en el Drive de contratos."}
          </p>
          <div className="sa-rows" style={{ width: "100%", textAlign: "left" }}>
            <div className="sa-row"><span className="sa-row-k">Documento</span><span className="sa-row-v">{current.tipoLabel}</span></div>
            <div className="sa-row"><span className="sa-row-k">Certificado</span><span className="sa-row-v">{current.certificado || "—"}</span></div>
            <div className="sa-row"><span className="sa-row-k">Firmas</span><span className="sa-row-v">
              {(current.firmantes || []).map((f) => <span key={f.id}>{f.nombre}: {f.firma ? F.fmtDateTime(f.firma.ts) : "—"}<br /></span>)}
              {current.contraparteNombre}: {current.firmaSpacio ? F.fmtDateTime(current.firmaSpacio.ts) : "—"}
            </span></div>
          </div>
          <div className="sa-actions" style={{ justifyContent: "center" }}>
            <button className="sa-btn dark" disabled={!!busy || !firmadoTodo || esPreviewFirmado} onClick={() => downloadSignedPdf(current, setBusy)}>
              {busy || (esPreviewFirmado ? "Descarga disponible en el documento real" : firmadoTodo ? "Descargar copia firmada (PDF)" : "Disponible al firmar")}
            </button>
            {volverAlPanel && <button className="sa-btn accent" onClick={volverAlPanel}>Ver mis documentos</button>}
          </div>
          <div className="cert-preview">
            <div className="sa-eyebrow" style={{ marginBottom: 12 }}>Certificado de firma electrónica</div>
            <ScaledCert doc={current} width={506} />
          </div>
        </div>
      </div>
    );
  }

  /* ── Pasos 1 y 2 · documento con botón flotante ── */
  const yaFirmo = !pendientes.length || (activo.firma && true);
  return (
    <div className="sign-page">
      {topBar}
      <div className="sign-reader">
        <div className="sign-reader-head">
          <div>
            <div className="sa-eyebrow">{current.categoria} · {current.folio}</div>
            <h1 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: "clamp(26px,3.4vw,36px)", lineHeight: 1.1, margin: "8px 0 0", color: "var(--ink)" }}>{current.tipoLabel}</h1>
            <p style={{ fontSize: 12.5, letterSpacing: ".03em", color: "var(--earth)", margin: "8px 0 0" }}>
              Para {activo.nombre} · enviado el {F.fmtDate(current.enviado)} por Spacio AM
            </p>
          </div>
          {current.mensaje && <div className="sa-note" style={{ background: "var(--peach-12)", color: "var(--ink)", maxWidth: 320 }}>{current.mensaje}</div>}
        </div>
        <div className="sign-doc-flow">
          <ScaledDoc doc={current} width={700} />
        </div>
        <p className="sign-legal" style={{ maxWidth: 700, margin: "0 auto", padding: "18px 4px 0" }}>
          {readOnly ? "Vista de lectura. Así lo verá la persona que reciba el enlace de firma." : "Lee el documento completo. Si algo no coincide con lo conversado, escríbenos antes de firmar y lo corregimos."}
        </p>
      </div>

      {!readOnly && <div className="sign-cta-float">
        {guardada && !yaFirmo && (
          <div className="sign-cta-saved">
            <img src={guardada.img} alt="Tu firma guardada" />
            <span>Tu firma guardada</span>
          </div>
        )}
        <button className="sign-cta-btn" onClick={() => setLightbox(true)} disabled={!!busy || yaFirmo}>
          {busy || (yaFirmo ? "Firmado" : guardada ? "Firmar documento" : "Firmar ahora")}
        </button>        {(current.firmantes || []).length > 1 && (
          <div className="sign-cta-meta">
            {(current.firmantes || []).filter((f) => f.firma).length} de {current.firmantes.length} firmantes
          </div>
        )}
      </div>}

      {lightbox && (
        <SignLightbox doc={current} firmante={activo} preview={preview} onClose={() => setLightbox(false)} onFirmar={firmar} />
      )}
    </div>
  );
}

Object.assign(window, {
  SendModal, DataRequestModal, SignExperience, SignLightbox, SignaturePad, ScaledDoc, CertificadoSheet,
  downloadSignedPdf, typedSignatureImage, cleanSignatureImage, firmasDe, ScaledCert, useFitZoom,
});
