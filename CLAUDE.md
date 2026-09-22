# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目定位

微信小程序「安心文档分析」：用户上传 PDF / Word / 图片，后端做 OCR + AI 风险分析，前端展示分析进度、风险报告与基于原文的智能问答。技术栈 Taro 4.1.6 + React 18 + TypeScript + Less + NutUI（Taro 版），包管理 pnpm。

仓库内的 `AGENT.md` 是作者写给 AI 的前端开发约定（分支流程、Token 规则、组件优先级、可访问性、完成标准），**比本文件更具约束力，修改代码前必须阅读**。本文件补充的是跨文件才能看出的架构与命令细节。

## 常用命令

```bash
pnpm install

# 开发（watch）：默认 / 本地 / 测试 / 生产
pnpm dev:weapp            # 其余为 dev:weapp:local | :test | :prod
pnpm build:weapp          # 其余为 build:weapp:test | :prod

# 全量验证（提交前必须执行，AGENT.md 的完成标准）
pnpm verify
```

`pnpm verify` = `typecheck && test && lint && check:design-system && build:weapp && check:weapp-runtime && check:weapp-size`。后两项**读取 `dist/` 产物**（`dist/taro.js`、`dist/app-origin.wxss`），必须先构建；单独调试它们时先跑一次 `pnpm build:weapp`。

```bash
# 测试：node:test 直接跑 .mts，无需构建
pnpm test                                  # node --test tests/*.test.mts
node --test tests/files-model.test.mts     # 单个文件
node --test --test-name-pattern="标签过滤" tests/*.test.mts   # 单个用例

pnpm typecheck        # tsc --noEmit
pnpm lint / lint:fix
pnpm check:design-system
pnpm format
```

构建变量由 `cross-env` 注入 → `config/index.ts` 的 `defineConstants` → `process.env.*`，项目没有 dotenv。三个都可选：`API_BASE_URL` 一旦注入，`request.ts` 就改走 http 直连（本地联调用，见 `pnpm dev:weapp:local`）；不注入即走云托管内网 `callContainer`，环境 ID 与服务名的默认值在 `src/constants/index.ts`，需要覆盖时用 `CLOUDRUN_ENV` / `CLOUDRUN_SERVICE`。

## 架构要点

### 可测逻辑必须与 Taro 运行时解耦

这是本项目最重要的一条结构约定：**测试用 `node:test` 直接 import `.ts` 源码（依赖 Node 的类型擦除），因此任何被测试的模块都不能 import `@tarojs/*` 或 React**。为此项目固定做了两层拆分：

- `src/utils/*-core.ts`：纯函数（`request-core.ts` 的 `parseApiResponse` / `getErrorMessage`、`protected-navigation-core.ts` 的 `createProtectedNavigator`），依赖通过参数注入；对应的 `request.ts` / `protected-navigation.ts` 只负责把 Taro API 绑上去。
- `src/pages/<page>/model.ts`：页面的筛选、徽标映射、格式化等纯逻辑（见 `src/pages/files/model.ts`），页面组件只做渲染。

新增业务逻辑时沿用这个模式：逻辑进 `model.ts` / `*-core.ts` 并在 `tests/` 加用例，页面组件里只留渲染与 Taro 调用。

### 请求与登录态

- 后端统一响应包 `{ code, data, msg }`，**`code === 1` 才是成功**；`request<T>()` 直接 resolve `data`，失败时 toast 并 reject。
- 所有请求必须走 `src/utils/request.ts` 的 `request` / `upload`（接口服务层已封装，页面不要直接调 `Taro.request`）。
- Token 只通过 `authorization` 请求头发送（`request-auth.ts`），且**仅在 token 非空时携带**。
- 登录过期判定：HTTP 401 或业务码 `10005`（`request.ts` 中 `AUTH_EXPIRED_CODE`）→ `expireAuthSession` 清空 `accessToken` / `refreshToken` / `userId` / `loginProfile` 四个 storage key 并提示。
- **按需登录**：启动时不登录。跳转受保护页面走 `openProtectedPage(url)`，内部若无 accessToken 则 `Taro.login` → `POST /api/user/login` 换双 Token 再跳转；并发调用会复用同一个进行中的登录 Promise。
- 本地存储 key 统一定义在 `src/constants/index.ts` 的 `STORAGE_KEYS`，不要散落字面量。

### 服务层

`src/services/index.ts` 是统一出口，聚合 `user` / `document` / `chat`，页面一律 `import { xxx } from '../../services'`。每个服务文件同时承载**接口函数**和**后端 VO 类型定义**，类型注释标注了对应的后端 VO 名。

