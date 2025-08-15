<!--
File: src/components/collage/DragSwapLayer.vue
Purpose: 在 CollageCanvas 的图片网格上方增加一层交互层，实现“行/列拖拽交换（包含脚注列）”。
Usage: 需要在 CollageCanvas.vue 中挂载该组件，并向其传入 gridEl、cells、rows、columns、footers。
-->
<template>
  <!-- 只在网格存在时渲染 -->
  <div v-if="gridEl && columns > 0 && rows > 0"
       class="drag-layer"
       >

    <!-- 行拖拽手柄：位于当前悬浮行的左右两侧 -->
    <button v-if="hoverRow >= 0"
            class="handle handle-row left"
            :style="rowHandleStyle('left')"
            @pointerdown.prevent="startDrag('row')"
            aria-label="拖拽整行（向左/向右交换）">
      <DragIcon/>
    </button>
    <button v-if="hoverRow >= 0"
            class="handle handle-row right"
            :style="rowHandleStyle('right')"
            @pointerdown.prevent="startDrag('row')"
            aria-label="拖拽整行（向左/向右交换）">
      <DragIcon/>
    </button>

    <!-- 列拖拽手柄：位于当前悬浮列的上下两侧 -->
    <button v-if="hoverCol >= 0"
            class="handle handle-col top"
            :style="colHandleStyle('top')"
            @pointerdown.prevent="startDrag('col')"
            aria-label="拖拽整列（向上/向下交换）">
      <DragIcon/>
    </button>
    <button v-if="hoverCol >= 0"
            class="handle handle-col bottom"
            :style="colHandleStyle('bottom')"
            @pointerdown.prevent="startDrag('col')"
            aria-label="拖拽整列（向上/向下交换）">
      <DragIcon/>
    </button>

    <!-- 拖拽中的可视化高亮（源与目标） -->
    <div v-if="dragging && dragMode === 'row' && dragFrom >= 0"
         class="highlight highlight-row from"
         :style="rowHighlightStyle(dragFrom)"></div>
    <div v-if="dragging && dragMode === 'row' && dragTo >= 0 && dragTo !== dragFrom"
         class="highlight highlight-row to"
         :style="rowHighlightStyle(dragTo)"></div>

    <div v-if="dragging && dragMode === 'col' && dragFrom >= 0"
         class="highlight highlight-col from"
         :style="colHighlightStyle(dragFrom)"></div>
    <div v-if="dragging && dragMode === 'col' && dragTo >= 0 && dragTo !== dragFrom"
         class="highlight highlight-col to"
         :style="colHighlightStyle(dragTo)"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
const HOVER_LINGER_MS = 320 // 鼠标离开后手柄/高亮延迟消失（ms）
let clearHoverTimer = null

const HANDLE_OFFSET = 6 // 调整手柄与边缘的距离（px）

const props = defineProps({
  gridEl: { type: Object, required: false, default: null }, // 传入 CollageCanvas 中的网格 DOM 元素
  columns: { type: Number, required: true },
  rows: { type: Number, required: true },
  cells: { type: Array, required: true },  // 与网格一一对应
  footers: { type: Array, required: false, default: () => [] }
})

const emit = defineEmits([
  // 父组件监听该事件做真实交换：
  // emit('swap', { type: 'row'|'col', from: number, to: number })
  'swap'
])

const gridEl = ref(null)
watch(() => props.gridEl, (v) => gridEl.value = v, { immediate: true })

// 悬浮状态
const hoverIndex = ref(-1)
const hoverRow = ref(-1)
const hoverCol = ref(-1)

// 拖拽状态
const dragging = ref(false)
const dragMode = ref(null)       // 'row' | 'col'
const dragFrom = ref(-1)         // rowIndex or colIndex
const dragTo = ref(-1)


function cancelClearHover() {
  if (clearHoverTimer) { clearTimeout(clearHoverTimer); clearHoverTimer = null }
}
function clearHoverNow() {
  hoverIndex.value = -1
  hoverRow.value = -1
  hoverCol.value = -1
}
function scheduleClearHover() {
  cancelClearHover()
  clearHoverTimer = setTimeout(() => {
    if (!dragging.value) clearHoverNow()
  }, HOVER_LINGER_MS)
}

