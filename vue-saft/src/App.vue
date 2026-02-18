<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>


<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="border-b border-slate-800">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <div class="text-sm font-semibold tracking-wide">S.A.F.T.</div>
        <nav class="flex gap-3 text-sm text-slate-300">
          <RouterLink class="hover:text-white" to="/upload">Upload</RouterLink>
          <RouterLink class="hover:text-white" to="/canvas">Canvas</RouterLink>
          <RouterLink class="hover:text-white" to="/download">Download</RouterLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-8">
      <RouterView />
    </main>
  </div>
</template>

