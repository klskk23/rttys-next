/* SPDX-License-Identifier: MIT */

import { computed } from 'vue'
import { useTheme } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { themeStorageKey } from '../plugins/vuetify'
import { localeStorageKey } from '../i18n'

const store = (key, value) => {
  try {
    localStorage.setItem(key, value)
  } catch {
    // storage unavailable
  }
}

export const usePreferences = () => {
  const theme = useTheme()
  const { locale } = useI18n()

  const isDark = computed(() => theme.global.current.value.dark)

  const toggleTheme = () => {
    const next = isDark.value ? 'light' : 'dark'
    theme.change(next)
    store(themeStorageKey, next)
  }

  const setLocale = (value) => {
    locale.value = value
    store(localeStorageKey, value)
  }

  return { isDark, toggleTheme, locale, setLocale }
}
