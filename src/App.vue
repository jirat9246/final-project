<script setup>
import { RouterView } from 'vue-router'
import { onMounted, ref } from 'vue'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '@/firebase'

</script>

<script>
export default {
  setup() {
    const isLoggedIn = ref(false)
    const userProfileImage = ref('')

    // ตรวจสอบสถานะการเข้าสู่ระบบเมื่อ component ถูก mount
    onMounted(() => {
      const savedLoginStatus = localStorage.getItem('isLoggedIn')
      isLoggedIn.value = savedLoginStatus === 'true'

      onAuthStateChanged(auth, (user) => {
        if (user) {
          isLoggedIn.value = true
          userProfileImage.value = user.photoURL
          localStorage.setItem('isLoggedIn', 'true')
        } else {
          isLoggedIn.value = false
          localStorage.removeItem('isLoggedIn')
        }
      })
    })

    return {
      isLoggedIn,
      userProfileImage
    }
  }
}
</script>

<template>
  
    <Suspense>
      <template #default>
        <div>
          <RouterView />
        </div>
      </template>
      <template #fallback>
        <div>Loading application...</div>
      </template>
    </Suspense>
  
</template>