注意：`services/index.ts` 顶部注释写的 `@/services` 别名**并不存在**（`tsconfig.json` 无 `paths`，`config/index.ts` 无 alias），实际全部使用相对路径。

### 后端状态命名兼容

后端 TaskStatus 存在两版命名，前端多处做兼容，改状态判断时不要只认一套：

- 分析中：`PROCESSING` | `ANALYZING`（另加 `PENDING` 排队）
- 已完成：`SUCCESS` | `COMPLETED`

相关判断散布在 `services/document.ts`、`pages/files/model.ts`（`isAnalyzingStatus` 等）、`pages/analysis/index.tsx`。风险等级额外有 `NONE`（未识别到风险条款），展示为「已完成」而非某档风险。

### 路由与页面

- 页面注册在 `src/app.config.ts`，顺序即路由；**每个页面目录必须有 `index.config.ts`**（`definePageConfig`，至少含标题）。
- `pages/test/index.tsx`（「接口测试」）是注册在生产路由里的联调页，串起 login / refresh / profile / avatar 全流程，改动登录相关逻辑时可作参考，勿误当作正式页面。
- 页面容器统一用 `PageShell`（自带底部导航与安全区），按钮统一用 `AppButton`（`variant` 映射 NutUI 的 type/fill，禁止在页面直接写 NutUI Button 的样式组合）。
- 底部导航是自绘 `BottomNav` + `redirectTo`，不是原生 tabBar，导航项与 URL 在 `components/bottom-nav/controller.ts`。
- 沉浸式页面（如首页）用 `utils/custom-navigation.ts` 按胶囊按钮位置计算顶部内边距。

### 样式三层结构

`src/styles/primitives.less`（原始色值 `@ax-blue-500` 等）→ `tokens.less`（`--ax-*` 语义 Token，定义在 `page` 选择器上）→ `theme.less`（把 `--nutui-*` 变量映射到 `--ax-*`，NutUI 组件因此自动继承主题）。

业务 Less **只允许 `var(--ax-*)`**，新增颜色 / 阴影 / 尺度必须回到 primitives + tokens 两层加 Token。

### NutUI 引入方式与小程序的硬约束

NutUI 样式必须**按组件路径**引入，例如：

```ts
import Button from '@nutui/nutui-react-taro/dist/es/packages/button'
import '@nutui/nutui-react-taro/dist/es/packages/button/style/css'
```

全量导入 `@nutui/nutui-react-taro/dist/style.css` 被 `scripts/design-system-rules.mjs` 直接判失败——因为微信小程序 wxss 有体积上限，`pnpm check:weapp-size` 强制 `dist/app-origin.wxss` < 244 KiB。新增 NutUI 组件时，样式 import 记得同时加到 `src/app.tsx`（或用到的页面）。

`scripts/check-weapp-runtime.mjs` 另外校验 `dist/taro.js` 中 `@tarojs/plugin-html` 是否把 NutUI 图标的根标签映射成了小程序原生 text 节点（图标渲染依赖该适配）。

### 设计系统检查器会拦下的东西

`pnpm check:design-system` 扫描 `src/**/*.{less,ts,tsx}`，以下一律失败：

- `src/styles/` 之外的 `.less` 里出现原始色值（`#xxx`、`rgb()`、`hsl()`）
- 任何 `.less` 里的 `*` 通配选择器（WXSS 不支持）
- 全量 NutUI 样式导入
- 已废弃的 `SpecificationColors` 引用

## 代码注释

**注释一律使用中文**，与仓库现有风格保持一致（后端 VO 类型、状态兼容原因、Taro 绑定层等位置都写明了"为什么"，而非复述代码）。注释只写从代码本身看不出的信息：后端字段约定、双命名兼容、平台限制等；不要给显而易见的赋值或渲染加注释。

## 交付流程（来自 AGENT.md）

改任何文件前先建分支：`feat/*`、`fix/*`、`refactor/*`，一个分支一个主题，不顺带格式化无关文件。完成后本地提交并给出变更摘要、自动检查结果、人工验收说明；**等用户明确确认后**才 push 与创建 PR，PR 只创建不自动合并。

提交信息遵循 Conventional Commits（`feat:` / `fix:` / `docs:` …），husky + lint-staged 会在 pre-commit 跑 eslint --fix 与 prettier，commit-msg 校验格式。

交互与可访问性底线：主要触控目标 ≥ `88rpx`（`--ax-size-touch`）；风险 / 成功 / 警告等状态不能只靠颜色区分，必须同时有文字或图标（`StatusTag` 已内置图标）；异步操作要有加载与禁用态防止重复提交。
