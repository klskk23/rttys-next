<template>
  <v-select v-model="settings.port" :items="ports" :label="t('Serial port')" :loading="loading" class="mono-input"
    :error-messages="error" :no-data-text="t('No serial ports found')" :prepend-inner-icon="icons.serial">
    <template #append>
      <v-btn :icon="icons.refresh" variant="text" :loading="loading" :aria-label="t('Refresh')" @click="loadPorts"/>
    </template>
  </v-select>
  <v-select v-model="settings.baudRate" :items="baudRates" :label="t('Baud rate')" class="mono-input"/>
  <div class="serial-grid">
    <v-select v-model="settings.dataBits" :items="[5, 6, 7, 8]" :label="t('Data bits')"/>
    <v-select v-model="settings.stopBits" :items="[1, 2]" :label="t('Stop bits')"/>
    <v-select v-model="settings.parity" :items="parities" :label="t('Parity')"/>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import * as icons from '../icons'

const props = defineProps({ dev: Object, active: Boolean })
const { t } = useI18n()
const ports = ref([])
const loading = ref(false)
const error = ref('')
const baudRates = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600]
const parities = computed(() => [
  { title: t('None'), value: 'none' },
  { title: t('Odd'), value: 'odd' },
  { title: t('Even'), value: 'even' }
])
const settings = reactive({ port: '', baudRate: 115200, dataBits: 8, stopBits: 1, parity: 'none' })
const ready = computed(() => props.active && !!props.dev && !loading.value && !error.value && !!settings.port)
let latestRequest = 0

const loadPorts = () => {
  const request = ++latestRequest
  settings.port = ''
  error.value = ''
  ports.value = []
  loading.value = false

  if (!props.active || !props.dev) return

  loading.value = true
  axios.get(`/api/serial-ports/${encodeURIComponent(props.dev.id)}`, {
    params: { group: props.dev.group || '' }
  }).then(res => {
    if (request !== latestRequest) return
    ports.value = res.data.ports
    if (ports.value.length === 1)
      settings.port = ports.value[0]
  }).catch(() => {
    if (request !== latestRequest) return
    error.value = t('Unable to list serial ports')
  }).finally(() => {
    if (request !== latestRequest) return
    loading.value = false
  })
}

const getSettings = () => ({ ...settings })

watch(() => [props.active, props.dev?.id, props.dev?.group], loadPorts, { immediate: true })
defineExpose({ ready, getSettings })
</script>

<style scoped>
.serial-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 12px;
}
</style>
