<script setup>
import { ref, watch, onMounted } from 'vue'
import UserLayout from '/src/components/layouts/UserLayout.vue'
import { getAuth } from 'firebase/auth'
import { db } from '@/firebase'
import { query, collection, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
import Toastify from 'toastify-js'
import "toastify-js/src/toastify.css"

const bankName = ref("") // ชื่อธนาคารที่ใช้สำหรับการตรวจสอบ
const bankAccountNumber = ref("") // เลขบัญชีธนาคาร

// List of Thai banks
const thaiBanks = [
  "ธนาคารกรุงเทพ",
  "ธนาคารกสิกรไทย",
  "ธนาคารกรุงไทย",
  "ธนาคารทหารไทยธนชาต",
  "ธนาคารไทยพาณิชย์",
  "ธนาคารกรุงศรีอยุธยา",
  "ธนาคารออมสิน",
  "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร",
  "ธนาคารอาคารสงเคราะห์",
  "ธนาคารอิสลามแห่งประเทศไทย"
]

// Expected lengths for account numbers by bank
const bankAccountPatterns = {
  "ธนาคารกรุงเทพ": 10,
  "ธนาคารกสิกรไทย": 10,
  "ธนาคารกรุงไทย": 10,
  "ธนาคารทหารไทยธนชาต": 10,
  "ธนาคารไทยพาณิชย์": 10,
  "ธนาคารกรุงศรีอยุธยา": 10,
  "ธนาคารออมสิน": 13,
  "ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร": 13,
  "ธนาคารอาคารสงเคราะห์": 13,
  "ธนาคารอิสลามแห่งประเทศไทย": 13
}

// ฟังก์ชันสำหรับโหลดข้อมูลธนาคาร
const loadBankAccountInfo = async () => {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) return

  try {
    // ดึงข้อมูล uid (หรือ guideId) จากเอกสารของผู้ใช้ใน users คอลเล็กชัน
    const userDocRef = doc(db, 'users', user.uid)
    const userDocSnapshot = await getDoc(userDocRef)

    if (!userDocSnapshot.exists()) return

    const guideId = userDocSnapshot.data().uid

    // อ้างอิงไปยังเอกสารใน guides คอลเล็กชันโดยใช้ guideId
    const guideDocRef = doc(db, 'guides', guideId)
    const guideDocSnapshot = await getDoc(guideDocRef)

    if (guideDocSnapshot.exists()) {
      bankName.value = guideDocSnapshot.data().bankName || ""
      bankAccountNumber.value = guideDocSnapshot.data().bankAccountNumber || ""
    }
  } catch (error) {
    console.error("Error loading bank account info:", error)
  }
}

// Watch the bank account number input and validate as the user types
watch(bankAccountNumber, (newValue) => {
  const expectedLength = bankAccountPatterns[bankName.value]
  if (newValue.length > expectedLength) {
    bankAccountNumber.value = newValue.slice(0, expectedLength)
  } else if (newValue && newValue.length === expectedLength) {
    Toastify({ text: "หมายเลขบัญชีครบถ้วน", backgroundColor: "green" }).showToast()
  }
})

// ฟังก์ชันสำหรับบันทึกข้อมูลธนาคาร
const saveBankAccountInfo = async () => {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) {
    Toastify({ text: "กรุณาเข้าสู่ระบบก่อน", backgroundColor: "red" }).showToast()
    return
  }

  if (!bankName.value || !bankAccountNumber.value) {
    Toastify({ text: "กรุณาเลือกธนาคารและกรอกเลขบัญชี", backgroundColor: "red" }).showToast()
    return
  }

  try {
    const userDocRef = doc(db, 'users', user.uid)
    const userDocSnapshot = await getDoc(userDocRef)

    if (!userDocSnapshot.exists()) {
      Toastify({ text: "ไม่พบข้อมูลผู้ใช้", backgroundColor: "red" }).showToast()
      return
    }

    const guideId = userDocSnapshot.data().uid
    const guideDocRef = doc(db, 'guides', guideId)
    await updateDoc(guideDocRef, {
      bankName: bankName.value,
      bankAccountNumber: bankAccountNumber.value
    })

    Toastify({ text: "บันทึกข้อมูลบัญชีธนาคารเรียบร้อย", backgroundColor: "green" }).showToast()
  } catch (error) {
    console.error("Error saving bank account info:", error)
    Toastify({ text: "เกิดข้อผิดพลาดในการบันทึกข้อมูล", backgroundColor: "red" }).showToast()
  }
}

// เรียกใช้งาน loadBankAccountInfo เมื่อหน้าเว็บแสดงผลครั้งแรก
onMounted(() => {
  loadBankAccountInfo()
})
</script>





<template>
  <UserLayout>
    <div class="flex flex-col md:flex-row py-8 px-4 space-y-6 md:space-y-0 md:space-x-6">




     <!-- Account Center Section -->
<div class="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 border border-gray-200 shadow-2xl rounded-3xl w-full md:w-1/3 p-10 space-y-8 transform hover:shadow-2xl transition duration-500 ease-in-out hover:scale-105">
  <h2 class="text-4xl font-bold text-gray-800 text-center mb-8">Account Center</h2>
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







      <!-- Bank Account Section -->
      <div class="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 border border-gray-200 shadow-2xl rounded-3xl w-full md:w-2/3 p-10 space-y-8 transform hover:shadow-2xl transition duration-500 ease-in-out hover:scale-105">
        <h2 class="text-3xl font-bold text-gray-800 text-center mb-6">บัญชีธนาคาร</h2>

        <!-- Bank Name Dropdown -->
        <div class="form-control mt-4">
          <label class="label">
            <span class="label-text font-semibold text-gray-700">ชื่อธนาคาร</span>
          </label>
          <select v-model="bankName" class="input input-bordered rounded-2xl bg-white">
            <option value="" disabled>เลือกธนาคาร</option>
            <option v-for="bank in thaiBanks" :key="bank" :value="bank">{{ bank }}</option>
          </select>
        </div>

        <!-- Bank Account Number Input -->
        <div class="form-control mt-4">
          <label class="label">
            <span class="label-text font-semibold text-gray-700">เลขบัญชีธนาคาร</span>
          </label>
          <input v-model="bankAccountNumber" type="text" placeholder="กรอกเลขบัญชีธนาคาร" class="input input-bordered rounded-2xl bg-white">
        </div>

        <!-- Save Button -->
        <button @click="saveBankAccountInfo" class="btn btn-primary w-full py-3 rounded-2xl text-lg font-semibold hover:bg-primary-focus transition-all duration-300 mt-8">บันทึก</button>
      </div>
    </div>



  </UserLayout>
</template>

<style scoped>
/* Interactive button hover effect */
.btn-primary {
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.btn-primary:hover {
  transform: scale(1.05);
}

/* Image transition effect */
img {
  transition: transform 0.2s ease;
}

img:hover {
  transform: scale(1.05);
}
</style>
