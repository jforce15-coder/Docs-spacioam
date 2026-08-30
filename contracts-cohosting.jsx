/* ============================================================
   SPACIO AM — Co-hosting agreements (block-structured)
   Produces normalized {title, intro, clauses, signatures}
   objects that PaginatedContract renders into membrete sheets.
     • cohosting_individual   → Dueño persona individual
     • cohosting_juridica     → Dueño persona jurídica (corto plazo)
     • cohosting_juridica_lt  → Dueño persona jurídica (largo plazo)
   ============================================================ */

/* Inline helpers → rich-text markup understood by parseRich */
const _b = (v) => `**${v}**`;
const _ph = (v, p) => (v === undefined || v === null || v === "") ? `⟦${p}⟧` : String(v);
const _bph = (v, p) => (v === undefined || v === null || v === "") ? `⟦${p}⟧` : `**${v}**`;

/* Spacio AM comparecencia — shared by all co-hosting intros */
function _hostComparece(d) {
  return `el señor ${_b(d.contratanteNombre)} de ${d.contratanteEdad} años, ${d.contratanteEstado}, guatemalteco, comerciante, de este domicilio, portador del Documento Personal de Identificación con Código Único de Identificación número ${_b(d.contratanteDPI)} extendido por el Registro Nacional de las Personas de la República de Guatemala, quien actúa en su calidad de ADMINISTRADOR ÚNICO Y REPRESENTANTE LEGAL de la entidad ${_b("SPACIO AM, SOCIEDAD ANÓNIMA")}, calidad que acredita con el acta notarial autorizada en esta ciudad el ${_ph(d.actaFecha, "fecha del acta")} por el notario ${_ph(d.actaNotario, "notario")}, inscrita en el Registro Mercantil General de la República al número ${_ph(d.regNumero, "número")}, folio ${_ph(d.regFolio, "folio")} del libro ${_ph(d.regLibro, "libro")} de Auxiliares de comercio. Declaran ambos comparecientes que se conocen mutuamente, que reconocen y aceptan la calidad con que actúa cada uno, siendo la representación amplia y suficiente conforme la ley y a su juicio para otorgar el presente contrato. Los comparecientes en el libre ejercicio de nuestros derechos civiles manifestamos que celebramos el ACUERDO DE CO-HOSTING DE BIEN INMUEBLE que se contiene en las siguientes cláusulas:`;
}

function _introIndividual(d) {
  return `El presente Acuerdo se celebra en la ciudad de Guatemala, el ${_b(formatLongDateCap(d.fecha))}, entre: por una parte ${_bph(d.duenoNombre, "NOMBRE DEL DUEÑO")} de ${_ph(d.duenoEdad, "edad")} años, ${_ph(d.duenoEstado, "estado civil")}, ${_ph(d.duenoNacionalidad, "nacionalidad")}, ${_ph(d.duenoProfesion, "profesión u oficio")}, ${_ph(d.duenoDomicilio, "domicilio")}, portador del Documento Personal de Identificación con Código Único de Identificación número ${_bph(d.duenoDPI, "DPI")} extendido por el Registro Nacional de las Personas de la República de Guatemala, quien actúa en su calidad de PERSONA INDIVIDUAL; y por otra parte, ${_hostComparece(d)}`;
}

function _introJuridica(d) {
  return `El presente Acuerdo se celebra en la ciudad de Guatemala, el ${_b(formatLongDateCap(d.fecha))}, entre: por una parte, ${_bph(d.repNombre, "NOMBRE DEL REPRESENTANTE LEGAL")} de ${_ph(d.repEdad, "edad")} años, ${_ph(d.repEstado, "estado civil")}, ${_ph(d.repNacionalidad, "nacionalidad")}, con domicilio en ${_ph(d.repDomicilio, "domicilio")}, portador del Documento Personal de Identificación con Código Único de Identificación número ${_bph(d.repDPI, "DPI")} extendido por el Registro Nacional de las Personas de la República de Guatemala, quien actúa en su calidad de REPRESENTANTE LEGAL de la entidad ${_bph(d.entidadNombre, "NOMBRE DE LA ENTIDAD")}. Y por otra parte, ${_hostComparece(d)}`;
}

