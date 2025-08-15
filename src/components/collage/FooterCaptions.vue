<template>
  <div class="grid footer-grid mt-4" :style="{ gridTemplateColumns: 'repeat(' + columns + ', 1fr)', columnGap: columnGap + 'px', marginTop: footerGap + 'px' }">
    <input
      v-for="(cap, i) in localFooters"
      :key="i"
      type="text"
      class="caption-input"
      v-model="localFooters[i]"
      :placeholder="placeholder.replace('{i}', String(i + 1))"
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
watch(() => props.footers, (v) => { localFooters.value = [...(v||[])] }, { immediate: true })
function emitUpdate() { emit('update:footers', [...localFooters.value]) }
</script>
<style scoped>
.caption-input {
  font-family: 'Times New Roman', Times, serif;
  width: 100%; text-align: center; padding: .5rem .25rem;
  background: transparent; color: var(--text); border: none; outline: none;
}
</style>
