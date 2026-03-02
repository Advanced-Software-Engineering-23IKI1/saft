<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="text-center max-w-md">
    <p class="text-2xl text-slate-500">404</p>
    <h1 class="mt-2 text-2xl font-semibold">Page not found</h1>
    <p class="mt-2 pb-5 text-sm text-slate-500">
      The page you’re looking for doesn’t exist.
    </p>
    <RouterLink to="/upload" class="w-full py-4
                                text-lg text-white font-semibold
                                bg-saft-blue-500
                                hover:bg-saft-blue-600 
                                active:scale-[0.95]
                                rounded-full flex items-center justify-center 
                                shadow-xl
                                border-2 border-white/50 
                                transition-all duration-200
                                touch-manipulation">
      Go to Upload
    </RouterLink>
  </section>
</template>