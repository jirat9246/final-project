<script setup>
import UserLayout from '/src/components/layouts/UserLayout.vue'
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { db } from '@/firebase'
import { doc, getDoc, collection, addDoc, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore'
import { useAccountStore } from '/src/stores/account'
import Toastify from 'toastify-js'
import "toastify-js/src/toastify.css"

const route = useRoute()
const accountStore = useAccountStore()

const post = ref(null)
const comments = ref([])
const newComment = ref('')
const currentPostId = ref(null)
const userRole = computed(() => accountStore.user?.role || 'guest')

// Toastify for notifications
const showToast = (message, type) => {
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: "top",
    position: "right",
    backgroundColor: type === 'success' ? "linear-gradient(to right, #00b09b, #96c93d)" : "linear-gradient(to right, #f44336, #ff5722)"
  }).showToast()
}

onMounted(async () => {
  const postId = route.params.id
  if (postId) {
    currentPostId.value = postId
    userRole.value = accountStore.user?.role || 'guest'
    await loadPost(postId)
    listenToComments(postId)
  }
})

// Function to load post data from Firestore
const loadPost = async (postId) => {
  try {
    const postRef = doc(db, 'jobPosts', postId)
    const postSnapshot = await getDoc(postRef)

    if (postSnapshot.exists()) {
      const postData = postSnapshot.data()
      post.value = {
        id: postSnapshot.id,
        ...postData,
        createdAt: postData.createdAt instanceof Timestamp ? postData.createdAt.toDate() : postData.createdAt,
      }
    } else {
      showToast('Post not found', 'error')
    }
  } catch (error) {
    console.error('Error loading post:', error)
    showToast('Error loading post', 'error')
  }
}

// Function to listen to comments in real-time using onSnapshot
const listenToComments = (postId) => {
  const commentsRef = collection(db, 'jobPosts', postId, 'comments')

  onSnapshot(commentsRef, (snapshot) => {
    const commentsArray = snapshot.docs.map(doc => {
      const commentData = doc.data()
      return {
        id: doc.id,
        ...commentData,
        // Add a check for the createdAt field type
        createdAt: commentData.createdAt instanceof Timestamp 
          ? commentData.createdAt.toDate().toLocaleString() 
          : (new Date(commentData.createdAt)).toLocaleString(), 
        profileImage: commentData.profileImage || "", // Update profile image
      }
    })

    // Reverse the array to show the newest comment on top
    comments.value = commentsArray.reverse()
  })
}

const canComment = computed(() => accountStore.user && (userRole.value === 'user' || userRole.value === 'guide'))




const addNewComment = async () => {
  // ตรวจสอบการล็อกอิน
  if (!accountStore.user) {
    showToast('Please log in to comment', 'error')
    return
  }

  // ตรวจสอบสิทธิ์การคอมเมนต์
  if (!canComment.value) {
    showToast('You do not have permission to comment', 'error')
    return
  }

  // ตรวจสอบความว่างเปล่าของคอมเมนต์
  const commentText = newComment.value.trim()
  if (!commentText) {
    showToast('Comment cannot be empty', 'error')
    return
  }

  // ข้อมูลคอมเมนต์
  const commentData = {
    username: accountStore.user?.name || 'Guest',
    profileImage: accountStore.user?.profileImage || "",
    text: commentText,
    createdAt: serverTimestamp(),
    userId: accountStore.user?.uid,
    role: userRole.value
  }

  try {
    // อ้างอิงไปที่โพสต์และคอมเมนต์ใน Firestore
    const postRef = doc(db, 'jobPosts', post.value.id)
    const commentsRef = collection(postRef, 'comments')

    // บันทึกคอมเมนต์ลงใน Firestore
    await addDoc(commentsRef, commentData)

    // ล้างค่าของ input คอมเมนต์
    newComment.value = ''
    showToast('Comment added successfully', 'success')
  } catch (error) {
    console.error('Error adding comment:', error)
    showToast('Error adding comment', 'error')
  }
}





const handleKeydown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    addNewComment()
  }
}








</script>




<template>
  <UserLayout>
    <div class="container mx-auto py-8 px-4">
      <div v-if="post" class="max-w-4xl mx-auto p-8 bg-white rounded-3xl shadow-2xl">
        <!-- Post Details -->
        <div class="mb-6">
          <h2 class="text-3xl font-bold text-gray-800 mb-4">{{ post.location }} - <span class="text-primary">{{ post.budget }} Baht</span></h2>
          <p class="text-md text-gray-600 mb-2">Travel Dates: <span class="font-semibold">{{ post.travelDates }}</span></p>
          <p class="text-md text-gray-600 mb-2">Car Required: <span class="font-semibold">{{ post.carRequired ? 'Yes' : 'No' }}</span></p>
          <p class="text-md text-gray-600 mb-2">Food Preferences: <span class="font-semibold">{{ post.foodPreferences.join(', ') }}</span></p>
          <p class="text-sm text-gray-400">Posted on: {{ post.createdAt ? post.createdAt.toLocaleString() : 'N/A' }}</p>
        </div>

        <!-- Comments Section -->
        <div class="bg-gray-50 p-6 rounded-lg shadow-inner">
          <h3 class="text-2xl font-semibold text-primary mb-4">Comments</h3>
          <div class="space-y-6 max-h-80 overflow-y-auto pr-4">
            <!-- Comment Item -->
            <div v-for="(comment, index) in comments" :key="index" class="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg shadow-sm">
              <img :src="comment.profileImage" alt="Profile Image" class="w-12 h-12 rounded-full border-2 border-primary shadow-md">
              <div class="flex-1 bg-primary/10 p-3 rounded-lg shadow-md">
                <div class="flex justify-between items-center mb-1">
                  <p class="font-bold text-primary">{{ comment.username }}</p>
                  <p class="text-xs text-gray-400">{{ comment.createdAt ? comment.createdAt.toLocaleString() : 'N/A' }}</p>
                </div>
                <p class="text-gray-700">{{ comment.text }}</p>
              </div>
            </div>
            <!-- No comments display -->
            <p v-if="!comments.length" class="text-center text-gray-400 italic">No comments yet. Be the first to comment!</p>
          </div>

         <!-- Add a New Comment -->
        <div class="mt-8">
          <textarea v-model="newComment" rows="4" class="textarea textarea-bordered w-full resize-none" placeholder="Write a comment..." @keyup.enter="addNewComment"></textarea>
          <button @click="addNewComment" class="btn btn-primary w-full mt-4">Submit Comment</button>
        </div>
        </div>
      </div>

      <div v-else class="text-center text-gray-600">Post not found.</div>
    </div>
  </UserLayout>
</template>
