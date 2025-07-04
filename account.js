import { defineStore } from 'pinia'
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword 
} from 'firebase/auth'
import { auth, db as firestore } from '@/firebase'
import { 
  doc, 
  setDoc, 
  serverTimestamp, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs // เพิ่มการนำเข้าตรงนี้
} from 'firebase/firestore'

import { defaultProfileImageUrl } from '@/stores/user/profileStore'


const provider = new GoogleAuthProvider()

export const useAccountStore = defineStore('account', {
  state: () => ({
    isLoggedIn: false,
    isAdmin: false,
    user: {
      name: 'Guest',
      displayName: '', // เพิ่ม displayName ใน state
      profileImage: '',
      role: 'guest',
      uid: null,
    },
    errorMessage: ''
  }),
  actions: {
    async checkAuth() {
      return new Promise(resolve => {
        onAuthStateChanged(auth, async user => {
          if (user) {
            const userDoc = await getDoc(doc(firestore, 'users', user.uid))
            if (userDoc.exists()) {
              this.user = { ...user, ...userDoc.data() }
              this.isAdmin = this.user.role === 'admin'
              this.isLoggedIn = true
              localStorage.setItem('isLoggedIn', 'true')
              localStorage.setItem('user', JSON.stringify(this.user))
            }
            resolve(true)
          } else {
            localStorage.removeItem('isLoggedIn')
            localStorage.removeItem('user')
            this.isLoggedIn = false
            resolve(false)
          }
        })
      })
    },

    async signInWithGoogle() {
      try {
        const result = await signInWithPopup(auth, provider)
        this.user = result.user
    
        const userDoc = await getDoc(doc(firestore, 'users', this.user.uid))
        if (userDoc.exists()) {
          this.user = { ...this.user, ...userDoc.data() }
          this.isAdmin = this.user.role === 'admin'
        }

        this.isLoggedIn = true
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('user', JSON.stringify(this.user))
        return result.user
      } catch (error) {
        this.errorMessage = error.message
        throw error
      }
    },

    async signInAdmin(email, password) {
      try {
        const result = await signInWithEmailAndPassword(auth, email, password)
        this.user = result.user

        const userDoc = await getDoc(doc(firestore, 'users', this.user.uid))
        if (userDoc.exists()) {
          this.user = { ...this.user, ...userDoc.data() }
          this.isAdmin = this.user.role === 'admin'
        }

        this.isLoggedIn = true
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('user', JSON.stringify(this.user))
      } catch (error) {
        this.errorMessage = this.handleAuthError(error.code)
        throw new Error(this.errorMessage)
      }
    },

    async createUser(email, password, displayName) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        this.user = userCredential.user
    
        await setDoc(doc(firestore, 'users', this.user.uid), {
          email: this.user.email,
          displayName: displayName || 'Anonymous User',
          role: 'user',
          profileImage: defaultProfileImageUrl,
          status: 'active',
          createdAt: serverTimestamp(),
          updateAt: serverTimestamp(),
        })
    
        this.user.displayName = displayName
        this.user.profileImage = defaultProfileImageUrl
        this.isLoggedIn = true
        localStorage.setItem('isLoggedIn', 'true')
        localStorage.setItem('user', JSON.stringify(this.user))
      } catch (error) {
        this.errorMessage = this.handleAuthError(error.code)
        throw new Error(this.errorMessage)
      }
    }
    ,

    async updateUserDisplayName(newDisplayName) {
      if (!this.user?.uid) return

      try {
        await updateDoc(doc(firestore, 'users', this.user.uid), {
          displayName: newDisplayName
        })

        this.user.displayName = newDisplayName
        localStorage.setItem('user', JSON.stringify(this.user))

        showToast('Display name updated successfully', 'success')
      } catch (error) {
        console.error('Error updating display name:', error)
        showToast('Error updating display name', 'error')
      }
    },

    async logout() {
      await signOut(auth)
      this.isLoggedIn = false
      this.isAdmin = false
      this.user = {}
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('user')
    },

    handleAuthError(errorCode) {
      switch (errorCode) {
        case 'auth/invalid-email':
          return 'อีเมลไม่ถูกต้อง'
        case 'auth/wrong-password':
          return 'รหัสผ่านไม่ถูกต้อง'
        default:
          return 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'
      }
    },

    // เพิ่มฟังก์ชันสำหรับการอัปเดต profileImage
    async updateUserProfileImage(newImageUrl) {
      if (!this.user?.uid) return
      
      try {
        await updateDoc(doc(firestore, 'users', this.user.uid), {
          profileImage: newImageUrl
        })
        
        this.user.profileImage = newImageUrl
        localStorage.setItem('user', JSON.stringify(this.user))
        
        profileStore.updateProfileImage(newImageUrl)
      } catch (error) {
        console.error('Error updating profile image:', error)
      }
    }
    
    
    ,
      // ฟังก์ชันตรวจสอบว่าอีเมลมีอยู่ใน Firestore หรือไม่
      async checkEmailExists(email) {
        try {
          const emailQuery = query(collection(firestore, 'users'), where('email', '==', email))
          const emailSnapshot = await getDocs(emailQuery)
          return !emailSnapshot.empty // ถ้าไม่ว่างแปลว่าอีเมลนั้นมีอยู่แล้ว
        } catch (error) {
          console.error('Error checking email existence:', error)
          return false
        }
      }
      
        ,
        async transferUserToGuide(userId) {
          try {
            const userRef = doc(firestore, 'users', userId)
            const userDoc = await getDoc(userRef)
        
            if (userDoc.exists()) {
              const userData = userDoc.data()
        
              if (userData.role === 'guide') {
                const guideRef = doc(firestore, 'guides', userId)
                await setDoc(guideRef, {
                  displayName: userData.displayName,
                  email: userData.email,
                  imageUrl: userData.imageUrl,
                  profileImage: userData.profileImage,
                  role: userData.role,
                  status: userData.status,
                  uid: userData.uid,
                  createdAt: userData.createdAt,
                  updatedAt: serverTimestamp()
                })
        
                console.log(`ข้อมูลของไกด์ (ID: ${userId}) ถูกโอนย้ายไปยังคอลเลกชัน 'guides' แล้ว`)
              } else {
                console.log('บทบาทของผู้ใช้ไม่ใช่ไกด์')
              }
            } else {
              console.log('ไม่พบข้อมูลของผู้ใช้ในคอลเลกชัน users')
            }
          } catch (error) {
            console.error('เกิดข้อผิดพลาดในการโอนย้ายข้อมูล:', error)
          }
        }
,

      async updateUserRoleToGuide(userId) {
        try {
          // อัปเดตบทบาทของผู้ใช้เป็น 'guide'
          await updateDoc(doc(firestore, 'users', userId), { role: 'guide' })
      
          // โอนย้ายข้อมูลไปยัง 'guides'
          await this.transferUserToGuide(userId)
        } catch (error) {
          console.error('เกิดข้อผิดพลาดในการอัปเดตบทบาท:', error)
        }
      },

  }
})
