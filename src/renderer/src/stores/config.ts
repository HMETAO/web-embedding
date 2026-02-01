/**
 * 预设网站数据结构接口
 * 定义首页快捷入口中每个网站的数据结构
 */
/**
 * @file 预设网站配置文件
 * @description 定义首页快捷入口的预设网站数据结构及默认列表
 * 用户后续可通过配置文件自主添加常用网站
 */

export interface PresetWebsite {
  id: string // 网站唯一标识符，用于React key
  name: string // 网站显示名称
  url: string // 网站完整URL地址
  icon: string // 网站favicon图标URL
}

/**
 * 预设网站列表
 * 首页快捷入口显示的常用网站，包含国内外主流网站
 * 后续版本将支持用户自定义添加
 */
export const presetWebsites: PresetWebsite[] = [
  {
    id: 'bilibili',
    name: '哔哩哔哩',
    url: 'https://www.bilibili.com',
    icon: 'https://www.bilibili.com/favicon.ico'
  },
  {
    id: 'zhihu',
    name: '知乎',
    url: 'https://www.zhihu.com',
    icon: 'https://www.zhihu.com/favicon.ico'
  },
  {
    id: 'github',
    name: 'GitHub',
    url: 'https://github.com',
    icon: 'https://github.com/favicon.ico'
  },
  {
    id: 'google',
    name: 'Google',
    url: 'https://www.google.com',
    icon: 'https://www.google.com/favicon.ico'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    url: 'https://www.youtube.com',
    icon: 'https://www.youtube.com/favicon.ico'
  },
  {
    id: 'twitter',
    name: 'X / Twitter',
    url: 'https://twitter.com',
    icon: 'https://twitter.com/favicon.ico'
  }
]
