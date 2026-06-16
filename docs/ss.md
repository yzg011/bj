---
title: 关于
date: 2024-07-19 16:41:10
type: "about"
---

<div id="memosList" style="max-width:800px;margin:2rem auto;padding:0 1rem;">
  <div style="text-align:center;padding:2rem;color:var(--vp-c-text-2);">加载中...</div>
</div>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  const API = "https://ss.z2m.store/api/v1/memos?limit=20&sort=createTime&order=desc"
  const listBox = document.getElementById("memosList")
  let scrollTop = 0

  // 兜底图
  const AVATAR_FALLBACK = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNlZWUiLz4KPHBhdGggZD0iTTE1IDI1QzE1IDIwLjU4MTcgMTguNTgxNyAxNyAyMyAxN1MyOSAyMC41ODE3IDI5IDI1QzI5IDI5LjQxODMgMjUuNDE4MyAzMyAyMSAzM1MxMyAyOS40MTgzIDEzIDI1QzEzIDIwLjU4MTcgMTYuNDE4MyAxNyAyMSAxN1MyOSAyMC41ODE3IDI5IDI1WiIgZmlsbD0iIzY2NiIvPgo8L3N2Zz4="
  const IMAGE_FALLBACK = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="

  // 图片加载失败兜底
  document.addEventListener('error', function(e) {
    const img = e.target
    if (img.tagName !== 'IMG' || img.dataset.handled === '1') return
    img.dataset.handled = '1'
    if (img.dataset.type === 'avatar') {
      img.src = AVATAR_FALLBACK
    } else if (img.dataset.type === 'content') {
      img.src = IMAGE_FALLBACK
    }
  }, true)

  // 创建图片预览弹窗
  const previewBox = document.createElement('div')
  previewBox.style.cssText = `
    position: fixed;left:0;top:0;width:100vw;height:100vh;
    background:rgba(0,0,0,0.8);z-index:9999;display:none;
    align-items:center;justify-content:center;
  `
  previewBox.innerHTML = `
    <div style="width:90%;max-width:800px;text-align:center;">
      <img id="previewImg" style="max-width:100%;max-height:80vh;border-radius:8px;object-fit:contain;" alt="大图预览">
    </div>
  `
  document.body.appendChild(previewBox)
  const previewImg = document.getElementById("previewImg")

  // 打开预览
  const openImg = (url) => {
    previewImg.src = url
    previewBox.style.display = 'flex'
    scrollTop = window.scrollY || document.documentElement.scrollTop
    document.documentElement.style.position = 'fixed'
    document.documentElement.style.top = `-${scrollTop}px`
    document.documentElement.style.width = '100%'
  }
  window.openImg = openImg

  // 关闭预览
  const closePreview = () => {
    previewBox.style.display = 'none'
    document.documentElement.style.position = ''
    document.documentElement.style.top = ''
    window.scrollTo(0, scrollTop)
  }

  previewBox.addEventListener("click", e => {
    if (e.target === previewBox) closePreview()
  })
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closePreview()
  })

  // 时间格式化
  const formatTime = (s) => {
    if (!s) return "未知时间"
    const d = new Date(s)
    if (isNaN(d.getTime())) return "未知时间"
    const pad = n => String(n).padStart(2, "0")
    return `${d.getFullYear()}年${pad(d.getMonth()+1)}月${pad(d.getDate())}日 ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  // 生成头像HTML
  const getAvatarHtml = () => {
    return `<img src="https://com.z2m.store/img/butterfly-icon.png" data-type="avatar" alt="avatar" style="width:100%;height:100%;object-fit:cover;">`
  }

  // 生成内容图片HTML
  const getContentImgHtml = (att) => {
    if (!att || !att.uid || !att.filename) return ""
    const url = `https://ss.z2m.store/file/attachments/${att.uid}/${att.filename}`
    return `<img src="${url}" data-type="content" onclick="openImg('${url}')" alt="图片" style="width:100%;height:auto;object-fit:contain;border-radius:8px;cursor:pointer;transition:transform 0.2s ease;background:#f5f5f5;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">`
  }

  // 请求接口
  const loadData = () => {
    const xhr = new XMLHttpRequest()
    xhr.timeout = 8000
    xhr.open("GET", API, true)
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          const arr = Array.isArray(data.memos) ? data.memos : []
          if (!arr.length) {
            listBox.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--vp-c-text-2);">暂无说说</div>'
            return
          }
          let html = ""
          arr.forEach(item => {
            const content = item.content || ""
            let imgStr = ""
            if (Array.isArray(item.attachments) && item.attachments.length) {
              imgStr = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-top:10px;">`
              item.attachments.forEach(att => {
                if (att.type && att.type.startsWith('image/')) {
                  imgStr += getContentImgHtml(att)
                }
              })
              imgStr += "</div>"
            }
            html += `
              <div style="display:flex;gap:12px;background:var(--vp-c-bg-soft);border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0.08);">
                <div style="flex-shrink:0;width:40px;height:40px;border-radius:50%;overflow:hidden;background:#eee;">
                  ${getAvatarHtml()}
                </div>
                <div style="flex:1;">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                    <span style="font-weight:600;font-size:14px;color:var(--vp-c-text-1);">深漂小鱼</span>
                    <span style="font-size:12px;color:var(--vp-c-text-2);">${formatTime(item.createTime)}</span>
                  </div>
                  <div style="line-height:1.6;font-size:15px;margin-bottom:10px;word-break:break-word;color:var(--vp-c-text-1);">${content}</div>
                  ${imgStr}
                </div>
              </div>
            `
          })
          listBox.innerHTML = html
        } catch (e) {
          listBox.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--vp-c-text-2);">数据解析失败：${e.message}</div>`
        }
      } else {
        listBox.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--vp-c-text-2);">请求失败，状态码：${xhr.status}</div>`
      }
    }
    xhr.onerror = () => {
      listBox.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--vp-c-text-2);">网络错误/跨域拦截</div>'
    }
    xhr.ontimeout = () => {
      listBox.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--vp-c-text-2);">请求超时</div>'
    }
    xhr.send()
  }

  setTimeout(loadData, 100)
})
</script>