/* ============================================================
   SPACIO AM — .docx generator
   Produces a Microsoft Word document that imports cleanly into
   Google Docs. The user gets clean editable text with the
   official letterhead embedded as the page header image so it
   appears on every page automatically.
   ============================================================ */

async function fetchAsArrayBuffer(url) {
  const res = await fetch(url);
  return res.arrayBuffer();
}

/* Spacio AM ink tone — forces text color so Google Docs's default
   styles (blue headings, etc.) don't override the brand palette. */
const INK = "3E3F3F";
const EARTH = "938B8A";

function paraText(text, opts = {}) {
  const {
    Paragraph, TextRun, AlignmentType,
  } = window.docx;
  const runs = [];
  // text may contain inline **bold** segments
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  for (const p of parts) {
    if (!p) continue;
    if (p.startsWith("**") && p.endsWith("**")) {
      runs.push(new TextRun({ text: p.slice(2, -2), bold: true, font: "Montserrat", size: 18, color: INK }));
    } else {
      runs.push(new TextRun({ text: p, font: "Montserrat", size: 18, color: INK }));
    }
  }
  return new Paragraph({
    children: runs,
    spacing: { after: 110, line: 280 },
    alignment: opts.align || AlignmentType.LEFT,
  });
}

function paraBullet(text) {
  const { Paragraph, TextRun } = window.docx;
  const parts = text.split(/(\*\*[^*]+\*\*)/);
  const runs = [];
  for (const p of parts) {
    if (!p) continue;
    if (p.startsWith("**") && p.endsWith("**")) {
      runs.push(new TextRun({ text: p.slice(2, -2), bold: true, font: "Montserrat", size: 18, color: INK }));
    } else {
      runs.push(new TextRun({ text: p, font: "Montserrat", size: 18, color: INK }));
    }
  }
  return new Paragraph({
    children: runs,
    bullet: { level: 0 },
    spacing: { after: 80, line: 280 },
  });
}

function clauseHeading(ord, label) {
  const { Paragraph, TextRun } = window.docx;
  // Plain paragraph with explicit run formatting — avoids Google Docs
  // mapping Word's HEADING_2 to its own blue "Heading 2" style.
  return new Paragraph({
    spacing: { before: 220, after: 80, line: 280 },
    keepNext: true,
    children: [
      new TextRun({
        text: `${ord}. `,
        bold: false,
        font: "Cormorant Garamond",
        size: 22,
        color: INK,
      }),
      new TextRun({
        text: label || "",
        bold: false,
        font: "Montserrat",
        size: 16,
        allCaps: true,
        characterSpacing: 60,
        color: INK,
      }),
    ],
  });
}

/* Build content paragraphs for limpieza */
function limpiezaContent(data) {
  const fechaTxt = formatLongDateCap(data.fecha);
  const intro =
    `El presente contrato se celebra en la ciudad de Guatemala, el **${fechaTxt}**, entre: por una parte **${data.prestadorNombre || "—"}** (en adelante "EL PRESTADOR") quien se identifica con el Documento Personal de Identificación número **${data.prestadorDPI || "—"}** extendido por el Registro Nacional de las Personas de la República de Guatemala, quien actúa en su calidad de PERSONA INDIVIDUAL; y por otra parte, el señor **${data.contratanteNombre}** de ${data.contratanteEdad} años, ${data.contratanteEstado}, guatemalteco, comerciante, de este domicilio, portador del Documento Personal de Identificación con Código Único de Identificación número **${data.contratanteDPI}** extendido por el Registro Nacional de las Personas de la República de Guatemala, quien actúa en su calidad de ADMINISTRADOR ÚNICO Y REPRESENTANTE LEGAL de la entidad **SPACIO AM, SOCIEDAD ANÓNIMA** (en adelante "EL CONTRATANTE"). Declaran ambos comparecientes que se conocen mutuamente, que reconocen y aceptan la calidad con que actúa cada uno, siendo la representación amplia y suficiente conforme la ley y a su juicio para otorgar el presente contrato. Los comparecientes en el libre ejercicio de nuestros derechos civiles manifestamos que celebramos el CONTRATO DE PRESTACIÓN DE SERVICIOS DE LIMPIEZA que se contiene en las siguientes cláusulas:`;

  return [
    paraText(intro),
    clauseHeading("Primera", "Objeto del contrato."),
    paraText("EL CONTRATANTE contrata a EL PRESTADOR para realizar servicios de limpieza general y profunda en apartamentos destinados a plataformas como Airbnb y otras similares. Los servicios serán realizados conforme a las especificaciones establecidas por EL CONTRATANTE."),

    clauseHeading("Segunda", "Naturaleza del contrato."),
    paraBullet("Este es un contrato por servicios prestados, por lo que EL PRESTADOR recibirá un pago únicamente por cada limpieza efectuada y no constituye una relación laboral."),
    paraBullet("EL PRESTADOR acepta que el pago será realizado semanalmente, sumando el total de servicios realizados."),

    clauseHeading("Tercera", "Alcance de los servicios."),
    paraBullet("**Tareas básicas de limpieza:** quitar el polvo, pasar la aspiradora, fregar el suelo, limpiar los baños, desinfectar superficies y limpiar la cocina."),
    paraBullet("**Tareas de cambio:** lavado y cambio de sábanas, reposición de toallas, vaciado de papeleras y reposición de suministros esenciales."),
    paraBullet("**Limpieza profunda:** limpieza de ventanas, eliminación de sarro, limpieza de alfombras, azulejos y electrodomésticos."),
    paraBullet("**Repasos y tareas específicas:** en algunos casos, en lugar de una limpieza completa, se podrá solicitar un repaso rápido (quitar polvo, barrer y trapear) en varios apartamentos dentro de la franja horaria asignada."),
    paraBullet("**Mantenimiento de exteriores (cuando aplique):** barrer patios, limpiar muebles de exterior o mantener zonas comunes como la piscina."),

    clauseHeading("Cuarta", "Condiciones de trabajo y coordinación."),
    paraBullet("**Horarios:** la jornada estándar será de 4 horas, siendo el horario más común de 11:00 a.m. a 3:00 p.m., pero podrá ser modificado previo acuerdo entre ambas partes en caso de eventualidades o necesidades específicas."),
    paraBullet("**Capacitación:** EL CONTRATANTE podrá enviar a una persona para ser entrenada y acompañada por EL PRESTADOR durante la realización de las tareas."),
    paraBullet("**Flexibilidad en servicios:** EL CONTRATANTE podrá solicitar que una limpieza programada se enfoque exclusivamente en tareas específicas o en una limpieza profunda, siempre dentro de la franja horaria establecida."),
    paraBullet("**Tareas adicionales:** si se termina una limpieza antes del tiempo estimado, EL CONTRATANTE podrá solicitar un repaso en un apartamento cercano sin costo adicional, siempre y cuando no se abuse del horario."),

    clauseHeading("Quinta", "Condiciones de pago."),
    paraBullet(`El pago será de **Q${data.pagoMonto} por apartamento limpiado.**`),
    paraBullet("Si una limpieza es cancelada antes de las **9:00 a.m.**, no se efectuará ningún pago."),
    paraBullet("Si la cancelación ocurre después de las **9:00 a.m.**, EL PRESTADOR recibirá el **50% del pago**, salvo que la limpieza sea reprogramada para realizarse ese mismo día en otra propiedad cercana."),

    clauseHeading("Sexta", "Evaluación y calidad del servicio."),
    paraBullet("**Estándares:** EL PRESTADOR deberá cumplir con los estándares de limpieza establecidos por EL CONTRATANTE."),
    paraBullet("**Garantía:** si un huésped presenta una queja y EL CONTRATANTE determina que es responsabilidad de EL PRESTADOR, deberá realizarse una limpieza de repaso el mismo día sin costo alguno."),
    paraBullet("**Evaluación de desempeño:** EL CONTRATANTE llevará un sistema de ranking basado en puntualidad, calidad de limpieza y cumplimiento de estándares."),

    clauseHeading("Séptima", "Obligaciones del prestador."),
    paraText("**Comunicación y reportes:**"),
    paraBullet("Notificar inmediatamente sobre cualquier daño en el apartamento."),
    paraBullet("Informar sobre objetos olvidados por los huéspedes."),
    paraBullet("Avisar con antelación sobre cualquier atraso en el servicio."),
    paraText("**Trato con huéspedes:**"),
    paraBullet("Mantener siempre un trato amable y cortés."),
    paraBullet("En caso de conflictos, debe comunicarse directamente con EL CONTRATANTE para manejar la situación."),
    paraText("**Insumos:**"),
    paraBullet("Solicitar los insumos necesarios a tiempo."),
    paraBullet("Recibirlos y garantizar su reposición adecuada en el apartamento."),
    paraText("**Reparaciones menores:** aunque EL PRESTADOR no está obligado a realizar mantenimientos, se espera que pueda hacer pruebas básicas e intentar reparar problemas menores que no requieran un técnico especializado."),

    clauseHeading("Octava", "Rescisión del contrato."),
    paraBullet("Ambas partes podrán dar por terminado el contrato con un aviso previo de **15 días calendario.**"),
    paraBullet("EL CONTRATANTE podrá rescindir el contrato de forma inmediata si EL PRESTADOR incurre en incumplimientos graves, como: no presentarse sin aviso previo, o reiteradas quejas de huéspedes relacionadas con la limpieza."),

    clauseHeading("Novena", "Resolución de conflictos."),
    paraText("En caso de conflictos, ambas partes buscarán una solución amistosa. Si esto no es posible, se someterán a la jurisdicción de los tribunales de la Ciudad de Guatemala."),

    clauseHeading("Décima", "Disposiciones finales."),
    paraBullet("**Confidencialidad:** EL PRESTADOR se compromete a manejar con responsabilidad las llaves, códigos de acceso y cualquier información proporcionada por EL CONTRATANTE."),
    paraBullet("**Capacitación:** EL CONTRATANTE podrá solicitar entrenamientos adicionales para mantener altos estándares de calidad."),
    paraBullet("**Duración del contrato:** este contrato tendrá vigencia indefinida, sujeto a las condiciones de rescisión previamente establecidas."),

    clauseHeading("Décima Primera", ""),
    paraText("Declaramos los comparecientes en las calidades con que actuamos, que en los términos consignados aceptamos el contenido íntegro del presente instrumento por ser la expresión fiel y clara de la voluntad que hemos manifestado. Hacemos constar lo siguiente: **I.** Que hemos tenido a la vista los documentos con que cada compareciente acredita la representación que ejerce; y **II.** Que hemos leído lo escrito y bien impuestos de su contenido, validez, objeto, efectos legales y obligación de registro, lo ratificamos, aceptamos y firmamos electrónicamente."),
  ];
}

