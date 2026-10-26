<template>
  <div class="terminal-container">
    <v-theme-provider theme="dark" with-background class="terminal-theme">
      <div ref="terminal" class="rtty-terminal" @contextmenu.prevent="showContextmenu"></div>

      <v-fade-transition>
        <div v-if="connecting" class="term-overlay">
          <v-progress-circular indeterminate color="primary" size="48" width="4"/>
          <span class="text-title-small font-mono text-medium-emphasis">{{ devid }}</span>
        </div>
      </v-fade-transition>

      <v-slide-y-transition>
        <div v-if="disconnected" class="term-status">
          <v-chip :prepend-icon="icons.offline" color="error" variant="flat" size="large">{{ $t('Disconnected') }}</v-chip>
          <v-btn :prepend-icon="icons.refresh" color="primary" variant="flat" @click="reconnect">{{ $t('Reconnect') }}</v-btn>
        </div>
      </v-slide-y-transition>

      <v-btn v-show="isConnected && !showKeyboard" :icon="icons.keyboard" color="secondary-container" class="keyboard-toggle-btn"
        :aria-label="$t('Virtual Keyboard')" @click="toggleKeyboard"/>
      <RttyKeyboard v-show="showKeyboard" @keypress="handleKeypress" @close="hideKeyboard" class="floating-keyboard"/>

      <v-dialog v-if="!isSerial" v-model="fileCtx.modal" max-width="420" @after-leave="onUploadDialogClosed">
        <v-card :title="$t('Upload file')">
          <v-card-text>
            <v-file-input v-model="fileCtx.file" :label="$t('Select file')" :prepend-icon="null" :prepend-inner-icon="icons.upload" show-size/>
          </v-card-text>
          <template #actions>
            <v-spacer/>
            <v-btn variant="text" @click="fileCtx.modal = false">{{ $t('Cancel') }}</v-btn>
            <v-btn variant="flat" color="primary" :disabled="!fileCtx.file" @click="doUploadFile">{{ $t('Upload') }}</v-btn>
          </template>
        </v-card>
      </v-dialog>

      <v-slide-y-transition>
        <v-sheet v-if="showFindBox" class="find-box" color="surface-container-high" rounded="lg" elevation="3" @keydown="onFindBoxKeydown">
          <v-text-field ref="findInput" v-model="findText" :placeholder="$t('Find')" density="compact" variant="solo-filled" flat
            hide-details single-line class="find-input" bg-color="surface-container-highest" @keydown.enter.exact="doFind('next')"
            @keydown.shift.enter="doFind('prev')"/>
          <v-btn-toggle v-model="findFlags" multiple density="compact" variant="text" color="primary" :divided="false">
            <v-btn value="caseSensitive" :icon="icons.matchCase" size="small" :title="$t('Match Case')"/>
            <v-btn value="wholeWord" :icon="icons.wholeWord" size="small" :title="$t('Whole Word')"/>
            <v-btn value="regex" :icon="icons.regex" size="small" :title="$t('Regular')"/>
          </v-btn-toggle>
          <v-divider vertical class="mx-1"/>
          <v-btn :icon="icons.prev" variant="text" size="small" :title="$t('Prev')" @click="doFind('prev')"/>
          <v-btn :icon="icons.next" variant="text" size="small" :title="$t('Next')" @click="doFind('next')"/>
          <v-btn :icon="icons.close" variant="text" size="small" :title="$t('Close')" @click="showFindBox = false"/>
        </v-sheet>
      </v-slide-y-transition>

      <v-menu v-model="contextmenu.visible" :target="contextmenu.target" location="bottom start" @after-leave="focusTerm">
        <v-list min-width="240">
          <template v-for="(group, gi) in contextmenus" :key="gi">
            <v-divider v-if="gi > 0" class="my-1"/>
            <v-list-item v-for="item in group" :key="item.name" :prepend-icon="item.icon" :title="item.caption" @click="onContextmenuClick(item.name)">
              <template v-if="item.shortcut" #append>
                <span class="text-label-small text-medium-emphasis font-mono ml-6">{{ item.shortcut }}</span>
              </template>
            </v-list-item>
          </template>
        </v-list>
      </v-menu>
    </v-theme-provider>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick, useTemplateRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { SearchAddon } from '@xterm/addon-search'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import OverlayAddon from '../xterm-addon/xterm-addon-overlay'