/* ── Primera / Segunda ─────────────────────────────────── */
function _primeraSegundaInd(d) {
  const n = _bph(d.duenoNombre, "NOMBRE DEL DUEÑO");
  return [
    { ord: "Primera", label: "Del Inmueble.", blocks: [
      { t: "p", text: `Manifiesta ${n} que es propietaria del bien inmueble ubicado en ${_ph(d.propDireccion, "dirección")} y dicho bien inmueble consiste en el departamento número ${_ph(d.propApto, "número de apto")}, ubicado en el nivel ${_ph(d.propPiso, "nivel")} del edificio ${_ph(d.propEdificio, "nombre de edificio")}.` },
    ]},
    { ord: "Segunda", label: "Del Acuerdo.", blocks: [
      { t: "p", text: `Mediante este acuerdo ${n}, a quien en el curso de este contrato podrá denominársele el "Dueño", da a ${_b("Spacio AM S.A.")}, a quien en el curso de este contrato podrá denominársele el "Host", quien toma el inmueble en administración y promoción del bien inmueble identificado en la cláusula anterior en el mercado de rentas a corto plazo, sujetándose el contrato a los siguientes términos y estipulaciones:` },
    ]},
  ];
}
function _primeraSegundaJur(d) {
  const n = _bph(d.repNombre, "NOMBRE DEL REPRESENTANTE");
  return [
    { ord: "Primera", label: "Del Inmueble.", blocks: [
      { t: "p", text: `Manifiesta ${n} que es propietario del bien inmueble ubicado en ${_ph(d.propDireccion, "dirección")} y dicho bien inmueble consiste en el departamento número ${_ph(d.propApto, "número de apto")}, ubicado en el nivel ${_ph(d.propPiso, "nivel")} del edificio ${_ph(d.propEdificio, "nombre de edificio")}.` },
    ]},
    { ord: "Segunda", label: "Del Acuerdo.", blocks: [
      { t: "p", text: `Mediante este acuerdo ${n} quien actúa en representación de ${_bph(d.entidadNombre, "NOMBRE DE LA ENTIDAD")}, a quien en el curso de este contrato podrá denominársele como el "Dueño", da a ${_b("Spacio AM S.A.")}, a quien en el curso de este contrato podrá denominársele el "Host", quien toma el inmueble en administración y promoción los bienes inmuebles identificados en la cláusula anterior en el mercado de rentas a corto plazo, sujetándose el contrato a los siguientes términos y estipulaciones:` },
    ]},
  ];
}

