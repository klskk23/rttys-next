<template>
  <v-navigation-drawer v-if="!mobile" permanent :width="88" color="surface" border="0" class="rail">
    <div class="rail-logo">
      <v-avatar color="primary-container" rounded="lg" size="48">
        <v-icon :icon="icons.terminal"/>
      </v-avatar>
    </div>
    <nav class="rail-items">
      <router-link v-for="item in nav" :key="item.name" :to="{ name: item.name }" class="rail-item" :class="{ active: route.name === item.name }">
        <span class="rail-indicator"><v-icon :icon="item.icon"/></span>
        <span class="text-label-medium">{{ $t(item.title) }}</span>
      </router-link>
    </nav>
  </v-navigation-drawer>

  <v-app-bar color="surface" flat height="64">
    <v-app-bar-title class="text-title-large">{{ $t(route.meta.title) }}</v-app-bar-title>
    <template #append>
      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" :icon="icons.language" variant="text" :aria-label="$t('Language')"/>
        </template>
        <v-list :selected="[locale]" @update:selected="v => setLocale(v[0])" mandatory>
          <v-list-item v-for="l in locales" :key="l.value" :value="l.value" :title="l.title"/>
        </v-list>
      </v-menu>
      <v-tooltip :text="$t(isDark ? 'Light theme' : 'Dark theme')">
        <template #activator="{ props }">
          <v-btn v-bind="props" :icon="isDark ? icons.lightMode : icons.darkMode" variant="text" @click="toggleTheme"/>
        </template>
      </v-tooltip>
      <v-tooltip :text="$t('Sign out')">
        <template #activator="{ props }">
          <v-btn v-bind="props" :icon="icons.logout" variant="text" @click="signOut"/>
        </template>
      </v-tooltip>
    </template>
  </v-app-bar>

  <v-main class="bg-surface">
    <router-view v-slot="{ Component }">
      <keep-alive include="Devices">
        <component :is="Component"/>
      </keep-alive>
    </router-view>
  </v-main>

  <v-footer v-if="mobile" app color="surface-container" height="80" class="nav-bar">
    <router-link v-for="item in nav" :key="item.name" :to="{ name: item.name }" class="rail-item" :class="{ active: route.name === item.name }">
      <span class="rail-indicator"><v-icon :icon="item.icon"/></span>
      <span class="text-label-medium">{{ $t(item.title) }}</span>
    </router-link>
  </v-footer>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import axios from 'axios'
import * as icons from '../icons'
import { locales } from '../i18n'
import { usePreferences } from '../composables/preferences'

const route = useRoute()
const router = useRouter()
const { smAndDown: mobile } = useDisplay()
const { isDark, toggleTheme, locale, setLocale } = usePreferences()

const nav = computed(() => router.getRoutes()
  .filter(r => r.meta?.icon)
  .map(r => ({ name: r.name, title: r.meta.title, icon: icons[r.meta.icon] })))

const signOut = () => axios.get('/api/signout').finally(() => router.push('/login'))
</script>

<style scoped>
.rail :deep(.v-navigation-drawer__content) {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 8px;
}

.rail-logo {
  height: 64px;
  display: flex;
  align-items: center;
  margin-bottom: 24px;
}

.rail-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.nav-bar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 12px 0 16px;
}

.nav-bar .rail-item {
  flex: 1;
}

.rail-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 80px;
  color: rgb(var(--v-theme-on-surface-variant));
  text-decoration: none;
}

.rail-indicator {
  width: 56px;
  height: 32px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 200ms var(--md-motion-emphasized);
}

.rail-item:hover .rail-indicator {
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.rail-item.active {
  color: rgb(var(--v-theme-on-surface));
}

.rail-item.active .rail-indicator {
  background: rgb(var(--v-theme-secondary-container));
  color: rgb(var(--v-theme-on-secondary-container));
}

.rail-item.active .text-label-medium {
  font-weight: 700;
}
</style>
