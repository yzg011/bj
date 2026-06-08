---
aside: false
hidden: true
readingTime: false
date: false
author: false
sidebar: false
---

# 友情链接

<script setup>
  // 博主自己
  const authoritys = [
    {
      avatar: "https://img.z2m.store/file/public/1778862620159_g.png",
      name: "个人博客",
      desc: "读史可以明智,知古方能鉴今。",
      link: "https://com.z2m.store",
    },
  ];
</script>

<style>
/* VitePress 原生适配 · 卡片带柔和背景 */
.vp-doc .friends-section {
  max-width: 1100px;
  margin: 2rem auto;
}
.vp-doc .friends-card {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 14px;
}
.vp-doc .friend-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  transition: all 0.3s ease;
  text-decoration: none;
  color: inherit;
}
.vp-doc .friend-item:hover {
  border-color: var(--vp-c-brand);
  background: var(--vp-c-bg-alt);
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.vp-doc .friend-item img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}
.vp-doc .friend-info {
  flex: 1;
  min-width: 0;
}
.vp-doc .friend-name {
  font-weight: 500;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.vp-doc .friend-desc {
  font-size: 0.75rem;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

<div class="friends-section">

## 🌟 博主自己
<div class="friends-card">
  <a v-for="item in authoritys" :href="item.link" target="_blank" class="friend-item">
    <img :src="item.avatar" />
    <div class="friend-info">
      <div class="friend-name">{{ item.name }}</div>
      <div class="friend-desc">{{ item.desc }}</div>
    </div>
  </a>
</div>
<br>

### 🤝 互联好友
<div class="friends-card">
  <a v-for="item in friends" :href="item.link" target="_blank" class="friend-item">
    <img :src="item.avatar" />
    <div class="friend-info">
      <div class="friend-name">{{ item.name }}</div>
      <div class="friend-desc">{{ item.desc }}</div>
    </div>
  </a>
</div>
</div>

<div id="container" style="overflow:hidden;">
<iframe border="0" id="content" src="https://lk.z2m.store" frameborder="0" height="1500px" width="100%"></iframe>
</div>





## 🔗 本站友链信息

::: details 📝 本站友链格式（可直接复制）
    {
      avatar: "https://img.z2m.store/file/public/1778862620159_g.png",
      name: "小鱼钓猫🐱",
      desc: "读史可以明智,知古方能鉴今。",
      link: "https://blog.z2m.store",
    },
:::


::: details ⚠️ 免责声明 {open}
本博客遵守中华人民共和国相关法律。友情链接中的网站均为第三方站点，本站无法对其内容、域名变更、服务器安全等进行全程监管，访问风险由用户自行承担。若发现链接存在违法或不良内容，请及时联系：`yzg011@qq.com`，我会第一时间处理。
:::