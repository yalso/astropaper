<template>
  <div class="relative">
    <!-- Controls -->
    <div class="fixed top-4 right-4 flex gap-2 z-20">
      <button @click="toggleTheme" class="btn-ghost" :title="theme === 'dark' ? '切换到亮色' : '切换到暗色'">
        <svg v-if="theme==='dark'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        <span class="hidden md:inline">{{ theme === 'dark' ? '暗' : '亮' }}</span>
      </button>
      <button class="btn-ghost" @click="toggleLang">{{ currentLang === 'zh' ? '中 / EN' : 'EN / 中' }}</button>
    </div>

    <header class="text-center mb-8">
      <h1 class="text-3xl md:text-4xl font-bold mb-2 heading-solid">{{ t('mainTitle') }}</h1>
      <p class="opacity-80">{{ t('subTitle') }}</p>
    </header>

    <!-- Panels (left/right) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <div class="solid-card p-6 shadow-xl">
        <h2 class="text-xl font-semibold mb-4 border-b border-white/10 pb-2">{{ t('panelTitle1') }}</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">{{ t('colsLabel') }}</label>
            <input type="number" v-model.number="columns" min="1" class="field" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">{{ t('rowsLabel') }}</label>
            <input type="number" v-model.number="rows" min="1" class="field" />
          </div>
          <div class="col-span-2">
            <button @click="createGrid()" class="w-full mt-2 btn-primary">
              {{ t('generateBtn') }}
            </button>
          </div>
        </div>
      </div>

      <div class="solid-card p-6 shadow-xl">
        <h2 class="text-xl font-semibold mb-4 border-b border-white/10 pb-2">{{ t('panelTitle2') }}</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">{{ t('marginLabel') }}</label>
            <input type="number" v-model.number="pageMargin" min="0" class="field" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">{{ t('colGapLabel') }}</label>
            <input type="number" v-model.number="columnGap" min="0" class="field" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">{{ t('rowGapLabel') }}</label>
            <input type="number" v-model.number="rowGap" min="0" class="field" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">{{ t('footerGapLabel') }}</label>
            <input type="number" v-model.number="footerGap" min="0" class="field" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">{{ t('footerFontSizeLabel') }}</label>
            <input type="number" v-model.number="fontSize" min="8" class="field" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">{{ t('bgColorLabel') }}</label>
            <input type="color" v-model="bgColor" class="w-full h-10 p-1 bg-white/5 rounded-md cursor-pointer border border-white/20" />
          </div>

          <div>
            <label class="inline-flex items-center gap-2 text-sm font-medium mb-1">
              <input type="checkbox" v-model="showImageBorder" class="accent-blue-600" />
              <span>显示图片边框（导出时自动隐藏）</span>
            </label>
          </div>

          <div class="md:col-span-3">
            <label class="block text-sm font-medium mb-1">{{ t('watermarkLabel') }}</label>
            <input type="text" v-model="watermarkText" :placeholder="t('watermarkPlaceholder')" class="field" />
          </div>
        </div>
      </div>
    </div>

    <!-- Collage area -->
    <div class="solid-card p-6 shadow-xl mb-8">
      <h2 class="text-xl font-semibold mb-4 border-b border-white/10 pb-2">{{ t('panelTitle3') }}</h2>

      <!-- ⚠️ Add collage-wrapper + transition-all duration-300 -->
      <div ref="wrapperRef" class="transition-all duration-300 collage-wrapper" :style="wrapperStyle">
        <div ref="containerRef" class="flex flex-col">
          <p v-if="!hasGrid" class="text-slate-700/80 dark:text-slate-200/70 text-center py-10 font-semibold">{{ t('initialPrompt') }}</p>

          <div v-else class="grid image-grid" :style="imageGridStyle">
            <div
              v-for="(cell, idx) in cells"
              :key="idx"
              class="image-upload-box"
              :class="{ active: activeIndex === idx, empty: !cell.src, 'with-border': cell.src && showImageBorder }"
              @click="onCellClick(idx)"
            >
              <div v-if="!cell.src" class="upload-prompt flex flex-col items-center justify-center p-2 select-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mb-2 icon-contrast">
                  <path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2.4-2.4-4.2-4.8-4.8-.9-.3-1.8-.5-2.7-.5-1.7 0-3.3.7-4.5 2-1.2-1.3-2.8-2-4.5-2-2.5 0-4.7 1.8-5.2 4.2-.5 2.5.7 5 3.2 5.7.5.1 1 .2 1.5.2H20c.7 0 1.3-.2 1.8-.5l-.6-1.2z"/>
                  <path d="M12 12v9"/>
                  <path d="m16 16-4-4-4 4"/>
                </svg>
                <span class="upload-text-contrast">{{ t('uploadPrompt') }}</span>
              </div>
              <input type="file" accept="image/*" class="image-input hidden" @change="onUpload($event, idx)" />
              <img v-if="cell.src" :src="cell.src" class="preview-img" />
            </div>
          </div>

          <div v-if="hasGrid" class="grid footer-grid mt-4" :style="footerGridStyle">
            <input
              v-for="(cap, i) in footers"
              :key="i"
              type="text"
              class="caption-input"
              v-model="footers[i]"
              :placeholder="t('footerPlaceholder').replace('{i}', String(i + 1))"
              :style="{ fontSize: fontSize + 'px' }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Export -->
    <div class="solid-card p-6 shadow-xl mb-8">
      <h2 class="text-xl font-semibold mb-4 border-b border-white/10 pb-2">{{ t('panelTitle4') }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div class="md:col-span-2 flex items-center gap-2">
          <input type="text" v-model="fileBase" class="field flex-grow" :placeholder="t('filenamePlaceholder')" />
          <select v-model="format" class="select">
            <option value="png">.png</option>
            <option value="jpeg">.jpeg</option>
            <option value="pdf">.pdf</option>
          </select>
        </div>
        <button :disabled="loading" @click="downloadFile" class="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>{{ t('downloadBtn') }}</span>
        </button>
      </div>
      <div v-if="loading" class="mt-4 text-center text-blue-400">{{ t('loading') }}</div>
    </div>

    <!-- History -->
    <div class="solid-card p-6 shadow-xl">
      <h2 class="text-xl font-semibold mb-4 border-b border-white/10 pb-2">{{ t('panelTitle5') }}</h2>
      <button @click="saveHistory" class="w-full mb-4 btn-primary">{{ t('saveHistoryBtn') }}</button>
      <div class="space-y-2">
        <template v-if="history.length === 0">
          <p class="opacity-70 text-center text-sm">{{ t('initialPrompt') }}</p>
        </template>
        <div v-else v-for="item in history" :key="item.id" class="history-item">
          <span class="truncate pr-4">{{ item.name }}</span>
          <div class="flex-shrink-0 space-x-2">
            <button class="btn-primary text-sm font-semibold" @click="loadHistory(item.id)">{{ t('loadBtn') }}</button>
            <button class="btn-primary text-sm font-semibold" @click="deleteHistory(item.id)">{{ t('deleteBtn') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, ref, computed } from 'vue';

/* I18N */
const translations = {
  mainTitle: { en: 'Scientific Paper Collage Tool (Astro + Vue)', zh: '科研论文拼图工具（Astro + Vue）' },
  subTitle: { en: 'Intelligent layout, precise control, professional typesetting of figures.', zh: '智能布局、精准控制，专业排版您的实验图' },
  panelTitle1: { en: '1. Layout Settings', zh: '1. 布局设置' },
  colsLabel: { en: 'Columns', zh: '列数' },
  rowsLabel: { en: 'Rows', zh: '行数' },
  generateBtn: { en: 'Generate/Reset Grid', zh: '生成/重置网格' },
  panelTitle2: { en: '2. Style & Security', zh: '2. 样式与安全' },
  marginLabel: { en: 'Page Margin (px)', zh: '页边距 (px)' },
  colGapLabel: { en: 'Column Gap (px)', zh: '列间距 (px)' },
  rowGapLabel: { en: 'Row Gap (px)', zh: '行间距 (px)' },
  footerGapLabel: { en: 'Footer Gap (px)', zh: '脚注间距 (px)' },
  footerFontSizeLabel: { en: 'Footer Font Size (px)', zh: '脚注字号 (px)' },
  bgColorLabel: { en: 'Background Color', zh: '背景颜色' },
  watermarkLabel: { en: 'Watermark Text (leave blank for none)', zh: '水印文字 (留空则无水印)' },
  watermarkPlaceholder: { en: 'e.g., your-website.com', zh: '例如: your-website.com' },
  panelTitle3: { en: '3. Edit Content', zh: '3. 编辑内容' },
  initialPrompt: { en: 'Set rows & columns above and click "Generate Grid"', zh: '请在上方设置行列数并点击“生成网格”' },
  uploadPrompt: { en: 'Click to Upload/Paste/Replace', zh: '点击上传/粘贴/替换' },
  footerPlaceholder: { en: 'Column {i} Footer', zh: '第 {i} 列脚注' },
  panelTitle4: { en: '4. Export File', zh: '4. 导出文件' },
  filenamePlaceholder: { en: 'Enter filename...', zh: '输入文件名...' },
  downloadBtn: { en: 'Download File', zh: '下载文件' },
  loading: { en: 'Generating file, please wait...', zh: '正在生成文件，请稍候...' },
  panelTitle5: { en: '5. History', zh: '5. 历史记录' },
  saveHistoryBtn: { en: 'Save Current Layout', zh: '保存当前排版' },
  loadBtn: { en: 'Load', zh: '加载' },
  deleteBtn: { en: 'Delete', zh: '删除' },
  historyItemName: { en: 'Layout from {date}', zh: '排版于 {date}' },
  saveError: { en: 'Failed to save. Storage may be full.', zh: '保存失败，存储空间可能已满。' }
};

const currentLang = ref('zh');
const t = (key) => translations[key]?.[currentLang.value] ?? key;

/* Theme (SSR-safe) */
const THEME_KEY = 'theme';
const theme = ref('dark');
function applyTheme(tname) {
  theme.value = tname;
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', tname);
    try { localStorage.setItem(THEME_KEY, tname); } catch {}
  }
}
function toggleTheme() { applyTheme(theme.value === 'dark' ? 'light' : 'dark'); }

/* UI State */
const columns = ref(3);
const rows = ref(2);
const pageMargin = ref(16);
const columnGap = ref(16);
const rowGap = ref(16);
const footerGap = ref(16);
const fontSize = ref(16);
const bgColor = ref('#ffffff');
const watermarkText = ref('');
const fileBase = ref('my-research-collage');
const format = ref('png');
const loading = ref(false);
const showImageBorder = ref(true);

/* Refs & Data */
const containerRef = ref(null);
const wrapperRef = ref(null);
const cells = reactive([]);
const footers = reactive([]);
const activeIndex = ref(-1);
const hasGrid = computed(() => cells.length > 0);

/* Styles */
const wrapperStyle = computed(() => ({ padding: pageMargin.value + 'px', backgroundColor: bgColor.value }));
const imageGridStyle = computed(() => ({ gridTemplateColumns: `repeat(${columns.value}, 1fr)`, gap: `${rowGap.value}px ${columnGap.value}px` }));
const footerGridStyle = computed(() => ({ gridTemplateColumns: `repeat(${columns.value}, 1fr)`, columnGap: `${columnGap.value}px`, marginTop: `${footerGap.value}px` }));

/* Helpers */
function toggleLang() {
  currentLang.value = currentLang.value === 'zh' ? 'en' : 'zh';
  if (typeof localStorage !== 'undefined') {
    try { localStorage.setItem('preferredLanguage', currentLang.value); } catch {}
  }
}
function restoreLang() {
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('preferredLanguage') : null;
    const browser = typeof navigator !== 'undefined' && navigator.language?.startsWith('zh') ? 'zh' : 'en';
    currentLang.value = saved || browser || 'en';
  } catch { currentLang.value = 'en'; }
}