function mantenimientoContent(data) {
  const fechaTxt = formatLongDateCap(data.fecha);
  const inicioTxt = formatLongDate(data.fechaInicio);
  const intro =
    `El presente contrato se celebra en la ciudad de Guatemala, el **${fechaTxt}**, entre: por una parte **${data.prestadorNombre || "—"}** (en adelante "EL PRESTADOR") quien se identifica con el Documento Personal de Identificación número **${data.prestadorDPI || "—"}** extendido por el Registro Nacional de las Personas de la República de Guatemala, quien actúa en su calidad de PERSONA INDIVIDUAL; y por otra parte, el señor **${data.contratanteNombre}** de ${data.contratanteEdad} años, ${data.contratanteEstado}, guatemalteco, comerciante, de este domicilio, portador del Documento Personal de Identificación con Código Único de Identificación número **${data.contratanteDPI}** extendido por el Registro Nacional de las Personas de la República de Guatemala, quien actúa en su calidad de ADMINISTRADOR ÚNICO Y REPRESENTANTE LEGAL de la entidad **SPACIO AM, SOCIEDAD ANÓNIMA** (en adelante "EL CONTRATANTE"). Declaran ambos comparecientes que se conocen mutuamente, que reconocen y aceptan la calidad con que actúa cada uno, siendo la representación amplia y suficiente conforme la ley y a su juicio para otorgar el presente contrato. Los comparecientes en el libre ejercicio de nuestros derechos civiles manifestamos que celebramos el CONTRATO DE PRESTACIÓN DE SERVICIOS DE MANTENIMIENTO que se contiene en las siguientes cláusulas:`;

  return [
    paraText(intro),

    clauseHeading("Primera", "Objeto del contrato."),
    paraText("EL CONTRATANTE contrata a EL PRESTADOR para realizar servicios de mantenimiento general en apartamentos destinados a plataformas como Airbnb y otras similares. Los servicios serán realizados conforme a las especificaciones establecidas por EL CONTRATANTE y según la necesidad operativa de cada apartamento."),

    clauseHeading("Segunda", "Naturaleza del contrato."),
    paraBullet("Esta posición no es fija. Se trata de un contrato por servicios prestados, por lo que EL PRESTADOR recibirá un pago únicamente por cada visita de mantenimiento efectivamente realizada y no constituye una relación laboral ni un salario mensual fijo."),
    paraBullet("EL PRESTADOR acepta que el pago será realizado semanalmente, sumando el total de visitas realizadas."),
    paraBullet(`La **fecha de inicio** de la prestación de servicios será el **${inicioTxt}**.`),

    clauseHeading("Tercera", "Alcance de los servicios."),
    paraText("El trabajo de mantenimiento general incluye, sin limitarse a:"),
    paraBullet("**Fontanería básica:** reparación de llaves, fugas menores, sifones y elementos similares."),
    paraBullet("**Mobiliario:** reparación y ajuste de camas, sillas, mesas, closets, puertas y demás mobiliario del apartamento."),
    paraBullet("**Pintura:** pintura de paredes y retoques estéticos necesarios para mantener la presentación del apartamento."),
    paraBullet("**Artículos varios:** revisión y reparación de cerraduras, lámparas, cortinas, accesorios y demás artículos dentro de los apartamentos."),
    paraBullet("**Reposición e instalación:** reposición e instalación de algunos artículos básicos cuando sea necesario."),
    paraBullet("**Revisión general:** revisión integral del apartamento para garantizar que se mantenga en excelente estado para el próximo huésped."),

    clauseHeading("Cuarta", "Condiciones de trabajo y coordinación."),
    paraBullet("**Frecuencia:** los mantenimientos no serán necesariamente diarios; únicamente se realizarán en los días que haya necesidad. En esos casos, EL PRESTADOR será contactado con un mínimo de **1 día de anticipación** para coordinar la visita."),
    paraBullet("**Horarios:** según la necesidad operativa y la coordinación previa entre ambas partes."),
    paraBullet("**Duración por visita:** cada visita contempla hasta **4 horas** de trabajo en uno o varios apartamentos."),
    paraBullet("**Tiempo proporcional:** si el trabajo requiere más tiempo del estimado, el pago se realizará de forma proporcional a las horas trabajadas. Si el trabajo toma menos tiempo, EL PRESTADOR podrá atender dos o incluso tres apartamentos dentro del mismo período de 4 horas."),
    paraBullet("**Capacitación:** EL CONTRATANTE podrá enviar a una persona para ser entrenada y acompañada por EL PRESTADOR durante la realización de las tareas."),

    clauseHeading("Quinta", "Condiciones de pago."),
    paraBullet(`El pago será de **Q${data.pagoMonto} por apartamento** atendido durante la visita.`),
    paraBullet("Si la visita se extiende más allá de las 4 horas, el pago se ajustará de forma proporcional a las horas adicionales trabajadas, previamente acordadas con EL CONTRATANTE."),
    paraBullet("Si una visita programada es cancelada antes de las **9:00 a.m.**, no se efectuará ningún pago."),
    paraBullet("Si la cancelación ocurre después de las **9:00 a.m.**, EL PRESTADOR recibirá el **50% del pago**, salvo que la visita sea reprogramada para realizarse ese mismo día en otra propiedad cercana."),

    clauseHeading("Sexta", "Evaluación y calidad del servicio."),
    paraBullet("**Estándares:** EL PRESTADOR deberá cumplir con los estándares de calidad y acabado establecidos por EL CONTRATANTE."),
    paraBullet("**Garantía:** si un huésped o EL CONTRATANTE presenta una queja sobre un trabajo realizado y se determina que es responsabilidad de EL PRESTADOR, deberá corregirse sin costo adicional dentro del menor tiempo posible."),
    paraBullet("**Evaluación de desempeño:** EL CONTRATANTE llevará un sistema de evaluación basado en puntualidad, calidad del trabajo, comunicación y cumplimiento."),

    clauseHeading("Séptima", "Obligaciones del prestador."),
    paraText("**Comunicación y reportes:**"),
    paraBullet("Notificar inmediatamente sobre cualquier daño adicional detectado en el apartamento."),
    paraBullet("Informar al CONTRATANTE si una reparación requiere materiales especiales o la intervención de un técnico especializado."),
    paraBullet("Avisar con antelación sobre cualquier atraso en el servicio."),
    paraText("**Trato con huéspedes:**"),
    paraBullet("Mantener siempre un trato amable y cortés."),
    paraBullet("En caso de conflictos, debe comunicarse directamente con EL CONTRATANTE para manejar la situación."),
    paraText("**Herramientas e insumos:**"),
    paraBullet("EL PRESTADOR deberá contar con su propio juego básico de herramientas para llevar a cabo las reparaciones menores."),
    paraBullet("Los materiales específicos (pintura, repuestos, accesorios) serán proporcionados por EL CONTRATANTE o reembolsados previa autorización."),
    paraText("**Cuidado del apartamento:** EL PRESTADOR se compromete a dejar el área de trabajo limpia y ordenada al finalizar cada visita, retirando residuos y dejando el apartamento listo para el próximo huésped."),

    clauseHeading("Octava", "Rescisión del contrato."),
    paraBullet("Ambas partes podrán dar por terminado el contrato con un aviso previo de **15 días calendario.**"),
    paraBullet("EL CONTRATANTE podrá rescindir el contrato de forma inmediata si EL PRESTADOR incurre en incumplimientos graves, como: no presentarse a una visita programada sin aviso previo; reiteradas quejas sobre la calidad de las reparaciones; o daño doloso o negligente al inmueble o al mobiliario."),

    clauseHeading("Novena", "Resolución de conflictos."),
    paraText("En caso de conflictos, ambas partes buscarán una solución amistosa. Si esto no es posible, se someterán a la jurisdicción de los tribunales de la Ciudad de Guatemala."),

    clauseHeading("Décima", "Disposiciones finales."),
    paraBullet("**Confidencialidad:** EL PRESTADOR se compromete a manejar con responsabilidad las llaves, códigos de acceso y cualquier información proporcionada por EL CONTRATANTE."),
    paraBullet("**Capacitación:** EL CONTRATANTE podrá solicitar entrenamientos adicionales para mantener altos estándares de calidad."),
    paraBullet("**Duración del contrato:** este contrato tendrá vigencia indefinida, sujeto a las condiciones de rescisión previamente establecidas."),

    clauseHeading("Décima Primera", ""),
    paraText("Declaramos los comparecientes en las calidades con que actuamos, que en los términos consignados aceptamos el contenido íntegro del presente instrumento por ser la expresión fiel y clara de la voluntad que hemos manifestado. **I.** Que hemos tenido a la vista los documentos con que cada compareciente acredita la representación que ejerce; y **II.** Que hemos leído lo escrito y bien impuestos de su contenido, lo ratificamos, aceptamos y firmamos electrónicamente."),
  ];
}

