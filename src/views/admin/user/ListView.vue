<script setup>


import { onMounted } from 'vue'
import { useEventStore } from '/src/stores/event' // Import toast notification store
import { RouterLink } from 'vue-router'
import { useAdminUserStore } from '/src/stores/admin/user'
import AdminLayout from '/src/components/layouts/AdminLayout.vue'
import Table from '/src/components/Table.vue'

const adminUserStore = useAdminUserStore()
const eventStore = useEventStore() // Initialize the event store for toast notifications

// Fetch users from Firestore on component mount
onMounted(async () => {
  await adminUserStore.fetchUsers() // Call the fetchUsers action from Pinia store to get user data
})

// ฟังก์ชันแปลง timestamp เป็นรูปแบบวันที่และเวลาที่อ่านง่าย
const formatTimestamp = (timestamp) => {
  if (!timestamp) return 'N/A'; // If no timestamp, return 'N/A'
  
  // Check if timestamp is a Firestore Timestamp object
  if (timestamp.toDate) {
    const date = timestamp.toDate(); // Convert Firestore Timestamp to Date object
    return date.toLocaleString(); // Convert to readable date and time
  }

  // Handle if timestamp is a regular Date object
  if (timestamp instanceof Date) {
    return timestamp.toLocaleString();
  }

  return 'N/A'; // Fallback if none of the above
}


// Function to toggle the status of the user
const toggleStatus = (index) => {
  let selectedUser = { ...adminUserStore.list[index] }
  selectedUser.status = selectedUser.status === 'active' ? 'inactive' : 'active'

  adminUserStore.$patch({
    list: adminUserStore.list.map((user, i) => (i === index ? selectedUser : user)),
  })

  eventStore.popupMessage('success', `User status updated to ${selectedUser.status}`)
}

// Function to delete a user
const deleteUser = (index) => {
  if (confirm('Are you sure you want to delete this user?')) {
    adminUserStore.$patch({
      list: adminUserStore.list.filter((_, i) => i !== index), // Remove user from list
    })

    eventStore.popupMessage('success', 'User deleted successfully!')
  }
}


</script>

<template>
  <AdminLayout>



    <div class="flex items-center justify-between my-6">
      <h2 class="text-4xl font-extrabold text-indigo-700 tracking-wide">User</h2>
    </div>

    <Table :headers="['Name', 'Role', 'Status', 'Update At', 'Actions']">
      <tr v-for="(user, index) in adminUserStore.list" :key="index" class="hover:bg-indigo-50 transition-colors duration-300 rounded-lg">
        <!-- Full Name or Email -->
        <td class="p-4 text-lg text-gray-800 font-medium">
          {{ user.fullname || user.email }}
        </td>

        <!-- Role -->
        <td class="p-4 text-lg text-gray-600 font-medium">{{ user.role }}</td>

        <!-- Status with conditional color classes -->
        <td class="p-4">
          <span
            :class="{
              'bg-green-200 text-green-800 border border-green-600': user.status === 'active',
              'bg-red-200 text-red-800 border border-red-600': user.status === 'inactive',
            }"
            class="px-5 py-2 rounded-full text-sm font-semibold shadow-md flex items-center space-x-2"
          >
            <span :class="user.status === 'active' ? 'bg-green-500' : 'bg-red-500'" class="w-3 h-3 rounded-full"></span>
            <span>{{ user.status }}</span>
          </span>
        </td>

        <!-- Updated At -->
        <td class="p-4 text-lg text-gray-500">{{ formatTimestamp(user.updateAt) }}</td>

        <!-- Actions -->
        <td class="p-4">
          <div class="flex justify-around space-x-4">
            <!-- Edit button -->
            <RouterLink
              :to="{ name: 'admin-users-update', params: { id: user.id } }"
              class="flex items-center justify-center w-28 h-10 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition duration-300 ease-in-out transform hover:scale-105"
            >
              <span class="text-sm font-semibold">Edit</span>
            </RouterLink>

            <!-- Toggle Status button -->
            <button
              class="flex items-center justify-center w-28 h-10 rounded-full shadow-lg transition duration-300 ease-in-out transform hover:scale-105"
              :class="user.status === 'active' ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-green-500 text-white hover:bg-green-600'"
              @click="toggleStatus(index)"
            >
              <span class="text-sm font-semibold">{{ user.status === 'active' ? 'Disable' : 'Enable' }}</span>
            </button>

            <!-- Delete button -->
            <button
              class="flex items-center justify-center w-28 h-10 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition duration-300 ease-in-out transform hover:scale-105"
              @click="deleteUser(index)"
            >
              <span class="text-sm font-semibold">Delete</span>
            </button>
          </div>
        </td>
      </tr>
    </Table>

     <!-- Toast notifications -->
     <div v-if="eventStore.messages.length > 0" class="fixed bottom-5 right-5 space-y-4">
      <div
        v-for="(message, index) in eventStore.messages"
        :key="index"
        class="toast"
        :class="message.type === 'success' ? 'toast-success' : 'toast-error'"
      >
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
