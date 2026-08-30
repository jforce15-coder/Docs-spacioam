/* ============================================================
   CONTRATO PERSONALIZADO
   Fully editable contract: title, intro, clauses (add/remove),
   signatures. Lives on a single growable page so the user can
   write as much as they need; PDF generator slices it into
   multiple Letter pages.
   ============================================================ */

const NUMERALES_ORD = [
  "Primera", "Segunda", "Tercera", "Cuarta", "Quinta",
  "Sexta", "Séptima", "Octava", "Novena", "Décima",
  "Décima Primera", "Décima Segunda", "Décima Tercera",
  "Décima Cuarta", "Décima Quinta", "Décima Sexta",
  "Décima Séptima", "Décima Octava", "Décima Novena", "Vigésima",
];

const CUSTOM_DEFAULT = {
  title: "Contrato de Prestación de Servicios",
  intro: "", // will be filled with the default intro on load
  clauses: [
    {
      id: 1,
      label: "Objeto del contrato.",
      body: "EL CONTRATANTE contrata a EL PRESTADOR para realizar los servicios descritos en este contrato, conforme a las especificaciones y términos acordados entre ambas partes.",
    },
    {
      id: 2,
      label: "Naturaleza del contrato.",
      body: "Este es un contrato por servicios prestados; no constituye una relación laboral. EL PRESTADOR recibirá el pago acordado únicamente por los servicios efectivamente realizados.",
    },
    {
      id: 3,
      label: "Condiciones de pago.",
      body: "El pago será de Q[monto] por [unidad]. Los pagos se realizarán de forma [frecuencia], sumando los servicios efectivamente realizados.",
    },
    {
      id: 4,
      label: "Obligaciones del prestador.",
      body: "EL PRESTADOR se compromete a prestar los servicios con la diligencia y calidad acordadas, comunicar oportunamente cualquier incidencia y mantener un trato cordial con todas las partes involucradas.",
    },
    {
      id: 5,
      label: "Rescisión del contrato.",
      body: "Ambas partes podrán dar por terminado el contrato con un aviso previo de 15 días calendario. EL CONTRATANTE podrá rescindir el contrato de forma inmediata en caso de incumplimientos graves.",
    },
    {
      id: 6,
      label: "Resolución de conflictos.",
      body: "En caso de conflictos, ambas partes buscarán una solución amistosa. Si esto no es posible, se someterán a la jurisdicción de los tribunales de la Ciudad de Guatemala.",
    },
  ],
  cierre: "Declaramos los comparecientes en las calidades con que actuamos, que en los términos consignados aceptamos el contenido íntegro del presente instrumento por ser la expresión fiel y clara de la voluntad que hemos manifestado. Lo ratificamos, aceptamos y firmamos electrónicamente.",
};

function buildDefaultIntro(data) {
  return (
    `El presente contrato se celebra en la ciudad de Guatemala, el ${formatLongDateCap(data.fecha)}, entre: por una parte ${data.prestadorNombre || "—"} (en adelante "EL PRESTADOR") quien se identifica con el Documento Personal de Identificación número ${data.prestadorDPI || "—"} extendido por el Registro Nacional de las Personas de la República de Guatemala, quien actúa en su calidad de PERSONA INDIVIDUAL; y por otra parte, el señor ${data.contratanteNombre} de ${data.contratanteEdad} años, ${data.contratanteEstado}, guatemalteco, comerciante, de este domicilio, portador del Documento Personal de Identificación con Código Único de Identificación número ${data.contratanteDPI} extendido por el Registro Nacional de las Personas de la República de Guatemala, quien actúa en su calidad de ADMINISTRADOR ÚNICO Y REPRESENTANTE LEGAL de la entidad SPACIO AM, SOCIEDAD ANÓNIMA (en adelante "EL CONTRATANTE"). Los comparecientes en el libre ejercicio de nuestros derechos civiles manifestamos que celebramos el presente contrato que se contiene en las siguientes cláusulas:`
  );
}

