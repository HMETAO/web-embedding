/**
 * @file 路由配置
 * @description 应用路由配置，使用 Zustand 管理全局状态无需 Provider 包裹
 */

import { Route, Routes } from 'react-router'
import MainView from '@renderer/pages/MainView'

/**
 * 路由配置组件
 * 使用 Zustand 进行状态管理，无需 Provider 包裹
 * 所有组件直接通过 useSplitScreenStore Hook 访问分屏状态
 */
function RouteConfig(): React.JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<MainView />} />
    </Routes>
  )
}

export default RouteConfig
