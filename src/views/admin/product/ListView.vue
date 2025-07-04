<script setup>
import { onMounted } from 'vue'; // Import onMounted
import { RouterLink } from 'vue-router';
import AdminLayout from '/src/components/layouts/AdminLayout.vue';
import { useAdminProductStore } from '@/stores/admin/product';
import { useEventStore } from '@/stores/event';

import Edit from '/src/components/icons/Edit.vue';
import Trash from '/src/components/icons/Trash.vue';
import Table from '/src/components/Table.vue';

const adminProduct = useAdminProductStore();
const eventStore = useEventStore();

const deleteProduct = (id) => {
  if (confirm('Are you sure you want to delete this product?')) {
    adminProduct.deleteProduct(id);
    eventStore.popupMessage('success', 'Product deleted successfully!');
  } else {
    eventStore.popupMessage('error', 'Product deletion canceled.');
  }
};

// Call loadProducts when the component is mounted
onMounted(async () => {
  await adminProduct.loadProducts(); // Load products when the component mounts
  console.log("Product list:", adminProduct.list); // Log the product list
});


</script>


<template>
  <AdminLayout>

    <div class="flex items-center justify-between my-4">
      <div class="text-4xl font-bold text-indigo-700">Product</div>
      <RouterLink :to="{ name: 'admin-products-create' }" class="btn bg-indigo-600 text-white rounded-full px-6 py-2 shadow-md hover:bg-indigo-700 transition duration-300">
        Add New
      </RouterLink>
    </div>

    <div class="overflow-x-auto">
      <Table :headers="['Name', 'Image', 'Status', 'Updated At', 'Actions']">
        <tr v-for="product in adminProduct.list" :key="product.id" class="hover:bg-gray-50 transition-all">
          <td class="p-4 text-sm font-medium text-gray-900">{{ product.name }}</td>
          <td class="p-4">
            <img v-if="product.imageUrl" :src="product.imageUrl" class="w-12 h-12 rounded-full object-cover shadow-md" />
            <span v-else class="text-gray-500">No image</span>
          </td>
          <td class="p-4">
            <div :class="{
              'bg-green-500 text-white': product.status.toLowerCase() === 'open',
              'bg-red-500 text-white': product.status.toLowerCase() === 'close'
            }" class="px-4 py-1 rounded-full text-center text-sm font-semibold">
              {{ product.status.toLowerCase() === 'open' ? 'Open' : 'Close' }}
            </div>
          </td>
          <td class="p-4 text-sm text-gray-500">{{ new Date(product.updatedAt).toLocaleDateString() }}</td>
          <td class="p-4">
            <div class="flex gap-2">
              <RouterLink :to="{ name: 'admin-products-update', params: { id: product.id } }" class="bg-blue-500 text-white px-4 py-2 rounded-full shadow-md hover:bg-blue-600 transition duration-300">
                <Edit />
              </RouterLink>
              <button @click="deleteProduct(product.id)" class="bg-red-500 text-white px-4 py-2 rounded-full shadow-md hover:bg-red-600 transition duration-300">
                <Trash />
              </button>
            </div>
          </td>
        </tr>
      </Table>
    </div>

    <div v-if="eventStore.messages.length > 0" class="fixed bottom-5 right-5 space-y-4">
      <div v-for="(message, index) in eventStore.messages" :key="index" class="toast" :class="message.type === 'success' ? 'toast-success' : 'toast-error'">
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
