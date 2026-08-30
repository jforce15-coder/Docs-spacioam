/* ============================================================
   SPACIO AM — Empleados (RR. HH.)
   Five employee documents rendered in the block/membrete format
   consumed by PaginatedContract:
     • promocion     → Carta de promoción
     • contratacion  → Contrato individual de trabajo
     • aumento       → Carta de aumento de salario
     • goce          → Constancia de goce de vacaciones
     • bono_estrella → Términos y condiciones · Programa Soy Estrella
   ============================================================ */

/* Inline markup helpers (parseRich understands **bold** and ⟦ph⟧) */
const empB = (v) => `**${v}**`;
const empPh = (v, p) => (v === undefined || v === null || v === "") ? `⟦${p}⟧` : String(v);
const empBph = (v, p) => (v === undefined || v === null || v === "") ? `⟦${p}⟧` : `**${v}**`;
const empDate = (iso, p) => iso ? formatLongDate(iso) : `⟦${p || "fecha"}⟧`;
const empQ = (v) => `Q${empPh(v, "monto")}`;

/* Spacio AM comparecencia (employer side) — used by the laboral intro */
function empHostComparece(d) {
  return `el señor ${empB(d.contratanteNombre)} de ${d.contratanteEdad} años, ${d.contratanteEstado}, guatemalteco, comerciante, de este domicilio, portador del Documento Personal de Identificación con Código Único de Identificación número ${empB(d.contratanteDPI)} extendido por el Registro Nacional de las Personas de la República de Guatemala, quien actúa en su calidad de ADMINISTRADOR ÚNICO Y REPRESENTANTE LEGAL de la entidad ${empB("SPACIO AM, SOCIEDAD ANÓNIMA")}, calidad que acredita con el acta notarial autorizada en esta ciudad el ${empPh(d.actaFecha, "fecha del acta")} por el notario ${empPh(d.actaNotario, "notario")}, inscrita en el Registro Mercantil General de la República al número ${empPh(d.regNumero, "número")}, folio ${empPh(d.regFolio, "folio")} del libro ${empPh(d.regLibro, "libro")} de Auxiliares de comercio.`;
}