function getChildren() { return Array.from(gridEl.value?.children || []) }
function gridRect() { return gridEl.value?.getBoundingClientRect?.() || null }
function footerRect(){
  const el = (typeof props.footerEl === 'object' && props.footerEl) ? (props.footerEl.$el || props.footerEl) : null
  return el?.getBoundingClientRect ? el.getBoundingClientRect() : null
}

function indexFromPoint(x, y) {
  const items = getChildren()
  for (let i = 0; i < items.length; i++) {
    const r = items[i].getBoundingClientRect()
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i
  }
  return -1
}

function onPointerMove(e) {
  if (!gridEl.value) return
  const rect = gridRect()
  const x = e.clientX, y = e.clientY
  const insideGrid = !!(rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom)

  if (insideGrid) cancelClearHover()

  const idx = indexFromPoint(x, y)
  if (idx >= 0 && props.columns > 0) {
    hoverIndex.value = idx
    hoverRow.value = Math.floor(idx / props.columns)
    hoverCol.value = idx % props.columns
  } else if (insideGrid) {
    // 在网格缝隙：吸附最近行/列，避免闪烁
    let bestRow = -1, bestCol = -1
    let minDy = Infinity, minDx = Infinity
    const items = getChildren()
    for (let r = 0; r < props.rows; r++) {
      const first = items[r * props.columns]
      if (!first) continue
      const rr = first.getBoundingClientRect()
      const cy = rr.top + rr.height / 2
      const dy = Math.abs(y - cy)
      if (dy < minDy) { minDy = dy; bestRow = r }
    }
    for (let c = 0; c < props.columns; c++) {
      const cell = items[c]
      if (!cell) continue
      const cr = cell.getBoundingClientRect()
      const cx = cr.left + cr.width / 2
      const dx = Math.abs(x - cx)
      if (dx < minDx) { minDx = dx; bestCol = c }
    }
    hoverIndex.value = bestRow >= 0 && bestCol >= 0 ? (bestRow * props.columns + bestCol) : -1
    hoverRow.value = bestRow
    hoverCol.value = bestCol
  } else {
    // 不在网格内：延迟清除 hover
    scheduleClearHover()
  }

  if (dragging.value) {
    if (!rect) return
    if (dragMode.value === 'row') {
      const items = getChildren()
      let target = -1, minDy = Infinity
      for (let r = 0; r < props.rows; r++) {
        const firstCell = items[r * props.columns]
        if (!firstCell) continue
        const rr = firstCell.getBoundingClientRect()
        const cy = rr.top + rr.height / 2
        const dy = Math.abs(y - cy)
        if (dy < minDy) { minDy = dy; target = r }
      }
      dragTo.value = target
    } else if (dragMode.value === 'col') {
      let target = -1, minDx = Infinity
      for (let c = 0; c < props.columns; c++) {
        const i = c
        const cell = getChildren()[i]
        if (!cell) continue
        const cr = cell.getBoundingClientRect()
        const cx = cr.left + cr.width / 2
        const dx = Math.abs(x - cx)
        if (dx < minDx) { minDx = dx; target = c }
      }
      dragTo.value = target
    }
  }
}

function onPointerLeave() {
  if (!dragging.value) scheduleClearHover()
}


function startDrag(mode) {
  if (hoverRow.value < 0 || hoverCol.value < 0) return
  dragMode.value = mode
  dragging.value = true
  dragFrom.value = (mode === 'row') ? hoverRow.value : hoverCol.value
  dragTo.value = dragFrom.value
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('keydown', onKeyDown)
}

function onPointerUp() {
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('keydown', onKeyDown)
  if (!dragging.value) return
  const from = dragFrom.value
  const to = dragTo.value
  const mode = dragMode.value
  dragging.value = false
  dragMode.value = null
  if (from >= 0 && to >= 0 && from !== to) {
    emit('swap', { type: mode, from, to })
  }
}

function onKeyDown(e) {
  if (e.key === 'Escape') {
    dragging.value = false
    dragMode.value = null
    dragFrom.value = -1
    dragTo.value = -1
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('keydown', onKeyDown)
  }
}

