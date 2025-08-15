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