function personalizadoContent(data, custom) {
  const NUMERALES = [
    "Primera", "Segunda", "Tercera", "Cuarta", "Quinta",
    "Sexta", "Séptima", "Octava", "Novena", "Décima",
    "Décima Primera", "Décima Segunda", "Décima Tercera",
    "Décima Cuarta", "Décima Quinta", "Décima Sexta",
    "Décima Séptima", "Décima Octava", "Décima Novena", "Vigésima",
  ];

  const ps = [];
  ps.push(paraText(custom.intro || ""));
  custom.clauses.forEach((c, i) => {
    ps.push(clauseHeading(NUMERALES[i] || `Cláusula ${i + 1}`, c.label));
    if (c.body) ps.push(paraText(c.body));
  });
  ps.push(clauseHeading(NUMERALES[custom.clauses.length] || "Final", ""));
  ps.push(paraText(custom.cierre || ""));
  return ps;
}

/* ============================================================
   CO-HOSTING — .docx content
   ============================================================ */
function cohostingHostComparece(data) {
  return `el señor **${data.contratanteNombre}** de ${data.contratanteEdad} años, ${data.contratanteEstado}, guatemalteco, comerciante, de este domicilio, portador del Documento Personal de Identificación con Código Único de Identificación número **${data.contratanteDPI}** extendido por el Registro Nacional de las Personas de la República de Guatemala, quien actúa en su calidad de ADMINISTRADOR ÚNICO Y REPRESENTANTE LEGAL de la entidad **SPACIO AM, SOCIEDAD ANÓNIMA**, calidad que acredita con el acta notarial autorizada en esta ciudad el ${data.actaFecha || "[fecha del acta]"} por el notario ${data.actaNotario || "[notario]"}, inscrita en el Registro Mercantil General de la República al número ${data.regNumero || "[número]"}, folio ${data.regFolio || "[folio]"} del libro ${data.regLibro || "[libro]"} de Auxiliares de comercio. Declaran ambos comparecientes que se conocen mutuamente, que reconocen y aceptan la calidad con que actúa cada uno, siendo la representación amplia y suficiente conforme la ley y a su juicio para otorgar el presente contrato. Los comparecientes en el libre ejercicio de nuestros derechos civiles manifestamos que celebramos el ACUERDO DE CO-HOSTING DE BIEN INMUEBLE que se contiene en las siguientes cláusulas:`;
}

