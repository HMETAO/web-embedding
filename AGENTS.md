# web-embedding 代理指南

## 构建命令

```bash
# 开发
npm run dev              # 启动 electron-vite 开发服务器，启用 HMR

# 构建
npm run build            # 类型检查并构建生产版本
npm run build:unpack     # 构建并解压（无安装程序）
npm run build:win        # 为 Windows 构建安装包
npm run build:mac        # 为 macOS 构建安装包
npm run build:linux      # 为 Linux 构建安装包

# 代码质量
npm run lint             # 使用缓存运行 ESLint
npm run format           # 使用 Prettier 格式化所有文件
npm run typecheck        # 检查 Node 和 Web 的 TypeScript 类型
npm run typecheck:node   # 仅检查 main/preload 的类型
npm run typecheck:web    # 仅检查 renderer 的类型
```

## 项目结构

```
src/
├── ipc/                           # IPC 通信层（新增）
│   ├── channels.ts                # IPC 通道名称常量（消除魔法字符串）
│   ├── types.ts                   # IPC 类型定义（共享类型）
│   └── main.ts                    # 主进程 IPC 路由器
├── main/                          # Electron 主进程 (Node.js)
│   ├── index.ts                   # 主进程入口，初始化 IPC
│   └── services/                  # 业务服务层
│       └── viewService.ts         # BrowserView 纯业务逻辑（无 IPC）
├── preload/                       # Electron 预加载脚本
│   ├── index.ts                   # 预加载入口，暴露通用 IPC API
│   └── index.d.ts                 # 类型声明
└── renderer/src/                  # React 渲染器进程
    ├── components/                # React 组件（UI 渲染）
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

## 架构说明

### 三层架构设计

项目采用清晰的三层架构，实现关注点分离：

```
┌─────────────────────────────────────────────────────────┐
│  业务逻辑层 (Business Layer)                              │
│  src/main/services/viewService.ts                        │
│  - 纯业务逻辑，不依赖 IPC                                  │
│  - 负责 BrowserView 创建、销毁、边界计算                   │
├─────────────────────────────────────────────────────────┤
│  IPC 层 (IPC Layer)                                      │
│  src/ipc/ + src/renderer/src/ipc/                        │
│  - 主进程: src/ipc/main.ts (路由 IPC 请求)                │
│  - 渲染进程: src/renderer/src/ipc/browserView.ts (封装)   │
│  - 通道常量: src/ipc/channels.ts                          │
├─────────────────────────────────────────────────────────┤
│  Electron API 层 (Electron API)                          │
│  BrowserView, BrowserWindow, ipcMain, ipcRenderer        │
│  - 底层 Electron API 调用                                  │
└─────────────────────────────────────────────────────────┘
```

### 状态管理（Zustand）

项目使用 **Zustand** 替换 Context API 进行全局状态管理：

- **集中式状态**: `useSplitScreenStore.ts` 管理分屏状态
- **自动持久化**: 可轻松集成持久化中间件
- **性能优化**: 细粒度订阅，避免不必要的重渲染
- **与 IPC 集成**: 状态变更自动触发 IPC 调用

### IPC 通信流程

```
用户交互 → Zustand Store 更新 → IPC 调用 → 主进程处理 → BrowserView 更新
     ↑                                                              ↓
     └────────── 状态同步返回 ← 渲染进程监听 ← IPC 响应 ←─────────────┘
```

## 代码风格指南

### 格式化 (Prettier)

- **单引号** (`singleQuote: true`)
- **无分号** (`semi: false`)
- **无尾随逗号** (`trailingComma: none`)
- **打印宽度**: 100 字符
- 提交前运行 `npm run format`

### TypeScript 规范

- 启用严格模式，使用显式返回类型
- 函数返回类型: `function foo(): ReturnType`
- React 组件返回类型: `React.JSX.Element`
- Props 接口命名: `{ComponentName}Props`
- 对象形状使用 `interface`，联合类型使用 `type`
- 回调函数使用 `useCallback`，依赖数组必须完整

### 命名约定

- **组件**: PascalCase (例如 `SplitDivider.tsx`)
- **Hooks**: camelCase 以 `use` 开头 (例如 `useSplitScreenStore`)
- **工具函数**: camelCase (例如 `calculateViewBounds`)
- **接口/类型**: PascalCase (例如 `BrowserViewState`)
- **常量**: camelCase (非全大写)
- **IPC 通道**: SCREAMING_SNAKE_CASE (例如 `CREATE_BROWSER_VIEW`)
- **私有方法**: 使用 `private` 修饰符

### 代码注释规范

- **所有代码文件**必须添加适当的注释
- **新建文件**必须在顶部添加 JSDoc 文件注释
- **函数和复杂逻辑**必须添加中文注释
- **接口属性**必须添加注释说明用途
- **关键设计决策**必须注释说明原因
- 注释使用**中文**编写

示例文件头部注释:

```typescript
/**
 * @file viewService.ts
 * @description BrowserView 业务逻辑服务
 * 负责处理 BrowserView 的创建、销毁、边界计算等纯业务逻辑
 * 不包含任何 IPC 通信代码，通过 viewService 调用
 */
