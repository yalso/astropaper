# Bundle Optimization Notes

- Lazy-loaded `html2canvas` and `jspdf` via dynamic `import()` inside `downloadFile()`.
- Defer hydration using `client:visible` on `<CollageTool />`.
- Added Rollup `manualChunks` for `vue`, `html2canvas`, and `jspdf` and raised `chunkSizeWarningLimit` to 1024 kB.

Expected effect: initial JS for the page drops significantly; export-only libraries are fetched on demand when you点击“下载”。
