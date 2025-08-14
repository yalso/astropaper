<template>
  <div class="relative">
    <button
      id="lang-switch-btn"
      class="absolute top-0 right-0 md:top-2 md:right-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-300 z-10"
      @click="toggleLang"
    >
      {{ currentLang === 'zh' ? '中 / EN' : 'EN / 中' }}
    </button>

    <header class="text-center mb-8">
      <h1 class="text-3xl md:text-4xl font-bold mb-2">{{ t('mainTitle') }}</h1>
      <p class="text-gray-400">{{ t('subTitle') }}</p>
    </header>

    <!-- 1. 布局设置 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 class="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">{{ t('panelTitle1') }}</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">{{ t('colsLabel') }}</label>
            <input type="number" v-model.number="columns" min="1" class="w-full bg-gray-700 rounded-md p-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">{{ t('rowsLabel') }}</label>
            <input type="number" v-model.number="rows" min="1" class="w-full bg-gray-700 rounded-md p-2" />
          </div>
          <div class="col-span-2">
            <button @click="createGrid" class="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md">{{ t('generateBtn') }}</button>
          </div>
        </div>
      </div>

      <!-- 2. 样式与安全 -->
      <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 class="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">{{ t('panelTitle2') }}</h2>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">{{ t('marginLabel') }}</label>
            <input type="number" v-model.number="pageMargin" min="0" class="w-full bg-gray-700 rounded-md p-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">{{ t('colGapLabel') }}</label>
            <input type="number" v-model.number="columnGap" min="0" class="w-full bg-gray-700 rounded-md p-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">{{ t('rowGapLabel') }}</label>
            <input type="number" v-model.number="rowGap" min="0" class="w-full bg-gray-700 rounded-md p-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">{{ t('footerGapLabel') }}</label>
            <input type="number" v-model.number="footerGap" min="0" class="w-full bg-gray-700 rounded-md p-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">{{ t('footerFontSizeLabel') }}</label>
            <input type="number" v-model.number="fontSize" min="8" class="w-full bg-gray-700 rounded-md p-2" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">{{ t('bgColorLabel') }}</label>
            <input type="color" v-model="bgColor" class="w-full h-10 p-1 bg-gray-700 rounded-md cursor-pointer" />
          </div>
          <div class="md:col-span-3">
            <label class="block text-sm font-medium text-gray-300 mb-1">{{ t('watermarkLabel') }}</label>
            <input type="text" v-model="watermarkText" :placeholder="t('watermarkPlaceholder')" class="w-full bg-gray-700 rounded-md p-2" />
          </div>
        </div>
      </div>
    </div>

    <!-- 3. 编辑内容 -->
    <div class="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
      <h2 class="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">{{ t('panelTitle3') }}</h2>
      <div ref="wrapperRef" class="transition-all duration-300" :style="wrapperStyle">
        <div ref="containerRef" class="flex flex-col">
          <p v-if="!hasGrid" class="text-gray-600 text-center py-10">{{ t('initialPrompt') }}</p>
          <div v-else class="grid image-grid" :style="imageGridStyle">
            <div
              v-for="(cell, idx) in cells"
              :key="idx"
              class="image-upload-box"
              :class="{ active: activeIndex === idx }"
              @click="onCellClick(idx)"
            >
              <div v-if="!cell.src" class="upload-prompt flex flex-col items-center justify-center p-2 select-none">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mb-2"><path d="M21.2 15c.7-1.2 1-2.5.7-3.9-.6-2.4-2.4-4.2-4.8-4.8-.9-.3-1.8-.5-2.7-.5-1.7 0-3.3.7-4.5 2-1.2-1.3-2.8-2-4.5-2-2.5 0-4.7 1.8-5.2 4.2-.5 2.5.7 5 3.2 5.7.5.1 1 .2 1.5.2H20c.7 0 1.3-.2 1.8-.5l-.6-1.2z"/><path d="M12 12v9"/><path d="m16 16-4-4-4 4"/></svg>
                <span>{{ t('uploadPrompt') }}</span>
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

    <!-- 4. 导出文件 -->
    <div class="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
      <h2 class="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">{{ t('panelTitle4') }}</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div class="md:col-span-2 flex items-center gap-2">
          <input type="text" v-model="fileBase" class="flex-grow w-full bg-gray-700 rounded-md p-2" :placeholder="t('filenamePlaceholder')" />
          <select v-model="format" class="bg-gray-700 rounded-md p-2">
            <option value="png">.png</option>
            <option value="jpeg">.jpeg</option>
            <option value="pdf">.pdf</option>
          </select>
        </div>
        <button :disabled="loading" @click="downloadFile" class="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>{{ t('downloadBtn') }}</span>
        </button>
      </div>
      <div v-if="loading" class="mt-4 text-center text-blue-400">{{ t('loading') }}</div>
    </div>

    <!-- 5. 历史记录 -->
    <div class="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 class="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">{{ t('panelTitle5') }}</h2>
      <button @click="saveHistory" class="w-full mb-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md">{{ t('saveHistoryBtn') }}</button>
      <div class="space-y-2">
        <template v-if="history.length === 0">
          <p class="text-gray-500 text-center text-sm">{{ t('initialPrompt') }}</p>
        </template>
        <div v-else v-for="item in history" :key="item.id" class="history-item">
          <span class="truncate pr-4">{{ item.name }}</span>
          <div class="flex-shrink-0 space-x-2">
            <button class="text-blue-400 hover:text-blue-300 text-sm font-semibold" @click="loadHistory(item.id)">{{ t('loadBtn') }}</button>
            <button class="text-red-500 hover:text-red-400 text-sm font-semibold" @click="deleteHistory(item.id)">{{ t('deleteBtn') }}</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, reactive, ref, computed, watch } from 'vue';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// I18N map
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

