<script setup>
import { onMounted, ref, reactive, computed } from 'vue';
import { useAdminProductStore } from '/src/stores/admin/product';
import { useEventStore } from '/src/stores/event';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import AdminLayout from '/src/components/layouts/AdminLayout.vue';

const productStore = useAdminProductStore();
const eventStore = useEventStore();

const route = useRoute();
const router = useRouter();

const productId = ref(null);
const selectedProduct = reactive({
  name: '',
  imageUrl: '',
  about: '',
  status: 'open',
  province: '', // New field for province
  updatedAt: '',
})

const formData = [
  { label: 'Name', model: 'name', type: 'text' },
  { label: 'Image URL', model: 'imageUrl', type: 'text' },
  { label: 'About', model: 'about', type: 'textarea' },
  { label: 'Route', model: 'route', type: 'text' }, // ฟิลด์ Route ใหม่
  { label: 'Status', model: 'status', type: 'select', options: ['open', 'close'] },
]


const mode = computed(() => (productId.value ? 'Edit' : 'Add'));

onMounted(async () => {
  if (route.params.id) {
    productId.value = route.params.id;
    const product = await productStore.getProduct(productId.value); 
    if (product) {
      Object.assign(selectedProduct, product); 
    } else {
      console.error("Product not found");
    }
  }
})


const updateProduct = async () => {
  selectedProduct.updatedAt = new Date().toISOString();

  if (productId.value) {
    await productStore.updateProduct(productId.value, selectedProduct)
    eventStore.popupMessage('success', 'Update Product successful!')
  } else {
    await productStore.addProduct(selectedProduct)
    eventStore.popupMessage('success', 'Create Product successful!')
  }

  router.push({ name: 'admin-products-list' })
}
</script>

<template>
  <AdminLayout>
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-300 via-purple-300 to-indigo-600 px-4 md:px-0">
      <div class="card w-full max-w-2xl p-8 bg-white shadow-xl rounded-3xl">
        <div class="text-3xl font-extrabold text-indigo-700 text-center mb-6">
          {{ mode }} Product
        </div>
        <div class="divider"></div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div v-for="form in formData" :key="form.model" class="form-control w-full">
            <label class="label">
              <span class="label-text text-lg font-medium text-gray-700">{{ form.label }}</span>
            </label>

            <input
              v-if="form.type === 'text'"
              :type="form.type"
              class="input input-bordered w-full rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-600"
              v-model="selectedProduct[form.model]"
            />


          <textarea
              v-if="form.type === 'textarea'"
              class="textarea textarea-bordered w-full rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-600"
              v-model="selectedProduct[form.model]"
            ></textarea>

            <select
              v-if="form.type === 'select'"
              class="select select-bordered w-full rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-600"
              v-model="selectedProduct[form.model]"
            >
              <option v-for="option in form.options" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
          </div>
        </div>

        <div class="mt-6 flex justify-end space-x-4">
          <RouterLink to="/admin/products" class="btn bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-2 rounded-full transition-all duration-300">
            Back
          </RouterLink>
          <button @click="updateProduct" class="btn bg-indigo-600 text-white hover:bg-indigo-700 px-6 py-2 rounded-full transition-all duration-300">
            {{ mode }}
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>
