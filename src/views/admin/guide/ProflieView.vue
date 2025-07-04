<script setup>
import AdminLayout from '/src/components/layouts/AdminLayout.vue'
import { useRoute, useRouter } from 'vue-router'
import { reactive, onMounted, ref } from 'vue'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase'

const route = useRoute()
const router = useRouter()
const showFullscreen = ref(false) // ตัวแปรจัดการโหมดเต็มหน้าจอ
const selectedImage = ref(null) // ตัวแปรเก็บ URL ของรูปภาพที่ถูกเลือก

// สร้าง reactive object สำหรับข้อมูลมัคคุเทศก์
const guideData = reactive({
  prefix: '',
  firstName: '',
  lastName: '',
  citizenId: '',
  guideLicenseId: '',
  address: '',
  province: '',
  district: '',
  subDistrict: '',
  postalCode: '',
  status: '',
  citizenCardImage: '',
  selfieWithCitizenCard: '',
  guideLicenseImage: '',
  selfieWithGuideLicense: ''
})


// ดึงข้อมูลมัคคุเทศก์เมื่อ component ถูก mounted
onMounted(async () => {
  try {
    const guideId = route.params.id
    const guideRef = doc(db, 'guideApplications', guideId)
    const guideSnapshot = await getDoc(guideRef)

    if (guideSnapshot.exists()) {
      const data = guideSnapshot.data()
      Object.assign(guideData, data)

      // แปลงรูปภาพ Base64 ให้เป็น URL ที่แสดงผลได้
      guideData.citizenCardImage = `data:image/jpeg;base64,${data.citizenCardImage}`
      guideData.selfieWithCitizenCard = `data:image/jpeg;base64,${data.selfieWithCitizenCardImage}`
      guideData.guideLicenseImage = `data:image/jpeg;base64,${data.guideLicenseImage}`
      guideData.selfieWithGuideLicense = `data:image/jpeg;base64,${data.selfieWithGuideLicenseImage}`
    } else {
      console.error('Guide data not found')
    }
  } catch (error) {
    console.error('Error fetching guide data:', error)
  }
})


// ฟังก์ชันเปิดภาพเต็มหน้าจอ
const openFullscreenImage = (imageUrl) => {
  selectedImage.value = imageUrl
  showFullscreen.value = true
}

// ฟังก์ชันปิดภาพเต็มหน้าจอ
const closeFullscreenImage = () => {
  showFullscreen.value = false
  selectedImage.value = null
}



// ฟังก์ชันกลับไปยังหน้าก่อนหน้า
const goBack = () => {
  router.push({ name: 'admin-guides-list' })
}
</script>

