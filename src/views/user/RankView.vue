<script setup>
import UserLayout from '/src/components/layouts/UserLayout.vue'
import { ref, onMounted, watch } from 'vue'
import { db } from '@/firebase'
import { collection, getDocs, getDoc, query, where, doc } from 'firebase/firestore'
import Toastify from 'toastify-js'
import 'toastify-js/src/toastify.css'

// Define variables for guides and reviews
const guides = ref(JSON.parse(localStorage.getItem('guides')) || [])
const showReviewPopup = ref(false)
const selectedGuideReviews = ref(JSON.parse(localStorage.getItem('selectedGuideReviews')) || [])
const selectedGuideName = ref(localStorage.getItem('selectedGuideName') || '')
const averageRating = ref(localStorage.getItem('averageRating') || 0)

const loadGuides = async () => {
  try {
    const usersRef = collection(db, 'users')
    const guidesQuery = query(usersRef, where('role', '==', 'guide'))
    const querySnapshot = await getDocs(guidesQuery)

    const guideList = await Promise.all(querySnapshot.docs.map(async (guideDoc) => {
      const guideData = guideDoc.data()

      // ดึงข้อมูล completedJobs และ reviews จากคอลเล็กชัน guides
      const guideRef = doc(db, 'guides', guideData.uid)
      const guideSnapshot = await getDoc(guideRef)
      const completedJobs = guideSnapshot.exists() ? guideSnapshot.data().completedJobs || 0 : 0

      // Load reviews to calculate averageRating
      const reviewsRef = collection(db, `guides/${guideData.uid}/reviews`)
      const reviewsSnapshot = await getDocs(reviewsRef)
      const reviews = reviewsSnapshot.docs.map(doc => doc.data())

      // Calculate average rating for the guide
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
      const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0

      return {
        id: guideDoc.id,
        displayName: guideData.displayName || 'Unknown',
        guideId: guideData.uid || 'Unknown',
        completedJobs,
        averageRating // เพิ่มค่า averageRating ของแต่ละไกด์
      }
    }))

    guides.value = guideList
    localStorage.setItem('guides', JSON.stringify(guideList))
  } catch (error) {
    console.error('Error loading guides:', error)
    Toastify({
      text: 'ไม่สามารถโหลดข้อมูลไกด์ได้',
      duration: 3000,
      gravity: 'top',
      position: 'right',
      backgroundColor: '#ff5a5f',
    }).showToast()
  }
}



// Function to load reviews from Firestore and get reviewer names
const loadGuideReviews = async (guideId) => {
  try {
    const reviewsRef = collection(db, `guides/${guideId}/reviews`)
    const reviewsSnapshot = await getDocs(reviewsRef)

    const reviewsList = await Promise.all(reviewsSnapshot.docs.map(async (reviewDoc) => {
      const reviewData = reviewDoc.data()

      // Fetch the reviewer's display name from the users collection
      const userRef = doc(db, 'users', reviewData.userId)
      const userSnapshot = await getDoc(userRef)

      reviewData.reviewerName = userSnapshot.exists()
        ? userSnapshot.data().displayName || 'Unknown User'
        : 'Unknown User'

      return reviewData
    }))

    selectedGuideReviews.value = reviewsList
    localStorage.setItem('selectedGuideReviews', JSON.stringify(reviewsList)) // Save to localStorage

    // Calculate average rating
    if (reviewsList.length > 0) {
      const totalRating = reviewsList.reduce((sum, review) => sum + review.rating, 0)
      averageRating.value = (totalRating / reviewsList.length).toFixed(1)
    } else {
      averageRating.value = 0
    }
    localStorage.setItem('averageRating', averageRating.value) // Save to localStorage
  } catch (error) {
    console.error('Error loading reviews:', error)
    Toastify({
      text: 'ไม่สามารถโหลดข้อมูลรีวิวได้',
      duration: 3000,
      gravity: 'top',
      position: 'right',
      backgroundColor: '#ff5a5f',
    }).showToast()
  }
}


// Function to open the full review popup
const openReviewPopup = async (guide) => {
  try {
    selectedGuideName.value = guide.displayName || 'Unknown'
    localStorage.setItem('selectedGuideName', selectedGuideName.value) // Save to localStorage

    await loadGuideReviews(guide.guideId)
    showReviewPopup.value = true
  } catch (error) {
    console.error('Error loading guide reviews:', error)
    Toastify({
      text: 'เกิดข้อผิดพลาดในการโหลดรีวิว กรุณาลองอีกครั้ง',
      duration: 3000,
      gravity: 'top',
      position: 'right',
      backgroundColor: '#ff5a5f',
    }).showToast()
  }
}