```

示例函数注释:

```typescript
/**
 * 计算指定类型 BrowserView 的边界矩形
 * @param type - 视图类型：'primary' | 'secondary'
 * @param containerBounds - 容器窗口边界
 * @param splitRatio - 分屏比例（0-1），默认 0.5
 * @returns 计算后的边界矩形对象
 */
```

示例 IPC 通道注释:

```typescript
/**
 * IPC 通道名称常量
 * 所有 IPC 通信必须使用这些常量，禁止硬编码字符串
 */
export const IPC_CHANNELS = {
  /** 创建 BrowserView */
  CREATE_BROWSER_VIEW: 'create-browser-view',
  /** 销毁 BrowserView */
  DESTROY_BROWSER_VIEW: 'destroy-browser-view'
} as const
```

### 导入规范

分组顺序:

1. 外部库 (React, Electron)
2. 内部别名 (`@renderer/`, `@main/`)
3. 相对路径 (`../`, `./`)

```typescript
import { useState, useCallback } from 'react'
import { BrowserView } from 'electron'
import { useSplitScreenStore } from '@renderer/hooks/useSplitScreenStore'
import { IPC_CHANNELS } from '../../ipc/channels'
```

### React 模式

- 使用**函数式组件**配合 Hooks
- Props 在函数参数中解构
- 复杂逻辑封装在**自定义 Hooks** 中
- 全局状态使用 **Zustand** 管理（已替换 Context）
- 组件只负责 UI 渲染，逻辑在 Hook 中
- 显式返回类型: `function Component(): React.JSX.Element`
- 使用 `useSplitScreenStore` 获取分屏状态

### 错误处理

- 使用 try/catch 处理可能失败的 IPC 调用
- 可选链操作符处理可能为 null 的对象
- 错误使用 `console.error` 或 `console.warn` 输出
- 用户操作错误使用 Toast 或 Alert 提示

### 样式规范

- 使用 **Tailwind CSS v4** 进行样式设置
- 优先使用 Tailwind 工具类
- 动态样式使用 `style` 属性
- 布局使用 Flexbox，避免绝对定位
- 动画使用 Tailwind 内置动画或 framer-motion

## 可扩展性与可读性

在进行功能开发时，必须考虑代码的长期维护价值，遵循以下原则：

### 可读性要求（强制）

- **函数单一职责**：每个函数只做一件事，函数体不超过 50 行
- **命名自解释**：变量/函数名应清晰表达用途，无需注释也能理解
  - 示例：`getUserById` 优于 `getData`
  - 示例：`isLoading` 优于 `flag`
- **避免嵌套地狱**：if/for 嵌套不超过 3 层，使用提前返回减少嵌套
- **代码分组**：用空行将逻辑相关的代码分组，每组添加简短注释说明

### 可扩展性要求（强制）

- **开闭原则**：对扩展开放，对修改封闭
  - 新增功能时，优先扩展而非修改现有代码
  - 使用策略模式/插件机制预留扩展点
- **依赖抽象**：依赖接口而非具体实现，便于替换和测试
  - 示例：使用 `IPCChannel` 接口而非硬编码字符串
  - 示例：使用 `ViewConfig` 对象而非直接操作 BrowserView
- **配置化**：将可能变更的值提取为配置，避免魔法数字/字符串
  - 示例：滚动条宽度、动画时长、分屏比例等
  - 示例：使用 `const SPLIT_RATIO = 0.5` 而非硬编码 0.5
- **预留扩展点**：在关键流程预留 hook/callback，便于后续增强
  - 示例：视图创建前后的生命周期钩子
  - 示例：IPC 调用前后的拦截器

### 三层架构实现示例

**不好的代码（混合关注点）**：

```typescript
// ❌ 业务逻辑与 IPC 混合
function createBrowserView(url: string) {
  // 直接调用 Electron API
  const view = new BrowserView()
  view.webContents.loadURL(url)

  // 直接处理 IPC
  ipcMain.handle('navigate', () => {
    view.webContents.loadURL(url)
  })

  // 直接计算边界
  view.setBounds({ x: 0, y: 0, width: 800, height: 600 })
}
```

**好的代码（三层分离）**：

```typescript
// ✅ viewService.ts - 纯业务逻辑层
export class ViewService {
  private views = new Map<string, BrowserView>()

