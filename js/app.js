(() => {
  const APP_VERSION = '11';
  const STATUSES = ['线索', '商机', '面访', '建联', '转化', '成交', '流失'];
  const LEVELS = ['A', 'B', 'C'];
  const NEXT_OPTIONS = [['明天', 1], ['3天后', 3], ['1周后', 7], ['1个月后', 30], ['不设置', null]];

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const view = $('#view');
  const topbar = $('#topbar');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---------- 日期 ----------
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = () => ymd(new Date());
  const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return ymd(d); };
  const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);
  const fmtDay = (iso) => {
    if (!iso) return '';
    const d = new Date(iso.length > 10 ? iso : iso + 'T00:00:00');
    const sameYear = d.getFullYear() === new Date().getFullYear();
    return `${sameYear ? '' : d.getFullYear() + '年'}${d.getMonth() + 1}月${d.getDate()}日`;
  };

  // ---------- 图标 ----------
  const ICON = {
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    message: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
    pen: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
    mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    trend: '<svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
    phoneDevice: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
    download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    upload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>'
  };

  // 默认卡通头像（未上传头像时使用）
  const DEFAULT_AVATAR = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" fill="#F1EEE9"/><path d="M10 64c0-12 10-19 22-19s22 7 22 19z" fill="#00503C"/><rect x="27" y="36" width="10" height="10" rx="3" fill="#E9B98F"/><path d="M26.5 45l5.5 6 5.5-6z" fill="#FFFFFF"/><circle cx="20.5" cy="28" r="3" fill="#EDBB92"/><circle cx="43.5" cy="28" r="3" fill="#EDBB92"/><ellipse cx="32" cy="27" rx="11.5" ry="12.5" fill="#F3CBA5"/><path d="M20.3 25.5C20 16.5 25.5 12 32.5 12S44.2 16 43.8 24.5c-3-4.2-8-6-14-5-4.2.8-7 3-9.5 6z" fill="#2E2A27"/><circle cx="27.6" cy="28.5" r="1.5" fill="#2E2A27"/><circle cx="36.4" cy="28.5" r="1.5" fill="#2E2A27"/><path d="M28.6 33.2q3.4 2.8 6.8 0" stroke="#B0704A" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
  const avatar = (size, c) => `<span class="avatar" style="width:${size}px;height:${size}px">${avatarImage(c)}</span>`;
  // 带圆环的头像：late=逾期(红土橙)，today=今天(绿)，其他=灰
  const ringAvatar = (size, kind, c) => {
    const inner = size - 6;
    return `<span class="ring ${kind}" style="width:${size}px;height:${size}px"><span>${avatar(inner - 4, c)}</span></span>`;
  };

  // ---------- 通用 ----------
  function toast(msg, ms = 2200) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { t.hidden = true; }, ms);
  }

  const telOf = (c) => (c.phone || '').replace(/[^\d+]/g, '');

  // 跟进状态：late / today / soon / none
  function dueInfo(c) {
    if (!c.nextFollowUp || statusOf(c.status) === '流失') return { kind: 'none', label: '' };
    const n = daysBetween(today(), c.nextFollowUp);
    if (n < 0) return { kind: 'late', label: `逾期 ${-n} 天`, days: n };
    if (n === 0) return { kind: 'today', label: '今天跟进', days: 0 };
    if (n === 1) return { kind: 'soon', label: '明天跟进', days: 1 };
    return { kind: 'soon', label: `${fmtDay(c.nextFollowUp)} 跟进`, days: n };
  }
  const dueCustomers = () => Store.all()
    .filter((c) => ['late', 'today'].includes(dueInfo(c).kind))
    .sort((a, b) => a.nextFollowUp.localeCompare(b.nextFollowUp));

  function syncButton() {
    const s = Store.status();
    const map = { ok: ['ok', '已同步'], busy: ['busy', '同步中'], err: ['err', '同步失败'], relogin: ['err', '需登录'], offline: ['', '离线'], local: ['', '未登录'] };
    const [cls, text] = map[s.state] || ['', ''];
    return `<button class="sync ${cls}" data-act="sync" title="${esc(s.message || '')}"><i></i>${text}</button>`;
  }

  // 顶部标题栏
  function headerTab(title, right = '') {
    topbar.className = 'topbar tab';
    topbar.innerHTML = `<div class="topbar-inner"><h1>${esc(title)}</h1><div class="right">${right}</div></div>`;
    document.title = title === '商机' ? '客户管理' : `${title} · 客户管理`;
  }
  function headerSub({ title, left, right = '' }) {
    topbar.className = 'topbar sub';
    topbar.innerHTML = `<div class="topbar-inner"><div>${left}</div><h1>${esc(title)}</h1><div class="right">${right}</div></div>`;
    document.title = `${title} · 客户管理`;
  }
  const backBtn = (href, label = '返回') => `<a class="icon-btn" href="${href}" aria-label="${label}">${ICON.back}</a>`;

  function setTab(name) {
    document.body.classList.toggle('sub', !name);
    $$('.tabbar a').forEach((a) => a.classList.toggle('on', a.dataset.tab === name));
  }

  function updateBadge() {
    const n = dueCustomers().length;
    const b = $('#todoBadge');
    b.hidden = !n;
    b.textContent = n > 99 ? '99+' : n;
  }

  // ---------- 导出 / 导入备份文件 ----------
  async function exportToFile() {
    const name = `客户数据-${today()}.json`;
    const text = JSON.stringify(Store.exportData(), null, 2);
    for (const type of ['application/json', 'text/plain']) {
      const file = new File([text], name, { type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try { await navigator.share({ files: [file] }); toast('已导出'); }
        catch (e) { if (e.name !== 'AbortError') toast('导出失败：' + e.message); }
        return;
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    toast('已下载备份文件');
  }

  function restoreFromFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json,text/plain';
    input.onchange = async () => {
      const f = input.files[0];
      if (!f) return;
      try {
        const json = JSON.parse(await f.text());
        if (!Array.isArray(json.customers)) throw new Error('文件格式不正确');
        Store.replaceAll(json);
        toast(`已导入 ${json.customers.length} 位客户`);
      } catch (err) { toast('导入失败：' + err.message, 3500); }
    };
    input.click();
  }

  async function doLogin() {
    try { await Auth.login(); } catch (e) { toast(e.message); }
  }

  // 从旧的“全屏”主屏幕图标打开：iOS 会把微软登录转到 Safari，登录结果回不到这里
  const isStandalone = () =>
    window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;

  function banner() {
    if (isStandalone()) {
      const n = Store.all().length;
      return `<div class="banner">当前是旧版全屏图标，iPhone 上无法在这里保持微软登录。请：<br>
        ${n ? `① 先点下方按钮导出这里的 ${n} 位客户（存储到“文件”）<br>` : ''}
        ${n ? '②' : '①'} 在 Safari 中打开 reinherzk.github.io/ShangjiGuanli/ → 登录 → 分享 → 添加到主屏幕，<b>关闭“作为网页 App 打开”</b>（如有此开关）<br>
        ${n ? '③ 在新图标的“我的 › 设置 › 从备份文件导入”中导入，' : '②'} 然后删除这个旧图标
        ${n ? '<br><button class="btn small primary" data-act="export">导出客户数据</button>' : ''}</div>`;
    }
    if (!Auth.configured()) return '';
    const relogin = Auth.hasSession() && (Auth.needsRelogin() || Store.status().state === 'relogin');
    if (Auth.hasSession() && !relogin) return '';
    return `<div class="banner">${relogin ? '登录已过期' : '尚未登录'}，新的修改暂存在这台手机上，登录后会自动同步到 OneDrive。<br>
      <button class="btn small primary" data-act="login">登录微软账号</button></div>`;
  }

  // ---------- 商机 ----------
  const ui = { query: '', status: '全部' };

  function renderList() {
    setTab('list');
    headerTab('商机', syncButton() + `<a class="icon-btn" href="#/new" aria-label="新增客户">${ICON.plus}</a>`);

    const due = dueCustomers();
    const all = Store.all();
    const counts = { '全部': all.length };
    all.forEach((c) => { counts[statusOf(c.status)] = (counts[statusOf(c.status)] || 0) + 1; });

    view.innerHTML = `
      ${banner()}
      ${due.length ? `<div class="stories" aria-label="待跟进">
        ${due.map((c) => {
          const d = dueInfo(c);
          return `<a class="story" href="#/c/${c.id}">
            ${ringAvatar(64, d.kind === 'late' ? 'late' : '', c)}
            <span class="nm">${esc(c.name)}</span>
            <span class="when ${d.kind === 'late' ? 'late' : ''}">${d.kind === 'late' ? esc(d.label) : '今天'}</span>
          </a>`;
        }).join('')}
      </div>` : ''}
      <div class="search-wrap">
        <label class="search">${ICON.search}<span class="hidden-label">搜索客户</span>
          <input id="q" type="search" placeholder="搜索姓名、公司、电话、标签" value="${esc(ui.query)}" autocomplete="off">
        </label>
      </div>
      <div class="ftabs" role="tablist">
        ${['全部', ...STATUSES].map((s) => `<button class="ftab ${ui.status === s ? 'on' : ''}" data-s="${s}" role="tab" aria-selected="${ui.status === s}">${s}${counts[s] ? ' ' + counts[s] : ''}</button>`).join('')}
      </div>
      <div id="posts"></div>`;

    $('#q').addEventListener('input', (e) => { ui.query = e.target.value; renderPosts(); });
    $$('.ftab', view).forEach((b) => b.onclick = () => { ui.status = b.dataset.s; renderList(); });
    renderPosts();
  }

  function renderPosts() {
    const q = ui.query.trim().toLowerCase();
    let list = Store.all();
    if (ui.status !== '全部') list = list.filter((c) => statusOf(c.status) === ui.status);
    if (q) {
      list = list.filter((c) =>
        [c.name, c.company, c.title, c.phone, c.wechat, c.email, c.address, c.source, c.channel, c.occupation, c.residence, c.hometown, c.notes, ...(c.preferences || []), (c.tags || []).join(' '),
          ...(c.followUps || []).map((f) => f.content)]
          .some((v) => String(v || '').toLowerCase().includes(q)));
    }
    list.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));

    const box = $('#posts');
    if (!list.length) {
      box.innerHTML = `<div class="empty">${Store.all().length ? '没有匹配的客户' : '还没有客户，点右上角 ＋ 添加第一位'}</div>`;
      return;
    }
    box.innerHTML = list.map((c) => {
      const f = (c.followUps || [])[0];
      const tel = telOf(c);
      const d = dueInfo(c);
      const text = f ? (f.content || f.place || f.type || '互动记录') : (c.notes || '还没有跟进记录');
      const meta = f ? `${f.type} · ${fmtDay(f.date)}` : `创建于 ${fmtDay((c.createdAt || '').slice(0, 10))}`;
      return `<article class="post">
        <a class="post-head" href="#/c/${c.id}">
          ${avatar(40, c)}
          <span class="who"><span class="nm">${esc(c.name)}</span><span class="co">${esc([c.company, c.title].filter(Boolean).join(' · ') || c.phone || '')}</span></span>
          ${c.status ? `<span class="status"><span class="dot s-${esc(statusOf(c.status))}"></span>${esc(statusOf(c.status))}</span>` : ''}
        </a>
        <p class="post-text ${f || c.notes ? '' : 'placeholder'}">${esc(text)}</p>
        <div class="post-meta">${esc(meta)}</div>
        <div class="post-actions">
          <a class="act ${tel ? '' : 'disabled'}" href="tel:${esc(tel)}" aria-label="打电话">${ICON.phone}</a>
          <a class="act ${tel ? '' : 'disabled'}" href="sms:${esc(tel)}" aria-label="发短信">${ICON.message}</a>
          <a class="act" href="#/c/${c.id}/follow" aria-label="写动态">${ICON.pen}</a>
          ${d.label ? `<span class="next ${d.kind}">${esc(d.label)}</span>` : ''}
        </div>
      </article>`;
    }).join('');
  }

  // ---------- 客户详情 ----------
  const DEFAULT_CHANNELS = [
    ...['Blued', '小红书', 'Grindr'].map((name) => ({ name, kind: '线上' })),
    { name: '喝酒', kind: '线下' }
  ];
  const SCENES = ['线上聊天', '线下见面', '约炮'];
  const PALETTES = {
    green: ['#F4F4F4', '#CFE3DA', '#8BBFA5', '#2C8657', '#00503C'],
    clay: ['#F4F4F4', '#F4DAC8', '#EAB593', '#CC4E0E', '#993606']
  };
  const calendarSettings = () => ({
    weights: [1, 2, 3], thresholds: [1, 2, 3, 5], palette: 'green',
    ...Store.settings('calendar')
  });
  const statusOf = (s) => ({ 潜在: '线索', 跟进中: '商机', 已成交: '成交', 已流失: '流失' })[s] || s || '';
  const imageSrc = (s) => typeof s === 'string' && /^data:image\/jpeg;base64,[\w+/=]+$/.test(s) ? s : '';
  const dateMonth = (date) => date.slice(0, 7);
  const localTime = () => new Date().toTimeString().slice(0, 5);
  const tagList = (tags) => tags.map((tag) => `<span class="chip">${esc(tag)}</span>`).join('');
  const infoRows = (rows) => rows.filter(([, value]) => value).map(([key, value]) =>
    `<div class="kv"><span class="k">${key}</span><span class="v">${esc(value)}</span></div>`).join('');

  function saveChange(action) {
    try { return action(); }
    catch (error) {
      console.error(error);
      toast(error.name === 'QuotaExceededError' ? '本机存储空间不足，请删除部分照片后重试' : '保存失败，请重试');
      return null;
    }
  }

  async function compressPhoto(file) {
    if (file.type && !file.type.startsWith('image/')) throw new Error('请选择图片文件');
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      const scale = Math.min(1, 960 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.75);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  const photoFrom = (src) => ({ id: crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2), src });
  const photoImg = (src, alt) => `<img src="${imageSrc(src)}" alt="${esc(alt)}">`;
  const avatarPhoto = (c) => (c?.photos || []).find((photo) => photo.id === c.avatarId);
  const validCrop = (crop) => crop && [crop.x, crop.y, crop.width, crop.height].every(Number.isFinite) &&
    crop.width > 0 && crop.height > 0 && crop.x >= 0 && crop.y >= 0 &&
    crop.x + crop.width <= 1.00001 && crop.y + crop.height <= 1.00001;

  function avatarImage(c) {
    const photo = avatarPhoto(c);
    const src = imageSrc(photo?.src);
    if (!src) return DEFAULT_AVATAR;
    const crop = c.avatarCrop;
    if (!validCrop(crop)) return photoImg(src, '');
    return `<img class="avatar-cropped" src="${src}" alt="" style="width:${100 / crop.width}%;height:${100 / crop.height}%;left:${-100 * crop.x / crop.width}%;top:${-100 * crop.y / crop.height}%">`;
  }

  function avatarCropGeometry(width, height, zoom, x, y) {
    const edge = Math.min(width, height) / zoom;
    const w = edge / width;
    const h = edge / height;
    const left = Math.max(0, Math.min(1 - w, x - w / 2));
    const top = Math.max(0, Math.min(1 - h, y - h / 2));
    return { x: left, y: top, width: w, height: h };
  }

  function editAvatar(dialog, photo, savedCrop, onSave) {
    dialog.innerHTML = `<div class="section-head"><h3>调整头像</h3><button type="button" class="link-btn" data-crop-cancel>取消</button></div>
      <div class="crop-frame" tabindex="0" aria-label="头像裁剪框，可拖动照片或用方向键调整">
        <img alt="" draggable="false" class="crop-image">
      </div>
      <div class="crop-controls">
        <button class="btn primary" type="button" data-crop-save disabled>保存头像</button>
      </div>
      <p class="hint">单指拖动照片，双指捏合或张开缩放。</p>`;

    const frame = $('.crop-frame', dialog);
    const img = $('.crop-image', dialog);
    const save = $('[data-crop-save]', dialog);
    let crop;
    let zoom = 1;
    const pointers = new Map();
    const draw = (nextZoom, x, y) => {
      zoom = Math.min(4, Math.max(1, nextZoom));
      crop = avatarCropGeometry(img.naturalWidth, img.naturalHeight, zoom, x, y);
      img.style.width = `${100 / crop.width}%`;
      img.style.height = `${100 / crop.height}%`;
      img.style.left = `${-100 * crop.x / crop.width}%`;
      img.style.top = `${-100 * crop.y / crop.height}%`;
    };
    const center = () => [crop.x + crop.width / 2, crop.y + crop.height / 2];
    const move = (dx, dy) => {
      const [x, y] = center();
      draw(zoom, x - dx * crop.width, y - dy * crop.height);
    };
    const pinch = () => {
      const [a, b] = pointers.values();
      return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, distance: Math.hypot(a.x - b.x, a.y - b.y) };
    };
    img.onload = () => {
      if (!dialog.open || !img.isConnected) return;
      const previous = validCrop(savedCrop);
      draw(previous ? 1 / Math.max(savedCrop.width, savedCrop.height) : 1,
        previous ? savedCrop.x + savedCrop.width / 2 : 0.5,
        previous ? savedCrop.y + savedCrop.height / 2 : 0.5);
      save.disabled = false;
    };
    img.onerror = () => {
      if (dialog.open && img.isConnected) toast('无法打开这张照片');
    };
    frame.onpointerdown = (event) => {
      if (!crop || pointers.size >= 2 || event.button !== 0) return;
      event.preventDefault();
      frame.setPointerCapture(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    };
    frame.onpointermove = (event) => {
      const before = pointers.get(event.pointerId);
      const rect = frame.getBoundingClientRect();
      if (!before || !rect.width) return;
      const previous = pointers.size === 2 ? pinch() : null;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (!previous) {
        move((event.clientX - before.x) / rect.width, (event.clientY - before.y) / rect.height);
        return;
      }
      const next = pinch();
      if (previous.distance < 2 || next.distance < 2) return;
      const nextZoom = Math.min(4, Math.max(1, zoom * next.distance / previous.distance));
      const ratio = zoom / nextZoom;
      const oldX = (previous.x - rect.left) / rect.width;
      const oldY = (previous.y - rect.top) / rect.height;
      const newX = (next.x - rect.left) / rect.width;
      const newY = (next.y - rect.top) / rect.height;
      draw(nextZoom, crop.x + crop.width * (oldX + (0.5 - newX) * ratio),
        crop.y + crop.height * (oldY + (0.5 - newY) * ratio));
    };
    const release = (event) => pointers.delete(event.pointerId);
    frame.onpointerup = frame.onpointercancel = frame.onlostpointercapture = release;
    frame.onkeydown = (event) => {
      if (!crop) return;
      const direction = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
      if (direction) {
        event.preventDefault();
        move(direction[0] * 0.025, direction[1] * 0.025);
      } else if (event.key === '+' || event.key === '-' || event.key === '=') {
        event.preventDefault();
        draw(zoom * (event.key === '-' ? 0.9 : 1.1), ...center());
      }
    };
    save.onclick = () => { if (crop) onSave(crop); };
    $('[data-crop-cancel]', dialog).onclick = () => dialog.close();
    if (!dialog.open) dialog.showModal();
    img.src = photo.src;
  }

  let activePhotoPicker;

  function bindPhotoPicker(input, onPhotos) {
    input.onclick = () => { activePhotoPicker = input; };
    input.oncancel = () => {
      if (activePhotoPicker === input) activePhotoPicker = null;
    };
    input.onchange = async () => {
      const files = Array.from(input.files);
      input.value = '';
      if (!files.length) { input.oncancel(); return; }
      activePhotoPicker = input;
      input.disabled = true;
      const route = location.hash;
      const photos = [];
      let failed = 0;
      try {
        for (const file of files) {
          if (!input.isConnected || location.hash !== route) return;
          try {
            const src = await compressPhoto(file);
            if (!imageSrc(src)) throw new Error('无法转换图片');
            photos.push(photoFrom(src));
          } catch {
            failed++;
          }
        }
        if (!input.isConnected || location.hash !== route) return;
        if (!photos.length) { toast('无法读取所选照片，请换一批重试'); return; }
        if (onPhotos(photos)) {
          toast(failed ? `已添加 ${photos.length} 张照片，${failed} 张无法读取` : `已添加 ${photos.length} 张照片`);
        }
      } finally {
        input.disabled = false;
        if (activePhotoPicker === input) activePhotoPicker = null;
      }
    };
  }

  function birthdayLabel(c) {
    if (!c.birthday) return c.age ? `${c.age} 岁` : '';
    const current = today();
    const md = c.birthday.slice(5);
    const age = Number(current.slice(0, 4)) - Number(c.birthday.slice(0, 4)) - Number(current.slice(5) < md);
    const [month, day] = md.split('-').map(Number);
    const cutoffs = [20, 19, 21, 20, 21, 22, 23, 23, 23, 24, 23, 22];
    const signs = ['摩羯', '水瓶', '双鱼', '白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手'];
    return `${fmtDay(c.birthday)} · ${age} 岁 · ${signs[(month - 1 + Number(day >= cutoffs[month - 1])) % 12]}座`;
  }

  function renderProfileInfo(c) {
    const facts = infoRows([
      ['身材', [c.height && c.height + ' cm', c.weight && c.weight + ' kg', c.body].filter(Boolean).join(' · ')],
      ['角色', c.role], ['生日 / 年龄', birthdayLabel(c)], ['故乡', c.hometown], ['现居', c.residence],
      ['职业', c.occupation], ['认识', [c.channel || c.source, c.knownSince && fmtDay(c.knownSince)].filter(Boolean).join(' · ')]
    ]);
    const contacts = infoRows([['微信', c.wechat], ['电话', c.phone], ['邮箱', c.email], ['联系地址', c.address]]);
    return `<h3 class="sec-title">资料</h3>${facts || '<p class="hint">点右上角编辑，补充客户资料。</p>'}
      ${c.preferences?.length ? `<h3 class="sec-title">偏好</h3><div class="chips v6-tags">${tagList(c.preferences)}</div>` : ''}
      ${contacts ? `<h3 class="sec-title">联系方式</h3>${contacts}` : ''}
      ${c.notes ? `<h3 class="sec-title">备注</h3><p class="profile-notes">${esc(c.notes)}</p>` : ''}`;
  }

  const albumPhotos = (c) => (c.photos || []).filter((photo) => imageSrc(photo.src));

  function openAvatarPicker(id) {
    const c = Store.get(id);
    if (!c) return;
    const photos = albumPhotos(c);
    const dialog = $('#v6-dialog');
    dialog.innerHTML = `<div class="section-head"><h3>选择头像</h3><button class="link-btn" type="button" data-close>取消</button></div>
      ${photos.length ? `<div class="photo-grid">
        ${photos.map((photo, i) => `<button class="photo-tile" type="button" data-choice="${i}" aria-label="用第 ${i + 1} 张照片设置头像">
          ${photoImg(photo.src, '')}${c.avatarId === photo.id ? '<span class="current-avatar">当前头像</span>' : ''}
        </button>`).join('')}
      </div>` : '<p class="hint">相册还没有照片。</p><div class="pad"><button class="btn-lg" type="button" data-upload>前往相册上传</button></div>'}`;
    $('[data-close]', dialog).onclick = () => dialog.close();
    const upload = $('[data-upload]', dialog);
    if (upload) upload.onclick = () => { dialog.close(); detailUi.tab = '相册'; renderDetail(id); };
    $$('[data-choice]', dialog).forEach((button) => button.onclick = () => {
      const photo = photos[Number(button.dataset.choice)];
      editAvatar(dialog, photo, c.avatarId === photo.id ? c.avatarCrop : null, (crop) => {
        const latest = Store.get(id);
        if (!latest?.photos?.some((item) => item.id === photo.id && item.src === photo.src)) {
          dialog.close();
          renderDetail(id);
          toast('照片已删除或已更换');
          return;
        }
        if (saveChange(() => Store.upsert({ ...latest, avatarId: photo.id, avatarCrop: crop }))) {
          dialog.close();
          renderDetail(id);
          toast('头像已更新');
        }
      });
    });
    dialog.showModal();
  }

  function renderAlbum(c) {
    const photos = albumPhotos(c);
    return `<div class="section-head"><h3>相册 <small>${photos.length} 张</small></h3></div>
      <div class="photo-grid album-grid">
        ${photos.map((photo, i) => `<button class="photo-tile" type="button" data-photo="${i}" aria-label="查看第 ${i + 1} 张照片">
          <img src="${imageSrc(photo.src)}" alt="" draggable="false">
        </button>`).join('')}
        <label class="photo-add">＋ 上传照片<input type="file" accept="image/*" id="album-file" multiple></label>
      </div>
      <div class="album-trash" hidden><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 3v7m4-7v7"/></svg>拖到这里删除</div>
      <dialog id="photo-dialog" class="album-viewer" aria-label="浏览相册"></dialog>`;
  }

  function openAlbumViewer(photos, first) {
    const dialog = $('#photo-dialog');
    dialog.innerHTML = `<button class="album-close" type="button" aria-label="关闭照片浏览">×</button>
      <div class="album-slides" tabindex="0" aria-label="左右滑动浏览照片">
        ${photos.map((photo, i) => `<div class="album-slide">${photoImg(photo.src, `第 ${i + 1} 张照片`)}</div>`).join('')}
      </div>
      <div class="album-counter" aria-live="polite"></div>`;
    const track = $('.album-slides', dialog);
    const counter = $('.album-counter', dialog);
    const index = () => Math.round(track.scrollLeft / (track.clientWidth || 1));
    const showCount = () => { counter.textContent = `${index() + 1} / ${photos.length}`; };
    const closeButton = $('.album-close', dialog);
    closeButton.onclick = () => dialog.close();
    dialog.onclick = (event) => {
      if (event.target === dialog || event.target.classList.contains('album-slide')) dialog.close();
    };
    track.onscroll = showCount;
    dialog.onkeydown = (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      track.scrollTo({ left: (index() + (event.key === 'ArrowRight' ? 1 : -1)) * track.clientWidth, behavior: 'smooth' });
    };
    dialog.showModal();
    track.scrollLeft = first * track.clientWidth;
    showCount();
  }

  function changeAlbum(id, photoId, targetId) {
    const current = Store.get(id);
    if (!current) return;
    const photos = [...(current.photos || [])];
    const from = photos.findIndex((photo) => photo.id === photoId);
    if (from < 0 || photoId === targetId) return;
    const next = { ...current, photos };
    if (targetId === null) {
      if (!confirm('从相册及相关动态中删除这张照片？')) return;
      photos.splice(from, 1);
      if (current.avatarId === photoId) {
        next.avatarId = '';
        delete next.avatarCrop;
      }
      next.followUps = (current.followUps || []).map((record) => record.photoIds?.includes(photoId)
        ? { ...record, photoIds: record.photoIds.filter((item) => item !== photoId) } : record);
    } else {
      const to = photos.findIndex((photo) => photo.id === targetId);
      if (to < 0) return;
      const [photo] = photos.splice(from, 1);
      photos.splice(to, 0, photo);
    }
    if (saveChange(() => Store.upsert(next))) renderDetail(id);
  }

  function bindAlbumDrag(grid, photos, onDrop, onOpen) {
    const trash = $('.album-trash', view);
    let press;
    let ghost;
    let timer;
    let suppressClick = false;
    const tileOf = (element) => element?.closest('[data-photo]');
    const placeGhost = (x, y) => {
      ghost.style.left = x + 'px';
      ghost.style.top = y + 'px';
    };
    const hit = (x, y) => document.elementFromPoint(x, y);
    const reset = () => {
      clearTimeout(timer);
      press?.tile.classList.remove('album-origin');
      ghost?.remove();
      ghost = null;
      press = null;
      trash.hidden = true;
      trash.classList.remove('over');
      delete grid.dataset.dragging;
    };
    const start = (event, x, y) => {
      const tile = tileOf(event.target);
      if (!tile || press) return;
      suppressClick = false;
      press = { tile, x, y };
      timer = setTimeout(() => {
        if (!grid.isConnected) { reset(); return; }
        ghost = tile.querySelector('img').cloneNode();
        ghost.className = 'album-ghost';
        tile.classList.add('album-origin');
        grid.dataset.dragging = '';
        trash.hidden = false;
        placeGhost(x, y);
        document.body.append(ghost);
        if (event.pointerId !== undefined) tile.setPointerCapture(event.pointerId);
      }, 370);
    };
    const move = (event, x, y) => {
      if (!press) return;
      if (!ghost) {
        if (Math.hypot(x - press.x, y - press.y) > 9) reset();
        return;
      }
      if (event.cancelable) event.preventDefault();
      placeGhost(x, y);
      trash.classList.toggle('over', trash.contains(hit(x, y)));
    };
    const end = (event, x, y, cancelled = false) => {
      if (!press) return;
      const tile = press.tile;
      const dragged = Boolean(ghost);
      if (dragged) {
        suppressClick = true;
        if (event.cancelable) event.preventDefault();
      }
      const target = dragged && !cancelled ? hit(x, y) : null;
      const destination = target && trash.contains(target) ? null : tileOf(target);
      const deletion = target && trash.contains(target);
      reset();
      if (deletion || (destination && grid.contains(destination))) {
        onDrop(photos[Number(tile.dataset.photo)].id, deletion ? null : photos[Number(destination.dataset.photo)].id);
      }
    };
    grid.addEventListener('touchstart', (event) => {
      if (event.touches.length !== 1) { reset(); return; }
      const touch = event.changedTouches[0];
      start(event, touch.clientX, touch.clientY);
    }, { passive: true });
    grid.addEventListener('touchmove', (event) => {
      const touch = event.changedTouches[0];
      move(event, touch.clientX, touch.clientY);
    }, { passive: false });
    grid.addEventListener('touchend', (event) => {
      const touch = event.changedTouches[0];
      end(event, touch.clientX, touch.clientY);
    }, { passive: false });
    grid.ontouchcancel = reset;
    grid.onpointerdown = (event) => {
      if (event.pointerType === 'mouse' && event.button === 0) start(event, event.clientX, event.clientY);
    };
    grid.onpointermove = (event) => {
      if (event.pointerType === 'mouse') move(event, event.clientX, event.clientY);
    };
    grid.onpointerup = (event) => {
      if (event.pointerType === 'mouse') end(event, event.clientX, event.clientY);
    };
    grid.onpointercancel = reset;
    grid.onpointerleave = (event) => { if (event.pointerType === 'mouse' && !ghost) reset(); };
    grid.ondragstart = (event) => event.preventDefault();
    grid.oncontextmenu = (event) => { if (tileOf(event.target)) event.preventDefault(); };
    grid.onclick = (event) => {
      const tile = tileOf(event.target);
      if (!tile) return;
      if (!suppressClick || event.detail === 0) onOpen(Number(tile.dataset.photo));
      suppressClick = false;
    };
  }

  function bindAlbum(c) {
    bindPhotoPicker($('#album-file'), (photos) => {
      const current = Store.get(c.id);
      if (!current || !saveChange(() => Store.upsert({
        ...current, photos: [...(current.photos || []), ...photos]
      }))) return false;
      renderDetail(c.id);
      return true;
    });
    const photos = albumPhotos(c);
    bindAlbumDrag($('.album-grid', view), photos,
      (id, target) => changeAlbum(c.id, id, target), (first) => openAlbumViewer(photos, first));
  }

  function activityList(c, records, empty) {
    if (!records.length) return `<div class="empty">${empty}</div>`;
    const photos = new Map((c.photos || []).map((photo) => [photo.id, photo.src]));
    return records.map((f) => `<article class="fitem">
      <time class="activity-date" datetime="${esc(f.date)}">${esc(fmtDay(f.date))}</time>
      <div class="fbody">
        <div class="fhead"><b>${esc(f.type)}</b><span>${esc([f.time, f.place].filter(Boolean).join(' · '))}</span>
          <button data-del="${esc(f.id)}" aria-label="删除这条动态">删除</button></div>
        ${f.content ? `<p class="ftext">${esc(f.content)}</p>` : ''}
        ${f.photoIds?.length ? `<div class="activity-photos">${f.photoIds.map((id) => photos.get(id) ? photoImg(photos.get(id), '动态照片') : '').join('')}</div>` : ''}
      </div>
    </article>`).join('');
  }

  function interactionCalendar(c, records) {
    const month = detailUi.month;
    const start = new Date(month + '-01T00:00:00');
    const days = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    const offset = (start.getDay() + 6) % 7;
    const preferences = calendarSettings();
    const colors = PALETTES[preferences.palette] || PALETTES.green;
    const totals = new Map();
    for (const record of records) {
      const index = SCENES.indexOf(record.type);
      totals.set(record.date, (totals.get(record.date) || 0) + (preferences.weights[index] ?? 1));
    }
    const cells = Array.from({ length: days }, (_, index) => {
      const day = index + 1;
      const iso = month + '-' + String(day).padStart(2, '0');
      const score = totals.get(iso) || 0;
      const level = preferences.thresholds.filter((minimum) => score >= minimum).length;
      return `<button data-day="${iso}" aria-label="${iso}，活跃度 ${score}" aria-pressed="${detailUi.day === iso}"
        class="calendar-day ${iso === today() ? 'calendar-today' : ''}" style="background:${colors[level]};color:${level >= 3 ? '#fff' : '#242424'}">${day}</button>`;
    });
    const selected = detailUi.day;
    return `<div class="section-head"><h3>互动日历</h3><button type="button" class="link-btn" data-manage="calendar">场景与颜色</button></div>
      <div class="calendar-nav">
        <button class="btn small" data-month="-1" aria-label="上一月">‹</button>
        <strong>${start.getFullYear()}年${start.getMonth() + 1}月</strong>
        <button class="btn small" data-month="1" aria-label="下一月">›</button>
      </div>
      <div class="calendar-grid">
        ${['一', '二', '三', '四', '五', '六', '日'].map((d) => `<span>${d}</span>`).join('')}
        ${'<span aria-hidden="true"></span>'.repeat(offset)}${cells.join('')}
      </div>
      <div class="calendar-legend">互动少 ${colors.map((color) => `<i style="background:${color}"></i>`).join('')} 互动多</div>
      <div class="section-head"><h3>${esc(fmtDay(selected))}</h3></div>
      ${activityList(c, records.filter((f) => f.date === selected), '当天没有互动记录')}`;
  }

  function openSceneSettings(onSave = () => {}) {
    const prefs = calendarSettings();
    const dialog = $('#v6-dialog');
    dialog.innerHTML = `<form id="sceneForm">
      <div class="section-head"><h3>场景与日历颜色</h3><button class="link-btn" type="button" data-close>取消</button></div>
      <h4 class="sec-title">场景与权重</h4>
      ${SCENES.map((scene, i) => `<label class="setting-row">${scene}<input type="number" name="weight" min="1" max="20" required value="${esc(prefs.weights[i])}"></label>`).join('')}
      <h4 class="sec-title">日历颜色</h4>
      <label class="setting-row">色板<select name="palette"><option value="green">墨绿</option><option value="clay">红土橙</option></select></label>
      ${['少量', '一般', '频繁', '密集'].map((level, i) => `<label class="setting-row">${level}<i data-swatch="${i}"></i><input type="number" name="threshold" min="1" max="100" required value="${esc(prefs.thresholds[i])}"></label>`).join('')}
      <div class="pad"><button class="btn-lg">保存</button></div>
    </form>`;
    const form = $('#sceneForm', dialog);
    const palette = form.elements.palette;
    palette.value = prefs.palette in PALETTES ? prefs.palette : 'green';
    const paint = () => $$('[data-swatch]', dialog).forEach((swatch, i) => { swatch.style.background = PALETTES[palette.value][i + 1]; });
    palette.onchange = paint;
    paint();
    $('[data-close]', dialog).onclick = () => dialog.close();
    form.onsubmit = (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const thresholds = data.getAll('threshold').map(Number);
      if (thresholds.some((t, i) => i && t <= thresholds[i - 1])) { toast('颜色分级的阈值必须依次增大'); return; }
      const settings = { weights: data.getAll('weight').map(Number), thresholds, palette: palette.value };
      if (saveChange(() => { Store.updateSettings('calendar', settings); return true; })) {
        dialog.close();
        onSave();
      }
    };
    dialog.showModal();
  }

  const detailUi = { id: null, tab: '资料', day: today(), month: dateMonth(today()), filter: '全部' };

  function renderDetail(id) {
    const c = Store.get(id);
    if (!c) { location.replace('#/'); return; }
    setTab(null);
    headerSub({ title: c.name, left: backBtn('#/', '返回商机'), right: `<a class="text-btn" href="#/edit/${c.id}">编辑</a>` });

    const tel = telOf(c);
    const d = dueInfo(c);
    const fus = c.followUps || [];
    if (detailUi.id !== id) Object.assign(detailUi, {
      id, tab: '资料', day: today(), month: dateMonth(today()), filter: '全部'
    });
    const since = c.knownSince || c.createdAt?.slice(0, 10);
    const known = since ? Math.max(0, daysBetween(since, today())) : 0;
    const filters = [...new Set(['全部', ...SCENES, ...fus.map((f) => f.type).filter(Boolean)])];
    const feed = detailUi.filter === '全部' ? fus : fus.filter((f) => f.type === detailUi.filter);
    const panels = {
      资料: () => renderProfileInfo(c),
      相册: () => renderAlbum(c),
      日历: () => interactionCalendar(c, fus),
      动态: () => `<div class="section-head"><h3>动态 <small>${fus.length} 条</small></h3></div>
        <div class="chips v6-tags">${filters.map((filter) => `<button class="chip ${detailUi.filter === filter ? 'on' : ''}" data-filter="${esc(filter)}">${esc(filter)}</button>`).join('')}</div>
        ${activityList(c, feed, '没有相关动态，点“写动态”添加记录')}`
    };

    view.innerHTML = `
      <section class="profile">
        <div class="profile-top">
          <button class="profile-avatar" data-act="avatar" aria-label="更换头像">${ringAvatar(90, d.kind === 'late' ? 'late' : d.kind === 'today' ? '' : 'none', c)}</button>
          <div class="stats">
            <div><b>${fus.length}</b><span>动态</span></div>
            <div><b>${known} 天</b><span>认识</span></div>
            <div><b>${esc(c.level || '—')}</b><span>等级</span></div>
          </div>
        </div>
        <h2 class="pname">${esc(c.name)}</h2>
        ${c.company || c.title ? `<div class="psub">${esc([c.company, c.title].filter(Boolean).join(' · '))}</div>` : ''}
        ${(c.tags || []).length ? `<div class="ptags">${c.tags.map((t) => '#' + esc(t)).join(' ')}</div>` : ''}
        <div class="pline">
          ${c.status ? `<span class="status"><span class="dot s-${esc(statusOf(c.status))}"></span>${esc(statusOf(c.status))}</span>` : ''}
          ${d.kind === 'late' ? `<span class="late">${esc(d.label)}未跟进</span>` : d.label ? `<span class="muted">${esc(d.label)}</span>` : ''}
        </div>
        <div class="btn-row">
          <a class="btn primary" href="#/c/${c.id}/follow">写动态</a>
          <a class="btn ${tel ? '' : 'disabled'}" href="tel:${esc(tel)}">电话</a>
          <button class="btn ${c.wechat ? '' : 'disabled'}" data-act="wechat">复制微信</button>
          <a class="btn icon ${c.email ? '' : 'disabled'}" href="mailto:${esc(c.email || '')}" aria-label="发邮件">${ICON.mail}</a>
        </div>
      </section>
      <div class="seg" role="tablist">
        ${Object.keys(panels).map((t) => `<button class="${detailUi.tab === t ? 'on' : ''}" data-tab="${t}" role="tab" aria-selected="${detailUi.tab === t}">${t}</button>`).join('')}
      </div>
      <section>${panels[detailUi.tab]()}</section><dialog id="v6-dialog"></dialog>`;

    $$('.seg button', view).forEach((button) => button.onclick = () => { detailUi.tab = button.dataset.tab; renderDetail(id); });
    $('[data-act="avatar"]', view).onclick = () => openAvatarPicker(id);
    if (detailUi.tab === '相册') bindAlbum(c);
    $$('[data-filter]', view).forEach((button) => button.onclick = () => {
      detailUi.filter = button.dataset.filter;
      renderDetail(id);
    });
    $$('[data-day]', view).forEach((button) => button.onclick = () => {
      detailUi.day = button.dataset.day;
      renderDetail(id);
    });
    $$('[data-month]', view).forEach((button) => button.onclick = () => {
      const date = new Date(detailUi.month + '-01T00:00:00');
      date.setMonth(date.getMonth() + Number(button.dataset.month));
      detailUi.month = dateMonth(ymd(date));
      detailUi.day = detailUi.month === dateMonth(today()) ? today() : ymd(date);
      renderDetail(id);
    });
    const manage = $('[data-manage="calendar"]', view);
    if (manage) manage.onclick = () => openSceneSettings(() => renderDetail(id));
    const wx = $('[data-act="wechat"]', view);
    wx.onclick = async () => {
      try { await navigator.clipboard.writeText(c.wechat); toast('微信号已复制'); } catch { toast(c.wechat); }
    };
    $$('[data-del]', view).forEach((b) => b.onclick = () => {
      if (confirm('删除这条动态？')) saveChange(() => Store.removeFollowUp(id, b.dataset.del));
    });
  }

  // ---------- 写跟进 ----------
  function renderCompose(id) {
    const c = Store.get(id);
    if (!c) { location.replace('#/'); return; }
    setTab(null);
    headerSub({
      title: '写动态',
      left: `<a class="text-btn" href="#/c/${c.id}">取消</a>`,
      right: '<button class="text-btn strong" data-act="publish">发布</button>'
    });

    const st = {
      type: SCENES[1],
      next: '3天后',
      status: statusOf(c.status) || '线索'
    };
    const photos = [];
    const nextDate = (label) => { const o = NEXT_OPTIONS.find(([l]) => l === label); return o && o[1] != null ? addDays(today(), o[1]) : ''; };

    view.innerHTML = `
      <div class="compose-head">
        ${avatar(40, c)}
        <label style="flex:1">
          <span class="who">${esc(c.name)}${c.company ? ' · ' + esc(c.company) : ''}</span>
          <textarea id="fuText" placeholder="记录这次互动…"></textarea>
        </label>
      </div>
      <div class="compose-photos"><div id="compose-preview"></div><label class="photo-add">＋ 照片<input id="compose-file" type="file" accept="image/*" multiple></label></div>
      <div class="csec">
        <div class="csec-title">场景<button type="button" class="link-btn" data-manage="calendar">管理场景</button></div>
        <div class="chips" data-group="type">${SCENES.map((t) => `<button class="chip ${st.type === t ? 'on' : ''}" data-v="${t}">${t}</button>`).join('')}</div>
      </div>
      <div class="csec">
        <div class="csec-title">时间</div>
        <div class="compose-date"><input id="event-date" type="date" aria-label="互动日期" value="${today()}"><input id="event-time" type="time" aria-label="互动时间" value="${localTime()}"></div>
      </div>
      <div class="csec">
        <div class="csec-title"><label for="event-place">地点</label></div>
        <input class="v6-input" id="event-place" placeholder="输入地点">
        <div class="chips">${['微信', '我家', '他家', '健身房'].map((place) => `<button class="chip" data-place="${place}">${place}</button>`).join('')}</div>
      </div>
      <div class="csec">
        <div class="csec-title"><span>下次联系</span><input type="date" id="nextDate" aria-label="下次跟进日期" value="${nextDate(st.next)}"></div>
        <div class="chips" data-group="next">${NEXT_OPTIONS.map(([l]) => `<button class="chip ${st.next === l ? 'on' : ''}" data-v="${l}">${l}</button>`).join('')}</div>
      </div>
      <div class="csec">
        <div class="csec-title">客户状态</div>
        <div class="chips" data-group="status">${STATUSES.map((s) => `<button class="chip ${st.status === s ? 'on' : ''}" data-v="${s}">${s}</button>`).join('')}</div>
      </div>
      <div class="pad"><button class="btn-lg" data-act="publish">发布动态</button></div><dialog id="v6-dialog"></dialog>`;

    $$('[data-group]', view).forEach((g) => {
      $$('.chip', g).forEach((b) => b.onclick = () => {
        $$('.chip', g).forEach((x) => x.classList.toggle('on', x === b));
        st[g.dataset.group] = b.dataset.v;
        if (g.dataset.group === 'next') $('#nextDate').value = nextDate(b.dataset.v);
      });
    });
    $('#nextDate').onchange = () => {
      st.next = '';
      $$('[data-group="next"] .chip', view).forEach((x) => x.classList.remove('on'));
    };

    $('[data-manage="calendar"]', view).onclick = () => openSceneSettings();
    $$('[data-place]', view).forEach((button) => button.onclick = () => { $('#event-place').value = button.dataset.place; });
    const preview = $('#compose-preview');
    const drawPhotos = () => {
      preview.innerHTML = photos.map((photo, i) => `<span class="draft-photo">${photoImg(photo.src, '')}
        <button data-remove-photo="${i}" aria-label="移除照片">×</button></span>`).join('');
      $$('[data-remove-photo]', preview).forEach((button) => button.onclick = () => {
        photos.splice(Number(button.dataset.removePhoto), 1);
        drawPhotos();
      });
    };
    const input = $('#compose-file');
    bindPhotoPicker(input, (batch) => {
      photos.push(...batch);
      drawPhotos();
      return true;
    });
    const publish = () => {
      if (input.disabled) { toast('照片正在处理中'); return; }
      const content = $('#fuText').value.trim();
      const date = $('#event-date').value;
      if (!date) { toast('请选择互动日期'); $('#event-date').focus(); return; }
      const cur = Store.get(id);
      if (!cur) { toast('客户已删除'); location.replace('#/'); return; }
      const place = $('#event-place').value.trim();
      if (!content && !place && !photos.length) { toast('请填写内容或地点，或添加照片'); return; }
      const saved = saveChange(() => Store.addFollowUp(id, {
        date, time: $('#event-time').value, place,
        type: st.type, content, photoIds: photos.map((photo) => photo.id)
      }, {
        nextFollowUp: $('#nextDate').value,
        status: st.status,
        photos: [...(cur.photos || []), ...photos]
      }));
      if (!saved) return;
      toast('已发布');
      Object.assign(detailUi, { id, tab: '动态', filter: '全部' });
      location.replace(`#/c/${id}`);
    };
    $$('[data-act="publish"]').forEach((b) => b.onclick = publish);
  }

  const channels = () => Store.settings('channels') || DEFAULT_CHANNELS;

  function openChannels(onChange) {
    const dialog = $('#v6-dialog');
    function draw(kind) {
      const list = channels();
      dialog.innerHTML = `<div class="section-head"><h3>认识渠道</h3><button class="link-btn" data-close>完成</button></div>
        <form id="channel-form" class="channel-add">
          <input class="v6-input" name="channel" aria-label="新渠道名称" maxlength="40" required placeholder="新渠道名称">
          <select name="kind" aria-label="渠道类型"><option>线上</option><option>线下</option></select>
          <button class="btn primary">添加</button>
        </form>
        ${['线上', '线下'].map((group) => `<h4 class="sec-title">${group}</h4>
          ${list.map((item, i) => item.kind !== group ? '' : `<div class="setting-row">
            <span class="channel-name">${esc(item.name)}</span>
            <small>${Store.all().filter((customer) => customer.channel === item.name).length} 人</small>
            <button class="link-btn" data-index="${i}" data-direction="-1" aria-label="上移 ${esc(item.name)}">↑</button>
            <button class="link-btn" data-index="${i}" data-direction="1" aria-label="下移 ${esc(item.name)}">↓</button>
            <button class="link-btn remove-link" data-index="${i}" aria-label="删除 ${esc(item.name)}">删除</button>
          </div>`).join('')}`).join('')}`;
      $('[data-close]', dialog).onclick = () => dialog.close();
      const form = $('#channel-form', dialog);
      form.elements.kind.value = kind;
      const saveList = (next, removed) => {
        if (!saveChange(() => { Store.updateSettings('channels', next, removed); return true; })) return;
        onChange(removed);
        draw(form.elements.kind.value);
      };
      form.onsubmit = (event) => {
        event.preventDefault();
        const name = form.elements.channel.value.trim();
        if (!name || list.some((item) => item.name === name)) { toast('请输入新的渠道名称'); return; }
        saveList([...list, { name, kind: form.elements.kind.value }]);
      };
      $$('[data-index]', dialog).forEach((button) => button.onclick = () => {
        const index = Number(button.dataset.index);
        const item = list[index];
        const direction = Number(button.dataset.direction);
        if (!direction) {
          if (confirm(`删除渠道“${item.name}”？关联客户会保留，认识渠道将清空。`)) {
            saveList(list.filter((_, i) => i !== index), item.name);
          }
          return;
        }
        const indices = list.map((entry, i) => entry.kind === item.kind ? i : -1).filter((i) => i >= 0);
        const other = indices[indices.indexOf(index) + direction];
        if (other === undefined) return;
        const next = [...list];
        [next[index], next[other]] = [next[other], next[index]];
        saveList(next);
      });
    }
    draw('线上');
    dialog.showModal();
  }

  // ---------- 新增 / 编辑客户 ----------
  function renderEdit(id) {
    const isNew = !id;
    const c = isNew ? { status: '线索', level: 'B', tags: [] } : Store.get(id);
    if (!c) { location.replace('#/'); return; }
    setTab(null);
    headerSub({
      title: isNew ? '新增客户' : '编辑资料',
      left: `<a class="text-btn" href="${isNew ? '#/' : '#/c/' + c.id}">取消</a>`,
      right: '<button class="text-btn strong" data-act="save">保存</button>'
    });

    const input = (name, label, type = 'text', ph = '') => `<div class="field"><label for="f-${name}">${label}</label>
      <input id="f-${name}" name="${name}" type="${type}" value="${esc(c[name] || '')}" placeholder="${ph}"
      ${type === 'tel' ? 'inputmode="tel"' : ''} ${type === 'email' ? 'inputmode="email" autocapitalize="off"' : ''}></div>`;
    const chips = (name, label, opts, chosen = c[name]) => `<div class="field"><span class="lbl">${label}</span>
      <div class="chips" data-field="${name}">${opts.map((o) => `<button type="button" class="chip ${chosen === o ? 'on' : ''}" data-v="${o}">${o}</button>`).join('')}</div></div>`;

    view.innerHTML = `
      <form id="editForm">
        <div class="sec-title">基本</div>
        <div class="field"><label for="f-name">称呼</label><input id="f-name" name="name" required value="${esc(c.name || '')}" placeholder="必填"></div>
        ${input('birthday', '生日', 'date')}
        ${input('age', '年龄（岁）', 'number')}
        <p class="hint" id="birthday-info">填写生日可自动计算年龄和星座。</p>
        <div class="sec-title">身材</div>
        ${input('height', '身高 cm', 'number')}
        ${input('weight', '体重 kg', 'number')}
        ${chips('body', '体型', ['偏瘦', '匀称', '健身', '壮', '微胖', '熊'])}
        ${chips('role', '角色', ['1', '0', '0.5', '偏1', '偏0', 'Side'])}
        <div class="sec-title">来历</div>
        ${input('hometown', '故乡')}
        ${input('residence', '现居')}
        ${input('occupation', '职业')}
        ${input('company', '公司')}
        ${input('title', '职位')}
        <div class="sec-title">认识</div>
        ${input('knownSince', '认识日期', 'date')}
        <div class="field"><label for="f-channel">渠道</label><select id="f-channel" name="channel"></select>
          <button class="link-btn" type="button" id="manage-channels">＋ 管理</button></div>
        ${chips('status', '状态', STATUSES, statusOf(c.status))}
        ${chips('level', '等级', LEVELS)}
        <div class="sec-title">联系方式</div>
        ${input('phone', '电话', 'tel')}
        ${input('wechat', '微信')}
        ${input('email', '邮箱', 'email')}
        ${input('address', '地址')}
        <div class="sec-title">分类</div>
        <div class="field"><label for="f-tags">标签</label><input id="f-tags" name="tags" value="${esc((c.tags || []).join('，'))}" placeholder="用逗号分隔"></div>
        <div class="field"><label for="f-next">下次跟进</label><input id="f-next" name="nextFollowUp" type="date" value="${esc(c.nextFollowUp || '')}"></div>
        <div class="sec-title">偏好</div>
        <div class="field"><label for="f-preferences">偏好</label><input id="f-preferences" name="preferences" value="${esc((c.preferences || []).join('，'))}" placeholder="用逗号分隔"></div>
        <div class="sec-title">备注</div>
        <div class="field top"><label for="f-notes">备注</label><textarea id="f-notes" name="notes" placeholder="客户背景、需求、偏好…">${esc(c.notes || '')}</textarea></div>
        <div class="pad"><button class="btn-lg" type="submit">保存</button></div>
        ${isNew ? '' : '<div class="pad"><button class="btn-lg danger" type="button" id="delBtn">删除客户</button></div>'}
      </form><dialog id="v6-dialog"></dialog>`;

    const picked = { status: statusOf(c.status), level: c.level || '', body: c.body || '', role: c.role || '' };
    const channel = $('#f-channel');
    const fillChannels = (selected) => {
      const names = [...new Set([...channels().map((item) => item.name), selected].filter(Boolean))];
      channel.replaceChildren(new Option('未设置', ''), ...names.map((name) => new Option(name, name)));
      channel.value = selected;
    };
    fillChannels(c.channel || c.source || '');
    $('#manage-channels').onclick = () => openChannels((removed) => {
      fillChannels(channel.value === removed ? '' : channel.value);
    });
    const birthday = $('#f-birthday');
    birthday.max = today();
    $('#f-knownSince').max = today();
    for (const key of ['age', 'height', 'weight']) {
      const number = $('#f-' + key);
      number.min = key === 'age' ? '0' : '1';
      number.step = key === 'age' ? '1' : '0.1';
    }
    const updateBirthday = () => {
      $('#birthday-info').textContent = birthday.value ? birthdayLabel({ birthday: birthday.value }) : '填写生日可自动计算年龄和星座。';
    };
    birthday.onchange = updateBirthday;
    updateBirthday();
    $$('[data-field]', view).forEach((g) => {
      $$('.chip', g).forEach((b) => b.onclick = () => {
        const on = !b.classList.contains('on');
        $$('.chip', g).forEach((x) => x.classList.remove('on'));
        b.classList.toggle('on', on);
        picked[g.dataset.field] = on ? b.dataset.v : '';
      });
    });

    const form = $('#editForm');
    form.onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      if (!name) { toast('请填写姓名'); return; }
      const current = isNew ? c : Store.get(id);
      if (!current) { toast('客户已删除'); location.replace('#/'); return; }
      const next = { ...current };
      for (const k of ['company', 'title', 'phone', 'wechat', 'email', 'address', 'nextFollowUp', 'notes', 'birthday', 'age', 'height', 'weight', 'hometown', 'residence', 'occupation', 'knownSince', 'channel']) {
        next[k] = String(fd.get(k) || '').trim();
      }
      next.name = name;
      next.status = picked.status;
      next.level = picked.level;
      next.body = picked.body;
      next.role = picked.role;
      next.source = next.channel;
      next.preferences = [...new Set(String(fd.get('preferences') || '').split(/[,，、]+/).map((value) => value.trim()).filter(Boolean))];
      next.tags = String(fd.get('tags') || '').split(/[,，、\s#]+/).map((s) => s.trim()).filter(Boolean);
      const saved = saveChange(() => Store.upsert(next));
      if (!saved) return;
      toast('已保存');
      location.replace(`#/c/${saved.id}`);
    };
    $$('[data-act="save"]').forEach((b) => b.onclick = () => form.requestSubmit());
    const del = $('#delBtn');
    if (del) del.onclick = () => {
      if (confirm(`确定删除客户“${c.name}”及其全部跟进记录？`)) {
        if (!saveChange(() => { Store.remove(id); return true; })) return;
        toast('已删除');
        location.replace('#/');
      }
    };
  }

  // ---------- 转化（待设计） ----------
  function renderConvert() {
    setTab('convert');
    headerTab('转化');
    view.innerHTML = `<div class="empty" style="padding-top:120px">
      <div class="circle">${ICON.trend}</div>
      <h2>转化页面待设计</h2>
      <div>这里预留给转化功能，内容将在后续版本中设计。</div>
    </div>`;
  }

  // ---------- 我的 ----------
  const meUi = { showInstall: false };

  function renderMe() {
    setTab('me');
    headerTab('我的', `<a class="icon-btn" href="#/settings" aria-label="设置">${ICON.menu}</a>`);
    const all = Store.all();
    const month = today().slice(0, 7);
    const monthFollow = all.reduce((n, c) => n + (c.followUps || []).filter((f) => (f.date || '').startsWith(month)).length, 0);
    const won = all.filter((c) => statusOf(c.status) === '成交').length;
    const user = Auth.user();
    const signedIn = Auth.hasSession() && !Auth.needsRelogin();
    const s = Store.status();
    const m = Store.meta();
    const syncText = signedIn
      ? `OneDrive ${s.state === 'ok' ? '已同步' : (s.message || '同步中')}${m.lastSync ? ' · ' + new Date(m.lastSync).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}`
      : (Auth.hasSession() ? '登录已过期，数据暂存在本机' : '未登录，数据暂存在本机');

    view.innerHTML = `
      ${isStandalone() ? banner() : ''}
      <section class="profile">
        <div class="profile-top">
          ${ringAvatar(90, signedIn ? '' : 'none')}
          <div class="stats">
            <div><b>${all.length}</b><span>客户</span></div>
            <div><b>${monthFollow}</b><span>本月跟进</span></div>
            <div><b>${won}</b><span>已成交</span></div>
          </div>
        </div>
        <h2 class="pname">${esc(user && user.name ? user.name : (signedIn ? '我' : '未登录'))}</h2>
        ${user && user.email ? `<div class="psub" style="color:var(--muted)">${esc(user.email)}</div>` : ''}
        <div class="pline"><span class="status"><span class="dot ${signedIn && s.state === 'ok' ? 's-跟进中' : ''}"></span>${esc(syncText)}</span></div>
        <div class="btn-row">
          <a class="btn" href="#/settings">设置</a>
          ${signedIn ? '<button class="btn" data-act="sync">立即同步</button>' : (Auth.configured() ? '<button class="btn primary" data-act="login">登录微软账号</button>' : '')}
        </div>
      </section>
      <div style="border-top:1px solid var(--line)">
        <button class="mrow" data-act="install">${ICON.phoneDevice}<span class="grow">添加到主屏幕</span>${ICON.chev}</button>
        ${meUi.showInstall ? `<p class="hint-box">在 Safari 中打开本页 → 点“分享” → “添加到主屏幕”。如果出现“作为网页 App 打开”开关，请<b>关闭</b>它，图标会直接在 Safari 中打开，这样微软登录才能保持。</p>` : ''}
        <button class="mrow" data-act="about">${ICON.info}<span class="grow">关于</span><span class="side">版本 ${APP_VERSION}</span>${ICON.chev}</button>
      </div>`;

    $('[data-act="install"]', view).onclick = () => { meUi.showInstall = !meUi.showInstall; renderMe(); };
    $('[data-act="about"]', view).onclick = () => toast(`客户管理 · 版本 ${APP_VERSION} · 数据保存在你的 OneDrive`, 3000);
  }

  // ---------- 设置 ----------
  function renderSettings() {
    setTab(null);
    headerSub({ title: '设置', left: backBtn('#/me', '返回我的') });
    const s = Store.status();
    const m = Store.meta();
    const user = Auth.user();
    const configured = Auth.configured();
    const signedIn = Auth.hasSession();
    const relogin = Auth.needsRelogin() || s.state === 'relogin';

    let rows;
    if (!configured) rows = [['状态', '尚未配置微软应用 clientId（见 README 第 2 步），数据暂存在本机']];
    else if (!signedIn) rows = [['状态', '未登录，登录后数据会自动同步到 OneDrive']];
    else rows = [
      ['账号', user ? [user.name, user.email].filter(Boolean).join(' ') : '已登录'],
      ['状态', relogin ? '登录已过期，请重新登录' : (s.message || '—')],
      ['上次同步', m.lastSync ? new Date(m.lastSync).toLocaleString('zh-CN') : '从未'],
      ['待上传', m.dirty ? '有本地修改未同步' : '无'],
      ['存储位置', `OneDrive › 应用 › 客户管理 › ${CRM_CONFIG.fileName}`]
    ];

    view.innerHTML = `
      <div class="sec-title">OneDrive 同步</div>
      ${rows.map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v">${esc(v)}</span></div>`).join('')}
      <div class="pad">
        ${configured && (!signedIn || relogin) ? '<button class="btn-lg" data-act="login">登录微软账号</button>' : ''}
        ${signedIn && !relogin ? '<button class="btn-lg" data-act="sync">立即同步</button>' : ''}
      </div>

      <div class="sec-title">备用</div>
      <button class="mrow" data-act="export">${ICON.download}<span class="grow">导出备份文件</span></button>
      <button class="mrow" data-act="import">${ICON.upload}<span class="grow">从备份文件导入（合并）</span></button>
      <p class="hint">每天首次同步时，会在 OneDrive 的 backups 文件夹自动保存一份当日备份。万一无法登录时，可用导出 / 导入。导入采用合并方式，不会删除已有客户。</p>

      ${signedIn ? '<div class="pad" style="padding-top:28px"><button class="btn-lg danger" data-act="logout">退出登录</button></div>' : ''}`;

    const lo = $('[data-act="logout"]', view);
    if (lo) lo.onclick = () => {
      if (!confirm('退出登录？')) return;
      Auth.logout();
      if (confirm('是否同时清除本机上的客户数据？\n（OneDrive 上的数据不受影响）')) Store.resetLocal();
      toast('已退出');
      render();
    };
    $('[data-act="import"]', view).onclick = restoreFromFile;
  }

  // ---------- 全局按钮（顶部栏 / 横幅） ----------
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    if (act === 'sync') {
      if (Auth.hasSession() && !Auth.needsRelogin()) { Store.sync(); toast('正在同步…', 1200); }
      else if (Auth.configured()) location.hash = '#/settings';
    } else if (act === 'login') doLogin();
    else if (act === 'export') exportToFile();
  });

  // ---------- 路由 ----------
  function render() {
    const h = location.hash.replace(/^#/, '') || '/';
    let m;
    if (h === '/' || h === '' || h === '/todo') renderList();
    else if (h === '/convert') renderConvert();
    else if (h === '/me') renderMe();
    else if (h === '/settings') renderSettings();
    else if (h === '/new') renderEdit(null);
    else if ((m = h.match(/^\/c\/([^/]+)\/follow$/))) renderCompose(m[1]);
    else if ((m = h.match(/^\/c\/([^/]+)$/))) renderDetail(m[1]);
    else if ((m = h.match(/^\/edit\/(.+)$/))) renderEdit(m[1]);
    else renderList();
    updateBadge();
  }

  window.addEventListener('hashchange', () => {
    $('.album-ghost')?.remove();
    render();
    window.scrollTo(0, 0);
  });

  const isEditing = () =>
    activePhotoPicker?.isConnected || $('.album-grid[data-dragging]') || $('dialog[open]') || /^#\/(new|edit\/|c\/[^/]+\/follow)/.test(location.hash) ||
    (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && document.activeElement.id !== 'q');

  // 数据变化时：编辑中不重绘，避免打断输入
  Store.subscribe(() => {
    updateBadge();
    const sync = $('.topbar .sync');
    if (sync) sync.outerHTML = syncButton();
    if (isEditing()) return;
    if (document.activeElement && document.activeElement.id === 'q') { renderPosts(); return; }
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
  });

  // 令牌过期时自动续登录（跳转到微软后立即跳回，无需输入）
  async function ensureSession() {
    if (!Auth.configured() || !Auth.hasSession() || !navigator.onLine) return false;
    if (await Auth.getToken()) return false;
    if (isEditing()) return false;
    return Auth.trySilent();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') ensureSession();
  });

  async function start() {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    let returned = false;
    try {
      if (await Auth.handleRedirect()) {
        returned = true;
        if (!Auth.lastWasSilent()) toast('登录成功，正在同步…');
      }
    } catch (e) {
      toast(e.message, 4000);
    }
    if (Auth.silentFailed()) toast('登录已过期，请在“我的”中重新登录', 4000);
    if (!returned && !Auth.silentFailed() && (await ensureSession())) return;
    render();
    Store.sync();
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW', e));
  }
  start();
})();
