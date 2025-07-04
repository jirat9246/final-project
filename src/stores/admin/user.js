import { defineStore } from 'pinia'
import { collection, getDocs, setDoc, updateDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase' // Ensure Firestore is correctly imported

export const useAdminUserStore = defineStore('admin-user', {
  state: () => ({
    list: [], // Initially empty, will be populated by Firestore data
  }),
  actions: {
    // Fetch users from Firestore
    async fetchUsers() {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'))
        this.list = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          updateAt: doc.data().updateAt ? doc.data().updateAt.toDate() : null
        }))
        console.log(this.list)
      } catch (error) {
        console.error("Error fetching users:", error)
      }
    },

    // Get a specific user by ID from the list
    getUser(id) {
      return this.list.find(user => user.id === id)
    },

    // Update user in the local list and optionally in local storage
    updateUser(id, userData) {
      const index = this.list.findIndex(user => user.id === id)
      if (index !== -1) {
        const fields = ['fullname', 'role', 'status']
        fields.forEach(field => {
          if (userData[field]) {
            this.list[index][field] = userData[field]
          }
        })
        this.list[index].updateAt = new Date().toISOString()
        localStorage.setItem('users', JSON.stringify(this.list)) // Optional: persist locally
      }
    },

    // Update user role to guide but only if they are currently a user
    async updateUserRoleToGuide(id) {
      try {
        const userRef = doc(db, 'users', id)
        const userSnap = await getDoc(userRef)

        if (userSnap.exists()) {
          const userData = userSnap.data()

          // Transfer all fields from 'users' to 'guides'
          const guideRef = doc(db, 'guides', id)
          await setDoc(guideRef, {
            ...userData, // Copy all fields from users to guides
            role: 'guide', // Set role to guide
            uid: id,
            createdAt: userData.createdAt || serverTimestamp(),
            updatedAt: serverTimestamp(),
          }, { merge: true }) // Use merge to include existing data

          // Update role in users collection
          await updateDoc(userRef, { role: 'guide', uid: id })

          console.log('User role updated to guide and synced to guides')
        } else {
          console.log('User data not found in users collection')
        }
      } catch (error) {
        console.error('Error updating user to guide:', error)
      }
    },
  }
})
