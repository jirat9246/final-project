import { defineStore } from 'pinia';

export const useEventStore = defineStore('event', {
  state: () => ({
    messages: []
  }),
  actions: {
    popupMessage(type, message) {
      this.messages.push({ type, message });

      // Remove the message after 3 seconds
      setTimeout(() => {
        this.messages.shift();
      }, 3000);
    }
  }
});
