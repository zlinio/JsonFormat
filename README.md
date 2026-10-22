# Toolbox

使用 React、TypeScript、Tailwind CSS 和 Bun 开发的浏览器工具合集，部署在 GitHub Pages。

- [工具合集首页](https://zlinio.github.io/toolbox/#/)
- [JSON Format](https://zlinio.github.io/toolbox/#/tools/json-format)

## 功能

- JSON Format：自动格式化、语法校验、代码折叠、复制和下载，保留大整数与小数的原始精度。
- 中英文切换，支持跟随浏览器语言。
- 浅色与中性黑色主题，支持平滑切换和减少动态效果偏好。
- 工具按需加载，共用语言、主题和通知组件。
- JSON 内容在浏览器内处理；页面内切换工具保留输入草稿，刷新后清空。
- 不设置输入或格式化输出的字符上限，实际处理能力取决于浏览器和设备内存。保留 256 层嵌套保护，防止递归解析器栈溢出。
- 基于 shadcn/ui 的按钮、语言菜单、悬浮提示、分隔线和 Sonner 通知，统一键盘操作与焦点反馈。

## 本地开发

使用 Bun 1.3.14：

```sh
git clone https://github.com/zlinio/toolbox.git
cd toolbox
bun install --frozen-lockfile --ignore-scripts
bun run dev
```

类型检查与测试：

```sh
bun run typecheck
bun test
```

## 项目结构

```text
src/
  app/                路由、全局状态与页面错误处理
  pages/home/         工具合集首页
  shared/             共用组件、主题与样式
  i18n/               共用翻译与语言设置
  tools/json-format/  JSON 工具及其翻译、样式和 Worker
  tool-registry.ts    工具注册表
```

新增工具时，在 `src/tools/` 下创建独立模块，在 `src/tool-registry.ts` 中登记路由、名称、描述和懒加载入口，并补充中英文翻译。首页与路由会读取注册表。

## UI 组件

通过 [shadcn/ui 官方 CLI](https://ui.shadcn.com/docs/installation/vite) 引入的 Radix 组件源码保存在 `src/shared/components/ui/`，配置位于 `components.json`；图标使用 Lucide。

- 工具栏统一使用 `IconButton`，提供 32px 点击区域、国际化标签和 Tooltip。
- 颜色通过 `src/shared/styles.css` 中的 Tailwind 语义变量映射到原有主题，继续使用中性黑色和全局平滑过渡。
- Sonner 直接接收现有主题状态；语言菜单继续支持“跟随浏览器”，沿用原来的偏好存储键。
- 后续可以使用 `bunx --bun shadcn@latest add <组件名>` 添加组件。更新已有组件时需保留主题、工具函数路径等本地定制。

shadcn/ui 源码的 MIT 许可见 `THIRD_PARTY_NOTICES.md`。

## GitHub Pages

推送到 `main` 后，现有 GitHub Actions 工作流自动检查、生成静态文件并部署；也可在 Actions 中手动运行 `Deploy to GitHub Pages`。仓库的 Pages 发布源应设为 **GitHub Actions**。

资源路径使用 GitHub Pages 返回的 `base_path`，无需硬编码仓库名。站内使用 Hash 路由，直接访问工具地址或刷新页面均可正常加载。

项目已由 `JsonFormat` 更名为 `toolbox`，展示名称为 **Toolbox**；JSON 子工具继续使用 **JSON Format** 和 `/tools/json-format` 路由。

- 新站点地址为 `https://zlinio.github.io/toolbox/`。GitHub 不会自动重定向旧的 `https://zlinio.github.io/JsonFormat/` Pages 地址，请更新书签。
- 原仓库地址由 GitHub 重定向；已有本地克隆可运行 `git remote set-url origin https://github.com/zlinio/toolbox.git` 更新远程地址。
- `json-format.language` 与 `json-format.theme` 两个存储键刻意保留。新旧 Pages 路径属于同一来源，原有语言和主题偏好会继续生效。
