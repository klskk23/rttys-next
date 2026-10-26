<template>
  <v-main class="bg-surface-container">
    <div class="login">
      <v-card class="login-card" color="surface-container-lowest" rounded="xl" flat>
        <div class="login-brand">
          <v-avatar color="primary-container" rounded="lg" size="56">
            <v-icon :icon="icons.terminal" size="28"/>
          </v-avatar>
          <h1 class="text-headline-small">RTTY</h1>
        </div>
        <v-form @submit.prevent="handleSubmit">
          <v-text-field v-model="password" autofocus :type="reveal ? 'text' : 'password'"
            :label="$t('Password')" :prepend-inner-icon="icons.lock"
            :append-inner-icon="reveal ? icons.eyeOff : icons.eye" @click:append-inner="reveal = !reveal"
            :error-messages="failed ? $t('Wrong password') : ''" @update:model-value="failed = false"
            autocomplete="current-password"/>
          <v-btn type="submit" color="primary" size="large" block :loading="loading" class="mt-2">{{ $t('Sign in') }}</v-btn>
        </v-form>
      </v-card>
    </div>
  </v-main>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import * as icons from '../icons'

const router = useRouter()

const loading = ref(false)
const reveal = ref(false)
const failed = ref(false)
const password = ref('')

const handleSubmit = () => {
  loading.value = true
  axios.post('/api/signin', { password: password.value }).then(() => {
    router.push('/')
  }).catch(() => {
    failed.value = true
  }).finally(() => {
    loading.value = false
  })
}
</script>

<style scoped>
.login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 40px 32px 32px;
}

.login-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
}

.login-brand h1 {
  margin: 0;
  letter-spacing: 0.08em;
}
</style>
