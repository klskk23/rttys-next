<template>
  <div class="keyboard-area"
    @mousedown="startDrag" @mousemove="onDrag" @mouseup="stopDrag" @mouseleave="stopDrag"
    @touchstart="startDrag" @touchmove="onDrag" @touchend="stopDrag">
    <div class="drag-handle">
      <span class="handle-bar"></span>
      <v-btn :icon="icons.close" variant="text" size="small" density="comfortable" class="close-btn"
        :aria-label="$t('Close')" @click="closeKeyboard" @mousedown.stop @touchstart.stop/>
    </div>
    <div ref="simple-keyboard" class="simple-keyboard"></div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, useTemplateRef } from 'vue'
import Keyboard from 'simple-keyboard'
import 'simple-keyboard/build/css/index.css'
import * as icons from '../icons'

const emit = defineEmits(['keypress', 'close'])

const simpleKeyboard = useTemplateRef('simple-keyboard')

let keyboard = null
const shiftPressed = ref(false)
const ctrlPressed = ref(false)
const altPressed = ref(false)
const capsLockPressed = ref(false)

const isDragging = ref(false)
const dragStart = reactive({ x: 0, y: 0 })
const keyboardPosition = reactive({ x: 0, y: 0 })
const initKeyboard = () => {
  keyboard = new Keyboard(simpleKeyboard.value, {
    onKeyPress: button => onKeyPress(button),
    layoutName: 'default',
    layout: {
      default: [
        '{escape} ` 1 2 3 4 5 6 7 8 9 0 - = {backspace}',
        '{tab} q w e r t y u i o p [ ]',
        '{capslock} a s d f g h j k l ; \'',
        '{shift} z x c v b n m , . / \\',
        '{ctrl} {alt} {space} {enter}'
      ],
      shift: [
        '{escape} ~ ! @ # $ % ^ & * ( ) _ + {backspace}',
        '{tab} Q W E R T Y U I O P { }',
        '{capslock} A S D F G H J K L : "',
        '{shift} Z X C V B N M < > ? |',
        '{ctrl} {alt} {space} {enter}'
      ],
      capslock: [
        '{escape} ` 1 2 3 4 5 6 7 8 9 0 - = {backspace}',
        '{tab} Q W E R T Y U I O P [ ]',
        '{capslock} A S D F G H J K L ; \'',
        '{shift} Z X C V B N M , . / \\',
        '{ctrl} {alt} {space} {enter}'
      ]
    },
    display: {
      '{escape}': 'Esc',
      '{backspace}': '⌫',
      '{enter}': '↵',
      '{shift}': '⇧',
      '{tab}': '⇥',
      '{space}': '␣',
      '{capslock}': '⇪',
      '{ctrl}': 'Ctrl',
      '{alt}': 'Alt'
    },
    buttonTheme: [
      {
        class: 'hg-function',
        buttons: '{escape} {backspace} {enter} {shift} {tab} {capslock} {ctrl} {alt}'
      }
    ],
    mergeDisplay: true,
    syncInstanceInputs: true,
    physicalKeyboardHighlight: true,
    physicalKeyboardHighlightTextColor: 'rgb(var(--v-theme-on-primary))',
    physicalKeyboardHighlightBgColor: 'rgb(var(--v-theme-primary))'
  })
}