import RttyKeyboard from '../components/RttyKeyboard.vue'
import * as icons from '../icons'
import { notify, copy } from '../composables/notify'
import { terminal as terminalTheme } from '../plugins/theme'

const LoginErrorOffline = 4000
const LoginErrorBusy = 4001
const LoginErrorTimeout = 4002

const MsgTypeFileData = 0x03

const ReadFileBlkSize = 63 * 1024
const FileWindowSize = 16

const AckBlkSize = 4 * 1024

const props = defineProps({
  devid: String,
  panelId: String,
  mode: { type: String, default: 'terminal' }
})

const emit = defineEmits(['split', 'close'])

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const isSerial = computed(() => props.mode === 'serial')
const serialSettings = {
  port: route.query.port || '', baudRate: route.query.baudRate || '',
  dataBits: route.query.dataBits || '', stopBits: route.query.stopBits || '', parity: route.query.parity || ''
}

const terminal = useTemplateRef('terminal')
const contextmenu = reactive({ visible: false, target: [0, 0] })

const contextmenus = [
  [
    { name: 'copy', icon: icons.copy, caption: t('Copy'), shortcut: 'Ctrl+Insert' },
    { name: 'paste', icon: icons.paste, caption: t('Paste'), shortcut: 'Shift+Insert' }
  ],
  [
    { name: 'find', icon: icons.search, caption: t('Find'), shortcut: 'Ctrl+F' },
    { name: 'clear-highlighting', icon: icons.clearHighlight, caption: t('Clear Highlighting') },
    { name: 'clear', icon: icons.clear, caption: t('Clear Scrollback') }
  ],
  [
    { name: 'font+', icon: icons.fontUp, caption: t('font+'), shortcut: 'Ctrl+↑' },
    { name: 'font-', icon: icons.fontDown, caption: t('font-'), shortcut: 'Ctrl+↓' }
  ],
  [
    { name: 'upload', icon: icons.upload, caption: t('Upload file'), shortcut: 'rtty -R' },
    { name: 'download', icon: icons.download, caption: t('Download file'), shortcut: 'rtty -S' }
  ],
  [
    { name: 'split-left', icon: icons.splitLeft, caption: t('split-left') },
    { name: 'split-right', icon: icons.splitRight, caption: t('split-right') },
    { name: 'split-up', icon: icons.splitUp, caption: t('split-up') },
    { name: 'split-down', icon: icons.splitDown, caption: t('split-down') },
    { name: 'close', icon: icons.close, caption: t('Close') }
  ],
  [
    { name: 'about', icon: icons.about, caption: t('About') }
  ]
].map(group => group.filter(item => !isSerial.value || !['upload', 'download', 'split-left', 'split-right', 'split-up', 'split-down', 'close'].includes(item.name)))
  .filter(group => group.length)

const showFindBox = ref(false)
const findInput = useTemplateRef('findInput')
const findText = ref('')
const findFlags = ref([])

const openFindBox = () => {
  showFindBox.value = true
  nextTick(() => findInput.value.focus())
}

const onFindBoxKeydown = (e) => {
  if (e.key === 'Escape') {
    showFindBox.value = false
  }
}

watch(() => showFindBox.value, (val) => {
  if (!val) {
    nextTick(() => term?.focus())
  }
})

const fileCtx = reactive({
  modal: false,
  accepted: false,
  file: null,
  downloading: false,
  name: '',
  chunks: []
})

let upload = null
let disposables = []
let socket = null
let term = null
let fitAddon = null
let searchAddon = null
let unack = 0
const showKeyboard = ref(false)
const isConnected = ref(false)
const connecting = ref(false)
const disconnected = ref(false)

const focusTerm = () => {
  if (!showFindBox.value && !fileCtx.modal)
    term?.focus()
}

const showContextmenu = (e) => {
  if (!term) return
  contextmenu.target = [e.clientX, e.clientY]
  contextmenu.visible = true
}

const toggleKeyboard = () => showKeyboard.value = !showKeyboard.value

const hideKeyboard = () => showKeyboard.value = false

const handleKeypress = (keyData) => sendTermData(keyData)

