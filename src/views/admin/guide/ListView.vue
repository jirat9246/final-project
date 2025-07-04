
<script setup>

import { onMounted, computed , reactive } from 'vue'
import { RouterLink , useRoute } from 'vue-router'
import AdminLayout from '/src/components/layouts/AdminLayout.vue'
import { useGuideStore } from '/src/stores/admin/guide'
import Table from '/src/components/Table.vue'
import { useEventStore } from '/src/stores/event'
import Toastify from 'toastify-js'
import "toastify-js/src/toastify.css"
import { doc, updateDoc,  getDoc   , setDoc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { db } from '@/firebase'



const eventStore = useEventStore()
const guideStore = useGuideStore()
const route = useRoute()







// ฟังก์ชันเปลี่ยนสถานะไกด์
const toggleStatus = async (guideId) => {
  const guide = guideStore.list.find(g => g.id === guideId)
  if (!guide) return

  const newStatus = guide.status === 'active' ? 'inactive' : 'active'
  const batch = writeBatch(db)

  try {
    const guideRef = doc(db, 'guideApplications', guideId)
    batch.update(guideRef, { status: newStatus, updatedAt: serverTimestamp() })

    if (newStatus === 'active') {
      // ตรวจสอบว่า UID มีอยู่แล้วหรือไม่ ถ้าไม่มีให้สร้างใหม่
      let newGuideUID = guide.uid || uuidv4()
      
      const userRef = doc(db, 'users', guideId)
      batch.update(userRef, { role: 'guide', updatedAt: serverTimestamp() })

      const guideCollectionRef = doc(db, 'guides', newGuideUID)
      batch.set(guideCollectionRef, {
        uid: newGuideUID,
        email: guide.email,
        role: 'guide',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true })

      guide.role = 'guide'
      guide.uid = newGuideUID
    } else {
      const userRef = doc(db, 'users', guideId)
      batch.update(userRef, { role: 'user', updatedAt: serverTimestamp() })

      guide.role = 'user'
    }

    await batch.commit()
    await guideStore.fetchGuides()
    showToast('Guide status and role updated successfully', 'success')
  } catch (error) {
    console.error('Error updating guide status or role:', error)
    showToast('Error updating guide status: ' + error.message, 'error')
  }
}






const guideData = reactive({
  status: null
})

onMounted(async () => {
  try {
    const guideId = route.params.id;

    if (!guideId) {
      console.warn('Invalid guide ID');
      return;
    }

    const guideRef = doc(db, 'guideApplications', guideId);
    const guideSnapshot = await getDoc(guideRef);

    if (guideSnapshot.exists()) {
      Object.assign(guideData, guideSnapshot.data());
    } else {
      console.warn('Guide data not found');
    }
  } catch (error) {
    console.error('Error fetching guide data:', error);
  }
});



// Function to update guide details
const updateGuide = () => {
  guideStore.updateGuide(guideId.value, guideData);
  eventStore.popupMessage('success', 'Guide updated successfully!'); // Show success toast
  route.push({ name: 'admin-guides-list' });
};


// ฟังก์ชันอนุมัติไกด์
const approveGuide = async (guideId) => {
  try {
    // อัปเดตสถานะใน 'guideApplications'
    await updateDoc(doc(db, 'guideApplications', guideId), {
      status: 'approved',
      updatedAt: serverTimestamp(),
    })

    // อัปเดตบทบาทใน 'users'
    await updateDoc(doc(db, 'users', guideId), {
      role: 'guide',
      applicationStatus: 'approved',
      isGuide: true, // อัปเดตเป็นไกด์
      updatedAt: serverTimestamp(),
    })

    showToast('อนุมัติไกด์สำเร็จ', 'success')
  } catch (error) {
    showToast('เกิดข้อผิดพลาดในการอนุมัติ: ' + error.message, 'error')
  }
}

// Load guide data on component mount
onMounted(() => {
  guideStore.fetchGuides()
})


// Computed guide list for display
const guideList = computed(() => guideStore.list)



// Function to delete a guide
const deleteGuide = async (id) => {
  if (confirm("Are you sure you want to delete this guide?")) {
    await guideStore.deleteGuide(id)
    showToast('Guide deleted successfully', 'success')
  }
}


// Function to format the "Updated At" date
const formatDate = (timestamp) => {
  if (!timestamp) return 'N/A'  // Handle missing timestamps

  // Check if the timestamp is a Firestore Timestamp object
  const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp)
  if (isNaN(date.getTime())) return 'Invalid Date'  // Handle invalid date

  return new Intl.DateTimeFormat('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}







// ฟังก์ชันแสดงการแจ้งเตือน
const showToast = (message, type) => {
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: 'top',
    position: 'right',
    backgroundColor: type === 'success' ? "linear-gradient(to right, #00b09b, #96c93d)" : "linear-gradient(to right, #f44336, #ff5722)"
  }).showToast()
}


