<template>
  <v-dialog v-model="visible" max-width="440">
    <v-card :title="$t('Serial port')" :subtitle="dev?.id">
      <v-card-text>
        <v-form @submit.prevent="openSerialPort">
          <RttySerialSettings ref="serialSettings" :dev="dev" :active="visible"/>
        </v-form>
      </v-card-text>
      <template #actions>
        <v-spacer/>
        <v-btn variant="text" @click="visible = false">{{ $t('Cancel') }}</v-btn>
        <v-btn variant="flat" color="primary" :disabled="!serialSettings?.ready" @click="openSerialPort">{{ $t('Open') }}</v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, useTemplateRef } from 'vue'
import RttySerialSettings from './RttySerialSettings.vue'

const visible = ref(false)
const dev = ref(null)
const serialSettings = useTemplateRef('serialSettings')

const open = (device) => {
  dev.value = device
  visible.value = true
}

const openSerialPort = () => {
  if (!dev.value || !serialSettings.value?.ready) return

  const settings = serialSettings.value.getSettings()

  visible.value = false

  const params = new URLSearchParams({
    group: dev.value.group || '', port: settings.port, baudRate: String(settings.baudRate),
    dataBits: String(settings.dataBits), stopBits: String(settings.stopBits), parity: settings.parity
  })
  window.open(`/serial/${dev.value.id}?${params}`, '_blank')
}

defineExpose({ open })
</script>