function setCellFromSrc(i, src) {
  const img = new Image();
  img.onload = () => {
    cells[i] = { src, naturalW: img.naturalWidth, naturalH: img.naturalHeight };
    nextTickUpdateHeights();
  };
  img.src = src;
}

function createGrid(preserve = true) {
  const total = Math.max(1, rows.value) * Math.max(1, columns.value);
  const prev = preserve ? [...cells] : [];
  cells.splice(0, cells.length);
  for (let i = 0; i < total; i++) cells.push(prev[i] ?? { src: null, naturalW: 0, naturalH: 0 });
  const oldF = preserve ? [...footers] : [];
  footers.splice(0, footers.length);
  for (let i = 0; i < columns.value; i++) footers.push(oldF[i] ?? '');
  nextTickUpdateHeights();
}

function onCellClick(idx) {
  activeIndex.value = idx;
  const grid = containerRef.value?.querySelector('.image-grid');
  const box = grid?.children[idx];
  const input = box?.querySelector('input.image-input');
  if (input) input.click();
}

function onUpload(e, idx) {
  const file = e.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const src = ev.target?.result;
    if (typeof src === 'string') setCellFromSrc(idx, src);
  };
  reader.readAsDataURL(file);
}

function handlePaste(e) {
  if (activeIndex.value < 0) return;
  const items = e.clipboardData?.items || [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].type?.includes('image')) {
      const file = items[i].getAsFile();
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result;
        if (typeof src === 'string') setCellFromSrc(activeIndex.value, src);
      };
      reader.readAsDataURL(file);
      e.preventDefault();
      return;
    }
  }
}

