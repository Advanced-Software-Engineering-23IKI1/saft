<script setup>
import { RouterView } from 'vue-router'
import Navbar from './components/ui/Navbar.vue'
import { onBeforeMount, onMounted, ref } from 'vue'

import bgUrl from '@/assets/img/background.png'
import bgDarkUrl from '@/assets/img/background-dark.png'
import logoUrl from '@/assets/img/saftLogoOrange.png'
import { Moon, Sun } from 'lucide-vue-next'
const isDark = ref(false)

const toggleDarkMode = () => {
  isDark.value = !isDark.value

  if (isDark.value) {
    document.documentElement.classList.add('dark-mode')
  } else {
    document.documentElement.classList.remove('dark-mode')
  }
}
const preventBrowserZoom = (event) => {
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault()
  }
}

onMounted(() => {
  window.addEventListener('wheel', preventBrowserZoom, { passive: false })
})

onBeforeMount(() => {
  window.removeEventListener('wheel', preventBrowserZoom, { passive: false })
})


</script>

<template>
  <div id="background-wrapper" class="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
    :style="{ '--bg-url-light': `url(${bgUrl})`, '--bg-url-dark': `url(${bgDarkUrl})` }">
    <div class="min-h-screen flex items-start justify-center py-6 px-2">
      <div class="w-full max-w-3xl backdrop-blur-sm bg-saft-brown-50/80
               border border-saft-blue-200/50 rounded-3xl shadow-2xl
               px-2 py-4 max-h-[90vh] overflow-auto">

        <div class="relative w-full mb-6">
          <div class="flex items-center justify-center gap-4">
            <img :src="logoUrl" class="w-15 h-auto" alt="SAFT Logo"
              @click="/*trust me*/(e) => { let l = e.target; l.c = (l.c || 0) + 1; console.log(l.c); l.style = `transform: rotate(${l.c >= 2 ? l.c * 15 : 0}deg)`; if (l.c >= 30) { l.getRootNode().documentElement.classList.add('uwu') } }" />
            <span class="text-saft-brown-900 font-bold text-4xl">S.A.F.T.</span>
          </div>

          <div class="absolute right-4 top-1/2 -translate-y-1/2">
            <button type="button" @click="toggleDarkMode"
              class="flex items-center justify-center rounded-full p-2 transition-colors duration-300"
              :class="isDark ? 'bg-saft-main-500 text-white' : 'bg-saft-main-500 text-white'">
              <Sun v-if="!isDark" class="w-5 h-5" />
              <Moon v-else class="w-5 h-5" />
            </button>
          </div>

        </div>





        <Navbar />
        <main class="mx-auto max-w-5xl px-0 py-0">
          <RouterView />
        </main>
        <footer class="text-center text-sm text-gray-400 mt-4">
          <a href="https://www.flaticon.com/free-icons/orange" title="orange icons">Orange icons created by Freepik -
            Flaticon</a>
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

.uwu div#background-wrapper {
  background-image: url('https://images.stockcake.com/public/3/7/7/377c4d6a-c3bd-4154-8d8a-00fa793e4648_large/refreshing-juice-joy-stockcake.jpg');
}
</style>
