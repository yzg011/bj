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
      script.dataset.tgBotUrl = "https://ttg.z2m.store/sendMessage"
      script.dataset.tgGetUrl = "https://ttg.z2m.store/getUpdates"
      script.dataset.chatId = "8838248851"
      script.dataset.themeColor = "#1fe1f9"
      script.dataset.openWidth = "380"
      script.dataset.openHeight = "680"
      script.dataset.welcome = "欢迎来到我的笔记📒博客"
      script.dataset.popupTitle = "需要帮助吗？"
      script.dataset.pollDelay = "1200"

      script.src = "https://lk.z2m.store/widget.js"
      // ❌ 删掉 async，动态创建脚本，不使用async，保证widget里document.currentScript可以拿到
      // script.async = true
      document.body.appendChild(script)
    }
  }
}