/* ── Shared clauses (D = Dueño label, H = Host label) ──── */
function _ingresos(ord, lt) {
  const D = lt ? "DUEÑO" : "dueño", H = lt ? "HOST" : "host";
  return { ord, label: "Los Ingresos.", blocks: [
    { t: "p", text: `El ${H} deberá pagar mensualmente antes del 5to día hábil a la cuenta de preferencia del ${D} y el ${H} dividirán los ingresos, correspondiéndole el ochenta por ciento (80%) para el ${D} y el veinte por ciento (20%) para el ${H}.` },
    { t: "p", text: `El cien por ciento (100%) de los cleaning fees irán para el ${H} quien destinará este ingreso para pago de personal de limpieza.` },
    { t: "p", text: `Las plataformas digitales de hospedaje (como Airbnb, Booking u otras equivalentes) aplican una comisión por reserva que oscila entre el 3% y el 15.5% dependiendo de la plataforma y la modalidad. Este porcentaje se mantendrá sin variación salvo que exista una notificación oficial emitida por la plataforma que confirme un ajuste en sus tarifas.` },
    { t: "p", text: `El ${H} se compromete a ajustar el precio de la propiedad de forma proporcional para compensar las comisiones cobradas por dichas plataformas. En los reportes mensuales que el ${H} entregue al ${D}, este ajuste aparecerá reflejado como parte del ingreso total, junto con el monto retenido por cada plataforma.` },
    { t: "p", text: `En relación al IVA, el ${H} transferirá al Propietario el monto recaudado correspondiente, para su debido pago, salvo en los siguientes casos:` },
    { t: "ol", items: [
      `Que el Propietario esté inscrito bajo el régimen de "Pequeño Contribuyente" y no le corresponda declarar IVA.`,
      `Que el Propietario no esté emitiendo facturas.`,
    ]},
    { t: "p", text: `En cualquiera de estos escenarios, el ${D} no transferirá el IVA recaudado y lo gestionará conforme a las obligaciones fiscales correspondientes.` },
    { t: "p", text: `Si existe un presupuesto para decoración y preparación de la propiedad, la inversión será hecha por el ${D} y el presupuesto será administrado por el ${H}.` },
    { t: "p", text: `Se destinará un presupuesto de hasta ocho dólares de los Estados Unidos de América (USD 8.00) mensuales ${lt ? "por cada apartamento " : ""}para un software de precios inteligentes que tiene como fin aumentar el ingreso y ocupación de la propiedad.` },
    { t: "p", text: `El propietario será responsable de cubrir el costo de las sesiones fotográficas requeridas para la promoción de su propiedad.` },
    { t: "p", text: `Las imágenes serán utilizadas exclusivamente para la promoción del inmueble por parte del ${H}. Cualquier otro uso deberá contar con la autorización previa y por escrito tanto del propietario como del ${H}.` },
  ]};
}
function _fiscal(ord, lt) {
  const D = lt ? "DUEÑO" : "dueño", H = lt ? "HOST" : "host";
  return { ord, label: "Responsabilidad Fiscal.", blocks: [
    { t: "p", text: `Cada parte será responsable de manera individual por el cumplimiento de sus respectivas obligaciones fiscales ante las autoridades competentes.` },
    { t: "p", text: `El ${D} será responsable por los impuestos derivados de los ingresos que reciba como resultado del alquiler de su propiedad, mientras que el ${H} será responsable por los impuestos correspondientes a los ingresos que perciba por la prestación de sus servicios de gestión, operación o co-hosting.` },
    { t: "p", text: `Ambas partes reconocen que el detalle sobre la distribución de los ingresos entre el ${D} y el ${H} se encuentra descrito en la cláusula de Los Ingresos del presente contrato. En ningún caso una parte será responsable por las obligaciones fiscales de la otra.` },
    { t: "p", text: `Se exonera expresamente a la otra parte de cualquier reclamo, sanción, multa o responsabilidad que pudiera derivarse del incumplimiento de las obligaciones fiscales de la otra parte.` },
  ]};
}
function _uso(ord, lt) {
  const D = lt ? "DUEÑO" : "dueño", H = lt ? "HOST" : "host";
  return { ord, label: "Uso de la Propiedad.", blocks: [
    { t: "p", text: `El ${D} puede utilizar la propiedad sin necesidad de pago; a discreción, siempre y cuando no exista una reserva confirmada y vigente. Se debe solicitar el bloqueo de las fechas con anticipación. El ${D} no podrá visitar la propiedad cuando haya una reserva vigente.` },
    { t: "p", text: `Si el ${D} decide cancelar una reserva por cualquier motivo, este deberá incurrir en los costos de penalización que imponga la plataforma, el cual oscila entre cien a doscientos dólares de los Estados Unidos de América (USD 100.00 a USD 200.00) por reserva. Los montos son impuestos por las plataformas y pueden variar en cualquier momento, sin previo aviso.` },
    { t: "p", text: `Si se decide vender la propiedad a un tercero, el ${D} deberá informar al ${H} con treinta (30) días de anticipación, de lo contrario deberá incurrir en los gastos que las cancelaciones conlleven.` },
  ]};
}
function _oblDueno(ord, lt) {
  const D = lt ? "DUEÑO" : "dueño", H = lt ? "HOST" : "host";
  return { ord, label: "Obligaciones y Responsabilidades del Dueño.", blocks: [
    { t: "ul", items: [
      `Dar acceso libre para que el ${H} modifique los anuncios en las diferentes plataformas a discreción con el objetivo de optimizarlos.`,
      `Determinar reglamento y sanciones para quienes se hospeden en la propiedad.`,
      `Establecer junto con el ${H} las tarifas de hospedaje mínimo, fee de limpieza y los cobros adicionales.`,
      `Mantener la propiedad y su mobiliario en buen estado.`,
      `Notificar al ${H} de cualquier mantenimiento o reparación necesaria.`,
      `Si la reparación fuese por un daño ocasionado por algún huésped y el seguro de este último no tenga cobertura, estas serán pagadas en un porcentaje igual al de la repartición de ingresos.`,
      `Programar con por lo menos 15 días de anticipación cualquier trabajo a realizar en la propiedad (ejemplos: cambio de piso, mantenimiento, remodelación, etc.).`,
      `Pagar el mantenimiento y servicios necesarios para el buen funcionamiento de la propiedad.`,
      `Mantener los pagos de electricidad, agua e impuestos de la propiedad al día.`,
      `Los impuestos derivados de los ingresos del ${D} son responsabilidad del mismo.`,
      `Autorizar al ${H} la venta de cualquier producto o servicio de lícito comercio adicional a las personas que se hospeden en la propiedad.`,
      `El ${D} queda liberado de cualquier responsabilidad penal, civil o laboral provocada por la mala administración del negocio por parte del ${H}.`,
      `Mantener dentro de la propiedad todos los utensilios, muebles y decoración que se colocaron cuando se inició a promover el anuncio; por ningún motivo estos deben de tener otro uso o salir de la propiedad.`,
    ]},
  ]};
}
function _oblHost(ord, lt) {
  const D = lt ? "DUEÑO" : "dueño", H = lt ? "HOST" : "host";
  return { ord, label: "Obligaciones y Responsabilidades del Host.", blocks: [
    { t: "ul", items: [
      `Ser el responsable del contacto con los huéspedes o potenciales huéspedes.`,
      `Responder de manera profesional a todas las consultas y solicitudes de reserva en menos de 24 horas de haber recibido la solicitud.`,
      `Comunicarse proactivamente con los huéspedes para asegurarse de que cualquier duda o preocupación sea resuelta.`,
      `Mantener al día y controlado el reporte financiero de la propiedad.`,
      `Optimizar el anuncio de manera continua con el fin de aumentar el ingreso promedio.`,
      `Redactar una reseña con cada huésped posterior a su reserva.`,
      `Cobrar los fees y servicios adicionales mientras la reserva se encuentre vigente.`,
      `Mantener los calendarios actualizados y sin problemas.`,
      `Si existiese algún daño en la propiedad se deberá gestionar el cobro al huésped o al seguro del huésped.`,
      `Si el seguro del huésped no cubre el daño y no se logra llegar a un acuerdo se pagará la reparación por ambas partes en los mismos porcentajes de la distribución de ingresos.`,
      `Estar actualizado con el procedimiento y requisitos de resolución de problemas de cada huésped (seguros y formas de cobro).`,
      `Recibir los cleaning fees de todos los huéspedes y ser el responsable de coordinar la limpieza de la propiedad.`,
      `Mantener control del inventario de insumos de la propiedad y agregar el total al reporte mensual para que el ${D} pueda pagar el monto total al final del periodo.`,
      `Los insumos contemplados papel higiénico, mayordomo, esponjas, jabón de platos, detergente de ropa, jabón de manos, shampoo, shower gel, sal, pimienta, aceite, químicos de limpieza, etc.`,
      `Programar una limpieza profunda mensual o bimensual, con un costo igual o similar al del servicio de limpieza de rutina.`,
      `Realizar un listado con todas las pertenencias / objetos que posee la propiedad a un inicio.`,
      `El ${H} es el único representante del negocio ante el huésped.`,
      `Mantener y velar por el cuidado y buen uso de parte de los huéspedes al mobiliario de la propiedad.`,
      `Cualquier disputa penal, civil o laboral ocasionada por la mala administración del ${H} será responsabilidad única y exclusiva del ${H}.`,
      `El ${H} debe cumplir con el pago de sus responsabilidades fiscales.`,
    ]},
  ]};
}
function _especial(ord, lt) {
  const D = lt ? "DUEÑO" : "dueño", H = lt ? "HOST" : "host";
  return { ord, label: "Cláusula Especial.", blocks: [
    { t: "p", text: `Este acuerdo está basado en obligaciones de ambas partes que incluyen las consideraciones detalladas en la parte superior y por ende expresa la aceptación de dichos términos por ambas partes. Es expresamente aceptado por ambas partes que tanto el ${D} como el ${H} podrán dar por terminado el presente contrato por decisión unilateral comunicada a la otra parte, por correo, carta o cualquier medio de comunicación que considere idóneo, con al menos treinta (30) días calendario de anticipación, respetando únicamente las reservas confirmadas y vigentes. Si se finaliza el contrato forzando alguna cancelación de reserva la parte que desee finalizar deberá incurrir en el costo de cancelación que sea impuesto por parte de las plataformas.` },
    { t: "p", text: `Si da por terminado este acuerdo todos los materiales, documentos y contenido que hayan sido utilizados durante el tiempo de operación deberán ser descartados y solo podrán ser utilizados por las partes para fines comerciales las fotografías que no tengan propaganda informativa catalogada dentro de los derechos de autor o que se ilustren con el nombre comercial hasta luego de pasado cinco (5) años.` },
  ]};
}
function _titulos(ord) {
  return { ord, label: "Títulos.", blocks: [
    { t: "p", text: `Los títulos de las cláusulas y sub-cláusulas de este instrumento se consignan únicamente para facilidad de referencia, no tienen efecto alguno para su interpretación o ejecución del contrato.` },
  ]};
}
function _disputas(ord) {
  return { ord, label: "Disputas.", blocks: [
    { t: "p", text: `En caso de que surja cualquier disputa relacionada con la interpretación, cumplimiento o ejecución de los términos del presente contrato, las partes se comprometen en primera instancia a intentar resolverla de manera amistosa mediante acuerdo directo entre ellas.` },
    { t: "p", text: `Si transcurrido un plazo de treinta (30) días calendario desde que una de las partes haya notificado por escrito la existencia de la disputa no se hubiera alcanzado una solución satisfactoria, cualquiera de las partes podrá someter el asunto a los Tribunales de Justicia del Departamento de Guatemala, siendo esta la jurisdicción y el lugar convenido por ambas partes.` },
    { t: "p", text: `En caso de que una de las partes inicie una acción legal para hacer cumplir los términos del presente acuerdo, la parte que prevalezca sustancialmente podrá tener derecho al reembolso de honorarios razonables de abogado y de los costos legales incurridos durante el proceso.` },
  ]};
}
function _declaracion(ord, lt) {
  const D = lt ? "DUEÑO" : "Dueño";
  return { ord, label: "Declaración Final.", blocks: [
    { t: "p", text: `Declaramos los comparecientes en las calidades con que actuamos, que en los términos consignados aceptamos el contenido íntegro del presente instrumento por ser la expresión fiel y clara de la voluntad que hemos manifestado. Hacemos constar lo siguiente: ${_b("I.")} Que hemos tenido a la vista los documentos con que cada compareciente acredita la representación que ejerce; ${_b("II.")} Que hemos tenido a la vista el título con que el ${D} acredita ser propietaria del bien inmueble objeto de este contrato; y ${_b("III.")} Que hemos leído lo escrito y bien impuestos de su contenido, validez, objeto, efectos legales y obligación de registro, lo ratificamos, aceptamos y firmamos electrónicamente.` },
  ]};
}