const onKeyPress = (button) => {
  if (button === '{shift}') {
    shiftPressed.value = !shiftPressed.value
    updateKeyboardLayout()
    updateModifierKeyStyles()
    return
  }

  if (button === '{ctrl}') {
    ctrlPressed.value = !ctrlPressed.value
    updateModifierKeyStyles()
    return
  }

  if (button === '{alt}') {
    altPressed.value = !altPressed.value
    updateModifierKeyStyles()
    return
  }

  if (button === '{capslock}') {
    capsLockPressed.value = !capsLockPressed.value
    updateKeyboardLayout()
    updateModifierKeyStyles()
    return
  }
  const specialKeys = {
    '{enter}': '\r',
    '{space}': ' ',
    '{tab}': '\t',
    '{backspace}': '\x7f',
    '{escape}': '\x1b',
    '{arrowup}': '\x1b[A',
    '{arrowdown}': '\x1b[B',
    '{arrowleft}': '\x1b[D',
    '{arrowright}': '\x1b[C',
    '{home}': '\x1b[H',
    '{end}': '\x1b[F',
    '{pageup}': '\x1b[5~',
    '{pagedown}': '\x1b[6~',
    '{insert}': '\x1b[2~'
  }

  let keyToSend = ''

  if (specialKeys[button]) {
    keyToSend = specialKeys[button]
  } else if (button.length === 1) {
    keyToSend = button

    if (ctrlPressed.value) {
      const char = button.toLowerCase()
      if (char >= 'a' && char <= 'z') {
        const ctrlCode = char.charCodeAt(0) - 96
        keyToSend = String.fromCharCode(ctrlCode)
      } else {
        const ctrlMap = {
          '[': '\x1b', // Ctrl+[
          ']': '\x1d', // Ctrl+]
          '\\': '\x1c', // Ctrl+\
          '/': '\x1f', // Ctrl+/
          ' ': '\x00' // Ctrl+Space
        }
        if (ctrlMap[char]) {
          keyToSend = ctrlMap[char]
        }
      }
    } else if (altPressed.value) {
      keyToSend = '\x1b' + button
    }
  } else {
    return
  }

  emit('keypress', keyToSend)

  ctrlPressed.value = false
  altPressed.value = false
  updateModifierKeyStyles()
}

const updateKeyboardLayout = () => {
  if (keyboard) {
    let layoutName = 'default'

    if (shiftPressed.value && capsLockPressed.value) {
      layoutName = 'shift'
    } else if (shiftPressed.value) {
      layoutName = 'shift'
    } else if (capsLockPressed.value) {
      layoutName = 'capslock'
    }

    keyboard.setOptions({
      layoutName: layoutName
    })
  }
}

const updateModifierKeyStyles = () => {
  if (!keyboard) return

  const shiftButtons = keyboard.getButtonElement('{shift}')
  const ctrlButtons = keyboard.getButtonElement('{ctrl}')
  const altButtons = keyboard.getButtonElement('{alt}')
  const capsLockButtons = keyboard.getButtonElement('{capslock}')

  if (shiftButtons) {
    const buttons = Array.isArray(shiftButtons) ? shiftButtons : [shiftButtons]
    buttons.forEach(btn => {
      if (shiftPressed.value) {
        btn.classList.add('hg-shiftActive')
        btn.classList.remove('hg-activeButton')
      } else {
        btn.classList.remove('hg-shiftActive')
      }
    })
  }

  if (ctrlButtons) {
    const buttons = Array.isArray(ctrlButtons) ? ctrlButtons : [ctrlButtons]
    buttons.forEach(btn => {
      if (ctrlPressed.value) {
        btn.classList.add('hg-ctrlActive')
        btn.classList.remove('hg-activeButton')
      } else {
        btn.classList.remove('hg-ctrlActive')
      }
    })
  }

  if (altButtons) {
    const buttons = Array.isArray(altButtons) ? altButtons : [altButtons]
    buttons.forEach(btn => {
      if (altPressed.value) {
        btn.classList.add('hg-altActive')
        btn.classList.remove('hg-activeButton')
      } else {
        btn.classList.remove('hg-altActive')
      }
    })
  }

  if (capsLockButtons) {
    const buttons = Array.isArray(capsLockButtons) ? capsLockButtons : [capsLockButtons]
    buttons.forEach(btn => {
      if (capsLockPressed.value) {
        btn.classList.add('hg-capslockActive')
        btn.classList.remove('hg-activeButton')
      } else {
        btn.classList.remove('hg-capslockActive')
      }
    })
  }
}

const destroyKeyboard = () => {
  if (keyboard) {
    keyboard.destroy()
    keyboard = null
  }
}

