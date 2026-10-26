<template>
  <div class="md-page">
    <div class="md-toolbar">
      <v-text-field v-model="filter" class="md-search md-toolbar-search" :placeholder="$t('Search')" :prepend-inner-icon="icons.search"
        variant="solo-filled" flat density="comfortable" hide-details clearable single-line/>
      <v-select v-if="groups.length > 1" v-model="group" :items="groupItems" class="toolbar-group" :prepend-inner-icon="icons.group"
        density="comfortable" hide-details @update:model-value="getDevices"/>
      <v-spacer/>
      <v-chip :prepend-icon="icons.devices" variant="tonal" color="primary" size="large" class="font-mono">{{ devices.length }}</v-chip>
      <v-tooltip :text="$t('Refresh')">
        <template #activator="{ props }">
          <v-btn v-bind="props" :icon="icons.refresh" variant="text" :loading="loading" @click="refresh"/>
        </template>
      </v-tooltip>
      <v-badge :model-value="selected.length > 0" :content="selected.length" color="primary">
        <v-btn v-if="compact" :icon="icons.command" variant="tonal" color="secondary" :disabled="!selectable.length"
          :aria-label="$t('Execute command')" @click="rttyCmd.open(selectable)"/>
        <v-btn v-else :prepend-icon="icons.command" variant="tonal" color="secondary" :disabled="!selectable.length"
          @click="rttyCmd.open(selectable)">{{ $t('Execute command') }}</v-btn>
      </v-badge>
    </div>

    <v-sheet class="md-table-surface" color="surface-container-low" rounded="xl">
      <v-data-table v-model="selected" :headers="headers" :items="devices" :search="filter" :filter-keys="['id', 'description', 'ipaddr']"
        :loading="loading" item-value="id" return-object show-select fixed-header :height="compact ? undefined : 'calc(100vh - 232px)'"
        :items-per-page="25" :items-per-page-options="[10, 25, 50, 100]" :mobile="false" :no-data-text="$t('No devices')">
        <template #[`item.id`]="{ item }">
          <div class="py-2">
            <div class="text-body-medium font-mono">{{ item.id }}</div>
            <div v-if="item.description" class="text-body-small text-medium-emphasis text-truncate desc">{{ item.description }}</div>
            <div v-if="compact" class="text-body-small text-medium-emphasis">
              <span class="font-mono">{{ item.ipaddr }}</span> · {{ formatDuration(item.uptime) }}
            </div>
          </div>
        </template>
        <template #[`item.ipaddr`]="{ value }">
          <span class="font-mono">{{ value }}</span>
        </template>
        <template #[`item.uptime`]="{ value }">{{ formatDuration(value) }}</template>
        <template #[`item.connected`]="{ value }">{{ formatDuration(value) }}</template>
        <template #[`item.actions`]="{ item }">
          <div class="actions">
            <v-tooltip :text="$t('Terminal')">
              <template #activator="{ props }">
                <v-btn v-bind="props" :icon="icons.terminal" variant="tonal" color="primary" size="small" @click="openTerminal(item)"/>
              </template>
            </v-tooltip>
            <v-tooltip :text="item.proto >= 6 ? $t('Serial port') : $t('Upgrade client for serial access')">
              <template #activator="{ props }">
                <span v-bind="props">
                  <v-btn :icon="icons.serial" variant="text" size="small" :disabled="item.proto < 6" @click="serialDialog.open(item)"/>
                </span>
              </template>
            </v-tooltip>
            <v-tooltip :text="$t('Device web')">
              <template #activator="{ props }">
                <v-btn v-bind="props" :icon="icons.web" variant="text" size="small" @click="webDialog.open(item)"/>
              </template>
            </v-tooltip>
            <v-tooltip :text="$t('Share device')">
              <template #activator="{ props }">
                <v-btn v-bind="props" :icon="icons.share" variant="text" size="small" @click="shareCreate.open(item)"/>
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-data-table>
    </v-sheet>

    <RttyCmd ref="rttyCmd"/>
    <RttyWeb ref="webDialog"/>
    <RttySerialDialog ref="serialDialog"/>
    <RttyShareCreate ref="shareCreate"/>
  </div>
</template>

<script setup>
import { ref, computed, onActivated, useTemplateRef } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useDisplay } from 'vuetify'
import axios from 'axios'
import * as icons from '../icons'
import { formatDuration } from '../composables/format'
import RttyCmd from '../components/RttyCmd.vue'
import RttyWeb from '../components/RttyWeb.vue'
import RttySerialDialog from '../components/RttySerialDialog.vue'
import RttyShareCreate from '../components/RttyShareCreate.vue'

const { t } = useI18n()
const router = useRouter()
const { xs: compact } = useDisplay()

const rttyCmd = useTemplateRef('rttyCmd')
const webDialog = useTemplateRef('webDialog')
const serialDialog = useTemplateRef('serialDialog')
const shareCreate = useTemplateRef('shareCreate')

const group = ref('')
const groups = ref([])
const filter = ref('')
const loading = ref(false)
const devices = ref([])
const selected = ref([])

const groupItems = computed(() => groups.value.map(g => ({ title: g || t('ungrouped'), value: g })))

const headers = computed(() => [
  { title: t('Device'), key: 'id', sortable: true },
  ...(compact.value ? [] : [
    { title: t('ipaddr'), key: 'ipaddr', sortable: true },
    { title: t('Uptime'), key: 'uptime', sortable: true },
    { title: t('Connected time'), key: 'connected', sortable: true }
  ]),
  { title: '', key: 'actions', sortable: false, align: 'end' }
])

// Batch commands need rtty client protocol > 4.
const selectable = computed(() => selected.value.filter(d => d.proto > 4))

const getDevices = () => {
  loading.value = true
  return axios.get('/api/devs', { params: { group: group.value } }).then(res => {
    devices.value = res.data
    selected.value = []
  }).catch(() => {
    router.push('/login')
  }).finally(() => {
    loading.value = false
  })
}

const refresh = () => {
  loading.value = true
  axios.get('/api/groups').then(res => {
    groups.value = res.data
    if (!groups.value.includes(group.value))
      group.value = groups.value[0] ?? ''
    getDevices()
  }).catch(() => {
    loading.value = false
  })
}

const openTerminal = (dev) => {
  let url = `/rtty/${dev.id}`
  if (dev.group)
    url += `?group=${dev.group}`
  window.open(url)
}

onActivated(refresh)
</script>

<style scoped>
.toolbar-group {
  flex: 0 0 200px;
}

.actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.desc {
  max-width: 360px;
}

@media (max-width: 599px) {
  .desc {
    max-width: 140px;
  }

  .actions {
    gap: 0;
  }

  .toolbar-group {
    flex: 1 1 160px;
  }
}
</style>
