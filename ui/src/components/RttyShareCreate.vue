<template>
  <v-dialog v-model="creating" max-width="480">
    <v-card :title="t('Create share')" :subtitle="device ? (device.group ? `${device.group} / ${device.id}` : device.id) : ''">
      <v-card-text>
        <v-form @submit.prevent="createShare">
          <v-btn-toggle v-model="form.kind" mandatory class="mb-6 w-100">
            <v-btn v-for="k in kinds" :key="k.value" :value="k.value" :disabled="k.disabled" class="flex-grow-1">{{ k.title }}</v-btn>
          </v-btn-toggle>
          <RttySerialSettings v-if="form.kind === 'serial'" ref="serialSettings" :dev="device" :active="creating"/>
          <div v-if="form.kind === 'tcp'" class="share-grid">
            <v-text-field v-model.trim="form.targetIp" :label="t('Target IPv4')" class="mono-input" :rules="[ipRule]"/>
            <v-number-input v-model="form.targetPort" :label="t('Target port')" :min="1" :max="65535" class="mono-input"/>
          </div>
          <div class="share-grid">
            <v-select v-model="form.idleSeconds" :items="idleOptions" :label="t('Idle timeout')"/>
            <v-number-input v-model="form.port" :label="t('Public port')" :min="0" :max="65535" :placeholder="t('Automatic')" persistent-placeholder class="mono-input"/>
          </div>
          <v-alert v-if="createError" type="error" variant="tonal" :text="createError" density="compact" rounded="lg"/>
          <button type="submit" hidden/>
        </v-form>
      </v-card-text>
      <template #actions>
        <v-spacer/>
        <v-btn variant="text" @click="creating = false">{{ t('Cancel') }}</v-btn>
        <v-btn variant="flat" color="primary" :loading="submitting" :disabled="!canCreate" @click="createShare">{{ t('Create') }}</v-btn>
      </template>
    </v-card>
  </v-dialog>

  <v-dialog v-model="createdVisible" max-width="480" @after-leave="created = null">
    <v-card v-if="created" :title="t('Share created')">
      <template #prepend>
        <v-icon :icon="icons.success" color="success"/>
      </template>
      <v-list bg-color="transparent" lines="two">
        <v-list-item :prepend-icon="icons.link" :title="connection" :subtitle="kindTitle(created.share.kind)">
          <template #title><span class="font-mono">{{ connection }}</span></template>
          <template #append><v-btn :icon="icons.copy" variant="text" @click="copy(connection)"/></template>
        </v-list-item>
        <template v-if="created.password">
          <v-list-item :prepend-icon="icons.user" :subtitle="t('Username')">
            <template #title><span class="font-mono">share</span></template>
          </v-list-item>
          <v-list-item :prepend-icon="icons.password" :subtitle="t('Temporary password')">
            <template #title><span class="font-mono">{{ created.password }}</span></template>
            <template #append><v-btn :icon="icons.copy" variant="text" @click="copy(created.password)"/></template>
          </v-list-item>
        </template>
      </v-list>
      <template #actions>
        <v-spacer/>
        <v-btn variant="text" @click="showShares">{{ t('Shares') }}</v-btn>
        <v-btn variant="flat" color="primary" @click="createdVisible = false">{{ t('Done') }}</v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, reactive, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import axios from 'axios'
import * as icons from '../icons'
import { copy } from '../composables/notify'
import { isIPv4 } from '../composables/format'
import RttySerialSettings from './RttySerialSettings.vue'

const { t } = useI18n()
const router = useRouter()
const serialSettings = useTemplateRef('serialSettings')
const device = ref(null)
const submitting = ref(false)
const createError = ref('')
const creating = ref(false)
const createdVisible = ref(false)
const created = ref(null)
const form = reactive({
  kind: 'terminal', port: null, idleSeconds: 60,
  targetIp: '', targetPort: 22
})

const kindTitle = kind => ({ terminal: t('Terminal SSH'), serial: t('Serial SSH'), tcp: t('TCP port') })[kind] || kind

const kinds = computed(() => [
  { title: t('Terminal SSH'), value: 'terminal' },
  { title: t('Serial SSH'), value: 'serial', disabled: device.value?.proto < 6 },
  { title: t('TCP port'), value: 'tcp', disabled: device.value?.proto < 6 }
])

const idleOptions = computed(() => [1, 5, 15, 30, 60].map(n => ({ title: t('minutes', { count: n }, n), value: n * 60 })))

const ipRule = v => isIPv4(v) || t('Please enter a valid IPv4 address')

const canCreate = computed(() => device.value && !submitting.value &&
  (form.kind === 'terminal' || (device.value.proto >= 6 &&
    (form.kind === 'serial' ? !!serialSettings.value?.ready : isIPv4(form.targetIp) && form.targetPort >= 1))))

const connection = computed(() => {
  const s = created.value?.share
  if (!s) return ''
  return s.kind === 'tcp' ? `${s.host}:${s.port}` : `ssh -p ${s.port} share@${s.host}`
})

watch(() => form.kind, () => {
  createError.value = ''
})

const open = (dev) => {
  device.value = dev
  form.kind = 'terminal'
  form.port = null
  form.idleSeconds = 60
  createError.value = ''
  creating.value = true
}

const createShare = async() => {
  if (!canCreate.value) return

  const dev = device.value
  const body = {
    kind: form.kind, group: dev.group, deviceId: dev.id,
    idleSeconds: form.idleSeconds, port: form.port || 0
  }
  if (form.kind === 'tcp')
    Object.assign(body, { targetIp: form.targetIp, targetPort: form.targetPort })
  if (form.kind === 'serial') {
    const serial = serialSettings.value.getSettings()
    body.serial = { ...serial, parity: { none: 0, odd: 1, even: 2 }[serial.parity] }
  }

  submitting.value = true
  createError.value = ''
  try {
    created.value = (await axios.post('/api/shares', body)).data
    creating.value = false
    createdVisible.value = true
  } catch (err) {
    createError.value = err.response?.data?.error || t('Unable to create share')
  } finally {
    submitting.value = false
  }
}

const showShares = () => {
  createdVisible.value = false
  router.push({ name: 'Shares' })
}

defineExpose({ open })
</script>

<style scoped>
.share-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 12px;
}

@media (max-width: 599px) {
  .share-grid {
    grid-template-columns: 1fr;
  }
}
</style>