/* ─── 1 · Contrato individual de trabajo (contratación) ── */
function buildContratacion(d) {
  const intro = `El presente contrato se celebra en la ciudad de Guatemala, el ${empB(formatLongDateCap(d.fecha))}, entre: por una parte el señor ${empBph(d.empNombre, "NOMBRE DEL TRABAJADOR")} de ${empPh(d.empEdad, "edad")} años, ${empPh(d.empEstado, "estado civil")}, ${empPh(d.empNacionalidad, "nacionalidad")}, ${empPh(d.empProfesion, "profesión u oficio")}, con domicilio en ${empPh(d.empDomicilio, "domicilio")}, portador del Documento Personal de Identificación con Código Único de Identificación número ${empBph(d.empDPI, "DPI")} extendido por el Registro Nacional de las Personas de la República de Guatemala, quien actúa en representación propia; y por otra parte, ${empHostComparece(d)} Declaran ambos comparecientes que se conocen mutuamente, que reconocen y aceptan la calidad con que actúa cada uno, siendo la representación amplia y suficiente conforme la ley y a su juicio para otorgar el presente contrato. Los comparecientes en el libre ejercicio de nuestros derechos civiles manifestamos que celebramos el CONTRATO INDIVIDUAL DE TRABAJO que se contiene en las siguientes cláusulas:`;

  return {
    title: "Contrato individual de trabajo",
    intro,
    clauses: [
      { ord: "Primera", label: "Del inicio de la relación laboral:", blocks: [
        { t: "p", text: `La relación de trabajo se inicia el día ${empBph(d.empFechaInicio ? formatLongDate(d.empFechaInicio) : "", "fecha de inicio")}.` },
      ]},
      { ord: "Segunda", label: "Del cargo y servicios del trabajador:", blocks: [
        { t: "p", text: `El trabajador deberá desempeñar su trabajo con la eficiencia y esmero apropiados, en la forma, tiempo y lugar indicados por el patrono, ocupando el cargo de ${empBph(d.empCargo, "cargo")}, correspondiéndole, en consecuencia, prestar los servicios inherentes al mismo y que, de manera enunciativa y no limitativa, son los siguientes:` },
        { t: "ul", items: [
          `Coordinar y supervisar el proceso de check-in y check-out de los huéspedes.`,
          `Gestionar y coordinar el equipo de limpieza para garantizar la limpieza y la preparación adecuada de las propiedades para los huéspedes.`,
          `Realizar seguimiento y resolver las quejas y los problemas de los huéspedes de manera rápida y efectiva, incluyendo la comunicación con los huéspedes antes, durante y después de su estancia.`,
          `Gestionar la disponibilidad de las propiedades en las plataformas de alquiler de corta estancia, así como en otros canales de reservas.`,
          `Coordinar la gestión de reservas y el calendario de ocupación, asegurando que las propiedades estén reservadas en los momentos más convenientes para maximizar los ingresos.`,
          `Promover servicios adicionales al hospedaje.`,
        ]},
        { t: "p", text: `Garantizar el cumplimiento de las regulaciones y leyes locales en cuanto a la administración de propiedades de alquiler vacacional.` },
        { t: "p", text: `Asegurarse de que las propiedades estén equipadas con todas las comodidades necesarias para brindar una experiencia de hospedaje excelente a los huéspedes.` },
        { t: "p", text: `Gestionar y supervisar la limpieza y mantenimiento de las propiedades para garantizar que siempre estén en óptimas condiciones.` },
        { t: "ol", items: [
          `Establecer y mantener relaciones positivas con los vecinos y comunidades locales para garantizar que los huéspedes se comporten de manera respetuosa y responsable durante su estadía.`,
          `Realizar informes periódicos y análisis de datos para evaluar el rendimiento de las propiedades y proponer mejoras en la gestión y la experiencia de los huéspedes.`,
          `Realizar un seguimiento regular de los niveles de suministros y asegurarse de que siempre haya suficiente stock disponible para los huéspedes, incluyendo toallas, ropa de cama, artículos de tocador, productos de limpieza y otros artículos esenciales.`,
          `Coordinar la entrega y el almacenamiento de suministros nuevos, asegurándose de que estén en perfecto estado y listos para su uso.`,
          `Mantener un registro detallado de los costos y la utilización de suministros para garantizar que se estén administrando de manera eficiente y que se estén utilizando de manera rentable.`,
          `Gestionar y mantener un inventario de todos los suministros de la propiedad, incluyendo la realización de inspecciones regulares para asegurarse de que no haya pérdidas o daños.`,
          `Investigar y recomendar nuevas soluciones y productos de suministros que puedan mejorar la experiencia del huésped y optimizar la gestión de insumos.`,
        ]},
        { t: "p", text: `El trabajador cumplirá con las obligaciones que sean inherentes a su cargo, las establecidas en el Código de Trabajo y demás disposiciones legales y reglamentarias de la materia.` },
      ]},
      { ord: "Tercera", label: "No competencia:", blocks: [
        { t: "p", text: `El trabajador acuerda que durante la duración de su empleo y durante un período de 12 meses posteriores a la terminación de su empleo, no realizará ningún servicio de co-anfitrión o de alojamiento a cualquier socio o prospecto de Spacio AM, ya sea de manera individual o como parte de otra organización, sin el consentimiento previo y por escrito de Spacio AM.` },
        { t: "p", text: `El trabajador reconoce y acepta que la cláusula de no competencia anterior es esencial para la protección de los intereses legítimos de Spacio AM y que una violación de esta cláusula causaría un daño irreparable a Spacio AM. El trabajador acuerda que, en caso de incumplimiento de esta cláusula, Spacio AM tendrá derecho a tomar medidas legales apropiadas para proteger sus intereses legítimos, incluyendo la recuperación de daños y perjuicios, así como el cese inmediato de las actividades en violación de esta cláusula.` },
      ]},
      { ord: "Cuarta", label: "Del lugar de prestación de servicios:", blocks: [
        { t: "p", text: `El lugar de trabajo será en ${empBph(d.empLugarTrabajo, "lugar de trabajo")}, o en cualquier otro lugar en que fuere designado por el empleador.` },
      ]},
      { ord: "Quinta", label: "Plazo del contrato:", blocks: [
        { t: "p", text: `La duración del presente contrato es por tiempo indefinido.` },
      ]},
      { ord: "Sexta", label: "Jornada de trabajo:", blocks: [
        { t: "p", text: `La jornada ordinaria será de lunes a domingo de 9:00 a.m. a 6:00 p.m. El trabajador podrá elegir un día de descanso de la semana que no perjudique los intereses del patrono.` },
      ]},
      { ord: "Séptima", label: "Del salario y forma de pago:", blocks: [
        { t: "p", text: `En observancia de lo preceptuado en las disposiciones legales vigentes, se pacta una remuneración de ${empBph(d.empSalario, "salario")} mensuales. El salario será pagado en moneda de curso legal en la República de Guatemala, en forma mensual durante los primeros 5 días de cada mes; en el caso de que el día de pago sea inhábil el pago se efectuará el día hábil anterior o posterior. Adicionalmente, el empleador pagará al trabajador la Bonificación Incentivo contenida en el Decreto 78-89 del Congreso de la República y sus reformas (Decretos 7-2000 y 37-2001 ambos del Congreso de la República), en las mismas condiciones de forma y tiempo pactadas para el pago del salario ordinario. El patrono podrá determinar que el pago tenga lugar dentro del centro de trabajo o por medio de depósito directo en cuenta bancaria del trabajador.` },
      ]},
      { ord: "Octava", label: "Otras prestaciones:", blocks: [
        { t: "p", text: `Las vacaciones, bonificación anual del Decreto 42-92 del Congreso de la República y aguinaldo se pagarán al trabajador de conformidad con la ley.` },
        { t: "p", text: `El presente contrato individual de trabajo se suscribe en el Municipio de Antigua Guatemala, Departamento de Sacatepéquez, el día ${empBph(d.empFechaInicio ? formatLongDate(d.empFechaInicio) : "", "fecha de suscripción")}, en tres ejemplares: uno para cada una de las partes y uno que el patrono remitirá a la Dirección General de Trabajo.` },
      ]},
      { ord: "Novena", label: "Período de prueba:", blocks: [
        { t: "p", text: `El trabajador estará en período de prueba por un plazo de 2 meses. Durante el período de prueba cualquiera de las partes podrá extinguir la relación laboral sin expresión de causa, sin obligación de preaviso y sin derecho a indemnización alguna a la otra parte.` },
      ]},
      { ord: "Títulos", label: "", blocks: [
        { t: "p", text: `Los títulos de las cláusulas y sub-cláusulas de este instrumento se consignan únicamente para facilidad de referencia, no tienen efecto alguno para su interpretación o ejecución del contrato.` },
      ]},
      { ord: "Disputas", label: "", blocks: [
        { t: "p", text: `En caso de que exista una disputa con respecto a los términos de este contrato y se requiera una acción legal para hacer cumplir cualquiera de los términos en este documento, las partes acuerdan que la jurisdicción y el lugar serán en la CIUDAD DE GUATEMALA, GUATEMALA. En el caso de que una o más de las partes comiencen una acción legal para hacer cumplir los términos de este acuerdo, la parte que prevalezca sustancialmente puede tener derecho a honorarios razonables de abogado y costos incurridos al iniciar la acción.` },
      ]},
    ],
    signatures: {
      date: `Guatemala, ${formatLongDate(d.fecha)}.`,
      parties: [
        { name: empPh(d.empNombre, "NOMBRE DEL TRABAJADOR"), role: "El Trabajador" },
        { name: d.contratanteNombre, role: "El Patrono · Spacio AM, S.A." },
      ],
    },
  };
}

