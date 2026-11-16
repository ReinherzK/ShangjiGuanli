# 客户管理（iPhone 主屏幕 Web App，数据自动同步到 OneDrive）

纯静态网页（PWA），托管在 GitHub Pages，**无需任何服务器**。
登录微软账号后，数据自动同步到你的 OneDrive：`应用 (Apps) › 客户管理 › crm-data.json`，并每天自动备份到同目录的 `backups/`。

网址：<https://reinherzk.github.io/ShangjiGuanli/>

## 功能
- 客户列表：搜索（姓名/公司/电话/标签/备注）、按状态筛选、三种排序
- 客户详情：一键拨号 / 短信 / 邮件 / 复制微信号
- 跟进记录：方式、日期、内容，快速设置下次跟进日期（明天 / 3 天 / 1 周 / 1 个月）
- 待跟进：已逾期 / 今天 / 未来 7 天，底部红点提醒
- 自动同步：修改后约 1.5 秒上传；离线时先存本机，联网后补传；多设备按客户逐条合并
- 自动续登录：登录凭据过期后打开应用会自动续期，无需输入
- 备用：导出 / 导入备份文件（万一无法登录时使用）

---

## 部署

### 1. 发布到 GitHub Pages
1. 推送代码到 GitHub 仓库（Public；Private 仓库需要 GitHub Pro 才能用 Pages）。
2. 仓库 → **Settings → Pages** → Source 选 **Deploy from a branch**，Branch 选 `main` / `/ (root)` → Save。
3. 稍等 1 分钟。网址区分大小写。

> 代码里没有任何数据或密钥（clientId 不是密钥），公开仓库是安全的；客户数据只存在手机本地和你的 OneDrive。

### 2. 注册微软应用
0. **先准备一个目录（租户）**：自 2024 年 6 月起，个人微软账号不能直接注册应用，必须先有一个目录。
   最简单的办法是用你的 Outlook 账号注册 Azure（<https://azure.microsoft.com/free>），会自动创建“默认目录 (Default Directory)”。
   注册时需要信用卡验证身份；只注册应用不会产生任何费用。
1. 打开 <https://entra.microsoft.com> → **应用注册 → 新注册**：
   - 名称：`客户管理`（OneDrive 中 `应用/客户管理` 文件夹会用这个名字）
   - 支持的账户类型：**任何组织目录中的账户和个人 Microsoft 账户**
   - 重定向 URI：平台选 **单页应用程序 (SPA)**，填 GitHub Pages 网址（**末尾 / 不能少**）
2. 复制 **应用程序(客户端) ID**，填入 `config.js` 的 `clientId`。
3. **API 权限** → 添加 Microsoft Graph 委托权限 `Files.ReadWrite.AppFolder`、`offline_access`。
4. 提交并推送。

### 3. 在 iPhone 上安装
1. 用 **Safari** 打开网址 → 点底部 **分享** → **添加到主屏幕**。
2. 从主屏幕图标打开 → 点首页提示中的 **登录微软账号**（或在“设置”中登录），勾选 **“保持登录状态”**。

> **自动续登录**：微软对纯前端应用的登录凭据只给 24 小时。过期后打开应用会自动跳转到微软再立即跳回（约 1 秒），无需输入。
> 只有当微软账号本身也已退出（长期未使用、修改了密码等）时，才需要手动登录。正在填写表单时不会自动跳转。
> 未登录期间录入的数据会暂存在本机，登录后自动上传。

---

## 更新代码后
修改 `sw.js` 第一行的 `VERSION`（例如 `crm-v6`）后再推送，iPhone 上关闭应用再打开一两次即可拿到新版本。

## 本地预览
```bash
python -m http.server 8765
```
然后访问 <http://localhost:8765>。如需本地测试登录，在应用注册中额外添加 SPA 重定向 URI `http://localhost:8765/`。

## 文件结构
```
index.html            页面骨架
styles.css            iOS 风格样式（自动深色模式）
config.js             clientId 等配置
js/auth.js            微软登录（OAuth2 PKCE + 自动续登录，无第三方库）
js/store.js           本地存储、OneDrive 同步/合并/每日备份
js/app.js             界面与路由
sw.js                 离线缓存
manifest.webmanifest  主屏幕应用信息
icons/                图标
```
