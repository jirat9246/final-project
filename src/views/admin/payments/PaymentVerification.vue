<script setup>
import "toastify-js/src/toastify.css"
import Toastify from 'toastify-js'
import AdminLayout from '/src/components/layouts/AdminLayout.vue'
import { ref, onMounted } from 'vue'
import { db } from '@/firebase.js'
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore'

// ตัวแปรจัดการข้อมูลสลิป
const slips = ref([])
const showSlipModal = ref(false)
const showFullscreen = ref(false)
const selectedSlip = ref(null)
const disabledButtons = ref(new Set()) // Set to track disabled buttons

// ฟังก์ชันแปลงวันที่
const formatDate = (timestamp) => {
  if (!timestamp) return 'ไม่ทราบวันที่'
  const date = new Date(timestamp.seconds * 1000)
  return date.toLocaleString('th-TH', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ฟังก์ชันแสดงการแจ้งเตือนด้วย Toastify
const showToast = (message, type = 'success') => {
  const colors = {
    success: 'linear-gradient(to right, #00b09b, #96c93d)',
    error: 'linear-gradient(to right, #ff5f6d, #ffc371)',
    warning: 'linear-gradient(to right, #f9a825, #f57f17)'
  }
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: 'top',
    position: 'right',
    backgroundColor: colors[type],
    stopOnFocus: true,
    style: {
      borderRadius: '8px',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
      fontSize: '16px',
      fontWeight: '600'
    }
  }).showToast()
}




// ฟังก์ชันโหลดข้อมูลสลิปจาก Firestore
const loadSlips = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'acceptJob'))
    let allSlips = []

    for (const acceptJobDoc of querySnapshot.docs) {
      const acceptJobData = acceptJobDoc.data()

      // ตรวจสอบว่ามีฟิลด์ 'slip' ในเอกสารหรือไม่
      if (acceptJobData.slip && typeof acceptJobData.slip === 'object') {
        const slipData = acceptJobData.slip

        // แปลง Base64 เป็นฟอร์แมตที่สามารถแสดงใน <img>
        let imageUrl = slipData.imageUrl
        if (imageUrl && !imageUrl.startsWith('data:image/')) {
          imageUrl = `data:image/jpeg;base64,${imageUrl}`
        }

        // แปลงวันที่อัพโหลด
        let formattedUploadDate = 'ไม่ทราบวันที่'
        if (slipData.uploadDate) {
          if (slipData.uploadDate.seconds) {
            // หากเป็น Firestore Timestamp
            formattedUploadDate = formatDate(slipData.uploadDate)
          } else if (typeof slipData.uploadDate === 'string') {
            // หากเป็น ISO String
            const date = new Date(slipData.uploadDate)
            formattedUploadDate = date.toLocaleString('th-TH', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          }
        }

        // ดึงข้อมูลผู้ใช้จาก userId
        let userEmail = 'ไม่ทราบผู้ใช้'
        if (slipData.userId) {
          const userDoc = await getDoc(doc(db, 'users', slipData.userId))
          if (userDoc.exists()) {
            userEmail = userDoc.data().email || 'ไม่ทราบอีเมล'
          }
        }

        // เพิ่มข้อมูลสลิปในรายการ
        allSlips.push({
          id: acceptJobDoc.id,
          userId: slipData.userId,
          userEmail: userEmail,
          imageUrl: imageUrl,
          status: slipData.status || 'ไม่ทราบสถานะ',
          uploadDate: formattedUploadDate
        })
      }
    }

    slips.value = allSlips
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการโหลดสลิป:', error)
    showToast('เกิดข้อผิดพลาดในการโหลดข้อมูลสลิป', 'error')
  }
}







// ฟังก์ชันสำหรับยืนยันการตรวจสอบสลิป
const verifySlip = async (slip) => {
  if (disabledButtons.value.has(slip.id)) return
  disabledButtons.value.add(slip.id)

  try {
    const acceptJobRef = doc(db, 'acceptJob', slip.id)
    await updateDoc(acceptJobRef, {
      'slips.status': 'ตรวจสอบแล้ว'
    })
    slip.status = 'ตรวจสอบแล้ว'
    showToast('ยืนยันการตรวจสอบสลิปเรียบร้อย', 'success')
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการยืนยันสลิป:', error)
    showToast('เกิดข้อผิดพลาดในการยืนยันสลิป', 'error')
  }
}

