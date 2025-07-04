<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import UserLayout from '/src/components/layouts/UserLayout.vue';
import { useProductStore } from '/src/stores/user/product';
import { usePromotion } from '/src/stores/user/promotion';

// Create product and promotion stores
const productStore = useProductStore();
const promotionStore = usePromotion();

// Get the search query from the URL
const route = useRoute();
const searchText = ref('');

// Watch for changes in the search query
watch(() => route.query.q, (newSearchText) => {
  searchText.value = newSearchText;
  
  // Call filter functions for products and promotions
  productStore.filterProducts(searchText.value);
  promotionStore.filterPromotions(searchText.value);
}, { immediate: true });

// Computed property for filtered products (use the getter)
const filteredProducts = computed(() => productStore.filteredProducts);

// Computed property for filtered promotions
const filteredPromotions = computed(() => {
  return promotionStore.filteredList.length > 0 ? promotionStore.filteredList : [];
});
</script>

<template>
  <UserLayout>
    <div class="container mx-auto my-12">
      <!-- Search Result Heading -->
      <h1 class="text-3xl md:text-4xl font-extrabold text-center mb-10 text-gray-900 tracking-wide animate-fadeIn">
        ผลการค้นหา: <span class="text-indigo-600">{{ searchText }}</span>
      </h1>
      
      <!-- Products List -->
      <div v-if="filteredProducts.length" class="mb-16">
        <h2 class="text-3xl md:text-4xl font-semibold mb-8 text-gradient bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-500 to-blue-500">
          ผลการค้นหาสถานที่
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
          <div 
            v-for="product in filteredProducts" 
            :key="product.name" 
            class="bg-white p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <figure>
              <img :src="product.imageUrl || 'https://via.placeholder.com/400x200'" alt="Product Image" class="w-full h-48 object-cover rounded-lg mb-4 transition-transform duration-300 hover:scale-105 hover:brightness-110">
            </figure>
            <div>
              <h2 class="text-xl font-bold text-gray-900">{{ product.name }}</h2>
              <p class="text-gray-600 mt-2">{{ product.about || 'รายละเอียดเพิ่มเติม' }}</p>
              <button class="btn btn-primary mt-6 w-full py-3 text-lg font-semibold bg-indigo-500 text-white rounded-full hover:bg-indigo-600 hover:shadow-lg">
                ดูเพิ่มเติม
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Promotions List -->
      <div v-if="filteredPromotions.length" class="mb-16">
        <h2 class="text-3xl md:text-4xl font-semibold mb-8 text-gradient bg-clip-text bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500">
          ผลการค้นหาโปรโมชั่น
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
          <div 
            v-for="promotion in filteredPromotions" 
            :key="promotion.name" 
            class="bg-white p-6 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
            <figure>
              <img :src="promotion.imageUrl || 'https://via.placeholder.com/400x200'" alt="Promotion Image" class="w-full h-48 object-cover rounded-lg mb-4 transition-transform duration-300 hover:scale-105 hover:brightness-110">
            </figure>
            <div>
              <h2 class="text-xl font-bold text-gray-900">{{ promotion.name }}</h2>
              <p class="text-gray-600 mt-2">{{ promotion.about || 'รายละเอียดโปรโมชั่น' }}</p>
              <button class="btn btn-primary mt-6 w-full py-3 text-lg font-semibold bg-pink-500 text-white rounded-full hover:bg-pink-600 hover:shadow-lg">
                รับสิทธิ์
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Message when no results found -->
      <div v-if="!filteredProducts.length && !filteredPromotions.length" class="text-center text-gray-500 text-lg">
        ไม่พบผลลัพธ์สำหรับ "<span class="text-indigo-500">{{ searchText }}</span>"
      </div>
    </div>
  </UserLayout>
</template>

<style scoped>
.text-gradient {
  background: linear-gradient(to right, #a78bfa, #6366f1, #4f46e5);
  -webkit-background-clip: text;
  color: transparent;
}

h1, h2 {
  letter-spacing: 0.05em;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadeIn {
  animation: fadeIn 0.5s ease-out;
}

.btn {
  transition: all 0.3s ease-in-out;
}

.btn-primary:hover {
  transform: scale(1.05);
  box-shadow: 0px 4px 14px rgba(75, 85, 99, 0.25);
}

figure img {
  transition: all 0.3s ease;
}

figure img:hover {
  transform: scale(1.05);
  filter: brightness(1.1);
}

.bg-white {
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}
</style>
