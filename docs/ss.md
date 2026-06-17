---
title: 关于
date: 2024-07-19 16:41:10
type: "about"
---
<div id="memosList" style="max-width:800px;margin:2rem auto;padding:0 1rem;">
  <div style="text-align:center;padding:2rem;color:var(--vp-c-text-2);">加载中...</div>
</div>

<!-- 分页按钮容器 -->
<div id="pagePagination" style="max-width:800px;margin:1rem auto 3rem;padding:0 1rem;display:flex;justify-content:center;gap:10px;align-items:center;"></div>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // 全局配置
  const API_BASE = "https://ss.z2m.store"
  const PAGE_SIZE = 10
  let currentToken = ""        // 当前页面游标（用于请求）
  let nextPageToken = ""       // 接口返回的下一页游标
  let prevTokenStack = []      // 历史游标栈，存放每一页的currentToken
  let hasNext = false          // 是否有下一页

  const listBox = document.getElementById("memosList")
  const paginationBox = document.getElementById("pagePagination")

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

  // 生成内容图片HTML（使用VitePress原生预览）
  const getContentImgHtml = (att) => {
    if (!att || !att.uid || !att.filename) return ""
    const url = `${API_BASE}/file/attachments/${att.uid}/${att.filename}`
    return `<img src="${url}" data-type="content" alt="图片" style="width:100%;height:auto;object-fit:contain;border-radius:8px;cursor:pointer;transition:transform 0.2s ease;background:#f5f5f5;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">`
  }

  // 构造请求URL（你提供的 buildApiUrl 逻辑）
  const buildApiUrl = () => {
    let url = `${API_BASE}/api/v1/memos?pageSize=${PAGE_SIZE}&sort=createTime&order=desc`
    if (currentToken) {
      url += `&pageToken=${encodeURIComponent(currentToken)}`
    }
    return url
  }

  // 渲染分页按钮
  const renderPagination = () => {
    const hasPrev = prevTokenStack.length > 0
    if (!hasPrev && !hasNext) {
      paginationBox.innerHTML = ""
      return
    }
    let btnHtml = ""
    // 上一页
    btnHtml += `<button 
      id="prevBtn"
      style="padding:6px 14px;border-radius:6px;border:none;background:var(--vp-c-bg-soft);cursor:pointer;${!hasPrev ? 'opacity:0.5;cursor:not-allowed;' : ''}"
      ${!hasPrev ? 'disabled' : ''}>上一页</button>`
    // 下一页
    btnHtml += `<button 
      id="nextBtn"
      style="padding:6px 14px;border-radius:6px;border:none;background:var(--vp-c-bg-soft);cursor:pointer;${!hasNext ? 'opacity:0.5;cursor:not-allowed;' : ''}"
      ${!hasNext ? 'disabled' : ''}>下一页</button>`

    paginationBox.innerHTML = btnHtml

    // 上一页点击事件
    const prevBtn = document.getElementById("prevBtn")
    prevBtn && prevBtn.addEventListener("click", () => {
      if (prevTokenStack.length === 0) return
      // 取出上一页游标，覆盖当前游标
      currentToken = prevTokenStack.pop()
      loadData()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })

    // 下一页点击事件
    const nextBtn = document.getElementById("nextBtn")
    nextBtn && nextBtn.addEventListener("click", () => {
      if (!hasNext) return
      // 切换下一页前：把当前页面游标存入历史栈
      prevTokenStack.push(currentToken)
      // 替换为下一页游标
      currentToken = nextPageToken
      loadData()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  // 加载数据
  const loadData = () => {
    listBox.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--vp-c-text-2);">加载中...</div>'
    const url = buildApiUrl()
    const xhr = new XMLHttpRequest()
    xhr.timeout = 8000
    xhr.open("GET", url, true)

    xhr.onload = function () {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText)
          const arr = Array.isArray(data.memos) ? data.memos : []
          // 更新下一页游标
          nextPageToken = data.nextPageToken || ""
          hasNext = !!nextPageToken

          if (!arr.length) {
            listBox.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--vp-c-text-2);">暂无说说</div>'
            renderPagination()
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
          renderPagination()
        } catch (e) {
          listBox.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--vp-c-text-2);">数据解析失败：${e.message}</div>`
          paginationBox.innerHTML = ""
        }
      } else {
        listBox.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--vp-c-text-2);">请求失败，状态码：${xhr.status}</div>`
        paginationBox.innerHTML = ""
      }
    }

    xhr.onerror = () => {
      listBox.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--vp-c-text-2);">网络错误/跨域拦截</div>'
      paginationBox.innerHTML = ""
    }

    xhr.ontimeout = () => {
      listBox.innerHTML = '<div style="text-align:center;padding:2rem;color:var(--vp-c-text-2);">请求超时</div>'
      paginationBox.innerHTML = ""
    }

    xhr.send()
  }

  // 初始加载第一页（无游标）
  loadData()
})
</script>