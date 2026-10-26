<template>
  <v-dialog v-model="visible" max-width="400">
    <v-card :title="$t('Device web')" :subtitle="dev?.id">
      <v-card-text>
        <v-form ref="form" @submit.prevent="submit">
          <v-btn-toggle v-model="data.proto" mandatory class="mb-6 w-100">
            <v-btn value="http" class="flex-grow-1">HTTP</v-btn>
            <v-btn value="https" class="flex-grow-1" :disabled="dev?.proto < 4">HTTPS</v-btn>
          </v-btn-toggle>
          <v-text-field v-model.trim="data.ipaddr" :label="$t('ipaddr')" placeholder="127.0.0.1" persistent-placeholder :rules="[ipRule]" class="mono-input"/>
          <v-text-field v-model.number="data.port" :label="$t('port')" :placeholder="data.proto === 'https' ? '443' : '80'" persistent-placeholder :rules="[portRule]" class="mono-input"/>
          <v-text-field v-model.trim="data.path" :label="$t('path')" placeholder="/" persistent-placeholder :rules="[pathRule]" class="mono-input"/>
          <button type="submit" hidden/>
        </v-form>
      </v-card-text>
      <template #actions>
        <v-spacer/>
        <v-btn variant="text" @click="visible = false">{{ $t('Cancel') }}</v-btn>
        <v-btn variant="flat" color="primary" @click="submit">{{ $t('Open') }}</v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { isIPv4 } from '../composables/format'

const { t } = useI18n()

const form = useTemplateRef('form')
const visible = ref(false)
const dev = ref(null)

const data = reactive({
  proto: 'http',
  ipaddr: '',
  port: '',
  path: ''
})

const ipRule = v => !v || isIPv4(v) || t('Invalid IP address')
const portRule = v => !v || (Number.isInteger(v) && v >= 1 && v <= 65535) || t('Invalid port')
const pathRule = v => !v || v.startsWith('/') || t('Must start with /')

const open = (device) => {
  dev.value = device
  if (device.proto < 4)
    data.proto = 'http'
  visible.value = true
}

const submit = async() => {
  const { valid } = await form.value.validate()
  if (!valid) return

  visible.value = false

  const proto = data.proto
  const ipaddr = data.ipaddr || '127.0.0.1'
  const port = data.port || (proto === 'https' ? 443 : 80)
  const path = data.path || '/'
  const addr = encodeURIComponent(`${ipaddr}:${port}${path}`)
  const { group, id } = dev.value

  if (group)
    window.open(`/api/web2/${group}/${id}/${proto}/${addr}`)
  else
    window.open(`/api/web/${id}/${proto}/${addr}`)
}

defineExpose({ open })
</script>
