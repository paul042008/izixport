// src/hooks/usePushNotifications.ts
import { useEffect, useState } from 'react'

/**
 * Returns a function to request notification permission and
 * a boolean `isGranted` that reflects the current state.
 *
 * No backend push server required — this uses the built‑in
 * Notification API for immediate alerts.
 */
export function usePushNotifications() {
  const [isGranted, setIsGranted] = useState(false)

  // Sync with current permission on mount
  useEffect(() => {
    if (!('Notification' in window)) return
    setIsGranted(Notification.permission === 'granted')
  }, [])

  /** Call this to ask the user for notification permission */
  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notifications')
      return false
    }

    // Already granted
    if (Notification.permission === 'granted') {
      setIsGranted(true)
      return true
    }

    // If denied, we can't do anything
    if (Notification.permission === 'denied') {
      console.warn('Notifications are blocked')
      return false
    }

    const result = await Notification.requestPermission()
    const granted = result === 'granted'
    setIsGranted(granted)
    return granted
  }

  /**
   * Show a simple desktop notification (no service worker needed).
   * Does nothing if permission isn't granted.
   */
  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return
    new Notification(title, {
      icon: '/logo-192.png',  // optional – place a 192x192 icon in /public
      badge: '/badge-72.png', // optional – small monochrome icon for mobile
      ...options,
    })
  }

  return { requestPermission, showNotification, isGranted }
}