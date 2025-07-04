<script setup>
import { onMounted, ref, reactive, computed } from 'vue';
import { useAdminPromotionStore } from '@/stores/admin/promotion';
import { useEventStore } from '@/stores/event'; // Import event store
import { RouterLink, useRoute, useRouter } from 'vue-router';
import AdminLayout from '/src/components/layouts/AdminLayout.vue';

const promotionStore = useAdminPromotionStore();
const eventStore = useEventStore(); // Use event store for toast notifications

const route = useRoute();
const router = useRouter();

const promotionId = ref(-1);
let selectedPromotion = reactive({
  title: '',
  imageUrl: '',
  description: '',
  status: 'active', // Default to active status
  updatedAt: '', // Added updatedAt field for proper time handling
});

const formData = [
  { label: 'Title', model: 'title', type: 'text' },
  { label: 'Image URL', model: 'imageUrl', type: 'text' },
  { label: 'Description', model: 'description', type: 'textarea' },
  { label: 'Status', model: 'status', type: 'select', options: ['active', 'inactive'] },
];

const mode = computed(() => {
  return promotionId.value !== -1 ? 'Edit' : 'Add';
});

onMounted(async () => {
  if (route.params.id) {
    promotionId.value = route.params.id;
    const promotion = await promotionStore.getPromotion(promotionId.value); // Await the getPromotion function
    if (promotion) {
      Object.assign(selectedPromotion, promotion); // Populate selectedPromotion with promotion data
    } else {
      console.error("Promotion not found");
    }
  }
});

const updatePromotion = async () => {
  selectedPromotion.updatedAt = new Date().toISOString();

  if (promotionId.value !== -1) {
    await promotionStore.updatePromotion(promotionId.value, selectedPromotion);
    eventStore.popupMessage('success', 'Promotion updated successfully'); // Toast message for success
  } else {
    await promotionStore.addPromotion(selectedPromotion);
    eventStore.popupMessage('success', 'Promotion created successfully'); // Toast message for success
  }

  router.push({ name: 'admin-promotions-list' });
};
</script>

<template>
  <AdminLayout>
    <!-- Background with Gradient for Promotion -->
    <div class="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-300 via-purple-300 to-indigo-600 px-4 md:px-0">
      <div class="card w-full max-w-3xl p-8 bg-white shadow-xl rounded-3xl">
        <div class="text-3xl font-extrabold text-indigo-700 text-center mb-6">
          {{ mode }} Promotion
        </div>
        <div class="divider"></div>

        <!-- Form Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div v-for="form in formData" :key="form.model" class="form-control w-full">
            <label class="label">
              <span class="label-text text-lg font-medium text-gray-700">{{ form.label }}</span>
            </label>

            <input
              v-if="form.type === 'text'"
              :type="form.type"
              class="input input-bordered w-full rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-600"
              v-model="selectedPromotion[form.model]"
            />

            <textarea
              v-if="form.type === 'textarea'"
              class="textarea textarea-bordered w-full rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-600"
              v-model="selectedPromotion[form.model]"
            ></textarea>

            <select
              v-if="form.type === 'select'"
              class="select select-bordered w-full rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-600"
              v-model="selectedPromotion[form.model]"
            >
              <option v-for="option in form.options" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
          </div>
        </div>

        <!-- Buttons -->
        <div class="mt-6 flex justify-end space-x-4">
          <RouterLink to="/admin/promotions" class="btn bg-gray-100 text-gray-700 hover:bg-gray-200 px-6 py-2 rounded-full transition-all duration-300">
            Back
          </RouterLink>
          <button @click="updatePromotion" class="btn bg-indigo-600 text-white hover:bg-indigo-700 px-6 py-2 rounded-full transition-all duration-300">
            {{ mode }}
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>