/* ── Corto-plazo-only clauses ──────────────────────────── */
function _plazoCorto(ord) {
  return { ord, label: "Del Plazo.", blocks: [
    { t: "p", text: `Este contrato tendrá vigencia de un año a partir de la fecha de firma por ambas partes, renovable automáticamente por periodos iguales mediante cruce de cartas, correo electrónico o cualquier otro medio escrito que manifieste la voluntad de continuidad.` },
    { t: "p", text: `En caso de no realizarse dicha renovación formal, el contrato seguirá vigente bajo las mismas condiciones hasta que cualquiera de las partes comunique por escrito su intención de darlo por terminado, con al menos treinta (30) días de anticipación.` },
  ]};
}
function _operacionCorto(ord, d) {
  return { ord, label: "De la Operación.", blocks: [
    { t: "p", text: `Todas las reservas serán efectuadas a través de plataformas digitales (Airbnb, Vrbo, Tripadvisor, Google, reservas directas o similares) a menos que exista un acuerdo especial entre el dueño y el host. Solamente el Host será responsable de aceptar reservas.` },
    { t: "p", text: `El dueño no creará un anuncio en paralelo al anuncio del host, durante la vigencia del presente acuerdo.` },
    { t: "p", text: `El Host será responsable de gestionar y mantener el inventario de insumos de limpieza necesarios para la operación del inmueble, realizando las reposiciones correspondientes mes a mes. El costo total de dichos insumos será asumido por el Dueño.` },
    { t: "p", text: `Para efectos de control presupuestario, se establece un presupuesto mensual máximo de ${_b("Q" + _ph(d.presupuestoInsumos, "monto"))} para la compra de insumos. El único mes en que este monto podrá superarse sin autorización previa será el primer mes de operación, durante el cual se realizará un abastecimiento general inicial de insumos.` },
    { t: "p", text: `En los meses posteriores, el Host deberá respetar el presupuesto mensual establecido, y cualquier gasto que exceda dicho monto deberá contar con autorización previa por escrito del Dueño antes de realizar la compra correspondiente.` },
  ]};
}

