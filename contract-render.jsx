/* ───────────────────────────────────────────────────────────
   Render único del documento por tipo. Lo usan el generador,
   la experiencia de firma y la copia firmada en PDF, para que
   el firmante vea exactamente el mismo documento.
   ─────────────────────────────────────────────────────────── */
function ContractDoc({ tipo, data, custom, edits, onEdit, onReset, setCustom }) {
  const e = edits || {};
  const isEmpleado = String(tipo || "").indexOf("emp_") === 0;
  return (
    <>
      {tipo === "limpieza" && <ContratoLimpieza data={data} edits={e} onEdit={onEdit} onReset={onReset} />}
      {tipo === "mantenimiento" && <ContratoMantenimiento data={data} edits={e} onEdit={onEdit} onReset={onReset} />}
      {tipo === "cohosting_individual" && <ContratoCohostingIndividual data={data} edits={e} onEdit={onEdit} onReset={onReset} />}
      {tipo === "cohosting_individual_lt" && <ContratoCohostingIndividualLT data={data} edits={e} onEdit={onEdit} onReset={onReset} />}
      {tipo === "cohosting_juridica" && <ContratoCohostingJuridica data={data} edits={e} onEdit={onEdit} onReset={onReset} />}
      {tipo === "cohosting_juridica_lt" && <ContratoCohostingJuridicaLT data={data} edits={e} onEdit={onEdit} onReset={onReset} />}
      {isEmpleado && <ContratoEmpleado key={tipo} tipo={tipo} data={data} edits={e} onEdit={onEdit} onReset={onReset} />}
      {tipo === "personalizado" && (
        <ContratoPersonalizado data={data} custom={custom || CUSTOM_DEFAULT} setCustom={setCustom || (() => {})} />
      )}
    </>
  );
}

Object.assign(window, { ContractDoc });
