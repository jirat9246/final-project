<script setup>

import { useEventStore } from '/src/stores/event'; // Importing event store for notifications
import { ref, reactive, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAdminUserStore } from '/src/stores/admin/user'; // Importing the user store to manage admin users
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase'; // Import Firestore instance

// Initialize necessary stores and router functionalities
const eventStore = useEventStore();
const adminUserStore = useAdminUserStore();
const route = useRoute();
const router = useRouter();

// Define form fields with labels and field names
const formData = reactive([
  { label: 'Name', field: 'fullname', type: 'text' },
  { label: 'Role', field: 'role', type: 'select', dropdownList: ['admin', 'user', 'guide'] },
  { label: 'Status', field: 'status', type: 'select', dropdownList: ['active', 'inactive'] },
]);

// Data for user form
const userData = reactive({ fullname: '', role: '', status: '' });
const userId = ref(null); // Ref to track the user ID

// Fetch the user data when the component is mounted and when there's a valid userId from route params
onMounted(() => {
  if (route.params.id) {
    userId.value = route.params.id;
    const selectedUser = adminUserStore.getUser(userId.value);
    if (selectedUser) {
      // หาก fullname ไม่มีค่า ให้ใช้ email แทน
      userData.fullname = selectedUser.fullname || selectedUser.email;
      userData.role = selectedUser.role;
      userData.status = selectedUser.status;
    }
  }
});

// Function to handle updating the user
const updateUser = async () => {
  if (userId.value !== null) {
    try {
      // Update user in Firestore with serverTimestamp for updateAt
      const userRef = doc(db, 'users', userId.value);
      await updateDoc(userRef, {
        ...userData,
        updateAt: serverTimestamp(), // ใช้ serverTimestamp() แทนการใช้วันที่จาก client
      });

      // Update user in Pinia store
      adminUserStore.updateUser(userId.value, userData);

      // Show success message
      eventStore.popupMessage('success', 'User updated successfully!');
      
      // Redirect to the users list page
      router.push({ name: 'admin-users-list' });
    } catch (error) {
      eventStore.popupMessage('error', 'Failed to update user.');
      console.error("Error updating user:", error);
    }
  } else {
    eventStore.popupMessage('error', 'Failed to update user. User ID is missing.');
  }
};

</script>




<template>
  <AdminLayout>

    
    <div class="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-300 via-purple-300 to-indigo-600 px-4 md:px-0">
      <div class="card w-full max-w-3xl p-8 md:p-10 lg:p-12 bg-white shadow-2xl rounded-3xl border-t-8 border-indigo-500 transition-transform duration-500 hover:scale-105">
        <div class="text-3xl lg:text-4xl font-extrabold text-indigo-600 text-center mb-8">
          Update User Information
        </div>
        <div class="divider"></div>

        <!-- Form Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <!-- Loop over formData -->
          <div v-for="form in formData" :key="form.field" class="form-control w-full">
            <label class="label">
              <span class="label-text text-lg md:text-xl font-semibold text-gray-800">{{ form.label }}</span>
            </label>

            <!-- Input field for text -->
            <input
              v-if="form.type === 'text'"
              v-model="userData[form.field]"
              :type="form.type"
              class="input input-bordered w-full focus:outline-none focus:ring-4 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
            />

            <!-- Select (dropdown) for select fields -->
            <select
              v-if="form.type === 'select'"
              v-model="userData[form.field]"
              class="select select-bordered w-full focus:outline-none focus:ring-4 focus:ring-indigo-400 focus:border-transparent transition-all duration-300"
            >
              <option v-for="item in form.dropdownList" :key="item" :value="item">
                {{ item }}
              </option>
            </select>
          </div>
        </div>

        <!-- Buttons -->
        <div class="mt-6 flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
          <RouterLink to="/admin/users" class="btn btn-ghost text-gray-600 hover:text-indigo-600 transition-colors duration-300">
            Back
          </RouterLink>
          <button
            @click="updateUser"
            class="btn bg-indigo-500 text-white px-8 py-3 font-bold rounded-full shadow-xl hover:bg-indigo-600 hover:shadow-2xl transition-all duration-300"
          >
            Update
          </button>
        </div>
      </div>
    </div>

    <!-- Toast notifications -->
    <div v-if="eventStore.messages.length > 0" class="fixed bottom-5 right-5 space-y-4">
      <div v-for="(message, index) in eventStore.messages" :key="index" class="alert" :class="message.type === 'success' ? 'alert-success' : 'alert-error'">
        {{ message.message }}
      </div>
    </div>


  </AdminLayout>
</template>
