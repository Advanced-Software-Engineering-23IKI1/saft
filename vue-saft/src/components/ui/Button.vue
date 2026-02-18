<script setup>
const props = defineProps({
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  className: { type: String, default: '' },
})

defineEmits(['click'])

const base =
  'inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400' // focus:ring utilities + focus variants are standard Tailwind patterns [web:19][web:36]
</script>


<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      base,
      disabled ? 'opacity-60 cursor-not-allowed' : 'hover:bg-indigo-500',
      className,
    ]"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>