/* ─── 2 · Carta de promoción ───────────────────────────── */
function buildPromocion(d) {
  return {
    title: "Carta de promoción",
    body: [
      { t: "p", text: `Guatemala, ${formatLongDateCap(d.fecha)}.` },
      { t: "p", text: `Estimado(a) ${empBph(d.empNombre, "NOMBRE DEL COLABORADOR")}:` },
      { t: "p", text: `En Spacio AM reconocemos el talento, el compromiso y la dedicación de quienes hacen posible que cada espacio se sienta como un lugar al que vale la pena volver. Por ello, nos complace informarte que, en reconocimiento a tu desempeño, has sido promovido(a) del cargo de ${empBph(d.empCargoAnterior, "cargo anterior")} al cargo de ${empBph(d.empCargo, "nuevo cargo")}, con efectividad a partir del ${empBph(d.empFechaEfectiva ? formatLongDate(d.empFechaEfectiva) : "", "fecha efectiva")}.` },
      { t: "p", text: `Junto con este nuevo rol, tu salario mensual será de ${empBph(d.empSalario, "nuevo salario")}, además de las prestaciones de ley que ya te corresponden.` },
      { t: "p", text: `Confiamos plenamente en que asumirás este nuevo reto con la misma excelencia que te ha caracterizado. Gracias por seguir construyendo con nosotros.` },
      { t: "p", text: `Con aprecio,` },
    ],
    signatures: {
      date: "",
      parties: [
        { name: d.contratanteNombre, role: "Spacio AM, S.A." },
        { name: empPh(d.empNombre, "NOMBRE DEL COLABORADOR"), role: "Recibido y enterado(a)" },
      ],
    },
  };
}

