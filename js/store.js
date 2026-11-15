// 本地数据 + OneDrive 同步
// 数据先写入本机(localStorage)，再自动同步到 OneDrive 的 “应用/<应用名>/crm-data.json”。
// 多设备同时修改时按“每个客户最后修改时间”合并，不会整份覆盖。
window.Store = (() => {
  const cfg = window.CRM_CONFIG || {};
  const DATA_KEY = 'crm.data';
  const META_KEY = 'crm.meta';
  const GRAPH = 'https://graph.microsoft.com/v1.0/me/drive/special/approot';
  const FILE = encodeURIComponent(cfg.fileName || 'crm-data.json');

  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch { return d; } };
  let data = read(DATA_KEY, { version: 1, customers: [] });
  let meta = read(META_KEY, { etag: null, dirty: false, lastSync: null, lastBackup: null, seq: 0 });
  const listeners = new Set();
  let status = { state: 'idle', message: '' };

  const persist = () => {
    localStorage.setItem(DATA_KEY, JSON.stringify(data));
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  };
  const emit = () => listeners.forEach((fn) => fn());
  const setStatus = (state, message = '') => { status = { state, message }; emit(); };

  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const now = () => new Date().toISOString();

  // ---------- 数据操作 ----------
  const all = () => data.customers.filter((c) => !c.deleted);
  const get = (id) => data.customers.find((c) => c.id === id && !c.deleted);

  function touch() {
    meta.dirty = true;
    meta.seq = (meta.seq || 0) + 1;
    persist();
    emit();
    scheduleSync();
  }

  function upsert(c) {
    const t = now();
    if (!c.id) {
      c = { ...c, id: uid(), createdAt: t, followUps: c.followUps || [] };
      data.customers.push(c);
    } else {
      const i = data.customers.findIndex((x) => x.id === c.id);
      if (i >= 0) data.customers[i] = c; else data.customers.push(c);
    }
    c.updatedAt = t;
    touch();
    return c;
  }

  function remove(id) {
    const c = data.customers.find((x) => x.id === id);
    if (!c) return;
    // 保留“删除标记”，以便同步到其他设备
    Object.keys(c).forEach((k) => { if (!['id', 'createdAt'].includes(k)) delete c[k]; });
    c.deleted = true;
    c.updatedAt = now();
    touch();
  }

  function addFollowUp(id, f) {
    const c = get(id);
    if (!c) return;
    c.followUps = c.followUps || [];
    c.followUps.unshift({ id: uid(), createdAt: now(), ...f });
    c.followUps.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));
    upsert(c);
  }

  function removeFollowUp(id, fid) {
    const c = get(id);
    if (!c) return;
    c.followUps = (c.followUps || []).filter((f) => f.id !== fid);
    upsert(c);
  }

  function replaceAll(newData) {
    // 导入：与现有数据合并（较新的覆盖）
    data = merge(data, newData);
    touch();
  }

  // ---------- 合并 ----------
  function merge(a, b) {
    const map = new Map();
    for (const c of (a.customers || [])) map.set(c.id, c);
    for (const c of (b.customers || [])) {
      const cur = map.get(c.id);
      if (!cur || (c.updatedAt || '') > (cur.updatedAt || '')) map.set(c.id, c);
    }
    return { version: 1, customers: [...map.values()] };
  }
  const fingerprint = (d) =>
    (d.customers || []).map((c) => c.id + '@' + c.updatedAt).sort().join('|');

  // ---------- OneDrive ----------
  async function graph(method, url, token, { body, headers = {} } = {}) {
    const res = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...headers },
      body,
      cache: 'no-store'
    });
    return res;
  }

  let syncing = false;
  let again = false;
  let timer = null;

  function scheduleSync(delay = 1500) {
    clearTimeout(timer);
    timer = setTimeout(() => sync(), delay);
  }

  // 使用方式：'local' = 免登录（手动备份到 OneDrive）；'cloud' = 登录后自动同步
  const MODE_KEY = 'crm.mode';
  const getMode = () => localStorage.getItem(MODE_KEY) || 'local';
  function setMode(m) {
    localStorage.setItem(MODE_KEY, m);
    emit();
    if (m === 'cloud') scheduleSync(100); else setStatus('local');
  }

  // 免登录模式：记录上次手动备份
  function markExported() {
    meta.lastExport = now();
    meta.exportedSeq = meta.seq;
    persist();
    emit();
  }
  const BACKUP_REMIND_DAYS = 3;
  function needsBackup() {
    if (getMode() !== 'local' || !all().length) return false;
    if (meta.exportedSeq === meta.seq) return false; // 备份后没有新修改
    if (!meta.lastExport) return true;
    return Date.now() - new Date(meta.lastExport).getTime() > BACKUP_REMIND_DAYS * 86400000;
  }

  async function sync() {
    if (getMode() !== 'cloud' || !Auth.configured() || !Auth.hasSession()) { setStatus('local'); return; }
    if (!navigator.onLine) { setStatus('offline', '离线，联网后自动同步'); return; }
    if (syncing) { again = true; return; }
    syncing = true;
    setStatus('busy', '同步中…');
    try {
      const token = await Auth.getToken();
      if (!token) { setStatus('relogin', '登录已过期，请在“设置”中重新登录'); return; }

      for (let attempt = 0; attempt < 3; attempt++) {
        const seqAtStart = meta.seq;
        // 1. 读取云端文件信息
        let item = null;
        const r = await graph('GET', `${GRAPH}:/${FILE}`, token);
        if (r.status === 200) item = await r.json();
        else if (r.status !== 404) throw new Error(`读取 OneDrive 失败 (${r.status})`);

        // 2. 云端有新版本 → 下载并合并
        let remote = null;
        if (item && item.eTag !== meta.etag) {
          const dl = await fetch(item['@microsoft.graph.downloadUrl'], { cache: 'no-store' });
          if (!dl.ok) throw new Error(`下载数据失败 (${dl.status})`);
          remote = await dl.json();
          const merged = merge(data, remote);
          if (fingerprint(merged) !== fingerprint(data)) { data = merged; persist(); emit(); }
        }

        // 3. 需要上传？
        const needPush = !item || meta.dirty || (remote && fingerprint(remote) !== fingerprint(data));
        if (!needPush) {
          meta.etag = item.eTag;
          break;
        }
        const headers = { 'Content-Type': 'application/json' };
        if (item) headers['If-Match'] = item.eTag;
        const put = await graph('PUT', `${GRAPH}:/${FILE}:/content`, token, {
          body: JSON.stringify(data),
          headers
        });
        if (put.status === 412 || put.status === 409) continue; // 期间被其他设备修改 → 重新合并
        if (!put.ok) throw new Error(`上传失败 (${put.status})`);
        const saved = await put.json();
        meta.etag = saved.eTag;
        if (meta.seq === seqAtStart) meta.dirty = false;
        await dailyBackup(token);
        break;
      }
      meta.lastSync = now();
      persist();
      setStatus('ok', '已同步');
    } catch (e) {
      console.error(e);
      setStatus('err', e.message || String(e));
    } finally {
      syncing = false;
      if (again) { again = false; scheduleSync(300); }
    }
  }

  // 每天在 OneDrive 中保留一份备份：backups/crm-YYYY-MM-DD.json
  async function dailyBackup(token) {
    const d = new Date();
    const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (meta.lastBackup === day) return;
    try {
      const r = await graph('PUT', `${GRAPH}:/backups/crm-${day}.json:/content`, token, {
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      if (r.ok) meta.lastBackup = day;
    } catch (e) { console.warn('backup failed', e); }
  }

  function resetLocal() {
    data = { version: 1, customers: [] };
    meta = { etag: null, dirty: false, lastSync: null, lastBackup: null, seq: 0 };
    persist();
    emit();
  }

  window.addEventListener('online', () => scheduleSync(200));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleSync(200);
  });

  return {
    all, get, upsert, remove, addFollowUp, removeFollowUp, replaceAll, resetLocal,
    sync, scheduleSync,
    mode: getMode, setMode, markExported, needsBackup,
    exportData: () => ({ version: 1, exportedAt: now(), customers: all() }),
    status: () => status,
    meta: () => meta,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); }
  };
})();
