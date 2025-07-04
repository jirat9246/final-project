<script setup>
import UserLayout from '/src/components/layouts/UserLayout.vue';
import { ref, computed, watch, onMounted } from 'vue';
import { usePromotion } from '/src/stores/user/promotion';

// Store ของโปรโมชั่น
const promotionStore = usePromotion();

// ข้อความค้นหาที่ดึงมาจาก UserLayout.vue
const searchText = ref('');

// ฟังก์ชันที่เรียกใช้เพื่อโหลดโปรโมชั่น
onMounted(async () => {
  await promotionStore.loadPromotions(); // โหลดโปรโมชั่นเมื่อคอมโพเนนต์ถูกเมาท์
});

// Watcher เพื่อตรวจจับการเปลี่ยนแปลงของ searchText และเรียกใช้ฟังก์ชัน filterPromotions
watch(searchText, (newVal) => {
  promotionStore.filterPromotions(newVal);
});

// กรองโปรโมชั่นจาก filteredList หรือ list
const filteredPromotions = computed(() => {
  return promotionStore.filteredList.length > 0
    ? promotionStore.filteredList
    : promotionStore.list;
});
</script>

<template>
  <UserLayout v-model:search="searchText">
    <div class="container mx-auto my-12">
      <h1 class="text-5xl font-extrabold text-center mb-10 text-indigo-600 tracking-wider">โปรโมชั่นพิเศษ</h1>

      <!-- Promotions List -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        <div 
          v-for="promotion in filteredPromotions" 
          :key="promotion.id"
          class="relative group bg-gradient-to-tr from-blue-50 via-white to-blue-50 shadow-xl rounded-lg overflow-hidden transition-transform transform hover:scale-105 hover:shadow-2xl hover:bg-gradient-to-bl">
          
          <!-- Promotion Image -->
          <figure class="relative">
            <img :src="promotion.imageUrl" alt="Promotion Image" class="w-full h-56 object-cover rounded-t-lg transition-opacity duration-300 group-hover:opacity-90">
            <span v-if="promotion.status !== 'active'" class="absolute inset-0 bg-black bg-opacity-50 flex justify-center items-center text-white text-2xl font-extrabold tracking-wide">
              ปิดบริการชั่วคราว
            </span>
          </figure>
          
          <!-- Promotion Info -->
          <div class="p-6 bg-white rounded-b-lg shadow-inner transition-colors duration-300">
            <h2 class="text-2xl font-bold text-gray-900 group-hover:text-indigo-600">{{ promotion.title }}</h2>
            <p class="text-sm mt-2" :class="promotion.status === 'active' ? 'text-green-500' : 'text-red-500'">
              {{ promotion.status === 'active' ? 'พร้อมให้บริการ' : 'ปิดบริการชั่วคราว' }}
            </p>

            <!-- Button to Claim -->
            <div class="mt-6 flex justify-end">
              <button 
                class="btn btn-primary py-3 px-6 w-full sm:w-auto text-lg font-semibold shadow-lg hover:bg-indigo-600 transition-all duration-300 ease-in-out disabled:opacity-50" 
                :disabled="promotion.status !== 'active'">
                {{ promotion.status === 'active' ? 'รับสิทธิ์' : 'ไม่สามารถรับสิทธิ์ได้' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
  </UserLayout>
</template>
