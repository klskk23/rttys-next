<template>
  <v-app>
    <router-view/>
    <v-snackbar-queue v-model="messages" closable/>
    <v-dialog v-model="confirmState.visible" max-width="360" persistent>
      <v-card :title="confirmState.title" :text="confirmState.text">
        <template #actions>
          <v-spacer/>
          <v-btn variant="text" @click="settleConfirm(false)">{{ $t('Cancel') }}</v-btn>
          <v-btn variant="text" color="error" @click="settleConfirm(true)">{{ confirmState.action }}</v-btn>
        </template>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocale } from 'vuetify'
import { messages, confirmState, settleConfirm } from './composables/notify'

const { t, locale } = useI18n()
const vuetifyLocale = useLocale()

watchEffect(() => {
  vuetifyLocale.current.value = locale.value
  document.documentElement.lang = locale.value
  document.title = t('app.title')
})
</script>
