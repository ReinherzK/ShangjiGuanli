# 客户管理（iPhone 主屏幕 Web App，数据存 OneDrive）

纯静态网页（PWA），托管在 GitHub Pages，**无需任何服务器**。提供两种使用方式，在“设置 › 使用方式”中切换：

| | 免登录（默认） | 登录自动同步 |
|---|---|---|
| 需要微软应用注册 | 不需要 | 需要（免费） |
| 数据存放 | 手机本地；手动备份到 OneDrive | 手机本地 + 自动同步到 OneDrive |
| 备份方式 | 点“备份到 OneDrive” → 存储到文件 → OneDrive | 自动，另有每日自动备份 |
| 多设备 | 手动备份 / 恢复 | 自动合并 |

## 功能
- 客户列表：搜索（姓名/公司/电话/标签/备注）、按状态筛选、三种排序
- 客户详情：一键拨号 / 短信 / 邮件 / 复制微信号
- 跟进记录：方式、日期、内容，快速设置下次跟进日期（明天 / 3 天 / 1 周 / 1 个月）
- 待跟进：已逾期 / 今天 / 未来 7 天，底部红点提醒
- 离线可用；免登录模式下超过 3 天有修改未备份会在首页提醒

---

## 部署（免登录模式只需第 1、3 步）

### 1. 发布到 GitHub Pages
1. 在 GitHub 新建一个仓库，例如 `crm`（Public；Private 仓库需要 GitHub Pro 才能用 Pages）。
2. 在本文件夹执行（把 `<你的用户名>` 换掉）：
   ```bash
   git remote add origin https://github.com/<你的用户名>/crm.git
   git push -u origin main
   ```
3. 仓库 → **Settings → Pages** → Source 选 **Deploy from a branch**，Branch 选 `main` / `/ (root)` → Save。
4. 稍等 1 分钟，网址为：`https://<你的用户名>.github.io/crm/`

> 代码里没有任何数据或密钥，公开仓库是安全的；客户数据只存在手机本地和你的 OneDrive。

### 2.（可选）启用“登录自动同步”
1. 打开 <https://entra.microsoft.com> → **应用注册 → 新注册**：
   - 名称：`客户管理`（OneDrive 中 `应用/客户管理` 文件夹会用这个名字）
   - 支持的账户类型：**任何组织目录中的账户和个人 Microsoft 账户**
   - 重定向 URI：平台选 **单页应用程序 (SPA)**，填 `https://<你的用户名>.github.io/crm/`（**末尾 / 不能少**）
2. 复制 **应用程序(客户端) ID**，填入 `config.js` 的 `clientId`。
3. **API 权限** → 添加 Microsoft Graph 委托权限 `Files.ReadWrite.AppFolder`、`offline_access`。
4. 提交并推送，然后在应用“设置”中切换到“登录自动同步”并登录。

> **自动续登录**：微软对纯前端应用的登录凭据只给 24 小时。过期后打开应用时，会自动跳转到微软再立即跳回（约 1 秒，屏幕闪一下），无需任何输入。
> 只有当微软账号本身也已退出（例如长期未使用、修改了密码，或首次登录时没有勾选“保持登录状态”）时，才会提示到“设置”中手动登录。首次登录时请勾选 **“保持登录状态”**。
> 正在填写表单时不会自动跳转，以免丢失未保存的内容。

### 3. 在 iPhone 上安装
1. 用 **Safari** 打开 `https://<你的用户名>.github.io/crm/`
2. 点底部 **分享** → **添加到主屏幕**，以后从主屏幕图标打开。

---

## 免登录模式：备份与恢复
- **备份**：设置 › 备份到 OneDrive → 菜单中选“存储到文件” → 选 OneDrive 里的文件夹（例如 `OneDrive/客户管理备份`）→ 存储。文件名形如 `客户数据-2026-11-15.json`，按日期保留历史。
  - 如果“文件”App 里看不到 OneDrive：先安装 OneDrive App 并登录，然后在“文件”App › 浏览 › 右上角“…” › 编辑 中启用 OneDrive。
- **恢复 / 换手机**：设置 › 从 OneDrive 恢复 → 选最新的备份文件。恢复采用合并方式（同一客户以较新的修改为准），不会删除手机上已有的数据。
- ⚠️ 删除主屏幕图标或清除 Safari 网站数据会清空手机上的数据，操作前请先备份。

## 更新代码后
修改 `sw.js` 第一行的 `VERSION`（例如 `crm-v3`）后再推送，iPhone 上重新打开两次即可拿到新版本。

## 本地预览
```bash
python -m http.server 8765
```
然后访问 <http://localhost:8765>。

## 文件结构
```
index.html            页面骨架
styles.css            iOS 风格样式（自动深色模式）
config.js             clientId 等配置（仅登录模式需要）
js/auth.js            微软登录（OAuth2 PKCE，无第三方库）
js/store.js           本地存储、模式切换、OneDrive 同步/合并/备份
js/app.js             界面、路由、免登录备份/恢复
sw.js                 离线缓存
manifest.webmanifest  主屏幕应用信息
icons/                图标
```