function nextTickUpdateHeights() { if (typeof window !== 'undefined') requestAnimationFrame(() => updateAllRowHeights()); }

function updateAllRowHeights() {
  const grid = containerRef.value?.querySelector('.image-grid');
  if (!grid) return;
  const cols = Math.max(1, columns.value);
  const rws = Math.max(1, rows.value);
  const all = Array.from(grid.children);
  for (let r = 0; r < rws; r++) {
    const first = all[r * cols];
    if (!first) continue;
    const idx = r * cols;
    const cell = cells[idx];
    if (cell?.src && cell.naturalW > 0) {
      const boxWidth = first.clientWidth;
      const aspect = cell.naturalH / cell.naturalW;
      const newH = boxWidth * aspect;
      for (let c = 0; c < cols; c++) {
        const el = all[r * cols + c];
        if (el) el.style.height = `${newH}px`;
      }
    } else {
      for (let c = 0; c < cols; c++) {
        const el = all[r * cols + c];
        if (el) el.style.height = ``;
      }
    }
  }
}

async function downloadFile() {
  loading.value = true;
  const name = (fileBase.value || 'collage') + '.' + format.value;
  try {
    const [{ default: html2canvas }, jspdfMod] = await Promise.all([ import('html2canvas'), import('jspdf') ]);
    const { jsPDF } = jspdfMod;
    const canvas = await html2canvas(wrapperRef.value, {
      backgroundColor: '#ffffff',
      scale: 3,
      useCORS: true,
      onclone: (doc) => {
        // Hide inputs' borders & empty text
        doc.querySelectorAll('input.caption-input').forEach((input) => {
          input.style.border = 'none';
          if (input.value === '') input.style.setProperty('color', 'transparent', 'important');
        });
        // Remove image borders & force white background for slots
        doc.querySelectorAll('.image-upload-box').forEach((el) => {
          el.style.border = 'none';
          el.style.boxShadow = 'none';
          el.style.background = '#ffffff';
        });
        doc.querySelectorAll('.preview-img').forEach((el) => {
          el.style.border = 'none';
          el.style.boxShadow = 'none';
        });
        // Hide upload prompts
        doc.querySelectorAll('.upload-prompt').forEach((el) => { el.style.display = 'none'; });
        // ✅ Remove dashed frame on export
        doc.querySelectorAll('.collage-wrapper').forEach((el) => { el.style.border = 'none'; });
      }
    });
    if (format.value === 'pdf') {
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? 'l' : 'p', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(name);
    } else {
      const link = document.createElement('a');
      link.download = name;
      link.href = canvas.toDataURL(`image/${format.value}`, 1.0);
      link.click();
    }
  } catch (e) {
    console.error(e);
    alert(t('saveError'));
  } finally {
    loading.value = false;
  }
}

