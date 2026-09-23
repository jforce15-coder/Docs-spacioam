/* ============================================================
   SPACIO AM — Cartas
   Machote de carta formal en membrete, firmada SOLO por Spacio AM.
   Misma estructura que la carta de promoción: título en serif arriba,
   fecha, destinatario, saludo, cuerpo, despedida y la firma al final.
   El título también es el nombre del documento y del PDF.
   El cuerpo completo se puede editar sobre la hoja (lápiz).
   ============================================================ */

const CARTA_DEFAULTS = {
  cartaTitulo: "Carta de recomendación",
  cartaAtencion: "Administración\nCondominio Serena de Arrazola",
  cartaSaludo: "Estimados señores:",
  cartaCuerpo: [
    "Por medio de la presente, nosotros en Spacio AM extendemos esta carta de recomendación a favor del señor **Juan Pablo Cortés Soto**, de nacionalidad **chilena** y con pasaporte número **F56188393**, quien ocupó una de nuestras propiedades ubicada en **Andares, zona 12**.",
    "Durante todo el tiempo que estuvo con nosotros, se desempeñó como un **excelente inquilino**. Mantuvo la propiedad en muy buen estado, fue respetuoso con las normas de convivencia y con las áreas comunes, y en todo momento demostró responsabilidad, orden y una comunicación cordial.",
    "No dudamos en recomendarlo como un **inquilino ejemplar**, y confiamos en que será un excelente aporte para su comunidad.",
    "Quedamos a su entera disposición para ampliar cualquier información que consideren necesaria.",
  ].join("\n\n"),
  cartaDespedida: "Atentamente,",
  cartaFirmaNombre: "Juan Francisco Ovalle Lanuza",
  cartaFirmaCargo: "CEO – Spacio AM",
  cartaFirmaTel: "56909499",
  cartaFirmaCorreo: "jovalle@spacioam.com",
};

const cartaPh = (v, p) => (v === undefined || v === null || String(v).trim() === "") ? `⟦${p}⟧` : String(v);
const cartaLines = (s) => String(s || "").split(/\n/).map((l) => l.trim()).filter(Boolean);
/* Párrafos del cuerpo: una línea en blanco los separa; cada línea en blanco
   adicional es un espacio extra; un salto sencillo se respeta. */
const cartaBody = (s) => (window.parseRaw ? window.parseRaw(s) : String(s || "").split(/\n\s*\n/).filter(Boolean).map((t) => ({ t: "p", text: t.trim() })));

function buildCarta(d) {
  const atencion = cartaLines(d.cartaAtencion);
  const cuerpo = cartaBody(d.cartaCuerpo);
  const extra = [
    d.cartaFirmaTel ? "Teléfono: " + d.cartaFirmaTel : "",
    d.cartaFirmaCorreo ? "Correo: " + d.cartaFirmaCorreo : "",
  ].filter(Boolean);
  return {
    title: cartaPh(d.cartaTitulo, "Título de la carta"),
    body: [
      { t: "p", text: `Guatemala, ${d.fecha ? formatLongDate(d.fecha) : "⟦fecha⟧"}.` },
      { t: "p", text: "**A la atención de:**\n" + (atencion.length ? atencion.map((l) => "**" + l + "**").join("\n") : "⟦destinatario⟧") },
      { t: "p", text: cartaPh(d.cartaSaludo, "saludo") },
      ...(cuerpo.length ? cuerpo : [{ t: "p", text: "⟦cuerpo de la carta⟧" }]),
      { t: "p", text: cartaPh(d.cartaDespedida, "despedida") },
    ],
    signatures: {
      date: "",
      parties: [
        { name: cartaPh(d.cartaFirmaNombre, "NOMBRE DE QUIEN FIRMA"), role: d.cartaFirmaCargo || "Spacio AM", extra },
      ],
    },
  };
}

const CARTA_BUILDERS = { carta: buildCarta };

function ContratoCarta({ tipo, data, edits, onEdit, onReset }) {
  const build = CARTA_BUILDERS[tipo];
  if (!build) return null;
  return <PaginatedContract contract={build(data)} edits={edits} onEdit={onEdit} onReset={onReset} />;
}

/* ─── Firma de la carta: solo Spacio AM ─────────────────────
   Crea el documento en el registro, lo firma Spacio AM, lo cierra
   y descarga el PDF. No hay firmantes externos ni correo de firma. */
function CartaSignModal({ open, data, edits, onClose, onDone }) {
  const [busy, setBusy] = React.useState("");
  if (!open) return null;
  const F = window.Docs;
  const firmante = { id: "spacio", nombre: data.cartaFirmaNombre || data.contratanteNombre, email: (data.cartaFirmaCorreo || "jovalle@spacioam.com").toLowerCase() };

  const firmar = async ({ img, metodo }) => {
    const S = window.SpacioSync;
    setBusy("Guardando…");
    const doc = F.create({
      tipo: "carta", data, edits,
      nombre: data.cartaTitulo || "Carta",
      firmantes: [],
      firmanteNombre: "Spacio AM",
      contraparteNombre: firmante.nombre,
      contraparteEmail: firmante.email,
    });
    let sync = null;
    if (S) sync = await S.push("crear", doc);
    const d = F.signSpacio(doc.id, { img, metodo });
    if (S) await S.push("firmar", d);
    setBusy("Descargando PDF…");
    try { await window.downloadSignedPdf(d); } catch (e) { console.error(e); }
    setBusy("");
    onDone(d, { ok: true, carta: true, sync });
  };

  return (
    <window.SignLightbox doc={{ folio: "Carta nueva" }} firmante={firmante} porSpacio busy={busy} onClose={onClose} onFirmar={firmar} />
  );
}

Object.assign(window, { CARTA_DEFAULTS, CARTA_BUILDERS, buildCarta, ContratoCarta, CartaSignModal });
