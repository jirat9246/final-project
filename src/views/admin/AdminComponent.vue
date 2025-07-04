<script setup>
import { useEventStore } from '/src/stores/event';

const eventStore = useEventStore();

// Function that handles data update
const updateData = () => {
  try {
    // Simulate data update logic here
    eventStore.popupMessage('success', 'Data updated successfully!');
  } catch (error) {
    eventStore.popupMessage('error', 'Failed to update data.');
  }
};
</script>

<template>
  <div>
    <button @click="updateData" class="btn btn-primary">Update Data</button>

    <!-- Toast notifications -->
    <div v-if="eventStore.messages.length > 0" class="fixed bottom-5 right-5 space-y-4">
      <div
        v-for="(message, index) in eventStore.messages"
        :key="index"
        class="toast"
        :class="message.type === 'success' ? 'toast-success' : 'toast-error'"
      >
        {{ message.message }}
      </div>
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
