/* ────────────────────────────────────────────────────────
   SPACIO AM Contract Generator — App
   ──────────────────────────────────────────────────────── */

const { useState, useEffect, useRef, useCallback } = React;

/* Defaults — SPACIO AM contratante data (fixed) ─────────── */
const SPACIO_DEFAULTS = {
  contratanteNombre: "JUAN FRANCISCO OVALLE LANUZA",
  contratanteEdad: "37",
  contratanteEstado: "Casado",
  contratanteDPI: "1791 74304 0101",
  // Acta notarial / Registro Mercantil de Spacio AM (co-hosting)
  actaFecha: "30 de marzo de 2023",
  actaNotario: "Irving Giovanni Tejada Escobar",
  regNumero: "697958",
  regFolio: "663",
  regLibro: "816",
};

/* Co-hosting field defaults (per-contract, not persisted across) */
const COHOSTING_DEFAULTS = {
  // Dueño persona individual
  duenoNombre: "",
  duenoEdad: "",
  duenoEstado: "",
  duenoNacionalidad: "guatemalteco(a)",
  duenoProfesion: "",
  duenoDomicilio: "",
  duenoDPI: "",
  // Representante legal (persona jurídica)
  repNombre: "",
  repEdad: "",
  repEstado: "",
  repNacionalidad: "guatemalteco(a)",
  repDomicilio: "",
  repDPI: "",
  entidadNombre: "",
  // Propiedad
  propDireccion: "",
  propApto: "",
  propPiso: "",
  propEdificio: "",
  // Presupuesto mensual de insumos (corto plazo)
  presupuestoInsumos: "1,050.00",
};

/* Empleados (RR. HH.) field defaults */
const EMPLEADO_DEFAULTS = {
  empNombre: "",
  empDPI: "",
  empEdad: "",
  empEstado: "Soltero(a)",
  empNacionalidad: "guatemalteco(a)",
  empProfesion: "Bachiller",
  empDomicilio: "",
  empCargo: "",
  empCargoAnterior: "",
  empSalario: "",
  empSalarioAnterior: "",
  empLugarTrabajo: "Km 77, RN-14, San Lorenzo El Cubo",
  vacPeriodoInicio: "",
  vacPeriodoFin: "",
  empRol: "Happiness Hero",
};

/* Local-storage key */
const LS_KEY = "spacio_am_contracts_v1";

/* Today's date in YYYY-MM-DD */
function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/* ─── DPI image → OCR via Tesseract ───────────────────── */
async function runOCR(file) {
  // Lazy-load Tesseract
  if (!window.Tesseract) {
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js";
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  const url = URL.createObjectURL(file);
  try {
    const { data } = await window.Tesseract.recognize(url, "spa", {
      // logger: m => console.log(m),
    });
    return data.text || "";
  } finally {
    URL.revokeObjectURL(url);
  }
}

/* ─── Parse the OCR text with Claude to pull fields ────── */
async function extractWithClaude(ocrText) {
  const prompt = `Extrae los siguientes datos de este texto OCR de un Documento Personal de Identificación (DPI) de Guatemala. Devuelve SOLO un JSON válido sin explicaciones ni markdown:

{
  "nombre_completo": "NOMBRE APELLIDO APELLIDO (todo en mayúsculas)",
  "cui": "XXXX XXXXX XXXX (formato 4-5-4 con espacios)"
}

Si no logras extraer algún dato, déjalo como "". El CUI/DPI son 13 dígitos. El nombre completo combina nombres y apellidos.

Texto OCR:
"""
${ocrText.slice(0, 4000)}
"""

JSON:`;

  try {
    const result = await window.claude.complete(prompt);
    // Try to extract JSON from result
    const match = result.match(/\{[\s\S]*\}/);
    if (!match) return { nombre_completo: "", cui: "" };
    return JSON.parse(match[0]);
  } catch (e) {
    console.warn("Claude extraction failed:", e);
    return { nombre_completo: "", cui: "" };
  }
}

/* ─── Fallback regex-only extraction ─────────────────── */
function regexExtract(text) {
  // DPI: 13 digits, often with spaces or hyphens
  const dpiMatch = text.match(/(\d{4})\s*[- ]?\s*(\d{5})\s*[- ]?\s*(\d{4})/);
  const cui = dpiMatch ? `${dpiMatch[1]} ${dpiMatch[2]} ${dpiMatch[3]}` : "";
  return { nombre_completo: "", cui };
}

/* ─── Toast ───────────────────────────────────────────── */
function Toast({ message, onDone }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [message]);
  if (!message) return null;
  return <div className="toast">{message}</div>;
}

/* ─── DPI Upload Drop Zone ────────────────────────────── */
function DPIDrop({ onFile, fileUrl, onRemove }) {
  const inputRef = useRef();
  const [drag, setDrag] = useState(false);

  if (fileUrl) {
    return (
      <div className="preview-id">
        <img src={fileUrl} alt="DPI" />
        <button className="remove" onClick={onRemove} title="Quitar">×</button>
      </div>
    );
  }

  return (
    <div
      className={`drop ${drag ? "dragging" : ""}`}
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files[0];
        if (f && f.type.startsWith("image/")) onFile(f);
      }}
    >
      <div className="drop-icon">⌶</div>
      <div className="drop-title">Subir foto del DPI</div>
      <div className="drop-hint">Arrastra una imagen aquí, o haz clic.<br/>Se extraerán nombre y número automáticamente.</div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files[0];
          if (f) onFile(f);
        }}
      />
    </div>
  );
}

