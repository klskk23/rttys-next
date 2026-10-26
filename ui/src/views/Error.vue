<template>
  <v-main class="bg-surface">
    <div class="error-page">
      <v-avatar color="error-container" size="96">
        <v-icon :icon="info.icon" size="48"/>
      </v-avatar>
      <h1 class="text-headline-small">{{ info.title }}</h1>
      <div class="d-flex ga-2">
        <v-btn variant="text" :prepend-icon="icons.devices" :to="{ name: 'Devices' }">{{ $t('Devices') }}</v-btn>
        <v-btn variant="flat" color="primary" :prepend-icon="icons.refresh" @click="router.back()">{{ $t('Retry') }}</v-btn>
      </div>
    </div>
  </v-main>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import * as icons from '../icons'

const { t } = useI18n()
const router = useRouter()

const props = defineProps({
  err: String
})

const info = computed(() => ({
  offline: { icon: icons.offline, title: t('Device Unavailable') },
  full: { icon: icons.full, title: t('Terminal Session Limit Reached') },
  timeout: { icon: icons.timeout, title: t('Device Response Timeout') }
})[props.err] || { icon: icons.alert, title: t('Connection failed') })
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 16px;
  text-align: center;
}

.error-page h1 {
  margin: 0;
}
</style>
