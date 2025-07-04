
<script setup>
import UserLayout from '/src/components/layouts/UserLayout.vue'
import { ref, onMounted } from 'vue'
import { useProfileStore } from '@/stores/user/profileStore'
import { useAccountStore } from '@/stores/account'
import { getDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/firebase'
import { getAuth } from 'firebase/auth'
import Toastify from 'toastify-js'



const store = useProfileStore()
const accountStore = useAccountStore()

// สถานะสำหรับจัดการโปรไฟล์
const newProfileImageUrl = ref(null)
const defaultImageUrl = null
const profileImageUrl = ref(store.profileImageUrl || defaultImageUrl)
const email = ref(store.email)
const displayName = ref(store.displayName || '')
const firstName = ref(store.firstName || '')
const lastName = ref(store.lastName || '')
const uploadedImage = ref(null)

// ฟังก์ชันการอัปโหลดไฟล์
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      newProfileImageUrl.value = e.target.result // เก็บรูปภาพใหม่ในตัวแปรชั่วคราว
      profileImageUrl.value = newProfileImageUrl.value // แสดงรูปภาพใหม่ทันที
    }
    reader.readAsDataURL(file)
  }
}


// ฟังก์ชันอัปเดตรูปโปรไฟล์ใน Firestore
async function updateProfileImageInFirestore(imageUrl) {
  try {
    const userDocRef = doc(db, 'users', store.state.uid)
    await updateDoc(userDocRef, { imageUrl })
    alert('Profile image updated successfully!')
  } catch (error) {
    console.error('Error updating profile image:', error)
  }
}


// ฟังก์ชันอัปเดตโปรไฟล์ใน Firestore
const updateProfile = async () => {
  if (!store.state.uid) {
    Toastify({ text: 'UID ไม่ถูกต้องหรือว่างเปล่า', style: { background: 'red' } }).showToast()
    return
  }

  const updatedFirstName = firstName.value || ''
  const updatedLastName = lastName.value || ''

  try {
    const userDocRef = doc(db, 'users', store.state.uid)
    const updatedData = {
      displayName: displayName.value || '',
      firstName: updatedFirstName,
      lastName: updatedLastName,
      imageUrl: newProfileImageUrl.value || profileImageUrl.value || defaultImageUrl
    }

    await updateDoc(userDocRef, updatedData)

    // โหลดข้อมูลใหม่จาก Firestore เพื่ออัปเดต store
    const userSnapshot = await getDoc(userDocRef)
    if (userSnapshot.exists()) {
      const userData = userSnapshot.data()
      store.updateProfileData(
        userData.email || '',
        userData.displayName || '',
        userData.firstName || '',
        userData.lastName || ''
      )
      profileImageUrl.value = userData.imageUrl || defaultImageUrl
      email.value = userData.email || ''
      displayName.value = userData.displayName || ''
      firstName.value = userData.firstName || ''
      lastName.value = userData.lastName || ''

      Toastify({ text: 'อัปเดตโปรไฟล์สำเร็จ', style: { background: 'green' } }).showToast()
    }
    newProfileImageUrl.value = null
  } catch (error) {
    console.error('Error updating profile:', error)
    Toastify({ text: 'เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์', style: { background: 'red' } }).showToast()
  }
}




