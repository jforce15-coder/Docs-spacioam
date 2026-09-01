/* ══════════════════════════════════════════════════════════════
   Mi cuenta + Setup — mismo patrón que el AccountSection del
   Dashboard de Propietarios (foto, nombre en 4 partes, correos,
   contraseña) más la firma guardada de esta app.
   ══════════════════════════════════════════════════════════════ */
const PROFILE_KEY = "spacio_contratos_profile_v1";

function loadProfile(email) {
  try { return (JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}"))[String(email || "").toLowerCase()] || {}; }
  catch (e) { return {}; }
}
function saveProfile(email, patch) {
  var all = {};
  try { all = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}"); } catch (e) {}
  var k = String(email || "").toLowerCase();
  all[k] = Object.assign({}, all[k] || {}, patch);
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(all)); } catch (e) {}
  return all[k];
}
function splitNombre(full) {
  const w = String(full || "").trim().split(/\s+/).filter(Boolean);
  if (w.length <= 1) return { pn: w[0] || "", sn: "", pa: "", sa: "" };
  if (w.length === 2) return { pn: w[0], sn: "", pa: w[1], sa: "" };
  if (w.length === 3) return { pn: w[0], sn: "", pa: w[1], sa: w[2] };
  return { pn: w[0], sn: w[1], pa: w[2], sa: w.slice(3).join(" ") };
}

function AccountField({ label, hint, value, onChange, type, placeholder }) {
  return (
    <label className="sa-field">
      <span>{label}</span>
      <input value={value} type={type || "text"} placeholder={placeholder || ""} autoCapitalize="none"
        onChange={(e) => onChange(e.target.value)} />
      {hint && <em className="sa-field-hint">{hint}</em>}
    </label>
  );
}

