<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="min-h-screen grid place-items-center bg-slate-950 text-slate-100 px-6">
    <section class="text-center max-w-md">
      <p class="text-sm text-slate-400">404</p>
      <h1 class="mt-2 text-2xl font-semibold">Page not found</h1>
      <p class="mt-2 text-sm text-slate-300">
        The page you’re looking for doesn’t exist.
      </p>

      <RouterLink
        to="/upload"
        class="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 "
      >
        Go to Upload
      </RouterLink>
    </section>
  </main>
</template>