function cohostingIntro(tipo, data) {
  if (tipo === "cohosting_individual") {
    return `El presente Acuerdo se celebra en la ciudad de Guatemala, el **${formatLongDateCap(data.fecha)}**, entre: por una parte **${data.duenoNombre || "[NOMBRE DEL DUEÑO]"}** de ${data.duenoEdad || "[edad]"} años, ${data.duenoEstado || "[estado civil]"}, ${data.duenoNacionalidad || "[nacionalidad]"}, ${data.duenoProfesion || "[profesión u oficio]"}, ${data.duenoDomicilio || "[domicilio]"}, portador del Documento Personal de Identificación con Código Único de Identificación número **${data.duenoDPI || "[DPI]"}** extendido por el Registro Nacional de las Personas de la República de Guatemala, quien actúa en su calidad de PERSONA INDIVIDUAL; y por otra parte, ${cohostingHostComparece(data)}`;
  }
  return `El presente Acuerdo se celebra en la ciudad de Guatemala, el **${formatLongDateCap(data.fecha)}**, entre: por una parte, **${data.repNombre || "[NOMBRE DEL REPRESENTANTE LEGAL]"}** de ${data.repEdad || "[edad]"} años, ${data.repEstado || "[estado civil]"}, ${data.repNacionalidad || "[nacionalidad]"}, con domicilio en ${data.repDomicilio || "[domicilio]"}, portador del Documento Personal de Identificación con Código Único de Identificación número **${data.repDPI || "[DPI]"}** extendido por el Registro Nacional de las Personas de la República de Guatemala, quien actúa en su calidad de REPRESENTANTE LEGAL de la entidad **${data.entidadNombre || "[NOMBRE DE LA ENTIDAD]"}**. Y por otra parte, ${cohostingHostComparece(data)}`;
}

function cohostingPrimeraSegunda(tipo, data) {
  const out = [];
  if (tipo === "cohosting_individual") {
    const n = data.duenoNombre || "[NOMBRE DEL DUEÑO]";
    out.push(clauseHeading("Primera", "Del Inmueble."));
    out.push(paraText(`Manifiesta **${n}** que es propietaria del bien inmueble ubicado en ${data.propDireccion || "[dirección]"} y dicho bien inmueble consiste en el departamento número ${data.propApto || "[número de apto]"}, ubicado en el nivel ${data.propPiso || "[nivel]"} del edificio ${data.propEdificio || "[nombre de edificio]"}.`));
    out.push(clauseHeading("Segunda", "Del Acuerdo."));
    out.push(paraText(`Mediante este acuerdo **${n}**, a quien en el curso de este contrato podrá denominársele el "Dueño", da a **Spacio AM S.A.**, a quien en el curso de este contrato podrá denominársele el "Host", quien toma el inmueble en administración y promoción del bien inmueble identificado en la cláusula anterior en el mercado de rentas a corto plazo, sujetándose el contrato a los siguientes términos y estipulaciones:`));
  } else {
    const n = data.repNombre || "[NOMBRE DEL REPRESENTANTE]";
    out.push(clauseHeading("Primera", "Del Inmueble."));
    out.push(paraText(`Manifiesta **${n}** que es propietario del bien inmueble ubicado en ${data.propDireccion || "[dirección]"} y dicho bien inmueble consiste en el departamento número ${data.propApto || "[número de apto]"}, ubicado en el nivel ${data.propPiso || "[nivel]"} del edificio ${data.propEdificio || "[nombre de edificio]"}.`));
    out.push(clauseHeading("Segunda", "Del Acuerdo."));
    out.push(paraText(`Mediante este acuerdo **${n}** quien actúa en representación de **${data.entidadNombre || "[NOMBRE DE LA ENTIDAD]"}**, a quien en el curso de este contrato podrá denominársele como el "Dueño", da a **Spacio AM S.A.**, a quien en el curso de este contrato podrá denominársele el "Host", quien toma el inmueble en administración y promoción los bienes inmuebles identificados en la cláusula anterior en el mercado de rentas a corto plazo, sujetándose el contrato a los siguientes términos y estipulaciones:`));
  }
  return out;
}

function cohostingIngresos(ord, lt) {
  const D = lt ? "DUEÑO" : "dueño";
  const H = lt ? "HOST" : "host";
  return [
    clauseHeading(ord, "Los Ingresos."),
    paraText(`El ${H} deberá pagar mensualmente antes del 5to día hábil a la cuenta de preferencia del ${D} y el ${H} dividirán los ingresos, correspondiéndole el ochenta por ciento (80%) para el ${D} y el veinte por ciento (20%) para el ${H}.`),
    paraText(`El cien por ciento (100%) de los cleaning fees irán para el ${H} quien destinará este ingreso para pago de personal de limpieza.`),
    paraText(`Las plataformas digitales de hospedaje (como Airbnb, Booking u otras equivalentes) aplican una comisión por reserva que oscila entre el 3% y el 15.5% dependiendo de la plataforma y la modalidad. Este porcentaje se mantendrá sin variación salvo que exista una notificación oficial emitida por la plataforma que confirme un ajuste en sus tarifas.`),
    paraText(`El ${H} se compromete a ajustar el precio de la propiedad de forma proporcional para compensar las comisiones cobradas por dichas plataformas. En los reportes mensuales que el ${H} entregue al ${D}, este ajuste aparecerá reflejado como parte del ingreso total, junto con el monto retenido por cada plataforma.`),
    paraText(`En relación al IVA, el ${H} transferirá al Propietario el monto recaudado correspondiente, para su debido pago, salvo en los siguientes casos:`),
    paraBullet(`Que el Propietario esté inscrito bajo el régimen de "Pequeño Contribuyente" y no le corresponda declarar IVA.`),
    paraBullet(`Que el Propietario no esté emitiendo facturas.`),
    paraText(`En cualquiera de estos escenarios, el ${D} no transferirá el IVA recaudado y lo gestionará conforme a las obligaciones fiscales correspondientes.`),
    paraText(`Si existe un presupuesto para decoración y preparación de la propiedad, la inversión será hecha por el ${D} y el presupuesto será administrado por el ${H}.`),
    paraText(`Se destinará un presupuesto de hasta ocho dólares de los Estados Unidos de América (USD 8.00) mensuales ${lt ? "por cada apartamento " : ""}para un software de precios inteligentes que tiene como fin aumentar el ingreso y ocupación de la propiedad.`),
    paraText(`El propietario será responsable de cubrir el costo de las sesiones fotográficas requeridas para la promoción de su propiedad.`),
    paraText(`Las imágenes serán utilizadas exclusivamente para la promoción del inmueble por parte del ${H}. Cualquier otro uso deberá contar con la autorización previa y por escrito tanto del propietario como del ${H}.`),
  ];
}

