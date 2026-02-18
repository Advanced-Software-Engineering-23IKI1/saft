<script setup>
const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | outline | success
  size: { type: String, default: 'md' }, // sm | md
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  className: { type: String, default: '' },
})

defineEmits(['click'])

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus:outline-none focus:ring-2 focus:ring-indigo-400'

const variants = {
  primary: 'bg-indigo-600 text-white',
  success: 'bg-emerald-600 text-white',
  outline: 'border border-slate-700 text-slate-100 bg-transparent hover:bg-slate-800',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[
      base,
      variants[variant] ?? variants.primary,
      sizes[size] ?? sizes.md,
      disabled ? 'opacity-60 cursor-not-allowed' : 'hover:brightness-110',
      className,
    ]"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>