/* ─── 3 · Carta de aumento de salario (sin cambio de cargo) */
function buildAumento(d) {
  return {
    title: "Carta de aumento de salario",
    body: [
      { t: "p", text: `Guatemala, ${formatLongDateCap(d.fecha)}.` },
      { t: "p", text: `Estimado(a) ${empBph(d.empNombre, "NOMBRE DEL COLABORADOR")}:` },
      { t: "p", text: `En Spacio AM valoramos profundamente tu esfuerzo, tu compromiso y la calidad con la que desempeñas el cargo de ${empBph(d.empCargo, "cargo")}. En reconocimiento a tu desempeño, nos complace informarte que, a partir del ${empBph(d.empFechaEfectiva ? formatLongDate(d.empFechaEfectiva) : "", "fecha efectiva")}, tu salario mensual se incrementará de ${empBph(d.empSalarioAnterior, "salario anterior")} a ${empBph(d.empSalario, "nuevo salario")}.` },
      { t: "p", text: `El resto de las condiciones de tu relación laboral se mantienen sin cambios, conservando todas las prestaciones de ley que te corresponden.` },
      { t: "p", text: `Gracias por seguir dando lo mejor de ti. Seguimos construyendo juntos espacios en donde vale la pena volver a despertar.` },
      { t: "p", text: `Con aprecio,` },
    ],
    signatures: {
      date: "",
      parties: [
        { name: d.contratanteNombre, role: "Spacio AM, S.A." },
        { name: empPh(d.empNombre, "NOMBRE DEL COLABORADOR"), role: "Recibido y enterado(a)" },
      ],
    },
  };
}

/* ─── 4 · Constancia de goce de vacaciones ─────────────── */
function buildGoce(d) {
  return {
    title: "Constancia de goce de vacaciones",
    body: [
      { t: "p", text: `Yo, ${empBph(d.empNombre, "NOMBRE DEL TRABAJADOR")}, ${empPh(d.empEstado, "estado civil")}, me identifico con Documento Personal de Identificación (DPI) número ${empBph(d.empDPI, "DPI")}, hago constar:` },
      { t: "p", text: `Que laboro en la empresa ${empB("SPACIO AM, SOCIEDAD ANÓNIMA")} desempeñando el cargo de ${empBph(d.empCargo, "cargo")} a partir de la fecha ${empB(empDate(d.empFechaInicio, "fecha de ingreso"))}, que he gozado a mi entera satisfacción del período de vacaciones a que tengo derecho por ley, el cual corresponde al período laboral del ${empB(empDate(d.vacPeriodoInicio, "inicio del período"))} al ${empB(empDate(d.vacPeriodoFin, "fin del período"))}.` },
      { t: "p", text: `Por lo anterior, acepto que no tengo ningún derecho a reclamos posteriores.` },
    ],
    signatures: {
      date: `Guatemala, ${formatLongDate(d.fecha)}.`,
      parties: [
        { name: empPh(d.empNombre, "NOMBRE DEL TRABAJADOR"), role: "Trabajador(a)" },
        { name: d.contratanteNombre, role: "Patrono · Spacio AM, S.A." },
      ],
    },
  };
}

