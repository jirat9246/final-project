import { defineStore } from 'pinia';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore'; 
import { db } from '@/firebase';

export const useAdminPromotionStore = defineStore('admin-promotion', {
  state: () => ({
    list: [],
  }),
  actions: {
    async loadPromotions() {
      const promotionSnapshot = await getDocs(collection(db, 'promotions'));
      const promotions = promotionSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort promotions by updatedAt descending
      promotions.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      this.list = promotions; // Set list to promotions loaded from Firestore
    },
    
    async addPromotion(promotionData) {
      promotionData.updatedAt = new Date().toISOString();
      try {
        const docRef = await addDoc(collection(db, 'promotions'), promotionData); // Add document to Firestore
        // Instead of pushing to the list, re-load promotions to ensure order
        await this.loadPromotions(); 
      } catch (error) {
        console.error("Error adding promotion: ", error);
      }
    },
    async updatePromotion(id, promotionData) {
      const promotionRef = doc(db, 'promotions', id);
      try {
        await updateDoc(promotionRef, {
          ...promotionData,
          updatedAt: new Date().toISOString()
        });
        await this.loadPromotions(); // Reload promotions after updating
      } catch (error) {
        console.error("Error updating promotion: ", error);
      }
    },
    async deletePromotion(id) {
      const promotionRef = doc(db, 'promotions', id);
      try {
        await deleteDoc(promotionRef); // Delete document from Firestore
        await this.loadPromotions(); // Reload promotions after deletion
      } catch (error) {
        console.error("Error deleting promotion: ", error);
      }
    },
    async getPromotion(id) {
      const promotionRef = doc(db, 'promotions', id);
      const promotionSnapshot = await getDoc(promotionRef);
      if (promotionSnapshot.exists()) {
        return { id: promotionSnapshot.id, ...promotionSnapshot.data() }; // Return promotion data with ID
      } else {
        console.error("Promotion not found");
        return null;
      }
    },
  },
});
