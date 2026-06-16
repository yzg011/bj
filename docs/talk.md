---
title: 说说
date: 2024-07-19 16:41:10
type: "about"
---

<style>
/* 基础样式 */
.memos-container{max-width:800px;margin:2rem auto;padding:0 1rem;}
.state-tips{text-align:center;padding:2rem;color:var(--vp-c-text-2);}
.memos-item{display:flex;gap:12px;background:var(--vp-c-bg-soft);border-radius:12px;padding:16px;margin-bottom:12px;box-shadow:0 2px 8px rgba(0,0,0.08);}
.avatar-wrap{flex-shrink:0;width:40px;height:40px;border-radius:50%;overflow:hidden;background:#eee;}
.avatar-wrap img{width:100%;height:100%;object-fit:cover;}
.memos-content-wrap{flex:1;}
.user-header{display:flex;align-items:center;gap:8px;margin-bottom:8px;}
.username{font-weight:600;font-size:14px;color:var(--vp-c-text-1);}
.time{font-size:12px;color:var(--vp-c-text-2);}
.memos-content{line-height:1.6;font-size:15px;margin-bottom:10px;word-break:break-word;color:var(--vp-c-text-1);}
.img-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px;margin-top:10px;}
.img-grid img{width:100%;height:auto;object-fit:contain;border-radius:8px;cursor:pointer;transition:transform 0.2s ease;background:#f5f5f5;}
.img-grid img:hover{transform:scale(1.02);}

/* 弹窗核心样式（固定在浏览器视口） */
.img-preview {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.8);
  z-index: 9999;
  display: none;
  align-items: center;
  justify-content: center;
}
.img-preview.show {
  display: flex;
}
.preview-img-wrapper {
  width: 90%;
  max-width: 800px;
  text-align: center;
}
.preview-img-wrapper img {
  max-width: 100%;
  max-height: 80vh;
  border-radius: 8px;
  object-fit: contain;
}
</style>

<div class="memos-container" id="memosList">
  <div class="state-tips">加载中...</div>
</div>