/* ─── 5 · Términos y condiciones — Programa Soy Estrella ── */
function buildBonoEstrella(d) {
  return {
    title: "Términos y condiciones del programa Soy Estrella",
    intro: `El Programa Soy Estrella está diseñado para reconocer y recompensar la excelencia. A continuación, se detallan las metas y los criterios de evaluación para el cargo de ${empBph(d.empRol, "rol")} que forman parte del programa:`,
    clauses: [
      { ord: "Meta 01", label: "Aumento de la ocupación en ciudad.", blocks: [
        { t: "p", text: `${empB("Descripción:")} el objetivo es mejorar la tasa de ocupación de las propiedades en ciudad a través de upselling, promociones, fidelización de huéspedes y mejoras en la experiencia del huésped.` },
        { t: "p", text: empB("Meta numérica:") },
        { t: "ul", items: [ `Valor actual: 81%`, `Valor meta: 85%` ] },
        { t: "p", text: `${empB("Memoria de cálculo:")} noches ocupadas / noches disponibles.` },
        { t: "p", text: `${empB("Fuente:")} hospitable.` },
        { t: "p", text: `${empB("Plazo:")} 31 dic 2025.` },
      ]},
      { ord: "Meta 02", label: "Mejora en la calificación total de las propiedades.", blocks: [
        { t: "p", text: `${empB("Descripción:")} el objetivo es elevar la calificación promedio de todas las propiedades mediante un servicio más eficiente y una mejor experiencia de los huéspedes.` },
        { t: "p", text: empB("Meta numérica:") },
        { t: "ul", items: [ `Valor actual: 4.7`, `Valor meta: 4.8` ] },
        { t: "p", text: empB("Subproyectos:") },
        { t: "ul", items: [
          `Revisión del 100% de reviews con menos de 4 estrellas y plan de acción correctivo.`,
          `Mejoras en procesos de check-in y check-out antes de julio 2025.`,
          `80% de incidencias reportadas por huéspedes con seguimiento y resolución documentada.`,
        ]},
      ]},
      { ord: "Meta 03", label: "Registro y cobro de daños causados por huéspedes.", blocks: [
        { t: "p", text: `${empB("Descripción:")} implementar un proceso de control y cobro eficiente en caso de daños o problemas causados por los huéspedes durante su estadía.` },
        { t: "p", text: `${empB("Meta numérica:")} 90% de los daños o incidencias reportadas deben estar registradas y con cobro aplicado cuando corresponda.` },
      ]},
      { ord: "Meta 04", label: "Implementación de checklist de calidad en limpiezas.", blocks: [
        { t: "p", text: `${empB("Descripción:")} garantizar que cada checkout cumpla con los estándares de calidad establecidos para evitar problemas con los nuevos huéspedes.` },
        { t: "p", text: `${empB("Meta numérica:")} 80% del total de checkouts deben cumplir con el checklist de calidad.` },
      ]},
      { ord: "Pago", label: "Fecha de pago.", blocks: [
        { t: "p", text: `El pago del Bono Estrella se realizará en la segunda quincena de enero.` },
      ]},
      { ord: "Monto", label: "Monto del Bono Estrella.", blocks: [
        { t: "p", text: `El promedio de ingreso de los últimos 6 meses.` },
        { t: "p", text: `${empB("Fórmula:")} ingreso promedio de los últimos 6 meses × el porcentaje de cumplimiento.` },
      ]},
      { ord: "Evaluación", label: "Evaluación y condiciones de pago.", blocks: [
        { t: "p", text: `Cada empleado será evaluado mensualmente en base a cuatro metas clave.` },
        { t: "p", text: `Todas las metas tienen el mismo peso en la evaluación (cada una representa el 25% del total).` },
        { t: "p", text: empB("Escala de pago del bono según el resultado obtenido:") },
        { t: "ul", items: [
          `100% de cumplimiento: se otorga el 100% del bono.`,
          `Entre 75% y 99% de cumplimiento: se otorga el 80% del bono.`,
          `Entre 50% y 75% de cumplimiento: se otorga el 30% del bono.`,
          `Por debajo del 50% de cumplimiento: no se otorga el bono.`,
        ]},
      ]},
    ],
    signatures: {
      date: `Guatemala, ${formatLongDate(d.fecha)}.`,
      parties: [
        { name: empPh(d.empNombre, "NOMBRE DEL COLABORADOR"), role: "Colaborador(a)" },
        { name: d.contratanteNombre, role: "Spacio AM, S.A." },
      ],
    },
  };
}

/* ─── Builder registry + component wrappers ────────────── */
const EMPLEADO_BUILDERS = {
  emp_promocion: buildPromocion,
  emp_contratacion: buildContratacion,
  emp_aumento: buildAumento,
  emp_goce: buildGoce,
  emp_bono_estrella: buildBonoEstrella,
};

function ContratoEmpleado({ tipo, data, edits, onEdit, onReset }) {
  const build = EMPLEADO_BUILDERS[tipo];
  if (!build) return null;
  return (
    <PaginatedContract
      contract={build(data)}
      edits={edits}
      onEdit={onEdit}
      onReset={onReset}
    />
  );
}

Object.assign(window, {
  ContratoEmpleado,
  EMPLEADO_BUILDERS,
  buildPromocion, buildContratacion, buildAumento, buildGoce, buildBonoEstrella,
});
