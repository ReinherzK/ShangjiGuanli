(() => {
  const STATUSES = ['潜在', '跟进中', '已成交', '已流失'];
  const LEVELS = ['A', 'B', 'C'];
  const FU_TYPES = ['电话', '微信', '拜访', '邮件', '其他'];
  const COLORS = ['#2f6fed', '#7c3aed', '#db2777', '#ea580c', '#16a34a', '#0891b2', '#4f46e5', '#ca8a04'];

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const view = $('#view');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const addDays = (iso, n) => {
    const d = new Date(iso + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);

  const ui = { query: '', status: '全部', sort: 'updated' };

  // ---------- helpers ----------
  function toast(msg, ms = 2200) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { t.hidden = true; }, ms);
  }

  function avatar(c) {
    const name = c.name || '?';
    let h = 0;
    for (const ch of c.id || name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return `<div class="avatar" style="background:${COLORS[h % COLORS.length]}">${esc(name.slice(0, 1))}</div>`;
  }

  function dueLabel(date) {
    if (!date) return '';
    const n = daysBetween(today(), date);
    if (n < 0) return `<span class="due overdue">逾期 ${-n} 天</span>`;
    if (n === 0) return `<span class="due today">今天跟进</span>`;
    if (n === 1) return `<span class="due">明天跟进</span>`;
    return `<span class="due">${date.slice(5)} 跟进</span>`;
  }

  function setHeader({ title, back = false, action = null }) {
    $('#title').textContent = title;
    $('#backBtn').hidden = !back;
    const a = $('#actionBtn');
    a.hidden = !action;
    if (action) { a.textContent = action.label; a.onclick = action.onClick; }
    document.title = title === '客户' ? '客户管理' : `${title} · 客户管理`;
  }

  function setTab(name) {
    $$('.tabbar a').forEach((a) => a.classList.toggle('active', a.dataset.tab === name));
  }

  function updateBadge() {
    const t = today();
    const n = Store.all().filter((c) => c.nextFollowUp && c.nextFollowUp <= t && c.status !== '已流失').length;
    const b = $('#todoBadge');
    b.hidden = !n;
    b.textContent = n > 99 ? '99+' : n;
  }

  function updateSyncDot() {
    const s = Store.status();
    const dot = $('#syncDot');
    dot.className = 'sync-dot ' + ({ ok: 'ok', busy: 'busy', err: 'err', relogin: 'err' }[s.state] || '');
    dot.title = s.message || (s.state === 'local' ? '仅本机（未登录 OneDrive）' : '');
  }

  // ---------- 免登录模式：备份 / 恢复 ----------
  // 通过系统分享菜单保存 JSON 文件：iPhone 上选“存储到文件” → OneDrive
  async function backupToFile() {
    const name = `客户数据-${today()}.json`;
    const text = JSON.stringify(Store.exportData(), null, 2);
    for (const type of ['application/json', 'text/plain']) {
      const file = new File([text], name, { type });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          Store.markExported();
          toast('已备份');
        } catch (e) {
          if (e.name !== 'AbortError') toast('备份失败：' + e.message);
        }
        return;
      }
    }
    // 不支持分享文件的浏览器（如电脑）→ 直接下载
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    Store.markExported();
    toast('已下载备份文件');
  }

  // 从文件恢复（与现有数据合并，较新的覆盖较旧的，不会丢数据）
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
        Store.markExported(); // 刚从备份恢复，视为已备份
        toast(`已恢复 ${json.customers.length} 位客户`);
      } catch (err) { toast('恢复失败：' + err.message, 3500); }
    };
    input.click();
  }

  function backupBanner() {
    if (!Store.needsBackup()) return '';
    const m = Store.meta();
    const since = m.lastExport ? `上次备份于 ${new Date(m.lastExport).toLocaleDateString('zh-CN')}，` : '还没有备份过，';
    return `<div class="banner">
      <div>💾 ${since}有新的修改只保存在这台手机上。</div>
      <button class="banner-btn" data-backup>立即备份到 OneDrive</button>
    </div>`;
  }
  function bindBanner() {
    $$('[data-backup]', view).forEach((b) => b.onclick = backupToFile);
  }

  // ---------- list ----------
  function customerRow(c, extra = '') {
    return `<a class="row" href="#/c/${c.id}">
      ${avatar(c)}
      <div class="main">
        <div class="name">${esc(c.name)} ${c.level ? `<span class="tag st-潜在">${esc(c.level)}</span>` : ''}</div>
        <div class="sub">${esc([c.company, c.title].filter(Boolean).join(' · ') || c.phone || '—')}</div>
        ${extra}
      </div>
      <div style="text-align:right">
        ${c.status ? `<span class="tag st-${esc(c.status)}">${esc(c.status)}</span>` : ''}
        <div>${dueLabel(c.nextFollowUp)}</div>
      </div>
    </a>`;
  }

  function renderList() {
    setTab('list');
    setHeader({ title: '客户', action: { label: '排序', onClick: cycleSort } });
    const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
    Store.all().forEach((c) => { if (counts[c.status] != null) counts[c.status]++; });

    view.innerHTML = `
      ${backupBanner()}
      <input class="search" id="q" type="search" placeholder="搜索姓名、公司、电话、标签、备注" value="${esc(ui.query)}" autocomplete="off">
      <div class="chips">
        ${['全部', ...STATUSES].map((s) => `<button class="chip ${ui.status === s ? 'active' : ''}" data-s="${s}">${s}${s !== '全部' ? ` ${counts[s]}` : ''}</button>`).join('')}
      </div>
      <div class="hint" id="sortHint"></div>
      <div id="listBody"></div>
      <button class="fab" aria-label="新增客户" onclick="location.hash='#/new'">＋</button>`;

    bindBanner();
    $('#q').addEventListener('input', (e) => { ui.query = e.target.value; renderListBody(); });
    $$('.chip', view).forEach((b) => b.addEventListener('click', () => { ui.status = b.dataset.s; renderList(); }));
    renderListBody();
  }

  function cycleSort() {
    const order = ['updated', 'name', 'due'];
    ui.sort = order[(order.indexOf(ui.sort) + 1) % order.length];
    renderListBody();
  }

  function renderListBody() {
    const q = ui.query.trim().toLowerCase();
    let list = Store.all();
    if (ui.status !== '全部') list = list.filter((c) => c.status === ui.status);
    if (q) {
      list = list.filter((c) =>
        [c.name, c.company, c.title, c.phone, c.wechat, c.email, c.address, c.source, c.notes, (c.tags || []).join(' ')]
          .some((v) => String(v || '').toLowerCase().includes(q)));
    }
    const sorters = {
      updated: (a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''),
      name: (a, b) => (a.name || '').localeCompare(b.name || '', 'zh-CN'),
      due: (a, b) => (a.nextFollowUp || '9999').localeCompare(b.nextFollowUp || '9999')
    };
    list.sort(sorters[ui.sort]);
    $('#sortHint').textContent = `共 ${list.length} 位 · 按${{ updated: '最近更新', name: '姓名', due: '跟进日期' }[ui.sort]}排序`;
    $('#listBody').innerHTML = list.length
      ? `<div class="group">${list.map((c) => customerRow(c)).join('')}</div>`
      : `<div class="empty"><div class="big">👥</div>${Store.all().length ? '没有匹配的客户' : '还没有客户，点右下角 ＋ 添加第一位'}</div>`;
  }

  // ---------- todo ----------
  function renderTodo() {
    setTab('todo');
    setHeader({ title: '待跟进' });
    const t = today();
    const week = addDays(t, 7);
    const active = Store.all().filter((c) => c.nextFollowUp && c.status !== '已流失');
    const overdue = active.filter((c) => c.nextFollowUp < t);
    const todayList = active.filter((c) => c.nextFollowUp === t);
    const soon = active.filter((c) => c.nextFollowUp > t && c.nextFollowUp <= week);
    const by = (a, b) => a.nextFollowUp.localeCompare(b.nextFollowUp);

    const all = Store.all();
    const stats = STATUSES.map((s) => `<div class="stat"><b>${all.filter((c) => c.status === s).length}</b><span>${s}</span></div>`).join('');

    const section = (title, list) => list.length
      ? `<div class="section-title">${title}（${list.length}）</div><div class="group">${list.sort(by).map((c) => customerRow(c, lastFollow(c))).join('')}</div>`
      : '';

    const body = section('已逾期', overdue) + section('今天', todayList) + section('未来 7 天', soon);
    view.innerHTML = `
      ${backupBanner()}
      <div class="stats">${stats}</div>
      ${body || '<div class="empty"><div class="big">✅</div>近期没有需要跟进的客户</div>'}`;
    bindBanner();
  }

  function lastFollow(c) {
    const f = (c.followUps || [])[0];
    return f ? `<div class="sub">上次：${esc(f.date)} ${esc(f.type)} · ${esc(f.content)}</div>` : '';
  }

  // ---------- detail ----------
  function renderDetail(id) {
    const c = Store.get(id);
    if (!c) { location.replace('#/'); return; }
    setTab('list');
    setHeader({ title: '客户详情', back: true, action: { label: '编辑', onClick: () => { location.hash = `#/edit/${id}`; } } });

    const tel = (c.phone || '').replace(/[^\d+]/g, '');
    const fields = [
      ['公司', c.company], ['职位', c.title], ['电话', c.phone ? `<a href="tel:${esc(tel)}">${esc(c.phone)}</a>` : '', true],
      ['微信', c.wechat], ['邮箱', c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : '', true],
      ['地址', c.address], ['来源', c.source], ['等级', c.level],
      ['标签', (c.tags || []).join('、')], ['备注', c.notes]
    ].filter(([, v]) => v);

    view.innerHTML = `
      <div class="hero">
        ${avatar(c)}
        <h2>${esc(c.name)}</h2>
        <div class="sub">${esc([c.company, c.title].filter(Boolean).join(' · '))}</div>
        <div style="margin-top:6px">${c.status ? `<span class="tag st-${esc(c.status)}">${esc(c.status)}</span>` : ''} ${dueLabel(c.nextFollowUp)}</div>
      </div>
      <div class="quick">
        <a class="${tel ? '' : 'disabled'}" href="tel:${esc(tel)}"><span class="qi">📞</span>电话</a>
        <a class="${tel ? '' : 'disabled'}" href="sms:${esc(tel)}"><span class="qi">💬</span>短信</a>
        <a class="${c.email ? '' : 'disabled'}" href="mailto:${esc(c.email || '')}"><span class="qi">✉️</span>邮件</a>
        <button id="copyWx" class="${c.wechat ? '' : 'disabled'}"><span class="qi">🟢</span>复制微信</button>
      </div>

      ${fields.length ? `<div class="section-title">资料</div><div class="group">
        ${fields.map(([k, v, raw]) => `<div class="kv"><div class="k">${k}</div><div class="v">${raw ? v : esc(v)}</div></div>`).join('')}
      </div>` : ''}

      <div class="section-title">添加跟进记录</div>
      <form class="group form" id="fuForm">
        <div class="field"><label>方式</label><div class="seg" id="fuType">
          ${FU_TYPES.map((t, i) => `<button type="button" class="${i === 0 ? 'on' : ''}" data-v="${t}">${t}</button>`).join('')}
        </div></div>
        <div class="field"><label>日期</label><input type="date" name="date" value="${today()}" required></div>
        <div class="field col"><textarea name="content" placeholder="沟通内容、客户需求、下一步计划…" required></textarea></div>
        <div class="field"><label>下次跟进</label><input type="date" name="next" value="${esc(c.nextFollowUp && c.nextFollowUp > today() ? c.nextFollowUp : '')}"></div>
        <div class="field"><label></label><div class="seg" id="nextQuick">
          ${[[1, '明天'], [3, '3天后'], [7, '1周后'], [30, '1个月后']].map(([d, l]) => `<button type="button" data-d="${d}">${l}</button>`).join('')}
        </div></div>
      </form>
      <button class="btn" form="fuForm" type="submit">保存跟进记录</button>

      <div class="section-title">跟进历史（${(c.followUps || []).length}）</div>
      ${(c.followUps || []).length ? `<div class="group"><ul class="timeline">
        ${c.followUps.map((f) => `<li>
          <div class="meta"><span>${esc(f.date)} · ${esc(f.type)}</span><button class="link-btn" data-del="${f.id}">删除</button></div>
          <div class="content">${esc(f.content)}</div>
        </li>`).join('')}
      </ul></div>` : '<div class="hint">暂无跟进记录</div>'}
      <div class="hint">创建于 ${esc((c.createdAt || '').slice(0, 10))} · 更新于 ${esc((c.updatedAt || '').slice(0, 16).replace('T', ' '))}</div>`;

    $('#copyWx').onclick = async () => {
      try { await navigator.clipboard.writeText(c.wechat); toast('微信号已复制'); } catch { toast(c.wechat); }
    };
    let fuType = FU_TYPES[0];
    $$('#fuType button').forEach((b) => b.onclick = () => {
      fuType = b.dataset.v;
      $$('#fuType button').forEach((x) => x.classList.toggle('on', x === b));
    });
    $$('#nextQuick button').forEach((b) => b.onclick = () => {
      $('#fuForm [name=next]').value = addDays(today(), +b.dataset.d);
    });
    $('#fuForm').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const content = fd.get('content').trim();
      if (!content) return;
      const cur = Store.get(id);
      cur.nextFollowUp = fd.get('next') || '';
      if (cur.status === '潜在') cur.status = '跟进中';
      Store.addFollowUp(id, { date: fd.get('date'), type: fuType, content });
      toast('已保存');
    };
    $$('[data-del]', view).forEach((b) => b.onclick = () => {
      if (confirm('删除这条跟进记录？')) Store.removeFollowUp(id, b.dataset.del);
    });
  }

  // ---------- edit ----------
  function renderEdit(id) {
    const isNew = !id;
    const c = isNew ? { status: '潜在', level: 'B', tags: [] } : Store.get(id);
    if (!c) { location.replace('#/'); return; }
    setTab('list');
    setHeader({ title: isNew ? '新增客户' : '编辑客户', back: true, action: { label: '保存', onClick: () => $('#editForm').requestSubmit() } });

    const input = (name, label, type = 'text', ph = '') =>
      `<div class="field"><label>${label}</label><input name="${name}" type="${type}" value="${esc(c[name] || '')}" placeholder="${ph}"
        ${type === 'tel' ? 'inputmode="tel"' : ''} ${type === 'email' ? 'inputmode="email" autocapitalize="off"' : ''}></div>`;
    const seg = (name, label, opts) =>
      `<div class="field"><label>${label}</label><div class="seg" data-seg="${name}">
        ${opts.map((o) => `<button type="button" data-v="${o}" class="${c[name] === o ? 'on' : ''}">${o}</button>`).join('')}
      </div><input type="hidden" name="${name}" value="${esc(c[name] || '')}"></div>`;

    view.innerHTML = `
      <form id="editForm" class="form">
        <div class="group">
          <div class="field"><label>姓名 *</label><input name="name" required value="${esc(c.name || '')}" placeholder="必填"></div>
          ${input('company', '公司')}
          ${input('title', '职位')}
        </div>
        <div class="section-title">联系方式</div>
        <div class="group">
          ${input('phone', '电话', 'tel')}
          ${input('wechat', '微信')}
          ${input('email', '邮箱', 'email')}
          ${input('address', '地址')}
        </div>
        <div class="section-title">分类</div>
        <div class="group">
          ${seg('status', '状态', STATUSES)}
          ${seg('level', '等级', LEVELS)}
          ${input('source', '来源', 'text', '如：转介绍、展会、官网')}
          <div class="field"><label>标签</label><input name="tags" value="${esc((c.tags || []).join('，'))}" placeholder="用逗号分隔"></div>
          <div class="field"><label>下次跟进</label><input name="nextFollowUp" type="date" value="${esc(c.nextFollowUp || '')}"></div>
        </div>
        <div class="section-title">备注</div>
        <div class="group"><div class="field col"><textarea name="notes" placeholder="客户背景、需求、偏好…">${esc(c.notes || '')}</textarea></div></div>
        <button class="btn" type="submit">保存</button>
        ${isNew ? '' : '<button class="btn danger" type="button" id="delBtn">删除客户</button>'}
      </form>`;

    $$('[data-seg]', view).forEach((g) => {
      const hidden = g.parentElement.querySelector('input[type=hidden]');
      $$('button', g).forEach((b) => b.onclick = () => {
        const on = !b.classList.contains('on');
        $$('button', g).forEach((x) => x.classList.remove('on'));
        b.classList.toggle('on', on);
        hidden.value = on ? b.dataset.v : '';
      });
    });

    $('#editForm').onsubmit = (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const name = fd.get('name').trim();
      if (!name) { toast('请填写姓名'); return; }
      const next = { ...c };
      for (const k of ['company', 'title', 'phone', 'wechat', 'email', 'address', 'status', 'level', 'source', 'nextFollowUp', 'notes']) {
        next[k] = String(fd.get(k) || '').trim();
      }
      next.name = name;
      next.tags = String(fd.get('tags') || '').split(/[,，、\s]+/).map((s) => s.trim()).filter(Boolean);
      const saved = Store.upsert(next);
      toast('已保存');
      location.replace(`#/c/${saved.id}`);
    };
    const del = $('#delBtn');
    if (del) del.onclick = () => {
      if (confirm(`确定删除客户“${c.name}”及其全部跟进记录？`)) {
        Store.remove(id);
        toast('已删除');
        location.replace('#/');
      }
    };
  }

  // ---------- settings ----------
  function renderSettings() {
    setTab('settings');
    setHeader({ title: '设置' });
    const s = Store.status();
    const m = Store.meta();
    const user = Auth.user();
    const configured = Auth.configured();
    const signedIn = Auth.hasSession();
    const relogin = Auth.needsRelogin() || s.state === 'relogin';
    const mode = Store.mode();

    const modeSeg = `
      <div class="section-title">使用方式</div>
      <div class="group form"><div class="field"><div class="seg" id="modeSeg">
        <button type="button" data-m="local" class="${mode === 'local' ? 'on' : ''}">免登录（手动备份）</button>
        <button type="button" data-m="cloud" class="${mode === 'cloud' ? 'on' : ''}">登录自动同步</button>
      </div></div></div>`;

    if (mode === 'local') {
      const lastExport = m.lastExport ? new Date(m.lastExport).toLocaleString('zh-CN') : '从未';
      view.innerHTML = `
        ${modeSeg}
        <div class="section-title">备份到 OneDrive</div>
        <div class="group">
          <div class="kv"><div class="k">客户数</div><div class="v">${Store.all().length}</div></div>
          <div class="kv"><div class="k">上次备份</div><div class="v">${lastExport}</div></div>
          <div class="kv"><div class="k">状态</div><div class="v">${m.exportedSeq === m.seq ? '✅ 已备份最新数据' : '⚠️ 有修改尚未备份'}</div></div>
        </div>
        <button class="btn" id="backupBtn">备份到 OneDrive</button>
        <button class="btn secondary" id="restoreBtn">从 OneDrive 恢复</button>
        <div class="hint"><b>备份：</b>点按钮后在弹出的菜单中选“存储到文件” → 选择 OneDrive 中的文件夹 → 存储。文件名带日期，会保留历史版本。</div>
        <div class="hint"><b>恢复 / 换手机：</b>点“从 OneDrive 恢复”，在“浏览”中进入 OneDrive，选最新的“客户数据-日期.json”。恢复是合并方式，不会删除手机上已有的客户。</div>
        <div class="hint">超过 ${3} 天有修改未备份时，首页会出现提醒。</div>
        ${installHint()}`;
      bindModeSeg();
      $('#backupBtn').onclick = backupToFile;
      $('#restoreBtn').onclick = restoreFromFile;
      return;
    }

    let account;
    if (!configured) {
      account = `<div class="kv"><div class="v">⚠️ 尚未配置微软应用 clientId（见 README “登录自动同步”一节）。配置之前请使用免登录模式。</div></div>`;
    } else if (!signedIn) {
      account = `<div class="kv"><div class="v">未登录。登录后数据会自动同步到你的 OneDrive。</div></div>`;
    } else {
      account = `
        <div class="kv"><div class="k">账号</div><div class="v">${esc(user ? (user.name || '') + ' ' + (user.email || '') : '已登录')}</div></div>
        <div class="kv"><div class="k">状态</div><div class="v">${esc(relogin ? '登录已过期，请重新登录' : (s.message || '—'))}</div></div>
        <div class="kv"><div class="k">上次同步</div><div class="v">${m.lastSync ? new Date(m.lastSync).toLocaleString('zh-CN') : '从未'}</div></div>
        <div class="kv"><div class="k">存储位置</div><div class="v">OneDrive › 应用 › (你的应用名) › ${esc(CRM_CONFIG.fileName)}</div></div>`;
    }

    view.innerHTML = `
      ${modeSeg}
      <div class="section-title">OneDrive 同步</div>
      <div class="group">${account}</div>
      ${configured && (!signedIn || relogin) ? '<button class="btn" id="loginBtn">登录微软账号</button>' : ''}
      ${signedIn && !relogin ? '<button class="btn secondary" id="syncBtn">立即同步</button>' : ''}
      ${signedIn ? '<button class="btn danger" id="logoutBtn">退出登录</button>' : ''}

      <div class="section-title">数据</div>
      <div class="group">
        <div class="kv"><div class="k">客户数</div><div class="v">${Store.all().length}</div></div>
        <div class="kv"><div class="k">待上传</div><div class="v">${m.dirty ? '有本地修改未同步' : '无'}</div></div>
      </div>
      <button class="btn secondary" id="exportBtn">导出备份文件</button>
      <button class="btn secondary" id="importBtn">从备份文件导入（合并）</button>
      <div class="hint">每天首次同步时，会在 OneDrive 的 backups 文件夹自动保存一份当日备份。</div>
      ${installHint()}`;

    bindModeSeg();
    const on = (sel, fn) => { const el = $(sel); if (el) el.onclick = fn; };
    on('#loginBtn', async () => { try { await Auth.login(); } catch (e) { toast(e.message); } });
    on('#syncBtn', () => Store.sync());
    on('#logoutBtn', () => {
      if (!confirm('退出登录？')) return;
      Auth.logout();
      if (confirm('是否同时清除本机上的客户数据？\n（OneDrive 上的数据不受影响）')) Store.resetLocal();
      toast('已退出');
      render();
    });
    on('#exportBtn', backupToFile);
    on('#importBtn', restoreFromFile);
  }

  function installHint() {
    return `<div class="section-title">添加到主屏幕</div>
      <div class="hint">在 iPhone 的 Safari 中打开本页 → 点底部“分享”按钮 → “添加到主屏幕”。之后从主屏幕图标打开即可全屏使用，离线也能查看和修改。</div>
      <div class="hint">⚠️ 删除主屏幕图标或清除 Safari 网站数据会清空手机上的数据，请先备份。</div>`;
  }

  function bindModeSeg() {
    $$('#modeSeg button').forEach((b) => b.onclick = () => {
      if (b.dataset.m === Store.mode()) return;
      Store.setMode(b.dataset.m);
      renderSettings();
    });
  }

  // ---------- router ----------
  function render() {
    const h = location.hash.replace(/^#/, '') || '/';
    let m;
    if (h === '/' || h === '') renderList();
    else if (h === '/todo') renderTodo();
    else if (h === '/settings') renderSettings();
    else if (h === '/new') renderEdit(null);
    else if ((m = h.match(/^\/c\/(.+)$/))) renderDetail(m[1]);
    else if ((m = h.match(/^\/edit\/(.+)$/))) renderEdit(m[1]);
    else renderList();
    updateBadge();
  }

  $('#backBtn').onclick = () => {
    if (history.length > 1) history.back(); else location.hash = '#/';
  };

  window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

  // 数据变化时：仅在非编辑页面重绘，避免打断输入
  Store.subscribe(() => {
    updateSyncDot();
    updateBadge();
    const h = location.hash;
    const editing = /^#\/(new|edit\/)/.test(h) || (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName) && document.activeElement.id !== 'q');
    if (!editing) {
      if (h.startsWith('#/c/') || h === '#/todo' || h === '#/settings') render();
      else if (!h || h === '#/') { if ($('#listBody')) renderListBody(); else render(); }
    }
  });

  const isEditing = () =>
    /^#\/(new|edit\/)/.test(location.hash) ||
    (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && document.activeElement.id !== 'q') ||
    !!($('#fuForm [name=content]') && $('#fuForm [name=content]').value.trim());

  // 登录模式下，令牌过期时自动续登录（跳转到微软后立即跳回，无需输入）
  async function ensureSession() {
    if (Store.mode() !== 'cloud' || !Auth.configured() || !Auth.hasSession() || !navigator.onLine) return false;
    if (await Auth.getToken()) return false;
    if (isEditing()) return false; // 正在输入时不跳转，避免丢失未保存内容
    return Auth.trySilent();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') ensureSession();
  });

  async function start() {
    // 请求持久化存储，降低系统清理本地数据的可能
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    let returned = false;
    try {
      if (await Auth.handleRedirect()) {
        returned = true;
        if (Store.mode() !== 'cloud') { Store.setMode('cloud'); toast('登录成功，正在同步…'); }
      }
    } catch (e) {
      toast(e.message, 4000);
    }
    if (Auth.silentFailed()) toast('登录已过期，请在“设置”中重新登录', 4000);
    if (!returned && !Auth.silentFailed() && (await ensureSession())) return; // 正在跳转续登录
    render();
    updateSyncDot();
    Store.sync();
  }

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW', e));
  }
  start();
})();