// Watch for changes to guide data and update localStorage
watch([guides, selectedGuideReviews, averageRating, selectedGuideName], () => {
  localStorage.setItem('guides', JSON.stringify(guides.value))
  localStorage.setItem('selectedGuideReviews', JSON.stringify(selectedGuideReviews.value))
  localStorage.setItem('averageRating', averageRating.value)
  localStorage.setItem('selectedGuideName', selectedGuideName.value)
})

// Run loadGuides on component mount
onMounted(() => {
  loadGuides()
})
</script>




<template>
  <UserLayout>
    <div class="max-w-7xl mx-auto p-8">
      <h1 class="text-4xl font-semibold text-center mb-10 text-purple-800">ข้อมูลมัคคุเทศก์</h1>

      <div class="grid gap-8 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="(guide, index) in guides"
          :key="index"
          class="bg-gradient-to-br from-purple-100 to-white shadow-lg rounded-3xl p-8 hover:shadow-2xl transition-shadow duration-300 transform hover:scale-105"
        >
          <div class="mb-6">
            <h2 class="text-2xl font-bold text-gray-800">ชื่อมัคคุเทศก์: {{ guide.displayName }}</h2>
          </div>

          <!-- Average Rating Section -->
          <div class="flex items-center justify-between mb-6 bg-purple-50 p-4 rounded-xl shadow-md">
            <h3 class="text-xl font-semibold text-purple-700">คะแนนเฉลี่ย :</h3>
            <div class="flex items-center">
              <div class="flex space-x-1 mr-2">
                <template v-for="i in 5" :key="i">
                  <svg
                    v-if="i <= guide.averageRating"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    class="w-6 h-6 text-yellow-400"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                  <svg
                    v-else
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    class="w-6 h-6 text-gray-300"
                  >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                </template>
              </div>
              <p class="text-lg font-bold text-purple-700">{{ guide.averageRating }} ดาว</p>
            </div>
          </div>

          <!-- Completed Jobs Section -->
          <div class="mb-6">
            <p class="text-lg font-medium text-gray-700">
              <span class="font-semibold text-indigo-600">รีวิว :</span> {{ guide.completedJobs }}
            </p>
          </div>

          <!-- View Reviews Button -->
          <button
            @click="openReviewPopup(guide)"
            class="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full font-bold text-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            ดูรีวิว
          </button>
        </div>
      </div>

      <!-- Review Popup -->
      <div v-if="showReviewPopup" class="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
        <div class="max-w-3xl w-full p-8 bg-gradient-to-br from-purple-200 via-white to-indigo-200 rounded-3xl shadow-2xl transform scale-105 transition-transform">
          <button 
            @click="showReviewPopup = false" 
            class="absolute top-4 right-4 text-white bg-red-500 w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-600 focus:outline-none"
          >
            ✕
          </button>

          <h2 class="text-4xl font-bold mb-8 text-center text-purple-800 leading-tight">
            รีวิวของ {{ selectedGuideName }}
          </h2>

          <div class="max-h-96 overflow-y-auto pr-4">
            <ul class="space-y-6">
              <li 
                v-for="(review, index) in selectedGuideReviews" 
                :key="index" 
                class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow"
              >
                <div class="flex items-center justify-between mb-4">
                  <span class="text-lg font-semibold text-indigo-700">
                    {{ review.reviewerName }}
                  </span>

                  <div class="flex space-x-1">
                    <template v-for="i in 5" :key="i">
                      <svg
                        v-if="i <= review.rating"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        class="w-6 h-6 text-yellow-400"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                      <svg
                        v-else
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        class="w-6 h-6 text-gray-300"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    </template>
                  </div>
                </div>

                <p class="italic text-base text-gray-800 mb-4 leading-relaxed">
                  "{{ review.comment }}"
                </p>

                <span class="text-sm text-gray-500">
                  {{ new Date(review.createdAt.seconds * 1000).toLocaleString() }}
                </span>
              </li>
            </ul>
          </div>

          <button
            @click="showReviewPopup = false"
            class="mt-8 w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-opacity-50"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  </UserLayout>
</template>











<style scoped>
h1 {
  color: #4f46e5; /* Primary color for the title */
}

.bg-white {
  border: 1px solid rgba(229, 231, 235, 0.6); /* Subtle border */
}

button {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); /* Subtle shadow for buttons */
}

button:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2); /* More shadow on hover */
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