/* History */
const HISTORY_KEY = 'collageHistory';
const history = ref([]);
function getHistory() { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; } }
function saveHistory() {
  const settings = { columns: columns.value, rows: rows.value, pageMargin: pageMargin.value, columnGap: columnGap.value, rowGap: rowGap.value, footerGap: footerGap.value, fontSize: fontSize.value, bgColor: bgColor.value, watermarkText: watermarkText.value };
  const images = cells.map((c) => (c?.src?.startsWith('data:') ? c.src : null));
  const rec = { id: Date.now(), name: (translations.historyItemName[currentLang.value] || '{date}').replace('{date}', new Date().toLocaleString()), settings, footers: [...footers], images };
  const list = getHistory(); list.unshift(rec);
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); renderHistoryList(); } catch (e) { alert(t('saveError')); }
}
function loadHistory(id) {
  const list = getHistory(); const rec = list.find((r) => r.id === id); if (!rec) return;
  columns.value = Number(rec.settings.columns) || 1;
  rows.value  = Number(rec.settings.rows) || 1;
  pageMargin.value = Number(rec.settings.pageMargin) || 0;
  columnGap.value  = Number(rec.settings.columnGap) || 0;
  rowGap.value     = Number(rec.settings.rowGap) || 0;
  footerGap.value  = Number(rec.settings.footerGap) || 0;
  fontSize.value   = Number(rec.settings.fontSize) || 12;
  bgColor.value    = rec.settings.bgColor || '#ffffff';
  watermarkText.value = rec.settings.watermarkText || '';
  createGrid(false);
  const total = Math.max(1, rows.value) * Math.max(1, columns.value);
  const imgs = Array.isArray(rec.images) ? rec.images : [];
  for (let i = 0; i < total; i++) {
    const src = imgs[i] || null;
    if (!src) cells[i] = { src: null, naturalW: 0, naturalH: 0 };
    else if (typeof src === 'string') setCellFromSrc(i, src);
  }
  const savedFooters = Array.isArray(rec.footers) ? rec.footers : [];
  footers.splice(0, footers.length);
  for (let i = 0; i < columns.value; i++) footers.push(savedFooters[i] ?? '');
}
function deleteHistory(id) { const list = getHistory().filter((r) => r.id !== id); localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); renderHistoryList(); }
function renderHistoryList() { history.value = getHistory(); }

