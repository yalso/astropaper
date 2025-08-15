<template>
  <div class="relative">
    <ToolbarTop :theme="theme" :current-lang="currentLang"
      @toggle-theme="toggleTheme" @toggle-lang="toggleLang" />

    <header class="text-center mb-8">
      <h1 class="text-3xl md:text-4xl font-bold mb-2 heading-solid">{{ t('mainTitle') }}</h1>
      <p class="opacity-80">{{ t('subTitle') }}</p>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <LayoutSettingsCard
        :columns="draftColumns"
        :rows="draftRows"
        @update:columns="(v)=> draftColumns = v"
        @update:rows="(v)=> draftRows = v"
        @generate="onGenerate"
        @clear="clearImages"
      />

      <StyleSettingsCard
        :page-margin="pageMargin" :column-gap="columnGap" :row-gap="rowGap" :footer-gap="footerGap"
        :font-size="fontSize" :bg-color="bgColor" :watermark-text="watermarkText" :show-image-border="showImageBorder"
        @update:page-margin="(v)=> pageMargin = v" @update:column-gap="(v)=> columnGap = v"
        @update:row-gap="(v)=> rowGap = v" @update:footer-gap="(v)=> footerGap = v"
        @update:font-size="(v)=> fontSize = v" @update:bg-color="(v)=> bgColor = v"
        @update:watermark-text="(v)=> watermarkText = v" @update:show-image-border="(v)=> showImageBorder = v"
      />
    </div>

    <div class="solid-card p-6 shadow-xl mb-8">
      <h2 class="text-xl font-semibold mb-4 border-b border-white/10 pb-2">{{ t('panelTitle3') }}</h2>
      <CollageCanvas ref="canvasRef" class="mb-4"
        :columns="columns" :rows="rows" :cells="cells" :footers="footers" :active-index="activeIndex"
        :page-margin="pageMargin" :column-gap="columnGap" :row-gap="rowGap" :footer-gap="footerGap"
        :font-size="fontSize" :bg-color="bgColor" :show-image-border="showImageBorder"
        @update:active-index="(v)=> activeIndex = v" @set-cell="setCellFromSrc" @update-footers="(arr)=> footers = arr"
      />
    </div>

    <ExportPanel :file-base="fileBase" :format="format" :loading="loading"
      @update:file-base="(v)=> fileBase = v" @update:format="(v)=> format = v" @export="downloadFile" />

    <HistoryPanel class="mt-8" :history-list="history" @save="saveHistory" @load="loadHistory" @delete="deleteHistory" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import ToolbarTop from './ToolbarTop.vue'
import LayoutSettingsCard from './LayoutSettingsCard.vue'
import StyleSettingsCard from './StyleSettingsCard.vue'
import CollageCanvas from './CollageCanvas.vue'
import ExportPanel from './ExportPanel.vue'
import HistoryPanel from './HistoryPanel.vue'

/* I18N */
const translations = {
  mainTitle: { en: 'Scientific Paper Collage Tool (Astro + Vue)', zh: '科研论文拼图工具（Astro + Vue）' },
  subTitle: { en: 'Intelligent layout, precise control, professional typesetting of figures.', zh: '智能布局、精准控制，专业排版您的实验图' },
  panelTitle3: { en: '3. Edit Content', zh: '3. 编辑内容' },
  saveError: { en: 'Failed to save. Storage may be full.', zh: '保存失败，存储空间可能已满。' }
}
const currentLang = ref('zh')
const t = (key) => translations[key]?.[currentLang.value] ?? key

/* Theme */
const THEME_KEY = 'theme'
const theme = ref('light')
function applyTheme(tname) {
  theme.value = tname
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', tname)
    try { localStorage.setItem(THEME_KEY, tname) } catch {}
  }
}
function toggleTheme() { applyTheme(theme.value === 'dark' ? 'light' : 'dark') }
function toggleLang() {
  currentLang.value = currentLang.value === 'zh' ? 'en' : 'zh'
  try { localStorage.setItem('preferredLanguage', currentLang.value) } catch {}
}

