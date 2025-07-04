import { defineStore } from 'pinia'
import { 
  collection, getDocs, addDoc, updateDoc, doc, deleteDoc, getDoc, query, where 
} from 'firebase/firestore' 
import { db } from '@/firebase'

export const useAdminProductStore = defineStore('admin-product', {
  state: () => ({
    list: [],
  }),
  actions: {
    // Load all products
    async loadProducts() {
      try {
        const productSnapshot = await getDocs(collection(db, 'products'))
        const products = productSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }))
        products.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)) // Sort by updatedAt descending
        this.list = products // Set the list to loaded products
      } catch (error) {
        console.error("Error loading products: ", error)
      }
    },

    // Add a new product
    async addProduct(productData) {
      productData.updatedAt = new Date().toISOString() // Set updatedAt to current date
      try {
        const docRef = await addDoc(collection(db, 'products'), productData)
        this.list.push({ id: docRef.id, ...productData }) // Push new product to the list
      } catch (error) {
        console.error("Error adding product: ", error)
      }
    },

    // Update an existing product
    async updateProduct(id, productData) {
      const productRef = doc(db, 'products', id)
      try {
        await updateDoc(productRef, {
          ...productData,
          updatedAt: new Date().toISOString(), // Update the updatedAt field
        })
        await this.loadProducts() // Reload products after updating
      } catch (error) {
        console.error("Error updating product: ", error)
      }
    },

    // Delete a product
    async deleteProduct(id) {
      const productRef = doc(db, 'products', id)
      try {
        await deleteDoc(productRef) // Delete the document from Firestore
        await this.loadProducts() // Reload products after deletion
      } catch (error) {
        console.error("Error deleting product: ", error)
      }
    },

    // Get a specific product by ID
    async getProduct(id) {
      const productRef = doc(db, 'products', id)
      try {
        const productSnapshot = await getDoc(productRef)
        if (productSnapshot.exists()) {
          return { id: productSnapshot.id, ...productSnapshot.data() }
        } else {
          console.error("Product not found")
          return null
        }
      } catch (error) {
        console.error("Error getting product: ", error)
        return null
      }
    },

    // Load products filtered by province
    async loadProvinceProducts(province) {
      try {
        const q = query(collection(db, 'products'), where('name', '==', province))
        const productSnapshot = await getDocs(q)
        this.list = productSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      } catch (error) {
        console.error("Error loading products by province: ", error)
      }
    },
  },
})
