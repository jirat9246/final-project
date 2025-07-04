import { defineStore } from 'pinia'
import { db } from '@/firebase'
import { collection, query, onSnapshot } from 'firebase/firestore'

const notificationSound = new Audio('/src/assets/sound/livechat-129007.mp3') // เส้นทางไฟล์เสียงที่ถูกต้อง

const playNotificationSound = () => {
  if (notificationSound.readyState >= 2) {
    notificationSound.currentTime = 0
    notificationSound.play().catch(error => {
      console.error('Error playing notification sound:', error)
    })
  } else {
    console.warn('Sound file not ready or not found')
  }
}


// ฟังก์ชันการแสดงการแจ้งเตือนแบบ Toastify
const showToast = (message, type) => {
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: "top",
    position: "right",
    style: {
      background: type === 'success' ? "linear-gradient(to right, #00b09b, #96c93d)" : "linear-gradient(to right, #f44336, #ff5722)"
    }
  }).showToast()
}


export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: []
  }),
  actions: {
    addNotification(notification) {
      // ตรวจสอบการซ้ำของการแจ้งเตือน
      const isDuplicate = this.notifications.some(
        (n) => n.message === notification.message && n.postId === notification.postId
      )
      if (isDuplicate) return
      
      // เพิ่มการแจ้งเตือนใหม่ใน state
      this.notifications.push(notification)
      this.updateLocalStorage()

      // เล่นเสียงเมื่อมีการโต้ตอบจากผู้ใช้
      playNotificationSound()
    },
    removeNotification(index) {
      this.notifications.splice(index, 1)
      this.updateLocalStorage()
    },
    clearNotifications() {
      this.notifications = []
      this.updateLocalStorage()
    },
    updateLocalStorage() {
      localStorage.setItem('notifications', JSON.stringify(this.notifications))
    },
    loadNotificationsFromStorage() {
      const storedNotifications = JSON.parse(localStorage.getItem('notifications'))
      if (storedNotifications) {
        this.notifications = storedNotifications
      }
    },
    listenToComments(postId) {
      const commentsRef = collection(db, 'jobPosts', postId, 'comments')
      const q = query(commentsRef)

      // ฟังการเปลี่ยนแปลงของคอมเมนต์ใน Firestore แบบเรียลไทม์
      onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const comment = change.doc.data()
            this.addNotification({
              postId,
              message: `มีคอมเมนต์ใหม่: ${comment.text}`,
              time: new Date().toLocaleString()
            })
          }
        })
      })
    }
  }
})