/* ─── Main App ────────────────────────────────────────── */
const TIPO_OPCIONES = [
  { value: "limpieza", label: "Limpieza", sub: "Servicios" },
  { value: "mantenimiento", label: "Mantenimiento", sub: "Servicios" },
  { value: "cohosting_individual", label: "Co-hosting individual", sub: "Co-hosting" },
  { value: "cohosting_juridica", label: "Co-hosting jurídica", sub: "Co-hosting" },
  { value: "emp_promocion", label: "Carta de promoción", sub: "Empleados" },
  { value: "emp_contratacion", label: "Contrato laboral", sub: "Empleados" },
  { value: "emp_aumento", label: "Aumento de salario", sub: "Empleados" },
  { value: "emp_goce", label: "Constancia de vacaciones", sub: "Empleados" },
  { value: "emp_bono_estrella", label: "Bono Estrella", sub: "Empleados" },
];

function SectionsEditor({ edits }) {
  const [state, setState] = useState(null);
  useEffect(() => {
    const h = () => setState(window.__saSections || null);
    window.addEventListener("sa-sections", h);
    h();
    const t = setTimeout(h, 400);
    return () => { window.removeEventListener("sa-sections", h); clearTimeout(t); };
  }, []);
  if (!state || !state.secciones || !state.secciones.length) return null;
  const editadas = state.secciones.filter((s) => edits && edits[s.key] != null).length;
  return (
    <details className="section">
      <summary>
        Secciones del documento
        {editadas > 0 && <span className="sum-count">{editadas}</span>}
      </summary>
      <div className="sec-list">
        {state.secciones.map((s) => (
          <button key={s.key} type="button" className="sec-btn" onClick={() => state.abrir(s.key, s.title)}>
            <span className="sec-t">{s.title}</span>
            {edits && edits[s.key] != null && <span className="sec-dot" title="Editada" />}
          </button>
        ))}
      </div>
      <div className="footnote" style={{ marginTop: 10 }}>
        También puedes editar cualquier sección directamente en el documento: pasa el cursor y toca el lápiz.
      </div>
    </details>
  );
}

