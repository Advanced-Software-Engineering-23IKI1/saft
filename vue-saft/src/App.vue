<script setup>
import { RouterView } from 'vue-router'
import Navbar from './components/ui/Navbar.vue'

import bgUrl from '@/assets/img/background.png'
import bgDarkUrl from '@/assets/img/background.png'
import logoUrl from '@/assets/img/saftLogoTransparent.png'
</script>

<template>
  <div id="background-wrapper" class="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed" :style="{ '--bg-url-light': `url(${bgUrl})`, '--bg-url-dark': `url(${bgDarkUrl})` }">
    <div class="min-h-screen flex items-start justify-center py-6 px-2">
      <div class="w-full max-w-3xl backdrop-blur-sm bg-saft-brown-50/80
               border border-saft-blue-200/50 rounded-3xl shadow-2xl
               px-2 py-4 max-h-[90vh] overflow-auto">
        <img :src="logoUrl" class="w-60 h-auto mx-auto mb-6" alt="SAFT Logo" />

        <!-- Dark Mode Toggle -->
          <label class="inline-flex items-center cursor-pointer">
            <img src="./assets/img/moon.png" alt="Dark Mode" class="w-5 h-5">
            <input type="checkbox" value="" class="sr-only peer" @change="toggleDarkMode">
            <div
              class="relative mx-3 w-9 h-5 bg-gray-800 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-saft-main-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-gray-200 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-saft-main-500">
            </div>
            <img src="./assets/img/sun.png" alt="Light Mode" class="w-5 h-5">
          </label>

        <Navbar />
        <main class="mx-auto max-w-5xl px-0 py-0">
          <RouterView />
        </main>
        <footer class="text-center text-sm text-gray-400 mt-4">
          <a href="https://www.flaticon.com/free-icons/orange" title="orange icons">Orange icons created by Freepik - Flaticon</a>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
div#background-wrapper {
  /* background image is set via inline style in the template */
  background-image: var(--bg-url-light);
}

.dark-mode div#background-wrapper {
  background-image: var(--bg-url-dark);
  /* filter: invert(); */
}
</style>