const getEventPosition = (e) => {
  if (e.type.startsWith('touch')) {
    const touch = e.touches[0] || e.changedTouches[0]
    return { x: touch.clientX, y: touch.clientY }
  } else {
    return { x: e.clientX, y: e.clientY }
  }
}

const startDrag = (e) => {
  const target = e.target.closest ? e.target.closest('.drag-handle') : null
  if (target) {
    const keyboardEl = e.currentTarget

    isDragging.value = true

    if (keyboardPosition.x === 0 && keyboardPosition.y === 0) {
      const rect = keyboardEl.getBoundingClientRect()
      const parentRect = keyboardEl.parentElement.getBoundingClientRect()
      keyboardPosition.x = rect.left - parentRect.left
      keyboardPosition.y = rect.top - parentRect.top
      keyboardEl.style.left = keyboardPosition.x + 'px'
      keyboardEl.style.top = keyboardPosition.y + 'px'
      keyboardEl.style.bottom = 'auto'
      keyboardEl.style.transform = 'none'
    }

    const pos = getEventPosition(e)
    dragStart.x = pos.x - keyboardPosition.x
    dragStart.y = pos.y - keyboardPosition.y
    e.preventDefault && e.preventDefault()
  }
}

const onDrag = (e) => {
  if (isDragging.value) {
    const pos = getEventPosition(e)
    keyboardPosition.x = pos.x - dragStart.x
    keyboardPosition.y = pos.y - dragStart.y
    const keyboardEl = e.currentTarget
    keyboardEl.style.left = keyboardPosition.x + 'px'
    keyboardEl.style.top = keyboardPosition.y + 'px'
    e.preventDefault && e.preventDefault()
  }
}

const stopDrag = () => isDragging.value = false

const closeKeyboard = () => emit('close')

onMounted(() => initKeyboard())
onUnmounted(() => destroyKeyboard())
</script>

<style scoped>
.keyboard-area {
  background: rgb(var(--v-theme-surface-container-high));
  color: rgb(var(--v-theme-on-surface));
  border-radius: 16px;
  width: 100%;
  box-shadow: 0 4px 8px 3px rgba(0, 0, 0, 0.15), 0 1px 3px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  padding: 0 8px 8px;
}

.drag-handle {
  position: relative;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: move;
  user-select: none;
  touch-action: none;
}

.handle-bar {
  width: 32px;
  height: 4px;
  border-radius: 2px;
  background: rgb(var(--v-theme-on-surface-variant));
  opacity: 0.4;
}

.close-btn {
  position: absolute;
  right: 0;
  top: 0;
}

.simple-keyboard {
  margin: 0;
  padding: 0;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  width: 100%;
  font-family: Roboto, sans-serif;
}

:deep(.simple-keyboard .hg-button) {
  background: rgb(var(--v-theme-surface-container-highest));
  color: rgb(var(--v-theme-on-surface));
  border: none;
  border-bottom: none;
  box-shadow: none;
  border-radius: 8px;
  font-weight: 500;
  font-size: clamp(0.875rem, 2.2vw, 1.25rem);
  min-height: clamp(32px, 4vw, 44px);
  transition: background-color 100ms var(--md-motion-emphasized);
}

:deep(.simple-keyboard .hg-button:hover) {
  background: rgba(var(--v-theme-on-surface), 0.12);
}

:deep(.simple-keyboard .hg-button:active) {
  background: rgba(var(--v-theme-on-surface), 0.16);
}

:deep(.simple-keyboard .hg-function) {
  background: rgb(var(--v-theme-secondary-container));
  color: rgb(var(--v-theme-on-secondary-container));
}

:deep(.simple-keyboard .hg-shiftActive),
:deep(.simple-keyboard .hg-capslockActive),
:deep(.simple-keyboard .hg-ctrlActive),
:deep(.simple-keyboard .hg-altActive) {
  background: rgb(var(--v-theme-primary)) !important;
  color: rgb(var(--v-theme-on-primary)) !important;
}
</style>
