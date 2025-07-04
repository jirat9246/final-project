import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'

// Default profile image URL
export const defaultProfileImageUrl = null // กำหนดเป็น null เพื่อให้ระบบเข้าใจว่าไม่มีรูปภาพ



// Function to get data from Local Storage
function getLocalStorageItem(key, defaultValue) {
  const storedValue = localStorage.getItem(key)
  return storedValue ? storedValue : defaultValue
}

export const useProfileStore = defineStore('profile', () => {
  const state = reactive({
    uid: '',
    profileImageUrl: null, 
    email: '',
    displayName: '',
    firstName: '',
    lastName: ''
  })

  const profileImage = computed(() => state.profileImageUrl || defaultProfileImageUrl)

  function setUid(uid) {
    state.uid = uid
  }

  function updateProfileData(email, displayName, firstName, lastName) {
    state.email = email
    state.displayName = displayName
    state.firstName = firstName
    state.lastName = lastName
  }

  function updateProfileImage(imageUrl) {
    state.profileImageUrl = imageUrl
  }

  function resetProfileImage() {
    state.profileImageUrl = defaultProfileImageUrl
    localStorage.setItem('profileImageUrl', defaultProfileImageUrl)
  }

  function clearProfileData() {
    state.uid = ''
    state.email = ''
    state.displayName = ''
    state.firstName = ''
    state.lastName = ''
    state.profileImageUrl = defaultProfileImageUrl
    localStorage.setItem('profileImageUrl', defaultProfileImageUrl)
  }

  // Real-time Firestore listener
  function listenToProfileChanges(uid) {
    if (!uid) return
    const userDocRef = doc(db, 'users', uid)

    onSnapshot(userDocRef, (doc) => {
      const data = doc.data()
      if (data) {
        updateProfileImage(data.imageUrl || defaultProfileImageUrl) // ใช้ค่าเริ่มต้นหากไม่มี imageUrl
        if (data.email) state.email = data.email
        if (data.displayName) state.displayName = data.displayName
        if (data.firstName) state.firstName = data.firstName
        if (data.lastName) state.lastName = data.lastName
      }
    })
  }

  return {
    state,
    profileImage,
    setUid,
    updateProfileData,
    updateProfileImage,
    resetProfileImage,
    clearProfileData,
    listenToProfileChanges
  }
})
