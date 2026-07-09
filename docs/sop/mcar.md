---
title: mcar项目创建注意
date: 2026-07-09
tags:
  - 技术
---
本地构建提示错误
➜ press h + enter to show help [vite:css][postcss] @import must precede all other statements (besides @charset or empty @layer) 9 | */ 10 | 11 | @import url('[https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@40](https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@40) 0;500;700&display=swap'); | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ ^^^^^^^^^^^^^^^^^^^^^^^^^ 12 | 13 | @layer base {
# 报错原因

PostCSS 规范要求：**所有 `@import` 必须放在文件最顶部**，只能允许 `@charset` / 空 `@layer` 在它前面，不能有注释、空白外的其他代码。

你的代码里 `@import` 上方存在多行注释，触发校验报错。


改成正确的顺序后正常


@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&display=swap');

/* stylelint-disable */
@tailwind base;
@tailwind components;
@tailwind utilities;





/* 智能挪车系统 设计系统 - 参考图驱动
   Vibe: iOS App Card UI × Gradient Sky
   蓝/紫渐变背景 + 白色大圆角浮层卡片
*/