function AccountPanel({ user, lang, onUpdate, onToast }) {
  const T = (k) => window.SpacioT.t(lang, k);
  const prof = loadProfile(user.email);
  const base = splitNombre(prof.name || user.name);
  const [pn, setPn] = React.useState(prof.pn != null ? prof.pn : base.pn);
  const [sn, setSn] = React.useState(prof.sn != null ? prof.sn : base.sn);
  const [pa, setPa] = React.useState(prof.pa != null ? prof.pa : base.pa);
  const [sa, setSa] = React.useState(prof.sa != null ? prof.sa : base.sa);
  const [email, setEmail] = React.useState(user.email || "");
  const [secondary, setSecondary] = React.useState(prof.secondary || "");
  const [pass, setPass] = React.useState("");
  const [avatar, setAvatar] = React.useState(user.avatar || prof.avatar || "");
  const [err, setErr] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const photoRef = React.useRef(null);
  const firma = window.Firmas.get(user.email);
  const initials = (user.name || "SA").split(" ").map((w) => w[0]).slice(0, 2).join("");

  const pickPhoto = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = 320, cv = document.createElement("canvas");
      cv.width = side; cv.height = side;
      const k = Math.max(side / img.width, side / img.height);
      const w = img.width * k, h = img.height * k;
      cv.getContext("2d").drawImage(img, (side - w) / 2, (side - h) / 2, w, h);
      const data = cv.toDataURL("image/jpeg", 0.8);
      setAvatar(data); saveProfile(user.email, { avatar: data });
      onUpdate(Object.assign({}, user, { avatar: data }));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => URL.revokeObjectURL(url);
    img.src = url;
  };

  const guardar = () => {
    if (!/.+@.+\..+/.test(email)) { setErr(T("acc_invalid")); return; }
    setErr("");
    const name = [pn, sn, pa, sa].map((s) => (s || "").trim()).filter(Boolean).join(" ");
    saveProfile(user.email, { name: name, pn: pn.trim(), sn: sn.trim(), pa: pa.trim(), sa: sa.trim(), secondary: secondary.trim(), avatar: avatar });
    if (window.SAAuth) {
      if (email.trim().toLowerCase() !== (user.email || "").toLowerCase()) window.SAAuth.setEmail(user.email, email.trim().toLowerCase());
      if (pass) window.SAAuth.setPassword(email.trim().toLowerCase(), "", pass);
    }
    onUpdate(Object.assign({}, user, { name: name || user.name, email: email.trim().toLowerCase(), avatar: avatar }));
    setPass(""); setSaved(true); setTimeout(() => setSaved(false), 2400);
    onToast && onToast(T("acc_saved") + ".");
  };

  return (
    <div className="sa-wrap">
      <div className="sa-pagehead">
        <div>
          <div className="sa-eyebrow">{T("nav_account")}</div>
          <h1 className="sa-h1">{T("acc_title")}</h1>
          <p className="sa-sub">{T("acc_sub")}</p>
        </div>
      </div>

      <div className="sa-acc-grid">
        <div className="sa-card" style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <button type="button" onClick={() => photoRef.current && photoRef.current.click()} className="sa-acc-photo">
              {avatar ? <img src={avatar} alt="" /> : initials}
            </button>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span className="sa-eyebrow">{T("acc_photo")}</span>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input ref={photoRef} type="file" accept="image/*" style={{ display: "none" }}
                  onChange={(e) => { pickPhoto(e.target.files[0]); e.target.value = ""; }} />
                <button className="sa-btn ghost sm" onClick={() => photoRef.current && photoRef.current.click()}>
                  {avatar ? T("acc_change") : T("acc_upload")}
                </button>
                {avatar && <button className="sa-btn ghost sm" onClick={() => { setAvatar(""); saveProfile(user.email, { avatar: "" }); onUpdate(Object.assign({}, user, { avatar: "" })); }}>{T("acc_remove")}</button>}
              </div>
            </div>
          </div>

          <div className="sa-acc-names">
            <AccountField label={T("acc_pn")} value={pn} onChange={setPn} />
            <AccountField label={T("acc_sn")} value={sn} onChange={setSn} />
            <AccountField label={T("acc_pa")} value={pa} onChange={setPa} />
            <AccountField label={T("acc_sa")} value={sa} onChange={setSa} />
          </div>
          <AccountField label={T("acc_email")} hint={T("acc_email_hint")} value={email} onChange={setEmail} type="email" placeholder="tu@spacioam.com" />
          <AccountField label={T("acc_secondary")} hint={T("acc_secondary_hint")} value={secondary} onChange={setSecondary} type="email" placeholder="alterno@correo.com" />
          <AccountField label={T("acc_pass")} hint={T("acc_pass_hint")} value={pass} onChange={setPass} type="password" placeholder="••••••••" />
          {err && <div className="sa-login-err">{err}</div>}
          <div className="sa-actions">
            <button className="sa-btn dark" onClick={guardar}>{saved ? T("acc_saved") : T("acc_save")}</button>
          </div>
          <p className="sa-field-hint" style={{ margin: 0 }}>{T("acc_note")}</p>
        </div>

        <div className="sa-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <span className="sa-eyebrow">{T("acc_sig")}</span>
          {firma ? (
            <>
              <div className="sign-preview-box" style={{ height: 120 }}><img src={firma.img} alt="" /></div>
              <div className="sa-rows">
                <div className="sa-row"><span className="sa-row-k">Método</span><span className="sa-row-v">{firma.metodo === "drawn" ? "Trazada" : firma.metodo === "uploaded" ? "Imagen" : "Escrita"}</span></div>
                <div className="sa-row"><span className="sa-row-k">Guardada</span><span className="sa-row-v">{window.Docs.fmtDateTime(firma.ts)}</span></div>
              </div>
              <button className="sa-btn danger sm" style={{ alignSelf: "flex-start" }}
                onClick={() => { window.Firmas.remove(user.email); onToast && onToast("Firma borrada."); onUpdate(Object.assign({}, user)); }}>
                {T("acc_sig_del")}
              </button>
            </>
          ) : (
            <p className="sa-field-hint" style={{ margin: 0 }}>{T("acc_sig_none")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Setup ───────────────────────────────────────────────── */
/* ─── Permisos (solo el administrador principal los edita) ─── */
function PermisosCard({ user, onToast }) {
  const P = window.SpacioPerms;
  const soyDueno = P.isOwner(user && user.email);
  const [, force] = React.useState(0);
  const [nuevo, setNuevo] = React.useState("");
  const lista = P.list();
  const mios = P.of(user && user.email);

  if (!soyDueno) {
    return (
      <div className="sa-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <span className="sa-eyebrow">Tus permisos</span>
        <div className="sa-rows">
          {P.CAPS.map((c) => (
            <div className="sa-row" key={c[0]}>
              <span className="sa-row-k">{c[1]}</span>
              <span className="sa-row-v">{mios[c[0]] ? "Sí" : "No"}</span>
            </div>
          ))}
        </div>
        <p className="sa-field-hint" style={{ margin: 0 }}>
          Los permisos los otorga el administrador principal ({P.OWNER}). Escríbele si necesitas alguno.
        </p>
      </div>
    );
  }

  const toggle = (email, cap) => {
    const p = Object.assign({}, P.of(email));
    p[cap] = !p[cap];
    P.set(email, p);
    force((n) => n + 1);
    onToast && onToast("Permisos actualizados para " + email + ".");
  };

  return (
    <div className="sa-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14, gridColumn: "1 / -1" }}>
      <span className="sa-eyebrow">Permisos de usuarios</span>
      <p className="sa-field-hint" style={{ margin: 0 }}>
        Solo tú puedes otorgar o quitar permisos. Quien no tenga ninguno entra con su correo y ve únicamente los
        documentos asociados a él.
      </p>
      <div className="sa-rows">
        <div className="sa-row">
          <span className="sa-row-k">{P.OWNER}</span>
          <span className="sa-row-v">Administrador principal · todos los permisos</span>
        </div>
      </div>
      {lista.map((u) => (
        <div key={u.email} className="perm-row">
          <span className="perm-mail">{u.email}</span>
          <div className="perm-caps">
            {P.CAPS.map((c) => (
              <button key={c[0]} type="button" title={c[2]}
                className={"perm-chip" + (u.perms[c[0]] ? " on" : "")}
                onClick={() => toggle(u.email, c[0])}>{c[1]}</button>
            ))}
          </div>
          <button type="button" className="sa-btn danger sm"
            onClick={() => { P.remove(u.email); force((n) => n + 1); onToast && onToast("Usuario retirado."); }}>Quitar</button>
        </div>
      ))}
      <div className="sa-actions">
        <input className="perm-input" value={nuevo} onChange={(e) => setNuevo(e.target.value)}
          placeholder="correo@spacioam.com" />
        <button type="button" className="sa-btn dark sm" disabled={!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(nuevo.trim())}
          onClick={() => {
            P.set(nuevo.trim(), { generar: true, firmar: false, admin: false });
            setNuevo(""); force((n) => n + 1);
            onToast && onToast("Usuario agregado con permiso para generar.");
          }}>Agregar usuario</button>
      </div>
    </div>
  );
}

function SetupPanel({ lang, onToast, onGoDB, user }) {
  const T = (k) => window.SpacioT.t(lang, k);
  const S = window.SpacioSync;
  const M = window.SpacioEmails;
  const firmas = window.Firmas.all();
  const emails = Object.keys(firmas);
  const [, force] = React.useState(0);

  return (
    <div className="sa-wrap">
      <div className="sa-pagehead">
        <div>
          <div className="sa-eyebrow">{T("nav_setup")}</div>
          <h1 className="sa-h1">{T("setup_title")}</h1>
          <p className="sa-sub">{T("setup_sub")}</p>
        </div>
      </div>

      <div className="sa-acc-grid">
        <div className="sa-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <span className="sa-eyebrow">{T("setup_sender")}</span>
          <div className="sa-rows">
            <div className="sa-row"><span className="sa-row-k">{T("row_sender_name")}</span><span className="sa-row-v">{M.FROM_NAME}</span></div>
            <div className="sa-row"><span className="sa-row-k">{T("row_email")}</span><span className="sa-row-v">{M.FROM_EMAIL}</span></div>
            <div className="sa-row"><span className="sa-row-k">{T("row_reply")}</span><span className="sa-row-v">{M.FROM_EMAIL}</span></div>
          </div>
          <p className="sa-field-hint" style={{ margin: 0 }}>{T("setup_sender_note")}</p>
        </div>

        <div className="sa-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <span className="sa-eyebrow">{T("setup_db")}</span>
          <div className="sa-rows">
            <div className="sa-row"><span className="sa-row-k">{T("row_sheet")}</span><span className="sa-row-v">CONTRATOS · FIRMAS</span></div>
            <div className="sa-row"><span className="sa-row-k">{T("row_folder")}</span><span className="sa-row-v">Contratos firmados</span></div>
            <div className="sa-row"><span className="sa-row-k">{T("row_write")}</span><span className="sa-row-v">{S.endpoint() ? T("connected") : T("not_connected")}</span></div>
          </div>
          <div className="sa-actions">
            <button className="sa-btn ghost sm" onClick={onGoDB}>{T("open_db")}</button>
            <a className="sa-btn ghost sm" href={S.SHEET_URL} target="_blank" rel="noreferrer">{T("sheet")}</a>
            <a className="sa-btn ghost sm" href={S.FOLDER_URL} target="_blank" rel="noreferrer">{T("drive")}</a>
          </div>
        </div>

        <div className="sa-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <span className="sa-eyebrow">{T("setup_sigs")} · {emails.length}</span>
          {emails.length ? emails.map((e) => (
            <div key={e} className="sa-uplist-row" style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--beige-soft)", border: "1px solid var(--ink-08)", borderRadius: 14, padding: "11px 14px" }}>
              <img src={firmas[e].img} alt="" style={{ height: 34, maxWidth: 120, objectFit: "contain" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, letterSpacing: ".03em", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis" }}>{e}</div>
                <div style={{ fontSize: 10.5, color: "var(--fg-muted)" }}>{window.Docs.fmtDate(firmas[e].ts)}</div>
              </div>
              <button className="sa-btn danger sm" onClick={() => { window.Firmas.remove(e); force((n) => n + 1); onToast && onToast("Firma borrada."); }}>{T("delete")}</button>
            </div>
          )) : <p className="sa-field-hint" style={{ margin: 0 }}>{T("sigs_empty")}</p>}
        </div>

        <PermisosCard user={user} onToast={onToast} />
      </div>
    </div>
  );
}

Object.assign(window, { AccountPanel, SetupPanel, AccountField, loadProfile, saveProfile, splitNombre });
