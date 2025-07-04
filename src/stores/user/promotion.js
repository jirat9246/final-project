import { defineStore } from 'pinia'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'

export const usePromotion = defineStore('promotion', {
  state: () => ({
    list: [],
    filteredList: [],
  }),
  actions: {
    async loadPromotions() {
      const promotionSnapshot = await getDocs(collection(db, 'promotions'))
      this.list = promotionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      this.filteredList = this.list // Initialize filtered list
    },
    filterPromotions(searchText) {
      this.filteredList = this.list.filter(promotion =>
        promotion.title.toLowerCase().includes(searchText.toLowerCase())
      );
    },
  },
})