/* ── Largo-plazo-only clauses ──────────────────────────── */
function _plazoLargo(ord) {
  return { ord, label: "Del Plazo.", blocks: [
    { t: "p", text: `El presente contrato tendrá una duración inicial de veinte (20) años contados a partir de la fecha de su firma.` },
    { t: "p", text: `Las partes acuerdan establecer un período mínimo obligatorio de operación de veinticuatro (24) meses contados a partir del inicio de operaciones del inmueble en las plataformas digitales.` },
    { t: "p", text: `Durante este período mínimo ninguna de las partes podrá dar por terminado el presente contrato de forma unilateral, salvo en caso de incumplimiento grave debidamente comprobado.` },
    { t: "p", text: `Transcurrido el período mínimo obligatorio, cualquiera de las partes podrá dar por terminado el contrato mediante notificación escrita con al menos noventa (90) días calendario de anticipación.` },
    { t: "p", text: `El establecimiento de este período mínimo tiene como finalidad garantizar la estabilidad operativa del proyecto, permitir la consolidación del posicionamiento comercial del inmueble y proteger la inversión estratégica realizada por el HOST en la conceptualización, posicionamiento y operación del inmueble.` },
  ]};
}
function _terminacionAnt(ord) {
  return { ord, label: "Terminación Anticipada y Compensación.", blocks: [
    { t: "p", text: `En caso de que el DUEÑO decida dar por terminado el presente contrato antes de haber transcurrido el período mínimo obligatorio de veinticuatro (24) meses, deberá pagar al HOST una compensación económica calculada de la siguiente manera:` },
    { t: "ol", items: [
      `Si la terminación ocurre durante los primeros tres (3) meses de operación, la compensación se calculará utilizando como referencia la proyección de ingresos contenida en el estudio de mercado elaborado al inicio del proyecto.`,
      `Si la terminación ocurre entre el mes tres (3) y el mes seis (6) de operación, la compensación se calculará tomando como referencia el mes con mayores ingresos generados durante dicho período.`,
      `Si la terminación ocurre después del mes seis (6) de operación, la compensación se calculará tomando como referencia el promedio de ingresos de los últimos tres (3) meses de operación.`,
    ]},
    { t: "p", text: `La compensación corresponderá al equivalente a los honorarios de gestión que el HOST habría percibido durante los meses restantes necesarios para completar el período mínimo obligatorio establecido en el presente contrato.` },
    { t: "p", text: `El pago de dicha compensación deberá realizarse dentro de los quince (15) días calendario siguientes a la notificación de terminación anticipada.` },
  ]};
}
function _operacionLargo(ord) {
  return { ord, label: "De la Operación.", blocks: [
    { t: "p", text: `Todas las reservas serán efectuadas a través de plataformas digitales (Airbnb, Vrbo, Tripadvisor, Google, reservas directas o similares) a menos que exista un acuerdo especial entre el DUEÑO y el HOST. Solamente el HOST será responsable de aceptar reservas.` },
    { t: "p", text: `Durante la vigencia del presente contrato, el HOST será el único operador autorizado para la administración, promoción, gestión y comercialización del inmueble en plataformas de hospedaje de corta y mediana estancia.` },
    { t: "p", text: `El DUEÑO se compromete a no crear, operar o permitir la operación de anuncios paralelos del inmueble en plataformas digitales tales como Airbnb, Vrbo, Booking, Expedia, Google o cualquier plataforma similar, ya sea de forma directa o a través de terceros.` },
    { t: "p", text: `Asimismo, el DUEÑO no podrá contratar a otro operador, administrador o gestor para realizar actividades equivalentes a las realizadas por el HOST durante la vigencia del presente contrato.` },
    { t: "p", text: `El objetivo de esta cláusula es garantizar coherencia en la estrategia comercial, evitar conflictos operativos y proteger la estabilidad del posicionamiento del inmueble en los diferentes canales de comercialización.` },
    { t: "p", text: `El HOST se encarga de mantener el inventario de insumos de limpieza mes a mes y el monto total será pagado por el DUEÑO.` },
  ]};
}
function _propIntelectual(ord) {
  return { ord, label: "Propiedad Intelectual.", blocks: [
    { t: "p", text: `Todo concepto creativo, identidad de marca, nombre comercial, narrativa de marca, material fotográfico, textos promocionales, estrategia de posicionamiento, manuales operativos, diseño de experiencia del huésped, material audiovisual y cualquier contenido desarrollado por el HOST durante la preparación y operación del proyecto será considerado propiedad intelectual del HOST.` },
    { t: "p", text: `El DUEÑO reconoce que dichos elementos forman parte del know-how y de la identidad comercial del HOST.` },
    { t: "p", text: `En caso de terminación del presente contrato, el DUEÑO no podrá continuar utilizando la marca, concepto comercial, material promocional o cualquier elemento creativo desarrollado por el HOST sin autorización previa y por escrito de este último.` },
    { t: "p", text: `El HOST podrá utilizar el material desarrollado durante la vigencia del contrato para fines promocionales, portafolio profesional y desarrollo de futuras oportunidades comerciales.` },
  ]};
}