<script>
window.onload = function(){
  const API = "https://ss.z2m.store/api/v1/memos?limit=20&sort=createTime&order=desc";
  const listBox = document.getElementById("memosList");
  let scrollTop = 0;

  // ========== 配置项（独立区分头像、缩略图兜底图） ==========
  // 头像默认图（Base64 内置，无跨域/404风险）
  const AVATAR_FALLBACK = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNlZWUiLz4KPHBhdGggZD0iTTE1IDI1QzE1IDIwLjU4MTcgMTguNTgxNyAxNyAyMyAxN1MyOSAyMC41ODE3IDI5IDI1QzI5IDI5LjQxODMgMjUuNDE4MyAzMyAyMSAzM1MxMyAyOS40MTgzIDEzIDI1QzEzIDIwLjU4MTcgMTYuNDE4MyAxNyAyMSAxN1MyOSAyMC41ODE3IDI5IDI1WiIgZmlsbD0iIzY2NiIvPgo8L3N2Zz4=";
  // 内容缩略图默认图
  const IMAGE_FALLBACK = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

  // 1. 全局图片错误监听（核心：区分图片类型，防止互相替换）
  document.addEventListener('error', function(e) {
    const img = e.target;
    if(img.tagName !== 'IMG') return;
    // 标记已处理，避免死循环
    if(img.dataset.handled === '1') return;
    img.dataset.handled = '1';

    // 根据自定义属性判断类型，使用对应兜底图
    if(img.dataset.type === 'avatar') {
      img.src = AVATAR_FALLBACK;
    } else if(img.dataset.type === 'content') {
      img.src = IMAGE_FALLBACK;
    }
  }, true);

  // 2. 动态创建弹窗 DOM，直接挂载到 <body>
  let previewBox = document.createElement('div');
  previewBox.className = 'img-preview';
  previewBox.id = 'imgPreview';
  previewBox.innerHTML = `
    <div class="preview-img-wrapper">
      <img id="previewImg" alt="大图预览">
    </div>
  `;
  document.body.appendChild(previewBox);
  const previewImg = document.getElementById("previewImg");

  // 3. 打开弹窗：记录滚动位置 + 固定页面
  window.openImg = function(url){
    previewImg.src = url;
    previewBox.classList.add("show");
    scrollTop = window.scrollY || document.documentElement.scrollTop;
    document.documentElement.style.position = 'fixed';
    document.documentElement.style.top = `-${scrollTop}px`;
    document.documentElement.style.width = '100%';
  };

  // 4. 关闭弹窗：还原页面与滚动位置
  function closePreview(){
    previewBox.classList.remove("show");
    document.documentElement.style.position = '';
    document.documentElement.style.top = '';
    window.scrollTo(0, scrollTop);
  }

  // 点击蒙层关闭
  previewBox.addEventListener("click",function(e){
    if(e.target === previewBox) closePreview();
  });
  // ESC 按键关闭
  document.addEventListener("keydown",function(e){
    if(e.key === "Escape") closePreview();
  });

  // 时间格式化
  function formatTime(s){
    if(!s) return "未知时间";
    let d = new Date(s);
    if(isNaN(d.getTime())) return "未知时间";
    function pad(n){return String(n).padStart(2,"0");}
    return d.getFullYear()+"年"+pad(d.getMonth()+1)+"月"+pad(d.getDate())+"日 "+pad(d.getHours())+":"+pad(d.getMinutes())+":"+pad(d.getSeconds());
  }

  // 生成【头像】HTML（标记类型：avatar）
  function getAvatarHtml(){
    return `<img src="https://com.z2m.store/img/butterfly-icon.png" data-type="avatar" alt="头像">`;
  }

  // 生成【内容缩略图】HTML（标记类型：content）
  function getContentImgHtml(att){
    if(!att || !att.uid || !att.filename) return "";
    let url = "https://ss.z2m.store/file/attachments/" + att.uid + "/" + att.filename;
    return `<img src="${url}" data-type="content" onclick="window.openImg('${url}')" alt="说说图片">`;
  }

  // XHR 请求数据
  function loadData(){
    let xhr = new XMLHttpRequest();
    xhr.timeout = 8000;
    xhr.open("GET", API, true);
    xhr.onload = function(){
      if(xhr.status >= 200 && xhr.status < 300){
        try{
          let data = JSON.parse(xhr.responseText);
          let arr = Array.isArray(data.memos) ? data.memos : [];
          if(!arr.length){
            listBox.innerHTML = '<div class="state-tips">暂无说说</div>';
            return;
          }
          let html = "";
          for(let i = 0; i < arr.length; i++){
            let item = arr[i];
            let content = item.content || "";
            let imgStr = "";
            if(Array.isArray(item.attachments) && item.attachments.length){
              imgStr = '<div class="img-grid">';
              item.attachments.forEach(att => {
                if(att.type && att.type.startsWith('image/')){
                  imgStr += getContentImgHtml(att);
                }
              });
              imgStr += "</div>";
            }
            html += `
              <div class="memos-item">
                <div class="avatar-wrap">
                  ${getAvatarHtml()}
                </div>
                <div class="memos-content-wrap">
                  <div class="user-header">
                    <span class="username">深漂小鱼</span>
                    <span class="time">${formatTime(item.createTime)}</span>
                  </div>
                  <div class="memos-content">${content}</div>
                  ${imgStr}
                </div>
              </div>
            `;
          }
          listBox.innerHTML = html;
        }catch(e){
          listBox.innerHTML = '<div class="state-tips">数据解析失败：' + e.message + '</div>';
        }
      }else{
        listBox.innerHTML = '<div class="state-tips">请求失败，状态码：' + xhr.status + '</div>';
      }
    };
    xhr.onerror = function(){
      listBox.innerHTML = '<div class="state-tips">网络错误/跨域拦截</div>';
    };
    xhr.ontimeout = function(){
      listBox.innerHTML = '<div class="state-tips">请求超时</div>';
    };
    xhr.send();
  }
  setTimeout(loadData, 100);
};
</script>