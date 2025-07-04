<script setup>
import { onMounted, ref } from 'vue'
import UserLayout from '/src/components/layouts/UserLayout.vue'
import { useProductStore } from '/src/stores/user/product'
import { useRouter } from 'vue-router'
import { db } from '@/firebase'
import { collection, getDocs } from 'firebase/firestore'


const router = useRouter()
const products = ref([])
const productStore = useProductStore()

onMounted(async () => {
  const productCollection = collection(db, 'products')
  const productSnapshot = await getDocs(productCollection)
  products.value = productSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }))
  await productStore.loadProducts()
})



onMounted(async () => {
  await productStore.loadProducts()
})




const goToProvince = (routeName) => {
  if (!routeName) {
    console.error('Route name is undefined')
    return
  }
  console.log('Navigating to province:', routeName)
  router.push({ name: routeName }) // ไม่ต้องแปลงเป็นพิมพ์เล็ก
}



const goTojob = () => {
  router.push({ name: 'job' }) // เปลี่ยน "JobView" เป็น "job" ให้ตรงกับชื่อเส้นทาง
}




</script>


<template>
  <UserLayout>
    <div class="hero h-[80vh] bg-gradient-to-r from-purple-700 via-pink-500 to-red-500 text-white relative overflow-hidden">
      <div class="absolute inset-0 bg-opacity-70 bg-black"></div>
      <div class="hero-content text-center z-10 relative animate-fade-in">
        <div class="max-w-2xl mx-auto">
          <h1 class="text-6xl font-extrabold tracking-wider drop-shadow-xl mb-6 opacity-0 animate-slide-up">
            ค้นพบประเทศไทยไปกับไกด์ผู้เชี่ยวชาญ
          </h1>
          <p class="py-6 text-xl font-light drop-shadow-lg leading-relaxed opacity-0 animate-slide-up animation-delay-200">
            ให้ไกด์ผู้เชี่ยวชาญช่วยวางแผนการเดินทางส่วนตัวที่ครบครันและแสดงถึงความงดงามของจุดหมายปลายทางในประเทศไทย
          </p>

          <button 
            @click="goTojob" 
            class="btn btn-primary px-10 py-4 font-semibold text-xl rounded-full shadow-xl hover:bg-primary-focus hover:scale-105 hover:rotate-3 transition-all duration-300 animate-fade-in animation-delay-400">
            วางแผนการผจญภัยของคุณ
          </button>

        </div>
      </div>
    </div>

    <section class="py-16 bg-gray-100">
      <div class="container mx-auto py-16">
        <h2 class="text-5xl font-bold text-center mb-16">สำรวจจุดหมายปลายทางของเรา</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
          <div 
            v-for="product in productStore.filteredList" 
            :key="product.id" 
            class="rounded-lg shadow-lg bg-white overflow-hidden transition-all hover:shadow-2xl transform hover:scale-105 hover:bg-indigo-100">
            
            <img :src="product.imageUrl" alt="Product Image" class="w-full h-48 object-cover">
            <div class="p-6">
              <h3 class="text-2xl font-bold text-gray-800 mb-2">{{ product.name }}</h3>
              <p class="text-gray-600 mb-4">{{ product.about }}</p>

              <button 
                @click="goToProvince(product.route)" 
                class="btn btn-primary w-full py-2 text-lg font-semibold hover:bg-primary-focus hover:text-white transition-all duration-300">
                ดูรายละเอียด
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </UserLayout>
</template>


<style scoped>
@keyframes fade-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes slide-up {
  0% {
    transform: translateY(50px);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-fade-in {
  animation: fade-in 1s ease-out forwards;
}

.animate-slide-up {
  animation: slide-up 1s ease-out forwards;
}

.animation-delay-200 {
  animation-delay: 0.2s;
}

.animation-delay-400 {
  animation-delay: 0.4s;
}

.animation-delay-600 {
  animation-delay: 0.6s;
}

.card:hover {
  transform: translateY(-10px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.15);
}
</style>
