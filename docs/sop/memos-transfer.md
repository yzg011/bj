---
title: memos transfer  数据转换成firefly动态博客需要的数据格式
date: 2026-07-18
tags:
  - 技术
---
### firefly博客对接memos

这个博客本身有动态功能但是需要每次构建 发条动态非常的麻烦，我就想着对接我的memos，这样直接发memos就能同步到博客。

有这种想法就直接开干

首先需要对博客进行改造

这个页面的这个接口是控制动态页面数据的
![image.png](https://img.z2m.store/file/1784355691336_image.png)

先把这个接口改动memos我转换的接口上

再来就是怎么把数据转换成 博客需要的数据格式，博客需要的是这种json格式
![image.png](https://img.z2m.store/file/1784355828947_image.png)


那我只需要用cf page做一个数据转换就成功了，把这个上传到cf page
![[_worker.zip]]

```
export default {
  async fetch(request, env, ctx) {
    const MEMOS_BASE = "https://ss.z2m.store";
    const MEMOS_TOKEN = env.MEMOS_TOKEN;

    // 跨域预检
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (!MEMOS_TOKEN) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const res = await fetch(`${MEMOS_BASE}/api/v1/memos?pageSize=1000`, {
        headers: { Authorization: `Bearer ${MEMOS_TOKEN}` },
      });
      const raw = await res.json();
      const rawList = Array.isArray(raw.memos) ? raw.memos : [];

      // 处理图片路径，补全域名、移除缩略参数
      const fixImageUrl = (src) => {
        let url = src;
        // 相对路径拼接域名
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
          url = `${MEMOS_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
        }
        // 删除缩略后缀
        url = url.replace(/\?thumbnail=true$/, "");
        return url;
      };

      // 1. 提取Markdown内容里的图片 ![]()
      const extractMdImages = (text) => {
        const reg = /!\[(.*?)\]\((.*?)\)/g;
        const list = [];
        let match;
        while ((match = reg.exec(text)) !== null) {
          list.push({
            alt: match[1],
            src: fixImageUrl(match[2]),
          });
        }
        return list;
      };

      // 2. 提取API attachments 附件图片（重点新增）
      const extractAttachImages = (attachments) => {
        const list = [];
        if (!Array.isArray(attachments)) return list;
        attachments.forEach((att) => {
          if (att.type && att.type.startsWith("image/")) {
            // memos附件标准路径
            const path = `/file/attachments/${att.uid}/${att.filename}`;
            list.push({
              alt: att.filename,
              src: fixImageUrl(path),
            });
          }
        });
        return list;
      };

      const cleanPlainText = (text) => {
        return text.replace(/!\[.*?\]\(.*?\)/g, "").trim();
      };

      const buildId = (msTs) => {
        const d = new Date(msTs);
        const pad = (n) => n.toString().padStart(2, "0");
        const y = d.getFullYear();
        const m = pad(d.getMonth() + 1);
        const day = pad(d.getDate());
        const h = pad(d.getHours());
        const min = pad(d.getMinutes());
        return `${y}-${m}-${day}-${y}-${m}-${day}t${h}${min}`;
      };

      const targetList = rawList.map((item) => {
        const msTimestamp = item.createTime;
        const plain = cleanPlainText(item.content);
        // 合并两种图片：正文md图片 + 附件图片
        const mdImgs = extractMdImages(item.content);
        const attImgs = extractAttachImages(item.attachments);
        const allImages = [...mdImgs, ...attImgs];

        return {
          id: buildId(msTimestamp),
          published: msTimestamp,
          html: `<p>${plain}</p>`,
          images: allImages,
          searchText: plain,
        };
      });

      return new Response(JSON.stringify(targetList, null, 2), {
        headers: {
          "Content-Type": "application/json;charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "s-maxage=300",
        },
      });
    } catch (err) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
```
然后给cf定义一个MEMOS_TOKEN的环境变量就可以了 变量值就是memos的token

自定义域名为上面接口中的域名就可以了，正确的数据就传给博客了，这样博客就能完整显示动态内容了

接下来需要改造的是侧边栏的最新动态显示

由于作者的最新动态也是直接读取的静态文件，直接改成上述动态接口文件，控制显示就OK了
它是由这个文件控制的


我这边改造的动态代码也直接贴一下，大家直接复制替换就可以成功
![image.png|678](https://img.z2m.store/file/1784356493632_image.png)
将下面的代码直接替换这个文件的内容即可
```
---
import { getCollection } from "astro:content";
import { Icon } from "astro-icon/components";
import WidgetLayout from "@/components/common/WidgetLayout.astro";
import { siteConfig } from "@/config";
import I18nKey from "@/i18n/i18nKey";
import { i18n } from "@/i18n/translation";
import type { WidgetComponentConfig } from "@/types/config";
import { formatDynamicDate } from "@/utils/date-utils";
import {
	dynamicAnchor,
	dynamicPlainText,
	sortDynamics,
} from "@/utils/dynamic-utils";
import { url } from "@/utils/url-utils";

interface Props {
	class?: string;
	style?: string;
	widgetConfig?: WidgetComponentConfig;
}

const { class: className, style, widgetConfig } = Astro.props;
const showTitle = widgetConfig?.showTitle !== false;
const configuredLimit = widgetConfig?.specificConfig?.dynamic?.limit ?? 3;
const limit = Math.max(1, Math.floor(configuredLimit));
const imagePattern = /!\[([^\]]*)\]\((\S+?)(?:\s+["'][^"']*["'])?\)/;

// 接口地址
const REMOTE_DYNAMIC_API = "https://zz.z2m.store";
// 开关：远程Memos动态
const useRemoteMemos = true;

