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
      // TG挂件 data 属性（对应你 widget.js 的读取逻辑）
      script.dataset.fileApiBase = "https://ttg.z2m.store/sendDocument"
      script.dataset.tgBotUrl = "https://ttg.z2m.store/sendMessage"
      script.dataset.tgGetUrl = "https://ttg.z2m.store/getUpdates"
      script.dataset.getFileUrl = "https://ttg.z2m.store/getFile"
      script.dataset.chatId = "8838248851"
      script.dataset.themeColor = "#22d3ee"
      script.dataset.openWidth = "360"
      script.dataset.openHeight = "620"
      script.dataset.welcome = "Hello!"
      script.dataset.popupTitle = "TG聊天"
      script.dataset.pollDelay = "1200"

      script.src = "https://lk.z2m.store/widget.js"
      document.body.appendChild(script)
    }
  }
}