/* ─── Inline editable element ──────────────────────────── */
function EditableBlock({ as = "div", value, onChange, className, placeholder }) {
  const Tag = as;
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (ref.current && ref.current.innerText !== (value ?? "")) {
      ref.current.innerText = value ?? "";
    }
  }, [value]);
  return (
    <Tag
      ref={ref}
      className={className}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onBlur={(e) => onChange && onChange(e.currentTarget.innerText)}
    />
  );
}

/* ─── Single custom clause ─────────────────────────────── */
function CustomClause({ index, clause, onChange, onRemove }) {
  const ord = NUMERALES_ORD[index] || `Cláusula ${index + 1}`;
  return (
    <div className="clause">
      <div className="clause-h">
        <span className="ord">{ord}</span>
        <EditableBlock
          as="span"
          className="label"
          value={clause.label}
          onChange={(v) => onChange({ ...clause, label: v })}
          placeholder="Nombre de la cláusula"
        />
      </div>
      <EditableBlock
        as="p"
        value={clause.body}
        onChange={(v) => onChange({ ...clause, body: v })}
        placeholder="Contenido de la cláusula…"
      />
      <div className="clause-actions">
        <button
          className="clause-action danger"
          title="Eliminar cláusula"
          onClick={onRemove}
        >×</button>
      </div>
    </div>
  );
}

/* ============================================================
   ContratoPersonalizado
   ============================================================ */
function ContratoPersonalizado({ data, custom, setCustom }) {
  /* Initialize intro if empty */
  React.useEffect(() => {
    if (!custom.intro || custom.intro.includes("[FECHA]") || custom.intro === "") {
      setCustom({ ...custom, intro: buildDefaultIntro(data) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateClause = (id, next) => {
    setCustom({
      ...custom,
      clauses: custom.clauses.map((c) => (c.id === id ? next : c)),
    });
  };
  const removeClause = (id) => {
    setCustom({
      ...custom,
      clauses: custom.clauses.filter((c) => c.id !== id),
    });
  };
  const addClause = () => {
    const nextId = Math.max(0, ...custom.clauses.map((c) => c.id)) + 1;
    setCustom({
      ...custom,
      clauses: [
        ...custom.clauses,
        { id: nextId, label: "Nueva cláusula.", body: "Describe aquí los términos…" },
      ],
    });
  };

  return (
    <FlowingPage>
      <div className="custom-edit">
        <div className="doc-eyebrow">Contrato · Spacio AM</div>

        <EditableBlock
          as="h1"
          className="doc-title"
          value={custom.title}
          onChange={(v) => setCustom({ ...custom, title: v })}
          placeholder="Título del contrato"
        />

        <EditableBlock
          as="p"
          value={custom.intro}
          onChange={(v) => setCustom({ ...custom, intro: v })}
          placeholder="Párrafo introductorio…"
        />

        {custom.clauses.map((c, i) => (
          <CustomClause
            key={c.id}
            index={i}
            clause={c}
            onChange={(next) => updateClause(c.id, next)}
            onRemove={() => removeClause(c.id)}
          />
        ))}

        <button className="add-clause" onClick={addClause}>
          + Añadir cláusula
        </button>

        {/* Closing clause (auto-numbered after the last custom) */}
        <div className="clause" style={{ marginTop: 26 }}>
          <div className="clause-h">
            <span className="ord">{NUMERALES_ORD[custom.clauses.length] || "Final"}</span>
          </div>
          <EditableBlock
            as="p"
            value={custom.cierre}
            onChange={(v) => setCustom({ ...custom, cierre: v })}
            placeholder="Cierre formal del contrato…"
          />
        </div>

        <Signatures data={data} />
      </div>
    </FlowingPage>
  );
}

Object.assign(window, {
  ContratoPersonalizado,
  CUSTOM_DEFAULT,
  buildDefaultIntro,
  NUMERALES_ORD,
});
