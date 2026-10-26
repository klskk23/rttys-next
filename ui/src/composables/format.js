/* SPDX-License-Identifier: MIT */

export const formatDuration = (t) => {
  let s = t || 0
  const d = Math.floor(s / 86400)
  s %= 86400
  const h = Math.floor(s / 3600)
  s %= 3600
  const m = Math.floor(s / 60)
  s %= 60

  const parts = []
  if (d) parts.push(`${d}d`)
  if (d || h) parts.push(`${h}h`)
  if (d || h || m) parts.push(`${m}m`)
  if (!d) parts.push(`${s}s`)
  return parts.join(' ')
}

export const isIPv4 = value => {
  const parts = (value || '').split('.')
  return parts.length === 4 && parts.every(part => /^\d{1,3}$/.test(part) &&
    (part.length === 1 || part[0] !== '0') && Number(part) <= 255)
}