// UI state
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

// Refs to DOM
const containerRef = ref(null);
const wrapperRef = ref(null);

// grid cells & footers
const cells = reactive([]); // { src: string|null, naturalW, naturalH }
const footers = reactive([]);
const activeIndex = ref(-1);

const hasGrid = computed(() => cells.length > 0);

const wrapperStyle = computed(() => ({
  padding: pageMargin.value + 'px',
  backgroundColor: bgColor.value,
}));

const imageGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${columns.value}, 1fr)`,
  gap: `${rowGap.value}px ${columnGap.value}px`,
}));

const footerGridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${columns.value}, 1fr)`,
  columnGap: `${columnGap.value}px`,
  marginTop: `${footerGap.value}px`,
}));

function toggleLang() {
  currentLang.value = currentLang.value === 'zh' ? 'en' : 'zh';
  localStorage.setItem('preferredLanguage', currentLang.value);
  // 占位符随语言更新
  // 触发一次计算属性更新即可
}

function restoreLang() {
  const saved = localStorage.getItem('preferredLanguage');
  const browser = navigator.language?.startsWith('zh') ? 'zh' : 'en';
  currentLang.value = saved || browser || 'en';
}

function createGrid() {
  const total = Math.max(1, rows.value) * Math.max(1, columns.value);
  const prev = [...cells];
  cells.splice(0, cells.length);
  for (let i = 0; i < total; i++) cells.push(prev[i] ?? { src: null, naturalW: 0, naturalH: 0 });

  // footers 与列数对齐
  const old = [...footers];
  footers.splice(0, footers.length);
  for (let i = 0; i < columns.value; i++) footers.push(old[i] ?? '');

  nextTickUpdateHeights();
}

function onCellClick(idx) {
  activeIndex.value = idx;
  // 触发隐藏的 input
  const grid = containerRef.value?.querySelector('.image-grid');
  const box = grid?.children[idx];
  const input = box?.querySelector('input.image-input');
  input?.click();
}

function onUpload(e, idx) {
  const file = e.target?.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const src = ev.target?.result;
    const img = new Image();
    img.onload = () => {
      cells[idx] = { src, naturalW: img.naturalWidth, naturalH: img.naturalHeight };
      nextTickUpdateHeights();
    };
    img.src = src;
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
        const img = new Image();
        img.onload = () => {
          cells[activeIndex.value] = { src, naturalW: img.naturalWidth, naturalH: img.naturalHeight };
          nextTickUpdateHeights();
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
      e.preventDefault();
      return;
    }
  }
}

function nextTickUpdateHeights() {
  // 让 DOM 刷新后再计算高度
  requestAnimationFrame(() => updateAllRowHeights());
}

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
    }
  }
}

