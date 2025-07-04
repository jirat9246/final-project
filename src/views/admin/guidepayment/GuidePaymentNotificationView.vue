<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '/src/components/layouts/AdminLayout.vue'
import { collection, addDoc, doc, getDocs, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import Toastify from 'toastify-js'
import "toastify-js/src/toastify.css"

const guidePayments = ref([])


const loadGuidePayments = async () => {
  try {
    const guidePaymentsRef = collection(db, 'guidePayments')
    const querySnapshot = await getDocs(guidePaymentsRef)

    const loadedPayments = []

    for (const paymentDoc of querySnapshot.docs) {
      const paymentData = paymentDoc.data()
      const guideId = paymentData.guideId

      // ดึงข้อมูลอีเมลของไกด์จากคอลเล็กชัน guides โดยใช้ guideId
      const guideRef = doc(db, 'guides', guideId)
      const guideSnapshot = await getDoc(guideRef)

      const email = guideSnapshot.exists() ? guideSnapshot.data().email : 'ไม่พบอีเมล'

      loadedPayments.push({
        id: paymentDoc.id,
        ...paymentData,
        email: email // เพิ่มอีเมลลงในข้อมูลการชำระเงิน
      })
    }

    guidePayments.value = loadedPayments
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลการชำระเงินไกด์:', error)
  }
}

onMounted(loadGuidePayments)


async function markAsPaid(guideId) {
  try {
    // ค้นหาการชำระเงินของไกด์ตาม ID
    const guidePaymentDoc = guidePayments.value.find(g => g.id === guideId);
    if (!guidePaymentDoc || guidePaymentDoc.status === "โอนแล้ว") {
      showToast('การชำระเงินนี้ได้รับการยืนยันแล้ว', 'error');
      return;
    }

    // อัปเดตสถานะการชำระเงินเป็น "โอนแล้ว"
    const guidePaymentRef = doc(db, 'guidePayments', guideId);
    await updateDoc(guidePaymentRef, {
      status: "โอนแล้ว",
      completedDate: serverTimestamp(),
    });

    // อัปเดตข้อมูลใน UI
    guidePaymentDoc.status = "โอนแล้ว";
    guidePaymentDoc.completedDate = new Date();

    // แสดงข้อความยืนยัน
    showToast('ยืนยันการโอนเงินสำเร็จ', 'success');
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการยืนยันการโอนเงิน:', error);
    showToast('เกิดข้อผิดพลาดในการยืนยันการโอนเงิน', 'error');
  }
}

// ฟังก์ชันสร้างข้อมูลการชำระเงินและแจ้งเตือน
const createGuidePaymentRecord = async () => {
  try {
    // ตรวจสอบว่า selectedSlip มีข้อมูลครบถ้วนหรือไม่
    if (!selectedSlip.value || !selectedSlip.value.postId || !selectedSlip.value.guideId || !selectedSlip.value.amount) {
      console.error("ข้อมูลไม่ครบถ้วนใน selectedSlip")
      alert("ไม่พบข้อมูลที่ต้องการสำหรับการสร้างการชำระเงินไกด์")
      return
    }

    const userId = auth.currentUser?.uid
    if (!userId) {
      console.error("ไม่พบข้อมูลผู้ใช้งาน")
      return
    }

    // ดึงข้อมูลจากคอลเล็กชัน acceptJob โดยใช้ userId, guideId และ postId
    const acceptJobRef = collection(db, 'acceptJob')
    const q = query(acceptJobRef, where('userId', '==', userId), where('postId', '==', selectedSlip.value.postId), where('guideId', '==', selectedSlip.value.guideId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      console.error("ไม่พบข้อมูลการจองใน acceptJob")
      return
    }

    // ใช้ข้อมูลจาก acceptJob
    const acceptJobData = querySnapshot.docs[0].data()
    const paymentAmount = acceptJobData.amount
    const guidePaymentAmount = paymentAmount * 0.93 // หัก 7%
    const guideId = acceptJobData.guideId

    // ข้อมูลการชำระเงินของไกด์
    const guidePaymentData = {
      guideId: guideId,
      userId: userId,
      originalAmount: paymentAmount,
      paymentAmount: guidePaymentAmount,
      completedDate: serverTimestamp(),
      status: 'Pending',
      bank: acceptJobData.bank,
      bankAccount: acceptJobData.bankAccount
    }

    // เพิ่มข้อมูลในคอลเล็กชัน guidePayments
    const guidePaymentsRef = collection(db, 'guidePayments')
    await addDoc(guidePaymentsRef, guidePaymentData)
    console.log("เพิ่มข้อมูลการชำระเงินไกด์สำเร็จ")

    // เรียกฟังก์ชันสร้างการแจ้งเตือนการชำระเงิน
    await createGuidePaymentNotification(guidePaymentData)
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการสร้างข้อมูลการชำระเงินไกด์:", error)
  }
}


// ฟังก์ชันสร้างการแจ้งเตือนการชำระเงินในคอลเล็กชันใหม่
const createGuidePaymentNotification = async (guidePaymentData) => {
  try {
    const guidePaymentNotificationRef = collection(db, 'guidePaymentNotifications')
    await addDoc(guidePaymentNotificationRef, {
      ...guidePaymentData,
      notificationType: 'Payment',
      message: 'มีการชำระเงินสำหรับทริปของคุณ',
      createdAt: serverTimestamp(),
      isRead: false
    })
    console.log("สร้างการแจ้งเตือนการชำระเงินสำเร็จ")
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการสร้างการแจ้งเตือนการชำระเงิน:", error)
  }
}




const showToast = (message, type) => {
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: 'top',
    position: 'right',
    backgroundColor: type === 'success' 
      ? "linear-gradient(to right, #00b09b, #96c93d)" 
      : "linear-gradient(to right, #f44336, #ff5722)"
  }).showToast()
}





