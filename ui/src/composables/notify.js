/* SPDX-License-Identifier: MIT */

import { ref, reactive } from 'vue'
import useClipboard from 'vue-clipboard3'
import i18n from '../i18n'

export const messages = ref([])

const push = (text, color) => messages.value.push({ text, color })

export const notify = {
  info: text => push(text),
  success: text => push(text),
  error: text => push(text, 'error-container')
}

export const confirmState = reactive({
  visible: false,
  title: '',
  text: '',
  action: '',
  resolve: null
})

export const confirm = (title, text, action) => new Promise(resolve => {
  Object.assign(confirmState, { visible: true, title, text, action, resolve })
})

export const settleConfirm = ok => {
  confirmState.visible = false
  confirmState.resolve?.(ok)
  confirmState.resolve = null
}

const { toClipboard } = useClipboard()

export const copy = async text => {
  const { t } = i18n.global
  try {
    await toClipboard(text)
    notify.success(t('Copied to clipboard'))
  } catch {
    notify.error(t('Copy failed'))
  }
}