/* ── Signatures ────────────────────────────────────────── */
function _sig(d, ownerName, ownerPh) {
  return {
    date: `Guatemala, ${formatLongDate(d.fecha)}.`,
    parties: [
      { name: ownerName || `⟦${ownerPh}⟧`, role: "Dueño" },
      { name: d.contratanteNombre, role: "El Host · Spacio AM S.A." },
    ],
  };
}

/* ── Contract builders ─────────────────────────────────── */
function buildCohostingIndividual(d) {
  return {
    title: "Acuerdo de co-hosting",
    intro: _introIndividual(d),
    clauses: [
      ..._primeraSegundaInd(d),
      _plazoCorto("Tercera"),
      _operacionCorto("Cuarta", d),
      _ingresos("Quinta", false),
      _fiscal("Sexta", false),
      _uso("Séptima", false),
      _oblDueno("Octava", false),
      _oblHost("Novena", false),
      _especial("Décima", false),
      _titulos("Décima Primera"),
      _disputas("Décima Segunda"),
      _declaracion("Décima Tercera", false),
    ],
    signatures: _sig(d, d.duenoNombre, "NOMBRE DEL DUEÑO"),
  };
}
function buildCohostingJuridica(d) {
  return {
    title: "Acuerdo de co-hosting",
    intro: _introJuridica(d),
    clauses: [
      ..._primeraSegundaJur(d),
      _plazoCorto("Tercera"),
      _operacionCorto("Cuarta", d),
      _ingresos("Quinta", false),
      _fiscal("Sexta", false),
      _uso("Séptima", false),
      _oblDueno("Octava", false),
      _oblHost("Novena", false),
      _especial("Décima", false),
      _titulos("Décima Primera"),
      _disputas("Décima Segunda"),
      _declaracion("Décima Tercera", false),
    ],
    signatures: _sig(d, d.repNombre, "NOMBRE DEL REPRESENTANTE"),
  };
}
function buildCohostingJuridicaLT(d) {
  return {
    title: "Acuerdo de co-hosting",
    intro: _introJuridica(d),
    clauses: [
      ..._primeraSegundaJur(d),
      _plazoLargo("Tercera"),
      _terminacionAnt("Cuarta"),
      _operacionLargo("Quinta"),
      _ingresos("Sexta", true),
      _propIntelectual("Séptima"),
      _fiscal("Octava", true),
      _uso("Novena", true),
      _oblDueno("Décima", true),
      _oblHost("Décima Primera", true),
      _especial("Décima Segunda", true),
      _titulos("Décima Tercera"),
      _disputas("Décima Cuarta"),
      _declaracion("Décima Quinta", true),
    ],
    signatures: _sig(d, d.repNombre, "NOMBRE DEL REPRESENTANTE"),
  };
}

