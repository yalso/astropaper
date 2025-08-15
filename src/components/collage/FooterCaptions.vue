<template>
  <div class="grid footer-grid mt-4"
       :style="{ gridTemplateColumns: 'repeat(' + columns + ', 1fr)', columnGap: columnGap + 'px', marginTop: footerGap + 'px' }">
    <input
      v-for="i in columns"
      :key="i-1"
      type="text"
      class="caption-input"
      v-model="localFooters[i-1]"
      :placeholder="placeholder.replace('{i}', String(i))"
      :style="{ fontSize: fontSize + 'px' }"
      @input="emitUpdate"
    />
  </div>
</template>

<script setup>
import { watch, ref } from 'vue'
const props = defineProps({
  footers: Array,
  columns: Number,
  fontSize: Number,
  columnGap: Number,
  footerGap: Number,
  placeholder: { type: String, default: '第 {i} 列脚注' }
})
const emit = defineEmits(['update:footers'])
const localFooters = ref([])

function syncLocal() {
  const cols = Math.max(0, Number(props.columns) || 0)
  const src = Array.isArray(props.footers) ? props.footers : []
  const next = new Array(cols).fill('')
  for (let i = 0; i < cols; i++) next[i] = src[i] ?? ''
  localFooters.value = next
}
watch([() => props.columns, () => props.footers], syncLocal, { immediate: true, deep: true })
function emitUpdate() { emit('update:footers', [...localFooters.value]) }
</script>

<style scoped>
.caption-input {
  font-family: 'Times New Roman', Times, serif;
  width: 100%; text-align: center; padding: .5rem .25rem;
  background: transparent; color: #000000; border: none; outline: none;
}
</style>

<style scoped>
.caption-input{ color:#000000; }
</style>