/* State */
const draftColumns = ref(3)
const draftRows = ref(3)
const columns = ref(3)
const rows = ref(3)
const pageMargin = ref(16)
const columnGap = ref(16)
const rowGap = ref(16)
const footerGap = ref(16)
const fontSize = ref(16)
const bgColor = ref('#ffffff')
const watermarkText = ref('')
const fileBase = ref('my-research-collage')
const format = ref('png')
const loading = ref(false)
const showImageBorder = ref(true)

const cells = reactive([])    // { src, naturalW, naturalH }
const footers = reactive([])  // [string x columns]
const activeIndex = ref(-1)

onMounted(() => {
  try {
    const saved = localStorage.getItem(THEME_KEY)
    if (saved) applyTheme(saved)
  } catch {}
  try {
    const savedLang = localStorage.getItem('preferredLanguage')
    if (savedLang) currentLang.value = savedLang
  } catch {}
  draftColumns.value = columns.value
  draftRows.value = rows.value
  createGrid(false)
  if (typeof document !== 'undefined') document.addEventListener('paste', handlePaste)
})
onBeforeUnmount(() => {
  if (typeof document !== 'undefined') document.removeEventListener('paste', handlePaste)
})

function onGenerate(){ const oC = columns.value, oR = rows.value; columns.value = draftColumns.value; rows.value = draftRows.value; createGrid(true, oC, oR); }

/* Grid */
function createGrid(preserve = true, oldCols = columns.value, oldRows = rows.value) {
  const newCols = Math.max(1, columns.value)
  const newRows = Math.max(1, rows.value)
  const total = newCols * newRows

  if (!preserve) {
    cells.splice(0, cells.length)
    for (let i = 0; i < total; i++) cells.push({ src: null, naturalW: 0, naturalH: 0 })
  } else {
    const prevCells = [...cells]
    const prevCols = Math.max(1, Number(oldCols) || columns.value)
    const prevRows = Math.max(1, Number(oldRows) || rows.value)

    const nextCells = new Array(total).fill(null).map(() => ({ src: null, naturalW: 0, naturalH: 0 }))

    // Map by (row, col) -> (row, col) while within new bounds
    const copyCols = Math.min(prevCols, newCols)
    const copyRows = Math.min(prevRows, newRows)
    for (let r = 0; r < copyRows; r++) {
      for (let c = 0; c < copyCols; c++) {
        const oldIdx = r * prevCols + c
        const newIdx = r * newCols + c
        if (prevCells[oldIdx]) nextCells[newIdx] = prevCells[oldIdx]
      }
    }
    // Commit
    cells.splice(0, cells.length, ...nextCells) // placeholder to keep regex simple
  }

  // Footers: length == columns; preserve first min(old,new) footers
  const prevFooters = [...footers]
  const nextFooters = []
  const keep = Math.min((Array.isArray(prevFooters)?prevFooters.length:0), newCols)
  for (let i = 0; i < keep; i++) nextFooters[i] = prevFooters[i]
  for (let i = keep; i < newCols; i++) nextFooters[i] = ''
  footers.splice(0, footers.length, ...nextFooters) // placeholder

  if (canvasRef.value?.updateAllRowHeights) canvasRef.value.updateAllRowHeights()
}
function clearImages() {
  for (let i = 0; i < cells.length; i++) cells[i] = { src: null, naturalW: 0, naturalH: 0 }
  if (canvasRef.value?.updateAllRowHeights) canvasRef.value.updateAllRowHeights()
}

function setCellFromSrc(idx, src) {
  const img = new Image()
  img.onload = () => {
    cells[idx] = { src, naturalW: img.naturalWidth, naturalH: img.naturalHeight }
    if (canvasRef.value?.updateAllRowHeights) canvasRef.value.updateAllRowHeights()
  }
  img.src = src
}
function handlePaste(e) {
  if (activeIndex.value < 0) return
  const items = e.clipboardData?.items || []
  for (let i = 0; i < items.length; i++) {
    if (items[i].type?.includes('image')) {
      const file = items[i].getAsFile()
      const reader = new FileReader()
      reader.onload = (ev) => {
        const src = ev.target?.result
        if (typeof src === 'string') setCellFromSrc(activeIndex.value, src)
      }
      reader.readAsDataURL(file)
      e.preventDefault()
      return
    }
  }
}

