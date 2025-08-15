<template>
  <div ref="wrapperRef" class="transition-all duration-300 collage-wrapper" :style="wrapperStyle">
    <div ref="containerRef" class="flex flex-col">
      <p v-if="!hasGrid" class="text-slate-700/80 dark:text-slate-200/70 text-center py-10 font-semibold">请在上方设置行列数并点击“生成网格”</p>

      <div v-else class="grid image-grid" :style="imageGridStyle" ref="gridRef">
        <ImageCell
          v-for="(cell, idx) in cells"
          :key="(cell && (cell.id || cell.src)) || idx"
          :idx="idx"
          :cell="cell"
          :active="activeIndex === idx"
          :show-image-border="showImageBorder"
          @request-active="(i)=> $emit('update:active-index', i)"
          @set-cell="(i, src)=> $emit('set-cell', i, src)"
        />
      </div>
	  <DragSwapLayer
		  :grid-el="gridRef"
		  :columns="columns"
		  :rows="rows"
		  :cells="cells"
		  :footers="footers"
		  @swap="(p) => $emit('swap', p)"
		/>
      <FooterCaptions
        v-if="hasGrid"
        :footers="footers"
        :columns="columns"
        :font-size="fontSize"
        :column-gap="columnGap"
        :footer-gap="footerGap"
        @update:footers="(arr)=> $emit('update-footers', arr)"
      />
    </div>
  </div>
</template>
<script setup>
import DragSwapLayer from './DragSwapLayer.vue'
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import ImageCell from './ImageCell.vue'
import FooterCaptions from './FooterCaptions.vue'

const props = defineProps({
  columns: Number,
  rows: Number,
  cells: Array,
  footers: Array,
  activeIndex: Number,
  pageMargin: Number,
  columnGap: Number,
  rowGap: Number,
  footerGap: Number,
  fontSize: Number,
  bgColor: String,
  showImageBorder: Boolean
})
const emit = defineEmits(['update:active-index','set-cell','update-footers'])


const containerRef = ref(null)
const wrapperRef = ref(null)
const hasGrid = computed(() => (props.cells?.length || 0) > 0)

const wrapperStyle = computed(() => ({ padding: props.pageMargin + 'px', backgroundColor: props.bgColor }))
const imageGridStyle = computed(() => ({ gridTemplateColumns: `repeat(${props.columns}, 1fr)`, gap: `${props.rowGap}px ${props.columnGap}px` }))

function updateAllRowHeights() {
  const grid = containerRef.value?.querySelector('.image-grid')
  if (!grid) return
  const cols = Math.max(1, props.columns || 1)
  const rws = Math.max(1, props.rows || 1)
  const all = Array.from(grid.children)
  for (let r = 0; r < rws; r++) {
    const first = all[r * cols]
    if (!first) continue
    const idx = r * cols
    const cell = props.cells[idx]
    if (cell?.src && cell.naturalW > 0) {
      const boxWidth = first.clientWidth
      const aspect = cell.naturalH / cell.naturalW
      const newH = boxWidth * aspect
      for (let c = 0; c < cols; c++) {
        const el = all[r * cols + c]
        if (el) el.style.height = `${newH}px`
      }
    } else {
      for (let c = 0; c < cols; c++) {
        const el = all[r * cols + c]
        if (el) el.style.height = ``
      }
    }
  }
}
function scheduleUpdate() { if (typeof window !== 'undefined') requestAnimationFrame(updateAllRowHeights) }

watch(() => [props.columns, props.rows, props.columnGap, props.rowGap], scheduleUpdate)
watch(() => props.cells, scheduleUpdate, { deep: true })

onMounted(() => {
  if (typeof window !== 'undefined') window.addEventListener('resize', updateAllRowHeights)
  scheduleUpdate()
})
onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('resize', updateAllRowHeights)
})

defineExpose({
  getWrapperEl: () => wrapperRef.value,
  updateAllRowHeights
})
const gridRef = ref(null)
</script>
<style scoped>
.collage-wrapper {
  border: 2px dashed var(--line-strong);
  border-radius: 12px;
  transition: all .3s ease;
}
.image-grid { width: 100%; }
</style>
