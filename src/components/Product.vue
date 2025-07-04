<script setup>
import { defineProps } from 'vue'


defineProps({
    products: Array
})
</script>
<template>

  
<section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 p-8">
  <div 
    v-for="product in products" 
    class="card bg-white shadow-lg hover:shadow-2xl transition-shadow duration-300 transform hover:scale-105 rounded-lg overflow-hidden"
  >
    <!-- Image Section -->
    <figure class="h-48 overflow-hidden">
      <img 
        class="w-full h-full object-cover transition-transform duration-500 hover:scale-110" 
        :src="product.imageUrl" 
        alt="Product Image" 
      />
    </figure>

    <!-- Card Body -->
    <div class="card-body p-6">
      <h2 class="card-title text-2xl font-semibold text-gray-800 mb-2">{{ product.name }}</h2>
      <p class="text-gray-600 mb-4">{{ product.about }}</p>
      <div class="card-actions justify-end">
        <button class="btn btn-primary px-4 py-2 text-white rounded-full shadow-md hover:bg-primary-focus transition-all duration-300">
          ดูเพิ่มเติม
        </button>
      </div>
    </div>
  </div>
</section>



</template>