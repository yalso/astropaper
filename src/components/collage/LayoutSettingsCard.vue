<template>
  <div class="solid-card p-6 shadow-xl">
    <h2 class="text-xl font-semibold mb-4 border-b border-white/10 pb-2">1. 布局设置</h2>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <label class="block text-sm font-medium mb-1">列数</label>
        <input type="number" :value="columns" min="1" class="field" @input="$emit('update:columns', Number($event.target.value))" />
      </div>
      <div>
        <label class="block text-sm font-medium mb-1">行数</label>
        <input type="number" :value="rows" min="1" class="field" @input="$emit('update:rows', Number($event.target.value))" />
      </div>
      <div class="col-span-2">
        <button @click="$emit('generate')" class="w-full mt-2 btn-primary">生成/重置网格</button>
      </div>
    </div>
  </div>
</template>
<script setup>
defineProps({ columns: Number, rows: Number })
defineEmits(['update:columns','update:rows','generate'])
</script>
