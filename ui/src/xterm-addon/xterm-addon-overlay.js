export default class {
  constructor() {
    this.terminal = null
    this.overlayNode = document.createElement('div')
    this.overlayNode.style.cssText = `
      border-radius: 8px;
      font: 500 1.375rem/1.75rem Roboto, sans-serif;
      padding: 8px 16px;
      position: absolute;
      z-index: 10;
      pointer-events: none;
      user-select: none;
      transition: opacity 180ms ease-in;`
    this.overlayNode.style.color = 'rgb(var(--v-theme-on-inverse-surface))'
    this.overlayNode.style.backgroundColor = 'rgb(var(--v-theme-inverse-surface))'
    this.overlayNode.style.opacity = '0.9'
  }

  activate(terminal) {
    this.terminal = terminal
  }

  dispose() {
    this.terminal = null
    return
  }

  show(msg, timeout) {
    const {terminal, overlayNode} = this

    if (!terminal || !terminal.element)
      return

    overlayNode.style.opacity = '0.9'
    overlayNode.textContent = msg

    if (!overlayNode.parentNode)
      terminal.element.appendChild(overlayNode)

    const divSize = terminal.element.getBoundingClientRect()
    const overlaySize = overlayNode.getBoundingClientRect()

    overlayNode.style.top = (divSize.height - overlaySize.height) / 2 + 'px'
    overlayNode.style.left = (divSize.width - overlaySize.width) / 2 + 'px'

    if (this.timeout)
      clearTimeout(this.timeout)

    this.timeout = setTimeout(() => {
      overlayNode.style.opacity = '0'

      this.timeout = setTimeout(() => {
        if (overlayNode.parentNode)
          overlayNode.parentNode.removeChild(overlayNode)

        overlayNode.style.opacity = '0.9'
        this.timeout = undefined
      }, 200)
    }, timeout || 1500)
  }
}