/* ---- 样式与位置计算 ---- */
function rowCenterY(rowIndex) {
  const items = getChildren()
  const first = items[rowIndex * props.columns]
  if (!first) return 0
  const r = first.getBoundingClientRect()
  return r.top + r.height / 2
}
function colCenterX(colIndex) {
  const items = getChildren()
  const firstRowCell = items[colIndex]
  if (!firstRowCell) return 0
  const r = firstRowCell.getBoundingClientRect()
  return r.left + r.width / 2
}
function rowHandleStyle(side) {
  const gr = gridRect()
  if (!gr) return {}
  const y = rowCenterY(hoverRow.value)
  const left = (side === 'left') ? (gr.left - HANDLE_OFFSET) : (gr.right + HANDLE_OFFSET)
  return { top: y + 'px', left: left + 'px' }
}
function colHandleStyle(side) {
  const gr = gridRect()
  if (!gr) return {}
  const x = colCenterX(hoverCol.value)
  const fr = footerRect()
  const bottomY = fr ? Math.max(gr.bottom, fr.bottom) : gr.bottom
  const top = (side === 'top') ? (gr.top - HANDLE_OFFSET) : (bottomY + HANDLE_OFFSET)
  return { top: top + 'px', left: x + 'px' }
}
function rowHighlightStyle(row) {
  const items = getChildren()
  const first = items[row * props.columns]
  if (!first) return {}
  const r1 = first.getBoundingClientRect()
  const last = items[row * props.columns + (props.columns - 1)]
  const r2 = last?.getBoundingClientRect?.() || r1
  const top = r1.top
  const left = r1.left
  const width = (r2.right - r1.left)
  const height = r1.height
  return { top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px` }
}
function colHighlightStyle(col) {
  const items = getChildren()
  const first = items[col] // 第一行对应列
  if (!first) return {}
  const rTop = first.getBoundingClientRect()
  const last = items[(props.rows - 1) * props.columns + col]
  const rBottom = last?.getBoundingClientRect?.() || rTop
  const top = rTop.top
  const left = rTop.left
  const width = rTop.width
  const height = (rBottom.bottom - rTop.top)
  return { top: `${top}px`, left: `${left}px`, width: `${width}px`, height: `${height}px` }
}

onMounted(() => {
  
  if (typeof window !== 'undefined') window.addEventListener('pointermove', onPointerMove, { passive: true })
window.addEventListener('scroll', () => { hoverIndex.value = -1; hoverRow.value = -1; hoverCol.value = -1 }, { passive: true })
})

onBeforeUnmount(() => {
  
  if (typeof window !== 'undefined') window.removeEventListener('pointermove', onPointerMove)
window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('keydown', onKeyDown)
})
</script>

<script>
export default {
  components: {
    DragIcon: {
      name: 'DragIcon',
      template: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <circle cx="5" cy="5" r="1.5"/><circle cx="12" cy="5" r="1.5"/><circle cx="19" cy="5" r="1.5"/>
        <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
        <circle cx="5" cy="19" r="1.5"/><circle cx="12" cy="19" r="1.5"/><circle cx="19" cy="19" r="1.5"/>
      </svg>`
    }
  }
}
</script>

<style scoped>
.drag-layer {
  position: fixed;
  pointer-events: none;
  z-index: 50;
}
.handle {
  position: fixed;
  width: 28px; height: 28px; border-radius: 9999px;
  background: var(--paper-elevated, rgba(255,255,255,0.9));
  border: 1px solid var(--line, rgba(0,0,0,0.15));
  box-shadow: 0 4px 10px rgba(0,0,0,0.12);
  display: grid; place-items: center;
  pointer-events: auto;
  cursor: grab; user-select: none;
}
.handle:active { cursor: grabbing; }
.handle-row.left { transform: translate(-100%, -50%); }
.handle-row.right { transform: translate(0, -50%); }
.handle-col.top { transform: translate(-50%, -100%); }
.handle-col.bottom { transform: translate(-50%, 0); }

.highlight { position: fixed; border: 2px dashed #60a5fa; border-radius: 6px; background: rgba(96,165,250,0.08); }
.highlight.from { border-color: #60a5fa; }
.highlight.to { border-color: #34d399; background: rgba(52,211,153,0.10); }

.handle, .highlight { transition: opacity .18s ease, box-shadow .18s ease; }
@media (prefers-color-scheme: dark) {
  .handle { border: none; }
}
</style>
