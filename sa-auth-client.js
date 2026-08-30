/* Spacio AM · Cliente de auth unificado — CONTRATOS
   Hoja «Control de usuarios» (una sola para todas las apps).
   Se carga DESPUÉS de React y ANTES de admin.jsx.                */
(function (global) {
  var CFG = {
    url: 'https://script.google.com/macros/s/AKfycbxfdwLzsA8bwgOxUTOtf3Hw1ptIm8Cy34tspmFndu3WtRrkVSSnGyBP7obRrm73mcUd/exec',
    token: 'SpacioAM2026!'
  };

  function call(action, payload) {
    var body = Object.assign({ action: action, token: CFG.token }, payload || {});
    return fetch(CFG.url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body)
    }).then(function (r) { return r.json(); })
      .catch(function (e) { return { ok: false, error: String(e) }; });
  }

  var SAAuth = {
    APP: 'contratos',
    configure: function (url, token) { CFG.url = url; if (token) CFG.token = token; },
    login: function (email, password) { return call('login', { email: email, password: password }); },
    setInitialPassword: function (email, next) { return call('setInitialPassword', { email: email, next: next }); },
    profile: function (email) { return call('profile', { email: email }); },
    setPassword: function (email, cur, next) { return call('setPassword', { email: email, current: cur, next: next }); },
    roleFor: function (profile, appKey) { return (profile && profile.apps && profile.apps[appKey || SAAuth.APP]) || null; }
  };

  global.SAAuth = SAAuth;
})(window);