  createView(id: string, url: string): BrowserView {
    const view = new BrowserView({ webPreferences: { sandbox: true } })
    view.webContents.loadURL(url)
    this.views.set(id, view)
    return view
  }

  calculateBounds(type: ViewType, bounds: Rectangle, ratio = 0.5): Rectangle {
    if (type === 'primary') {
      return { ...bounds, width: bounds.width * ratio }
    }
    return { ...bounds, x: bounds.width * ratio, width: bounds.width * (1 - ratio) }
  }
}

// ✅ ipc/channels.ts - IPC 层（通道常量）
export const IPC_CHANNELS = {
  CREATE_BROWSER_VIEW: 'create-browser-view',
  UPDATE_VIEW_BOUNDS: 'update-view-bounds'
} as const

// ✅ ipc/main.ts - IPC 层（路由）
export function setupIpcHandlers(viewService: ViewService) {
  ipcMain.handle(IPC_CHANNELS.CREATE_BROWSER_VIEW, (event, id: string, url: string) => {
    return viewService.createView(id, url)
  })
}

// ✅ renderer/src/ipc/browserView.ts - IPC 层（封装）
export const browserViewIPC = {
  create: (id: string, url: string) =>
    ipcRenderer.invoke(IPC_CHANNELS.CREATE_BROWSER_VIEW, id, url),
  updateBounds: (id: string, bounds: Rectangle) =>
    ipcRenderer.invoke(IPC_CHANNELS.UPDATE_VIEW_BOUNDS, id, bounds)
}

