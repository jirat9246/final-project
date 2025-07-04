import { defineStore } from 'pinia'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'

export const useProductStore = defineStore('product', {
  state: () => ({
    list: [], // รายการสินค้าทั้งหมด
    filteredList: [], // รายการสินค้าที่ถูกกรอง
  }),
  actions: {
    async loadProducts() {
      const productSnapshot = await getDocs(collection(db, 'products'))
      const products = productSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      this.list = products
      this.filteredList = products
    },
    filterByProvince(province) {
      this.filteredList = province 
        ? this.list.filter(product => product.route === province)
        : this.list
    },
  },
})
