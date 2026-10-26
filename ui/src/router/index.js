/* SPDX-License-Identifier: MIT */
/*
 * Author: Jianhui Zhao <zhaojh329@gmail.com>
 */

import { createWebHistory, createRouter } from 'vue-router'
import axios from 'axios'

import Login from '../views/Login.vue'
import AppShell from '../layouts/AppShell.vue'
import Devices from '../views/Devices.vue'
import Shares from '../views/Shares.vue'
import Rtty from '../views/Rtty.vue'
import Error from '../views/Error.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/',
    component: AppShell,
    children: [
      {
        path: '',
        name: 'Devices',
        component: Devices,
        meta: { title: 'Devices', icon: 'devices' }
      },
      {
        path: 'shares',
        name: 'Shares',
        component: Shares,
        meta: { title: 'Shares', icon: 'shares' }
      }
    ]
  },
  {
    path: '/rtty/:devid',
    name: 'Rtty',
    component: Rtty,
    props: true
  },
  {
    path: '/serial/:devid',
    name: 'Serial',
    component: Rtty,
    props: route => ({ devid: route.params.devid, mode: 'serial' })
  },
  {
    path: '/error/:err',
    name: 'Error',
    component: Error,
    props: true
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.path !== '/login') {
    axios.get('/api/alive').then(() => {
      next()
    }).catch(() => {
      next({ name: 'Login' })
    })
  } else {
    next()
  }
})

export default router
