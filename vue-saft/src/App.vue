<script setup>
import { RouterView} from 'vue-router'
import Navbar from './components/ui/Navbar.vue';
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <header class="border-b border-slate-800">
      <div class="mx-auto max-w-5xl px-4 py-4">
        <div class="flex items-center gap-3">
          <Navbar />
          <div class="h-px flex-1 bg-slate-800"></div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-8">
      <RouterView />
    </main>
  </div>
</template>
