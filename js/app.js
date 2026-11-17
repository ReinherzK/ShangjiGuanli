(() => {
  const APP_VERSION = '7';
  const STATUSES = ['潜在', '跟进中', '已成交', '已流失'];
  const LEVELS = ['A', 'B', 'C'];
  const FU_TYPES = ['电话', '微信', '拜访', '邮件', '其他'];
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
  const avatar = (size) => `<span class="avatar" style="width:${size}px;height:${size}px">${DEFAULT_AVATAR}</span>`;
  // 带圆环的头像：late=逾期(红土橙)，today=今天(绿)，其他=灰
  const ringAvatar = (size, kind) => {
    const inner = size - 6;
    return `<span class="ring ${kind}" style="width:${size}px;height:${size}px"><span>${avatar(inner - 4)}</span></span>`;
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
    if (!c.nextFollowUp || c.status === '已流失') return { kind: 'none', label: '' };
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
    all.forEach((c) => { counts[c.status] = (counts[c.status] || 0) + 1; });

    view.innerHTML = `
      ${banner()}
      ${due.length ? `<div class="stories" aria-label="待跟进">
        ${due.map((c) => {
          const d = dueInfo(c);
          return `<a class="story" href="#/c/${c.id}">
            ${ringAvatar(64, d.kind === 'late' ? 'late' : '')}
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
    if (ui.status !== '全部') list = list.filter((c) => c.status === ui.status);
    if (q) {
      list = list.filter((c) =>
        [c.name, c.company, c.title, c.phone, c.wechat, c.email, c.address, c.source, c.notes, (c.tags || []).join(' '),
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
      const text = f ? f.content : (c.notes || '还没有跟进记录');
      const meta = f ? `${f.type} · ${fmtDay(f.date)}` : `创建于 ${fmtDay((c.createdAt || '').slice(0, 10))}`;
      return `<article class="post">
        <a class="post-head" href="#/c/${c.id}">
          ${avatar(40)}
          <span class="who"><span class="nm">${esc(c.name)}</span><span class="co">${esc([c.company, c.title].filter(Boolean).join(' · ') || c.phone || '')}</span></span>
          ${c.status ? `<span class="status"><span class="dot s-${esc(c.status)}"></span>${esc(c.status)}</span>` : ''}
        </a>
        <p class="post-text ${f || c.notes ? '' : 'placeholder'}">${esc(text)}</p>
        <div class="post-meta">${esc(meta)}</div>
        <div class="post-actions">
          <a class="act ${tel ? '' : 'disabled'}" href="tel:${esc(tel)}" aria-label="打电话">${ICON.phone}</a>
          <a class="act ${tel ? '' : 'disabled'}" href="sms:${esc(tel)}" aria-label="发短信">${ICON.message}</a>
          <a class="act" href="#/c/${c.id}/follow" aria-label="写跟进">${ICON.pen}</a>
          ${d.label ? `<span class="next ${d.kind}">${esc(d.label)}</span>` : ''}
        </div>
      </article>`;
    }).join('');
  }

  // ---------- 客户详情 ----------
  const detailUi = { tab: '动态' };

  function renderDetail(id) {
    const c = Store.get(id);
    if (!c) { location.replace('#/'); return; }
    setTab(null);
    headerSub({ title: c.name, left: backBtn('#/', '返回商机'), right: `<a class="text-btn" href="#/edit/${c.id}">编辑</a>` });

    const tel = telOf(c);
    const d = dueInfo(c);
    const fus = c.followUps || [];
    const known = c.createdAt ? Math.max(0, daysBetween(c.createdAt.slice(0, 10), today())) : 0;
    const info = [
      ['电话', c.phone], ['微信', c.wechat], ['邮箱', c.email], ['地址', c.address],
      ['来源', c.source], ['备注', c.notes], ['创建于', fmtDay((c.createdAt || '').slice(0, 10))]
    ].filter(([, v]) => v);

    view.innerHTML = `
      <section class="profile">
        <div class="profile-top">
          ${ringAvatar(90, d.kind === 'late' ? 'late' : d.kind === 'today' ? '' : 'none')}
          <div class="stats">
            <div><b>${fus.length}</b><span>跟进</span></div>
            <div><b>${known} 天</b><span>认识</span></div>
            <div><b>${esc(c.level || '—')}</b><span>等级</span></div>
          </div>
        </div>
        <h2 class="pname">${esc(c.name)}</h2>
        ${c.company || c.title ? `<div class="psub">${esc([c.company, c.title].filter(Boolean).join(' · '))}</div>` : ''}
        ${(c.tags || []).length ? `<div class="ptags">${c.tags.map((t) => '#' + esc(t)).join(' ')}</div>` : ''}
        <div class="pline">
          ${c.status ? `<span class="status"><span class="dot s-${esc(c.status)}"></span>${esc(c.status)}</span>` : ''}
          ${d.kind === 'late' ? `<span class="late">${esc(d.label)}未跟进</span>` : d.label ? `<span class="muted">${esc(d.label)}</span>` : ''}
        </div>
        <div class="btn-row">
          <a class="btn primary" href="#/c/${c.id}/follow">写跟进</a>
          <a class="btn ${tel ? '' : 'disabled'}" href="tel:${esc(tel)}">电话</a>
          <button class="btn ${c.wechat ? '' : 'disabled'}" data-act="wechat">复制微信</button>
          <a class="btn icon ${c.email ? '' : 'disabled'}" href="mailto:${esc(c.email || '')}" aria-label="发邮件">${ICON.mail}</a>
        </div>
      </section>
      <div class="seg" role="tablist">
        ${['动态', '资料'].map((t) => `<button class="${detailUi.tab === t ? 'on' : ''}" data-tab="${t}" role="tab" aria-selected="${detailUi.tab === t}">${t}</button>`).join('')}
      </div>
      ${detailUi.tab === '动态'
        ? (fus.length ? fus.map((f, i) => `<article class="fitem">
            <span class="ficon ${i === 0 ? 'recent' : ''}">${esc((f.type || '其').slice(0, 1))}</span>
            <div class="fbody">
              <div class="fhead"><b>${esc(f.type)}</b><span>${esc(fmtDay(f.date))}</span><button data-del="${f.id}" aria-label="删除这条跟进">删除</button></div>
              <p class="ftext">${esc(f.content)}</p>
            </div>
          </article>`).join('') : '<div class="empty">还没有跟进记录，点“写跟进”添加第一条</div>')
        : (info.length ? info.map(([k, v]) => `<div class="kv"><span class="k">${k}</span><span class="v">${esc(v)}</span></div>`).join('') : '<div class="empty">暂无资料，点右上角“编辑”补充</div>')}`;

    $$('.seg button', view).forEach((b) => b.onclick = () => { detailUi.tab = b.dataset.tab; renderDetail(id); });
    const wx = $('[data-act="wechat"]', view);
    wx.onclick = async () => {
      try { await navigator.clipboard.writeText(c.wechat); toast('微信号已复制'); } catch { toast(c.wechat); }
    };
    $$('[data-del]', view).forEach((b) => b.onclick = () => {
      if (confirm('删除这条跟进记录？')) Store.removeFollowUp(id, b.dataset.del);
    });
  }

  // ---------- 写跟进 ----------
  function renderCompose(id) {
    const c = Store.get(id);
    if (!c) { location.replace('#/'); return; }
    setTab(null);
    headerSub({
      title: '写跟进',
      left: `<a class="text-btn" href="#/c/${c.id}">取消</a>`,
      right: '<button class="text-btn strong" data-act="publish">发布</button>'
    });

    const st = {
      type: FU_TYPES[1],
      next: '3天后',
      status: c.status === '潜在' || !c.status ? '跟进中' : c.status
    };
    const nextDate = (label) => { const o = NEXT_OPTIONS.find(([l]) => l === label); return o && o[1] != null ? addDays(today(), o[1]) : ''; };

    view.innerHTML = `
      <div class="compose-head">
        ${avatar(40)}
        <label style="flex:1">
          <span class="who">${esc(c.name)}${c.company ? ' · ' + esc(c.company) : ''}</span>
          <textarea id="fuText" placeholder="这次沟通了什么？客户有什么需求？下一步怎么推进？"></textarea>
        </label>
      </div>
      <div class="csec">
        <div class="csec-title">跟进方式</div>
        <div class="chips" data-group="type">${FU_TYPES.map((t) => `<button class="chip ${st.type === t ? 'on' : ''}" data-v="${t}">${t}</button>`).join('')}</div>
      </div>
      <div class="csec">
        <div class="csec-title"><span>下次跟进</span><input type="date" id="nextDate" aria-label="下次跟进日期" value="${nextDate(st.next)}"></div>
        <div class="chips" data-group="next">${NEXT_OPTIONS.map(([l]) => `<button class="chip ${st.next === l ? 'on' : ''}" data-v="${l}">${l}</button>`).join('')}</div>
      </div>
      <div class="csec">
        <div class="csec-title">客户状态</div>
        <div class="chips" data-group="status">${STATUSES.map((s) => `<button class="chip ${st.status === s ? 'on' : ''}" data-v="${s}">${s}</button>`).join('')}</div>
      </div>
      <div class="pad"><button class="btn-lg" data-act="publish">发布跟进</button></div>`;

    $$('.chips', view).forEach((g) => {
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

    const publish = () => {
      const content = $('#fuText').value.trim();
      if (!content) { toast('请先写下跟进内容'); $('#fuText').focus(); return; }
      const cur = Store.get(id);
      cur.nextFollowUp = $('#nextDate').value || '';
      cur.status = st.status;
      Store.addFollowUp(id, { date: today(), type: st.type, content });
      toast('已发布');
      detailUi.tab = '动态';
      location.replace(`#/c/${id}`);
    };
    $$('[data-act="publish"]').forEach((b) => b.onclick = publish);
    setTimeout(() => $('#fuText').focus(), 50);
  }

  // ---------- 新增 / 编辑客户 ----------
  function renderEdit(id) {
    const isNew = !id;
    const c = isNew ? { status: '潜在', level: 'B', tags: [] } : Store.get(id);
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
    const chips = (name, label, opts) => `<div class="field"><span class="lbl">${label}</span>
      <div class="chips" data-field="${name}">${opts.map((o) => `<button type="button" class="chip ${c[name] === o ? 'on' : ''}" data-v="${o}">${o}</button>`).join('')}</div></div>`;

    view.innerHTML = `
      <form id="editForm">
        <div class="sec-title">基本信息</div>
        <div class="field"><label for="f-name">姓名</label><input id="f-name" name="name" required value="${esc(c.name || '')}" placeholder="必填"></div>
        ${input('company', '公司')}
        ${input('title', '职位')}
        <div class="sec-title">联系方式</div>
        ${input('phone', '电话', 'tel')}
        ${input('wechat', '微信')}
        ${input('email', '邮箱', 'email')}
        ${input('address', '地址')}
        <div class="sec-title">分类</div>
        ${chips('status', '状态', STATUSES)}
        ${chips('level', '等级', LEVELS)}
        ${input('source', '来源', 'text', '如：转介绍、展会、官网')}
        <div class="field"><label for="f-tags">标签</label><input id="f-tags" name="tags" value="${esc((c.tags || []).join('，'))}" placeholder="用逗号分隔"></div>
        <div class="field"><label for="f-next">下次跟进</label><input id="f-next" name="nextFollowUp" type="date" value="${esc(c.nextFollowUp || '')}"></div>
        <div class="sec-title">备注</div>
        <div class="field top"><label for="f-notes">备注</label><textarea id="f-notes" name="notes" placeholder="客户背景、需求、偏好…">${esc(c.notes || '')}</textarea></div>
        <div class="pad"><button class="btn-lg" type="submit">保存</button></div>
        ${isNew ? '' : '<div class="pad"><button class="btn-lg danger" type="button" id="delBtn">删除客户</button></div>'}
      </form>`;

    const picked = { status: c.status || '', level: c.level || '' };
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
      const next = { ...c };
      for (const k of ['company', 'title', 'phone', 'wechat', 'email', 'address', 'source', 'nextFollowUp', 'notes']) {
        next[k] = String(fd.get(k) || '').trim();
      }
      next.name = name;
      next.status = picked.status;
      next.level = picked.level;
      next.tags = String(fd.get('tags') || '').split(/[,，、\s#]+/).map((s) => s.trim()).filter(Boolean);
      const saved = Store.upsert(next);
      toast('已保存');
      location.replace(`#/c/${saved.id}`);
    };
    $$('[data-act="save"]').forEach((b) => b.onclick = () => form.requestSubmit());
    const del = $('#delBtn');
    if (del) del.onclick = () => {
      if (confirm(`确定删除客户“${c.name}”及其全部跟进记录？`)) {
        Store.remove(id);
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
    const won = all.filter((c) => c.status === '已成交').length;
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

  let lastRoute = location.hash;
  window.addEventListener('hashchange', () => {
    // 进入另一位客户时，详情页默认显示“动态”
    const a = (lastRoute.match(/^#\/c\/([^/]+)/) || [])[1];
    const b = (location.hash.match(/^#\/c\/([^/]+)/) || [])[1];
    if (a !== b) detailUi.tab = '动态';
    lastRoute = location.hash;
    render();
    window.scrollTo(0, 0);
  });

  const isEditing = () =>
    /^#\/(new|edit\/|c\/[^/]+\/follow)/.test(location.hash) ||
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
