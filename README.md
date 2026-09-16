> [!IMPORTANT]
> **项目说明**
>
> 本项目基于 [jy02739244/iori-nav](https://github.com/jy02739244/iori-nav/) 二次开发，结合个人使用习惯进行定制。
>
> 全部代码均在 [jy02739244/iori-nav](https://github.com/jy02739244/iori-nav/) 的基础上，由天才程序员 **ChatGPT** 完成。
>
> 尊重原作者及其开源成果，如需使用，请移步原项目：**https://github.com/jy02739244/iori-nav/**

# frnav - 个人网址导航

<p align="center">
  一个优雅、快速、易于部署的书签（网址）收藏与分享平台，基于 Cloudflare Pages + Pages Functions + D1 + KV 构建，并在原项目基础上结合个人使用习惯持续二次开发。
</p>

<p align="center">
  <a href="https://github.com/frbico/frnav/stargazers"><img src="https://img.shields.io/github/stars/frbico/frnav?style=flat-square&logo=github&color=yellow" alt="Stars"></a>
  <a href="https://github.com/frbico/frnav/network/members"><img src="https://img.shields.io/github/forks/frbico/frnav?style=flat-square&logo=github&color=blue" alt="Forks"></a>
  <a href="https://github.com/frbico/frnav/blob/master/LICENSE"><img src="https://img.shields.io/github/license/frbico/frnav?style=flat-square&color=green" alt="License"></a>
  <a href="https://github.com/frbico/frnav/issues"><img src="https://img.shields.io/github/issues/frbico/frnav?style=flat-square&color=orange" alt="Issues"></a>
</p>

<p align="center">
  <a href="#-效果预览">效果预览</a> •
  <a href="#-核心特性">核心特性</a> •
  <a href="#-版本亮点">版本亮点</a> •
  <a href="#-frnav-的定制修改">frnav 定制</a> •
  <a href="#-快速部署">快速部署</a> •
  <a href="#-本地开发">本地开发</a> •
  <a href="#-环境变量说明">变量说明</a> •
  <a href="#-数据导入与导出">导入导出</a> •
  <a href="#-备份与恢复">备份恢复</a> •
  <a href="#-常见部署问题">常见问题</a> •
  <a href="#-技术栈">技术栈</a> •
  <a href="#-更新日志">更新日志</a>
</p>

<p align="center">
  <strong>🌐 当前个人部署示例：</strong>
  <a href="https://iori-nav-eql.pages.dev/">https://iori-nav-eql.pages.dev/</a>
</p>

> 上面的地址是当前个人部署示例，后续迁移到新的 Cloudflare 账号或自定义域名后可能变化。原项目在线体验请访问：<https://iori.hidns.vip/>。

---

## 🖼️ 效果预览

| 风格一 | 风格一 |
| :---: | :---: |
| ![风格一预览 1](./image/fengge1_1.png) | ![风格一预览 2](./image/fengge1_2.png) |

| 风格二 | 风格三 |
| :---: | :---: |
| ![风格二预览](./image/fengge2.png) | ![风格三预览](./image/fengge3.png) |

| 桌面设置界面 | 移动设置界面 |
| :---: | :---: |
| ![桌面设置界面预览](./image/setting.png) | ![移动设置界面预览](./image/phone_setting.png) |

后台设置页支持分别配置桌面端与手机端卡片，包括卡片列数、卡片风格、切换动画、是否隐藏描述/链接行/分类、毛玻璃效果、圆角以及标题和描述的字体样式。后台设置页面为 URL 后加 `/admin`。

| 手机端风格一 | 手机端风格二 | 手机端风格三 |
| :---: | :---: | :---: |
| ![手机端风格一预览](./image/phone_1.png) | ![手机端风格二预览](./image/phone_2.png) | ![手机端风格三预览](./image/phone_3.png) |

> 💡 手机端可独立设置 1/2/3 列布局，并根据卡片密度自动优化复制按钮显示；卡片的毛玻璃效果和程度也可以在后台设置里自定义。

---

## ✨ 核心特性

| 特性 | 说明 |
| :--- | :--- |
| 📱 **响应式设计** | 完美适配桌面、平板和手机等各种设备，桌面端与移动端可分别设置卡片布局 |
| 🎨 **主题美观** | 界面简洁优雅，支持夜间模式、壁纸、卡片样式、毛玻璃、圆角、字体等个性化设置 |
| 🔍 **快速搜索** | 内置站内模糊搜索，并支持可自定义的站外搜索引擎 |
| 📂 **分类清晰** | 通过多级分类组织书签，支持父子层级与私密分类 |
| 🔒 **安全后台** | 基于 KV 的管理员认证，提供完整的书签增删改查后台，并使用 HttpOnly 会话 Cookie |
| 📝 **用户提交** | 支持访客提交书签，经管理员审核后显示，可通过环境变量关闭，也可选配 Turnstile |
| ⚡ **性能卓越** | 利用 Cloudflare 边缘能力与 KV 首页缓存，减少 D1 数据库读取并提升加载速度 |
| 📤 **数据管理** | 支持书签数据导入与导出，兼容 Chrome 导出的 HTML、JSON，也可从公共书签库一键导入 |
| 💾 **备份恢复** | 支持 WebDAV 手动备份与恢复书签/分类数据，包含私密内容 |
| 🤖 **AI 描述** | 支持 Cloudflare Workers AI、Google Gemini 和 OpenAI 接口自动生成书签描述 |
| 🖼️ **Logo / Favicon** | 默认支持自动获取书签 Logo，同时支持后台自定义网站 Logo / Favicon |

---

## 🔄 版本亮点

以下能力来自原项目并保留在 `frnav` 中：

- 🛡️ **后台会话安全升级**：登录 `/admin` 后将颁发 HttpOnly 会话 Cookie（默认 1 天，可选 1/7/30/60/90 天），凭据不再暴露在 URL 中，并提供一键退出登录。
- 🧹 **输入与展示双重校验**：包含 URL 规范化、HTML 转义与排序值归一化逻辑，前后台共同减少脏数据和潜在 XSS 风险。
- 🔐 **访客投稿可控**：通过 `ENABLE_PUBLIC_SUBMISSION` 环境变量即可关闭前台投稿入口，相关接口会拒绝未启用的公开投稿。
- 🤖 **AI 一键自动生成描述**：提供 Workers AI、Google Gemini 和 OpenAI 接口。
- 🖼️ **Logo 自动生成**：默认使用 [faviconsnap.com](https://faviconsnap.com) 接口，可通过环境变量自定义。
- 📦 **导入导出数据**：提供书签数据导入与导出，支持 Chrome 导出的 HTML 格式一键导入，也可直接从[公共书签库](https://github.com/jy02739244/bookmark-library)选取现成书签集导入。

---

## 🧩 frnav 的定制修改

`frnav` 在原项目基础上结合个人使用习惯进行了持续二次开发，目前包含但不限于：

- 🔎 **可自定义搜索引擎**：后台可新增、删除、排序以及启用/停用站外搜索引擎，搜索 URL 使用 `{query}` 作为关键词占位符。
- 🔁 **搜索体验调整**：首页默认使用 Google / Bing / GitHub 等搜索入口，并兼容旧配置。
- 🖼️ **书签 Logo 透明背景优化**：透明 PNG / SVG 不再被灰白底影响，并使用更合适的显示方式避免图标裁切。
- 🌐 **网站 Logo / Favicon 可配置**：后台可填写 HTTPS 图标地址，也可上传 PNG/JPG/WebP/GIF/ICO 图片并恢复默认图标。
- 🎨 **后台与首页样式优化**：统一站点信息、网站图标、自定义搜索引擎等设置区域的字号与交互，并补充页脚 GitHub / 版权设置。
- 🧹 **缓存策略调整**：静态 JavaScript 资源采用更适合持续修改的缓存策略，首页 HTML 使用版本化 KV 缓存，关键改动可主动刷新缓存。
- 🔐 **私密分类祖先链保护**：匿名首页、分类列表、书签列表、单书签接口、批量操作与投稿审核都会考虑完整祖先分类链；私密祖先、孤儿分类、循环分类和异常脏数据默认 fail closed。
- 🧬 **D1 Schema 自动初始化与迁移**：新建空 D1 后，生产环境首次请求会自动创建基础表结构并执行增量迁移，无需在 Cloudflare 控制台手工执行 `schema.sql`。
- 🏷️ **首页标题与后台站点名一致**：浏览器 `<title>`、Open Graph 与 Twitter 标题直接使用后台设置的网站名称，不再自动追加“ - 网址导航”。
- 🔗 **项目链接独立化**：首页 GitHub 链接、README badges、Fork、License、Star History 等均指向 `frbico/frnav`。
- 🔒 **彻底移除上游自动同步工作流**：本仓库已脱离 GitHub Fork Network，不会自动同步或覆盖来自上游仓库的代码修改。

---

## 🚀 快速部署

> **准备工作**：你需要一个 [GitHub](https://github.com/) 账号和一个 [Cloudflare](https://dash.cloudflare.com/) 账号。
>
> 如果只是想使用原作者版本，请优先访问：<https://github.com/jy02739244/iori-nav/>。以下步骤仅用于部署本仓库 `frnav` 的定制版本。

### 步骤 1：Fork 本仓库

[![Fork on GitHub](https://img.shields.io/badge/Fork-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/frbico/frnav/fork)

点击上方 **“Fork on GitHub”**，将 `frbico/frnav` Fork 到你自己的 GitHub 账号，并可以顺手点一个 ⭐ Star。

例如你的 GitHub 用户名是 `example`，Fork 后应得到：

```text
example/frnav
```

> 对于其他 Cloudflare 账号，部署时应连接 **自己 Fork 后的仓库**，而不是直接选择 `frbico/frnav`。

### 步骤 2：部署到 Cloudflare Pages

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://dash.cloudflare.com/?to=/:account/pages/new/provider/github)

点击上方按钮跳转到 Cloudflare，然后进入 Pages 创建流程，连接 GitHub 并授权 Cloudflare Workers & Pages GitHub App，选择你刚才 Fork 的项目，例如：

```text
example/frnav
```

原项目 README 中的选择项目界面示意：

<img width="2252" height="1380" alt="选择项目" src="https://github.com/user-attachments/assets/0588e0d0-befb-4962-b422-922a8c895674" />

推荐构建配置：

```text
Production branch: master
Framework preset: None
Build command: exit 0
Build output directory: public
Root directory: 留空
```

其中最重要的是：

```text
Build output directory: public
```

原项目 README 中的构建设置示意：

<img width="2112" height="1404" alt="构建设置" src="https://github.com/user-attachments/assets/654a23af-d75f-477d-848e-fea8a41740dc" />

> `functions/` 位于仓库根目录，Cloudflare Pages 会将其作为 Pages Functions 使用，因此不要把 Root directory 改到 `public`。

### 步骤 3：创建 D1 数据库

1. 在 Cloudflare 控制台进入 `存储和数据库` → `D1 SQL 数据库`。
2. 点击 `创建数据库`。
3. 数据库名称可输入：

```text
book
```

<img width="2836" height="1298" alt="创建D1数据库" src="https://github.com/user-attachments/assets/644032c6-304c-46cc-b039-9eafbc6f7a6b" />

`frnav` 在生产环境支持运行时自动初始化 / 迁移 Schema，因此创建空数据库即可，不需要先手工导入 `schema.sql`。

### 步骤 4：创建 KV 存储

1. 在 Cloudflare 控制台进入 `存储和数据库` → `Worker KV`。
2. 点击 `创建命名空间`，名称可以输入：

```text
NAV_AUTH
```

3. 创建后，在此 KV 中添加两个条目作为后台登录凭据：

```text
admin_username = 你的管理员用户名
admin_password = 你的管理员密码
```

例如：

```text
admin_username = admin
admin_password = 你自己设置的强密码
```

<img width="2810" height="1188" alt="设置KV条目" src="https://github.com/user-attachments/assets/2114e42b-03d2-400f-a8f8-54dc156a7922" />

> `admin_username` 与 `admin_password` 是代码实际读取的 KV Key，名称不要修改。

### 步骤 5：绑定服务

进入刚刚创建的 Pages 项目 → `设置` → `绑定`，添加：

**D1 数据库：**

```text
变量名称：NAV_DB
D1 数据库：book
```

**KV 命名空间：**

```text
变量名称：NAV_AUTH
KV 命名空间：NAV_AUTH
```

如需使用 Cloudflare Workers AI，继续添加：

```text
类型：Workers AI
变量名称：AI
```

<img width="2152" height="1236" alt="绑定服务" src="./image/bind.png" />

> 绑定变量名必须保持为 `NAV_DB`、`NAV_AUTH`、`AI`，因为代码通过这些名称访问对应资源。

### 步骤 6：重新部署并初始化

添加或修改 Bindings 后，需要重新部署：

1. 打开 Pages 项目的 **部署** 页面。
2. 找到最新部署并选择 **重新部署**。
3. 等待部署成功。
4. 打开新的 `*.pages.dev` 首页一次。
5. 首次正常请求会自动创建 / 迁移 D1 Schema。
6. 访问：

```text
https://你的域名/admin
```

7. 使用 KV 中的 `admin_username` 和 `admin_password` 登录。

<img width="2482" height="1374" alt="重新部署" src="https://github.com/user-attachments/assets/d2f12af3-9aba-458e-9d16-00f7468c22e9" />

部署完成后即可继续绑定自定义域名。

---

## 🧪 本地开发

> 本地开发依赖 `wrangler.toml`。仓库提供可提交的 `wrangler.example.toml` 模板，真实配置文件仍会被 `.gitignore` 忽略，避免误提交资源 ID 或密钥。

```bash
# 安装依赖（TailwindCSS / Husky）
npm install

# 复制本地配置模板，并填入你自己的 D1/KV 资源 ID
cp wrangler.example.toml wrangler.toml

# 构建 CSS（首次或修改 tailwind.css 后执行）
npm run build:css

# 启动本地开发服务器
npm run dev

# 本地执行数据库 schema（可选）
npx wrangler d1 execute book --local --file=schema.sql
```

运行项目检查 / 测试：

```bash
npm run check
```

> 本地开发时 `wrangler.example.toml` 中的 D1 / KV ID 只是占位符，需要替换为你自己的配置；不要提交真实密钥或资源 ID。

---

## 🔑 环境变量说明

### 1) 必需绑定（Pages 项目设置 → 绑定）

| 绑定名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `NAV_DB` | D1 | 主数据库绑定（必需） |
| `NAV_AUTH` | KV | 管理员认证、会话、限流、首页缓存与缓存标记等存储（必需） |

### 2) 条件绑定（Pages 项目设置 → 绑定）

| 绑定名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `AI` | Workers AI | 使用 Cloudflare Workers AI 生成描述时必需 |

### 3) 可选变量（Pages 项目设置 → 变量和机密）

| 变量名 | 默认值 | 说明 |
| :--- | :--- | :--- |
| `ENABLE_PUBLIC_SUBMISSION` | `false` | 是否允许访客投稿 |
| `SITE_NAME` | `灰色轨迹` | 首页站点名称（环境变量兜底）；后台 `home_site_name` 设置优先 |
| `SITE_DESCRIPTION` | `一个优雅、快速、易于部署的书签（网址）收藏与分享平台，完全基于 Cloudflare 全家桶构建` | 首页副标题（环境变量兜底） |
| `FOOTER_TEXT` | `曾梦想仗剑走天涯` | 首页页脚文案（环境变量兜底） |
| `ICON_API` | `https://faviconsnap.com/api/favicon?url=` | 自动补全书签 Logo 的接口前缀 |
| `AI_REQUEST_DELAY` | `1500` | AI 一键补全描述调用间隔（毫秒） |
| `WORKERS_AI_MODEL` | `@cf/google/gemma-4-26b-a4b-it` | Workers AI 模型部署级兜底；后台 AI 设置中保存的模型优先 |
| `TURNSTILE_SITE_KEY` | 空 | Cloudflare Turnstile Site Key；与 `TURNSTILE_SECRET_KEY` 同时配置后启用后台登录与公开投稿人机验证 |
| `TURNSTILE_SECRET_KEY` | 空 | Cloudflare Turnstile Secret Key；与 `TURNSTILE_SITE_KEY` 同时配置后启用后台登录与公开投稿人机验证 |

> `DISPLAY_CATEGORY` 已废弃，当前版本不会读取该变量。

### 4) 配置优先级说明

- 首页名称、副标题、页脚等已经支持后台设置的字段，优先读取 D1 `settings` 中的后台配置，环境变量作为兜底。
- `AI_REQUEST_DELAY` 在代码中的默认兜底为 `1500`；可按对应 API 限频自行调整。
- Workers AI 的模型可以在后台 AI 设置中手动填写，需要使用 Workers AI 的 `@cf/...` 模型名。
- Workers AI 可尝试：`@cf/google/gemma-4-26b-a4b-it`（默认）、`@cf/mistralai/mistral-small-3.1-24b-instruct`、`@cf/qwen/qwq-32b`、`@cf/qwen/qwen3-30b-a3b-fp8`、`@cf/meta/llama-3.1-8b-instruct-fp8`。其他模型请根据 Cloudflare 当前可用模型自行测试。

> **💡 提示**：如使用 Gemini 免费 API Key，请根据 Google 当前限频与所选模型实际情况调整 `AI_REQUEST_DELAY`。原项目文档以 `gemini-2.5-flash-lite` 的 15 次/分钟作为示例；限额可能随 Google 政策变化。

### 🔐 管理后台

> 后台管理页面地址：`https://你的域名/admin`

后台登录凭据存放在 `NAV_AUTH` KV 中：

```text
admin_username
admin_password
```

登录 `/admin` 时在页面表单中输入账号和密码。验证成功后，系统返回 **HttpOnly 会话 Cookie**，默认 1 天，也可选择 1 / 7 / 30 / 60 / 90 天。无需也不再支持在 URL 查询参数中传递后台凭据。

点击后台右上角 **“退出登录”** 即可销毁当前会话。

如需给后台登录与公开投稿增加 Cloudflare Turnstile 人机验证，请在 Cloudflare Turnstile 控制台创建站点，然后配置：

```text
TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
```

两个变量都为空时保持普通登录 / 投稿流程；只配置其中一个时会提示配置不完整。

---

## 📦 数据导入与导出

在后台点击 **导入** 后，会先选择导入来源：**上传文件** 或 **公共书签库**。两种来源都会进入同一个导入预览页，可以勾选需要的书签、选择目标分类，确认后再写入数据库。

### 方式一：上传文件

支持两种格式：

- **Chrome 书签 HTML**：浏览器「书签管理器 → 导出书签」得到的文件，书签栏文件夹层级会被解析成分类。
- **JSON**：结构与项目的 **导出** 功能一致，例如：

```json
{
  "category": [],
  "sites": []
}
```

导入时同一 URL 只会保留一条。比对时会忽略末尾斜杠，因此：

```text
https://example.com/
https://example.com
```

会被视为同一个 URL。选择覆盖已有书签时，原有排序值会保留，不会被打乱。

### 方式二：公共书签库

公共书签库是一个独立维护的书签集合仓库，按主题分成若干书签库（如开发工具、设计资源等），可以直接选一个整包导入，省去从零收集。

> **仓库地址**：<https://github.com/jy02739244/bookmark-library>

后台会先读取仓库根目录的 `index.json` 清单，列出可选书签库及其书签条数；点选后再读取对应书签 JSON 并进入导入预览。

数据通过 [jsDelivr](https://www.jsdelivr.com/) CDN 读取；CDN 不可用时自动回退到 `raw.githubusercontent.com`。

这两个域名都是公开只读访问，无需 Token；但请求由**浏览器**发出，如果所在网络无法访问 GitHub 与 jsDelivr，书签库列表会加载失败，此时请改用上传文件方式。

欢迎向原公共书签库仓库提交 PR 补充书签库。

---

## 💾 备份与恢复

`frnav` 额外保留并完善了 WebDAV 手动备份 / 恢复能力。

### WebDAV 备份实际包含什么

当前 WebDAV 备份会导出：

- `category`：分类数据，包含私密分类。
- `sites`：书签数据，包含私密书签。

> **重要**：当前 WebDAV 备份以及标准书签 JSON 导出并不是完整的 D1 `settings` 备份。网站名称、网站 Logo / Favicon、壁纸、卡片样式、自定义搜索引擎、AI 配置、WebDAV 配置等后台设置不会随 `category + sites` 备份自动迁移。

### 从旧 Cloudflare 账号迁移到新账号

推荐流程：

1. 在旧站后台执行 WebDAV 备份，或导出最新书签 JSON。
2. Fork / 部署 `frnav` 到新的 GitHub + Cloudflare 环境。
3. 创建并绑定新的 `NAV_DB` 与 `NAV_AUTH`。
4. 重新部署并访问首页，让新 D1 自动初始化。
5. 登录新站 `/admin`。
6. 如果通过 WebDAV 恢复，请在新站后台重新填写与旧站相同的 WebDAV 地址、用户名、密码和目录。
7. 打开备份列表，选择旧站创建的备份进行恢复；或者使用 JSON 导入。
8. 核对分类、书签、私密状态与层级关系。
9. 网站设置、Logo/Favicon、搜索引擎、壁纸、样式等没有包含在书签备份里的配置，需要重新设置或另行迁移。
10. 全部确认正常后再切换正式域名。

为了降低迁移风险，旧 Cloudflare 项目和旧 D1 在新站验证完成前先不要删除。

---

## ❗ 常见部署问题

- **`/admin` 无法登录或反复跳回登录页**：确认已绑定 `NAV_AUTH`，并在该 KV 中创建 `admin_username`、`admin_password`；绑定之后记得重新部署。
- **首页 500 或数据为空**：确认 `NAV_DB` 已正确绑定到 D1 数据库，并且 `NAV_AUTH` 也已绑定。`frnav` 生产环境会在首次请求自动初始化 / 迁移 Schema，一般不需要手工执行 `schema.sql`。
- **首次部署后数据库还是空的**：Bindings 配好并重新部署后，主动访问首页一次触发运行时 Schema 初始化，然后再进入 `/admin`。
- **前台看不到投稿入口**：确认 `ENABLE_PUBLIC_SUBMISSION=true`。代码会将环境变量转换后判断是否启用。
- **配置 Turnstile 后无法登录 / 投稿**：确认 `TURNSTILE_SITE_KEY` 与 `TURNSTILE_SECRET_KEY` 两项同时设置，而且 Turnstile 域名配置包含当前站点域名。
- **使用 Workers AI 报 `env.AI not found`**：在 Pages 项目中添加 Workers AI Binding，变量名称必须为 `AI`，随后重新部署。
- **修改了 `public/css/tailwind.css` 但样式未生效**：先执行 `npm run build:css`，提交生成后的 CSS，再重新部署。
- **改了代码但首页还是旧内容**：浏览器可能存在缓存，同时首页 HTML 也使用 KV 版本缓存。确认部署已更新到最新 commit；涉及 SSR 首页结构时需要同步更新首页缓存版本或通过后台缓存机制使旧缓存失效。
- **其他 Cloudflare 账号看不到 `frbico/frnav`**：先把仓库 Fork 到该 GitHub 账号，再让该 Cloudflare 账号连接自己的 `username/frnav`。

---

## 🔧 技术栈

| 类别 | 技术 |
| :--- | :--- |
| **计算** | [Cloudflare Workers / Pages Functions](https://developers.cloudflare.com/pages/functions/) |
| **数据库** | [Cloudflare D1](https://developers.cloudflare.com/d1/) |
| **存储** | [Cloudflare KV](https://developers.cloudflare.com/workers/runtime-apis/kv/) |
| **前端框架** | [TailwindCSS](https://tailwindcss.com/) + 原生 JavaScript / HTML |

---

## 📋 更新日志

### frnav 二次开发补充

- 🧰 **2026-09-16**：仓库脱离 GitHub Fork Network 并更名为 `frbico/frnav`；移除上游自动同步工作流；README、首页 GitHub 链接、项目包名等完成独立化；首页标题与后台网站名称保持一致。
- 🔐 **2026-09-15**：加强私密分类完整祖先链保护，覆盖首页、分类、单书签读取、批量操作、投稿与审核；修复异常隐私标记并补充迁移修复逻辑。
- 🧭 **2026-09-15**：完善可自定义搜索引擎、Bing 相关搜索体验、网站 Logo/Favicon、自定义页脚、缓存与后台设置体验。

### 原项目历史更新日志

<!-- changelog:start -->
- 📂 **2026-07-14**：增加卡片风格三，风格增加默认壁纸
- 🔧 **2026-06-23**：清理 AI 设置调试日志
- 📂 **2026-06-21**：增强分类结构与私密数据支持
- 🛡️ **2026-06-20**：优化登录会话与安全防护
- 📦 **2026-06-09**：增强导入导出与批量管理能力
- 🎨 **2026-06-08**：优化卡片样式与后台界面体验
- 🎨 **2026-06-07**：增加手机卡片设置
- 🎨 **2026-06-06**：首页设置预览与页脚优化
- 🎞️ **2026-06-05**：新增卡片动画并隐藏图标
- 🔧 **2026-05-28**：拆分设置模块并补充测试
- 🛡️ **2026-05-06**：完善投稿审核与安全校验
- 🐞 **2026-05-05**：修复后台HTML转义
- 🔧 **2026-04-20**：补缓存头并清理资源
- 🔧 **2026-04-19**：精简字体与后台逻辑
- ⚡ **2026-04-17**：深度优化首页性能
- ⚡ **2026-03-31**：优化查询与缓存一致性
- 🐞 **2026-03-27**：稳定首页缓存与搜索
- 🛡️ **2026-03-15**：增加CSRF安全防护
- 🛡️ **2026-03-14**：强化SQL注入防护
- 🔧 **2026-03-07**：统一数据库迁移流程
- 🖼️ **2026-03-04**：更新图标获取接口
- ⚡ **2026-02-26**：优化首页交互与文档
- ⚡ **2026-02-24**：优化缓存策略并提升加载性能
- 🖼️ **2026-02-23**：优化壁纸功能与加载体验，并补充文档说明
- 🐞 **2026-01-24**：修复若干问题并提升稳定性，并加强登录安全
- ⚡ **2026-01-20**：优化缓存策略并提升加载性能
- ⚡ **2026-01-19**：优化缓存策略并提升加载性能
- 🔧 **2026-01-16**：美化后台管理界面，隐藏待审核列表
- 🎨 **2026-01-15**：优化卡片样式与后台界面体验
- ⚡ **2026-01-10**：优化缓存策略并提升加载性能
- 🧰 **2025-12-30**：更新文档与部署使用说明
- 🐞 **2025-12-29**：修复若干问题并提升稳定性
- 📦 **2025-12-27**：增强导入导出与批量管理能力
- 📂 **2025-12-25**：增强分类结构与私密数据支持
- 🖼️ **2025-12-24**：优化壁纸功能与加载体验
- 📦 **2025-12-23**：增强导入导出与批量管理能力，并增强分类能力
- 🐞 **2025-12-22**：修复若干问题并提升稳定性
- 🎨 **2025-12-20**：优化卡片样式与后台界面体验，并修复多项问题
- 📂 **2025-12-19**：增强分类结构与私密数据支持，并修复多项问题
- 🎨 **2025-12-18**：优化卡片样式与后台界面体验，并增强分类能力
- 🧰 **2025-12-14**：更新文档与部署使用说明
<!-- changelog:end -->

---

## 🌟 贡献

本仓库主要用于个人定制维护，但仍保留原项目 README 中的标准 GitHub 贡献流程。如果你希望针对 `frnav` 提交修改，可以：

1. Fork 本仓库。
2. 创建功能分支：`git checkout -b feature/amazing-feature`。
3. 提交更改：`git commit -m 'Add some amazing feature'`。
4. 推送到你的分支：`git push origin feature/amazing-feature`。
5. 创建 Pull Request。

原项目也欢迎通过 Issue 或 Pull Request 贡献代码、提出问题或建议：<https://github.com/jy02739244/iori-nav/>。

---

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证，并保留原项目许可与相关版权信息。

---

## 🙏 致谢

`frnav` 基于 [jy02739244/iori-nav](https://github.com/jy02739244/iori-nav/) 持续二次开发。

- **原项目作者**：[@灰色轨迹](https://github.com/jy02739244)
- **原项目地址**：<https://github.com/jy02739244/iori-nav/>
- **原公共书签库**：<https://github.com/jy02739244/bookmark-library>

感谢原作者提供完整的项目基础、功能设计和 MIT 开源许可。

本仓库已完成 GitHub Fork Network 分离，并移除上游自动同步工作流；现在作为独立仓库维护，但这不改变其基于原项目二次开发的事实。

---

## 📞 联系方式 / 项目信息

- **frnav 维护者**：[@frbico](https://github.com/frbico)
- **frnav 项目链接**：<https://github.com/frbico/frnav>
- **frnav Issues**：<https://github.com/frbico/frnav/issues>
- **原项目作者**：[@灰色轨迹](https://github.com/jy02739244)
- **原项目链接**：<https://github.com/jy02739244/iori-nav/>

<p align="center">如果这个项目对你有帮助，欢迎给它一个 ⭐️；如果你需要通用版本，请优先支持原项目。</p>

## ⭐ Star 趋势

[![Star History Chart](https://star-history.dera.page/svg?repos=frbico/frnav)](https://star-history.dera.page/#frbico/frnav)
