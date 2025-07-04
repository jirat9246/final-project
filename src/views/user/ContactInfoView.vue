<script setup>
import UserLayout from '/src/components/layouts/UserLayout.vue'
import { ref, onMounted } from 'vue'
import { useProfileStore } from '@/stores/user/profileStore'
import { doc, getDoc, updateDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'
import Toastify from 'toastify-js'
import "toastify-js/src/toastify.css"

const store = useProfileStore()

// กำหนดตัวแปร
const email = ref(store.email || "")
const phone = ref("")
const addressDetails = ref("")
const selectedCountry = ref("thailand")
const selectedAbroadCountry = ref("")
const lineId = ref("")
const postalCode = ref("")
const district = ref("")
const subDistrict = ref("")
const province = ref("")
const guideDataList = ref([])  // ประกาศตัวแปรที่ถูกต้อง

// ลิสต์จังหวัดทั้งหมดในประเทศไทย
const provinces = ref([
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", 
  "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงใหม่", "เชียงราย", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", 
  "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", 
  "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", 
  "พะเยา", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยะลา", "ยโสธร", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", 
  "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", 
  "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", 
  "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
])
// ลิสต์ประเทศทั้งหมด
const countries = ref([
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan", "Bolivia", 
  "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria", "Burkina Faso", "Burundi",
  // เพิ่มประเทศทั้งหมดที่เหลือ
])


// ฟังก์ชันบันทึกข้อมูลการติดต่อใน Firestore
const saveContactInfo = async () => {
  if (!store.uid) {
    showToast('UID is undefined or empty', 'error')
    return
  }

  const contactInfo = {
    email: email.value,
    phone: phone.value,
    lineId: lineId.value,
    addressDetails: addressDetails.value,
    postalCode: postalCode.value,
    district: district.value,
    subDistrict: subDistrict.value,
    province: province.value,
    selectedCountry: selectedCountry.value,
    selectedAbroadCountry: selectedAbroadCountry.value
  }

  try {
    const userDocRef = doc(db, 'users', store.uid)
    await updateDoc(userDocRef, { contactInfo })
    showToast('ข้อมูลถูกบันทึกเรียบร้อยแล้ว', 'success')
  } catch (error) {
    console.error('Error updating contact info:', error)
    showToast('Error updating contact info. Please try again.', 'error')
  }
}

// ฟังก์ชันโหลดข้อมูลจาก Firestore
const loadGuideApplicationsData = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'guideApplications'))
    if (!querySnapshot.empty) {
      // เก็บข้อมูลทั้งหมดใน guideDataList
      guideDataList.value = querySnapshot.docs.map(doc => doc.data())
      
      // แสดงข้อมูลเอกสารแรกที่พบ
      const firstGuideData = querySnapshot.docs[0].data()
      email.value = firstGuideData.email || ''
      phone.value = firstGuideData.phone || ''
      lineId.value = firstGuideData.lineId || ''
      addressDetails.value = firstGuideData.address || ''
      postalCode.value = firstGuideData.postalCode || ''
      subDistrict.value = firstGuideData.subDistrict || ''
      district.value = firstGuideData.district || ''
      province.value = firstGuideData.province || ''
      showToast('โหลดข้อมูลสำเร็จ', 'success')
    } else {
      showToast('ไม่พบข้อมูลใน guideApplications', 'error')
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล:', error)
    showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error')
  }
}



// ฟังก์ชันแสดงการแจ้งเตือนด้วย Toastify
const showToast = (message, type = 'success') => {
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: "top",
    position: "right",
    backgroundColor: type === 'success' ? "#4caf50" : "#f44336",
  }).showToast()
}


// โหลดข้อมูลเมื่อหน้าเว็บถูก mount
onMounted(() => {
  loadGuideApplicationsData()
})


</script>


<template>
  <UserLayout>
    <div class="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6 py-8 px-4 ">


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





 <!-- Contact Information Section -->
