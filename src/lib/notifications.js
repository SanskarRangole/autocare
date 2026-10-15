/**
 * Browser Local Notifications & Retention Helper
 * Prioritizes user privacy, zero spam, and explicit user permission.
 */

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

export function notifyVehicleDeadline(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return
  }

  // Throttle to avoid repeated notifications on the same day
  const todayKey = `notified_${new Date().toISOString().split('T')[0]}_${title}`
  if (localStorage.getItem(todayKey)) {
    return
  }

  try {
    const notification = new Notification(`AutoCare: ${title}`, {
      body,
      icon: '/autocare-logo.jpg',
      badge: '/autocare-logo.jpg',
    })

    localStorage.setItem(todayKey, 'true')

    notification.onclick = () => {
      window.focus()
      notification.close()
    }
  } catch (e) {
    console.warn('Could not trigger browser notification:', e)
  }
}
