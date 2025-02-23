import type * as MarkdownIt from 'markdown-it';
import type { RendererContext } from 'vscode-notebook-renderer';
import * as frontMatterPlugin from "markdown-it-front-matter";
import footnotePlugin from "markdown-it-footnote";
import docutilsPlugin from "markdown-it-docutils";
import dollarmathPlugin from "markdown-it-dollarmath";
import amsmathPlugin from "markdown-it-amsmath";
import { renderToString } from "katex";
import { convertFrontMatter, mystBlockPlugin } from "./mdPlugins";
interface MarkdownItRenderer {
  extendMarkdownIt(fn: (md: MarkdownIt) => void): void;
}

export async function activate(ctx: RendererContext<void>) {
  const markdownItRenderer = await ctx.getRenderer('vscode.markdown-it-renderer') as MarkdownItRenderer | undefined;
  if (!markdownItRenderer) {
    throw new Error(`Could not load 'vscode.markdown-it-renderer'`);
  }

  const style = document.createElement('style');
  style.textContent = `{'--color-foreground-primary': '#ffffffd9',
'--color-foreground-secondary': '#9ca0a5',
'--color-foreground-border': '#666666',
'--color-background-primary': '#131416',
'--color-background-secondary': '#1a1c1e',
'--color-background-border': '#303335',
'--icon-search': 'url(\'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z"/><circle cx="10" cy="10" r="7" /><line x1="21" y1="21" x2="15" y2="15" /></svg>\')',
'--icon-pencil': 'url(\'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z"/></svg>\')',
'--icon-abstract': 'url(\'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 5h16v2H4V5m0 4h16v2H4V9m0 4h16v2H4v-2m0 4h10v2H4v-2z"/></svg>\')',
'--icon-info': 'url(\'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 9h-2V7h2m0 10h-2v-6h2m-1-9A10 10 0 002 12a10 10 0 0010 10 10 10 0 0010-10A10 10 0 0012 2z"/></svg>\')',
'--icon-flame': 'url(\'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.55 11.2c-.23-.3-.5-.56-.76-.82-.65-.6-1.4-1.03-2.03-1.66C13.3 7.26 13 4.85 13.91 3c-.91.23-1.75.75-2.45 1.32-2.54 2.08-3.54 5.75-2.34 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.22.1-.46.04-.64-.12a.83.83 0 01-.15-.17c-1.1-1.43-1.28-3.48-.53-5.12C5.89 10 5 12.3 5.14 14.47c.04.5.1 1 .27 1.5.14.6.4 1.2.72 1.73 1.04 1.73 2.87 2.97 4.84 3.22 2.1.27 4.35-.12 5.96-1.6 1.8-1.66 2.45-4.32 1.5-6.6l-.13-.26c-.2-.46-.47-.87-.8-1.25l.05-.01m-3.1 6.3c-.28.24-.73.5-1.08.6-1.1.4-2.2-.16-2.87-.82 1.19-.28 1.89-1.16 2.09-2.05.17-.8-.14-1.46-.27-2.23-.12-.74-.1-1.37.18-2.06.17.38.37.76.6 1.06.76 1 1.95 1.44 2.2 2.8.04.14.06.28.06.43.03.82-.32 1.72-.92 2.27h.01z"/></svg>\')',
'--icon-question': 'url(\'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.07 11.25l-.9.92C13.45 12.89 13 13.5 13 15h-2v-.5c0-1.11.45-2.11 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41a2 2 0 00-2-2 2 2 0 00-2 2H8a4 4 0 014-4 4 4 0 014 4 3.2 3.2 0 01-.93 2.25M13 19h-2v-2h2M12 2A10 10 0 002 12a10 10 0 0010 10 10 10 0 0010-10c0-5.53-4.5-10-10-10z"/></svg>\')',
'--icon-warning': 'url(\'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 14h-2v-4h2m0 8h-2v-2h2M1 21h22L12 2 1 21z"/></svg>\')',
'--icon-failure': 'url(\'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2c5.53 0 10 4.47 10 10s-4.47 10-10 10S2 17.53 2 12 6.47 2 12 2m3.59 5L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41 15.59 7z"/></svg>\')',
'--icon-spark': 'url(\'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11.5 20l4.86-9.73H13V4l-5 9.73h3.5V20M12 2c2.75 0 5.1 1 7.05 2.95C21 6.9 22 9.25 22 12s-1 5.1-2.95 7.05C17.1 21 14.75 22 12 22s-5.1-1-7.05-2.95C3 17.1 2 14.75 2 12s1-5.1 2.95-7.05C6.9 3 9.25 2 12 2z"/></svg>\')',
'--icon-admonition-default': 'var(--icon-abstract)',
'--color-directive-unhandled-background': '#333338',
'--color-directive-error-background': 'rgba(180, 6, 6, 0.8)',
'--admonition-font-size': '0.8125rem',
'--admonition-title-font-size': '0.8125rem',
'--color-admonition-background': '#18181a',
'--color-admonition-title': '#651fff',
'--color-admonition-title-background': 'rgba(101, 31, 255, 0.1)',
'--color-admonition-title--caution': '#ff9100',
'--color-admonition-title-background--caution': 'rgba(255, 145, 0, 0.1)',
...
'--color-admonition-title-background--seealso': 'rgba(68, 138, 255, 0.1)',
'--color-admonition-title--tip': '#00c852',
'--color-admonition-title-background--tip': 'rgba(0, 200, 82, 0.1)',
'--color-admonition-title--admonition-todo': '#808080',
'--color-admonition-title-background--admonition-todo': 'rgba(128, 128, 128, 0.1)'}
Output is truncated. View as a scrollable element or open in a text editor. Adjust cell output settings...

.role-unhandled {
outline: 1px solid #d3d3d3;
border-radius: .2rem;
padding-left: .125rem;
padding-right: .125rem
}

.role-unhandled mark {
-webkit-text-decoration-line: underline;
text-decoration-line: underline;
background-color: unset;
color: unset
}

.role-unhandled code {
padding-left: .15rem
}

.directive-unhandled,
.directive-error {
margin: 1rem auto;
padding: .5rem;
outline: .0625rem solid #d3d3d3;
border-radius: .2rem;
overflow: auto;
color: #ffffffd9
}

.directive-unhandled>:nth-child(2),
.directive-error>:nth-child(2) {
margin-top: 0
}

.directive-unhandled>:last-child,
.directive-error>:last-child {
margin-bottom: 0
}

.directive-unhandled header,
.directive-error header {
margin-bottom: .5rem
}

.directive-unhandled mark,
.directive-error mark {
-webkit-text-decoration-line: underline;
text-decoration-line: underline;
background-color: unset;
color: #ffffffd9
}

.directive-unhandled {
outline: .0625rem solid #d3d3d3;
background-color: #333338
}

.directive-error {
outline: .0625rem solid #f08080;
background-color: rgba(180, 6, 6, 0.8)
}

.admonition {
margin: 1rem auto;
padding: 0 .5rem .5rem .5rem;
background: #18181a;
color: #ffffffd9;
border-radius: .2rem;
border-left: .2rem solid #651fff;
box-shadow: 0 .2rem .5rem rgba(0, 0, 0, .05), 0 0 .0625rem rgba(0, 0, 0, .1);
font-size: 0.8125rem;
overflow: auto;
page-break-inside: avoid
}

.admonition>:nth-child(2) {
margin-top: 0
}

.admonition>:last-child {
margin-bottom: 0
}

.admonition .admonition-title {
position: relative;
margin: 0 -0.5rem .5rem;
padding: .5rem .5rem .5rem 2rem;
font-weight: 500;
font-size: 0.8125rem;
background-color: rgba(101, 31, 255, 0.1);
line-height: 1.3
}

.admonition .admonition-title::before {
content: "";
position: absolute;
left: .5rem;
width: 1rem;
height: 1rem;
background-color: #651fff;
-webkit-mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 5h16v2H4V5m0 4h16v2H4V9m0 4h16v2H4v-2m0 4h10v2H4v-2z"/></svg>');
mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 5h16v2H4V5m0 4h16v2H4V9m0 4h16v2H4v-2m0 4h10v2H4v-2z"/></svg>');
-webkit-mask-repeat: no-repeat;
mask-repeat: no-repeat
}

.admonition.caution {
border-left-color: #ff9100
}

.admonition.caution>.admonition-title {
background-color: rgba(255, 145, 0, 0.1)
}

.admonition.caution>.admonition-title::before {
background-color: #ff9100;
-webkit-mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11.5 20l4.86-9.73H13V4l-5 9.73h3.5V20M12 2c2.75 0 5.1 1 7.05 2.95C21 6.9 22 9.25 22 12s-1 5.1-2.95 7.05C17.1 21 14.75 22 12 22s-5.1-1-7.05-2.95C3 17.1 2 14.75 2 12s1-5.1 2.95-7.05C6.9 3 9.25 2 12 2z"/></svg>');
mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11.5 20l4.86-9.73H13V4l-5 9.73h3.5V20M12 2c2.75 0 5.1 1 7.05 2.95C21 6.9 22 9.25 22 12s-1 5.1-2.95 7.05C17.1 21 14.75 22 12 22s-5.1-1-7.05-2.95C3 17.1 2 14.75 2 12s1-5.1 2.95-7.05C6.9 3 9.25 2 12 2z"/></svg>')
}

.admonition.warning {
border-left-color: #ff9100
}

.admonition.warning>.admonition-title {
background-color: rgba(255, 145, 0, 0.1)
}

.admonition.warning>.admonition-title::before {
background-color: #ff9100;
-webkit-mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 14h-2v-4h2m0 8h-2v-2h2M1 21h22L12 2 1 21z"/></svg>');
mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 14h-2v-4h2m0 8h-2v-2h2M1 21h22L12 2 1 21z"/></svg>')
}

.admonition.danger {
border-left-color: #ff5252
}

.admonition.danger>.admonition-title {
background-color: rgba(255, 82, 82, 0.1)
}

.admonition.danger>.admonition-title::before {
background-color: #ff5252;
-webkit-mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11.5 20l4.86-9.73H13V4l-5 9.73h3.5V20M12 2c2.75 0 5.1 1 7.05 2.95C21 6.9 22 9.25 22 12s-1 5.1-2.95 7.05C17.1 21 14.75 22 12 22s-5.1-1-7.05-2.95C3 17.1 2 14.75 2 12s1-5.1 2.95-7.05C6.9 3 9.25 2 12 2z"/></svg>');
mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11.5 20l4.86-9.73H13V4l-5 9.73h3.5V20M12 2c2.75 0 5.1 1 7.05 2.95C21 6.9 22 9.25 22 12s-1 5.1-2.95 7.05C17.1 21 14.75 22 12 22s-5.1-1-7.05-2.95C3 17.1 2 14.75 2 12s1-5.1 2.95-7.05C6.9 3 9.25 2 12 2z"/></svg>')
}

.admonition.attention {
border-left-color: #ff5252
}

.admonition.attention>.admonition-title {
background-color: rgba(255, 82, 82, 0.1)
}

.admonition.attention>.admonition-title::before {
background-color: #ff5252;
-webkit-mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 14h-2v-4h2m0 8h-2v-2h2M1 21h22L12 2 1 21z"/></svg>');
mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 14h-2v-4h2m0 8h-2v-2h2M1 21h22L12 2 1 21z"/></svg>')
}

.admonition.error {
border-left-color: #ff5252
}

.admonition.error>.admonition-title {
background-color: rgba(255, 82, 82, 0.1)
}

.admonition.error>.admonition-title::before {
background-color: #ff5252;
-webkit-mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2c5.53 0 10 4.47 10 10s-4.47 10-10 10S2 17.53 2 12 6.47 2 12 2m3.59 5L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41 15.59 7z"/></svg>');
mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2c5.53 0 10 4.47 10 10s-4.47 10-10 10S2 17.53 2 12 6.47 2 12 2m3.59 5L12 10.59 8.41 7 7 8.41 10.59 12 7 15.59 8.41 17 12 13.41 15.59 17 17 15.59 13.41 12 17 8.41 15.59 7z"/></svg>')
}

.admonition.hint {
border-left-color: #00c852
}

.admonition.hint>.admonition-title {
background-color: rgba(0, 200, 82, 0.1)
}

.admonition.hint>.admonition-title::before {
background-color: #00c852;
-webkit-mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.07 11.25l-.9.92C13.45 12.89 13 13.5 13 15h-2v-.5c0-1.11.45-2.11 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41a2 2 0 00-2-2 2 2 0 00-2 2H8a4 4 0 014-4 4 4 0 014 4 3.2 3.2 0 01-.93 2.25M13 19h-2v-2h2M12 2A10 10 0 002 12a10 10 0 0010 10 10 10 0 0010-10c0-5.53-4.5-10-10-10z"/></svg>');
mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M15.07 11.25l-.9.92C13.45 12.89 13 13.5 13 15h-2v-.5c0-1.11.45-2.11 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41a2 2 0 00-2-2 2 2 0 00-2 2H8a4 4 0 014-4 4 4 0 014 4 3.2 3.2 0 01-.93 2.25M13 19h-2v-2h2M12 2A10 10 0 002 12a10 10 0 0010 10 10 10 0 0010-10c0-5.53-4.5-10-10-10z"/></svg>')
}

.admonition.important {
border-left-color: #00bfa5
}

.admonition.important>.admonition-title {
background-color: rgba(0, 191, 165, 0.1)
}

.admonition.important>.admonition-title::before {
background-color: #00bfa5;
-webkit-mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.55 11.2c-.23-.3-.5-.56-.76-.82-.65-.6-1.4-1.03-2.03-1.66C13.3 7.26 13 4.85 13.91 3c-.91.23-1.75.75-2.45 1.32-2.54 2.08-3.54 5.75-2.34 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.22.1-.46.04-.64-.12a.83.83 0 01-.15-.17c-1.1-1.43-1.28-3.48-.53-5.12C5.89 10 5 12.3 5.14 14.47c.04.5.1 1 .27 1.5.14.6.4 1.2.72 1.73 1.04 1.73 2.87 2.97 4.84 3.22 2.1.27 4.35-.12 5.96-1.6 1.8-1.66 2.45-4.32 1.5-6.6l-.13-.26c-.2-.46-.47-.87-.8-1.25l.05-.01m-3.1 6.3c-.28.24-.73.5-1.08.6-1.1.4-2.2-.16-2.87-.82 1.19-.28 1.89-1.16 2.09-2.05.17-.8-.14-1.46-.27-2.23-.12-.74-.1-1.37.18-2.06.17.38.37.76.6 1.06.76 1 1.95 1.44 2.2 2.8.04.14.06.28.06.43.03.82-.32 1.72-.92 2.27h.01z"/></svg>');
mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M17.55 11.2c-.23-.3-.5-.56-.76-.82-.65-.6-1.4-1.03-2.03-1.66C13.3 7.26 13 4.85 13.91 3c-.91.23-1.75.75-2.45 1.32-2.54 2.08-3.54 5.75-2.34 8.9.04.1.08.2.08.33 0 .22-.15.42-.35.5-.22.1-.46.04-.64-.12a.83.83 0 01-.15-.17c-1.1-1.43-1.28-3.48-.53-5.12C5.89 10 5 12.3 5.14 14.47c.04.5.1 1 .27 1.5.14.6.4 1.2.72 1.73 1.04 1.73 2.87 2.97 4.84 3.22 2.1.27 4.35-.12 5.96-1.6 1.8-1.66 2.45-4.32 1.5-6.6l-.13-.26c-.2-.46-.47-.87-.8-1.25l.05-.01m-3.1 6.3c-.28.24-.73.5-1.08.6-1.1.4-2.2-.16-2.87-.82 1.19-.28 1.89-1.16 2.09-2.05.17-.8-.14-1.46-.27-2.23-.12-.74-.1-1.37.18-2.06.17.38.37.76.6 1.06.76 1 1.95 1.44 2.2 2.8.04.14.06.28.06.43.03.82-.32 1.72-.92 2.27h.01z"/></svg>')
}

.admonition.note {
border-left-color: #00b0ff
}

.admonition.note>.admonition-title {
background-color: rgba(0, 176, 255, 0.1)
}

.admonition.note>.admonition-title::before {
background-color: #00b0ff;
-webkit-mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z"/></svg>');
mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z"/></svg>')
}

.admonition.seealso {
border-left-color: #448aff
}

.admonition.seealso>.admonition-title {
background-color: rgba(68, 138, 255, 0.1)
}

.admonition.seealso>.admonition-title::before {
background-color: #448aff;
-webkit-mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 9h-2V7h2m0 10h-2v-6h2m-1-9A10 10 0 002 12a10 10 0 0010 10 10 10 0 0010-10A10 10 0 0012 2z"/></svg>');
mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 9h-2V7h2m0 10h-2v-6h2m-1-9A10 10 0 002 12a10 10 0 0010 10 10 10 0 0010-10A10 10 0 0012 2z"/></svg>')
}

.admonition.tip {
border-left-color: #00c852
}

.admonition.tip>.admonition-title {
background-color: rgba(0, 200, 82, 0.1)
}

.admonition.tip>.admonition-title::before {
background-color: #00c852;
-webkit-mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 9h-2V7h2m0 10h-2v-6h2m-1-9A10 10 0 002 12a10 10 0 0010 10 10 10 0 0010-10A10 10 0 0012 2z"/></svg>');
mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M13 9h-2V7h2m0 10h-2v-6h2m-1-9A10 10 0 002 12a10 10 0 0010 10 10 10 0 0010-10A10 10 0 0012 2z"/></svg>')
}

.admonition.admonition-todo {
border-left-color: #808080
}

.admonition.admonition-todo>.admonition-title {
background-color: rgba(128, 128, 128, 0.1)
}

.admonition.admonition-todo>.admonition-title::before {
background-color: #808080;
-webkit-mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z"/></svg>');
mask-image: url('data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M20.71 7.04c.39-.39.39-1.04 0-1.41l-2.34-2.34c-.37-.39-1.02-.39-1.41 0l-1.84 1.83 3.75 3.75M3 17.25V21h3.75L17.81 9.93l-3.75-3.75L3 17.25z"/></svg>')
}

.admonition-todo>.admonition-title {
text-transform: uppercase
}

img {
box-sizing: border-box;
max-width: 100%;
height: auto
}

img.align-left,
figure.align-left {
clear: left;
float: left;
margin-right: 1em
}

img.align-right,
figure.align-right {
clear: right;
float: right;
margin-right: 1em
}

img.align-center,
img.align-default,
figure.align-center,
figure.align-default {
display: block;
margin-left: auto;
margin-right: auto
}

figcaption {
font-style: italic;
text-align: center
}

table {
border-radius: .2rem;
border-spacing: 0;
border-collapse: collapse;
box-shadow: 0 .2rem .5rem rgba(0, 0, 0, .05), 0 0 .0625rem rgba(0, 0, 0, .1)
}

table>caption {
text-align: center;
margin-bottom: .25rem
}

th {
background: #1a1c1e;
color: #ffffffd9
}

td,
th {
padding: 0 .25rem;
border-left: 1px solid #303335;
border-right: 1px solid #303335;
border-bottom: 1px solid #303335
}

td p,
th p {
margin: .25rem
}

td:first-child,
th:first-child {
border-left: none
}

td:last-child,
th:last-child {
border-right: none
}`;

  const styleTemplate = document.createElement('template');
  styleTemplate.classList.add('markdown-style');
  styleTemplate.content.appendChild(style);
  document.head.appendChild(styleTemplate);

  const emoji = require('markdown-it-emoji');
  markdownItRenderer.extendMarkdownIt((md: MarkdownIt) => {
    // add in the MyST Stuff
    const newMd = md
      .use(emoji)
      .enable("table")
      .use(frontMatterPlugin)
      .use(convertFrontMatter)
      .use(mystBlockPlugin)
      .use(footnotePlugin)
      .disable("footnote_inline") // not yet implemented in myst-parser
      .use(docutilsPlugin)
      .use(dollarmathPlugin, {
        double_inline: true,
        renderer: renderToString,
        optionsInline: { throwOnError: false, displayMode: false },
        optionsBlock: { throwOnError: false, displayMode: true }
      })
      .use(amsmathPlugin, {
        renderer: renderToString,
        options: { throwOnError: false, displayMode: true }
      })
    // TODO substitutions
    return newMd;
  });
}