const onContextmenuClick = (name) => {
  if (name === 'copy') {
    const text = term.getSelection()
    if (text)
      copy(text)
  } else if (name === 'paste') {
    pasteFromClipboard()
  } else if (name === 'clear') {
    term.clear()
  } else if (name === 'find') {
    openFindBox()
  } else if (name === 'clear-highlighting') {
    searchAddon.clearDecorations()
    term.clearSelection()
  } else if (name === 'font+') {
    updateFontSize(1)
  } else if (name === 'font-') {
    updateFontSize(-1)
  } else if (name === 'upload') {
    notify.info(t('Please execute command "rtty -R" in current terminal!'))
  } else if (name === 'download') {
    notify.info(t('Please execute command "rtty -S file" in current terminal!'))
  } else if (name === 'split-left') {
    emit('split', props.panelId, 'left')
  } else if (name === 'split-right') {
    emit('split', props.panelId, 'right')
  } else if (name === 'split-up') {
    emit('split', props.panelId, 'up')
  } else if (name === 'split-down') {
    emit('split', props.panelId, 'down')
  } else if (name === 'close') {
    emit('close', props.panelId)
  } else if (name === 'about') {
    window.open('https://github.com/zhaojh329/rtty')
  }
}

const pasteFromClipboard = async() => {
  try {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      notify.info(t('Please use shortcut "Shift+Insert"'))
      return
    }

    const text = await navigator.clipboard.readText()
    if (text)
      sendTermData(text)
  } catch (error) {
    if (error.name === 'NotAllowedError')
      notify.error(t('Clipboard permission denied'))
    else
      notify.info(t('Please use shortcut "Shift+Insert"'))
  }
}

const updateFontSize = (size) => {
  term.options.fontSize += size
  fitAddon.fit()
}

const doFind = (type) => {
  const options = {
    decorations: {
      matchBackground: '#004c6d',
      matchBorder: '#93cdf6',
      matchOverviewRuler: '#93cdf6',
      activeMatchBackground: '#f8bd2a',
      activeMatchBorder: '#f8bd2a',
      activeMatchColorOverviewRuler: '#f8bd2a'
    }
  }

  findFlags.value.forEach(v => {
    options[v] = true
  })

  if (type === 'next')
    searchAddon.findNext(findText.value, options)
  else
    searchAddon.findPrevious(findText.value, options)
}

const resetFileTransfer = () => {
  if (upload) {
    const reader = upload.reader
    upload = null
    reader.onload = null
    reader.onerror = null

    if (reader.readyState === FileReader.LOADING)
      reader.abort()
  }

  fileCtx.accepted = true
  fileCtx.modal = false
  fileCtx.file = null
  fileCtx.downloading = false
  fileCtx.name = ''
  fileCtx.chunks = []
}

const onUploadDialogClosed = () => {
  if (fileCtx.accepted)
    return

  term?.focus()
  resetFileTransfer()

  if (socket?.readyState === WebSocket.OPEN)
    socket.send(JSON.stringify({type: 'fileCanceled'}))
}

const sendFileInfo = (file) => {
  const msg = {type: 'fileInfo', size: file.size, name: file.name}
  socket.send(JSON.stringify(msg))
}

const pumpFileUpload = () => {
  if (!upload || upload.reader.readyState === FileReader.LOADING)
    return

  if (upload.inFlight >= FileWindowSize || upload.offset >= upload.file.size)
    return

  if (socket !== upload.socket || socket.readyState !== WebSocket.OPEN) {
    resetFileTransfer()
    return
  }

  upload.reader.readAsArrayBuffer(upload.file.slice(upload.offset, upload.offset + ReadFileBlkSize))
}