function cohostingFiscal(ord, lt) {
  const D = lt ? "DUEÑO" : "dueño";
  const H = lt ? "HOST" : "host";
  return [
    clauseHeading(ord, "Responsabilidad Fiscal."),
    paraText(`Cada parte será responsable de manera individual por el cumplimiento de sus respectivas obligaciones fiscales ante las autoridades competentes.`),
    paraText(`El ${D} será responsable por los impuestos derivados de los ingresos que reciba como resultado del alquiler de su propiedad, mientras que el ${H} será responsable por los impuestos correspondientes a los ingresos que perciba por la prestación de sus servicios de gestión, operación o co-hosting.`),
    paraText(`Ambas partes reconocen que el detalle sobre la distribución de los ingresos entre el ${D} y el ${H} se encuentra descrito en la cláusula de Los Ingresos del presente contrato. En ningún caso una parte será responsable por las obligaciones fiscales de la otra.`),
    paraText(`Se exonera expresamente a la otra parte de cualquier reclamo, sanción, multa o responsabilidad que pudiera derivarse del incumplimiento de las obligaciones fiscales de la otra parte.`),
  ];
}

function cohostingUso(ord, lt) {
  const D = lt ? "DUEÑO" : "dueño";
  const H = lt ? "HOST" : "host";
  return [
    clauseHeading(ord, "Uso de la Propiedad."),
    paraText(`El ${D} puede utilizar la propiedad sin necesidad de pago; a discreción, siempre y cuando no exista una reserva confirmada y vigente. Se debe solicitar el bloqueo de las fechas con anticipación. El ${D} no podrá visitar la propiedad cuando haya una reserva vigente.`),
    paraText(`Si el ${D} decide cancelar una reserva por cualquier motivo, este deberá incurrir en los costos de penalización que imponga la plataforma, el cual oscila entre cien a doscientos dólares de los Estados Unidos de América (USD 100.00 a USD 200.00) por reserva. Los montos son impuestos por las plataformas y pueden variar en cualquier momento, sin previo aviso.`),
    paraText(`Si se decide vender la propiedad a un tercero, el ${D} deberá informar al ${H} con treinta (30) días de anticipación, de lo contrario deberá incurrir en los gastos que las cancelaciones conlleven.`),
  ];
}

function cohostingObligacionesDueno(ord, lt) {
  const H = lt ? "HOST" : "host";
  const D = lt ? "DUEÑO" : "dueño";
  return [
    clauseHeading(ord, "Obligaciones y Responsabilidades del Dueño."),
    paraBullet(`Dar acceso libre para que el ${H} modifique los anuncios en las diferentes plataformas a discreción con el objetivo de optimizarlos.`),
    paraBullet(`Determinar reglamento y sanciones para quienes se hospeden en la propiedad.`),
    paraBullet(`Establecer junto con el ${H} las tarifas de hospedaje mínimo, fee de limpieza y los cobros adicionales.`),
    paraBullet(`Mantener la propiedad y su mobiliario en buen estado.`),
    paraBullet(`Notificar al ${H} de cualquier mantenimiento o reparación necesaria.`),
    paraBullet(`Si la reparación fuese por un daño ocasionado por algún huésped y el seguro de este último no tenga cobertura, estas serán pagadas en un porcentaje igual al de la repartición de ingresos.`),
    paraBullet(`Programar con por lo menos 15 días de anticipación cualquier trabajo a realizar en la propiedad (ejemplos: cambio de piso, mantenimiento, remodelación, etc.).`),
    paraBullet(`Pagar el mantenimiento y servicios necesarios para el buen funcionamiento de la propiedad.`),
    paraBullet(`Mantener los pagos de electricidad, agua e impuestos de la propiedad al día.`),
    paraBullet(`Los impuestos derivados de los ingresos del ${D} son responsabilidad del mismo.`),
    paraBullet(`Autorizar al ${H} la venta de cualquier producto o servicio de lícito comercio adicional a las personas que se hospeden en la propiedad.`),
    paraBullet(`El ${D} queda liberado de cualquier responsabilidad penal, civil o laboral provocada por la mala administración del negocio por parte del ${H}.`),
    paraBullet(`Mantener dentro de la propiedad todos los utensilios, muebles y decoración que se colocaron cuando se inició a promover el anuncio; por ningún motivo estos deben de tener otro uso o salir de la propiedad.`),
  ];
}

function cohostingObligacionesHost(ord, lt) {
  const D = lt ? "DUEÑO" : "dueño";
  const H = lt ? "HOST" : "host";
  return [
    clauseHeading(ord, "Obligaciones y Responsabilidades del Host."),
    paraBullet(`Ser el responsable del contacto con los huéspedes o potenciales huéspedes.`),
    paraBullet(`Responder de manera profesional a todas las consultas y solicitudes de reserva en menos de 24 horas de haber recibido la solicitud.`),
    paraBullet(`Comunicarse proactivamente con los huéspedes para asegurarse de que cualquier duda o preocupación sea resuelta.`),
    paraBullet(`Mantener al día y controlado el reporte financiero de la propiedad.`),
    paraBullet(`Optimizar el anuncio de manera continua con el fin de aumentar el ingreso promedio.`),
    paraBullet(`Redactar una reseña con cada huésped posterior a su reserva.`),
    paraBullet(`Cobrar los fees y servicios adicionales mientras la reserva se encuentre vigente.`),
    paraBullet(`Mantener los calendarios actualizados y sin problemas.`),
    paraBullet(`Si existiese algún daño en la propiedad se deberá gestionar el cobro al huésped o al seguro del huésped.`),
    paraBullet(`Si el seguro del huésped no cubre el daño y no se logra llegar a un acuerdo se pagará la reparación por ambas partes en los mismos porcentajes de la distribución de ingresos.`),
    paraBullet(`Estar actualizado con el procedimiento y requisitos de resolución de problemas de cada huésped (seguros y formas de cobro).`),
    paraBullet(`Recibir los cleaning fees de todos los huéspedes y ser el responsable de coordinar la limpieza de la propiedad.`),
    paraBullet(`Mantener control del inventario de insumos de la propiedad y agregar el total al reporte mensual para que el ${D} pueda pagar el monto total al final del periodo.`),
    paraBullet(`Los insumos contemplados papel higiénico, mayordomo, esponjas, jabón de platos, detergente de ropa, jabón de manos, shampoo, shower gel, sal, pimienta, aceite, químicos de limpieza, etc.`),
    paraBullet(`Programar una limpieza profunda mensual o bimensual, con un costo igual o similar al del servicio de limpieza de rutina.`),
    paraBullet(`Realizar un listado con todas las pertenencias / objetos que posee la propiedad a un inicio.`),
    paraBullet(`El ${H} es el único representante del negocio ante el huésped.`),
    paraBullet(`Mantener y velar por el cuidado y buen uso de parte de los huéspedes al mobiliario de la propiedad.`),
    paraBullet(`Cualquier disputa penal, civil o laboral ocasionada por la mala administración del ${H} será responsabilidad única y exclusiva del ${H}.`),
    paraBullet(`El ${H} debe cumplir con el pago de sus responsabilidades fiscales.`),
  ];
}