async function downloadFile() {
  loading.value = true;
  const name = (fileBase.value || 'collage') + '.' + format.value;
  try {
    const canvas = await html2canvas(wrapperRef.value, {
      backgroundColor: bgColor.value,
      scale: 3,
      useCORS: true,
      onclone: (doc) => {
        doc.querySelectorAll('input.caption-input').forEach((input) => {
          input.style.border = 'none';
          if (input.value === '') input.style.setProperty('color', 'transparent', 'important');
        });
      }
    });

    // 水印
    if (watermarkText.value) {
      const ctx = canvas.getContext('2d');
      const fontSizePx = canvas.width / 50;
      ctx.font = `bold ${fontSizePx}px Arial`;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-0.25 * Math.PI);
      for (let i = -3; i <= 3; i++) {
        for (let j = -3; j <= 3; j++) {
          ctx.fillText(watermarkText.value, i * (canvas.width / 3), j * (canvas.height / 3));
        }
      }
      ctx.rotate(0.25 * Math.PI);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    if (format.value === 'pdf') {
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'l' : 'p',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
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

// 历史
const HISTORY_KEY = 'collageHistory';
const history = ref([]);

function getHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}

function saveHistory() {
  const settings = {
    columns: columns.value,
    rows: rows.value,
    pageMargin: pageMargin.value,
    columnGap: columnGap.value,
    rowGap: rowGap.value,
    footerGap: footerGap.value,
    fontSize: fontSize.value,
    bgColor: bgColor.value,
    watermarkText: watermarkText.value,
  };

  const footersCopy = [...footers];
  const images = cells.map((c, i) => (c?.src?.startsWith('data:') ? c.src : null));

  const rec = {
    id: Date.now(),
    name: (translations.historyItemName[currentLang.value] || '{date}').replace('{date}', new Date().toLocaleString()),
    settings,
    footers: footersCopy,
    images,
  };

  const list = getHistory();
  list.unshift(rec);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
    renderHistoryList();
  } catch (e) {
    alert(t('saveError'));
    console.error('localStorage quota', e);
  }
}

function loadHistory(id) {
  const list = getHistory();
  const rec = list.find((r) => r.id === id);
  if (!rec) return;
  columns.value = Number(rec.settings.columns) || 1;
  rows.value = Number(rec.settings.rows) || 1;
  pageMargin.value = Number(rec.settings.pageMargin) || 0;
  columnGap.value = Number(rec.settings.columnGap) || 0;
  rowGap.value = Number(rec.settings.rowGap) || 0;
  footerGap.value = Number(rec.settings.footerGap) || 0;
  fontSize.value = Number(rec.settings.fontSize) || 12;
  bgColor.value = rec.settings.bgColor || '#ffffff';
  watermarkText.value = rec.settings.watermarkText || '';

  createGrid();
  // 异步回填图像与脚注
  setTimeout(() => {
    rec.images.forEach((src, idx) => {
      if (!src) return;
      const img = new Image();
      img.onload = () => {
        cells[idx] = { src, naturalW: img.naturalWidth, naturalH: img.naturalHeight };
        nextTickUpdateHeights();
      };
      img.src = src;
    });
    rec.footers.forEach((txt, i) => (footers[i] = txt));
  }, 100);
}

function deleteHistory(id) {
  const list = getHistory().filter((r) => r.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
  renderHistoryList();
}

function renderHistoryList() {
  history.value = getHistory();
}

onMounted(() => {
  restoreLang();
  createGrid();
  renderHistoryList();

  // 全局粘贴
  document.addEventListener('paste', handlePaste);
  // 防止默认右键
  document.addEventListener('contextmenu', (e) => e.preventDefault());
  // 屏蔽常见 Ctrl 快捷键（示例，与原版一致）
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && ['s', 'c', 'u'].includes(e.key)) e.preventDefault();
  });

  window.addEventListener('resize', updateAllRowHeights);
});

onBeforeUnmount(() => {
  document.removeEventListener('paste', handlePaste);
  window.removeEventListener('resize', updateAllRowHeights);
});
</script>

<style scoped>
.image-upload-box {
  position: relative; width: 100%; border: 2px dashed #9ca3af;
  display: flex; align-items: center; justify-content: center;
  background-color: #f9fafb; overflow: hidden; transition: all 0.2s ease-in-out;
  min-height: 100px; cursor: pointer;
}
.image-upload-box:hover { background-color: #f3f4f6; border-color: #6b7280; }
.image-upload-box.active { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,.4); }
.image-upload-box .preview-img { width: 100%; height: 100%; object-fit: contain; position: absolute; top: 0; left: 0; pointer-events: none; }
.history-item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; border-radius: 0.5rem; transition: background-color .2s; }
.history-item:hover { background-color: #374151; }
.caption-input { font-family: 'Times New Roman', Times, serif; width: 100%; text-align: center; padding: .5rem .25rem; background: transparent; color: black; border: none; outline: none; }
</style>
