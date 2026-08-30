/* ══════════════════════════════════════════════════════════════
   Spacio AM — Panel de administración de contratos
   Login unificado (hoja «Control de usuarios») + shell con el
   mismo header, navegación, filtros y botones de mi.spacioam.
   ══════════════════════════════════════════════════════════════ */
const { useState: useS, useEffect: useE, useMemo: useM, useRef: useR } = React;

function Ico({ name, size = 16, stroke = "currentColor" }) {
  const ns = window.SpacioAMDesignSystem_2c08fe;
  if (!ns || !ns.Icon) return null;
  return React.createElement(ns.Icon, { name, size, stroke });
}

/* ─── Login ───────────────────────────────────────────────── */
const LOGIN_T = {
  es: {
    eyebrow: "Portal de contratos", welcome: "Bienvenido de vuelta.",
    sub: "Accede para dar seguimiento a tus documentos.",
    user: "Correo electrónico", user_ph: "tu@spacioam.com",
    pass: "Contraseña", pass_ph: "tu contraseña", newpass: "Nueva contraseña",
    forgot: "¿Olvidaste tu contraseña?",
    enter: "Entrar", create: "Crear contraseña",
    err: "Usuario o contraseña incorrectos.",
    first: "Es tu primer ingreso. Crea una contraseña (mínimo 6 caracteres).",
    quote: "Hay espacios en donde sueñas con volver a despertar",
    aside: "Spacio AM · Contratos",
    help: "Guatemala · ¿Necesitas ayuda? hola@spacioam.com",
  },
  en: {
    eyebrow: "Contracts portal", welcome: "Welcome back.",
    sub: "Sign in to follow up on your documents.",
    user: "Email", user_ph: "you@spacioam.com",
    pass: "Password", pass_ph: "your password", newpass: "New password",
    forgot: "Forgot your password?",
    enter: "Sign in", create: "Create password",
    err: "Incorrect user or password.",
    first: "This is your first sign-in. Create a password (6 characters minimum).",
    quote: "There are spaces where you dream of waking up again",
    aside: "Spacio AM · Contracts",
    help: "Guatemala · Need help? hola@spacioam.com",
  },
};

function AdminLogin({ onLogin, lang, setLang }) {
  const L = LOGIN_T[lang === "en" ? "en" : "es"];
  const [correo, setCorreo] = useS("");
  const [pass, setPass] = useS("");
  const [show, setShow] = useS(false);
  const [err, setErr] = useS(false);
  const [busy, setBusy] = useS(false);
  const [needPass, setNeedPass] = useS(null);

  const enter = (perfil) => onLogin(perfil);
  const perfilDe = (p, fallback) => ({
    name: (p && p.name) || fallback.split("@")[0].replace(/[._]/g, " ").toUpperCase(),
    email: (p && p.email) || fallback,
    rol: (window.SAAuth && p && window.SAAuth.roleFor(p, "contratos")) || "Administración",
    avatar: p && p.photo,
  });

  const submit = (e) => {
    e.preventDefault();
    setErr(false);
    const c = correo.trim().toLowerCase();
    if (!c || pass.length < 4) { setErr(true); return; }
    setBusy(true);
    const local = () => { setBusy(false); enter(perfilDe(null, c)); };
    if (!window.SAAuth) { setTimeout(local, 350); return; }
    window.SAAuth.login(c, pass).then((r) => {
      if (r && r.ok && r.profile) { setBusy(false); enter(perfilDe(r.profile, c)); }
      else if (r && r.error === "needs_password" && r.profile) { setNeedPass(r.profile); setPass(""); setBusy(false); }
      else local();
    }).catch(local);
  };

  const createPass = (e) => {
    e.preventDefault();
    if (!pass || pass.length < 6) { setErr(true); return; }
    setBusy(true);
    window.SAAuth.setInitialPassword(correo.trim().toLowerCase(), pass).then((r) => {
      if (r && r.ok) enter(perfilDe(r.profile, correo.trim().toLowerCase()));
      else { setErr(true); setBusy(false); }
    }).catch(() => { setErr(true); setBusy(false); });
  };

  return (
    <div className="sa-login">
      <aside className="sa-login-aside">
        <img className="sa-login-brush" src="assets/brushstroke.svg" alt="" aria-hidden="true" />
        <div style={{ position: "relative", zIndex: 2 }}>
          <img className="sa-login-stamp" src="assets/brand/logo-stamp.png" alt="Spacio AM" />
        </div>
        <div style={{ position: "relative", zIndex: 2, maxWidth: 460 }}>
          <Star size={20} color="#E9826A" />
          <p className="sa-login-quote">“{L.quote}”</p>
          <div style={{ width: 38, height: 1, background: "var(--ink)", margin: "26px 0 14px" }} />
          <div className="sa-eyebrow">{L.aside}</div>
        </div>
        <div className="sa-login-help">{L.help}</div>
      </aside>

      <main className="sa-login-main">
        <div className="sa-login-lang">
          <PanelSeg size="sm" value={lang === "en" ? "en" : "es"} onChange={setLang}
            options={[{ value: "es", label: "ES" }, { value: "en", label: "EN" }]} />
        </div>

        <form className="sa-login-form" onSubmit={needPass ? createPass : submit}>
          <div className="sa-login-mark"><img src="assets/brand/logo-wordmark.png" alt="Spacio AM" /></div>
          <div>
            <div className="sa-eyebrow">{L.eyebrow}</div>
            <h1 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 38, letterSpacing: "-0.01em", lineHeight: 1.08, color: "var(--ink)", margin: "14px 0 0" }}>
              {L.welcome}
            </h1>
            <p className="sa-login-sub">{L.sub}</p>
          </div>

          {needPass && <div className="sa-login-note">{L.first}</div>}

          <label className="sa-field">
            <span>{L.user}</span>
            <input value={correo} onChange={(e) => { setCorreo(e.target.value); setErr(false); }}
              placeholder={L.user_ph} autoCapitalize="none" autoCorrect="off" autoFocus />
          </label>
          <label className="sa-field">
            <span>{needPass ? L.newpass : L.pass}</span>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input value={pass} type={show ? "text" : "password"} placeholder={L.pass_ph}
                onChange={(e) => { setPass(e.target.value); setErr(false); }} style={{ paddingRight: 46 }} />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={L.pass}
                style={{ position: "absolute", right: 12, background: "transparent", border: "none", cursor: "pointer", color: "var(--earth)", display: "flex", padding: 4 }}>
                <Ico name={show ? "eyeOff" : "eye"} size={18} />
              </button>
            </div>
          </label>

          {err && <div className="sa-login-err"><Ico name="info" size={15} /> {L.err}</div>}

          <div className="sa-login-forgot">{L.forgot}</div>

          <button className="sa-login-cta" type="submit" disabled={busy}>
            {busy ? <span className="sa-spin" /> : <><Ico name="lock" size={15} stroke="var(--alabaster)" />{needPass ? L.create : L.enter}</>}
          </button>
        </form>
      </main>
    </div>
  );
}