// ✅ hooks/useSplitScreenStore.ts - 状态管理层
export const useSplitScreenStore = create<SplitScreenState>((set, get) => ({
  views: [],
  createView: async (url: string) => {
    const id = generateId()
    await browserViewIPC.create(id, url)
    set((state) => ({ views: [...state.views, { id, url }] }))
  }
}))
```

### 开发前自检清单

新增功能前，必须回答以下问题：

- [ ] **单一职责**：该函数/组件是否只做一件事？
- [ ] **命名清晰**：命名是否直观表达了用途？
- [ ] **扩展性**：如果需求变更，是否需要大量修改现有代码？
- [ ] **抽象层**：是否有适当的抽象，避免直接依赖具体实现？
- [ ] **配置化**：是否有硬编码值需要提取为配置？
- [ ] **三层分离**：业务逻辑、IPC、Electron API 是否分离？
- [ ] **文档**：是否添加了必要的注释说明设计意图？

## 功能修改指南

### 新增 IPC 通信

如果需要新增 IPC 功能（如拖拽分割线）：

1. **添加通道常量** (`src/ipc/channels.ts`):

   ```typescript
   export const IPC_CHANNELS = {
     // ... 现有通道
     UPDATE_SPLIT_RATIO: 'update-split-ratio' // 新增
   } as const
   ```

2. **添加类型定义** (`src/ipc/types.ts`):

   ```typescript
   export interface UpdateSplitRatioPayload {
     ratio: number // 0-1 之间
   }
   ```

3. **实现主进程处理** (`src/ipc/main.ts`):

   ```typescript
   ipcMain.handle(IPC_CHANNELS.UPDATE_SPLIT_RATIO, (event, payload: UpdateSplitRatioPayload) => {
     viewService.updateSplitRatio(payload.ratio)
   })
   ```

4. **添加渲染进程封装** (`src/renderer/src/ipc/browserView.ts`):

   ```typescript
   export const browserViewIPC = {
     // ... 现有方法
     updateSplitRatio: (ratio: number) =>
       ipcRenderer.invoke(IPC_CHANNELS.UPDATE_SPLIT_RATIO, { ratio })
   }
   ```

5. **在 Zustand 中使用** (`src/renderer/src/hooks/useSplitScreenStore.ts`):
   ```typescript
   updateSplitRatio: async (ratio: number) => {
     await browserViewIPC.updateSplitRatio(ratio)
     set({ splitRatio: ratio })
   }
   ```

### 修改 BrowserView 行为

如果需要修改 BrowserView 的行为（如添加导航拦截）：

1. **修改业务逻辑层** (`src/main/services/viewService.ts`):

   ```typescript
   createView(id: string, url: string): BrowserView {
     const view = new BrowserView()
     // 添加新的行为
     view.webContents.on('new-window', this.handleNewWindow.bind(this))
     return view
   }
   ```

2. **不要直接修改 IPC 层**，通过 viewService 的公共 API 暴露新功能

3. **在 Store 中调用**:
   ```typescript
   // useSplitScreenStore.ts
   someAction: async () => {
     await browserViewIPC.someNewAction()
   }
   ```

### 修改 UI 布局

如果需要修改分屏界面：

1. **修改页面组件** (`src/renderer/src/pages/MainView.tsx`):

   - 添加新的 UI 元素
   - 从 Store 获取状态
   - 调用 Store 方法触发 IPC

2. **如需新组件**，在 `src/renderer/src/components/` 创建
   - 组件只负责渲染
   - 所有逻辑通过 props 或 Store 获取

## 第三方库使用规范

### 基本原则

在进行新功能开发或业务逻辑重构时，**优先评估是否已有成熟的第三方库方案**，避免重复造轮子。

### 决策流程

1. **需求分析**：明确功能需求和技术要求
2. **方案调研**：搜索并评估可用的第三方库
3. **方案对比**：
   - 给出**推荐方案**（基于成熟度、维护状态、社区活跃度）
   - 列出 **2-3 个可选的第三方库**进行对比
4. **用户确认**：说明各方案优缺点，等待用户确认后再实施
5. **实施开发**：根据确认结果进行集成或自研

### 例外情况（可使用自研）

以下情况可以不使用第三方库：

- **简单的工具函数**（少于 20 行代码）
- **项目特定的业务逻辑**（无通用解决方案）
- **对性能有极端要求的核心功能**

### 常用库参考

| 功能类型  | 推荐库                 | 用途说明               |
| --------- | ---------------------- | ---------------------- |
| 日期处理  | date-fns, dayjs        | 时间格式化、计算       |
| 数据处理  | lodash-es, ramda       | 数组/对象操作          |
| HTTP 请求 | axios, ky              | API 请求（如需要）     |
| 表单处理  | react-hook-form        | 表单状态管理           |
| 状态管理  | zustand                | 全局状态（**已使用**） |
| 动画效果  | framer-motion          | 过渡动画、拖拽交互     |
| 类名处理  | clsx, tailwind-merge   | 动态 className         |
| 拖拽分割  | react-resizable-panels | 拖拽分屏（待评估）     |

## 重要说明

### 当前架构状态

- ✅ **IPC 架构**: 三层分离架构已实现（业务层 → IPC层 → Electron API）
- ✅ **状态管理**: Zustand 已替换 Context API
- ✅ **BrowserView**: 基于 BrowserView 的分屏功能已实现
- ✅ **TypeScript**: 严格模式启用，无 `any` 类型
- ❌ **测试框架**: 未配置（如需请添加 Vitest）
- ❌ **持久化**: 配置未持久化（如需请集成 electron-store）

### Electron 配置

- **上下文隔离**: 已启用 (`contextIsolation: true`)
- **沙盒**: BrowserView 启用沙盒 (`sandbox: true`)
- **Node 集成**: 预加载脚本中禁用 (`nodeIntegration: false`)
- **开发服务器**: electron-vite 提供 HMR

### 代码提交前必做

```bash
npm run typecheck    # 检查所有 TypeScript 类型
npm run lint         # 运行 ESLint 检查代码风格
```

### 项目文档

- **架构流程图**: `docs/分屏流程文档.md`
- **IPC 架构**: 本文档 "架构说明" 章节
- **代码规范**: 本文档 "代码风格指南" 章节

## 沟通约定

- **所有问答均用中文**
- 保持回答简洁明了（最多4行）
- 代码注释使用中文
