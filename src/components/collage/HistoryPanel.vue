<template>
  <div class="solid-card p-6 shadow-xl">
    <h2 class="text-xl font-semibold mb-4 border-b border-white/10 pb-2">5. 历史记录</h2>
    <button @click="$emit('save')" class="w-full mb-4 btn-primary">保存当前排版</button>
    <div class="space-y-2">
      <template v-if="historyList.length === 0">
        <p class="opacity-70 text-center text-sm">暂无记录</p>
      </template>
      <div v-else v-for="item in historyList" :key="item.id" class="history-item">
        <span class="truncate pr-4">{{ item.name }}</span>
        <div class="flex-shrink-0 space-x-2">
          <button class="btn-primary text-sm font-semibold" @click="$emit('load', item.id)">加载</button>
          <button class="btn-primary text-sm font-semibold" @click="$emit('delete', item.id)">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
defineProps({ historyList: { type: Array, default: () => [] } })
defineEmits(['save','load','delete'])
</script>
<style scoped>
.history-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 0.75rem; border-radius: 0.75rem; transition: none;
  background: var(--item-bg);
  border: 1px solid var(--item-border);
}
.history-item .truncate { color: var(--history-title); font-weight: 600; }
</style>
