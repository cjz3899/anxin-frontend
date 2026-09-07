# 24h Fitness 小程序

## 📋 项目概述

这是一个基于 Taro + React 的微信小程序项目，为健身房提供用户端服务。

## 技术栈

- Nodejs v20（使用 pnpm 管理依赖）
- Taro 4.1.6
- React 18
- NutUI（Taro 版）
- TailwindCSS 3.x
- TypeScript 5.x
- Less（样式预处理器）

## 开发须知

### 业务开发规范

- **请求封装**：所有请求都使用 `src/utils/request.ts` 中的 `request` 函数，统一请求返回格式处理
- **颜色规范**：引用 `config/theme/specification.ts` 中的 `SpecificationColors` 规范颜色
- **TailwindCSS**：直接使用规范颜色，不需要考虑颜色值，直接使用规范颜色即可（与设计稿一致）
- **NutUI 样式**：不需要考虑颜色尺寸等与 UI 不一致的问题，直接使用即可，有问题后续会在 `app.less` 中统一修改
- **尺寸规范**：暂时不需要考虑规范化尺寸，按设计稿进行开发即可
- **组件优先**：【重要】组件开发优先，可以使用 NutUI 组件就不要手绘

### 代码规范

#### 1. EditorConfig（编辑器配置）

项目使用 `.editorconfig` 统一不同编辑器的基本配置：

- 缩进风格：空格
- 缩进大小：2 个空格
- 字符编码：UTF-8
- 自动删除行尾空格
- 文件末尾插入空行

#### 2. Prettier（代码格式化）

项目使用 Prettier 自动格式化代码，主要规则：

- **不使用分号** (`semi: false`)
- **使用单引号** (`singleQuote: true`)
- **每行最多 100 字符** (`printWidth: 100`)
- **2 个空格缩进** (`tabWidth: 2`)
- **ES5 风格尾随逗号** (`trailingComma: 'es5'`)
- **箭头函数单参数不加括号** (`arrowParens: 'avoid'`)
- **Unix 风格换行符** (`endOfLine: 'lf'`)

#### 3. ESLint（代码检查）

项目继承以下 ESLint 配置：

- `taro/react`: Taro React 项目规则
- `plugin:prettier/recommended`: Prettier 集成规则

特殊规则：

- React 17+ 不需要显式引入 React (`react/react-in-jsx-scope: off`)
- Prettier 格式问题视为错误 (`prettier/prettier: error`)

#### 4. TypeScript 配置

- **目标版本**：ES2017
- **模块系统**：CommonJS
- **严格检查**：
  - `noUnusedLocals: true` - 不允许未使用的局部变量
  - `noUnusedParameters: true` - 不允许未使用的参数
  - `strictNullChecks: true` - 严格空值检查
- **JSX 支持**：`react-jsx` (React 17+ 自动导入)
- **路径解析**：基于项目根目录

### Git 提交规范

#### Commit Message 格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范：

```text
<type>(<scope>): <subject>

<body>

<footer>
```

#### Type 类型（必填）

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档变更
- `style`: 代码格式（不影响代码运行的变动）
- `refactor`: 重构（既不是增加功能，也不是修复 bug）
- `perf`: 性能优化
- `test`: 增加测试
- `chore`: 构建过程或辅助工具的变动
- `revert`: 回退
- `release`: 发布

#### Scope 范围（可选）

提交影响的范围，如：`components`、`utils`、`pages`、`config` 等

#### 示例

✅ **正确的提交信息：**

```bash
git commit -m "feat: 添加用户登录功能"
git commit -m "fix: 修复页面加载失败的问题"
git commit -m "docs: 更新 README 文档"
git commit -m "feat(pages): 添加首页轮播图组件"
git commit -m "refactor(utils): 重构请求封装方法"
```

❌ **错误的提交信息：**

```bash
git commit -m "添加新功能"          # 缺少 type
git commit -m "update"              # type 错误且描述不清晰
git commit -m "Fix bug"             # type 应该小写
```