// ฟังก์ชันสำหรับปฏิเสธสลิป
const rejectSlip = async (slip) => {
  if (disabledButtons.value.has(slip.id)) return
  disabledButtons.value.add(slip.id)

  try {
    const acceptJobRef = doc(db, 'acceptJob', slip.id)
    await updateDoc(acceptJobRef, {
      'slips.status': 'ตรวจสอบไม่ผ่าน'
    })
    slip.status = 'ตรวจสอบไม่ผ่าน'
    showToast('สลิปนี้ตรวจสอบไม่ผ่าน', 'warning')

    // ลบสลิปเมื่อมีการอัปโหลดใหม่โดยผู้ใช้คนเดิม
    slips.value = slips.value.filter((s) => s.id !== slip.id)
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการปฏิเสธสลิป:', error)
    showToast('เกิดข้อผิดพลาดในการปฏิเสธสลิป', 'error')
  }
}

// ฟังก์ชันสำหรับลบข้อมูลสลิป
const deleteSlip = async (slip) => {
  if (disabledButtons.value.has(slip.id)) return
  disabledButtons.value.add(slip.id)

  try {
    await deleteDoc(doc(db, 'acceptJob', slip.id))
    showToast('ลบข้อมูลสลิปเรียบร้อย', 'success')

    // ลบสลิปออกจาก UI ทันที
    slips.value = slips.value.filter((s) => s.id !== slip.id)
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการลบสลิป:', error)
    showToast('เกิดข้อผิดพลาดในการลบสลิป', 'error')
  }
}

// ฟังก์ชันเปิดป๊อปอัพสำหรับดูสลิป
const openSlipModal = (slip) => {
  selectedSlip.value = slip
  showSlipModal.value = true
}

// ฟังก์ชันปิดป๊อปอัพสลิป
const closeSlipModal = () => {
  showSlipModal.value = false
  selectedSlip.value = null
  showFullscreen.value = false
}

// ฟังก์ชันเปิด Modal แบบเต็มหน้าจอ
const openFullscreenImage = () => {
  showFullscreen.value = true
}

// ฟังก์ชันปิด Modal แบบเต็มหน้าจอ
const closeFullscreenImage = () => {
  showFullscreen.value = false
}

// เรียกใช้ฟังก์ชัน loadSlips เมื่อ component ถูก mount
onMounted(() => {
  loadSlips()
})
</script>