/* Individual · largo plazo (20 años) — mismo juego de cláusulas del
   largo plazo con la comparecencia de persona individual. */
function buildCohostingIndividualLT(d) {
  return {
    title: "Acuerdo de co-hosting",
    intro: _introIndividual(d),
    clauses: [
      ..._primeraSegundaInd(d),
      _plazoLargo("Tercera"),
      _terminacionAnt("Cuarta"),
      _operacionLargo("Quinta"),
      _ingresos("Sexta", true),
      _propIntelectual("Séptima"),
      _fiscal("Octava", true),
      _uso("Novena", true),
      _oblDueno("Décima", true),
      _oblHost("Décima Primera", true),
      _especial("Décima Segunda", true),
      _titulos("Décima Tercera"),
      _disputas("Décima Cuarta"),
      _declaracion("Décima Quinta", true),
    ],
    signatures: _sig(d, d.duenoNombre, "NOMBRE DEL DUEÑO"),
  };
}

/* ── Component wrappers ────────────────────────────────── */
function ContratoCohostingIndividual({ data, edits, onEdit, onReset }) {
  return <PaginatedContract contract={buildCohostingIndividual(data)} edits={edits} onEdit={onEdit} onReset={onReset} />;
}
function ContratoCohostingJuridica({ data, edits, onEdit, onReset }) {
  return <PaginatedContract contract={buildCohostingJuridica(data)} edits={edits} onEdit={onEdit} onReset={onReset} />;
}
function ContratoCohostingJuridicaLT({ data, edits, onEdit, onReset }) {
  return <PaginatedContract contract={buildCohostingJuridicaLT(data)} edits={edits} onEdit={onEdit} onReset={onReset} />;
}

function ContratoCohostingIndividualLT({ data, edits, onEdit, onReset }) {
  return <PaginatedContract contract={buildCohostingIndividualLT(data)} edits={edits} onEdit={onEdit} onReset={onReset} />;
}

Object.assign(window, {
  ContratoCohostingIndividual,
  ContratoCohostingJuridica,
  ContratoCohostingJuridicaLT,
  ContratoCohostingIndividualLT,
  buildCohostingIndividual,
  buildCohostingJuridica,
  buildCohostingJuridicaLT,
  buildCohostingIndividualLT,
});
