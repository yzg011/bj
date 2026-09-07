import BlogTheme from '@sugarat/theme'
import type { EnhanceAppContext } from 'vitepress'

// 自定义样式重载
// import './style.css'

// 自定义主题色
// import './user-theme.css'
import './style/index.css'

export default {
  ...BlogTheme,
  enhanceApp({ app }: EnhanceAppContext) {
    if (typeof document !== 'undefined') {
      const script = document.createElement('script')
      script.dataset.hostId = "1"
      script.dataset.autoReg = "true"
      script.dataset.loginToken = ""
      script.dataset.closeWidth = "52"
      script.dataset.closeHeight = "52"
      script.dataset.openWidth = "380"
      script.dataset.openHeight = "680"
      script.dataset.position = "right"
      script.dataset.welcome = "欢迎来到小鱼钓猫🐱的博客"
      script.dataset.themeColor = "#1fe1f9"
      script.dataset.logo = "https://img.z2m.store/file/public/1778862620159_g.png"
      script.dataset.popupTitle = "需要帮助吗？"
      script.dataset.popupSubtitle = "我们随时为您服务！"
      script.dataset.popupImage = "https://img.z2m.store/file/public/1778862620159_g.png"
      script.dataset.popupClosable = "true"
      script.src = "https://lt.z2m.store/widget.js"
      script.async = true
      document.body.appendChild(script)
    }
  }
}