<template>
  <AdminLayout>



    <!-- Header -->
    <div class="flex items-center justify-between my-6">
      <h2 class="text-4xl font-extrabold text-white tracking-wide bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-lg shadow-lg">
        Payment Verification
      </h2>
    </div>

    <!-- Table for displaying slips -->
    <div class="overflow-x-auto shadow-lg rounded-xl">
      <table class="min-w-full text-sm text-left">
        <thead class="text-xs text-white uppercase bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-xl">
          <tr>
            <th scope="col" class="py-4 px-6 text-center">ลำดับ</th>
            <th scope="col" class="py-4 px-6 text-center">ชื่อผู้ใช้</th>
            <th scope="col" class="py-4 px-6 text-center">วันที่อัพโหลด</th>
            <th scope="col" class="py-4 px-6 text-center">สถานะ</th>
            <th scope="col" class="py-4 px-6 text-center">การดำเนินการ</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(slip, index) in slips" :key="slip.id" class="bg-white border-b hover:bg-gray-50 transition duration-300">
            <td class="py-4 px-6 text-gray-700 font-medium text-center">{{ index + 1 }}</td>
            <td class="py-4 px-6 text-gray-700 text-center">{{ slip.userEmail }}</td>
            <td class="py-4 px-6 text-gray-700 text-center">{{ slip.uploadDate }}</td>
            <td class="py-4 px-6 text-center">
              <span
                :class="{
                  'bg-red-200 text-red-800 border border-red-600': slip.status === 'pending',
                  'bg-green-200 text-green-800 border border-green-600': slip.status === 'ตรวจสอบแล้ว',
                  'bg-yellow-200 text-yellow-800 border border-yellow-600': slip.status === 'ตรวจสอบไม่ผ่าน'
                }"
                class="px-5 py-2 rounded-full text-sm font-semibold shadow-md"
              >
                {{ slip.status }}
              </span>
            </td>

            <td class="py-4 px-6 flex justify-center space-x-3">
              <!-- View Slip Button -->
              <button
                @click="openSlipModal(slip)"
                class="flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 space-x-2"
              >
                <i class="fas fa-eye"></i>
                <span class="font-semibold text-sm">ดูสลิป</span>
              </button>

              <!-- Verify Slip Button -->
              <button
                @click="verifySlip(slip)"
                class="flex items-center justify-center bg-gradient-to-r from-green-500 to-teal-500 hover:from-teal-600 hover:to-green-600 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 space-x-2"
                :disabled="disabledButtons.has(slip.id)"
              >
                <i class="fas fa-check-circle"></i>
                <span class="font-semibold text-sm">ยืนยัน</span>
              </button>

              <!-- Reject Slip Button -->
              <button
                @click="rejectSlip(slip)"
                class="flex items-center justify-center bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-orange-600 hover:to-yellow-600 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 space-x-2"
                :disabled="disabledButtons.has(slip.id)"
              >
                <i class="fas fa-times-circle"></i>
                <span class="font-semibold text-sm">ปฏิเสธ</span>
              </button>

              <!-- Delete Slip Button -->
              <button
                @click="deleteSlip(slip)"
                class="flex items-center justify-center bg-gradient-to-r from-red-500 to-pink-500 hover:from-pink-600 hover:to-red-600 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 space-x-2"
                :disabled="disabledButtons.has(slip.id)"
              >
                <i class="fas fa-trash-alt"></i>
                <span class="font-semibold text-sm">ลบ</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal for displaying slip image -->
    <div v-if="showSlipModal" class="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-60 transition-all duration-300">
      <div class="bg-gradient-to-br from-purple-500 to-pink-500 p-1 rounded-xl shadow-2xl w-full max-w-lg animate-fadeIn">
        <div class="bg-white p-6 rounded-lg">
          <!-- Title -->
          <h3 class="text-lg font-bold mb-4 text-center text-white bg-gradient-to-r from-indigo-600 to-purple-500 py-2 rounded-md shadow-md">
            ดูสลิปการชำระเงิน
          </h3>

          <!-- Slip Image -->
          <div class="flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden mb-4 shadow-md animate-zoomIn">
            <img
              :src="selectedSlip.imageUrl"
              alt="Slip Image"
              v-if="selectedSlip.imageUrl"
              class="max-h-80 w-auto rounded-lg cursor-zoom-in transition-transform duration-300 hover:scale-105"
              @click="openFullscreenImage"
            />
            <p v-else class="text-red-600 text-center py-8">ไม่สามารถแสดงภาพได้</p>
          </div>

          <!-- Close Button -->
          <div class="flex justify-center mt-4">
            <button
              @click="closeSlipModal"
              class="bg-red-500 hover:bg-red-600 text-white font-semibold px-8 py-3 rounded-full shadow-lg transition-transform duration-300 hover:scale-105">
              ปิด
            </button>
          </div>
        </div>
      </div>

      <!-- Fullscreen Image Modal -->
      <div
        v-if="showFullscreen"
        class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-60 p-4 animate-fadeIn"
      >
        <div class="relative p-1 bg-white rounded-lg shadow-2xl max-w-lg w-full">
          <img
            :src="selectedSlip.imageUrl"
            alt="Fullscreen Slip Image"
            class="w-full h-auto rounded-md transition-transform duration-300 cursor-zoom-out"
            @click="closeFullscreenImage"
          />
        </div>
      </div>
    </div>



  </AdminLayout>
</template>













<style scoped>
/* เพิ่มแอนิเมชัน fadeIn */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out forwards;
}

.max-w-sm {
  max-width: 400px; /* ปรับขนาดความกว้างสูงสุด */
}

.bg-opacity-80 {
  background-color: rgba(0, 0, 0, 0.8);
}

.cursor-zoom-out {
  cursor: zoom-out;
}
</style>
