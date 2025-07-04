<script setup>
import { ref, onMounted } from 'vue';
import UserLayout from '/src/components/layouts/UserLayout.vue';
import { useProfileStore } from '@/stores/user/profileStore'; // ใช้ alias @ 
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/firebase'; // ใช้ Firebase database



const store = useProfileStore(); // ใช้ Pinia store

const guideLicenseId = ref(''); // หมายเลขบัตรมัคคุเทศก์
const guideCardImageUrl = ref(""); // รูปบัตรไกด์
const selfieWithGuideCardUrl = ref(""); // รูปถ่ายตัวเองถือบัตรไกด์








// ฟังก์ชันดึงข้อมูลจาก Firestore
const loadGuideApplicationsData = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'guideApplications'));
    if (!querySnapshot.empty) {
      // ดึงข้อมูลจากเอกสารแรกในคอลเลกชัน
      const firstGuideData = querySnapshot.docs[0].data();
      guideLicenseId.value = firstGuideData.guideLicenseId || 'ไม่พบหมายเลขบัตรมัคคุเทศก์';

      // เพิ่ม prefix "data:image/jpeg;base64," หรือ "data:image/png;base64," ให้กับ Base64
      guideCardImageUrl.value = firstGuideData.guideLicenseImage 
        ? `data:image/jpeg;base64,${firstGuideData.guideLicenseImage}`
        : '';
        
      selfieWithGuideCardUrl.value = firstGuideData.selfieWithGuideLicenseImage 
        ? `data:image/jpeg;base64,${firstGuideData.selfieWithGuideLicenseImage}`
        : '';
    } else {
      console.warn('ไม่พบข้อมูลใน guideApplications');
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการโหลดข้อมูล:', error);
  }
};




// โหลดข้อมูลเมื่อหน้าเว็บถูกโหลด
onMounted(() => {
  loadGuideApplicationsData()
})




// ฟังก์ชันจัดการการอัปโหลดไฟล์
const handleFileUpload = (event, imageType) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (imageType === 'guideCard') {
        guideCardImageUrl.value = e.target.result; // อัปโหลดรูปบัตรไกด์
      } else if (imageType === 'selfieWithGuideCard') {
        selfieWithGuideCardUrl.value = e.target.result; // อัปโหลดรูปตัวเองถือบัตรไกด์
      }
    };
    reader.readAsDataURL(file);
  }
};

// ฟังก์ชันบันทึกข้อมูลลง localStorage
const saveGuideCardInfo = () => {
  const guideCardInfo = {
    guideCardImageUrl: guideCardImageUrl.value,
    selfieWithGuideCardUrl: selfieWithGuideCardUrl.value,
  };
  localStorage.setItem('guidecard-info', JSON.stringify(guideCardInfo));
  alert('ข้อมูลบัตรไกด์ถูกบันทึกเรียบร้อยแล้ว');
};

// โหลดข้อมูลจาก localStorage เมื่อหน้าเว็บถูกโหลด
onMounted(() => {
  let guideCardInfo = localStorage.getItem('guidecard-info');
  if (guideCardInfo) {
    guideCardInfo = JSON.parse(guideCardInfo);
    guideCardImageUrl.value = guideCardInfo.guideCardImageUrl;
    selfieWithGuideCardUrl.value = guideCardInfo.selfieWithGuideCardUrl;
  }
});
</script>

<template>
  <UserLayout>
    <div class="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6 py-8 px-4">





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




<!-- Guide Card Section -->
<div class="bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 border border-gray-300 shadow-2xl rounded-3xl w-full md:w-2/3 p-12 space-y-10 transform hover:shadow-2xl transition duration-500 ease-in-out hover:scale-105">
  <h2 class="text-5xl font-extrabold text-gray-900 text-center mb-10 tracking-tight">
    Guide Card Information
  </h2>

  <!-- แสดงหมายเลขบัตรมัคคุเทศก์ -->
  <div class="flex flex-col items-center space-y-4">
    <label class="text-2xl font-semibold text-gray-900">
      หมายเลขบัตรมัคคุเทศก์
    </label>
    <div class="bg-white text-gray-900 text-2xl font-bold py-4 px-8 rounded-full shadow-lg tracking-wider transition transform hover:scale-105">
      {{ guideLicenseId }}
    </div>
  </div>

  <!-- แสดงรูปบัตรมัคคุเทศก์ -->
  <div class="flex flex-col items-center space-y-6 mt-8">
    <label class="text-xl font-semibold text-gray-900">
      รูปบัตรมัคคุเทศก์
    </label>
    <div v-if="guideCardImageUrl" class="w-full flex justify-center">
      <img :src="guideCardImageUrl" alt="Guide Card" class="w-80 h-80 object-cover rounded-xl shadow-xl border-4 border-white transition transform hover:scale-105" />
    </div>
  </div>

  <!-- แสดงรูปตัวเองถือบัตรมัคคุเทศก์ -->
  <div class="flex flex-col items-center space-y-6 mt-8">
    <label class="text-xl font-semibold text-gray-900">
      รูปตัวเองถือบัตรมัคคุเทศก์
    </label>
    <div v-if="selfieWithGuideCardUrl" class="w-full flex justify-center">
      <img :src="selfieWithGuideCardUrl" alt="Selfie with Guide Card" class="w-80 h-80 object-cover rounded-xl shadow-xl border-4 border-white transition transform hover:scale-105" />
    </div>
  </div>




     </div>
    </div>
  </UserLayout>
</template>

<style scoped>
/* Add hover and transition effects for buttons and images */
.btn {
  transition: background-color 0.3s ease, transform 0.2s ease;
}

.btn-primary:hover {
  transform: scale(1.05);
}

input[type="file"] {
  cursor: pointer;
}

img {
  transition: transform 0.2s ease;
}

img:hover {
  transform: scale(1.05);
}
</style>
