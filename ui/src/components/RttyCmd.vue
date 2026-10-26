<template>
  <v-dialog v-model="formVisible" max-width="480">
    <v-card :title="$t('Execute command')">
      <template #append>
        <v-chip :prepend-icon="icons.devices" variant="tonal" color="primary">{{ targets.length }}</v-chip>
      </template>
      <v-card-text>
        <v-form ref="form" @submit.prevent="run">
          <v-text-field v-model="data.username" :label="$t('Username')" :prepend-inner-icon="icons.user" :rules="[required]" autofocus/>
          <v-text-field v-model.trim="data.cmd" :label="$t('Command')" :prepend-inner-icon="icons.command" class="mono-input" :rules="[required]"/>
          <v-combobox v-model="data.params" :label="$t('Parameter')" multiple chips closable-chips hide-no-data :delimiters="[' ']"/>
          <v-number-input v-model="data.wait" :label="$t('Wait Time')" suffix="s" :min="0" :max="30" :rules="[waitRule]"/>
          <button type="submit" hidden/>
        </v-form>
      </v-card-text>
      <template #actions>
        <v-spacer/>
        <v-btn variant="text" @click="formVisible = false">{{ $t('Cancel') }}</v-btn>
        <v-btn variant="flat" color="primary" @click="run">{{ $t('Run') }}</v-btn>
      </template>
    </v-card>
  </v-dialog>

  <v-dialog v-model="resultVisible" max-width="800">
    <v-card :title="data.cmd" class="result-card">
      <template #subtitle>
        <span class="font-mono">{{ data.params.join(' ') }}</span>
      </template>
      <template #append>
        <div class="d-flex ga-2">
          <v-chip :prepend-icon="icons.success" color="success" variant="tonal">{{ succeeded }}</v-chip>
          <v-chip :prepend-icon="icons.failure" color="error" variant="tonal">{{ failed }}</v-chip>
        </div>
      </template>
      <v-progress-linear :model-value="progress" :indeterminate="pending > 0 && responses.length === 0" color="primary" class="mx-6 mb-2" style="width: auto"/>
      <v-card-text>
        <v-expansion-panels variant="accordion" multiple flat>
          <v-expansion-panel v-for="r in responses" :key="r.id" bg-color="surface-container"
            :readonly="!r.stdout && !r.stderr" :hide-actions="!r.stdout && !r.stderr">
            <v-expansion-panel-title>
              <v-icon :icon="r.ok ? icons.success : icons.failure" :color="r.ok ? 'success' : 'error'" size="20" class="mr-3"/>
              <span class="font-mono text-body-medium flex-grow-1 text-truncate">{{ r.id }}</span>
              <span v-if="r.msg" class="text-body-small text-error mr-3">{{ r.msg }}</span>
              <v-chip v-else size="small" variant="outlined" class="font-mono mr-3">{{ r.code }}</v-chip>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <pre v-if="r.stdout" class="output">{{ r.stdout }}</pre>
              <pre v-if="r.stderr" class="output stderr">{{ r.stderr }}</pre>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
      <template #actions>
        <v-spacer/>
        <v-btn variant="text" @click="resultVisible = false">{{ $t('Close') }}</v-btn>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import axios from 'axios'
import * as icons from '../icons'

const { t } = useI18n()

const form = useTemplateRef('form')

const formVisible = ref(false)
const resultVisible = ref(false)
const targets = ref([])
const responses = ref([])
const pending = ref(0)

const data = reactive({
  username: '',
  cmd: '',
  params: [],
  wait: 30
})

const required = v => !!v || t('Required')
const waitRule = v => (v === null || (Number.isInteger(v) && v >= 0 && v <= 30)) || t('must be an integer between 0 and 30')

const total = computed(() => responses.value.length + pending.value)
const succeeded = computed(() => responses.value.filter(r => r.ok).length)
const failed = computed(() => responses.value.length - succeeded.value)
const progress = computed(() => total.value ? responses.value.length / total.value * 100 : 0)

const decode = (b64) => {
  if (!b64) return ''
  const bytes = Uint8Array.from(window.atob(b64), c => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

const open = (devices) => {
  targets.value = devices
  formVisible.value = true
}

const run = async() => {
  const { valid } = await form.value.validate()
  if (!valid) return

  const wait = data.wait ?? 30
  const body = { username: data.username, cmd: data.cmd, params: [...data.params] }

  formVisible.value = false
  resultVisible.value = true
  responses.value = []
  pending.value = targets.value.length

  targets.value.forEach(dev => {
    axios.post(`/api/cmd/${dev.id}`, body, { params: { group: dev.group, wait } }).then(res => {
      if (wait === 0) {
        responses.value.push({ id: dev.id, ok: true, code: 0 })
        return
      }

      const resp = res.data
      const ok = !resp.err
      responses.value.push({
        id: dev.id,
        ok,
        code: resp.code,
        msg: ok ? '' : resp.msg,
        stdout: ok ? decode(resp.stdout) : '',
        stderr: ok ? decode(resp.stderr) : ''
      })
    }).catch(err => {
      responses.value.push({ id: dev.id, ok: false, msg: err.response?.data?.msg || err.message })
    }).finally(() => {
      pending.value--
    })
  })
}

defineExpose({ open })
</script>

<style scoped>
.output {
  font-family: var(--md-font-mono);
  font-size: 0.8125rem;
  line-height: 1.25rem;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 320px;
  overflow: auto;
  margin: 0 0 8px;
  padding: 12px;
  border-radius: 8px;
  background: rgb(var(--v-theme-surface-container-lowest));
}

.output.stderr {
  color: rgb(var(--v-theme-error));
}
</style>
