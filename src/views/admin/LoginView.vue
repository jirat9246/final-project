<script setup>
import { useRouter } from 'vue-router'
import { ref } from 'vue'
import { useAccountStore } from '@/stores/account'
import { useEventStore } from '@/stores/event';


const router = useRouter()
const accountStore = useAccountStore()
const eventStore = useEventStore()


const email = ref ('')
const password = ref ('')


const login = async () => {
  try { 
    await accountStore.signInAdmin(email.value, password.value);
    router.push({ name: 'admin-dashboard' });
  } catch (error) {
    eventStore.popupMessage('error', error.message); // แสดงข้อผิดพลาด
  }
}




</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-purple-100 to-indigo-200 flex items-center justify-center">
    <div class="card bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full">
      <h2 class="text-3xl font-bold text-center text-indigo-600 mb-6">Login</h2>
      
      <div class="mb-6">
        <div class="form-control w-full mt-4">
          <label class="label">
            <span class="label-text text-gray-700">Email Address</span>
          </label>
          <input v-model="email"
            type="email"
            placeholder="Enter your email"
            class="input input-bordered input-primary w-full rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
        
        <div class="form-control w-full mt-4">
          <label class="label">
            <span class="label-text text-gray-700">Password</span>
          </label>
          <input v-model="password"
            type="password"
            placeholder="Enter your password"
            class="input input-bordered input-primary w-full rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>
      </div>

      <!-- Error message -->
      <p class="text-center text-error mb-4"></p>

      <!-- Login button -->
      <button @click="login" class="btn btn-primary w-full rounded-full text-white hover:bg-indigo-700 transition-all duration-300">
        Login
      </button>


      </div>
    </div>


    <div v-if="eventStore.messages.length > 0" class="fixed bottom-5 right-5 space-y-4">
      <div v-for="(message, index) in eventStore.messages" :key="index" class="toast" :class="message.type === 'success' ? 'toast-success' : 'toast-error'">
        <i :class="message.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
        {{ message.message }}
      </div>
    </div>
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
