<script setup>
defineProps({
  className: { type: String, default: '' },
})
</script>

<template>
  <div :class="['rounded-xl border border-slate-800 bg-slate-900/40 p-6', className]">
    <slot />
  </div>
</template>
