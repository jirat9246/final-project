<script setup>
import { ref, onMounted, watch } from 'vue';
import { RouterLink, useRoute , useRouter } from 'vue-router';

import { useAccountStore } from '@/stores/account'

const menu = [

    {
        name: 'Dashboard',
        routeName: 'admin-dashboard'
    },
    {
        name: 'Product',
        routeName: 'admin-products-list'
    },
    {
        name: 'Promotion',
        routeName: 'admin-promotions-list'
    },
    {
        name: 'Payment',
        routeName: 'admin-payments-paymentverification'
    },
    {
        name: 'GuidePayment',
        routeName: 'admin-guidepayment-guidepaymentnotification'
    },
    {
        name: 'User',
        routeName: 'admin-users-list'
    },
    {
        name: 'Guide',
        routeName: 'admin-guides-list'
    },
 
  
]

const route = useRoute()
const router = useRouter()
const accountStore = useAccountStore()



const activeMenu = ref('')

onMounted(() => {
    activeMenu.value = route.name;
});

watch(route, () => {
    activeMenu.value = route.name;
});



const logout = async () => {
  try {
   await accountStore.logout()
   router.push({ name: 'login' })
  } catch (erro) {
    console.log('error', error)
  }

}



</script>


<template>
  <div class="drawer drawer-open min-h-screen bg-gradient-to-br from-blue-50 via-purple-100 to-indigo-200">
    <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />

    <!-- Main Content -->
    <div class="drawer-content flex flex-col mx-8 my-6 p-8 bg-white rounded-3xl shadow-2xl transition-all duration-500 hover:shadow-2xl transform hover:scale-105 hover:bg-gradient-to-br from-pink-50 to-purple-100 max-w-full min-h-screen overflow-y-auto">
      
      <!-- Chart Section -->
      <div class="mt-8 w-full">
        <slot></slot>
      </div>

    </div>

    <!-- Sidebar / Drawer -->
    <div class="drawer-side">
      <label for="my-drawer-2" class="drawer-overlay bg-black opacity-30"></label>

      <!-- Menu -->
      <ul class="menu flex flex-col justify-between p-6 w-72 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white min-h-full rounded-r-3xl shadow-2xl transition-all duration-500 transform hover:scale-105 space-y-4 animate-gradient-x overflow-auto">
        
        <!-- Title -->
        <li class="text-center mb-8">
          <a class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-pink-500 animate-pulse tracking-wide">
            Backoffice
          </a>
        </li>

        <!-- Menu Items -->
        <li v-for="menuItem in menu" :key="menuItem.routeName" class="relative group mb-5">
          <RouterLink
            :to="{ name: menuItem.routeName }"
            :class="menuItem.routeName === activeMenu ? 'bg-white text-indigo-600 shadow-lg scale-105' : 'text-white'"
            class="text-md font-semibold px-5 py-3 rounded-xl transition-all duration-300 flex items-center justify-between group-hover:bg-opacity-30 group-hover:bg-pink-600 group-hover:text-yellow-300 group-hover:shadow-lg transform group-hover:-translate-y-1 group-hover:scale-110"
          >
            {{ menuItem.name }}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-transform duration-300 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </RouterLink>
          <span class="absolute right-0 top-1/2 transform -translate-y-1/2 h-10 w-10 bg-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center items-center rounded-full shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </li>

        <!-- Logout -->
        <li>
          <a @click="logout" class="text-md font-semibold px-5 py-3 rounded-xl transition-all duration-300 text-white hover:bg-opacity-30 hover:bg-pink-600">Logout</a>
        </li>
      </ul>
    </div>
  </div>
</template>

<!-- Add CSS for gradient animation -->
<style>
  .animate-gradient-x {
    background-size: 200% 200%;
    animation: gradient-x 5s ease infinite;
  }

  @keyframes gradient-x {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
</style>

<style scoped>
.alert-success {
  background-color: #4caf50; /* สีเขียว */
  color: white;
  padding: 10px;
  border-radius: 5px;
}

.alert-error {
  background-color: #f44336; /* สีแดง */
  color: white;
  padding: 10px;
  border-radius: 5px;
}

.fixed {
  position: fixed;
  bottom: 20px;
  right: 20px;
}
</style>