/* ─── Top bar ─────────────────────────────────────────────── */
function AdminTopBar({ user, lang, setLang, notiTotal, onNotiOpen, onAccount, onSetup, onLogout }) {
  const [menu, setMenu] = useS(false);
  const ref = useR(null);
  const T = (k) => window.SpacioT.t(lang, k);
  useE(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenu(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const initials = (user.name || "SA").split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <header className="sa-topbar">
      <div className="sa-topbar-inner">
        <div className="sa-brand-group">
          <a className="sa-brand" href="#" onClick={(e) => e.preventDefault()} aria-label="Spacio AM">
            <img className="sa-brand-logo" src="assets/brand/logo-header.png" alt="Spacio AM" />
          </a>
          {notiTotal > 0 && (
            <>
              <span aria-hidden="true" className="sa-brand-divider" />
              <NotiBell total={notiTotal} onOpen={onNotiOpen} />
            </>
          )}
        </div>
        <div className="sa-topbar-right">
          <div ref={ref} style={{ position: "relative" }}>
            <button className="sa-avatar" onClick={() => setMenu((m) => !m)} aria-label={T("nav_account")}
              style={user.avatar ? { padding: 0, overflow: "hidden" } : undefined}>
              {user.avatar
                ? <img src={user.avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                : initials}
            </button>
            {menu && (
              <div className="sa-menu">
                <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--warm-grey)" }}>
                  <div style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--ink)", lineHeight: 1.1 }}>{user.name}</div>
                  <div style={{ fontSize: 11, letterSpacing: ".06em", color: "var(--earth)", marginTop: 3 }}>{user.email}</div>
                </div>
                <button className="sa-menu-item" onClick={() => { setMenu(false); onAccount(); }}>
                  <Ico name="user" size={16} stroke="var(--fg-muted)" /> {T("nav_account")}
                </button>
                <button className="sa-menu-item" onClick={() => { setMenu(false); onSetup(); }}>
                  <Ico name="grid" size={16} stroke="var(--fg-muted)" /> {T("nav_setup")}
                </button>
                <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, borderTop: "1px solid var(--warm-grey)", borderBottom: "1px solid var(--warm-grey)" }}>
                  <span style={{ fontSize: 10.5, letterSpacing: ".2em", textTransform: "uppercase", color: "var(--earth)" }}>{T("language_label")}</span>
                  <div className="sa-seg">
                    <button className={lang === "es" ? "on" : ""} onClick={() => setLang("es")}>ES</button>
                    <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>EN</button>
                  </div>
                </div>
                <button className="sa-menu-item" onClick={onLogout}>
                  <Ico name="logout" size={16} stroke="var(--fg-muted)" /> {T("logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ─── Listado de documentos ───────────────────────────────── */
function DocsTable({ docs, onOpen, lang }) {
  const F = window.Docs;
  const T = (k) => window.SpacioT.t(lang, k);
  if (!docs.length) return <div className="sa-table-wrap"><div className="sa-empty">{T("empty_docs")}</div></div>;
  return (
    <div className="sa-table-wrap">
      <div className="sa-table-scroll">
        <table className="sa-table">
          <thead>
            <tr>
              <th>{T("th_folio")}</th><th>{T("th_doc")}</th><th>{T("th_signer")}</th><th>{T("th_sent")}</th><th>{T("th_signs")}</th><th>{T("th_state")}</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => {
              const est = F.ESTADOS[d.estado] || F.ESTADOS.borrador;
              const fs = d.firmantes || [];
              const total = fs.length + 1;
              const firmas = fs.filter((f) => f.firma).length + (d.firmaSpacio ? 1 : 0);
              return (
                <tr key={d.id} onClick={() => onOpen(d)}>
                  <td className="sa-folio">{d.folio}</td>
                  <td>
                    <span className="sa-td-doc">{d.tipoLabel}</span>
                    <span className="sa-td-meta">{window.SpacioT.categoria(lang, d.categoria)}</span>
                  </td>
                  <td>
                    <span>{fs.map((f) => f.nombre).join(" · ") || d.firmanteNombre}</span>
                    <span className="sa-td-meta">{fs.map((f) => f.email).join(" · ") || d.firmanteEmail}</span>
                  </td>
                  <td className="sa-num">{F.fmtDate(d.enviado)}<span className="sa-td-meta">{F.relative(d.enviado)}</span></td>
                  <td className="sa-num">{firmas} de {total}</td>
                  <td><span className={"sa-badge " + est.cls}><i />{window.SpacioT.estado(lang, d.estado)}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Detalle del documento ───────────────────────────────── */
function DocDetail({ doc, onClose, onChange, onSign, onToast, lang, perms, staff }) {
  const T = (k) => window.SpacioT.t(lang, k);
  /* Gestionar el registro (reenviar, cancelar, anular, eliminar) exige
     el permiso "admin"; el firmante solo lee y descarga su copia. */
  const gestion = !!(perms && perms.admin);
  const F = window.Docs;
  const [busy, setBusy] = useS("");
  if (!doc) return null;
  const est = F.ESTADOS[doc.estado] || F.ESTADOS.borrador;
  const cerrado = doc.estado === "cancelado" || doc.estado === "anulado";
  const act = (fn, msg) => { const d = fn(); onChange(d); if (msg) onToast(msg); };

  return (
    <div className="sa-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sa-modal">
        <div className="sa-modal-head">
          <div>
            <div className="sa-eyebrow">{doc.folio} · {window.SpacioT.categoria(lang, doc.categoria)}</div>
            <h2 className="sa-modal-title">{doc.tipoLabel}</h2>
            <div style={{ marginTop: 12 }}><span className={"sa-badge " + est.cls}><i />{window.SpacioT.estado(lang, doc.estado)}</span></div>
          </div>
          <button className="sa-x" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="sa-modal-body">
          <div className="sa-rows">
            {(doc.firmantes || []).map((f, i) => (
              <div className="sa-row" key={f.id}>
                <span className="sa-row-k">Firmante {(doc.firmantes || []).length > 1 ? i + 1 : ""}</span>
                <span className="sa-row-v">{f.nombre}<br />{f.email}<br />
                  <span style={{ fontSize: 11, color: "var(--earth)" }}>{f.firma ? "Firmado " + F.fmtDateTime(f.firma.ts) : "Pendiente de firma"}</span>
                </span>
              </div>
            ))}
            <div className="sa-row"><span className="sa-row-k">Por Spacio AM</span><span className="sa-row-v">{doc.contraparteNombre}<br />{doc.contraparteEmail}</span></div>
            <div className="sa-row"><span className="sa-row-k">Enviado</span><span className="sa-row-v">{F.fmtDateTime(doc.enviado)}</span></div>
            {doc.certificado && <div className="sa-row"><span className="sa-row-k">Certificado</span><span className="sa-row-v">{doc.certificado}</span></div>}
            <div className="sa-row"><span className="sa-row-k">Archivo</span><span className="sa-row-v">{window.SpacioSync.fileName(doc)}<br />
              <span style={{ fontSize: 11, color: "var(--earth)" }}>{window.SpacioSync.drivePath(doc).slice(0, 4).join(" / ")}</span></span></div>
            {doc.motivo && <div className="sa-row"><span className="sa-row-k">Motivo</span><span className="sa-row-v">{doc.motivo}</span></div>}
          </div>

          <div>
            <div className="sa-eyebrow" style={{ marginBottom: 14 }}>Historial</div>
            <div className="sa-timeline">
              {(doc.historial || []).map((h, i) => (
                <div className="sa-tl" key={i}>
                  <div className={"sa-tl-dot" + (i < (doc.historial.length - 1) ? " done" : "")} />
                  <div><div className="sa-tl-t">{h.texto}</div><div className="sa-tl-d">{F.fmtDateTime(h.ts)}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="sa-actions">
            <button className="sa-btn accent" onClick={() => onSign(doc, true)}>Ver documento</button>
            {staff && !cerrado && doc.estado !== "firmado" && (
              <button className="sa-btn ghost" onClick={() => {
                navigator.clipboard.writeText(signLink(doc)).then(
                  () => onToast("Enlace de firma copiado."), () => onToast("No se pudo copiar el enlace."));
              }}>Copiar enlace</button>
            )}
            {doc.estado === "firmado" && (
              <button className="sa-btn dark" disabled={!!busy} onClick={() => downloadSignedPdf(doc, setBusy)}>
                {busy || "Copia firmada"}
              </button>
            )}
            {gestion && !cerrado && doc.estado !== "firmado" && (
              <button className="sa-btn ghost sa-tip" data-tip="Vuelve a enviar el correo con el mismo enlace de firma." onClick={() => act(() => F.resend(doc.id), "Solicitud reenviada.")}>Reenviar</button>
            )}
            {gestion && cerrado && (
              <button className="sa-btn ghost sa-tip" data-tip="Reabre el envío cancelado y manda de nuevo el correo de firma." onClick={() => act(() => F.resend(doc.id), "Solicitud reenviada.")}>Reactivar</button>
            )}
            {gestion && doc.estado !== "firmado" && !cerrado && (
              <button className="sa-btn danger sa-tip" data-tip="Invalida el enlace de firma. El documento queda en el registro y puedes reactivarlo y reenviarlo." onClick={() => {
                const m = prompt("Motivo de la cancelación (opcional):", "");
                if (m === null) return;
                act(() => F.cancel(doc.id, m), "Envío cancelado.");
              }}>Cancelar</button>
            )}
            {gestion && doc.estado !== "anulado" && (
              <button className="sa-btn danger sa-tip" data-tip="Deja el documento sin efecto de forma permanente. No se puede reactivar, pero queda en el registro como evidencia." onClick={() => {
                const m = prompt("Motivo para anular el documento (opcional):", "");
                if (m === null) return;
                act(() => F.voidDoc(doc.id, m), "Documento anulado.");
              }}>Anular</button>
            )}
            {gestion && (
              <button className="sa-btn danger sa-tip" data-tip="Borra la fila del registro: no queda rastro del documento. Úsalo solo para pruebas o capturas erróneas." onClick={() => {
                if (!confirm("¿Eliminar este documento del registro? No se puede deshacer.")) return;
                F.remove(doc.id); onChange(null); onToast("Documento eliminado.");
              }}>Eliminar</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Pestaña: documentos ─────────────────────────────────── */
function DocsPanel({ onSign, onToast, onNuevo, refreshKey, lang, user, perms, staff }) {
  const F = window.Docs;
  const T = (k) => window.SpacioT.t(lang, k);
  const P = window.SpacioPerms;
  const [q, setQ] = useS("");
  const [estado, setEstado] = useS("todos");
  const [cat, setCat] = useS("todas");
  const [sel, setSel] = useS(null);
  const [tick, setTick] = useS(0);
  const docs = useM(() => {
    const todos = F.all();
    if (staff) return todos;
    const mio = P.norm(user && user.email);
    return todos.filter((d) =>
      P.norm(d.firmanteEmail) === mio ||
      (d.firmantes || []).some((f) => P.norm(f.email) === mio) ||
      P.norm(d.contraparteEmail) === mio);
  }, [tick, refreshKey, staff]);

  const filtered = docs.filter((d) => {
    if (estado !== "todos" && d.estado !== estado) return false;
    if (cat !== "todas" && d.categoria !== cat) return false;
    if (q.trim()) {
      const s = (d.firmanteNombre + " " + d.firmanteEmail + " " + d.folio + " " + d.tipoLabel).toLowerCase();
      if (s.indexOf(q.trim().toLowerCase()) < 0) return false;
    }
    return true;
  });
  const kpis = [
    [T("kpi_docs"), docs.length],
    [T("kpi_pending"), docs.filter((d) => d.estado === "enviado" || d.estado === "visto" || d.estado === "parcial").length],
    [T("kpi_signed"), docs.filter((d) => d.estado === "firmado").length],
    [T("kpi_void"), docs.filter((d) => d.estado === "cancelado" || d.estado === "anulado").length],
  ];

  return (
    <div className="sa-wrap">
      <div className="sa-pagehead">
        <div>
          <div className="sa-eyebrow">{staff ? T("admin") : "Mis documentos"}</div>
          <h1 className="sa-h1">{T("docs_title")}</h1>
          <p className="sa-sub">{staff ? T("docs_sub") : "Los documentos asociados a tu correo, con su estado y tu copia firmada cuando esté lista."}</p>
        </div>
        {perms && perms.generar && <button className="sa-btn dark" onClick={onNuevo}>{T("new_doc")}</button>}
      </div>

      <div className="sa-kpis">
        {kpis.map((k) => (
          <div className="sa-kpi" key={k[0]}><div className="sa-kpi-lbl">{k[0]}</div><div className="sa-kpi-val">{k[1]}</div></div>
        ))}
      </div>

      <div className="sa-filter-bar">
        <span className="sa-admin-badge">{T("filters")}</span>
        <div className="sa-search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={T("search_ph")} />
        </div>
        <div className="sa-select">
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="todos">{T("all_states")}</option>
            {Object.keys(F.ESTADOS).map((k) => <option key={k} value={k}>{window.SpacioT.estado(lang, k)}</option>)}
          </select>
        </div>
        <div className="sa-select">
          <select value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="todas">{T("all_cats")}</option>
            <option value="Servicios">{T("cat_servicios")}</option>
            <option value="Co-hosting">{T("cat_cohosting")}</option>
            <option value="Empleados">{T("cat_empleados")}</option>
          </select>
        </div>
      </div>

      <DocsTable docs={filtered} onOpen={setSel} lang={lang} />

      {sel && (
        <DocDetail doc={F.get(sel.id)} lang={lang} perms={perms} staff={staff} onClose={() => setSel(null)} onSign={onSign} onToast={onToast}
          onChange={(d) => { setSel(d); setTick((t) => t + 1); }} />
      )}
    </div>
  );
}

/* ─── Pestaña: correos ────────────────────────────────────── */
function MailPanel({ lang }) {
  const T = (k) => window.SpacioT.t(lang, k);
  const M = window.SpacioEmails;
  const F = window.Docs;
  const [sel, setSel] = useS("solicitudFirma");
  const doc = F.all()[0] || null;
  const d = doc ? {
    nombre: doc.firmanteNombre, correo: doc.firmanteEmail, documento: doc.tipoLabel, folio: doc.folio,
    contraparte: doc.contraparteNombre, certificado: doc.certificado || "SAM-FE-000128-A1F4",
    fechaFirmante: doc.firmaFirmante ? F.fmtDateTime(doc.firmaFirmante.ts) : "pendiente",
    fechaSpacio: doc.firmaSpacio ? F.fmtDateTime(doc.firmaSpacio.ts) : "pendiente",
    enviado: F.relative(doc.enviado), fecha: F.fmtDateTime(doc.enviado),
  } : {};
  const base = location.href.replace(/[^/]*$/, "");
  const built = M.build(sel, d, { base: base });
  const meta = M.META.filter((m) => m.id === sel)[0];

  return (
    <div className="sa-wrap">
      <div className="sa-pagehead">
        <div>
          <div className="sa-eyebrow">{T("preview")}</div>
          <h1 className="sa-h1">{T("mail_title")}</h1>
          <p className="sa-sub">{doc ? T("mail_sub_doc") : T("mail_sub_demo")}</p>
        </div>
      </div>
      <div className="sa-preview-grid">
        <div className="sa-preview-list">
          {M.META.map((m) => (
            <button key={m.id} className={"sa-preview-item" + (m.id === sel ? " on" : "")} onClick={() => setSel(m.id)}>
              <b>{m.label}</b><span>{m.recipient}</span>
            </button>
          ))}
        </div>
        <div>
          <div className="sa-mail-meta">
            <span className="sa-chip">{T("mail_from")} <b>{M.FROM_NAME} &lt;{M.FROM_EMAIL}&gt;</b></span>
            <span className="sa-chip">{T("mail_to")} <b>{meta.recipient}</b></span>
            <span className="sa-chip">{T("mail_trigger")} <b>{meta.trigger}</b></span>
            <span className="sa-chip">{T("mail_goal")} <b>{meta.goal}</b></span>
          </div>
          <div className="sa-mail-frame">
            <iframe title={meta.label} srcDoc={built.html} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Pestaña: vista previa del proceso de firma ──────────── */
function SignPreviewPanel({ onSign, lang }) {
  const T = (k) => window.SpacioT.t(lang, k);
  const F = window.Docs;
  const [paso, setPaso] = useS(1);
  const pendiente = F.all().filter((d) => d.estado === "enviado" || d.estado === "visto" || d.estado === "parcial")[0];
  const real = pendiente || F.all()[0];
  /* La vista previa trabaja siempre sobre una copia en memoria (nada se
     guarda). Solo cuando el documento real ya está firmado, el paso 3
     muestra el real para que el certificado y la descarga sean veraces. */
  const usarReal = !!real && real.estado === "firmado" && paso === 3;
  const doc = !real ? null : (usarReal ? real : (real.estado === "firmado" ? Object.assign({}, real, {
    estado: "enviado", certificado: null, firmaSpacio: null,
    firmantes: (real.firmantes || []).map((f) => Object.assign({}, f, { firma: null })),
  }) : real));
  return (
    <div className="sa-wrap">
      <div className="sa-pagehead">
        <div>
          <div className="sa-eyebrow">{T("preview")}</div>
          <h1 className="sa-h1">{T("sign_title")}</h1>
          <p className="sa-sub">{T("sign_sub")}</p>
        </div>
        {real && <button className="sa-btn dark" onClick={() => onSign(real)}>{T("sign_full")}</button>}
      </div>
      {doc ? (
        <div className="sa-card" style={{ overflow: "hidden" }}>
          <SignExperience key={doc.id + "-" + (usarReal ? "real" : "demo")} doc={doc} stepOverride={paso}
            onStepChange={setPaso} preview onUpdate={() => {}} />
        </div>
      ) : (
        <div className="sa-table-wrap"><div className="sa-empty">{T("sign_empty")}</div></div>
      )}
    </div>
  );
}

/* ─── Pestaña: base de datos y archivo ───────────────────── */
function DBPanel({ onToast, lang }) {
  const T = (k) => window.SpacioT.t(lang, k);
  const S = window.SpacioSync;
  const F = window.Docs;
  const docs = F.all();
  const [hoja, setHoja] = useS(0);
  const [ep, setEp] = useS(S.endpoint());
  const H = S.HOJAS[hoja];
  const t = S.tabla(H, docs);

  return (
    <div className="sa-wrap">
      <div className="sa-pagehead">
        <div>
          <div className="sa-eyebrow">{T("registry")}</div>
          <h1 className="sa-h1">{T("db_title")}</h1>
          <p className="sa-sub">{T("db_sub")}</p>
        </div>
        <div className="sa-actions">
          <a className="sa-btn ghost" href={S.SHEET_URL} target="_blank" rel="noreferrer">{T("db_open_sheet")}</a>
          <a className="sa-btn ghost" href={S.FOLDER_URL} target="_blank" rel="noreferrer">{T("db_open_folder")}</a>
        </div>
      </div>

      <div className="sign-tabs" style={{ marginBottom: 18 }}>
        {S.HOJAS.map((h, i) => (
          <button key={h.nombre} className={hoja === i ? "on" : ""} onClick={() => setHoja(i)}>{h.nombre}</button>
        ))}
      </div>

      <div className="sa-card" style={{ padding: "20px 22px", marginBottom: 18 }}>
        <div className="sa-eyebrow" style={{ marginBottom: 12 }}>{T("db_cols")} {H.nombre}</div>
        <p style={{ fontSize: 12.5, letterSpacing: ".03em", color: "var(--earth)", margin: "0 0 16px" }}>{H.nota}</p>
        <div className="db-cols">
          {H.cols.map((c) => (
            <div className="db-col" key={c[0]}>
              <b>{c[0]}</b>
              <span className="db-ej">{c[1] || "—"}</span>
              <span className="db-desc">{c[2]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sa-pagehead" style={{ marginBottom: 12 }}>
        <div className="sa-eyebrow">{T("db_rows")} · {t.body.length}</div>
        <div className="sa-actions">
          <button className="sa-btn ghost sm" onClick={() => {
            navigator.clipboard.writeText(S.toTSV(H, docs)).then(() => onToast("Filas copiadas: pégalas en la hoja."), () => onToast("No se pudo copiar."));
          }}>{T("db_copy")}</button>
          <button className="sa-btn ghost sm" onClick={() => { S.download(H, docs); onToast("CSV descargado."); }}>{T("db_csv")}</button>
        </div>
      </div>

      <div className="sa-table-wrap">
        <div className="sa-table-scroll">
          <table className="sa-table">
            <thead><tr>{t.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
            <tbody>
              {t.body.length ? t.body.map((r, i) => (
                <tr key={i} style={{ cursor: "default" }}>{r.map((v, j) => <td key={j}>{v || "—"}</td>)}</tr>
              )) : <tr><td colSpan={t.head.length}><div className="sa-empty">{T("db_empty")}</div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sa-card" style={{ padding: "20px 22px", marginTop: 18 }}>
        <div className="sa-eyebrow" style={{ marginBottom: 12 }}>{T("db_auto")}</div>
        <p style={{ fontSize: 12.5, lineHeight: 1.7, letterSpacing: ".03em", color: "var(--earth)", margin: "0 0 16px" }}>{T("db_auto_note")}</p>
        <label className="sa-field">
          <span>{T("db_url")}</span>
          <input value={ep} placeholder="https://script.google.com/macros/s/…/exec" onChange={(e) => setEp(e.target.value)} />
        </label>
        <div className="sa-actions" style={{ marginTop: 14 }}>
          <button className="sa-btn dark sm" onClick={() => { S.setEndpoint(ep.trim()); onToast(ep.trim() ? "Endpoint guardado." : "Endpoint borrado."); }}>{T("save")}</button>
          <span className="sa-chip">{T("db_state")} <b>{S.endpoint() ? T("connected") : T("not_connected")}</b></span>
        </div>
      </div>
    </div>
  );
}

/* Enlace personal de firma (funciona sin usuario). */
function signLink(doc) {
  return location.origin + location.pathname + "?firmar=" + doc.id;
}

/* ─── Shell ───────────────────────────────────────────────── */
function AdminApp() {
  const [user, setUser] = useS(() => {
    try { return JSON.parse(sessionStorage.getItem("spacio_admin_user") || "null"); } catch (e) { return null; }
  });
  const [tab, setTab] = useS("docs");
  const [signing, setSigning] = useS(null);
  const [toast, setToast] = useS("");
  const [refreshKey, setRefreshKey] = useS(0);
  const [publicKey, setPublicKey] = useS(0);
  const firmarId = (function () { try { return new URLSearchParams(location.search).get("firmar"); } catch (e) { return null; } })();
  const [lang, setLang] = useS(() => { try { return localStorage.getItem("spacio_contratos_lang") || "es"; } catch (e) { return "es"; } });
  const [notiOpen, setNotiOpen] = useS(false);
  const [notiDismiss, setNotiDismiss] = useS(() => { try { return JSON.parse(localStorage.getItem("sam:contratosNotiDismiss") || "{}"); } catch (e) { return {}; } });
  const [notiSnooze, setNotiSnooze] = useS(() => { try { return JSON.parse(localStorage.getItem("sam:contratosNotiSnooze") || "{}"); } catch (e) { return {}; } });
  const T = (k) => window.SpacioT.t(lang, k);

  useE(() => { try { localStorage.setItem("spacio_contratos_lang", lang); } catch (e) {} }, [lang]);
  const persistNoti = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const dismissNoti = (n) => setNotiDismiss((p) => { const u = Object.assign({}, p, { [n.id]: 1 }); persistNoti("sam:contratosNotiDismiss", u); return u; });
  const snoozeNoti = (n) => setNotiSnooze((p) => { const u = Object.assign({}, p, { [n.id]: Date.now() + 86400000 }); persistNoti("sam:contratosNotiSnooze", u); return u; });

  useE(() => {
    try {
      if (user) sessionStorage.setItem("spacio_admin_user", JSON.stringify(user));
      else sessionStorage.removeItem("spacio_admin_user");
    } catch (e) {}
  }, [user]);

  /* Ruta pública: cualquiera con el enlace puede leer y firmar, sin usuario. */
  if (firmarId) {
    const d = window.Docs.get(firmarId);
    if (!d) {
      return (
        <div className="sign-page">
          <div className="sign-top"><LogoPrimary width={92} /></div>
          <div className="sign-done">
            <div className="sa-eyebrow">Enlace de firma</div>
            <h1 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 34, lineHeight: 1.1, margin: 0, color: "var(--ink)" }}>
              Este enlace ya no está disponible.
            </h1>
            <p style={{ fontSize: 13.5, lineHeight: 1.7, color: "var(--earth)", margin: 0 }}>
              Puede que el documento se haya cancelado o que el enlace esté incompleto. Escríbenos a hola@spacioam.com y te enviamos uno nuevo.
            </p>
          </div>
        </div>
      );
    }
    if (d.estado === "cancelado" || d.estado === "anulado") {
      return (
        <div className="sign-page">
          <div className="sign-top"><LogoPrimary width={92} /></div>
          <div className="sign-done">
            <div className="sa-eyebrow">{d.folio}</div>
            <h1 style={{ fontFamily: "var(--serif)", fontWeight: 400, fontSize: 34, lineHeight: 1.1, margin: 0, color: "var(--ink)" }}>
              Este documento ya no requiere tu firma.
            </h1>
            <p style={{ fontSize: 13.5, lineHeight: 1.7, color: "var(--earth)", margin: 0 }}>
              El envío fue {d.estado === "cancelado" ? "cancelado" : "anulado"}. Si esperabas firmarlo, escríbenos a hola@spacioam.com.
            </p>
          </div>
        </div>
      );
    }
    return (
      <SignExperience key={d.id + publicKey} doc={d} onUpdate={() => setPublicKey((k) => k + 1)}
        volverAlPanel={user ? () => { location.href = location.pathname; } : null} />
    );
  }

  if (!user) return <AdminLogin onLogin={setUser} lang={lang} setLang={setLang} />;

  if (signing) {
    return (
      <SignExperience doc={signing.doc} readOnly={signing.readOnly}
        onUpdate={(d) => { setSigning({ doc: d, readOnly: signing.readOnly }); setRefreshKey((k) => k + 1); }}
        onExit={() => { setSigning(null); setRefreshKey((k) => k + 1); }} />
    );
  }

  const P = window.SpacioPerms;
  const perms = P.of(user.email);
  const staff = P.isStaff(user.email);
  const tabs = staff
    ? [
        { id: "docs", label: T("nav_docs") },
        ...(perms.generar ? [{ id: "nuevo", label: T("nav_new") }] : []),
        { id: "correos", label: T("nav_mail") },
        { id: "firma", label: T("nav_sign") },
      ]
    : [{ id: "docs", label: T("nav_docs") }];
  const notiAll = window.SpacioNotis.build({
    abrirDoc: () => { setTab("docs"); window.scrollTo({ top: 0, behavior: "smooth" }); },
    abrirDB: () => { setTab("db"); window.scrollTo({ top: 0, behavior: "smooth" }); },
  });
  const notis = notiAll.filter((n) => !notiDismiss[n.id] && !(notiSnooze[n.id] && notiSnooze[n.id] > Date.now()));

  const tabActual = tabs.some((t) => t.id === tab) || ["cuenta", "setup", "db"].indexOf(tab) >= 0 ? tab : "docs";
  return (
    <div>
      <AdminTopBar user={user} lang={lang} setLang={setLang} notiTotal={notis.length}
        onNotiOpen={() => setNotiOpen(true)} onAccount={() => setTab("cuenta")} onSetup={() => setTab("setup")}
        onLogout={() => setUser(null)} />
      <NotiCenter open={notiOpen} onClose={() => setNotiOpen(false)} notis={notis} onDismiss={dismissNoti} onSnooze={snoozeNoti} />
      <NotiPush notis={notis} storeKey="sam:contratosNotiSeen" onOpen={() => setNotiOpen(true)} />
      <div className="sa-tabs-bar">
        <div className="sa-tabs-inner">
          {tabs.map((t) => (
            <button key={t.id} className={"sa-tab" + (tabActual === t.id ? " active" : "")} onClick={() => { setTab(t.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tabActual === "docs" && (
        <DocsPanel refreshKey={refreshKey} lang={lang} user={user} perms={perms} staff={staff}
          onNuevo={() => setTab("nuevo")} onToast={setToast} onSign={(d, ro) => setSigning({ doc: d, readOnly: !!ro })} />
      )}
      {tabActual === "nuevo" && (
        <Generator onSent={(doc) => { setRefreshKey((k) => k + 1); setTab("docs"); setToast("Contrato enviado a " + doc.firmanteEmail + " · " + doc.folio); }} />
      )}
      {tabActual === "correos" && <MailPanel key={refreshKey} lang={lang} />}
      {tabActual === "firma" && <SignPreviewPanel key={refreshKey} lang={lang} onSign={(d) => setSigning({ doc: d })} />}
      {tabActual === "db" && <DBPanel key={refreshKey} lang={lang} onToast={setToast} />}
      {tabActual === "cuenta" && (
        <AccountPanel key={refreshKey} user={user} lang={lang} onToast={setToast}
          onUpdate={(u) => { setUser(u); setRefreshKey((k) => k + 1); }} />
      )}
      {tabActual === "setup" && <SetupPanel user={user} key={refreshKey} lang={lang} onToast={setToast} onGoDB={() => setTab("db")} />}

      <Toast message={toast} onDone={() => setToast("")} />
    </div>
  );
}

const adminRoot = ReactDOM.createRoot(document.getElementById("root"));
adminRoot.render(<AdminApp />);
