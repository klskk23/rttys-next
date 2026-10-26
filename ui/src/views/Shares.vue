<template>
  <div class="md-page">
    <div class="md-toolbar">
      <v-text-field v-model="filter" class="md-search md-toolbar-search" :placeholder="t('Search')" :prepend-inner-icon="icons.search"
        variant="solo-filled" flat density="comfortable" hide-details clearable single-line/>
      <v-spacer/>
      <v-chip :prepend-icon="icons.shares" variant="tonal" color="primary" size="large" class="font-mono">{{ shares.length }}</v-chip>
      <v-tooltip :text="t('Refresh')">
        <template #activator="{ props }">
          <v-btn v-bind="props" :icon="icons.refresh" variant="text" :loading="loading" @click="loadShares"/>
        </template>
      </v-tooltip>
    </div>

    <v-alert v-if="listError" type="error" variant="tonal" :text="listError" density="compact" rounded="lg" class="mb-4"/>

    <v-sheet class="md-table-surface" color="surface-container-low" rounded="xl">
      <v-data-table :headers="headers" :items="shares" :search="filter" :filter-keys="['deviceId', 'group', 'host']"
        item-value="id" :loading="loading && !shares.length" :items-per-page="-1" mobile-breakpoint="sm" hide-default-footer>
        <template #no-data>
          <v-empty-state :icon="icons.shares" :title="t('No active shares')" size="64" class="py-12"/>
        </template>
        <template #[`item.kind`]="{ value }">
          <v-chip :prepend-icon="kindIcon(value)" size="small" variant="tonal">{{ kindTitle(value) }}</v-chip>
        </template>
        <template #[`item.deviceId`]="{ item }">
          <div class="text-body-medium font-mono">{{ item.deviceId }}</div>
          <div v-if="item.group" class="text-body-small text-medium-emphasis">{{ item.group }}</div>
        </template>
        <template #[`item.target`]="{ item }">
          <span class="font-mono">{{ target(item) }}</span>
        </template>
        <template #[`item.address`]="{ item }">
          <span class="font-mono">{{ item.host }}:{{ item.port }}</span>
          <v-btn :icon="icons.copy" variant="text" size="x-small" class="ml-1" @click="copy(`${item.host}:${item.port}`)"/>
        </template>
        <template #[`item.connections`]="{ value }">
          <v-chip size="small" :color="value ? 'success' : undefined" variant="tonal" class="font-mono">{{ value }}</v-chip>
        </template>
        <template #[`item.idleDeadline`]="{ value }">
          <span v-if="value">{{ new Date(value).toLocaleString() }}</span>
          <span v-else class="text-success">{{ t('Active') }}</span>
        </template>
        <template #[`item.actions`]="{ item }">
          <v-tooltip :text="t('End share')">
            <template #activator="{ props }">
              <v-btn v-bind="props" :icon="icons.delete" variant="text" color="error" size="small" @click="endShare(item)"/>
            </template>
          </v-tooltip>
        </template>
      </v-data-table>
    </v-sheet>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import * as icons from '../icons'
import { notify, confirm, copy } from '../composables/notify'

const { t } = useI18n()

const shares = ref([])
const filter = ref('')
const loading = ref(false)
const listError = ref('')
let refreshTimer

const headers = computed(() => [
  { title: t('Type'), key: 'kind' },
  { title: t('Device'), key: 'deviceId' },
  { title: t('Destination'), key: 'target', sortable: false },
  { title: t('Address'), key: 'address', sortable: false },
  { title: t('Connections'), key: 'connections', align: 'center' },
  { title: t('Idle closes'), key: 'idleDeadline' },
  { title: '', key: 'actions', sortable: false, align: 'end' }
])

const kindTitle = kind => ({ terminal: t('Terminal SSH'), serial: t('Serial SSH'), tcp: t('TCP port') })[kind] || kind
const kindIcon = kind => ({ terminal: icons.terminal, serial: icons.serial, tcp: icons.shares })[kind]

const target = (s) => {
  if (s.kind === 'tcp') return `${s.targetIp}:${s.targetPort}`
  if (s.kind === 'serial') return s.serial?.Port
  return t('Terminal')
}

const loadShares = async() => {
  loading.value = true
  try {
    shares.value = (await axios.get('/api/shares')).data
    listError.value = ''
  } catch {
    listError.value = t('Unable to load shares')
  } finally {
    loading.value = false
  }
}

const endShare = async(row) => {
  if (!await confirm(t('End share'), t('End share confirmation'), t('End share')))
    return

  try {
    await axios.delete(`/api/shares/${row.id}`)
    await loadShares()
  } catch {
    notify.error(t('Unable to end share'))
  }
}

onMounted(() => {
  loadShares()
  refreshTimer = setInterval(loadShares, 10000)
})

onUnmounted(() => clearInterval(refreshTimer))
</script>

