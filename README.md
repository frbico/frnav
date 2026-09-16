# frnav - 个人网址导航

<p align="center">
  一个基于 Cloudflare Pages + Functions + D1 + KV 的个人书签导航与管理平台。
</p>

<p align="center">
  <a href="https://github.com/frbico/frnav/stargazers"><img src="https://img.shields.io/github/stars/frbico/frnav?style=flat-square&logo=github&color=yellow" alt="Stars"></a>
  <a href="https://github.com/frbico/frnav/network/members"><img src="https://img.shields.io/github/forks/frbico/frnav?style=flat-square&logo=github&color=blue" alt="Forks"></a>
  <a href="https://github.com/frbico/frnav/blob/master/LICENSE"><img src="https://img.shields.io/github/license/frbico/frnav?style=flat-square&color=green" alt="License"></a>
  <a href="https://github.com/frbico/frnav/issues"><img src="https://img.shields.io/github/issues/frbico/frnav?style=flat-square&color=orange" alt="Issues"></a>
</p>

<p align="center">
  <a href="#-核心特性">核心特性</a> •
  <a href="#-本项目的定制">项目定制</a> •
  <a href="#-快速部署">快速部署</a> •
  <a href="#-备份与恢复">备份恢复</a> •
  <a href="#-致谢与许可">致谢与许可</a>
</p>

<p align="center">
  <strong>🌐 当前在线体验：</strong>
  <a href="https://iori-nav-eql.pages.dev/">https://iori-nav-eql.pages.dev/</a>
</p>

> 新 Cloudflare 账号部署完成后，可以把上面的在线体验地址替换为新的 `pages.dev` 地址或自定义域名。

---

## ✨ 核心特性

- 📱 响应式布局，支持桌面端与移动端独立配置
- 🔍 站内搜索与可自定义站外搜索引擎
- 📂 多级分类与书签管理
- 🔒 管理后台、会话认证与私密分类保护
- 📝 可控制的访客投稿
- 🖼️ 网站 Logo / Favicon 自定义与上传
- 🎨 卡片样式、字体、壁纸、毛玻璃、圆角等个性化设置
- 📤 数据导入、导出、备份与恢复
- ⚡ Cloudflare Pages / Functions / D1 / KV 一体化部署
- 🤖 可选 Workers AI / Gemini / OpenAI 描述生成

---

## 🧩 本项目的定制

`frnav` 在开源项目基础上进行了持续二次开发，目前包含但不限于：

- 可自定义搜索引擎，支持新增、删除、排序与启用/停用
- 首页搜索默认使用 Google / Bing / GitHub，并兼容旧配置
- 透明 PNG / SVG Logo 显示优化
- 网站 Logo / Favicon 后台配置与上传
- 桌面端和移动端卡片样式独立配置
- 首页与静态资源缓存策略优化
- 私密分类祖先链保护与异常数据 fail closed
- 首页标题与后台站点名称保持一致
- Cloudflare D1 Schema 运行时自动初始化与迁移
- 关闭上游每日自动同步，避免覆盖本项目定制修改

---

## 🚀 快速部署

> 准备工作：一个 GitHub 账号和一个 Cloudflare 账号。

### 步骤 1：Fork 本仓库

[![Fork on GitHub](https://img.shields.io/badge/Fork-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/frbico/frnav/fork)

如果只是自己使用，也可以直接克隆本仓库后部署，不需要继续关联任何上游仓库。

### 步骤 2：部署到 Cloudflare Pages

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://dash.cloudflare.com/?to=/:account/pages/new/provider/github)

在 Cloudflare Pages 中连接 GitHub 后选择 `frbico/frnav`。

推荐设置：

```text
Production branch: master
Framework preset: None
Build command: exit 0
Build output directory: public
Root directory: 留空
```

### 步骤 3：创建 D1 数据库

在 Cloudflare 控制台创建 D1 数据库，例如：

```text
book
```

然后在 Pages 项目中添加 D1 绑定：

```text
Variable name: NAV_DB
D1 database: book
```

### 步骤 4：创建 KV Namespace

创建 KV Namespace，例如：

```text
NAV_AUTH
```

在 KV 中添加后台登录信息：

```text
admin_username = 你的管理员用户名
admin_password = 你的管理员密码
```

然后在 Pages 项目中添加 KV 绑定：

```text
Variable name: NAV_AUTH
KV namespace: NAV_AUTH
```

### 步骤 5：可选绑定与变量

如需 Cloudflare Workers AI：

```text
Variable name: AI
Binding type: Workers AI
```

常用可选环境变量：

| 变量名 | 说明 |
| --- | --- |
| `ENABLE_PUBLIC_SUBMISSION` | 是否允许访客投稿，默认 `false` |
| `SITE_NAME` | 首页站点名称的环境变量兜底值 |
| `SITE_DESCRIPTION` | 首页副标题的环境变量兜底值 |
| `FOOTER_TEXT` | 首页页脚文字 |
| `ICON_API` | 站点图标 API |

绑定完成后重新部署一次。

> 新建空 D1 后，项目会在首次请求时通过运行时迁移逻辑自动建立基础表结构并执行后续 Schema 迁移。

---

## 💾 备份与恢复

如果从旧 Cloudflare 账号迁移到新账号，推荐流程：

1. 在旧站后台使用项目自带的备份 / 导出功能保存现有数据。
2. 在新的 Cloudflare 账号中部署 `frbico/frnav`。
3. 创建并绑定新的 `NAV_DB` 和 `NAV_AUTH`。
4. 首次访问新站，让数据库结构自动初始化。
5. 登录新站后台。
6. 使用项目自带的恢复 / 导入功能导入之前的备份。
7. 核对分类、书签、站点设置、Logo、搜索引擎等数据。
8. 确认无误后再切换正式域名。

为了降低迁移风险，建议旧站在新站验证完成前先保留，不要立即删除。

---

## 📚 外部公共书签资源

项目仍可使用上游社区维护的公共书签库作为可选导入源：

<https://github.com/jy02739244/bookmark-library>

这是外部公开资源，不代表 `frnav` 与原项目仍存在 Fork 或部署依赖关系。

---

## 🛠️ 本地开发

```bash
npm install
cp wrangler.example.toml wrangler.toml
npm run build:css
npm run dev
```

测试：

```bash
npm run check
```

---

## 🙏 致谢与许可

`frnav` 基于开源导航项目持续二次开发，并保留原项目的 MIT License 与相关版权信息。

本仓库在完成 GitHub Fork Network 分离后，将作为独立项目继续维护；不会自动同步或覆盖来自上游仓库的代码变更。

许可证： [MIT License](https://github.com/frbico/frnav/blob/master/LICENSE)

---

## 📞 项目信息

- **维护者**：[@frbico](https://github.com/frbico)
- **项目仓库**：<https://github.com/frbico/frnav>
- **Issues**：<https://github.com/frbico/frnav/issues>

<p align="center">如果这个项目对你有帮助，欢迎给它一个 ⭐️。</p>

## ⭐ Star 趋势

[![Star History Chart](https://star-history.dera.page/svg?repos=frbico/frnav)](https://star-history.dera.page/#frbico/frnav)
