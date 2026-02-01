# Web Embedding

一款受 Android ActivityEmbedding 启发的桌面分屏应用，让用户能够自由定制多窗口布局，实现高效的多任务并行处理。

**版本**: v1.0.0  
**作者**: HMETAO  
**最后更新**: 2026-02-01

---

## 功能特性

### 已实现 ✅

- [x] **左右分屏模式**：主窗口点击链接自动在右侧分屏显示
- [x] **可拖动分割线**：自由调整左右窗口比例（10%-90%）
- [x] **双击恢复比例**：双击中间分割线快速恢复 50:50 比例
- [x] **一键关闭分屏**：右上角关闭按钮或导航栏"关闭分屏"
- [x] **状态同步机制**：主进程与渲染进程状态实时同步
- [x] **链接自动分屏**：主窗口的所有导航都在次级窗口打开
- [x] **防闪烁优化**：拖动时使用遮罩层覆盖，避免视觉闪烁
- [x] **自定义滚动条**：注入自定义滚动条样式

### 开发中 🚧

- [ ] 上下分屏模式
- [ ] 多窗口网格布局
- [ ] 布局配置保存与加载
- [ ] 分屏比例预设（1:1、1:2、2:1 等）
- [ ] 自定义每个窗口的 URL

---

## 快速入门

### 1. 开始使用

打开应用后，从首页选择或输入要访问的网站。

### 2. 触发分屏

在主窗口（左侧）点击任意链接，新页面会自动在右侧分屏显示。

**原理说明**：应用拦截了主窗口的所有导航事件，自动在右侧打开新页面，实现类似 Android ActivityEmbedding 的体验。

### 3. 调整分屏比例

拖动中间的分割线（14px 宽的可拖动区域）来调整左右窗口的大小比例。

- **比例范围**：10% - 90%
- **恢复默认**：双击分割线快速恢复 50:50
- **视觉反馈**：拖动时显示蓝色高亮

### 4. 关闭分屏

**方式一**：点击右侧窗口右上角的 × 关闭按钮  
**方式二**：点击顶部导航栏的"关闭分屏"按钮

---

## 常见问题

### Q: 为什么点击链接会在右侧打开？

**A**: 这是应用的核心功能设计。通过拦截主窗口的导航事件，所有链接都会在次级窗口（右侧）打开，实现分屏浏览。这样您可以同时查看原页面和新页面。

### Q: 分屏比例可以调整吗？

**A**: 可以。拖动中间的分割线即可调整比例，范围是 10% 到 90%。双击分割线可快速恢复 50:50 的默认比例。

### Q: 支持哪些网站？

**A**: 理论上支持所有网站。应用使用 Electron 的 BrowserView 组件加载网页，与 Chrome 浏览器具有相同的渲染能力。

### Q: 如何返回首页？

**A**: 点击顶部导航栏左侧的"← 返回首页"按钮。注意：这会关闭所有分屏并返回到初始首页。

---

## 技术栈

- **Electron 30+**：跨平台桌面应用框架
- **React 19**：现代 UI 库，配合 Hooks 实现响应式交互
- **TypeScript**：类型安全的开发体验
- **Tailwind CSS v4**：原子化 CSS 样式方案
- **React Router v7**：应用路由管理
- **Zustand**：轻量级状态管理

---

## 项目结构

```
src/
├── ipc/                           # IPC 通信层（类型安全）
│   ├── channels.ts                # IPC 通道名称常量
│   ├── types.ts                   # IPC 类型定义
│   └── main.ts                    # 主进程 IPC 路由器
├── main/                          # Electron 主进程 (Node.js)
│   ├── index.ts                   # 主进程入口，初始化 IPC
│   └── services/                  # 业务服务层
│       └── viewService.ts         # BrowserView 纯业务逻辑
├── preload/                       # Electron 预加载脚本
│   ├── index.ts                   # 预加载入口，暴露通用 IPC API
│   └── index.d.ts                 # 类型声明
└── renderer/src/                  # React 渲染器进程
    ├── components/                # React 组件（UI 渲染）
    │   └── SplitDivider.tsx       # 可拖动分割线组件
    ├── hooks/                     # 自定义 Hooks
    │   └── useSplitScreenStore.ts # Zustand + IPC 集成（状态管理）
    ├── ipc/                       # 渲染进程 IPC 封装
    │   └── browserView.ts         # BrowserView IPC 类型安全封装
    ├── pages/                     # 页面组件
    │   ├── Home.tsx               # 首页（快速访问预设网站）
    │   └── MainView.tsx           # 分屏主界面
    ├── stores/                    # 配置文件
    │   └── config.ts              # 预设网站配置
    ├── App.tsx                    # 根组件
    ├── main.tsx                   # 渲染器入口
    └── RouteConfig.tsx            # React Router 配置
```

**架构特点**：采用**三层分离架构**，业务逻辑、IPC 通信、Electron API 完全分离。

---

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

---

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

---

## 推荐开发工具

- [VS Code](https://code.visualstudio.com/) - 代码编辑器
- [ESLint 插件](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) - 代码规范检查
- [Prettier 插件](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) - 代码格式化

---

## 贡献指南

欢迎提交 Issue 和 Pull Request。在贡献代码前，请确保：

1. 代码通过 `npm run lint` 检查
2. 类型检查通过 `npm run typecheck`
3. 遵循现有的代码风格和命名规范
4. 所有注释使用中文编写

---

## 许可证

MIT

---

_文档版本: 1.0.0_  
_最后更新: 2026-02-01_  
_作者: HMETAO_