</script>

<template>
  <AdminLayout>
    <!-- Header -->
    <div class="flex items-center justify-between my-6">
      <h2 class="text-4xl font-extrabold text-white tracking-wide bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2 rounded-lg shadow-lg">
        Guide Payment
      </h2>
    </div>

    <!-- Table for displaying payments -->
    <div class="overflow-x-auto shadow-lg rounded-xl">
      <table class="min-w-full text-sm text-left">
        <thead class="text-xs text-white uppercase bg-gradient-to-r from-purple-500 to-pink-500 rounded-t-xl">
          <tr>
            <th class="py-4 px-6 text-center">ลำดับ</th>
            <th class="py-4 px-6 text-center">อีเมลไกด์</th>
            <th class="py-4 px-6 text-center">ยอดชำระหลังหัก</th>
            <th class="py-4 px-6 text-center">สถานะ</th>
            <th class="py-4 px-6 text-center">วันที่</th>
            <th class="py-4 px-6 text-center">ธนาคาร</th>
            <th class="py-4 px-6 text-center">เลขบัญชีธนาคาร</th>
            <th class="py-4 px-6 text-center">การดำเนินการ</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(guide, index) in guidePayments" :key="guide.id" class="bg-white border-b hover:bg-gray-50 transition duration-300">
            <td class="py-4 px-6 text-gray-700 font-medium text-center">{{ index + 1 }}</td>
            <td class="py-4 px-6 text-gray-700 text-center">{{ guide.email }}</td>
            <td class="py-4 px-6 text-gray-700 text-center">{{ guide.paymentAmount.toLocaleString() }} บาท</td>
            <td class="py-4 px-6 text-center">
              <span
                :class="{
                  'bg-yellow-200 text-yellow-800 border border-yellow-600': guide.status === 'รอการโอนเงิน',
                  'bg-green-200 text-green-800 border border-green-600': guide.status === 'โอนแล้ว'
                }"
                class="px-5 py-2 rounded-full text-sm font-semibold shadow-md"
              >
                {{ guide.status }}
              </span>
            </td>
            <td class="py-4 px-6 text-gray-700 text-center">{{ guide.completedDate?.toDate().toLocaleString() || '-' }}</td>
            <td class="py-4 px-6 text-gray-700 text-center">{{ guide.bank }}</td>
            <td class="py-4 px-6 text-gray-700 text-center">{{ guide.bankAccount }}</td>
            <td class="py-4 px-6 flex justify-center space-x-3">
              <!-- Confirm Payment Button -->
              <button
                @click="markAsPaid(guide.id)"
                :disabled="guide.status === 'โอนแล้ว'"
                class="flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-500 hover:from-purple-600 hover:to-blue-600 text-white px-4 py-2 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 space-x-2"
              >
                <i class="fas fa-check-circle"></i>
                <span class="font-semibold text-sm">{{ guide.status === 'โอนแล้ว' ? 'โอนแล้ว' : 'ยืนยันการโอนเงิน' }}</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>




  </AdminLayout>
</template>

<style scoped>
.bg-blue-500 {
  background-color: #4299e1;
}
.bg-blue-600:hover {
  background-color: #3182ce;
}
.bg-gray-400 {
  background-color: #cbd5e0;
}
</style>