function cohostingEspecial(ord, lt) {
  const D = lt ? "DUEÑO" : "dueño";
  const H = lt ? "HOST" : "host";
  return [
    clauseHeading(ord, "Cláusula Especial."),
    paraText(`Este acuerdo está basado en obligaciones de ambas partes que incluyen las consideraciones detalladas en la parte superior y por ende expresa la aceptación de dichos términos por ambas partes. Es expresamente aceptado por ambas partes que tanto el ${D} como el ${H} podrán dar por terminado el presente contrato por decisión unilateral comunicada a la otra parte, por correo, carta o cualquier medio de comunicación que considere idóneo, con al menos treinta (30) días calendario de anticipación, respetando únicamente las reservas confirmadas y vigentes. Si se finaliza el contrato forzando alguna cancelación de reserva la parte que desee finalizar deberá incurrir en el costo de cancelación que sea impuesto por parte de las plataformas.`),
    paraText(`Si da por terminado este acuerdo todos los materiales, documentos y contenido que hayan sido utilizados durante el tiempo de operación deberán ser descartados y solo podrán ser utilizados por las partes para fines comerciales las fotografías que no tengan propaganda informativa catalogada dentro de los derechos de autor o que se ilustren con el nombre comercial hasta luego de pasado cinco (5) años.`),
  ];
}

function cohostingTitulos(ord) {
  return [
    clauseHeading(ord, "Títulos."),
    paraText(`Los títulos de las cláusulas y sub-cláusulas de este instrumento se consignan únicamente para facilidad de referencia, no tienen efecto alguno para su interpretación o ejecución del contrato.`),
  ];
}

function cohostingDisputas(ord) {
  return [
    clauseHeading(ord, "Disputas."),
    paraText(`En caso de que surja cualquier disputa relacionada con la interpretación, cumplimiento o ejecución de los términos del presente contrato, las partes se comprometen en primera instancia a intentar resolverla de manera amistosa mediante acuerdo directo entre ellas.`),
    paraText(`Si transcurrido un plazo de treinta (30) días calendario desde que una de las partes haya notificado por escrito la existencia de la disputa no se hubiera alcanzado una solución satisfactoria, cualquiera de las partes podrá someter el asunto a los Tribunales de Justicia del Departamento de Guatemala, siendo esta la jurisdicción y el lugar convenido por ambas partes.`),
    paraText(`En caso de que una de las partes inicie una acción legal para hacer cumplir los términos del presente acuerdo, la parte que prevalezca sustancialmente podrá tener derecho al reembolso de honorarios razonables de abogado y de los costos legales incurridos durante el proceso.`),
  ];
}

function cohostingDeclaracion(ord, lt) {
  const D = lt ? "DUEÑO" : "Dueño";
  return [
    clauseHeading(ord, "Declaración Final."),
    paraText(`Declaramos los comparecientes en las calidades con que actuamos, que en los términos consignados aceptamos el contenido íntegro del presente instrumento por ser la expresión fiel y clara de la voluntad que hemos manifestado. Hacemos constar lo siguiente: **I.** Que hemos tenido a la vista los documentos con que cada compareciente acredita la representación que ejerce; **II.** Que hemos tenido a la vista el título con que el ${D} acredita ser propietaria del bien inmueble objeto de este contrato; y **III.** Que hemos leído lo escrito y bien impuestos de su contenido, validez, objeto, efectos legales y obligación de registro, lo ratificamos, aceptamos y firmamos electrónicamente.`),
  ];
}