/* Export */
const canvasRef = ref(null)
async function downloadFile() {
  loading.value = true
  const name = (fileBase.value || 'collage') + '.' + format.value
  try {
    const [{ default: html2canvas }, jspdfMod] = await Promise.all([ import('html2canvas'), import('jspdf') ])
    const { jsPDF } = jspdfMod
    const wrapperEl = canvasRef.value?.getWrapperEl?.() || null
    const canvas = await html2canvas(wrapperEl, {
      backgroundColor: '#ffffff',
      scale: 3,
      useCORS: true,
      onclone: (doc) => {
        doc.querySelectorAll('input.caption-input').forEach((input) => {
          input.style.border = 'none'
          if (input.value === '') input.style.setProperty('color', 'transparent', 'important')
        })
        doc.querySelectorAll('.image-upload-box').forEach((el) => {
          el.style.border = 'none'
          el.style.boxShadow = 'none'
          el.style.background = '#ffffff'
        })
        doc.querySelectorAll('.preview-img').forEach((el) => {
          el.style.border = 'none'
          el.style.boxShadow = 'none'
        })
        doc.querySelectorAll('.upload-prompt').forEach((el) => { el.style.display = 'none' })
        doc.querySelectorAll('.collage-wrapper').forEach((el) => { el.style.border = 'none' })
      }
    })
    if (format.value === 'pdf') {
      const imgData = canvas.toDataURL('image/png', 1.0)
      const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? 'l' : 'p', unit: 'px', format: [canvas.width, canvas.height] })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(name)
    } else {
      const link = document.createElement('a')
      link.download = name
      link.href = canvas.toDataURL(`image/${format.value}`, 1.0)
      link.click()
    }
  } catch (e) {
    console.error(e)
    alert(t('saveError'))
  } finally {
    loading.value = false
  }
}

/* History */
const HISTORY_KEY = 'collageHistory'
const history = ref([])
const getHistory = () => { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] } }
const renderHistoryList = () => { history.value = getHistory() }
function saveHistory() {
  const settings = { columns: columns.value, rows: rows.value, pageMargin: pageMargin.value, columnGap: columnGap.value, rowGap: rowGap.value, footerGap: footerGap.value, fontSize: fontSize.value, bgColor: bgColor.value, watermarkText: watermarkText.value }
  const images = cells.map((c) => (c?.src?.startsWith('data:') ? c.src : null))
  const rec = { id: Date.now(), name: new Date().toLocaleString(), settings, footers: [...footers], images }
  const list = getHistory(); list.unshift(rec)
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list)); renderHistoryList() } catch (e) { alert(t('saveError')) }
}
function loadHistory(id) {
  const list = getHistory(); const rec = list.find((r) => r.id === id); if (!rec) return
  draftColumns.value = Number(rec.settings.columns) || 1; columns.value = draftColumns.value
  draftRows.value  = Number(rec.settings.rows) || 1; rows.value = draftRows.value
  pageMargin.value = Number(rec.settings.pageMargin) || 0
  columnGap.value  = Number(rec.settings.columnGap) || 0
  rowGap.value     = Number(rec.settings.rowGap) || 0
  footerGap.value  = Number(rec.settings.footerGap) || 0
  fontSize.value   = Number(rec.settings.fontSize) || 12
  bgColor.value    = rec.settings.bgColor || '#ffffff'
  watermarkText.value = rec.settings.watermarkText || ''
  createGrid(false)
  const total = Math.max(1, rows.value) * Math.max(1, columns.value)
  const imgs = Array.isArray(rec.images) ? rec.images : []
  for (let i = 0; i < total; i++) {
    const src = imgs[i] || null
    if (!src) cells[i] = { src: null, naturalW: 0, naturalH: 0 }
    else if (typeof src === 'string') setCellFromSrc(i, src)
  }
  const savedFooters = Array.isArray(rec.footers) ? rec.footers : []
  footers.splice(0, footers.length)
  for (let i = 0; i < columns.value; i++) footers.push(savedFooters[i] ?? '')
}
function deleteHistory(id) {
  const list = getHistory().filter((r) => r.id !== id)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
  renderHistoryList()
}

renderHistoryList()
</script>

<style scoped>
/* 样式集中在子组件和全局 base.css */
</style>
