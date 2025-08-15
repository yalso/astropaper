# My Collage Astro (Astro 5 + Vue 3)

基于 Astro + Vue 的科研拼图工具。

## 开发
```bash
npm install
npm run dev
```

## 构建
```bash
npm run build
npm run preview
```

## 部署到子路径（可选）
在 `astro.config.mjs` 中设置：
```js
export default defineConfig({
  site: 'https://yourname.github.io',
  base: '/paper-collage/'
});
```

## Vercel 构建提示
本模板已在 `astro.config.mjs` 中为 `@` 配置了别名（指向 `./src`）。
如果你仍遇到无法解析 `@/` 的构建错误，可将 `src/pages/index.astro` 的导入改为相对路径：

```astro
import CollageTool from "../components/CollageTool.vue";
```
