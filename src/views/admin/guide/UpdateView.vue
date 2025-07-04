<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '/src/components/layouts/AdminLayout.vue'
import { useGuideStore } from '/src/stores/admin/guide'
import { useEventStore } from '/src/stores/event'
import { db } from '@/firebase'
import { getDoc, updateDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { v4 as uuidv4 } from 'uuid' // ใช้ uuid สำหรับสร้าง UID ของไกด์

const guideStore = useGuideStore()
const route = useRoute()
const router = useRouter()
const eventStore = useEventStore()

const guideId = ref(route.params.id)
const guideData = reactive({
  email: '', // เปลี่ยนเป็น email
  role: 'user', // ค่าเริ่มต้นเป็น 'user'
  status: 'inactive', // ค่าเริ่มต้นเป็น 'inactive'
  uid: '' // เพิ่ม UID สำหรับไกด์
})

const loadGuide = async () => {
  try {
    // ดึงข้อมูลไกด์จาก Firestore
    const userRef = doc(db, 'users', guideId.value)
    const docSnap = await getDoc(userRef)

    if (docSnap.exists()) {
      const userData = docSnap.data()
      guideData.email = userData.email || '' // แสดง email
      guideData.role = userData.role || 'user' // แสดง role
      guideData.status = userData.status || 'inactive' // แสดง status
      guideData.uid = userData.uid || '' // แสดง UID ถ้ามี
    }
  } catch (error) {
    console.error('Error loading guide:', error)
  }
}

const updateGuide = async () => {
  try {
    // ตรวจสอบการเปลี่ยนแปลงของ Role
    let newGuideUID = guideData.uid

    // ถ้าเปลี่ยนเป็นไกด์และไม่มี UID ให้สร้าง UID ใหม่
    if (guideData.role === 'guide' && !guideData.uid) {
      newGuideUID = uuidv4() // สร้าง UID ใหม่สำหรับไกด์
      guideData.uid = newGuideUID
    }

    // อัปเดตข้อมูลใน 'guideApplications' collection
    const guideRef = doc(db, 'guideApplications', guideId.value)
    await updateDoc(guideRef, {
      ...guideData,
      updatedAt: serverTimestamp(),
    })

    // อัปเดตข้อมูลใน 'users' collection
    const userRef = doc(db, 'users', guideId.value)
    await updateDoc(userRef, {
      ...guideData,
      updatedAt: serverTimestamp(),
    })

    // สร้างเอกสารใหม่ใน 'guides' collection สำหรับไกด์ที่มี UID ใหม่
    if (guideData.role === 'guide') {
      const guideCollectionRef = doc(db, 'guides', newGuideUID)
      await setDoc(guideCollectionRef, {
        uid: newGuideUID,
        email: guideData.email, // ใช้ email แทน fullname
        role: 'guide',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    }

    eventStore.popupMessage('success', 'Guide information updated successfully!')
    router.push({ name: 'admin-guides-list' })
  } catch (error) {
    console.error('Error updating guide:', error)
    eventStore.popupMessage('error', 'Failed to update guide information.')
  }
}

// Define form data for the form inputs
const formData = reactive([
  {
    label: 'Name',
    field: 'email',
    type: 'text',
  },
  {
    label: 'Role',
    field: 'role',
    type: 'select',
    dropdownList: ['user', 'guide'],
  },
  {
    label: 'Status',
    field: 'status',
    type: 'select',
    dropdownList: ['active', 'inactive'],
  },
])

onMounted(loadGuide)
</script>

<template>
  <AdminLayout>
    <div class="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-300 via-purple-300 to-indigo-600 px-4 md:px-0">
      <div class="card w-full max-w-3xl p-8 bg-white shadow-xl rounded-3xl">
        <div class="text-3xl font-extrabold text-indigo-700 text-center mb-6">
          Update Guide Information
        </div>
        <div class="divider"></div>

        <!-- Form Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div v-for="form in formData" :key="form.field" class="form-control w-full">
            <label class="label">
              <span class="label-text text-lg font-medium text-gray-700">{{ form.label }}</span>
            </label>

            <!-- Input field for text -->
            <input
              v-if="form.type === 'text'"
              v-model="guideData[form.field]"
              :type="form.type"
              class="input input-bordered w-full rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-600"
              :readonly="form.field === 'email'"
            />

            <!-- Select (dropdown) for select fields -->
            <select
              v-if="form.type === 'select'"
              v-model="guideData[form.field]"
              class="select select-bordered w-full rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option v-for="item in form.dropdownList" :key="item" :value="item">
                {{ item }}
              </option>
            </select>
          </div>
        </div>

        <!-- Buttons -->
        <div class="mt-6 flex justify-end space-x-4">
          <RouterLink to="/admin/guides" class="btn bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-2 rounded-full transition-all duration-300">
            Back
          </RouterLink>
          <button @click="updateGuide" class="btn bg-indigo-600 text-white hover:bg-indigo-700 px-6 py-2 rounded-full transition-all duration-300">
            Update
          </button>
        </div>
      </div>
    </div>

    <!-- Toast notifications -->
    <div v-if="eventStore.messages.length > 0" class="fixed bottom-5 right-5 space-y-4">
      <div
        v-for="(message, index) in eventStore.messages"
        :key="index"
        class="alert"
        :class="message.type === 'success' ? 'alert-success' : 'alert-error'"
      >
        {{ message.message }}
      </div>
    </div>
  </AdminLayout>
</template>