const doUploadFile = () => {
  if (socket?.readyState !== WebSocket.OPEN) {
    resetFileTransfer()
    return
  }

  if (!fileCtx.file) {
    onUploadDialogClosed()
    return
  }

  term.focus()

  if (fileCtx.file.size > 0xffffffff) {
    notify.error(t('The file you will upload is too large(> 4294967295 Byte)'))
    return
  }

  fileCtx.accepted = true
  fileCtx.modal = false

  sendFileInfo(fileCtx.file)

  if (fileCtx.file.size === 0) {
    sendFileData(null)
    return
  }

  const transfer = {
    file: fileCtx.file,
    socket,
    reader: new FileReader(),
    offset: 0,
    inFlight: 0
  }
  upload = transfer

  transfer.reader.onload = () => {
    if (upload !== transfer)
      return

    if (socket !== transfer.socket || socket.readyState !== WebSocket.OPEN) {
      resetFileTransfer()
      return
    }

    const data = new Uint8Array(transfer.reader.result)
    transfer.offset += data.length
    transfer.inFlight++
    sendFileData(data)
    pumpFileUpload()
  }

  transfer.reader.onerror = () => {
    if (upload !== transfer)
      return

    const error = transfer.reader.error
    resetFileTransfer()

    if (socket === transfer.socket && socket.readyState === WebSocket.OPEN)
      socket.send(JSON.stringify({type: 'fileCanceled'}))

    notify.error(error.message)
  }

  pumpFileUpload()
}

const sendTermData = (data) => {
  if (socket?.readyState !== WebSocket.OPEN) return

  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
  const frame = new Uint8Array(bytes.length + 1)
  frame.set(bytes, 1)
  socket.send(frame)
}

const sendFileData = (data) => {
  const frame = new Uint8Array(2 + (data?.length ?? 0))
  frame[0] = 1
  frame[1] = MsgTypeFileData

  if (data)
    frame.set(data, 2)

  socket.send(frame)
}

const fitTerm = () => nextTick(() => fitAddon?.fit())

const closed = () => {
  if (term)
    term.write('\n\n\r\x1B[1;3;31mConnection is closed.\x1B[0m')
  dispose()
  isConnected.value = false
  showKeyboard.value = false
  disconnected.value = true
}

const openTerm = () => {
  term = new Terminal({
    allowProposedApi: true,
    cursorBlink: true,
    cursorStyle: 'bar',
    cursorInactiveStyle: 'none',
    fontSize: 16,
    fontFamily: getComputedStyle(document.documentElement).getPropertyValue('--md-font-mono'),
    theme: terminalTheme
  })

  term.loadAddon(new WebLinksAddon())

  fitAddon = new FitAddon()
  term.loadAddon(fitAddon)

  searchAddon = new SearchAddon()
  term.loadAddon(searchAddon)

  const overlayAddon = isSerial.value ? null : new OverlayAddon()
  if (overlayAddon) term.loadAddon(overlayAddon)

  term.open(terminal.value)
  term.focus()

  disposables.push(term.onData(data => sendTermData(data)))
  disposables.push(term.onBinary(data => sendTermData(isSerial.value ? Uint8Array.from(data, c => c.charCodeAt(0)) : data)))

  if (!isSerial.value) {
    disposables.push(term.onResize(size => {
      const msg = {type: 'winsize', cols: size.cols, rows: size.rows}
      socket.send(JSON.stringify(msg))
      overlayAddon.show(term.cols + ' × ' + term.rows)
    }))
  }

  disposables.push(term.onKey(({ domEvent }) => {
    const e = domEvent
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase()
      if (key === 'f')
        openFindBox()
      else if (key === 'arrowup')
        updateFontSize(1)
      else if (key === 'arrowdown')
        updateFontSize(-1)
    }
  }))

  window.addEventListener('rtty-resize', fitTerm)
  if (isSerial.value) window.addEventListener('resize', fitTerm)
  fitTerm()
  nextTick(() => term.focus())

  isConnected.value = true
}

const dispose = () => {
  disposables.forEach(d => d.dispose())
  disposables = []
  window.removeEventListener('rtty-resize', fitTerm)
  if (isSerial.value) window.removeEventListener('resize', fitTerm)
}

