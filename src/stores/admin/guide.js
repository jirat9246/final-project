import { defineStore } from 'pinia'
import { db } from '@/firebase' 
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc } from 'firebase/firestore'

export const useGuideStore = defineStore('guide', {
  state: () => ({
    list: [], // List for guides
  }),

  actions: {
    // Fetch all guides from Firestore
    async fetchGuides() {
      try {
        const guidesCollection = collection(db, 'guideApplications')
        const guideSnapshot = await getDocs(guidesCollection)
        this.list = guideSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      } catch (error) {
        console.error('Error fetching guides:', error)
      }
    },

    // Add a new guide to Firestore
    async addGuide(guideData) {
      try {
        guideData.updatedAt = new Date().toISOString() 
        const guidesCollection = collection(db, 'guideApplications')
        await addDoc(guidesCollection, guideData)
        await this.fetchGuides() 
      } catch (error) {
        console.error('Error adding guide:', error)
      }
    },

    // Update an existing guide in Firestore
    async updateGuide(id, guideData) {
      try {
        const guideRef = doc(db, 'guideApplications', id)
        guideData.updatedAt = new Date().toISOString() 
        await updateDoc(guideRef, guideData)
        await this.fetchGuides() 
      } catch (error) {
        console.error('Error updating guide:', error)
      }
    },

    // Toggle the status of a guide in Firestore and transfer to 'guides' collection
    async toggleStatus(id) {
      try {
        const guide = this.list.find(guide => guide.id === id)
        if (guide) {
          const guideRef = doc(db, 'guideApplications', id)
          const newStatus = guide.status === 'active' ? 'inactive' : 'active'
          await updateDoc(guideRef, { status: newStatus, updatedAt: new Date().toISOString() })

          // Check if the role is 'guide' and transfer to 'guides' collection
          if (newStatus === 'active' && guide.role === 'guide') {
            const userRef = doc(db, 'users', id)
            const userSnapshot = await getDoc(userRef)

            if (userSnapshot.exists()) {
              const userData = userSnapshot.data()
              const guideData = {
                ...userData,
                ...guide,
                updatedAt: new Date().toISOString()
              }

              // Add or update the document in 'guides' collection
              const guideDocRef = doc(db, 'guides', id)
              await setDoc(guideDocRef, guideData, { merge: true })
              console.log(`User data transferred to 'guides' collection for ID: ${id}`)
            } else {
              console.warn('User data not found in users collection')
            }
          }

          await this.fetchGuides() 
        }
      } catch (error) {
        console.error('Error toggling guide status:', error)
      }
    },

    // Delete a guide from Firestore
    async deleteGuide(id) {
      try {
        const guideRef = doc(db, 'guideApplications', id)
        await deleteDoc(guideRef)
        await this.fetchGuides() 
      } catch (error) {
        console.error('Error deleting guide:', error)
      }
    },
  },
})
