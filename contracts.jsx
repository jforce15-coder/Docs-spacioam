/* ============================================================
   SPACIO AM — Contract templates
   ALL contracts render as a single `.page.grow` with content
   flowing freely; the PDF generator paginates Letter-sized
   pages with the appropriate letterhead on each.
   ============================================================ */

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function formatLongDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${y}`;
}
function formatLongDateCap(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  const mes = MESES[m - 1];
  return `${d} de ${mes[0].toUpperCase() + mes.slice(1)} ${y}`;
}

/* ─── Flowing page shell with letterhead chrome ─────────── */
/* The first 1056px shows the cover letterhead; every 1056px
   beyond that gets a `cont` letterhead and a page-break marker. */
function FlowingPage({ children }) {
  const [pageCount, setPageCount] = React.useState(1);
  const bodyRef = React.useRef(null);

  React.useLayoutEffect(() => {
    const measure = () => {
      if (!bodyRef.current) return;
      const total = bodyRef.current.offsetHeight + 340; // include the cover header
      const next = Math.max(1, Math.ceil(total / 1056));
      setPageCount(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (bodyRef.current) ro.observe(bodyRef.current);
    return () => ro.disconnect();
  }, [children]);

  return (
    <div
      className="page grow"
      data-letterhead="cover"
      style={{ minHeight: 1056 * pageCount }}
    >
      {/* Letterhead overlays */}
      {Array.from({ length: pageCount }).map((_, i) => (
        <img
          key={i}
          className="page-letterhead"
          src={i === 0 ? "assets/letterhead-cover.jpeg" : "assets/letterhead-cont.jpeg"}
          alt=""
          style={{ top: i * 1056 }}
        />
      ))}

      {/* Page-break markers (between pages, not before first) */}
      {Array.from({ length: pageCount - 1 }).map((_, i) => (
        <div
          key={`pb-${i}`}
          className="page-break"
          style={{ top: (i + 1) * 1056 }}
        >
          <span className="page-break-label">Página {i + 2}</span>
        </div>
      ))}

      <div className="page-body" ref={bodyRef}>{children}</div>
    </div>
  );
}

/* ─── Clause shorthand ────────────────────────────────── */
function Clause({ ord, label, children }) {
  return (
    <div className="clause">
      <div className="clause-h">
        <span className="ord">{ord}</span>
        {label && <span className="label">{label}</span>}
      </div>
      {children}
    </div>
  );
}

/* ─── Shared intro paragraph ──────────────────────────── */
function Intro({ data, kind }) {
  const tipoLabel = kind === "limpieza"
    ? "PRESTACIÓN DE SERVICIOS DE LIMPIEZA"
    : "PRESTACIÓN DE SERVICIOS DE MANTENIMIENTO";
  return (
    <p>
      El presente contrato se celebra en la ciudad de Guatemala, el{" "}
      <strong>{formatLongDateCap(data.fecha)}</strong>, entre: por una parte{" "}
      <strong>{data.prestadorNombre || "—"}</strong> (en adelante "EL PRESTADOR")
      quien se identifica con el Documento Personal de Identificación número{" "}
      <strong>{data.prestadorDPI || "—"}</strong> extendido por el Registro
      Nacional de las Personas de la República de Guatemala, quien actúa en su
      calidad de PERSONA INDIVIDUAL; y por otra parte, el señor{" "}
      <strong>{data.contratanteNombre}</strong> de {data.contratanteEdad} años,{" "}
      {data.contratanteEstado}, guatemalteco, comerciante, de este domicilio,
      portador del Documento Personal de Identificación con Código Único de
      Identificación número <strong>{data.contratanteDPI}</strong> extendido
      por el Registro Nacional de las Personas de la República de Guatemala,
      quien actúa en su calidad de ADMINISTRADOR ÚNICO Y REPRESENTANTE LEGAL
      de la entidad <strong>SPACIO AM, SOCIEDAD ANÓNIMA</strong> (en adelante
      "EL CONTRATANTE"). Declaran ambos comparecientes que se conocen
      mutuamente, que reconocen y aceptan la calidad con que actúa cada uno,
      siendo la representación amplia y suficiente conforme la ley y a su
      juicio para otorgar el presente contrato. Los comparecientes en el libre
      ejercicio de nuestros derechos civiles manifestamos que celebramos el
      CONTRATO DE {tipoLabel} que se contiene en las siguientes cláusulas:
    </p>
  );
}

/* ─── Shared signature block ──────────────────────────── */
function Signatures({ data }) {
  return (
    <div className="sig-block">
      <div className="sig-date">
        Guatemala, {formatLongDate(data.fecha)}.
      </div>

      <div className="sig-row">
        <div className="sig-line">
          <div className="sig-name">{data.prestadorNombre || "—"}</div>
          <div className="sig-role">El Prestador</div>
        </div>
      </div>

      <div className="sig-row">
        <div className="sig-line">
          <div className="sig-name">{data.contratanteNombre}</div>
          <div className="sig-role">El Contratante · Spacio AM, S.A.</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Closing clause ──────────────────────────────────── */
function ClosingClause({ ord = "Décima Primera" }) {
  return (
    <Clause ord={ord} label="">
      <p>
        Declaramos los comparecientes en las calidades con que actuamos, que
        en los términos consignados aceptamos el contenido íntegro del
        presente instrumento por ser la expresión fiel y clara de la voluntad
        que hemos manifestado. Hacemos constar lo siguiente:{" "}
        <strong>I.</strong> Que hemos tenido a la vista los documentos con que
        cada compareciente acredita la representación que ejerce; y{" "}
        <strong>II.</strong> Que hemos leído lo escrito y bien impuestos de su
        contenido, validez, objeto, efectos legales y obligación de registro,
        lo ratificamos, aceptamos y firmamos electrónicamente.
      </p>
    </Clause>
  );
}

/* ============================================================
   SERVICE CONTRACTS — block-structured (paginated sheets)
   ============================================================ */
const _svB = (v) => `**${v}**`;
const _svPh = (v, p) => (v === undefined || v === null || v === "") ? `⟦${p || "—"}⟧` : String(v);
const _svBph = (v, p) => (v === undefined || v === null || v === "") ? `⟦${p || "—"}⟧` : `**${v}**`;

function _svcIntro(d, kind) {
  const tipo = kind === "limpieza"
    ? "PRESTACIÓN DE SERVICIOS DE LIMPIEZA"
    : "PRESTACIÓN DE SERVICIOS DE MANTENIMIENTO";
  return `El presente contrato se celebra en la ciudad de Guatemala, el ${_svB(formatLongDateCap(d.fecha))}, entre: por una parte ${_svBph(d.prestadorNombre, "NOMBRE COMPLETO")} (en adelante "EL PRESTADOR") quien se identifica con el Documento Personal de Identificación número ${_svBph(d.prestadorDPI, "DPI")} extendido por el Registro Nacional de las Personas de la República de Guatemala, quien actúa en su calidad de PERSONA INDIVIDUAL; y por otra parte, el señor ${_svB(d.contratanteNombre)} de ${d.contratanteEdad} años, ${d.contratanteEstado}, guatemalteco, comerciante, de este domicilio, portador del Documento Personal de Identificación con Código Único de Identificación número ${_svB(d.contratanteDPI)} extendido por el Registro Nacional de las Personas de la República de Guatemala, quien actúa en su calidad de ADMINISTRADOR ÚNICO Y REPRESENTANTE LEGAL de la entidad ${_svB("SPACIO AM, SOCIEDAD ANÓNIMA")} (en adelante "EL CONTRATANTE"). Declaran ambos comparecientes que se conocen mutuamente, que reconocen y aceptan la calidad con que actúa cada uno, siendo la representación amplia y suficiente conforme la ley y a su juicio para otorgar el presente contrato. Los comparecientes en el libre ejercicio de nuestros derechos civiles manifestamos que celebramos el CONTRATO DE ${tipo} que se contiene en las siguientes cláusulas:`;
}

function _svcClosing(ord) {
  return { ord, label: "Declaración final.", blocks: [
    { t: "p", text: `Declaramos los comparecientes en las calidades con que actuamos, que en los términos consignados aceptamos el contenido íntegro del presente instrumento por ser la expresión fiel y clara de la voluntad que hemos manifestado. Hacemos constar lo siguiente: ${_svB("I.")} Que hemos tenido a la vista los documentos con que cada compareciente acredita la representación que ejerce; y ${_svB("II.")} Que hemos leído lo escrito y bien impuestos de su contenido, validez, objeto, efectos legales y obligación de registro, lo ratificamos, aceptamos y firmamos electrónicamente.` },
  ]};
}

function _svcSig(d) {
  return {
    date: `Guatemala, ${formatLongDate(d.fecha)}.`,
    parties: [
      { name: d.prestadorNombre || "⟦NOMBRE COMPLETO⟧", role: "El Prestador" },
      { name: d.contratanteNombre, role: "El Contratante · Spacio AM, S.A." },
    ],
  };
}

function buildLimpieza(d) {
  return {
    title: "Contrato de Prestación de Servicios de Limpieza",
    intro: _svcIntro(d, "limpieza"),
    clauses: [
      { ord: "Primera", label: "Objeto del contrato.", blocks: [
        { t: "p", text: `EL CONTRATANTE contrata a EL PRESTADOR para realizar servicios de limpieza general y profunda en apartamentos destinados a plataformas como Airbnb y otras similares. Los servicios serán realizados conforme a las especificaciones establecidas por EL CONTRATANTE.` },
      ]},
      { ord: "Segunda", label: "Naturaleza del contrato.", blocks: [
        { t: "ul", items: [
          `Este es un contrato por servicios prestados, por lo que EL PRESTADOR recibirá un pago únicamente por cada limpieza efectuada y no constituye una relación laboral.`,
          `EL PRESTADOR acepta que el pago será realizado semanalmente, sumando el total de servicios realizados.`,
        ]},
      ]},
      { ord: "Tercera", label: "Alcance de los servicios.", blocks: [
        { t: "ul", items: [
          `${_svB("Tareas básicas de limpieza:")} quitar el polvo, pasar la aspiradora, fregar el suelo, limpiar los baños, desinfectar superficies y limpiar la cocina.`,
          `${_svB("Tareas de cambio:")} lavado y cambio de sábanas, reposición de toallas, vaciado de papeleras y reposición de suministros esenciales.`,
          `${_svB("Limpieza profunda:")} limpieza de ventanas, eliminación de sarro, limpieza de alfombras, azulejos y electrodomésticos.`,
          `${_svB("Repasos y tareas específicas:")} en algunos casos, en lugar de una limpieza completa, se podrá solicitar un repaso rápido (quitar polvo, barrer y trapear) en varios apartamentos dentro de la franja horaria asignada.`,
          `${_svB("Mantenimiento de exteriores (cuando aplique):")} barrer patios, limpiar muebles de exterior o mantener zonas comunes como la piscina.`,
        ]},
      ]},
      { ord: "Cuarta", label: "Condiciones de trabajo y coordinación.", blocks: [
        { t: "ul", items: [
          `${_svB("Horarios:")} la jornada estándar será de 4 horas, siendo el horario más común de 11:00 a.m. a 3:00 p.m., pero podrá ser modificado previo acuerdo entre ambas partes en caso de eventualidades o necesidades específicas.`,
          `${_svB("Capacitación:")} EL CONTRATANTE podrá enviar a una persona para ser entrenada y acompañada por EL PRESTADOR durante la realización de las tareas.`,
          `${_svB("Flexibilidad en servicios:")} EL CONTRATANTE podrá solicitar que una limpieza programada se enfoque exclusivamente en tareas específicas o en una limpieza profunda, siempre dentro de la franja horaria establecida.`,
          `${_svB("Tareas adicionales:")} si se termina una limpieza antes del tiempo estimado, EL CONTRATANTE podrá solicitar un repaso en un apartamento cercano sin costo adicional, siempre y cuando no se abuse del horario.`,
        ]},
      ]},
      { ord: "Quinta", label: "Condiciones de pago.", blocks: [
        { t: "ul", items: [
          `El pago será de ${_svB("Q" + _svPh(d.pagoMonto, "monto") + " por apartamento limpiado.")}`,
          `Si una limpieza es cancelada antes de las ${_svB("9:00 a.m.")}, no se efectuará ningún pago.`,
          `Si la cancelación ocurre después de las ${_svB("9:00 a.m.")}, EL PRESTADOR recibirá el ${_svB("50% del pago")}, salvo que la limpieza sea reprogramada para realizarse ese mismo día en otra propiedad cercana.`,
        ]},
      ]},
      { ord: "Sexta", label: "Evaluación y calidad del servicio.", blocks: [
        { t: "ul", items: [
          `${_svB("Estándares:")} EL PRESTADOR deberá cumplir con los estándares de limpieza establecidos por EL CONTRATANTE.`,
          `${_svB("Garantía:")} si un huésped presenta una queja y EL CONTRATANTE determina que es responsabilidad de EL PRESTADOR, deberá realizarse una limpieza de repaso el mismo día sin costo alguno.`,
          `${_svB("Evaluación de desempeño:")} EL CONTRATANTE llevará un sistema de ranking basado en puntualidad, calidad de limpieza y cumplimiento de estándares. Quienes tengan mejores resultados serán priorizados para asignaciones futuras.`,
        ]},
      ]},
      { ord: "Séptima", label: "Obligaciones del prestador.", blocks: [
        { t: "p", text: _svB("Comunicación y reportes:") },
        { t: "ul", items: [
          `Notificar inmediatamente sobre cualquier daño en el apartamento.`,
          `Informar sobre objetos olvidados por los huéspedes.`,
          `Avisar con antelación sobre cualquier atraso en el servicio.`,
        ]},
        { t: "p", text: _svB("Trato con huéspedes:") },
        { t: "ul", items: [
          `Mantener siempre un trato amable y cortés.`,
          `En caso de conflictos, debe comunicarse directamente con EL CONTRATANTE para manejar la situación.`,
        ]},
        { t: "p", text: _svB("Insumos:") },
        { t: "ul", items: [
          `Solicitar los insumos necesarios a tiempo.`,
          `Recibirlos y garantizar su reposición adecuada en el apartamento.`,
        ]},
        { t: "p", text: _svB("Reparaciones menores:") },
        { t: "p", text: `aunque EL PRESTADOR no está obligado a realizar mantenimientos, se espera que pueda hacer pruebas básicas e intentar reparar problemas menores que no requieran un técnico especializado.` },
      ]},
      { ord: "Octava", label: "Rescisión del contrato.", blocks: [
        { t: "ul", items: [
          `Ambas partes podrán dar por terminado el contrato con un aviso previo de ${_svB("15 días calendario.")}`,
          `EL CONTRATANTE podrá rescindir el contrato de forma inmediata si EL PRESTADOR incurre en incumplimientos graves, como:`,
        ]},
        { t: "ol", items: [
          `No presentarse sin aviso previo.`,
          `Reiteradas quejas de huéspedes relacionadas con la limpieza.`,
        ]},
      ]},
      { ord: "Novena", label: "Resolución de conflictos.", blocks: [
        { t: "p", text: `En caso de conflictos, ambas partes buscarán una solución amistosa. Si esto no es posible, se someterán a la jurisdicción de los tribunales de la Ciudad de Guatemala.` },
      ]},
      { ord: "Décima", label: "Disposiciones finales.", blocks: [
        { t: "ul", items: [
          `${_svB("Confidencialidad:")} EL PRESTADOR se compromete a manejar con responsabilidad las llaves, códigos de acceso y cualquier información proporcionada por EL CONTRATANTE.`,
          `${_svB("Capacitación:")} EL CONTRATANTE podrá solicitar entrenamientos adicionales para mantener altos estándares de calidad.`,
          `${_svB("Duración del contrato:")} este contrato tendrá vigencia indefinida, sujeto a las condiciones de rescisión previamente establecidas.`,
        ]},
      ]},
      _svcClosing("Décima Primera"),
    ],
    signatures: _svcSig(d),
  };
}

function buildMantenimiento(d) {
  return {
    title: "Contrato de Prestación de Servicios de Mantenimiento",
    intro: _svcIntro(d, "mantenimiento"),
    clauses: [
      { ord: "Primera", label: "Objeto del contrato.", blocks: [
        { t: "p", text: `EL CONTRATANTE contrata a EL PRESTADOR para realizar servicios de mantenimiento general en apartamentos destinados a plataformas como Airbnb y otras similares. Los servicios serán realizados conforme a las especificaciones establecidas por EL CONTRATANTE y según la necesidad operativa de cada apartamento.` },
      ]},
      { ord: "Segunda", label: "Naturaleza del contrato.", blocks: [
        { t: "ul", items: [
          `Esta posición no es fija. Se trata de un contrato por servicios prestados, por lo que EL PRESTADOR recibirá un pago únicamente por cada visita de mantenimiento efectivamente realizada y no constituye una relación laboral ni un salario mensual fijo.`,
          `EL PRESTADOR acepta que el pago será realizado semanalmente, sumando el total de visitas realizadas.`,
          `La ${_svB("fecha de inicio")} de la prestación de servicios será el ${_svB(formatLongDate(d.fechaInicio))}.`,
        ]},
      ]},
      { ord: "Tercera", label: "Alcance de los servicios.", blocks: [
        { t: "p", text: `El trabajo de mantenimiento general incluye, sin limitarse a:` },
        { t: "ul", items: [
          `${_svB("Fontanería básica:")} reparación de llaves, fugas menores, sifones y elementos similares.`,
          `${_svB("Mobiliario:")} reparación y ajuste de camas, sillas, mesas, closets, puertas y demás mobiliario del apartamento.`,
          `${_svB("Pintura:")} pintura de paredes y retoques estéticos necesarios para mantener la presentación del apartamento.`,
          `${_svB("Artículos varios:")} revisión y reparación de cerraduras, lámparas, cortinas, accesorios y demás artículos dentro de los apartamentos.`,
          `${_svB("Reposición e instalación:")} reposición e instalación de algunos artículos básicos cuando sea necesario.`,
          `${_svB("Revisión general:")} revisión integral del apartamento para garantizar que se mantenga en excelente estado para el próximo huésped.`,
        ]},
      ]},
      { ord: "Cuarta", label: "Condiciones de trabajo y coordinación.", blocks: [
        { t: "ul", items: [
          `${_svB("Frecuencia:")} los mantenimientos no serán necesariamente diarios; únicamente se realizarán en los días que haya necesidad. En esos casos, EL PRESTADOR será contactado con un mínimo de ${_svB("1 día de anticipación")} para coordinar la visita.`,
          `${_svB("Horarios:")} según la necesidad operativa y la coordinación previa entre ambas partes.`,
          `${_svB("Duración por visita:")} cada visita contempla hasta ${_svB("4 horas")} de trabajo en uno o varios apartamentos.`,
          `${_svB("Tiempo proporcional:")} si el trabajo requiere más tiempo del estimado, el pago se realizará de forma proporcional a las horas trabajadas. Si el trabajo toma menos tiempo, EL PRESTADOR podrá atender dos o incluso tres apartamentos dentro del mismo período de 4 horas, dependiendo de las necesidades.`,
          `${_svB("Capacitación:")} EL CONTRATANTE podrá enviar a una persona para ser entrenada y acompañada por EL PRESTADOR durante la realización de las tareas.`,
        ]},
      ]},
      { ord: "Quinta", label: "Condiciones de pago.", blocks: [
        { t: "ul", items: [
          `El pago será de ${_svB("Q" + _svPh(d.pagoMonto, "monto") + " por apartamento")} atendido durante la visita.`,
          `Si la visita se extiende más allá de las 4 horas, el pago se ajustará de forma proporcional a las horas adicionales trabajadas, previamente acordadas con EL CONTRATANTE.`,
          `Si una visita programada es cancelada antes de las ${_svB("9:00 a.m.")}, no se efectuará ningún pago.`,
          `Si la cancelación ocurre después de las ${_svB("9:00 a.m.")}, EL PRESTADOR recibirá el ${_svB("50% del pago")}, salvo que la visita sea reprogramada para realizarse ese mismo día en otra propiedad cercana.`,
        ]},
      ]},
      { ord: "Sexta", label: "Evaluación y calidad del servicio.", blocks: [
        { t: "ul", items: [
          `${_svB("Estándares:")} EL PRESTADOR deberá cumplir con los estándares de calidad y acabado establecidos por EL CONTRATANTE.`,
          `${_svB("Garantía:")} si un huésped o EL CONTRATANTE presenta una queja sobre un trabajo realizado y se determina que es responsabilidad de EL PRESTADOR, deberá corregirse sin costo adicional dentro del menor tiempo posible.`,
          `${_svB("Evaluación de desempeño:")} EL CONTRATANTE llevará un sistema de evaluación basado en puntualidad, calidad del trabajo, comunicación y cumplimiento. Quienes tengan mejores resultados serán priorizados para asignaciones futuras.`,
        ]},
      ]},
      { ord: "Séptima", label: "Obligaciones del prestador.", blocks: [
        { t: "p", text: _svB("Comunicación y reportes:") },
        { t: "ul", items: [
          `Notificar inmediatamente sobre cualquier daño adicional detectado en el apartamento.`,
          `Informar al CONTRATANTE si una reparación requiere materiales especiales o la intervención de un técnico especializado.`,
          `Avisar con antelación sobre cualquier atraso en el servicio.`,
        ]},
        { t: "p", text: _svB("Trato con huéspedes:") },
        { t: "ul", items: [
          `Mantener siempre un trato amable y cortés.`,
          `En caso de conflictos, debe comunicarse directamente con EL CONTRATANTE para manejar la situación.`,
        ]},
        { t: "p", text: _svB("Herramientas e insumos:") },
        { t: "ul", items: [
          `EL PRESTADOR deberá contar con su propio juego básico de herramientas para llevar a cabo las reparaciones menores.`,
          `Los materiales específicos (pintura, repuestos, accesorios) serán proporcionados por EL CONTRATANTE o reembolsados previa autorización.`,
        ]},
        { t: "p", text: _svB("Cuidado del apartamento:") },
        { t: "p", text: `EL PRESTADOR se compromete a dejar el área de trabajo limpia y ordenada al finalizar cada visita, retirando residuos y dejando el apartamento listo para el próximo huésped.` },
      ]},
      { ord: "Octava", label: "Rescisión del contrato.", blocks: [
        { t: "ul", items: [
          `Ambas partes podrán dar por terminado el contrato con un aviso previo de ${_svB("15 días calendario.")}`,
          `EL CONTRATANTE podrá rescindir el contrato de forma inmediata si EL PRESTADOR incurre en incumplimientos graves, como:`,
        ]},
        { t: "ol", items: [
          `No presentarse a una visita programada sin aviso previo.`,
          `Reiteradas quejas sobre la calidad o resultado de las reparaciones.`,
          `Daño doloso o negligente al inmueble o al mobiliario.`,
        ]},
      ]},
      { ord: "Novena", label: "Resolución de conflictos.", blocks: [
        { t: "p", text: `En caso de conflictos, ambas partes buscarán una solución amistosa. Si esto no es posible, se someterán a la jurisdicción de los tribunales de la Ciudad de Guatemala.` },
      ]},
      { ord: "Décima", label: "Disposiciones finales.", blocks: [
        { t: "ul", items: [
          `${_svB("Confidencialidad:")} EL PRESTADOR se compromete a manejar con responsabilidad las llaves, códigos de acceso y cualquier información proporcionada por EL CONTRATANTE.`,
          `${_svB("Capacitación:")} EL CONTRATANTE podrá solicitar entrenamientos adicionales para mantener altos estándares de calidad.`,
          `${_svB("Duración del contrato:")} este contrato tendrá vigencia indefinida, sujeto a las condiciones de rescisión previamente establecidas.`,
        ]},
      ]},
      _svcClosing("Décima Primera"),
    ],
    signatures: _svcSig(d),
  };
}

function ContratoLimpieza({ data, edits, onEdit, onReset }) {
  return <PaginatedContract contract={buildLimpieza(data)} edits={edits} onEdit={onEdit} onReset={onReset} />;
}
function ContratoMantenimiento({ data, edits, onEdit, onReset }) {
  return <PaginatedContract contract={buildMantenimiento(data)} edits={edits} onEdit={onEdit} onReset={onReset} />;
}

Object.assign(window, {
  ContratoLimpieza, ContratoMantenimiento,
  FlowingPage, Clause, Signatures, ClosingClause, Intro,
  formatLongDate, formatLongDateCap,
});