function cohostingContent(tipo, data) {
  const lt = tipo === "cohosting_juridica_lt";
  const out = [paraText(cohostingIntro(tipo, data)), ...cohostingPrimeraSegunda(tipo, data)];

  if (lt) {
    // Largo plazo
    out.push(clauseHeading("Tercera", "Del Plazo."));
    out.push(paraText(`El presente contrato tendrá una duración inicial de veinte (20) años contados a partir de la fecha de su firma.`));
    out.push(paraText(`Las partes acuerdan establecer un período mínimo obligatorio de operación de veinticuatro (24) meses contados a partir del inicio de operaciones del inmueble en las plataformas digitales.`));
    out.push(paraText(`Durante este período mínimo ninguna de las partes podrá dar por terminado el presente contrato de forma unilateral, salvo en caso de incumplimiento grave debidamente comprobado.`));
    out.push(paraText(`Transcurrido el período mínimo obligatorio, cualquiera de las partes podrá dar por terminado el contrato mediante notificación escrita con al menos noventa (90) días calendario de anticipación.`));
    out.push(paraText(`El establecimiento de este período mínimo tiene como finalidad garantizar la estabilidad operativa del proyecto, permitir la consolidación del posicionamiento comercial del inmueble y proteger la inversión estratégica realizada por el HOST en la conceptualización, posicionamiento y operación del inmueble.`));

    out.push(clauseHeading("Cuarta", "Terminación Anticipada y Compensación."));
    out.push(paraText(`En caso de que el DUEÑO decida dar por terminado el presente contrato antes de haber transcurrido el período mínimo obligatorio de veinticuatro (24) meses, deberá pagar al HOST una compensación económica calculada de la siguiente manera:`));
    out.push(paraBullet(`Si la terminación ocurre durante los primeros tres (3) meses de operación, la compensación se calculará utilizando como referencia la proyección de ingresos contenida en el estudio de mercado elaborado al inicio del proyecto.`));
    out.push(paraBullet(`Si la terminación ocurre entre el mes tres (3) y el mes seis (6) de operación, la compensación se calculará tomando como referencia el mes con mayores ingresos generados durante dicho período.`));
    out.push(paraBullet(`Si la terminación ocurre después del mes seis (6) de operación, la compensación se calculará tomando como referencia el promedio de ingresos de los últimos tres (3) meses de operación.`));
    out.push(paraText(`La compensación corresponderá al equivalente a los honorarios de gestión que el HOST habría percibido durante los meses restantes necesarios para completar el período mínimo obligatorio establecido en el presente contrato.`));
    out.push(paraText(`El pago de dicha compensación deberá realizarse dentro de los quince (15) días calendario siguientes a la notificación de terminación anticipada.`));

    out.push(clauseHeading("Quinta", "De la Operación."));
    out.push(paraText(`Todas las reservas serán efectuadas a través de plataformas digitales (Airbnb, Vrbo, Tripadvisor, Google, reservas directas o similares) a menos que exista un acuerdo especial entre el DUEÑO y el HOST. Solamente el HOST será responsable de aceptar reservas.`));
    out.push(paraText(`Durante la vigencia del presente contrato, el HOST será el único operador autorizado para la administración, promoción, gestión y comercialización del inmueble en plataformas de hospedaje de corta y mediana estancia.`));
    out.push(paraText(`El DUEÑO se compromete a no crear, operar o permitir la operación de anuncios paralelos del inmueble en plataformas digitales tales como Airbnb, Vrbo, Booking, Expedia, Google o cualquier plataforma similar, ya sea de forma directa o a través de terceros.`));
    out.push(paraText(`Asimismo, el DUEÑO no podrá contratar a otro operador, administrador o gestor para realizar actividades equivalentes a las realizadas por el HOST durante la vigencia del presente contrato.`));
    out.push(paraText(`El objetivo de esta cláusula es garantizar coherencia en la estrategia comercial, evitar conflictos operativos y proteger la estabilidad del posicionamiento del inmueble en los diferentes canales de comercialización.`));
    out.push(paraText(`El HOST se encarga de mantener el inventario de insumos de limpieza mes a mes y el monto total será pagado por el DUEÑO.`));

    out.push(...cohostingIngresos("Sexta", true));

    out.push(clauseHeading("Séptima", "Propiedad Intelectual."));
    out.push(paraText(`Todo concepto creativo, identidad de marca, nombre comercial, narrativa de marca, material fotográfico, textos promocionales, estrategia de posicionamiento, manuales operativos, diseño de experiencia del huésped, material audiovisual y cualquier contenido desarrollado por el HOST durante la preparación y operación del proyecto será considerado propiedad intelectual del HOST.`));
    out.push(paraText(`El DUEÑO reconoce que dichos elementos forman parte del know-how y de la identidad comercial del HOST.`));
    out.push(paraText(`En caso de terminación del presente contrato, el DUEÑO no podrá continuar utilizando la marca, concepto comercial, material promocional o cualquier elemento creativo desarrollado por el HOST sin autorización previa y por escrito de este último.`));
    out.push(paraText(`El HOST podrá utilizar el material desarrollado durante la vigencia del contrato para fines promocionales, portafolio profesional y desarrollo de futuras oportunidades comerciales.`));

    out.push(...cohostingFiscal("Octava", true));
    out.push(...cohostingUso("Novena", true));
    out.push(...cohostingObligacionesDueno("Décima", true));
    out.push(...cohostingObligacionesHost("Décima Primera", true));
    out.push(...cohostingEspecial("Décima Segunda", true));
    out.push(...cohostingTitulos("Décima Tercera"));
    out.push(...cohostingDisputas("Décima Cuarta"));
    out.push(...cohostingDeclaracion("Décima Quinta", true));
  } else {
    // Corto plazo (individual / jurídica)
    out.push(clauseHeading("Tercera", "Del Plazo."));
    out.push(paraText(`Este contrato tendrá vigencia de un año a partir de la fecha de firma por ambas partes, renovable automáticamente por periodos iguales mediante cruce de cartas, correo electrónico o cualquier otro medio escrito que manifieste la voluntad de continuidad.`));
    out.push(paraText(`En caso de no realizarse dicha renovación formal, el contrato seguirá vigente bajo las mismas condiciones hasta que cualquiera de las partes comunique por escrito su intención de darlo por terminado, con al menos treinta (30) días de anticipación.`));

    out.push(clauseHeading("Cuarta", "De la Operación."));
    out.push(paraText(`Todas las reservas serán efectuadas a través de plataformas digitales (Airbnb, Vrbo, Tripadvisor, Google, reservas directas o similares) a menos que exista un acuerdo especial entre el dueño y el host. Solamente el Host será responsable de aceptar reservas.`));
    out.push(paraText(`El dueño no creará un anuncio en paralelo al anuncio del host, durante la vigencia del presente acuerdo.`));
    out.push(paraText(`El Host será responsable de gestionar y mantener el inventario de insumos de limpieza necesarios para la operación del inmueble, realizando las reposiciones correspondientes mes a mes. El costo total de dichos insumos será asumido por el Dueño.`));
    out.push(paraText(`Para efectos de control presupuestario, se establece un presupuesto mensual máximo de **Q${data.presupuestoInsumos || "[monto]"}** para la compra de insumos. El único mes en que este monto podrá superarse sin autorización previa será el primer mes de operación, durante el cual se realizará un abastecimiento general inicial de insumos.`));
    out.push(paraText(`En los meses posteriores, el Host deberá respetar el presupuesto mensual establecido, y cualquier gasto que exceda dicho monto deberá contar con autorización previa por escrito del Dueño antes de realizar la compra correspondiente.`));

    out.push(...cohostingIngresos("Quinta", false));
    out.push(...cohostingFiscal("Sexta", false));
    out.push(...cohostingUso("Séptima", false));
    out.push(...cohostingObligacionesDueno("Octava", false));
    out.push(...cohostingObligacionesHost("Novena", false));
    out.push(...cohostingEspecial("Décima", false));
    out.push(...cohostingTitulos("Décima Primera"));
    out.push(...cohostingDisputas("Décima Segunda"));
    out.push(...cohostingDeclaracion("Décima Tercera", false));
  }
  return out;
}

/* Co-hosting signature block — Dueño / El Host */
function cohostingSignatureBlock(tipo, data) {
  const { Paragraph, TextRun } = window.docx;
  const ownerName = tipo === "cohosting_individual"
    ? (data.duenoNombre || "[NOMBRE DEL DUEÑO]")
    : (data.repNombre || "[NOMBRE DEL REPRESENTANTE]");
  return [
    new Paragraph({
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({ text: `Guatemala, ${formatLongDate(data.fecha)}.`, font: "Cormorant Garamond", size: 22, color: INK }),
      ],
    }),
    new Paragraph({
      spacing: { before: 480, after: 0 },
      border: { top: { style: "single", size: 6, color: INK } },
      children: [ new TextRun({ text: ownerName, bold: true, font: "Montserrat", size: 16, color: INK }) ],
    }),
    new Paragraph({
      spacing: { after: 280 },
      children: [ new TextRun({ text: "DUEÑO", font: "Montserrat", size: 14, characterSpacing: 60, color: INK }) ],
    }),
    new Paragraph({
      spacing: { before: 320, after: 0 },
      border: { top: { style: "single", size: 6, color: INK } },
      children: [ new TextRun({ text: data.contratanteNombre, bold: true, font: "Montserrat", size: 16, color: INK }) ],
    }),
    new Paragraph({
      children: [ new TextRun({ text: "EL HOST — SPACIO AM S.A.", font: "Montserrat", size: 14, characterSpacing: 60, color: INK }) ],
    }),
  ];
}

