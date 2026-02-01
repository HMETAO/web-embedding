/**
 * @file BlurOverlay 模糊遮罩层组件
 * @description 拖动分割线时显示的模糊遮罩层，减少布局闪烁的视觉影响
 * 半透明黑色背景配合轻微模糊效果，提升用户体验
 */

import React from 'react'

/**
 * BlurOverlay 组件属性
 */
interface BlurOverlayProps {
  /** 是否显示遮罩层 */
  visible: boolean
}

/**
 * 模糊遮罩层组件
 * 拖动时覆盖在分屏区域上，减少闪烁的视觉干扰
 */
export function BlurOverlay({ visible }: BlurOverlayProps): React.JSX.Element | null {
  if (!visible) return null

  return (
    <div
      className="absolute inset-0 pointer-events-none z-40"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(1px)',
        WebkitBackdropFilter: 'blur(1px)'
      }}
    />
  )
}
