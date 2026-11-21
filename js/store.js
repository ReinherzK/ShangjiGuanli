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

  function commit(next) {
    // 先写本地数据，容量不足时保留内存中的旧版本。
    localStorage.setItem(DATA_KEY, JSON.stringify(next));
    data = next;
    meta.dirty = true;
    meta.seq = (meta.seq || 0) + 1;
    try { localStorage.setItem(META_KEY, JSON.stringify(meta)); }
    catch (e) { console.warn('无法保存同步状态', e); }
    scheduleSync();
    emit();
  }

  function upsert(customer) {
    const t = now();
    const c = customer.id
      ? { ...customer, updatedAt: t }
      : { ...customer, id: uid(), createdAt: t, updatedAt: t, followUps: customer.followUps || [] };
    const customers = data.customers.some((x) => x.id === c.id)
      ? data.customers.map((x) => x.id === c.id ? c : x)
      : [...data.customers, c];
    commit({ ...data, customers });
    return c;
  }

  function remove(id) {
    const c = get(id);
    if (c) upsert({ id, createdAt: c.createdAt, deleted: true });
  }

  function addFollowUp(id, f, changes = {}) {
    const c = get(id);
    if (!c) return;
    const followUps = [{ id: uid(), createdAt: now(), ...f }, ...(c.followUps || [])];
    followUps.sort((a, b) => (b.date || '').localeCompare(a.date || '') ||
      (b.time || '').localeCompare(a.time || '') || (b.createdAt || '').localeCompare(a.createdAt || ''));
    return upsert({ ...c, ...changes, followUps });
  }

  function removeFollowUp(id, fid) {
    const c = get(id);
    if (c) upsert({ ...c, followUps: (c.followUps || []).filter((f) => f.id !== fid) });
  }

  function updateSettings(key, value, removedChannel) {
    const t = now();
    const customers = key === 'channels' && removedChannel
      ? data.customers.map((c) => (c.channel || c.source) === removedChannel
        ? { ...c, channel: '', source: '', updatedAt: t } : c)
      : data.customers;
    commit({ ...data, customers, settings: { ...data.settings, [key]: { value, updatedAt: t } } });
  }

  function replaceAll(newData) {
    // 导入：与现有数据合并（较新的覆盖）
    commit(merge(data, newData));
  }

  // ---------- 合并 ----------
  function merge(a, b) {
    const map = new Map();
    for (const c of (a.customers || [])) map.set(c.id, c);
    for (const c of (b.customers || [])) {
      const cur = map.get(c.id);
      if (!cur || (c.updatedAt || '') > (cur.updatedAt || '')) map.set(c.id, c);
    }
    const settings = { ...a.settings };
    for (const [key, entry] of Object.entries(b.settings || {})) {
      if (entry && (!settings[key] || entry.updatedAt > settings[key].updatedAt)) settings[key] = entry;
    }
    return { version: 1, customers: [...map.values()], settings };
  }
  const fingerprint = (d) =>
    JSON.stringify([
      (d.customers || []).map((c) => [c.id, c.updatedAt]).sort(),
      Object.entries(d.settings || {}).map(([key, entry]) => [key, entry?.updatedAt]).sort()
    ]);

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

  async function sync() {
    if (!Auth.configured() || !Auth.hasSession()) { setStatus('local', '未登录，数据暂存在本机'); return; }
    if (!navigator.onLine) { setStatus('offline', '离线，联网后自动同步'); return; }
    if (syncing) { again = true; return; }
    syncing = true;
    setStatus('busy', '同步中…');
    try {
      const token = await Auth.getToken();
      if (!token) { setStatus('relogin', '登录已过期，请在“设置”中重新登录'); return; }

      let completed = false;
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
          if (fingerprint(merged) !== fingerprint(data)) {
            localStorage.setItem(DATA_KEY, JSON.stringify(merged));
            data = merged;
            emit();
          }
        }

        // 3. 需要上传？
        const needPush = !item || meta.dirty || (remote && fingerprint(remote) !== fingerprint(data));
        if (!needPush) {
          meta.etag = item.eTag;
          completed = true;
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
        completed = true;
        break;
      }
      if (!completed) throw new Error('OneDrive 数据正在变化，请稍后重试同步');
      await dailyBackup(token);
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
    exportData: () => ({ version: 1, exportedAt: now(), customers: all(), settings: data.settings }),
    settings: (key) => data.settings?.[key]?.value, updateSettings,
    status: () => status,
    meta: () => meta,
    subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); }
  };
})();
