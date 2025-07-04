<script setup>
import { defineProps } from 'vue';

const props = defineProps({
  headers: {
    type: Array,
    required: true,
  },
});
</script>

<template>
  <div class="overflow-x-auto">
    <table class="table table-zebra w-full rounded-lg shadow-lg">
      <thead class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white">
        <tr>
          <!-- Loop through headers provided as props -->
          <th v-for="(header, index) in headers" :key="index" class="p-4 text-left">
            {{ header }}
          </th>
        </tr>
      </thead>
      <tbody>
        <!-- Slot for dynamically inserting table rows -->
        <slot></slot>
      </tbody>
    </table>
  </div>
</template>