/* Signature block — common to all */
function signatureBlock(data) {
  const { Paragraph, TextRun, AlignmentType } = window.docx;
  const fechaTxt = formatLongDate(data.fecha);
  return [
    new Paragraph({
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: `Guatemala, ${fechaTxt}.`,
          font: "Cormorant Garamond",
          size: 22,
          color: INK,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 480, after: 0 },
      border: { top: { style: "single", size: 6, color: INK } },
      children: [
        new TextRun({
          text: data.prestadorNombre || "—",
          bold: true,
          font: "Montserrat",
          size: 16,
          color: INK,
        }),
      ],
    }),
    new Paragraph({
      spacing: { after: 280 },
      children: [
        new TextRun({
          text: "EL PRESTADOR",
          font: "Montserrat",
          size: 14,
          characterSpacing: 60,
          color: INK,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 320, after: 0 },
      border: { top: { style: "single", size: 6, color: INK } },
      children: [
        new TextRun({
          text: data.contratanteNombre,
          bold: true,
          font: "Montserrat",
          size: 16,
          color: INK,
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: "EL CONTRATANTE — SPACIO AM, S.A.",
          font: "Montserrat",
          size: 14,
          characterSpacing: 60,
          color: INK,
        }),
      ],
    }),
  ];
}

/* ─ Build a Header that places a single letterhead JPG as a floating
   "behind document" image filling the full 8.5×11" page. This is the
   pattern Word uses for branded letterhead and is what Google Docs
   imports correctly. We use it once for the cover (first page) and
   once for the continuation (subsequent pages), keyed by section's
   `titlePage` flag. ─ */
function buildLetterheadHeader(imgBuf) {
  const { Header, Paragraph, ImageRun, HorizontalPositionRelativeFrom,
          VerticalPositionRelativeFrom, TextWrappingType, TextWrappingSide } = window.docx;
  return new Header({
    children: [
      new Paragraph({
        children: [
          new ImageRun({
            data: imgBuf,
            // 8.5"×11" at 96 DPI → 816×1056 px. docx ImageRun expects
            // dimensions in pixels (it converts to EMU internally).
            transformation: { width: 816, height: 1056 },
            floating: {
              horizontalPosition: {
                relative: HorizontalPositionRelativeFrom.PAGE,
                offset: 0,
              },
              verticalPosition: {
                relative: VerticalPositionRelativeFrom.PAGE,
                offset: 0,
              },
              behindDocument: true,
              wrap: {
                type: TextWrappingType.NONE,
                side: TextWrappingSide.BOTH_SIDES,
              },
              allowOverlap: true,
            },
          }),
        ],
      }),
    ],
  });
}

/* ============================================================
   GENERIC — normalized {title, intro, body, clauses, signatures}
   contract → docx paragraphs. Used by the Empleados documents
   and honors per-clause edits (applied by the caller).
   ============================================================ */
function blocksToParas(blocks) {
  const out = [];
  (blocks || []).forEach((bl) => {
    if (bl.t === "ul" || bl.t === "ol") (bl.items || []).forEach((it) => out.push(paraBullet(it)));
    else out.push(paraText(bl.text || ""));
  });
  return out;
}
function genericContent(contract) {
  const out = [];
  if (contract.intro) out.push(paraText(contract.intro));
  out.push(...blocksToParas(contract.body));
  (contract.clauses || []).forEach((c) => {
    out.push(clauseHeading(c.ord, c.label));
    out.push(...blocksToParas(c.blocks));
  });
  return out;
}
function genericSignatureBlock(contract) {
  const { Paragraph, TextRun } = window.docx;
  const s = contract.signatures || {};
  const out = [];
  if (s.date) {
    out.push(new Paragraph({
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: s.date, font: "Cormorant Garamond", size: 22, color: INK })],
    }));
  }
  (s.parties || []).forEach((p, i) => {
    const name = String(p.name || "").replace(/\*\*/g, "").replace(/[⟦⟧]/g, "");
    out.push(new Paragraph({
      spacing: { before: i === 0 && !s.date ? 240 : (i === 0 ? 480 : 320), after: 0 },
      border: { top: { style: "single", size: 6, color: INK } },
      children: [new TextRun({ text: name, bold: true, font: "Montserrat", size: 16, color: INK })],
    }));
    out.push(new Paragraph({
      spacing: { after: 280 },
      children: [new TextRun({ text: (p.role || "").toUpperCase(), font: "Montserrat", size: 14, characterSpacing: 60, color: INK })],
    }));
  });
  return out;
}

/* ─── MAIN: generate .docx blob ─── */
async function generateDocxBlob(tipo, data, custom, edits) {
  if (!window.docx) {
    throw new Error("docx-js no está cargado");
  }
  const {
    Document, Packer, Paragraph, TextRun,
    AlignmentType, HeadingLevel,
    convertInchesToTwip,
  } = window.docx;

  // Fetch letterhead JPGs as buffers (one for cover, one for continuation)
  const [coverBuf, contBuf] = await Promise.all([
    fetchAsArrayBuffer("assets/letterhead-cover.jpeg"),
    fetchAsArrayBuffer("assets/letterhead-cont.jpeg"),
  ]);

  const isEmp = tipo && tipo.indexOf("emp_") === 0;
  const isCohostingDoc = tipo === "cohosting_individual" || tipo === "cohosting_juridica" || tipo === "cohosting_juridica_lt";

  // Title
  let title;
  if (isEmp) {
    const built = window.EMPLEADO_BUILDERS[tipo] ? window.EMPLEADO_BUILDERS[tipo](data) : null;
    title = built ? built.title : "Documento";
  } else if (tipo === "limpieza") title = "Contrato de Prestación de Servicios de Limpieza";
  else if (tipo === "mantenimiento") title = "Contrato de Prestación de Servicios de Mantenimiento";
  else if (isCohostingDoc) title = "Acuerdo de co-hosting";
  else title = custom?.title || "Contrato de Prestación de Servicios";

  // Body content per tipo
  let body, sigBlock;
  if (isEmp) {
    let contract = window.EMPLEADO_BUILDERS[tipo](data);
    if (edits && window.applyEdits) contract = window.applyEdits(contract, edits);
    body = genericContent(contract);
    sigBlock = genericSignatureBlock(contract);
  } else {
    if (tipo === "limpieza") body = limpiezaContent(data);
    else if (tipo === "mantenimiento") body = mantenimientoContent(data);
    else if (isCohostingDoc) body = cohostingContent(tipo, data);
    else body = personalizadoContent(data, custom);
    sigBlock = isCohostingDoc ? cohostingSignatureBlock(tipo, data) : signatureBlock(data);
  }

  // Title paragraph
  const titlePara = new Paragraph({
    spacing: { before: 120, after: 280 },
    children: [
      new TextRun({
        text: title,
        font: "Cormorant Garamond",
        size: 32,
        color: INK,
      }),
    ],
  });

  const eyebrow = new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({
        text: "CONTRATO · SPACIO AM",
        font: "Montserrat",
        size: 14,
        color: EARTH,
        characterSpacing: 80,
      }),
    ],
  });

  const doc = new Document({
    /* Force built-in styles to ink color so Google Docs's defaults
       (blue headings, etc.) never override the brand palette. */
    styles: {
      default: {
        document: {
          run: { font: "Montserrat", size: 18, color: INK },
          paragraph: { spacing: { line: 280 } },
        },
        heading1: {
          run: { font: "Cormorant Garamond", size: 32, color: INK, bold: false },
        },
        heading2: {
          run: { font: "Cormorant Garamond", size: 22, color: INK, bold: false },
        },
        heading3: {
          run: { font: "Montserrat", size: 18, color: INK, bold: true },
        },
        title: {
          run: { font: "Cormorant Garamond", size: 32, color: INK, bold: false },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: convertInchesToTwip(8.5), height: convertInchesToTwip(11) },
          /* Margins matched to the letterhead artwork: the cream column on
             the left + brand marks on the right reserve ~2" of side space,
             and the top/bottom decorative elements need room. Content sits
             in the central column. */
          margin: {
            top: convertInchesToTwip(1.2),
            bottom: convertInchesToTwip(1.0),
            left: convertInchesToTwip(2.6),    // matches cream chrome column in the letterhead
            right: convertInchesToTwip(0.9),
          },
        },
        /* Enables a distinct first-page header. Google Docs respects this
           flag on import and shows "Different first page" in the header
           options, applying the cover image only to page 1. */
        titlePage: true,
      },
      headers: {
        first:   buildLetterheadHeader(coverBuf),
        default: buildLetterheadHeader(contBuf),
      },
      children: [
        eyebrow,
        titlePara,
        ...body,
        ...sigBlock,
      ],
    }],
  });

  return await Packer.toBlob(doc);
}

window.generateDocxBlob = generateDocxBlob;