### Git Hooks 自动化

项目配置了 Husky + lint-staged，在提交代码时会自动执行：

#### pre-commit（提交前）

- 对暂存的 `.js,.jsx,.ts,.tsx` 文件运行 ESLint 自动修复
- 对暂存的代码文件运行 Prettier 格式化
- 对暂存的 `.less,.css` 样式文件运行 Prettier 格式化
- 对暂存的 `.json,.md` 文件运行 Prettier 格式化

#### commit-msg（提交信息验证）

- 验证提交信息是否符合 Conventional Commits 规范
- 如果格式不正确，提交会被阻止

### 目录结构

```text
src/
├── app.config.ts          # 应用配置
├── app.less               # 全局样式
├── app.tsx                # 应用入口
├── constants/             # 常量定义
│   └── index.ts
├── hooks/                 # 自定义 Hooks
│   └── useLocale.tsx
├── pages/                 # 页面目录
│   └── index/
│       ├── index.config.ts
│       ├── index.less
│       └── index.tsx
├── services/              # API 服务
│   └── demo.ts
├── utils/                 # 工具函数
│   ├── index.ts
│   └── request.ts         # 统一请求封装
├── typing.d.ts            # 类型声明
└── index.html             # H5 入口（仅 H5 使用）
```

## 快速起步

### 安装依赖

```bash
pnpm install
```

### 开发命令

```bash
# 微信小程序 - 默认环境
pnpm dev:weapp

# 微信小程序 - 本地环境
pnpm dev:weapp:local

# 微信小程序 - 测试环境
pnpm dev:weapp:test

# 微信小程序 - 生产环境
pnpm dev:weapp:prod
```

### 构建命令

```bash
# 微信小程序 - 默认环境
pnpm build:weapp

# 微信小程序 - 测试环境
pnpm build:weapp:test

# 微信小程序 - 生产环境
pnpm build:weapp:prod
```

### 代码检查与格式化

```bash
# 运行 ESLint 检查
pnpm lint

# 运行 ESLint 并自动修复
pnpm lint:fix

# 格式化所有代码
pnpm format
```

## IDE 配置建议

### VSCode 推荐插件

- **ESLint**: 实时显示 ESLint 错误
- **Prettier - Code formatter**: 保存时自动格式化
- **EditorConfig for VS Code**: 支持 .editorconfig
- **Conventional Commits**: 辅助编写符合规范的提交信息
- **Tailwind CSS IntelliSense**: TailwindCSS 智能提示

### VSCode 配置

在项目根目录创建 `.vscode/settings.json`：

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],
  "files.eol": "\n",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## 常见问题

### 1. 提交时代码格式检查失败

**原因**：代码存在格式或语法问题

**解决方法**：

```bash
# 自动修复
pnpm lint:fix
pnpm format

# 重新提交
git add .
git commit -m "feat: 你的提交信息"
```

### 2. 提交信息验证失败

**原因**：提交信息不符合 Conventional Commits 规范

**解决方法**：使用正确的格式，例如：

```bash
git commit -m "feat: 添加新功能"
git commit -m "fix: 修复某个问题"
```

### 3. Git Hooks 不生效

**原因**：可能是首次克隆项目后 husky 未正确初始化

**解决方法**：

```bash
# 重新安装依赖
pnpm install

# 或手动初始化 husky
pnpm prepare
```

## 相关文档

- [Taro 文档](https://taro-docs.jd.com/)
- [React 文档](https://react.dev/)
- [NutUI 文档](https://nutui.jd.com/)
- [TailwindCSS 文档](https://tailwindcss.com/)
- [TypeScript 文档](https://www.typescriptlang.org/)
- [Conventional Commits 规范](https://www.conventionalcommits.org/zh-hans/)
- [ESLint 文档](https://eslint.org/)
- [Prettier 文档](https://prettier.io/)
