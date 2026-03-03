<script setup>
import { RouterView } from 'vue-router'
import Navbar from './components/ui/Navbar.vue'

import bgUrl from '@/assets/img/background.png'
import logoUrl from '@/assets/img/saftLogoTransparent.png'
</script>

<template>
  <div class="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed" :style="{ backgroundImage: `url(${bgUrl})` }">
    <div class="min-h-screen flex items-start justify-center p-6">
      <div class="w-full max-w-md backdrop-blur-sm bg-saft-brown-50/80
               border border-saft-blue-200/50 rounded-3xl shadow-2xl
               p-8 max-h-[90vh] overflow-auto">
        <img :src="logoUrl" class="w-60 h-auto mx-auto mb-6" alt="SAFT Logo" />
        <Navbar />
        <main class="mx-auto max-w-5xl px-4 py-8">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>
