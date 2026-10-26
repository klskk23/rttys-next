/* SPDX-License-Identifier: MIT */

import '@fontsource/roboto/latin-400.css'
import '@fontsource/roboto/latin-500.css'
import '@fontsource/roboto/latin-700.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import { md3 } from 'vuetify/blueprints'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { en, zhHans } from 'vuetify/locale'
import { light, dark } from './theme'

export const themeStorageKey = 'rtty-theme'

const storedTheme = () => {
  try {
    return localStorage.getItem(themeStorageKey)
  } catch {
    return null
  }
}

export default createVuetify({
  blueprint: md3,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi }
  },
  locale: {
    locale: 'en',
    fallback: 'en',
    messages: { en, 'zh-CN': zhHans }
  },
  theme: {
    defaultTheme: storedTheme() || 'system',
    themes: {
      light: { dark: false, colors: light },
      dark: { dark: true, colors: dark }
    }
  },
  defaults: {
    VTextField: { variant: 'outlined', density: 'comfortable' },
    VSelect: { variant: 'outlined', density: 'comfortable' },
    VCombobox: { variant: 'outlined', density: 'comfortable' },
    VNumberInput: { variant: 'outlined', density: 'comfortable', controlVariant: 'hidden' },
    VFileInput: { variant: 'outlined', density: 'comfortable' },
    VBtn: { rounded: 'pill', class: 'text-none' },
    VBtnToggle: { rounded: 'pill', variant: 'outlined', divided: true },
    VDialog: {
      scrollable: true,
      VCard: { rounded: 'xl', color: 'surface-container-high', class: 'pa-2' }
    },
    VMenu: {
      VList: { bgColor: 'surface-container', density: 'compact', rounded: 'lg' }
    },
    VTooltip: { location: 'bottom', openDelay: 400 },
    VSnackbar: { color: 'inverse-surface', location: 'bottom center', timeout: 3000 },
    VChip: { rounded: 'lg' },
    VDataTable: { hover: true, density: 'comfortable' }
  }
})