</script>

<template>
   <AdminLayout>
    <div class="flex items-center justify-between my-6">
      <h2 class="text-3xl font-extrabold text-indigo-700 tracking-wide">Guide</h2>
    </div>

    <Table :headers="['Name', 'Role',  'Status', 'Updated At', 'Actions']">
      <tr v-for="(guide, index) in guideList" :key="guide.id" class="hover:bg-indigo-50 transition-colors duration-300 rounded-lg">
        <!-- Email -->
        <td class="p-2 text-base text-gray-800 font-medium">{{ guide.email }}</td>

        <!-- Role -->
        <td class="p-2 text-base text-gray-600 font-medium">{{ guide.role }}</td>

          <!-- UID Column: ซ่อนด้วยการไม่รวมคอลัมน์นี้ในตาราง -->
        <!-- ลบหรือซ่อนคอลัมน์ UID นี้ใน `<Table>`-->
      <!--  <td class="p-2 text-gray-600"> -->
          <!-- <span v-if="guide.role === 'guide'">{{ guide.uid }}</span> -->
          <!-- <span v-else class="text-gray-500">N/A</span> -->
       <!--   </td>   -->


         <!-- Status -->
         <td class="p-2">
          <span :class="guide.status === 'active' ? 'bg-green-200 text-green-800 border border-green-600' : 'bg-red-200 text-red-800 border border-red-600'"
            class="px-4 py-1 rounded-full text-sm font-semibold shadow-md flex items-center space-x-2">
            <span :class="guide.status === 'active' ? 'bg-green-500' : 'bg-red-500'" class="w-3 h-3 rounded-full"></span>
            <span>{{ guide.status }}</span>
          </span>
        </td>

        <!-- Updated At -->
        <td class="p-2 text-base text-gray-500">{{ formatDate(guide.updatedAt) }}</td>

        <!-- Actions -->
       <!-- Toggle Status button -->
        <td class="p-2 flex justify-around space-x-2">
          <!-- Profile button -->
          <RouterLink :to="{ name: 'guide-profile', params: { id: guide.id } }"
            class="flex items-center justify-center w-24 h-8 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105">
            Profile
          </RouterLink>

          <!-- Edit button -->
          <RouterLink :to="{ name: 'admin-guides-update', params: { id: guide.id } }"
            class="flex items-center justify-center w-24 h-8 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition duration-300 ease-in-out transform hover:scale-105">
            Edit
          </RouterLink>

      
        <!-- ปุ่ม Toggle Status -->
        <button @click="toggleStatus(guide.id)"
          :class="guide.status === 'active' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'"
          class="flex items-center justify-center w-24 h-8 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105 hover:opacity-90">
          <span class="flex items-center space-x-2">
            <i :class="guide.status === 'active' ? 'fas fa-times-circle' : 'fas fa-check-circle'"
              class="text-lg"></i>
            <span>
              {{ guide.status === 'active' ? 'Disable' : 'Enable' }}
            </span>
          </span>
        </button>


  <!-- Delete button -->
  <button @click="deleteGuide(guide.id)"
    class="flex items-center justify-center w-24 h-8 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition duration-300 ease-in-out transform hover:scale-105">
    Delete
  </button>
</td>

      </tr>
    </Table>


 <!-- Toast notifications -->
 <div v-if="eventStore.messages.length > 0" class="fixed bottom-5 right-5 space-y-4">
  <div v-for="(message, index) in eventStore.messages" :key="index" class="toast"
    :class="message.type === 'success' ? 'toast-success' : 'toast-error'">
    <i :class="message.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
    {{ message.message }}
  </div>
</div>


  </AdminLayout>
</template>



<style scoped>
.toast {
  padding: 14px 22px;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15), inset 0 0 10px rgba(255, 255, 255, 0.1);
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  opacity: 0;
  transform: translateX(50px);
  animation: fadeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, fadeOut 0.5s 2.8s forwards;
  transition: all 0.3s ease-in-out;
  overflow: hidden;
}

.toast::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 5px;
  border-radius: 12px 0 0 12px;
}

.toast-success::before {
  background-color: #28a745;
}

.toast-error::before {
  background-color: #e74c3c;
}

.toast-success {
  background: linear-gradient(145deg, #28a745, #218838);
  color: #fff;
}

.toast-error {
  background: linear-gradient(145deg, #e74c3c, #c0392b);
  color: #fff;
}

.toast i {
  margin-right: 10px;
  font-size: 18px;
}

.toast-success i {
  color: #fff;
}

.toast-error i {
  color: #fff;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeOut {
  to {
    opacity: 0;
    transform: translateX(50px);
  }
}

/* Glow effect */
.toast:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2), 0 0 20px rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}

</style>