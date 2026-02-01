# Web Embedding

一款受 Android ActivityEmbedding 启发的桌面分屏应用，让用户能够自由定制多窗口布局，实现高效的多任务并行处理。

## 项目愿景

在现代桌面工作流中，用户经常需要同时查看和操作多个 Web 应用或内容。本项目旨在提供一种灵活的分屏解决方案，允许用户：

- **自由定义分屏布局**：支持多种分屏模式（左右分屏、上下分屏、多窗口网格等）
- **独立管理每个窗口**：每个分屏区域都可以加载不同的 Web 内容或应用
- **实时调整布局**：通过拖拽分割线动态调整各区域大小
- **保存与恢复布局**：保存常用的分屏配置，快速切换工作场景

## 技术栈

- **Electron**：跨平台桌面应用框架
- **React 19**：现代 UI 库，配合 Hooks 实现响应式交互
- **TypeScript**：类型安全的开发体验
- **Tailwind CSS v4**：原子化 CSS 样式方案
- **React Router v7**：应用路由管理

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

启动后应用将以开发模式运行，支持热更新（HMR）。

### 代码规范

项目配置了 ESLint 和 Prettier，提交前请确保代码符合规范：

```bash
# 格式化代码
npm run format

# 检查代码规范
npm run lint

# 类型检查
npm run typecheck
```

## 构建与打包

### Windows

```bash
npm run build:win
```

### macOS

```bash
npm run build:mac
```

### Linux

```bash
npm run build:linux
```

### 仅构建（不打包安装程序）

```bash
npm run build:unpack
```

## 项目结构

```
src/
├── main/           # Electron 主进程
│   └── index.ts    # 主进程入口，负责窗口管理
├── preload/        # 预加载脚本（安全桥接）
│   └── index.ts
└── renderer/       # 渲染进程（React 应用）
    └── src/
        ├── components/   # 可复用组件
        ├── pages/        # 页面组件
        ├── App.tsx       # 根组件
        └── main.tsx      # 渲染器入口
```

## 推荐开发工具

- [VS Code](https://code.visualstudio.com/) - 代码编辑器
- [ESLint 插件](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) - 代码规范检查
- [Prettier 插件](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) - 代码格式化

## 开发计划

- [x] 基础框架搭建（Electron + React + TypeScript）
- [x] 基础分屏布局实现（左右分屏）
- [ ] 支持上下分屏模式
- [ ] 支持多窗口网格布局
- [ ] 拖拽调整分屏大小
- [ ] 支持自定义每个窗口的 URL
- [ ] 布局配置保存与加载
- [ ] 分屏比例预设（1:1、1:2、2:1 等）

## 贡献指南

欢迎提交 Issue 和 Pull Request。在贡献代码前，请确保：

1. 代码通过 `npm run lint` 检查
2. 类型检查通过 `npm run typecheck`
3. 遵循现有的代码风格和命名规范

## 许可证

MIT
