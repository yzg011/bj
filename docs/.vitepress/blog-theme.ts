// 主题独有配置
import { getThemeConfig } from '@sugarat/theme/node'

// 开启RSS支持（RSS配置）
import type { Theme } from '@sugarat/theme'

const baseUrl = 'https://bj.z2m.store'
const RSS: Theme.RSSOptions = {
  title: '安防圈',
  baseUrl,
  copyright: 'MIT License | SAIMEN',
  description: '个人技术笔记，安防笔记',
  language: 'zh-cn',
  image: 'https://img.z2m.store/file/public/1778862620159_g.png',
  favicon: '/favicon.ico',
}

// 所有配置项，详见文档: https://theme.sugarat.top/
const blogTheme = getThemeConfig({
  // 开启RSS支持
  RSS,

  // 搜索
  // 默认开启pagefind离线的全文搜索支持（如使用其它的可以设置为false）
  search: true,

  // 默认关闭 markdown 图表支持（开启会增加一定的构建耗时）
  // mermaid: false


// 默认配置如下，即默认生效配置，无需再设置
  recommend: {
    title: '🔍 相关文章',
    nextText: '换一组',
    pageSize: 10,
    empty: '暂无相关文章',
    style: 'sidebar',
    sort: 'date',
    showDate: true,
    showNum: true
  },




  // 页脚
  footer: {
    // message 字段支持配置为HTML内容，配置多条可以配置为数组
    // message: '下面 的内容和图标都是可以修改的噢（当然本条内容也是可以隐藏的）',
    copyright: 'MIT License | Saimen',
    // icpRecord: {
    //   name: '蜀ICP备19011724号',
    //   link: 'https://beian.miit.gov.cn/'
    // },
    // securityRecord: {
    //   name: '公网安备xxxxx',
    //   link: 'https://www.beian.gov.cn/portal/index.do'
    // },
  },

  // 主题色修改
  themeColor: 'el-blue',

  // 文章默认作者
  author: 'Saimen',

  // 友链
  
    friend: {
    list: [
    {
      nickname: 'Saimen Blog',
      des: '读史可以明智,知古方能鉴今',
      avatar:
        'https://img.z2m.store/file/public/1778862620159_g.png',
      url: 'https://com.z2m.store',
    },
    {
      nickname: '免费图床',
      des: '永久免费图床',
      avatar:
        'https://img.z2m.store/file/public/1779443156389_imglogo.png',
      url: 'https://img.z2m.store',
    },
    {
      nickname: 'Saimen homepage',
      des: '作者的主页空间',
      avatar:
        'https://img.z2m.store/file/public/1778862620159_g.png',
      url: 'https://home.z2m.store',
    },
    {
      nickname: '小鱼钓猫🐱',
      des: '另一博客空间',
      avatar:
        'https://img.z2m.store/file/public/1778862620159_g.png',
      url: 'https://blog.z2m.store/',
    },
    ],
    // 开启顺序随机
    random: true,
    // 限制列表只展示 3 个
    limit: 3,
    // 自定义滚动速度（可选）
    scrollSpeed: 10000
  },


  // 公告
  popover: {
    title: '公告',
    body: [
      { type: 'text', content: '👇公众号👇---👇 交流群 👇' },
      {
        type: 'image',
        src: 'https://img.z2m.store/file/1779067710712_1.png',
        alt: '微信二维码'
      },
	  {
        type: 'image',
        src: 'https://img.z2m.store/file/public/1779328252809_cd481a3c3f758fd6fe04d65e7c55aaec.jpg',
        alt: 'QQ交流群'
      },
      {
        type: 'text',
        content: '欢迎大家加群&私信交流'
      },
      // {
        // type: 'text',
        // content: '文章首/文尾有群二维码',
        // style: 'padding-top:0'
      // },
      {
        type: 'button',
        content: '作者博客',
        link: 'https://com.z2m.store'
      },
      {
        type: 'button',
        content: '微信客服',
        props: {
          type: 'success'
        },
        link: 'https://work.weixin.qq.com/kfid/kfc90518b0eacba59c3',
      }
    ],
    duration: 0
  },
})

export { blogTheme }
