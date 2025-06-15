import { useTimeAgo } from '@vueuse/core'

/**
 * Format a date to a human-readable string
 * @param date The date to format
 * @param ago - Whether to use "time ago" formatting.
 */
export const formatDate = (date?: Date | string | number, ago?: boolean) => {
  if (!date) return ''
  date = new Date(date)
  if (ago) {
    return useTimeAgo(date)
  } else {
    return new Intl.DateTimeFormat('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date))
  }
}
