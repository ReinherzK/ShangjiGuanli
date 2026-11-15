// 在 Azure / Microsoft Entra 注册应用后，把“应用程序(客户端) ID”填到这里。
// 详见 README.md 第 2 步。
window.CRM_CONFIG = {
  clientId: 'YOUR-CLIENT-ID-HERE',
  // common = 个人微软账号(Outlook/Hotmail) 和 工作/学校账号都可登录
  tenant: 'common',
  // 数据文件名，存放在 OneDrive 的 “应用/<应用名>” 文件夹中
  fileName: 'crm-data.json'
};