// โหลดข้อมูลโปรไฟล์เมื่อ component ถูก mount
onMounted(async () => {
  const auth = getAuth()
  const user = auth.currentUser

  if (user && user.uid) {
    store.setUid(user.uid)

    // ดึงข้อมูลโปรไฟล์จาก Firestore
    try {
      const userDocRef = doc(db, 'users', user.uid)
      const userSnapshot = await getDoc(userDocRef)

      if (userSnapshot.exists()) {
        const userData = userSnapshot.data()

        // อัปเดตข้อมูลใน store สำหรับฟิลด์พื้นฐาน
        store.updateProfileData(
          userData.email || '',
          userData.displayName || '',
          userData.firstName || '',
          userData.lastName || ''
        )

        profileImageUrl.value = userData.imageUrl || defaultImageUrl
        email.value = userData.email || ''
        displayName.value = userData.displayName || ''
        firstName.value = userData.firstName || ''
        lastName.value = userData.lastName || ''

        // ตรวจสอบว่า role เป็น "guide" หรือไม่
        if (userData.role === 'guide') {
          // ดึงข้อมูลจาก guideApplications collection สำหรับ firstName และ lastName
          const guideApplicationRef = doc(db, 'guideApplications', user.uid)
          const guideApplicationSnapshot = await getDoc(guideApplicationRef)

          if (guideApplicationSnapshot.exists()) {
            const guideData = guideApplicationSnapshot.data()
            // อัปเดต firstName และ lastName จาก guideApplications
            firstName.value = guideData.firstName || firstName.value
            lastName.value = guideData.lastName || lastName.value
          } else {
            console.error('ไม่พบข้อมูลใน guideApplications')
          }
        }
      } else {
        console.error('ไม่พบข้อมูลใน Firestore')
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  } else {
    console.error('User not authenticated')
  }
})



</script>


<template>
  <UserLayout>

    <div class="flex justify-between space-x-8 py-8 px-4">

<!-- ส่วนศูนย์กลางบัญชี -->
<div class="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 border border-gray-200 shadow-2xl rounded-3xl w-full md:w-1/3 p-10 space-y-8 transform hover:shadow-2xl transition duration-500 ease-in-out hover:scale-105">
  <h2 class="text-4xl font-bold text-gray-800 text-center mb-8">ศูนย์กลางบัญชี</h2>
  <ul class="space-y-6 text-lg">
    <li>
      <router-link 
        to="/profile" 
        class="flex items-center justify-between text-blue-600 hover:text-white py-3 px-6 bg-blue-500 bg-opacity-20 hover:bg-blue-500 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105">
        ข้อมูลบัญชี
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 hover:text-white transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </router-link>
    </li>
    <li>
      <router-link 
        to="/contactinfo" 
        class="flex items-center justify-between text-purple-600 hover:text-white py-3 px-6 bg-purple-500 bg-opacity-20 hover:bg-purple-500 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105">
        ข้อมูลติดต่อ
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600 hover:text-white transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </router-link>
    </li>
    <li>
      <router-link 
        to="/idcardinfo" 
        class="flex items-center justify-between text-pink-600 hover:text-white py-3 px-6 bg-pink-500 bg-opacity-20 hover:bg-pink-500 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105">
        ข้อมูลบัตรประชาชน
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-pink-600 hover:text-white transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </router-link>
    </li>
    <li>
      <router-link 
        to="/guidecardinfo" 
        class="flex items-center justify-between text-yellow-600 hover:text-white py-3 px-6 bg-yellow-500 bg-opacity-20 hover:bg-yellow-500 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105">
        ข้อมูลบัตรมัคคุเทศก์
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-600 hover:text-white transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </router-link>
    </li>
    <li>
      <router-link 
        to="/bankinfo" 
        class="flex items-center justify-between text-green-600 hover:text-white py-3 px-6 bg-green-500 bg-opacity-20 hover:bg-green-500 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105">
        ข้อมูลธนาคาร
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-600 hover:text-white transition-all duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </router-link>
    </li>
  </ul>
</div>

<!-- ส่วนโปรไฟล์ของคุณ -->
<div class="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 border border-gray-300 shadow-2xl rounded-3xl w-full md:w-2/3 p-8 space-y-8">
  <h2 class="text-3xl font-bold text-gray-800 text-center mb-6">โปรไฟล์ของคุณ</h2>

  <!-- รูปโปรไฟล์และการอัปโหลด -->
  <div class="flex flex-col items-center mb-6">
    <div class="avatar mb-4">
      <div class="w-32 h-32 rounded-full ring ring-indigo-500 ring-offset-2 shadow-lg flex items-center justify-center bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 overflow-hidden">
        <template v-if="profileImageUrl">
          <img :src="profileImageUrl" alt="รูปโปรไฟล์" class="rounded-full w-full h-full object-cover border border-gray-300" />
        </template>
        <template v-else>
          <font-awesome-icon :icon="['far', 'user']" class="text-gray-500" style="font-size: 10rem; width: 100%; height: 85%;" />
        </template>
      </div>
    </div>
    <label class="btn btn-sm mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold">
      เลือกไฟล์
      <input type="file" @change="handleFileUpload" class="hidden" />
    </label>
  </div>

  <!-- ฟอร์มโปรไฟล์ -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold text-gray-700">อีเมล</span>
      </label>
      <input v-model="email" type="email" class="input input-bordered rounded-2xl bg-white" readonly />
    </div>
    <!-- ช่องใส่ชื่อแสดงผล -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold text-gray-700">ชื่อที่แสดง</span>
      </label>
      <input v-model="displayName" type="text" class="input input-bordered rounded-2xl bg-white" />
    </div>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
    <!-- ช่องใส่ชื่อจริง -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold text-gray-700">ชื่อจริง</span>
      </label>
      <input v-model="firstName" type="text" class="input input-bordered rounded-2xl bg-white" />
    </div>

    <!-- ช่องใส่นามสกุล -->
    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold text-gray-700">นามสกุล</span>
      </label>
      <input v-model="lastName" type="text" class="input input-bordered rounded-2xl bg-white" />
    </div>
  </div>

  <!-- ปุ่มอัปเดตโปรไฟล์ -->
  <button @click="updateProfile" class="btn btn-primary w-full py-3 rounded-2xl text-lg font-semibold mt-8">
    อัปเดตโปรไฟล์
  </button>
</div>

</div>


  </UserLayout>
</template>

<style scoped>
/* Style for the profile section */
.avatar img {
  object-fit: cover;
}

.btn {
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.btn-primary:hover {
  transform: scale(1.05);
}

.btn-outline {
  border-color: #4f46e5;
  color: #4f46e5;
}

.btn-outline:hover {
  background-color: #4f46e5;
  color: white;
}
</style>
