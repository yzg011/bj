---
title: 友情链接
layout: page
---

<script setup>
import { onMounted, ref } from 'vue'

const JSON_URL = "https://lk.z2m.store/friends.json"
const friendsList = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const res = await fetch(JSON_URL, {
      mode: 'cors',
      cache: 'no-cache'
    })
    if (!res.ok) throw new Error('数据请求失败')
    friendsList.value = await res.json()
  } catch (err) {
    error.value = err.message
    console.error('友链加载错误：', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* 全局容器 */
.friends-wrap {
  position: relative;
  max-width: 1000px;
  margin: 2rem auto;
  padding: 0 1rem;
  min-height: 300px;
}

/* 右上角友链申请按钮（关键修改：上移定位） */
.friend-apply-btn {
  position: absolute;
  /* 把按钮向上移出容器，放在标题栏右侧 */
  top: -3rem !important; 
  right: 2rem;
  padding: 8px 18px;
  background: var(--vp-c-brand) !important;
  color: #fff !important;
  border-radius: 20px;
  font-size: 14px;
  text-decoration: none !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
  transition: all 0.2s ease;
  z-index: 9999 !important;
  display: inline-block !important;
  visibility: visible !important;
  opacity: 1 !important;
}
.friend-apply-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2) !important;
  color: #fff !important;
  text-decoration: none !important;
}

/* 友链列表网格布局（恢复原来的间距，不再下移） */
.friends-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.2rem;
  margin-top: 5rem; /* 恢复原来的3rem，不影响卡片位置 */
}

/* 单个友链卡片 */
.friend-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--vp-c-bg-soft);
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  border: 1px solid var(--vp-c-divider);
  text-decoration: none !important;
  color: inherit !important;
}
.friend-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.12);
}

/* 头像样式（强制优先级，避免被主题覆盖） */
.friend-avatar {
  width: 64px !important;
  height: 64px !important;
  border-radius: 50% !important;
  object-fit: cover !important;
  flex-shrink: 0 !important;
  display: block !important;
  border: 2px solid var(--vp-c-divider) !important;
  background: var(--vp-c-bg) !important;
  min-width: 64px !important;
  min-height: 64px !important;
}

/* 友链信息 */
.friend-info {
  flex: 1;
  overflow: hidden;
}
.friend-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  text-decoration: none;
  display: block;
}
.friend-name:hover {
  color: var(--vp-c-brand);
}
.friend-desc {
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-top: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 加载/错误提示 */
.friend-tips {
  text-align: center;
  padding: 4rem 0;
  color: var(--vp-c-text-2);
  font-size: 15px;
}
</style>

<div class="friends-wrap">
  <!-- 右上角友链申请按钮 -->
  <a class="friend-apply-btn" 
     href="https://github.com/yzg011/Link/issues/new?template=friend-request.yml" 
     target="_blank" rel="noopener noreferrer">
    友链申请
  </a>

  <!-- 加载/错误/空状态 -->
  <div v-if="loading" class="friend-tips">加载中...</div>
  <div v-else-if="error" class="friend-tips">友链加载失败：{{ error }}</div>
  <div v-else-if="!friendsList.length" class="friend-tips">暂无友链</div>

  <!-- 友链列表 -->
  <div v-else class="friends-list">
    <a 
      v-for="item in friendsList" 
      :key="item.name" 
      class="friend-card" 
      :href="item.url" 
      target="_blank" 
      rel="noopener noreferrer"
    >
      <img 
        class="friend-avatar" 
        :src="item.avatar || 'https://cdn.jsdelivr.net/gh/butterfly-theme/CDN/img/avatar/default.png'" 
        :alt="item.name" 
        loading="lazy"
        onerror="this.src='https://cdn.jsdelivr.net/gh/butterfly-theme/CDN/img/avatar/default.png'"
      >
      <div class="friend-info">
        <span class="friend-name">{{ item.name }}</span>
        <div class="friend-desc">{{ item.description || '' }}</div>
      </div>
    </a>
  </div>
</div>