<template>
  <AdminLayout>
    <div class="p-6 bg-white shadow-lg rounded-lg max-w-screen-lg mx-auto overflow-y-auto h-auto">
      <h2 class="text-2xl font-bold text-indigo-700 mb-6 text-center">Guide Profile</h2>

      <!-- Prefix, First Name, Last Name -->
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <!-- Prefix -->
        <div>
          <label class="block text-xs font-medium text-gray-700">คำนำหน้าชื่อ</label>
          <p class="mt-1 p-2 bg-gray-100 rounded-full text-sm">{{ guideData.prefix }}</p>
        </div>

        <!-- First Name -->
        <div>
          <label class="block text-xs font-medium text-gray-700">ชื่อ</label>
          <p class="mt-1 p-2 bg-gray-100 rounded-full text-sm">{{ guideData.firstName }}</p>
        </div>

        <!-- Last Name -->
        <div>
          <label class="block text-xs font-medium text-gray-700">นามสกุล</label>
          <p class="mt-1 p-2 bg-gray-100 rounded-full text-sm">{{ guideData.lastName }}</p>
        </div>
      </div>

      <!-- Citizen ID -->
      <div class="mb-4">
        <label class="block text-xs font-medium text-gray-700">เลขบัตรประชาชน</label>
        <p class="mt-1 p-2 bg-gray-100 rounded-full text-sm">{{ guideData.citizenId }}</p>
      </div>

      <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
       
       
        <!-- ซ้าย: รูปบัตรประชาชน -->
        <div class="flex-1 flex flex-col items-center">
          <label class="block text-xs font-medium text-gray-700 mb-2">รูปบัตรประชาชน</label>
          <div v-if="guideData.citizenCardImage" class="mt-2">
            <img 
              :src="guideData.citizenCardImage" 
              alt="Citizen Card" 
              class="w-40 h-auto border rounded-lg shadow-md cursor-zoom-in transition-transform duration-300 hover:scale-105"
              @click="openFullscreenImage(guideData.citizenCardImage)"
            >
          </div>
        </div>


       <!-- ขวา: รูปตัวเองถือบัตรประชาชน -->
       <div class="flex-1 flex flex-col items-center">
          <label class="block text-xs font-medium text-gray-700 mb-2">รูปตัวเองถือบัตรประชาชน</label>
          <div v-if="guideData.selfieWithCitizenCard" class="mt-2">
            <img 
              :src="guideData.selfieWithCitizenCard" 
              alt="Selfie with Citizen Card" 
              class="w-40 h-auto border rounded-lg shadow-md cursor-zoom-in transition-transform duration-300 hover:scale-105"
              @click="openFullscreenImage(guideData.selfieWithCitizenCard)"
            >
          </div>
        </div>

      </div>



      <!-- Guide License ID -->
      <div class="mb-4">
        <label class="block text-xs font-medium text-gray-700">เลขบัตรมัคคุเทศก์</label>
        <p class="mt-1 p-2 bg-gray-100 rounded-full text-sm">{{ guideData.guideLicenseId }}</p>
      </div>

      <div class="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <!-- ซ้าย: รูปบัตรมัคคุเทศก์ -->
        <div class="flex-1 flex flex-col items-center">
          <label class="block text-xs font-medium text-gray-700 mb-2">รูปบัตรมัคคุเทศก์</label>
          <div v-if="guideData.guideLicenseImage" class="mt-2">
            <img 
              :src="guideData.guideLicenseImage" 
              alt="Guide License" 
              class="w-40 h-auto border rounded-lg shadow-md cursor-zoom-in transition-transform duration-300 hover:scale-105"
              @click="openFullscreenImage(guideData.guideLicenseImage)"
            >
          </div>

        </div>

     <!-- ขวา: รูปตัวเองถือบัตรมัคคุเทศก์ -->
        <div class="flex-1 flex flex-col items-center">
          <label class="block text-xs font-medium text-gray-700 mb-2">รูปตัวเองถือบัตรมัคคุเทศก์</label>
          <div v-if="guideData.selfieWithGuideLicense" class="mt-2">
            <img 
              :src="guideData.selfieWithGuideLicense" 
              alt="Selfie with Guide License" 
              class="w-40 h-auto border rounded-lg shadow-md cursor-zoom-in transition-transform duration-300 hover:scale-105"
              @click="openFullscreenImage(guideData.selfieWithGuideLicense)"
            >
          </div>
        </div>
        
      </div>


      <!-- Address -->
      <div class="mb-4">
        <label class="block text-xs font-medium text-gray-700">ที่อยู่ตามบัตรประชาชน</label>
        <p class="mt-1 p-2 bg-gray-100 rounded-full text-sm">{{ guideData.address }}</p>
      </div>

      <!-- Province, District, Sub-district, Postal Code -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-xs font-medium text-gray-700">จังหวัด</label>
          <p class="mt-1 p-2 bg-gray-100 rounded-full text-sm">{{ guideData.province }}</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700">อำเภอ/เขต</label>
          <p class="mt-1 p-2 bg-gray-100 rounded-full text-sm">{{ guideData.district }}</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700">ตำบล/แขวง</label>
          <p class="mt-1 p-2 bg-gray-100 rounded-full text-sm">{{ guideData.subDistrict }}</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-700">รหัสไปรษณีย์</label>
          <p class="mt-1 p-2 bg-gray-100 rounded-full text-sm">{{ guideData.postalCode }}</p>
        </div>
      </div>

      <!-- Status -->
      <div class="mb-4">
        <label class="block text-xs font-medium text-gray-700">Status</label>
        <div class="mt-1 p-2 rounded-full text-sm"
             :class="guideData.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'">
          {{ guideData.status }}
        </div>
      </div>

      <!-- Back Button -->
      <div class="mt-6 flex justify-center">
        <button @click="goBack" class="bg-indigo-600 text-white px-6 py-2 rounded-full shadow-md hover:bg-indigo-700 transition duration-300">
          Back
        </button>
      </div>
    </div>
    
      <!-- Modal ภาพเต็มหน้าจอ -->
      <div v-if="showFullscreen" class="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
          <img 
          :src="selectedImage" 
          alt="Fullscreen Image" 
          class="w-full max-w-screen-md h-auto rounded-lg cursor-zoom-out transition-transform duration-300" 
          @click="closeFullscreenImage"
        />
      </div>


  </AdminLayout>
</template>






<style scoped>
.cursor-zoom-in {
  cursor: zoom-in;
}
.cursor-zoom-out {
  cursor: zoom-out;
}
</style>