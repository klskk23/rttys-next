/* SPDX-License-Identifier: MIT */
/*
 * Author: Jianhui Zhao <zhaojh329@gmail.com>
 */

import { createI18n } from 'vue-i18n'
import en from './en.json'
import zhCN from './zh-CN.json'

export const localeStorageKey = 'rtty-locale'

export const locales = [
  { value: 'en', title: 'English' },
  { value: 'zh-CN', title: '简体中文' }
]

const initialLocale = () => {
  try {
    const stored = localStorage.getItem(localeStorageKey)
    if (locales.some(l => l.value === stored))
      return stored
  } catch {
    // storage unavailable
  }
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
}

const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'en',
  missingWarn: false,
  fallbackWarn: false,
  messages: {
    en,
    'zh-CN': zhCN
  }
})

export default i18n
