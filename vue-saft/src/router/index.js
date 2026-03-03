import { createRouter, createWebHistory } from 'vue-router'
import UploadView from '@/views/UploadView.vue'
import CanvasView from '@/views/CanvasView.vue'
import DownloadView from '@/views/DownloadView.vue'
import NotFoundView from '@/views/NotFoundView.vue'
import { getState } from '@/store/saftState'

const routes = [
  { path: '/', redirect: '/upload' },
  { path: '/upload', name: 'upload', component: UploadView },
  { path: '/canvas', name: 'canvas', component: CanvasView, meta: { requiresUpload: true } },
  { path: '/download', name: 'download', component: DownloadView, meta: { requiresExport: true } },
  { path: '/:catchAll(.*)', name: 'not-found', component: NotFoundView },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const state = getState()

  if (to.meta.requiresUpload && !state.hasUpload) return { name: 'upload' }
  if (to.meta.requiresExport && !state.hasExport) return { name: 'canvas' }

  return true
})

export default router
