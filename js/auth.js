// 微软账号登录：OAuth 2.0 授权码 + PKCE（纯前端，无需服务器、无第三方库）
window.Auth = (() => {
  const cfg = window.CRM_CONFIG || {};
  const BASE = `https://login.microsoftonline.com/${cfg.tenant || 'common'}/oauth2/v2.0`;
  const SCOPES = 'openid profile offline_access User.Read Files.ReadWrite.AppFolder';
  const TOKEN_KEY = 'crm.auth';
  const PKCE_KEY = 'crm.pkce';

  const configured = () => !!cfg.clientId && !/YOUR-CLIENT-ID/.test(cfg.clientId);
  const redirectUri = () => location.origin + location.pathname.replace(/index\.html$/, '');

  const b64url = (bytes) =>
    btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const randomStr = (n = 48) => b64url(crypto.getRandomValues(new Uint8Array(n)));

  const load = () => { try { return JSON.parse(localStorage.getItem(TOKEN_KEY)); } catch { return null; } };
  const save = (t) => localStorage.setItem(TOKEN_KEY, JSON.stringify(t));

  function decodeJwt(jwt) {
    try {
      const p = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(decodeURIComponent(escape(atob(p))));
    } catch { return {}; }
  }

  function storeTokens(json, prev) {
    const t = {
      access: json.access_token,
      refresh: json.refresh_token || (prev && prev.refresh),
      exp: Date.now() + (json.expires_in || 3600) * 1000,
      user: prev && prev.user
    };
    if (json.id_token) {
      const c = decodeJwt(json.id_token);
      t.user = { name: c.name || '', email: c.preferred_username || c.email || '' };
    }
    save(t);
    return t;
  }

  async function tokenRequest(params) {
    const res = await fetch(`${BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: cfg.clientId, scope: SCOPES, ...params })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error_description || json.error || `登录失败 (${res.status})`);
    return json;
  }

  // silent = true：自动续登录（prompt=none）。微软账号仍处于登录状态时，
  // 页面会跳转到微软再立即跳回，无需任何输入；否则返回错误，不会打扰用户。
  async function login({ silent = false } = {}) {
    if (!configured()) throw new Error('尚未配置 clientId，请先编辑 config.js');
    const verifier = randomStr(48);
    const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    const state = randomStr(16);
    localStorage.setItem(PKCE_KEY, JSON.stringify({ verifier, state, silent }));
    const extra = {};
    if (silent) {
      extra.prompt = 'none';
      const u = (load() || {}).user;
      if (u && u.email) extra.login_hint = u.email;
    }
    const q = new URLSearchParams({
      ...extra,
      client_id: cfg.clientId,
      response_type: 'code',
      redirect_uri: redirectUri(),
      response_mode: 'query',
      scope: SCOPES,
      state,
      code_challenge: challenge,
      code_challenge_method: 'S256'
    });
    location.assign(`${BASE}/authorize?${q}`);
  }

  // 页面加载时调用：如果 URL 中带有 ?code=，换取令牌
  async function handleRedirect() {
    const p = new URLSearchParams(location.search);
    if (!p.has('code') && !p.has('error')) return false;
    history.replaceState(null, '', redirectUri() + location.hash);
    const pkce = JSON.parse(localStorage.getItem(PKCE_KEY) || '{}');
    localStorage.removeItem(PKCE_KEY);
    if (p.has('error')) {
      // 自动续登录失败（微软那边也已退出）→ 不报错，等用户手动登录
      if (pkce.silent) { silentFailed = true; return false; }
      throw new Error(p.get('error_description') || p.get('error'));
    }
    if (!pkce.verifier || pkce.state !== p.get('state')) throw new Error('登录状态校验失败，请重试');
    const json = await tokenRequest({
      grant_type: 'authorization_code',
      code: p.get('code'),
      redirect_uri: redirectUri(),
      code_verifier: pkce.verifier
    });
    storeTokens(json, null);
    localStorage.removeItem(SILENT_KEY);
    lastWasSilent = !!pkce.silent;
    return true;
  }

  // 自动续登录：同一台设备 10 分钟内最多尝试一次，避免反复跳转
  const SILENT_KEY = 'crm.silentAt';
  let silentFailed = false;
  let lastWasSilent = false;
  async function trySilent() {
    if (!configured() || !load()) return false;
    const last = +localStorage.getItem(SILENT_KEY) || 0;
    if (Date.now() - last < 10 * 60 * 1000) return false;
    localStorage.setItem(SILENT_KEY, String(Date.now()));
    await login({ silent: true });
    return true;
  }

  let refreshing = null;
  // 返回可用的 access token；无法获取时返回 null（需要重新登录）
  async function getToken() {
    const t = load();
    if (!t) return null;
    if (t.access && t.exp - Date.now() > 120000) return t.access;
    if (!t.refresh) return null;
    if (!refreshing) {
      refreshing = tokenRequest({ grant_type: 'refresh_token', refresh_token: t.refresh })
        .then((json) => storeTokens(json, t).access)
        .catch((e) => {
          // 刷新令牌过期（SPA 刷新令牌有效期约 24 小时）→ 需要重新登录
          if (navigator.onLine) save({ user: t.user, expired: true });
          console.warn('refresh failed', e);
          return null;
        })
        .finally(() => { refreshing = null; });
    }
    return refreshing;
  }

  function logout() { localStorage.removeItem(TOKEN_KEY); }

  return {
    configured,
    login,
    logout,
    handleRedirect,
    getToken,
    trySilent,
    silentFailed: () => silentFailed,
    lastWasSilent: () => lastWasSilent,
    user: () => (load() || {}).user || null,
    hasSession: () => !!load(),
    needsRelogin: () => { const t = load(); return !!t && (t.expired || (!t.refresh && t.exp < Date.now())); }
  };
})();