/* Lifecycle */
onMounted(() => {
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_KEY) : null;
    if (saved) applyTheme(saved);
  } catch {}
  restoreLang();
  createGrid(true);
  renderHistoryList();
  if (typeof document !== 'undefined') {
    document.addEventListener('paste', handlePaste);
    document.addEventListener('contextmenu', (e) => e.preventDefault());
    document.addEventListener('keydown', (e) => { if (e.ctrlKey && ['s','c','u'].includes(e.key)) e.preventDefault(); });
  }
  if (typeof window !== 'undefined') window.addEventListener('resize', updateAllRowHeights);
});
onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.removeEventListener('paste', handlePaste);
  if (typeof window !== 'undefined') window.removeEventListener('resize', updateAllRowHeights);
});
</script>

<style scoped>
/* Collage visible frame (hidden on export via onclone) */
.collage-wrapper {
  border: 2px dashed var(--line-strong);
  border-radius: 12px;
  transition: all .3s ease;
}

/* Image slots */
.image-upload-box {
  position: relative; width: 100%; border: none;
  display: flex; align-items: center; justify-content: center;
  background-color: var(--slot-bg);
  overflow: hidden; transition: all 0.2s ease-in-out;
  min-height: 100px; cursor: pointer;
}
.image-upload-box:hover { background-color: var(--slot-hover); }
.image-upload-box.active { outline: 2px solid rgba(59,130,246,.4); }
.image-upload-box.empty { border: 2px dashed var(--line-strong); }
.image-upload-box.with-border { border: 1px solid var(--line); }

.image-upload-box .preview-img {
  width: 100%; height: 100%; object-fit: contain; position: absolute; top: 0; left: 0; pointer-events: none;
}

/* Upload prompt: unified day/night (use --slot-text) */
.upload-text-contrast { color: var(--slot-text); font-weight: 600; }
.icon-contrast { stroke: var(--slot-text); }

.history-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.75rem; border-radius: 0.75rem; transition: none;
  background: var(--item-bg);
  border: 1px solid var(--item-border);
}
.history-item .truncate { color: var(--history-title); font-weight: 600; }

.caption-input {
  font-family: 'Times New Roman', Times, serif;
  width: 100%; text-align: center; padding: .5rem .25rem;
  background: transparent; color: var(--text); border: none; outline: none;
}
</style>