function Generator({ onSent }) {
  const [tipo, setTipo] = useState("limpieza");
  const [sendOpen, setSendOpen] = useState(false);
  const [datosOpen, setDatosOpen] = useState(false);
  const chPlazo = tipo.endsWith("_lt") ? "largo" : "corto";
  const setPlazo = (p) => {
    const ind = tipo.indexOf("cohosting_individual") === 0;
    setTipo((ind ? "cohosting_individual" : "cohosting_juridica") + (p === "largo" ? "_lt" : ""));
  }; // "limpieza" | "mantenimiento" | "personalizado"
  const [dpiFile, setDpiFile] = useState(null);
  const [dpiUrl, setDpiUrl] = useState(null);
  const [ocrStatus, setOcrStatus] = useState("");
  const [toast, setToast] = useState("");

  // Personalizado contract state (persisted)
  const [custom, setCustom] = useState(() => {
    const saved = localStorage.getItem("spacio_custom_v1");
    return saved ? JSON.parse(saved) : CUSTOM_DEFAULT;
  });
  useEffect(() => {
    localStorage.setItem("spacio_custom_v1", JSON.stringify(custom));
  }, [custom]);

  const [data, setData] = useState(() => {
    const saved = localStorage.getItem(LS_KEY);
    const restored = saved ? JSON.parse(saved) : {};
    return {
      ...SPACIO_DEFAULTS,
      ...COHOSTING_DEFAULTS,
      ...EMPLEADO_DEFAULTS,
      empFechaInicio: todayISO(),
      empFechaEfectiva: todayISO(),
      prestadorNombre: "",
      prestadorDPI: "",
      pagoMonto: tipo === "limpieza" ? "75.00" : "100.00",
      fecha: todayISO(),
      fechaInicio: todayISO(),
      ...restored,
    };
  });

  const isCohosting = tipo.startsWith("cohosting");
  const isJuridica = tipo.indexOf("cohosting_juridica") === 0;
  const isIndividual = tipo.indexOf("cohosting_individual") === 0;
  const isServicios = tipo === "limpieza" || tipo === "mantenimiento" || tipo === "personalizado";
  const isEmpleado = tipo.startsWith("emp_");

  const canGenerate = isEmpleado
    ? !!data.empNombre
    : isServicios
    ? !!(data.prestadorNombre && data.prestadorDPI)
    : isJuridica
    ? !!(data.repNombre && data.repDPI && data.entidadNombre)
    : !!(data.duenoNombre && data.duenoDPI);

  // Update default pago when tipo changes (only if user hasn't customized)
  useEffect(() => {
    setData((d) => {
      const isDefault = d.pagoMonto === "75.00" || d.pagoMonto === "100.00";
      if (!isDefault) return d;
      return { ...d, pagoMonto: tipo === "limpieza" ? "75.00" : "100.00" };
    });
  }, [tipo]);

  // Save key fields to LS (not prestador data — that resets each contract)
  useEffect(() => {
    const persist = {
      contratanteNombre: data.contratanteNombre,
      contratanteEdad: data.contratanteEdad,
      contratanteEstado: data.contratanteEstado,
      contratanteDPI: data.contratanteDPI,
      actaFecha: data.actaFecha,
      actaNotario: data.actaNotario,
      regNumero: data.regNumero,
      regFolio: data.regFolio,
      regLibro: data.regLibro,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(persist));
  }, [data.contratanteNombre, data.contratanteEdad, data.contratanteEstado, data.contratanteDPI,
      data.actaFecha, data.actaNotario, data.regNumero, data.regFolio, data.regLibro]);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  /* Per-clause edits, keyed by contract type → { [clauseKey]: rawText } */
  const [clauseEdits, setClauseEdits] = useState(() => {
    const saved = localStorage.getItem("spacio_clause_edits_v1");
    return saved ? JSON.parse(saved) : {};
  });
  useEffect(() => {
    localStorage.setItem("spacio_clause_edits_v1", JSON.stringify(clauseEdits));
  }, [clauseEdits]);
  const editsForTipo = clauseEdits[tipo] || {};
  const setClauseEdit = (key, value) =>
    setClauseEdits((m) => ({ ...m, [tipo]: { ...(m[tipo] || {}), [key]: value } }));
  const resetClauseEdit = (key) =>
    setClauseEdits((m) => {
      const t = { ...(m[tipo] || {}) };
      delete t[key];
      return { ...m, [tipo]: t };
    });

  /* Handle DPI upload → OCR → extract */
  const handleDPIFile = async (file) => {
    setDpiFile(file);
    setDpiUrl(URL.createObjectURL(file));
    setOcrStatus("ocr");

    try {
      const text = await runOCR(file);
      setOcrStatus("extract");
      // Try Claude first
      let extracted = await extractWithClaude(text);
      // Fallback: regex
      if (!extracted.cui) {
        const rx = regexExtract(text);
        extracted = { ...extracted, ...rx };
      }
      setOcrStatus("");
      const nameField = isEmpleado ? "empNombre" : isCohosting ? (isJuridica ? "repNombre" : "duenoNombre") : "prestadorNombre";
      const dpiField  = isEmpleado ? "empDPI" : isCohosting ? (isJuridica ? "repDPI" : "duenoDPI") : "prestadorDPI";
      setData((d) => ({
        ...d,
        [nameField]: extracted.nombre_completo || d[nameField],
        [dpiField]: extracted.cui || d[dpiField],
      }));
      if (extracted.nombre_completo || extracted.cui) {
        setToast("Datos extraídos. Verifica antes de generar.");
      } else {
        setToast("No se pudieron leer datos. Ingrésalos manualmente.");
      }
    } catch (e) {
      console.error(e);
      setOcrStatus("");
      setToast("Error al procesar el DPI. Ingresa los datos manualmente.");
    }
  };

  const removeDPI = () => {
    if (dpiUrl) URL.revokeObjectURL(dpiUrl);
    setDpiFile(null);
    setDpiUrl(null);
  };

  /* ============================================================
     Generate PDF — high resolution
     Strategy:
       • Hide letterhead <img>s & break markers, then html2canvas
         the content area at 3× (sharper text).
       • For each PDF page, embed the original letterhead JPG
         (full source resolution preserved by jsPDF) and overlay
         the matching slice of the content canvas at:
           page 1 → destY 340 (clears cover logo), height 628
           page N→ destY 240 (clears cont monogram), height 728
     ============================================================ */
  const [generating, setGenerating] = useState(false);
  const generatePDF = async () => {
    setGenerating(true);
    const root = document.getElementById("contract-doc");
    const viewer = root ? root.closest(".doc-viewer-inner") : null;
    const prevTransform = viewer ? viewer.style.transform : null;
    try {
      if (!root) throw new Error("No se encontró el documento");
      root.classList.add("printing");
      if (viewer) viewer.style.transform = "none";

      // Let fonts + membrete images settle before capture
      await new Promise((r) => requestAnimationFrame(r));
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      await new Promise((r) => setTimeout(r, 150));

      const PAGE_W = 816, PAGE_H = 1056;
      const { jsPDF } = window.jspdf;
      const sheets = [...root.querySelectorAll(".sheet")];

      if (sheets.length) {
        // ── Paginated sheets: one html2canvas per page (no slicing) ──
        const pdf = new jsPDF({
          unit: "px", format: [PAGE_W, PAGE_H], orientation: "portrait",
          hotfixes: ["px_scaling"], compress: true,
        });
        for (let i = 0; i < sheets.length; i++) {
          const canvas = await window.html2canvas(sheets[i], {
            scale: 2,
            useCORS: true,
            backgroundColor: "#E8E4DC",
            width: PAGE_W,
            height: PAGE_H,
            windowWidth: PAGE_W,
          });
          const img = canvas.toDataURL("image/jpeg", 0.95);
          if (i > 0) pdf.addPage([PAGE_W, PAGE_H], "portrait");
          pdf.addImage(img, "JPEG", 0, 0, PAGE_W, PAGE_H, undefined, "FAST");
        }
        pdf.save(buildFilename("pdf"));
        setToast("PDF descargado.");
        return;
      }

      // ── Fallback for the editable "Personalizado" contract ──
      const bodyEl = root.querySelector(".page-body");
      if (!bodyEl) throw new Error("No se encontró el área de contenido");
      const letterheads = root.querySelectorAll(".page-letterhead");
      const breaks = root.querySelectorAll(".page-break");
      letterheads.forEach((n) => (n.style.visibility = "hidden"));
      breaks.forEach((n) => (n.style.visibility = "hidden"));
      await new Promise((r) => requestAnimationFrame(r));

      const SCALE = 2;
      const contentCanvas = await window.html2canvas(bodyEl, {
        scale: SCALE, useCORS: true, backgroundColor: null,
        letterRendering: true, windowWidth: bodyEl.offsetWidth,
      });
      letterheads.forEach((n) => (n.style.visibility = ""));
      breaks.forEach((n) => (n.style.visibility = ""));

      const CONTENT_X = 256, CONTENT_WIDTH = 488, COVER_TOP = 340, CONT_TOP = 240;
      const BOTTOM_RESERVE = 150;
      const FIRST_CAP = PAGE_H - BOTTOM_RESERVE;
      const NEXT_CAP = PAGE_H - CONT_TOP - BOTTOM_RESERVE;
      const totalH = bodyEl.offsetHeight;

      const loadImg = (src) => new Promise((res, rej) => {
        const im = new Image(); im.crossOrigin = "anonymous";
        im.onload = () => res(im); im.onerror = rej; im.src = src;
      });
      const cover = await loadImg("assets/letterhead-cover.jpeg");
      const imgURL = (im) => {
        const c = document.createElement("canvas");
        c.width = im.naturalWidth; c.height = im.naturalHeight;
        c.getContext("2d").drawImage(im, 0, 0);
        return c.toDataURL("image/jpeg", 0.92);
      };
      const coverURL = imgURL(cover);
      const slice = (y, h) => {
        const sub = document.createElement("canvas");
        sub.width = Math.round(CONTENT_WIDTH * SCALE);
        sub.height = Math.round(h * SCALE);
        sub.getContext("2d").drawImage(contentCanvas, 0, Math.round(y * SCALE),
          contentCanvas.width, Math.round(h * SCALE), 0, 0, sub.width, sub.height);
        return sub.toDataURL("image/png");
      };
      const pdf = new jsPDF({ unit: "px", format: [PAGE_W, PAGE_H], orientation: "portrait", hotfixes: ["px_scaling"], compress: true });
      let y = 0, idx = 0;
      while (y < totalH - 5) {
        const cap = idx === 0 ? FIRST_CAP : NEXT_CAP;
        const destY = idx === 0 ? 0 : CONT_TOP;
        const h = Math.min(cap, totalH - y);
        if (idx > 0) pdf.addPage([PAGE_W, PAGE_H], "portrait");
        pdf.addImage(coverURL, "JPEG", 0, 0, PAGE_W, PAGE_H, undefined, "FAST");
        pdf.addImage(slice(y, h), "PNG", CONTENT_X, destY, CONTENT_WIDTH, h, undefined, "FAST");
        y += h; idx++;
        if (idx > 30) break;
      }
      pdf.save(buildFilename("pdf"));
      setToast("PDF descargado.");
    } catch (e) {
      console.error(e);
      setToast("Error al generar el PDF: " + (e?.message || "desconocido"));
    } finally {
      if (viewer && prevTransform !== null) viewer.style.transform = prevTransform;
      if (root) root.classList.remove("printing");
      setGenerating(false);
    }
  };

  const buildFilename = (ext = "pdf") => {
    const tipoLabel = tipo === "limpieza" ? "Limpieza"
      : tipo === "mantenimiento" ? "Mantenimiento"
      : tipo === "cohosting_individual" ? "Co-hosting Individual"
      : tipo === "cohosting_individual_lt" ? "Co-hosting Individual LP"
      : tipo === "cohosting_juridica" ? "Co-hosting Jurídica"
      : tipo === "cohosting_juridica_lt" ? "Co-hosting Jurídica LP"
      : tipo === "emp_promocion" ? "Carta de Promoción"
      : tipo === "emp_contratacion" ? "Contrato Laboral"
      : tipo === "emp_aumento" ? "Carta de Aumento"
      : tipo === "emp_goce" ? "Constancia de Vacaciones"
      : tipo === "emp_bono_estrella" ? "Bono Estrella"
      : "Personalizado";
    const sourceName = isEmpleado
      ? data.empNombre
      : isCohosting
      ? (isJuridica ? (data.entidadNombre || data.repNombre) : data.duenoNombre)
      : data.prestadorNombre;
    const name = (sourceName || "Sin Nombre")
      .split(/\s+/).slice(0, 3).join(" ");
    return `Contrato ${tipoLabel} - ${name}.${ext}`;
  };

  /* ── Generate .docx (importable to Google Docs) ── */
  const [generatingDocx, setGeneratingDocx] = useState(false);
  const generateDocx = async () => {
    setGeneratingDocx(true);
    try {
      const blob = await window.generateDocxBlob(tipo, data, custom, editsForTipo);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = buildFilename("docx");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast("Documento descargado. Súbelo a Google Drive y ábrelo con Google Docs.");
    } catch (e) {
      console.error(e);
      setToast("Error al generar el .docx.");
    } finally {
      setGeneratingDocx(false);
    }
  };

  return (
    <div className="app sa-shell-app">
      <aside className="panel">
        <div className="brand">
          <LogoPrimary width={110} />
          <div className="brand-eyebrow">Generador de contratos</div>
          <hr className="brand-line" />
        </div>

        {/* ─── Tipo ─── */}
        <div className="section">
          <div className="section-label"><span className="num">01</span> Tipo de contrato</div>
          <PanelSelect
            block
            icon="file"
            value={tipo.replace("_lt", "")}
            onChange={(v) => setTipo(v.indexOf("cohosting") === 0 && chPlazo === "largo" ? v + "_lt" : v)}
            options={TIPO_OPCIONES}
            searchable={false}
          />
          {isCohosting && (
            <div className="plazo-row">
              <span className="plazo-lbl">Plazo</span>
              <PanelSeg size="sm" value={chPlazo} onChange={setPlazo}
                options={[{ value: "corto", label: "Corto plazo" }, { value: "largo", label: "Largo plazo" }]} />
            </div>
          )}
        </div>

        {/* ─── DPI Upload ─── */}
        <div className="section">
          <div className="section-label"><span className="num">02</span> Documento de identidad</div>
          <DPIDrop fileUrl={dpiUrl} onFile={handleDPIFile} onRemove={removeDPI} />
          {ocrStatus && (
            <div className="extract-status">
              <div className="spinner"></div>
              <span>
                {ocrStatus === "ocr" ? "Leyendo imagen…" : "Extrayendo datos con IA…"}
              </span>
            </div>
          )}
        </div>

        {/* ─── Prestador form (servicios) ─── */}
        {isServicios && (
        <div className="section">
          <div className="section-label"><span className="num">03</span> Datos del prestador</div>
          <div className="field">
            <label>Nombre completo</label>
            <input
              value={data.prestadorNombre}
              placeholder="JOSELYN ANDREA SIAN VÁSQUEZ"
              onChange={(e) => set("prestadorNombre", e.target.value.toUpperCase())}
            />
          </div>
          <div className="field">
            <label>Número de DPI / CUI</label>
            <input
              value={data.prestadorDPI}
              placeholder="3445 93347 0101"
              onChange={(e) => set("prestadorDPI", e.target.value)}
            />
          </div>
        </div>
        )}

        {/* ─── Dueño persona individual ─── */}
        {isIndividual && (
        <div className="section">
          <div className="section-label"><span className="num">03</span> Datos del dueño</div>
          <div className="field">
            <label>Nombre completo</label>
            <input
              value={data.duenoNombre}
              placeholder="NOMBRE DEL DUEÑO"
              onChange={(e) => set("duenoNombre", e.target.value.toUpperCase())}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Edad</label>
              <input value={data.duenoEdad} placeholder="38"
                onChange={(e) => set("duenoEdad", e.target.value)} />
            </div>
            <div className="field">
              <label>Estado civil</label>
              <input value={data.duenoEstado} placeholder="Casado(a)"
                onChange={(e) => set("duenoEstado", e.target.value)} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Nacionalidad</label>
              <input value={data.duenoNacionalidad} placeholder="guatemalteco(a)"
                onChange={(e) => set("duenoNacionalidad", e.target.value)} />
            </div>
            <div className="field">
              <label>Profesión u oficio</label>
              <input value={data.duenoProfesion} placeholder="comerciante"
                onChange={(e) => set("duenoProfesion", e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Domicilio</label>
            <input value={data.duenoDomicilio} placeholder="de este domicilio"
              onChange={(e) => set("duenoDomicilio", e.target.value)} />
          </div>
          <div className="field">
            <label>Número de DPI / CUI</label>
            <input value={data.duenoDPI} placeholder="1603 66798 0101"
              onChange={(e) => set("duenoDPI", e.target.value)} />
          </div>
        </div>
        )}

        {/* ─── Representante legal + sociedad (jurídica) ─── */}
        {isJuridica && (
        <>
        <div className="section">
          <div className="section-label"><span className="num">03</span> Representante legal</div>
          <div className="field">
            <label>Nombre completo</label>
            <input
              value={data.repNombre}
              placeholder="NOMBRE DEL REPRESENTANTE"
              onChange={(e) => set("repNombre", e.target.value.toUpperCase())}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Edad</label>
              <input value={data.repEdad} placeholder="38"
                onChange={(e) => set("repEdad", e.target.value)} />
            </div>
            <div className="field">
              <label>Estado civil</label>
              <input value={data.repEstado} placeholder="Casado(a)"
                onChange={(e) => set("repEstado", e.target.value)} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Nacionalidad</label>
              <input value={data.repNacionalidad} placeholder="guatemalteco(a)"
                onChange={(e) => set("repNacionalidad", e.target.value)} />
            </div>
            <div className="field">
              <label>Domicilio</label>
              <input value={data.repDomicilio} placeholder="Guatemala"
                onChange={(e) => set("repDomicilio", e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Número de DPI / CUI</label>
            <input value={data.repDPI} placeholder="1603 66798 0101"
              onChange={(e) => set("repDPI", e.target.value)} />
          </div>
        </div>
        <div className="section">
          <div className="section-label"><span className="num">04</span> Sociedad o entidad</div>
          <div className="field">
            <label>Nombre de la entidad</label>
            <input value={data.entidadNombre} placeholder="IDEA CENTRAL, SOCIEDAD ANÓNIMA"
              onChange={(e) => set("entidadNombre", e.target.value.toUpperCase())} />
          </div>
        </div>
        </>
        )}

        {/* ─── Datos del empleado ─── */}
        {isEmpleado && (
        <div className="section">
          <div className="section-label"><span className="num">03</span> Datos del empleado</div>
          <div className="field">
            <label>Nombre completo</label>
            <input value={data.empNombre} placeholder="GABRIEL ASTURIAS MOREIRA"
              onChange={(e) => set("empNombre", e.target.value.toUpperCase())} />
          </div>
          <div className="field">
            <label>Número de DPI / CUI</label>
            <input value={data.empDPI} placeholder="3057 90773 0301"
              onChange={(e) => set("empDPI", e.target.value)} />
          </div>
          {(tipo === "emp_contratacion" || tipo === "emp_goce") && (
            <div className="field-row">
              <div className="field"><label>Edad</label>
                <input value={data.empEdad} placeholder="24" onChange={(e) => set("empEdad", e.target.value)} /></div>
              <div className="field"><label>Estado civil</label>
                <input value={data.empEstado} placeholder="Soltero(a)" onChange={(e) => set("empEstado", e.target.value)} /></div>
            </div>
          )}
          {tipo === "emp_contratacion" && (
            <>
              <div className="field-row">
                <div className="field"><label>Nacionalidad</label>
                  <input value={data.empNacionalidad} onChange={(e) => set("empNacionalidad", e.target.value)} /></div>
                <div className="field"><label>Profesión u oficio</label>
                  <input value={data.empProfesion} placeholder="Bachiller" onChange={(e) => set("empProfesion", e.target.value)} /></div>
              </div>
              <div className="field"><label>Domicilio</label>
                <input value={data.empDomicilio} placeholder="Jocotenango, Sacatepéquez" onChange={(e) => set("empDomicilio", e.target.value)} /></div>
            </>
          )}
        </div>
        )}

        {/* ─── Información de la propiedad (co-hosting) ─── */}
        {isCohosting && (
        <div className="section">
          <div className="section-label">
            <span className="num">{isJuridica ? "05" : "04"}</span> Información de la propiedad
          </div>
          <div className="field">
            <label>Dirección</label>
            <input value={data.propDireccion} placeholder="2ª Avenida 7-11, Zona 10, Ciudad de Guatemala"
              onChange={(e) => set("propDireccion", e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field">
              <label>No. de apartamento</label>
              <input value={data.propApto} placeholder="905"
                onChange={(e) => set("propApto", e.target.value)} />
            </div>
            <div className="field">
              <label>Nivel / piso</label>
              <input value={data.propPiso} placeholder="9"
                onChange={(e) => set("propPiso", e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Nombre del edificio</label>
            <input value={data.propEdificio} placeholder="Brunelo"
              onChange={(e) => set("propEdificio", e.target.value)} />
          </div>
        </div>
        )}

        {/* ─── Contract details ─── */}
        <div className="section">
          <div className="section-label">
            <span className="num">{(isServicios || isEmpleado) ? "04" : isJuridica ? "06" : "05"}</span> Detalles del contrato
          </div>
          {isServicios ? (
            <div className="field-row">
              <div className="field">
                <label>Fecha del contrato</label>
                <input
                  type="date"
                  value={data.fecha}
                  onChange={(e) => set("fecha", e.target.value)}
                />
              </div>
              <div className="field">
                <label>Pago (Q)</label>
                <input
                  value={data.pagoMonto}
                  onChange={(e) => set("pagoMonto", e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="field">
              <label>Fecha del contrato</label>
              <input
                type="date"
                value={data.fecha}
                onChange={(e) => set("fecha", e.target.value)}
              />
            </div>
          )}
          {tipo === "mantenimiento" && (
            <div className="field">
              <label>Fecha de inicio del servicio</label>
              <input
                type="date"
                value={data.fechaInicio}
                onChange={(e) => set("fechaInicio", e.target.value)}
              />
            </div>
          )}
          {isCohosting && !tipo.endsWith("_lt") && (
            <div className="field">
              <label>Presupuesto mensual de insumos (Q)</label>
              <input
                value={data.presupuestoInsumos}
                placeholder="1,050.00"
                onChange={(e) => set("presupuestoInsumos", e.target.value)}
              />
            </div>
          )}
          {tipo === "personalizado" && (
            <button
              type="button"
              className="add-clause"
              style={{ marginTop: 6 }}
              onClick={() => {
                if (confirm("¿Restablecer la plantilla del contrato personalizado? Se perderán los cambios.")) {
                  setCustom({ ...CUSTOM_DEFAULT, intro: buildDefaultIntro(data) });
                  setToast("Plantilla restablecida.");
                }
              }}
            >
              ↺ Restablecer plantilla
            </button>
          )}
          {tipo === "emp_contratacion" && (
            <>
              <div className="field"><label>Cargo</label>
                <input value={data.empCargo} placeholder="Happiness Hero" onChange={(e) => set("empCargo", e.target.value)} /></div>
              <div className="field"><label>Salario mensual (Q)</label>
                <input value={data.empSalario} placeholder="3,124.42" onChange={(e) => set("empSalario", e.target.value)} /></div>
              <div className="field"><label>Fecha de inicio de la relación laboral</label>
                <input type="date" value={data.empFechaInicio} onChange={(e) => set("empFechaInicio", e.target.value)} /></div>
              <div className="field"><label>Lugar de prestación de servicios</label>
                <input value={data.empLugarTrabajo} onChange={(e) => set("empLugarTrabajo", e.target.value)} /></div>
            </>
          )}
          {tipo === "emp_promocion" && (
            <>
              <div className="field"><label>Cargo anterior</label>
                <input value={data.empCargoAnterior} placeholder="Anfitrión" onChange={(e) => set("empCargoAnterior", e.target.value)} /></div>
              <div className="field"><label>Nuevo cargo</label>
                <input value={data.empCargo} placeholder="Happiness Hero" onChange={(e) => set("empCargo", e.target.value)} /></div>
              <div className="field"><label>Nuevo salario mensual (Q)</label>
                <input value={data.empSalario} placeholder="5,000.00" onChange={(e) => set("empSalario", e.target.value)} /></div>
              <div className="field"><label>Fecha efectiva</label>
                <input type="date" value={data.empFechaEfectiva} onChange={(e) => set("empFechaEfectiva", e.target.value)} /></div>
            </>
          )}
          {tipo === "emp_aumento" && (
            <>
              <div className="field"><label>Cargo</label>
                <input value={data.empCargo} placeholder="Happiness Hero" onChange={(e) => set("empCargo", e.target.value)} /></div>
              <div className="field-row">
                <div className="field"><label>Salario anterior (Q)</label>
                  <input value={data.empSalarioAnterior} placeholder="3,124.42" onChange={(e) => set("empSalarioAnterior", e.target.value)} /></div>
                <div className="field"><label>Nuevo salario (Q)</label>
                  <input value={data.empSalario} placeholder="4,000.00" onChange={(e) => set("empSalario", e.target.value)} /></div>
              </div>
              <div className="field"><label>Fecha efectiva</label>
                <input type="date" value={data.empFechaEfectiva} onChange={(e) => set("empFechaEfectiva", e.target.value)} /></div>
            </>
          )}
          {tipo === "emp_goce" && (
            <>
              <div className="field"><label>Cargo</label>
                <input value={data.empCargo} placeholder="Happiness Hero" onChange={(e) => set("empCargo", e.target.value)} /></div>
              <div className="field"><label>Fecha de ingreso</label>
                <input type="date" value={data.empFechaInicio} onChange={(e) => set("empFechaInicio", e.target.value)} /></div>
              <div className="field-row">
                <div className="field"><label>Período laboral — inicio</label>
                  <input type="date" value={data.vacPeriodoInicio} onChange={(e) => set("vacPeriodoInicio", e.target.value)} /></div>
                <div className="field"><label>Período laboral — fin</label>
                  <input type="date" value={data.vacPeriodoFin} onChange={(e) => set("vacPeriodoFin", e.target.value)} /></div>
              </div>
            </>
          )}
          {tipo === "emp_bono_estrella" && (
            <div className="field"><label>Rol / puesto evaluado</label>
              <input value={data.empRol} placeholder="Happiness Hero" onChange={(e) => set("empRol", e.target.value)} /></div>
          )}
        </div>

        {/* ─── Secciones editables ─── */}
        <SectionsEditor edits={editsForTipo} />

        {/* ─── Spacio AM (rarely changes) ─── */}
        <details className="section" style={{ marginTop: 22 }}>
          <summary>
            <span className="num">{(isServicios || isEmpleado) ? "05" : isJuridica ? "07" : "06"}</span> Datos de Spacio AM
          </summary>
          <div className="field">
            <label>Nombre del representante</label>
            <input
              value={data.contratanteNombre}
              onChange={(e) => set("contratanteNombre", e.target.value.toUpperCase())}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Edad</label>
              <input
                value={data.contratanteEdad}
                onChange={(e) => set("contratanteEdad", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Estado civil</label>
              <input
                value={data.contratanteEstado}
                onChange={(e) => set("contratanteEstado", e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>DPI / CUI</label>
            <input
              value={data.contratanteDPI}
              onChange={(e) => set("contratanteDPI", e.target.value)}
            />
          </div>
          {(isCohosting || isEmpleado || isServicios) && (
            <>
              <div className="field">
                <label>Fecha del acta notarial</label>
                <input
                  value={data.actaFecha}
                  onChange={(e) => set("actaFecha", e.target.value)}
                />
              </div>
              <div className="field">
                <label>Notario</label>
                <input
                  value={data.actaNotario}
                  onChange={(e) => set("actaNotario", e.target.value)}
                />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Reg. número</label>
                  <input
                    value={data.regNumero}
                    onChange={(e) => set("regNumero", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Folio</label>
                  <input
                    value={data.regFolio}
                    onChange={(e) => set("regFolio", e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Libro</label>
                  <input
                    value={data.regLibro}
                    onChange={(e) => set("regLibro", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </details>

        {/* ─── Enviar / generar ─── */}
        <button
          className="btn-primary"
          disabled={generating || generatingDocx || !canGenerate}
          onClick={() => setSendOpen(true)}
        >
          <Star size={11} color="currentColor" />
          Enviar para firma
        </button>
        <button
          className="btn-secondary"
          disabled={generating || generatingDocx || !canGenerate}
          onClick={generatePDF}
        >
          {generating ? "Generando…" : "PDF"}
        </button>
        <button
          className="btn-secondary"
          disabled={generating || generatingDocx || !canGenerate}
          onClick={generateDocx}
          title="Descarga un .docx que puedes subir a Google Drive y abrir con Google Docs para editar libremente."
        >
          {generatingDocx ? "Generando…" : "Google Docs (.docx)"}
        </button>

        <button
          className="btn-secondary"
          disabled={generating || generatingDocx}
          onClick={() => setDatosOpen(true)}
          title="Envía un correo pidiendo los datos que faltan para redactar el documento."
        >
          Pedir datos
        </button>

        <div className="footnote">
          La opción principal envía el contrato por correo para revisión y firma
          electrónica; el PDF y el .docx quedan disponibles para uso interno.
          El contrato se previsualiza a la derecha. Puedes editar cualquier
          texto directamente sobre el documento antes de generarlo. Las áreas
          con tinte ámbar son editables. El PDF se descarga con la fecha del día.
        </div>
      </aside>

      {/* ─── Viewer ─── */}
      <main className="viewer">
        <DocViewer>
          <div id="contract-doc">
            <ContractDoc
              tipo={tipo}
              data={data}
              custom={custom}
              setCustom={setCustom}
              edits={editsForTipo}
              onEdit={setClauseEdit}
              onReset={resetClauseEdit}
            />
          </div>
        </DocViewer>
      </main>

      <SendModal
        open={sendOpen}
        tipo={tipo}
        data={data}
        custom={custom}
        edits={editsForTipo}
        sugerido={isEmpleado ? data.empNombre : isCohosting ? (isJuridica ? data.repNombre : data.duenoNombre) : data.prestadorNombre}
        onClose={() => setSendOpen(false)}
        onSent={(doc) => { setSendOpen(false); if (onSent) onSent(doc); else setToast("Enviado a " + doc.firmanteEmail); }}
      />

      <DataRequestModal
        open={datosOpen}
        tipo={tipo}
        sugerido={isEmpleado ? data.empNombre : isCohosting ? (isJuridica ? data.repNombre : data.duenoNombre) : data.prestadorNombre}
        onClose={() => setDatosOpen(false)}
        onSent={(correo) => { setDatosOpen(false); setToast("Solicitud de datos enviada a " + correo + "."); }}
      />

      <Toast message={toast} onDone={() => setToast("")} />
    </div>
  );
}

/* ─── Scales the document so it fits the viewer area ─── */
function DocViewer({ children }) {
  const outer = useRef(null);
  const inner = useRef(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(0);

  React.useLayoutEffect(() => {
    const update = () => {
      if (!outer.current || !inner.current) return;
      const parent = outer.current.parentElement;
      if (!parent) return;
      const avail = parent.clientWidth - 96;
      if (avail <= 0) return;
      const s = Math.min(1, avail / 816);
      setScale(s);
      setHeight(inner.current.scrollHeight * s);
    };
    update();
    const ro = new ResizeObserver(update);
    if (outer.current?.parentElement) ro.observe(outer.current.parentElement);
    if (inner.current) ro.observe(inner.current);
    window.addEventListener("resize", update);
    // run once more after fonts/layout settle
    const t = setTimeout(update, 300);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      clearTimeout(t);
    };
  }, [children]);

  return (
    <div ref={outer} style={{ width: 816 * scale, height, position: "relative" }}>
      <div
        ref={inner}
        className="doc-viewer-inner"
        style={{
          width: 816,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          position: "absolute",
          top: 0, left: 0,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {children}
      </div>
    </div>
  );
}

Object.assign(window, { Generator, Toast, DocViewer });