// 本地静态数据（备用）
let localDynamics: Array<{
	id: string;
	text: string;
	published: Date;
	image: { alt: string; src: string } | null;
}> = [];
if (siteConfig.pages.dynamic && !useRemoteMemos) {
	localDynamics = sortDynamics(await getCollection("dynamic"))
		.slice(0, limit)
		.map((entry) => {
			const image = (entry.body || "").match(imagePattern);
			return {
				id: dynamicAnchor(entry.id),
				text: dynamicPlainText(entry),
				published: entry.data.published,
				image: image ? { alt: image[1], src: image[2] } : null,
			};
		});
}
---

{
	(siteConfig.pages.dynamic || useRemoteMemos) && (
		<WidgetLayout
			name={i18n(I18nKey.latestDynamics)}
			showTitle={showTitle}
			id="latest-dynamics"
			class={className}
			style={style}
		>
			<div class="flex flex-col gap-1.5" id="dynamic-widget-list">
				<!-- 加载占位 -->
				{useRemoteMemos ? (
					<p class="m-0 p-3 text-center text-sm text-neutral-500 widget-loading">
						{i18n(I18nKey.dynamicLoading)}
					</p>
				) : localDynamics.length > 0 ? (
					localDynamics.map((entry) => (
						<a
							href={url(`/dynamic/#${entry.id}`)}
							class="group flex min-w-0 min-h-16 items-center gap-3 rounded-lg p-2
								text-neutral-700/75 dark:text-neutral-300/75
								hover:bg-(--btn-plain-bg-hover) hover:text-(--primary)
								active:bg-(--btn-plain-bg-active) transition-colors duration-150"
							aria-label={`${i18n(I18nKey.dynamic)}: ${entry.text}`}
						>
							<div class="min-w-0 flex-1">
								<div class="mb-1 flex items-center gap-1 text-xs leading-4 text-(--primary)">
									<Icon
										is:inline
										name="material-symbols:schedule-rounded"
										class="size-4 shrink-0"
										aria-hidden="true"
									/>
									<time datetime={entry.published.toISOString()}>
										{formatDynamicDate(entry.published)}
									</time>
								</div>
								<p class="m-0 line-clamp-3 text-sm leading-[1.35rem]">
									{entry.text}
								</p>
							</div>
							{entry.image && (
								<img
									src={entry.image.src}
									alt={entry.image.alt}
									class="size-14 shrink-0 rounded-lg bg-(--btn-plain-bg-hover) object-cover"
									loading="lazy"
									decoding="async"
								/>
							)}
						</a>
					))
				) : (
					<p class="m-0 p-3 text-center text-sm text-neutral-500">
						{i18n(I18nKey.dynamicEmpty)}
					</p>
				)}
			</div>
			<a
				class="btn-plain mt-2 flex items-center justify-center gap-1 rounded-lg p-1.5
					text-sm text-(--primary)"
				href={url("/dynamic/")}
			>
				<Icon
					is:inline
					name="material-symbols:dynamic-feed-rounded"
					class="size-4.5"
					aria-hidden="true"
				/>
				<span>{i18n(I18nKey.moreDynamics)}</span>
			</a>
		</WidgetLayout>
	)
}

<!-- 客户端实时请求JS，client:load 页面加载后执行 -->
<script client:load>
	const API = "https://zz.z2m.store";
	const limit = 3;
	const wrap = document.getElementById("dynamic-widget-list");

	// 格式化日期，和服务端formatDynamicDate逻辑保持一致
	function formatDate(ms) {
		const d = new Date(ms);
		return d.toLocaleDateString("zh-CN", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	}

	async function fetchMemos() {
		try {
			const res = await fetch(API);
			const list = await res.json();
			if (!Array.isArray(list) || list.length === 0) {
				wrap.innerHTML = `<p class="m-0 p-3 text-center text-sm text-neutral-500">暂无说说</p>`;
				return;
			}
			// 时间倒序，截取条数
			const sorted = list
				.sort((a, b) => b.published - a.published)
				.slice(0, limit);

			let html = "";
			sorted.forEach((item) => {
				const img = item.images?.length ? item.images[0] : null;
				const timeStr = formatDate(item.published);
				html += `
					<a href="/dynamic/#${item.id}"
						class="group flex min-w-0 min-h-16 items-center gap-3 rounded-lg p-2
						text-neutral-700/75 dark:text-neutral-300/75
						hover:bg-(--btn-plain-bg-hover) hover:text-(--primary)
						active:bg-(--btn-plain-bg-active) transition-colors duration-150"
						aria-label="说说: ${item.searchText}">
						<div class="min-w-0 flex-1">
							<div class="mb-1 flex items-center gap-1 text-xs leading-4 text-(--primary)">
								<svg class="size-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z"/></svg>
								<time>${timeStr}</time>
							</div>
							<p class="m-0 line-clamp-3 text-sm leading-[1.35rem]">${item.searchText}</p>
						</div>
						${img ? `<img src="${img.src}" alt="${img.alt}" class="size-14 shrink-0 rounded-lg bg-(--btn-plain-bg-hover) object-cover" loading="lazy">` : ""}
					</a>
				`;
			});
			wrap.innerHTML = html;
		} catch (err) {
			wrap.innerHTML = `<p class="m-0 p-3 text-center text-sm text-neutral-500">加载失败</p>`;
		}
	}

	fetchMemos();
</script>
```

这样完成后，最终的显示是
![image.png](https://img.z2m.store/file/1784356665328_image.png)

完结，撒花🌸。