const connect = () => {
  unack = 0
  connecting.value = true
  disconnected.value = false

  const group = route.query.group ?? ''
  const params = isSerial.value
    ? new URLSearchParams({ ...serialSettings, group, mode: 'serial' })
    : new URLSearchParams({ group })
  const protocol = location.protocol === 'https:' ? 'wss://' : 'ws://'
  const ws = new WebSocket(`${protocol}${location.host}/api/connect/${encodeURIComponent(props.devid)}?${params}`)
  ws.binaryType = 'arraybuffer'
  socket = ws

  ws.addEventListener('close', (ev) => {
    if (ws !== socket) return
    connecting.value = false
    resetFileTransfer()

    if (isSerial.value) {
      closed()
      const messages = {
        4000: 'Device offline', 4002: 'Device Response Timeout',
        4003: 'Upgrade client for serial access', 4004: 'Invalid serial settings',
        4101: 'Serial port busy', 4102: 'Serial port not found',
        4103: 'Serial port permission denied', 4104: 'Invalid serial settings',
        4105: 'Unable to open serial port'
      }
      if (ev.code !== 1000 && ev.code !== 1001)
        notify.error(t(messages[ev.code] || 'Connection failed'))
    } else if (ev.code === LoginErrorOffline) {
      router.push('/error/offline')
    } else if (ev.code === LoginErrorBusy) {
      router.push('/error/full')
    } else if (ev.code === LoginErrorTimeout) {
      router.push('/error/timeout')
    } else {
      closed()
    }
  })

  ws.addEventListener('error', () => {
    if (ws !== socket) return
    connecting.value = false

    if (isSerial.value) return

    let href = `/api/connect/${props.devid}`
    if (group)
      href += `?group=${group}`
    window.location.href = href
  })

  ws.addEventListener('message', ev => {
    if (ws !== socket) return
    const data = ev.data

    if (typeof data === 'string') {
      const msg = JSON.parse(data)
      if (msg.type === 'login') {
        connecting.value = false
        openTerm()
      } else if (isSerial.value) {
        return
      } else if (msg.type === 'sendfile') {
        resetFileTransfer()
        fileCtx.downloading = true
        fileCtx.name = msg.name

        socket.send(JSON.stringify({type: 'fileAck'}))
      } else if (msg.type === 'recvfile') {
        resetFileTransfer()
        fileCtx.modal = true
        fileCtx.accepted = false
        term.blur()
      } else if (msg.type === 'fileAck') {
        if (upload && upload.inFlight > 0) {
          upload.inFlight--
          pumpFileUpload()
        }
      }
    } else {
      const data = new Uint8Array(ev.data)

      if (data[0] === 0) {
        unack += data.length - 1
        term.write(data.slice(1))

        if (unack > AckBlkSize || (isSerial.value && unack === AckBlkSize)) {
          const msg = {type: 'ack', ack: unack}
          ws.send(JSON.stringify(msg))
          unack = 0
        }
      } else if (!isSerial.value) {
        if (!fileCtx.downloading) {
          if (data.length === 1)
            resetFileTransfer()
          return
        }

        if (data.length === 1) {
          const blob = new Blob(fileCtx.chunks)
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = fileCtx.name
          document.body.appendChild(a)
          a.click()
          resetFileTransfer()

          setTimeout(() => {
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)
          }, 100)
        } else {
          fileCtx.chunks.push(data.slice(1))
          ws.send(JSON.stringify({type: 'fileAck'}))
        }
      }
    }
  })
}

const reconnect = () => {
  if (term) {
    term.dispose()
    term = null
  }
  connect()
}

onMounted(() => connect())

onUnmounted(() => {
  resetFileTransfer()

  dispose()

  if (term)
    term.dispose()

  if (socket)
    socket.close()
})
</script>

<style scoped>
.terminal-container {
  height: 100%;
  position: relative;
  overflow: hidden;
}

.terminal-theme {
  height: 100%;
  background: rgb(var(--v-theme-surface-container-lowest));
}

.rtty-terminal {
  height: 100%;
}

:deep(.terminal) {
  padding: 8px;
}

:deep(.xterm .xterm-viewport) {
  overflow-y: auto;
}

.term-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgb(var(--v-theme-surface-container-lowest));
  z-index: 5;
}

.term-status {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 6;
}

.floating-keyboard {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 999;
  width: clamp(360px, 85vw, 720px);
}

.keyboard-toggle-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 1000;
  border-radius: 16px !important;
  opacity: 0.85;
  transition: opacity 200ms var(--md-motion-emphasized);
}

.keyboard-toggle-btn:hover {
  opacity: 1;
}

.find-box {
  position: absolute;
  top: 8px;
  right: 16px;
  z-index: 1001;
  padding: 4px 4px 4px 8px;
  display: flex;
  align-items: center;
  gap: 2px;
}

.find-input {
  width: 220px;
}

.find-input :deep(.v-field) {
  border-radius: 8px;
}
</style>
