<script setup>
import { ref } from 'vue'
import { getAuth, updatePassword , confirmPasswordReset  } from 'firebase/auth'
import Toastify from 'toastify-js'
import "toastify-js/src/toastify.css"

const auth = getAuth()
const newPassword = ref('')
const confirmPassword = ref('')
const oobCode = new URLSearchParams(window.location.search).get('oobCode') // รับ oobCode จาก URL
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const toggleNewPasswordVisibility = () => {
  showNewPassword.value = !showNewPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}










const resetPassword = async () => {
  if (!newPassword.value || !confirmPassword.value || !oobCode) {
    showToast('กรุณากรอกรหัสผ่านใหม่และยืนยันรหัสผ่าน', 'error')
    return
  }
  
  if (newPassword.value !== confirmPassword.value) {
    showToast('รหัสผ่านไม่ตรงกัน', 'error')
    return
  }

  try {
    await confirmPasswordReset(auth, oobCode, newPassword.value)
    showToast('รีเซ็ตรหัสผ่านสำเร็จ', 'success')
  } catch (error) {
    console.error('Error resetting password:', error)
    showToast('เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน', 'error')
  }
}



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


</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100">
    <div class="w-full max-w-md bg-white p-10 rounded-3xl shadow-2xl transition-transform transform hover:scale-105">
      <h2 class="text-4xl font-extrabold text-center text-gray-800 mb-4 animate-fade-in">รีเซ็ตรหัสผ่าน</h2>
      <p class="text-center text-gray-500 mb-6 animate-fade-in-delay">กรุณาตั้งรหัสผ่านใหม่ของคุณด้านล่าง</p>

      <!-- New Password Input -->
      <div class="mb-6 relative">
        <label for="newPassword" class="block text-gray-700 font-semibold mb-2">รหัสผ่านใหม่</label>
        <input
          v-model="newPassword"
          :type="showNewPassword ? 'text' : 'password'"
          id="newPassword"
          placeholder="ใส่รหัสผ่านใหม่"
          class="w-full px-4 py-3 rounded-lg border border-gray-300 shadow focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-200"
        />
        <button
          type="button"
          @click="toggleNewPasswordVisibility"
          class="absolute right-4 top-10 text-gray-500 hover:text-indigo-500 transition-all duration-200"
        >
          <font-awesome-icon :icon="showNewPassword ? 'eye-slash' : 'eye'" />
        </button>
      </div>

      <!-- Confirm Password Input -->
      <div class="mb-6 relative">
        <label for="confirmPassword" class="block text-gray-700 font-semibold mb-2">ยืนยันรหัสผ่านใหม่</label>
        <input
          v-model="confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          id="confirmPassword"
          placeholder="ยืนยันรหัสผ่านใหม่"
          class="w-full px-4 py-3 rounded-lg border border-gray-300 shadow focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-200"
        />
        <button
          type="button"
          @click="toggleConfirmPasswordVisibility"
          class="absolute right-4 top-10 text-gray-500 hover:text-indigo-500 transition-all duration-200"
        >
          <font-awesome-icon :icon="showConfirmPassword ? 'eye-slash' : 'eye'" />
        </button>
      </div>

      <!-- Save Button -->
      <button
        @click="resetPassword"
        class="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-2xl hover:bg-indigo-600 transition-all duration-300 transform hover:scale-105"
      >
        บันทึกรหัสผ่าน
      </button>
    </div>
  </div>


</template>

<style scoped>
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fade-in 0.8s ease-out;
}

.animate-fade-in-delay {
  animation: fade-in 0.8s ease-out 0.3s;
  animation-fill-mode: both;
}
</style>
