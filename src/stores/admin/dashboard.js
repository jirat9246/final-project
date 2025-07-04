import { defineStore } from 'pinia';
import { db, collection, getDocs } from '@/firebase';
import { serverTimestamp } from 'firebase/firestore';

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    guides: 0,
    users: 0,
    newRegisters: 0,
    registrationData: [0, 0, 0, 0, 0], // Placeholder data
  }),

  actions: {
    async fetchDashboardData() {
      try {
        // ดึงข้อมูลไกด์
        const guidesSnapshot = await getDocs(collection(db, 'guides'));
        this.guides = guidesSnapshot.size; // จำนวนไกด์

        // ดึงข้อมูลผู้ใช้
        const usersSnapshot = await getDocs(collection(db, 'users'));
        
        // นับจำนวนผู้ใช้ที่มีบทบาทเป็น 'user' เท่านั้น
        this.users = usersSnapshot.docs.filter(doc => doc.data().role === 'user').length;

        // ดึงข้อมูลการสมัครสมาชิกใหม่
        const now = new Date();
        const newUserCount = usersSnapshot.docs.filter(doc => {
          const createdAt = doc.data().createdAt ? doc.data().createdAt.toDate() : null;
          return createdAt && (now - createdAt) <= 3 * 24 * 60 * 60 * 1000; // 3 วัน
        }).filter(doc => doc.data().role === 'user').length; // นับเฉพาะผู้ใช้ที่มีบทบาทเป็น 'user'

        this.newRegisters = newUserCount; // จำนวนผู้ใช้ใหม่ที่สมัครเข้ามาภายใน 3 วัน

        // อัปเดตข้อมูลการลงทะเบียน
        this.calculateRegistrationData(usersSnapshot.docs);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    },

    calculateRegistrationData(userDocs) {
      // Reset registrationData
      this.registrationData = [0, 0, 0, 0, 0];
      const currentYear = new Date().getFullYear();
      
      userDocs.forEach(doc => {
        const createdAt = doc.data().createdAt ? doc.data().createdAt.toDate() : null;
        if (createdAt) {
          const year = createdAt.getFullYear();
          const index = year - currentYear; // Determine the index based on the current year
          if (index >= 0 && index < this.registrationData.length) {
            this.registrationData[index]++;
          }
        }
      });
    },
  },

  getters: {
    getGuideCount: (state) => state.guides,
    getUserCount: (state) => state.users,
    getNewRegisterCount: (state) => state.newRegisters,
    getRegistrationData: (state) => state.registrationData,
  },
});