<div class="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 border border-gray-300 shadow-2xl rounded-3xl w-full md:w-2/3 p-10 space-y-8 transform hover:shadow-2xl transition duration-500 ease-in-out hover:scale-105">
  <h2 class="text-4xl font-bold text-gray-800 text-center mb-8">Contact Information</h2>

  <!-- Email and Line ID -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold text-gray-700">อีเมลที่ติดต่อได้</span>
      </label>
      <input v-model="email" type="email" placeholder="อีเมลที่ติดต่อได้" class="input input-bordered w-full rounded-2xl bg-white focus:bg-indigo-50 transition duration-300" />
    </div>
    <div class="form-control">
      <label class="label">
        <span class="label-text font-semibold text-gray-700">ไลน์ไอดี</span>
      </label>
      <input v-model="lineId" type="text" placeholder="ไลน์ไอดี" class="input input-bordered w-full rounded-2xl bg-white focus:bg-purple-50 transition duration-300" />
    </div>
  </div>

  <!-- Phone Number -->
  <div class="form-control mb-6">
    <label class="label">
      <span class="label-text font-semibold text-gray-700">เบอร์โทรศัพท์ที่ติดต่อได้</span>
    </label>
    <input v-model="phone" type="text" placeholder="เบอร์โทรศัพท์" class="input input-bordered w-full rounded-2xl bg-white focus:bg-pink-50 transition duration-300" />
  </div>

  <!-- Country Selection -->
  <div class="form-control mb-6">
    <label class="label">
      <span class="label-text font-semibold text-gray-700">ที่อยู่ปัจจุบัน</span>
    </label>
    <div class="flex space-x-4">
      <label class="flex items-center space-x-2">
        <input v-model="selectedCountry" type="radio" name="country" value="thailand" class="radio radio-primary" />
        <span class="text-gray-700">ประเทศไทย</span>
      </label>
      <label class="flex items-center space-x-2">
        <input v-model="selectedCountry" type="radio" name="country" value="abroad" class="radio radio-primary" />
        <span class="text-gray-700">ต่างประเทศ</span>
      </label>
    </div>
  </div>

<!-- Address for Thailand -->
<div v-if="selectedCountry === 'thailand'" class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
  <div class="form-control">
    <label class="label">
      <span class="label-text font-semibold text-gray-700">รายละเอียดที่อยู่</span>
    </label>
    <textarea 
      v-model="addressDetails" 
      placeholder="รายละเอียดที่อยู่" 
      class="textarea textarea-bordered rounded-2xl bg-white focus:bg-indigo-50 focus:ring-4 focus:ring-indigo-200 transition duration-300"
    ></textarea>
  </div>
  <div class="form-control">
    <label class="label">
      <span class="label-text font-semibold text-gray-700">รหัสไปรษณีย์</span>
    </label>
    <input 
      v-model="postalCode" 
      type="text" 
      placeholder="รหัสไปรษณีย์" 
      class="input input-bordered rounded-2xl bg-white focus:bg-purple-50 focus:ring-4 focus:ring-purple-200 transition duration-300" 
    />
  </div>
  <div class="form-control">
    <label class="label">
      <span class="label-text font-semibold text-gray-700">ตำบล/แขวง</span>
    </label>
    <input 
      v-model="district" 
      type="text" 
      placeholder="ตำบล/แขวง" 
      class="input input-bordered rounded-2xl bg-white focus:bg-pink-50 focus:ring-4 focus:ring-pink-200 transition duration-300" 
    />
  </div>
  <div class="form-control">
    <label class="label">
      <span class="label-text font-semibold text-gray-700">อำเภอ/เขต</span>
    </label>
    <input 
      v-model="subDistrict" 
      type="text" 
      placeholder="อำเภอ/เขต" 
      class="input input-bordered rounded-2xl bg-white focus:bg-yellow-50 focus:ring-4 focus:ring-yellow-200 transition duration-300" 
    />
  </div>
  <div class="form-control">
    <label class="label">
      <span class="label-text font-semibold text-gray-700">จังหวัด</span>
    </label>
    <select 
      v-model="province" 
      class="select select-bordered rounded-2xl bg-white focus:bg-green-50 focus:ring-4 focus:ring-green-200 transition duration-300"
    >
      <option disabled value="">เลือกจังหวัด</option>
      <option v-for="prov in provinces" :key="prov" :value="prov">{{ prov }}</option>
    </select>
  </div>
</div>

<!-- Country Selection for Abroad -->
<div v-if="selectedCountry === 'abroad'" class="form-control mb-6">
  <label class="label">
    <span class="label-text font-semibold text-gray-700">เลือกประเทศ</span>
  </label>
  <select 
    v-model="selectedAbroadCountry" 
    class="select select-bordered rounded-2xl bg-white focus:bg-indigo-50 focus:ring-4 focus:ring-indigo-200 transition duration-300"
  >
    <option disabled value="">เลือกประเทศ</option>
    <option v-for="country in countries" :key="country" :value="country">{{ country }}</option>
  </select>
</div>

<!-- Save Button -->
<button 
  @click="saveContactInfo" 
  class="btn bg-gradient-to-r from-indigo-500 to-purple-500 text-white w-full py-3 rounded-2xl text-lg font-semibold hover:from-indigo-600 hover:to-purple-600 focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all duration-300"
>
  บันทึก
</button>


     </div>
    </div>
  </UserLayout>
</template>

<style scoped>
.btn {
  transition: background-color 0.3s ease, transform 0.2s ease;
}
.btn-primary:hover {
  transform: scale(1.05);
}
</style>
