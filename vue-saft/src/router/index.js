import { createRouter, createWebHistory } from 'vue-router'
import UploadView from '@/views/UploadView.vue'
import CanvasView from '@/views/CanvasView.vue'
import DownloadView from '@/views/DownloadView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import { spectrogramStore } from '@/store/store.js';

const routes = [
  { path: '/', redirect: '/upload' },
  { path: '/upload', name: 'upload', component: UploadView },
  { path: '/canvas', name: 'canvas', component: CanvasView, meta: { requiresSpectrogramData: true } },
  { path: '/download', name: 'download', component: DownloadView, meta: { requiresSpectrogramData: true } },
  { path: '/:catchAll(.*)', name: 'not-found', component: NotFoundView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from) => {
  if (to.meta.requiresSpectrogramData && !(spectrogramStore.renderData && spectrogramStore.spectrogram)) {
    return '/upload';
  }
});

export default router
