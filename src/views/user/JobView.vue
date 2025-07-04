<script setup>
import UserLayout from '/src/components/layouts/UserLayout.vue'
import { ref, onMounted ,computed, watch, nextTick , getCurrentInstance   } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '/src/stores/notification'
import { useGuideStore } from '/src/stores/admin/guide'
import { useAccountStore } from '/src/stores/account'
import { useProfileStore } from '/src/stores/user/profileStore'
import { getAuth } from 'firebase/auth'
import { 
  getFirestore, collection, addDoc, deleteDoc, doc, updateDoc, getDocs, getDoc, onSnapshot, 
  query, where, setDoc ,orderBy, limit, serverTimestamp, Timestamp , arrayUnion 
} from 'firebase/firestore'
import { 
  getDatabase, ref as firebaseRef, push, onValue, remove 
} from 'firebase/database'
import { 
  getStorage, ref as storageRef, uploadBytes, getDownloadURL , uploadString
} from 'firebase/storage'
import Toastify from 'toastify-js'
import "toastify-js/src/toastify.css"
import { generateQRCode  } from '@/stores/admin/qrUtils'
import { useEventStore } from '/src/stores/event'
import imageCompression from 'browser-image-compression'








// Firebase Initialization
const auth = getAuth()
const db = getFirestore()
const rtdb = getDatabase()
const storage = getStorage()

// Initialize stores
const router = useRouter()
const notificationStore = useNotificationStore()
const guideStore = useGuideStore()
const accountStore = useAccountStore()
const profileStore = useProfileStore()
const eventStore = useEventStore()

// State variables
const isAuthenticated = ref(false)
const userRole = ref('') // เริ่มต้นเป็นค่าว่าง
const showCommentPopup = ref(false)
const showUploadProofPopup = ref(false)
const showCompleteJobPopup = ref(false)
const showNotifications = ref(false)
const currentPostId = ref(null)
const currentPostComments = ref([])
const newComment = ref('')
const paymentImage = ref(null)
const selectedRating = ref(0)
const reviewText = ref('')
const receiverName = ref('')
const receiverUID = ref('')
const comment = ref(null)
const showGuideSignUpForm = ref(false)
const showViewPost = ref(false)
const isCompleteJobButtonVisible = ref(false)
const isAddingComment = ref(false)
const data = ref(null)
const isLoading = ref(true)

const selectedGuide = ref(null)
const showGuideProfilePopup = ref(false)
const currentPost = ref(null)
const today = new Date().toISOString().split('T')[0]
const someVar = ref(null)
// Role-based access control
const canComment = computed(() => isAuthenticated.value && (userRole.value === 'user' || userRole.value === 'guide'))
const canCreatePost = computed(() => isAuthenticated.value && userRole.value === 'user')
const canManagePost = (post) => isAuthenticated.value && post.createdBy === accountStore.user?.uid
const canViewPosts = computed(() => isAuthenticated.value)
const canApprove = computed(() => isAuthenticated.value && userRole.value === 'admin')
const canCompleteJob = computed(() => isAuthenticated.value && userRole.value === 'guide' && guideStore.jobCount < 3)


const { proxy } = getCurrentInstance()
const latestComments = proxy.$refs.latestComment


// ตัวแปรเพื่อเก็บข้อมูลผู้ใช้ตาม role
const usersByRole = ref({ user: [], guide: [], admin: [] })





// Watch for account changes
watch(
  () => accountStore.user,
  (newUser) => {
    userRole.value = newUser?.role || 'guest'
    isAuthenticated.value = !!newUser
  }
)





const guideInfo = ref(null) // เปลี่ยนชื่อเป็น guideInfo





const fetchGuideData = async (guideId) => {
  if (!guideId) {
    console.error('Guide ID is missing.')
    showToast('Guide ID ไม่ถูกต้อง', 'error')
    return null
  }

  try {
    // ตรวจสอบข้อมูลผู้ใช้ในคอลเล็กชั่น 'users' ก่อน
    const userDocRef = doc(db, 'users', guideId)
    const userSnapshot = await getDoc(userDocRef)

    if (userSnapshot.exists()) {
      const userData = userSnapshot.data()

      // ตรวจสอบว่า role ของผู้ใช้เป็น 'guide'
      if (userData.role === 'guide') {
        const guideUid = userData.uid  // ใช้ uid สำหรับดึงข้อมูลไกด์

        // ดึงข้อมูลจากคอลเล็กชั่น 'guides' โดยใช้ uid
        const guidesRef = collection(db, 'guides')
        const q = query(guidesRef, where('uid', '==', guideUid))
        const querySnapshot = await getDocs(q)

        if (!querySnapshot.empty) {
          const guideData = querySnapshot.docs[0].data()
          return guideData
        } else {
          console.error('ไม่พบข้อมูลไกด์ใน Firestore')
          showToast('ไม่พบข้อมูลไกด์', 'error')
          return null
        }
      } else {
        console.error('ผู้ใช้นี้ไม่ใช่ไกด์:', userData)
        showToast('ข้อมูลผู้ใช้ไม่ใช่ไกด์', 'error')
        return null
      }
    } 
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error)
    showToast('เกิดข้อผิดพลาดในการดึงข้อมูล', 'error')
    return null
  }
}


const loadGuideData = async (guideId) => {
  const guideData = await fetchGuideData(guideId)

  if (guideData) {
    selectedGuide.value = { ...guideData, userId: guideId }
    showGuideProfilePopup.value = true
    showToast('โหลดข้อมูลไกด์สำเร็จ', 'success')
  }
}





// ฟังก์ชันเปิดป๊อปอัพล็อกอิน
const showLoginPopup = () => {
  eventStore.popupMessage('info', 'กรุณาเข้าสู่ระบบเพื่อใช้งานฟังก์ชันนี้')
  showLoginModal.value = true
}



// เช็คการเข้าถึงฟังก์ชันก่อนใช้งาน
const handleCreatePost = () => {
  if (!canCreatePost.value) {
    showLoginPopup()
    return
  }
  showForm.value = true // เปิดฟอร์มสร้างโพสต์
}




const handleAddComment = async () => {
  if (!canComment.value) {
    showLoginPopup()
    return
  }
  await addNewComment() // เรียกใช้ฟังก์ชันเพิ่มคอมเมนต์
}



// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้และแยกตาม role
const fetchUsersByRole = async () => {
  try {
    const usersRef = collection(db, 'users')
    const snapshot = await getDocs(usersRef)
    if (!snapshot.empty) {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      usersByRole.value = {
        user: usersData.filter(user => user.role === 'user'),
        guide: usersData.filter(user => user.role === 'guide'),
        admin: usersData.filter(user => user.role === 'admin')
      }
    } else {
      console.error('ไม่มีข้อมูลผู้ใช้')
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', error)
  }
}













// Call this function during the mounted lifecycle hook or on button click
onMounted(() => {
  const guideUid = 'your-guide-uid' // Replace with actual guide UID
  loadGuideData(guideUid)
})




const fetchGuides = async () => {
  try {
    const guidesSnapshot = await getDocs(collection(db, 'guides'))
    const guides = guidesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    // console.log('Guides fetched:', guides) // คอมเมนต์หรือลบบรรทัดนี้หากไม่ต้องการแสดงผล
    return guides
  } catch (error) {
    console.error('Error fetching guides:', error)
    return []
  }
}





const loadAllUsers = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'))
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    // console.log('Users fetched:', users) // คอมเมนต์หรือลบบรรทัดนี้หากไม่ต้องการแสดงผล
    return users
  } catch (error) {
    console.error('Error loading users:', error)
    return []
  }
}




//ตรวจสอบการล็อกอินของผู้ใช้:


const checkUserLogin = async () => {
  const user = auth.currentUser
  if (user) {
    const userDocRef = doc(db, 'users', user.uid)
    const userSnapshot = await getDoc(userDocRef)

    if (userSnapshot.exists()) {
      const userData = userSnapshot.data()

      // ตรวจสอบบทบาทผู้ใช้
      if (userData.role === 'user' || userData.role === 'guide') {
        return userData
      } else {
        console.error('ผู้ใช้ไม่มีบทบาทที่ถูกต้อง')
        showToast('คุณไม่มีสิทธิ์เข้าถึง', 'error')
        return null
      }
    } else {
      console.error('ไม่พบข้อมูลผู้ใช้ในฐานข้อมูล')
      showToast('ไม่พบข้อมูลผู้ใช้', 'error')
      return null
    }
  } else {
    console.error('ผู้ใช้ไม่ได้ล็อกอิน')
    showToast('โปรดเข้าสู่ระบบก่อน', 'error')
    return null
  }
}

onMounted(async () => {
  const userData = await checkUserLogin()

  if (userData) {
    // โหลดคอมเมนต์เมื่อผู้ใช้ล็อกอินสำเร็จ
    if (currentPostId.value) {
      loadComments(currentPostId.value)
    }
  }
})




// โหลดข้อมูลใน onMounted()
onMounted(async () => {
  // ตัวอย่างการโหลดข้อมูลแบบ async
  try {
    // ใช้ fetchData() หรือฟังก์ชันโหลดข้อมูลที่คุณต้องการ
    data.value = await fetchData()
  } catch (error) {
    console.error('Error loading data:', error)
  }
})


// ฟังก์ชันจำลองการดึงข้อมูล
async function fetchData() {
  // คืนค่าข้อมูลจำลอง
  return new Promise((resolve) => {
    setTimeout(() => resolve("Data loaded!"), 1000)
  })
}











// Check user login and role
onMounted(async () => {
  if (await accountStore.checkAuth()) {
    isAuthenticated.value = true
    userRole.value = accountStore.user.role
  } else {
    isAuthenticated.value = false
  }
})



// ฟังก์ชันตรวจสอบบทบาทผู้ใช้
const checkUserRole = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid)
    const userSnapshot = await getDoc(userDocRef)

    if (userSnapshot.exists()) {
      const userData = userSnapshot.data()
      return userData.role || 'unknown'
    } else {
      console.warn('ไม่พบข้อมูลผู้ใช้ใน Firestore')
      return 'unknown'
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการตรวจสอบบทบาทผู้ใช้:', error)
    return 'unknown'
  }
}


















const canPostNewJob = ref(true)










// ฟังก์ชันสำหรับตรวจสอบสถานะการโพสต์ของผู้ใช้
const checkUserPostStatus = async () => {
  try {
    const userId = auth.currentUser?.uid
    if (!userId) return

    const jobPostsRef = collection(db, 'jobPosts')
    const q = query(jobPostsRef, where('userId', '==', userId), where('JobEnd', '!=', 'จบทริปแล้ว'))
    const querySnapshot = await getDocs(q)

    canPostNewJob.value = querySnapshot.empty
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการตรวจสอบสถานะการโพสต์:', error)
  }
}







onMounted(() => {
  checkUserPostStatus() // ตรวจสอบสถานะการโพสต์เมื่อเริ่มต้น
})



// Reactive form data
const showForm = ref(false)
const location = ref('')
const budget = ref('')
const travelDates = ref({ start: '', end: '' })
const carRequired = ref(false)
const foodPreferences = ref([])
const guideGender = ref('')
const numberOfPeople = ref(1) // Default to 1 person
const carType = ref('') // Initialize carType to avoid ReferenceError
const numberOfBedrooms = ref(1) // Default to 1 bedroom
const desiredLocations = ref('') // Optional
const separateBudget = ref(0) // Optional
const posts = ref([])
const customCarType = ref('')

// ฟังก์ชันสำหรับรีเซ็ตฟิลด์ในฟอร์ม
const resetForm = () => {
  location.value = ''
  budget.value = ''
  travelDates.value = { start: '', end: '' }
  carRequired.value = false
  foodPreferences.value = []
  guideGender.value = ''
  numberOfPeople.value = 1
  carType.value = ''
  numberOfBedrooms.value = 1
  desiredLocations.value = ''
  separateBudget.value = 0
}


const notifyIfEmpty = (field, message) => {
  if (!field || field === '') {
    showToast(message, 'error')
  }
}

const locationMessage = ref('')
const budgetMessage = ref('')
const startDateMessage = ref('')
const endDateMessage = ref('')
const guideGenderMessage = ref('')
const numberOfPeopleMessage = ref('')
const numberOfBedroomsMessage = ref('')
const carTypeMessage = ref('')

// Watchers for validation
watch(location, (newValue) => {
  locationMessage.value = newValue ? '' : 'กรุณาเลือกสถานที่'
})
watch(budget, (newValue) => {
  budgetMessage.value = newValue ? '' : 'กรุณากรอกงบประมาณ'
})
watch(() => travelDates.value.start, (newValue) => {
  startDateMessage.value = newValue ? '' : 'กรุณาเลือกวันที่เริ่มต้น'
})
watch(() => travelDates.value.end, (newValue) => {
  endDateMessage.value = newValue ? '' : 'กรุณาเลือกวันที่สิ้นสุด'
})
watch(guideGender, (newValue) => {
  guideGenderMessage.value = newValue ? '' : 'กรุณาเลือกเพศของไกด์'
})
watch(numberOfPeople, (newValue) => {
  numberOfPeopleMessage.value = newValue >= 1 ? '' : 'กรุณาระบุจำนวนผู้เข้าร่วม'
})
watch(numberOfBedrooms, (newValue) => {
  numberOfBedroomsMessage.value = newValue >= 1 ? '' : 'กรุณาระบุจำนวนห้องนอน'
})
watch(carType, (newValue) => {
  carTypeMessage.value = newValue || !carRequired.value ? '' : 'กรุณาระบุประเภทของรถ'
})




// รีเซ็ตฟอร์มเมื่อปิด popup
watch(
  () => showForm.value,
  (newVal) => {
    if (!newVal) {
      resetForm() // รีเซ็ตข้อมูลในฟอร์มเมื่อปิด Popup
    }
  }
)


// Reset form on route leave
router.beforeEach((to, from, next) => {
  if (showForm.value) {
    resetForm() // รีเซ็ตข้อมูลในฟอร์มเมื่อเปลี่ยนหน้า
  }
  next()
})




// Function to post a new job
const postJob = async () => {
  if (!accountStore.user || !accountStore.user.uid) {
    showToast('กรุณาเข้าสู่ระบบก่อน', 'error')
    return
  }

  const role = await checkUserRole(accountStore.user.uid)
  if (role !== 'user') {
    showToast('คุณไม่มีสิทธิ์ในการสร้างโพสต์', 'error')
    return
  }

  try {
    const userPostsRef = collection(db, 'jobPosts')
    const userPostsQuery = query(userPostsRef, where('createdBy', '==', accountStore.user.uid), where('status', '==', 'active'))
    const userPostsSnapshot = await getDocs(userPostsQuery)
    if (!userPostsSnapshot.empty) {
      showToast('คุณสามารถโพสต์ได้เพียงโพสต์เดียว', 'error')
      return
    }
  } catch (error) {
    console.error('Error checking existing posts:', error)
    showToast('เกิดข้อผิดพลาดในการตรวจสอบโพสต์ที่มีอยู่', 'error')
    return
  }

  // เตรียมข้อมูลโพสต์ใหม่โดยไม่ต้องตรวจสอบฟิลด์ที่จำเป็น
  const newPost = {
    location: location.value || '',
    budget: parseInt(budget.value.replace(/,/g, '')) || 0,
    travelDates: { start: travelDates.value.start || '', end: travelDates.value.end || '' },
    carRequired: carRequired.value || false,
    foodPreferences: foodPreferences.value || [],
    guideGender: guideGender.value || '',
    numberOfPeople: numberOfPeople.value || 1,
    carType: carType.value === 'อื่นๆ' ? customCarType.value || 'อื่นๆ' : carType.value || '', // ตรวจสอบ "อื่นๆ"
    numberOfBedrooms: numberOfBedrooms.value || 1,
    desiredLocations: desiredLocations.value || '',
    separateBudget: parseInt(separateBudget.value.replace(/,/g, '')) || 0, // แปลง separateBudget เป็นตัวเลข
    createdAt: new Date().toISOString(),
    createdBy: accountStore.user.uid,
    createdByEmail: accountStore.user.email,
    role: role,
    status: 'active',
    expiresAt: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000)
  }

  console.log("New Post Data:", newPost) // ตรวจสอบค่าทั้งหมดใน console

  try {
    await addDoc(collection(db, 'jobPosts'), newPost)
    showToast('โพสต์สำเร็จแล้ว', 'success')
    showForm.value = false
    resetForm()
    playNotificationSound()
  } catch (error) {
    console.error('Error adding post to Firestore:', error)
    showToast('เกิดข้อผิดพลาดในการเพิ่มโพสต์: ' + error.message, 'error')
  }
}








// Function to load all posts in descending order (latest posts first)
const loadPosts = async () => {
  try {
    const postsCollection = collection(db, 'jobPosts')
    const postsQuery = query(postsCollection, orderBy('createdAt', 'desc')) // เรียงลำดับตามวันที่สร้างในลำดับจากมากไปน้อย
    const snapshot = await getDocs(postsQuery)

    if (!snapshot.empty) {
      posts.value = snapshot.docs.map(doc => ({ postId: doc.id, ...doc.data() }))
    } else {
      showToast('ไม่มีโพสต์ที่แสดง', 'info')
    }
  } catch (error) {
    console.error('Error loading posts:', error)
    showToast('เกิดข้อผิดพลาดในการโหลดโพสต์', 'error')
  }
}







const closeJobPost = async (postId, status = 'closed') => {
  try {
    const jobPostRef = doc(db, 'jobPosts', postId)
    await updateDoc(jobPostRef, { status })
    showToast('โพสต์ถูกปิดการจอง', 'success')
  } catch (error) {
    console.error('Error closing job post:', error)
    showToast('เกิดข้อผิดพลาดในการปิดโพสต์', 'error')
  }
}

// ฟังก์ชันอัปเดตสถานะโพสต์เมื่อจบทริป
const updateJobEndStatus = async (postId) => {
  try {
    const jobPostRef = doc(db, 'jobPosts', postId)

    // เปลี่ยนสถานะของโพสต์เป็น 'จบทริปแล้ว'
    await updateDoc(jobPostRef, { JobEnd: 'จบทริปแล้ว' })

    console.log('สถานะของโพสต์ถูกอัปเดตเป็นจบทริปแล้ว')
    canPostNewJob.value = true // เปิดให้โพสต์ใหม่ได้
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการอัปเดตสถานะโพสต์:', error)
  }
}



// ฟังก์ชันสำหรับจัดรูปแบบวันที่เป็นภาษาไทย
const formatDateThai = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return date.toLocaleDateString('th-TH', options)
}


// ฟังก์ชันการเปลี่ยนแปลงวันที่
const handleTravelDatesChange = () => {
  if (!travelDates.value.start || !travelDates.value.end) {
    showToast('กรุณาเลือกวันที่เริ่มและสิ้นสุด', 'error')
    return
  }

  // Check if end date is before start date
  if (new Date(travelDates.value.end) < new Date(travelDates.value.start)) {
    showToast('วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่ม', 'error')
    return
  }

  // Check for booking overlap
  checkBookingOverlap()
}

// ฟังก์ชันตรวจสอบการจองซ้ำ
const checkBookingOverlap = async () => {
  try {
    const bookingsRef = collection(db, 'guideBookings')

    const bookingsQuery = query(
      bookingsRef,
      where('guideId', '==', selectedGuide.value?.userId || ''),
      where('startDate', '<=', travelDates.value.end),
      where('endDate', '>=', travelDates.value.start)
    )

    const bookingsSnapshot = await getDocs(bookingsQuery)

    if (!bookingsSnapshot.empty) {
      showToast('ไกด์ติดจองในช่วงเวลานี้', 'error')
      return
    }

    showToast('ไกด์ว่างสำหรับการจองในช่วงเวลานี้', 'success')
  } catch (error) {
    console.error('Error checking booking overlap:', error)
    showToast('เกิดข้อผิดพลาดในการตรวจสอบการจองซ้ำ', 'error')
  }
}



// ฟังก์ชันสำหรับฟอร์แมตตัวเลขให้อยู่ในรูปแบบที่มีคอมมา
const formatBudget = (value) => {
  if (!value) return ''
  const numberValue = parseFloat(value.replace(/,/g, ''))
  return isNaN(numberValue) ? value : numberValue.toLocaleString('en-US')
}



// ฟังก์ชันสำหรับฟอร์แมตขณะผู้ใช้กรอกข้อมูลในฟิลด์งบประมาณ
const handleBudgetInput = (event) => {
  // รับค่าที่ผู้ใช้พิมพ์และลบคอมม่าออก
  let input = event.target.value.replace(/,/g, '')

  // ตรวจสอบว่าค่าเป็นตัวเลขหรือไม่
  if (!isNaN(input) && input !== '') {
    // ฟอร์แมตคอมมาและอัปเดตค่าของ budget/separateBudget
    event.target.value = parseFloat(input).toLocaleString('en-US')
  } else {
    event.target.value = ''
  }
}




// ตรวจสอบว่าผู้ใช้ที่ล็อกอินอยู่เป็นเจ้าของโพสต์หรือไม่
const isPostOwner = (post) => {
  const userId = auth.currentUser?.uid
  return post?.createdBy === userId
}



// ฟังก์ชันตรวจสอบความเป็นเจ้าของโพสต์ผ่านอีเมล
const isPostOwnerByEmail = (userEmail, postEmail) => {
  return userEmail === postEmail
}


// ฟังก์ชันอัปเดตสถานะโพสต์
const updatePostStatus = async (postId, status) => {
  if (!auth.currentUser) {
    showToast('กรุณาเข้าสู่ระบบก่อน', 'error')
    return;
  }

  try {
    const postDocRef = doc(db, 'jobPosts', postId)
    const postSnapshot = await getDoc(postDocRef)

    if (postSnapshot.exists()) {
      const postData = postSnapshot.data()

      // ตรวจสอบสิทธิ์การอัปเดตโพสต์
      if (postData.createdBy === auth.currentUser.uid || auth.currentUser.admin) {
        // อัปเดตสถานะโพสต์เป็นสถานะใหม่
        await updateDoc(postDocRef, { status })

        if (status === 'Reserved') {
          showToast('โพสต์ถูกอัปเดตเป็นจองแล้ว', 'success')
        } else {
          showToast('อัปเดตสถานะโพสต์สำเร็จ', 'success')
        }
      } else {
        showToast('คุณไม่มีสิทธิ์ในการอัปเดตโพสต์นี้', 'error')
      }
    } else {
      showToast('ไม่พบโพสต์นี้ในระบบ', 'error')
    }
  } catch (error) {
    console.error('Error updating post status:', error)
    showToast('เกิดข้อผิดพลาดในการอัปเดตสถานะโพสต์', 'error')
  }
}




// ฟังก์ชันเปลี่ยนสถานะโพสต์เป็น "Reserved"
const reservePost = async (postId) => {
  try {
    const postDocRef = doc(db, 'jobPosts', postId)
    await updateDoc(postDocRef, { status: 'Reserved' })
    showToast('โพสต์ถูกจองแล้ว', 'success')
  } catch (error) {
    console.error('Error reserving post:', error)
    showToast('เกิดข้อผิดพลาดในการจองโพสต์', 'error')
  }
}





const formatDate = (dateStr) => {
  if (!dateStr) return 'ไม่ทราบวันที่'
  const date = new Date(dateStr)
  return date.toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })
}





const loadPostData = async (postId) => {
  try {
    const postDocRef = doc(db, 'jobPosts', postId)
    const postSnapshot = await getDoc(postDocRef)
    
    if (postSnapshot.exists()) {
      currentPost.value = postSnapshot.data()
    } else {
      showToast('ไม่พบข้อมูลโพสต์', 'error')
    }
  } catch (error) {
    console.error('Error loading post:', error)
    showToast('เกิดข้อผิดพลาดในการดึงข้อมูลโพสต์', 'error')
  }
}






onMounted(() => {
  loadPosts() // โหลดโพสต์ทั้งหมดเมื่อเริ่มต้นการใช้งานคอมโพเนนต์
  if (accountStore.user) {
    isAuthenticated.value = true
    userRole.value = accountStore.user.role
  }
  deleteExpiredPosts()
})



// Watch for authentication changes and reload posts accordingly
watch(
  () => auth.currentUser,
  () => {
    loadPosts() // โหลดโพสต์ทั้งหมดเมื่อมีการเปลี่ยนแปลงการเข้าสู่ระบบ
  },
  { immediate: true }
)











// <!-- Display job posts -->

const editingPostId = ref(null)
const showEditForm = ref(false)





// ฟังก์ชันกรองโพสต์
const filteredPosts = computed(() => {
  let postsToShow = posts.value

  // Apply province filtering if there are selected provinces
  if (selectedProvinces.value.length > 0) {
    postsToShow = postsToShow.filter(post => selectedProvinces.value.includes(post.location))
  }

  // Apply role-based filtering
  if (userRole.value === 'guide') {
    // Guides see all posts, including those marked as confirmed
    return postsToShow.filter(post => post.status !== 'จบทริปแล้ว')
  } else {
    // Users only see their own posts, including confirmed ones
    return postsToShow.filter(post => post.createdBy === auth.currentUser?.uid)
  }
})


// ฟังก์ชันเพื่อเปิด Popup แก้ไขโพสต์
const editPost = async (postId) => {
  try {
    const postDocRef = doc(db, 'jobPosts', postId)
    const postSnapshot = await getDoc(postDocRef)

    if (postSnapshot.exists()) {
      const post = postSnapshot.data()

      // ตรวจสอบว่าโพสต์ถูกแก้ไขแล้วหรือไกด์ได้รับการยืนยันแล้วหรือไม่
      if (post.edited || post.confirmedGuideId) {
        showToast('ไม่สามารถแก้ไขโพสต์ได้ เนื่องจากไกด์ได้รับการยืนยันแล้ว', 'error')
        return
      }

      // ใส่ค่าของโพสต์ลงในฟอร์ม
      location.value = post.location
      budget.value = post.budget.toString()
      travelDates.value = { start: post.travelDates.start, end: post.travelDates.end }
      carRequired.value = post.carRequired
      foodPreferences.value = post.foodPreferences
      guideGender.value = post.guideGender
      numberOfPeople.value = post.numberOfPeople
      carType.value = post.carType
      numberOfBedrooms.value = post.numberOfBedrooms
      desiredLocations.value = post.desiredLocations
      separateBudget.value = post.separateBudget

      editingPostId.value = postId // เก็บ postId ที่ต้องการแก้ไขไว้
      showEditForm.value = true // เปิด Popup แก้ไขโพสต์
    } else {
      showToast('ไม่พบโพสต์ที่ต้องการแก้ไข', 'error')
    }
  } catch (error) {
    console.error('Error loading post for editing:', error)
    showToast('เกิดข้อผิดพลาดในการโหลดโพสต์เพื่อแก้ไข', 'error')
  }
}




// ฟังก์ชันเพื่อบันทึกการแก้ไขโพสต์
const updateJobPost = async () => {
  try {
    const jobPostRef = doc(db, 'jobPosts', editingPostId.value)
    await updateDoc(jobPostRef, {
      location: location.value,
      budget: parseInt(budget.value.replace(/,/g, '')),
      travelDates: { start: travelDates.value.start, end: travelDates.value.end },
      carRequired: carRequired.value,
      foodPreferences: foodPreferences.value,
      guideGender: guideGender.value,
      numberOfPeople: numberOfPeople.value,
      carType: carType.value,
      numberOfBedrooms: numberOfBedrooms.value,
      desiredLocations: desiredLocations.value,
      separateBudget: separateBudget.value,
      edited: true // กำหนดว่าโพสต์ถูกแก้ไขแล้ว
    })

    showToast('โพสต์แก้ไขสำเร็จ', 'success')
    showEditForm.value = false
    resetForm()
    loadPosts() // Reload posts to reflect updates
  } catch (error) {
    console.error('Error updating post:', error)
    showToast('เกิดข้อผิดพลาดในการแก้ไขโพสต์', 'error')
  }
}




onMounted(async () => {
  const currentUser = auth.currentUser
  if (currentUser) {
    const userData = await getUserData(currentUser.uid)
    if (userData && userData.role) {
      userRole.value = userData.role // ตั้งค่า role จากข้อมูลผู้ใช้
    }
  }
})






// Popup View Post



// ฟังก์ชันกรองโพสต์ประวัติของผู้ใช้ที่เข้าสู่ระบบ
const userPosts = computed(() => {
  const userId = auth.currentUser?.uid
  return posts.value.filter(post => post.createdBy === userId)
})



// ฟังก์ชันเพื่อเปิด Popup View Post

const openViewPost = () => {
  loadUserPosts()
  showViewPost.value = true
}




// ฟังก์ชันโหลดโพสต์ของผู้ใช้
const loadUserPosts = async () => {
  try {
    const userId = auth.currentUser?.uid
    if (!userId) return

    const jobPostsRef = collection(db, 'jobPosts')
    const q = query(jobPostsRef, where('createdBy', '==', userId))
    const querySnapshot = await getDocs(q)

    posts.value = querySnapshot.docs.map(doc => ({ postId: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('Error loading user posts:', error)
    showToast('เกิดข้อผิดพลาดในการโหลดโพสต์ของผู้ใช้', 'error')
  }
}










const notificationSound = new Audio('/src/assets/livechat-129007.mp3')


const playNotificationSound = () => {
  notificationSound.currentTime = 0
  notificationSound.play().catch(error => {
    console.error('Error playing notification sound:', error)
  })
}


// ฟังก์ชันการแสดงการแจ้งเตือน Toast
const showToast = (message, type = 'success') => {
  Toastify({
    text: message,
    duration: 3000,
    gravity: 'top',
    position: 'right',
    backgroundColor: type === 'success' ? 'green' : 'red',
    stopOnFocus: true
  }).showToast()
}






















let isSubmitting = false
const isReplying = ref({})
const uploadedFileData = ref(null) // เก็บข้อมูลไฟล์ที่อัปโหลด
const zoomedImage = ref(null)
const showImageModal = ref(false)
const replyFileData = ref({}) // Store uploaded files for each reply separately
const replyFileInputRefs = ref({})




// Function to toggle comment popup
const toggleCommentPopup = (isVisible) => {
  showCommentPopup.value = isVisible
  if (!isVisible) {
    currentPostComments.value = [] // Clear comments
    newComment.value = '' // Clear new comment text
    uploadedFileData.value = null // Clear uploaded file data
    Object.keys(isReplying.value).forEach(key => isReplying.value[key] = false) // ปิดฟิลด์ตอบกลับหลังจากเพิ่มคอมเมนต์ใหม่
    replyFileData.value = {} // Clear all reply files
  }
}


// addNewcomment
const addNewComment = async () => {
  if (!auth.currentUser) {
    showToast('กรุณาเข้าสู่ระบบก่อน', 'error')
    return
  }

  const commentText = newComment.value.trim()
  if (!commentText && !uploadedFileData.value) {
    showToast('กรุณากรอกคอมเมนต์หรือเลือกไฟล์', 'error')
    return
  }

  const userId = auth.currentUser.uid
  const email = auth.currentUser.email
  let displayName = 'Guest'
  let profileImage = ''
  let guideId = null  // เริ่มต้น guideId ด้วย null

  try {
    const userDoc = await getDoc(doc(db, 'users', userId))
    if (userDoc.exists()) {
      const userData = userDoc.data()
      displayName = userData.displayName || 'Guest'
      profileImage = userData.imageUrl || ''

      // ถ้าผู้ใช้เป็นไกด์ (role = 'Guide') ให้ใช้ uid จากฟิลด์ uid ของผู้ใช้นั้นเองในคอลเล็กชัน users เป็น guideId
      if (userData.role === 'guide') {
        guideId = userData.uid  // ใช้ uid จากคอลเล็กชัน users เป็น guideId
      }
    }
  } catch (error) {
    console.error('Error fetching user data:', error)
  }

  // สร้างข้อมูลคอมเมนต์
  const commentData = {
    email,
    displayName,
    profileImage,
    text: commentText,
    createdAt: serverTimestamp(),
    guideId: guideId || null,  // ถ้าเป็นไกด์จะใช้ guideId แทน userId
    fileData: uploadedFileData.value || null
  }

  const postDocRef = doc(db, 'jobPosts', currentPostId.value)

  try {
    const commentsCollection = collection(postDocRef, 'comments')
    await addDoc(commentsCollection, commentData)
    currentPostComments.value.unshift({
      ...commentData,
      createdAt: new Date().toLocaleString('th-TH')
    })
    newComment.value = ''
    uploadedFileData.value = null

    // รีเซ็ตฟิลด์และค่าอื่นๆ
    Object.keys(isReplying.value).forEach(key => isReplying.value[key] = false)
    emojiPickerForComment.value = false
    activeReplyId.value = null

    showToast('เพิ่มคอมเมนต์สำเร็จ', 'success')
  } catch (error) {
    console.error('Error adding comment:', error)
    showToast('เกิดข้อผิดพลาดในการเพิ่มคอมเมนต์', 'error')
  }
}












// Function to add a reply to a comment
const addReplyToComment = async (comment) => {
  if (!auth.currentUser) {
    showToast('กรุณาเข้าสู่ระบบก่อน', 'error');
    return;
  }

  const replyText = comment.newReply?.trim() || "";
  const fileData = replyFileData.value[comment.id] || null;

  if (!replyText && !fileData) {
    showToast('กรุณากรอกข้อความตอบกลับหรือเลือกไฟล์', 'error');
    return;
  }

  const userId = auth.currentUser.uid;
  let displayName = 'Guest';
  let profileImage = '';

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      displayName = userData.displayName || 'Guest';
      profileImage = userData.imageUrl || '';
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
  }

  const replyData = {
    text: replyText,
    displayName,
    profileImage,
    createdAt: serverTimestamp(),
    userId,
    fileData,
  };

  try {
    const repliesCollection = collection(doc(db, 'jobPosts', currentPostId.value, 'comments', comment.id), 'replies');
    await addDoc(repliesCollection, replyData);

    // Update UI
    if (!comment.replies) {
      comment.replies = [];
    }
    comment.replies.push({ ...replyData, createdAt: new Date().toLocaleString('th-TH') });
    comment.newReply = '';
    replyFileData.value[comment.id] = null;

    showToast('เพิ่มการตอบกลับสำเร็จ', 'success');
  } catch (error) {
    console.error('Error adding reply:', error);
    showToast('เกิดข้อผิดพลาดในการเพิ่มการตอบกลับ', 'error');
  }
};





const openReplyFileInput = (commentId) => {
  if (replyFileInputRefs.value[commentId]) {
    replyFileInputRefs.value[commentId].click();
  } else {
    console.error(`File input not found for comment ID: ${commentId}`);
    replyFileInputRefs.value[commentId] = null; // กำหนดค่าเริ่มต้นเป็น null หากยังไม่พบ
  }
};



// Toggle reply field visibility for a specific comment
const toggleReply = (comment) => {
  if (!comment || !comment.id) {
    console.error("Comment or Comment ID is undefined");
    return;
  }

  const commentId = comment.id;

  // Initialize reply data if it doesn't exist
  if (!(commentId in isReplying.value)) {
    isReplying.value[commentId] = false;
  }
  if (!(commentId in replyFileData.value)) {
    replyFileData.value[commentId] = null;
  }

  // Toggle the reply field visibility
  isReplying.value[commentId] = !isReplying.value[commentId];
  comment.newReply = '';  // Reset reply text field when toggling

  // Reset file data if closing the reply field
  if (!isReplying.value[commentId]) {
    replyFileData.value[commentId] = null;
  }
}




const scrollToLatestComment = () => {
  nextTick(() => {
    const commentList = document.getElementById('comment-list')
    if (commentList) {
      commentList.scrollTop = 0
    }
  })
}



// Open and close image modal
const openImageModal = (imageUrl) => {
  zoomedImage.value = imageUrl
  showImageModal.value = true
}

const closeImageModal = () => {
  zoomedImage.value = null
  showImageModal.value = false
}

// ฟังก์ชันเปิดคอมเมนต์ที่ใช้
const openComments = async (postId) => {
  if (!postId) {
    console.error('Post ID is undefined. Cannot open comments.')
    showToast('ไม่พบโพสต์นี้', 'error')
    return
  }
  currentPostId.value = postId
  showCommentPopup.value = true

  try {
    const postDocRef = doc(db, 'jobPosts', postId)
    const postSnapshot = await getDoc(postDocRef)

    if (postSnapshot.exists()) {
      currentPost.value = { ...postSnapshot.data(), id: postId }
      loadComments(postId)
      await nextTick()
      scrollToLatestComment()
    } else {
      showToast('ไม่พบข้อมูลโพสต์', 'error')
    }
  } catch (error) {
    console.error('Error fetching post:', error)
    showToast('เกิดข้อผิดพลาดในการดึงข้อมูลโพสต์', 'error')
  }
}





// ฟังก์ชันการโหลดข้อมูลคอมเมนต์และไกด์ พร้อมดึงข้อมูลการตอบกลับ
const loadComments = (postId) => {
  const commentsRef = collection(db, 'jobPosts', postId, 'comments')

  onSnapshot(commentsRef, async (snapshot) => {
    const commentsArray = await Promise.all(snapshot.docs.map(async (commentDoc) => {
      const commentData = commentDoc.data()
      const guideData = commentData.guideId ? (await getDoc(doc(db, 'guides', commentData.guideId))).data() : null

      const replies = (await getDocs(collection(commentDoc.ref, 'replies'))).docs.map(replyDoc => ({
        ...replyDoc.data(),
        id: replyDoc.id,
        createdAt: replyDoc.data().createdAt instanceof Timestamp
          ? replyDoc.data().createdAt.toDate().toLocaleString('th-TH')
          : 'Invalid Date'
      }))

      return {
        id: commentDoc.id,
        ...commentData,
        guideData,
        replies,
        createdAt: commentData.createdAt instanceof Timestamp
          ? commentData.createdAt.toDate().toLocaleString('th-TH')
          : 'Invalid Date'
      }
    }))

    currentPostComments.value = commentsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    scrollToLatestComment()
  })
}




// File upload handler for comments and replies
const handleFileUpload = (event, target = 'comment', comment = null) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onloadend = () => {
    const fileData = {
      url: reader.result,
      name: file.name,
      isImage: file.type.startsWith('image/'),
    };

    if (target === 'comment') {
      uploadedFileData.value = fileData;
    } else if (target === 'reply' && comment) {
      replyFileData.value[comment.id] = fileData;
    }
  };

  reader.onerror = (error) => {
    console.error('Error encoding file:', error);
    showToast('เกิดข้อผิดพลาดในการเข้ารหัสไฟล์', 'error');
  };

  reader.readAsDataURL(file); // Convert to Base64
};



const emojiPickerForComment = ref(false) // แสดงหรือซ่อน emoji picker
const activeReplyId = ref(null)
const emojiList = [
  '😊', '😂', '❤️', '👍', '🙏', '😎', '🤔', '😢', '😡', '🥳', '😍', '😭', '😅', '🤣', '🙌', '💪', '👀', '🔥', '💯',
  '👏', '😇', '😜', '👋', '😆', '😁', '🤩', '😋', '🤔', '😷', '🤯', '😴', '👻', '💩', '👽', '👑', '🎉', '💔',
  '😔', '😠', '😩', '😜', '🤤', '🤓', '😵', '😈', '🥶', '🥺', '🤠', '😏', '🥰', '😹', '😻', '🙈', '🙉', '🙊',
  '🎃', '👹', '👺', '👿', '💀', '👽', '👾', '🤖', '👼', '👶', '👧', '👦', '👩', '🧑', '👨', '👵', '👴', '👲',
  '🧕', '👳', '💁', '🙅', '🙆', '🧏', '🙇', '🤦', '🤷', '💁‍♂️', '🙅‍♀️', '🙆‍♂️', '🧏‍♀️', '🙇‍♂️', '🧘‍♀️',
  '🚶', '🏃', '💃', '🕺', '👫', '👬', '👭', '💏', '💑', '👪', '🕴️', '👯', '👩‍❤️‍💋‍👨', '💋', '👄', '👅', '🦷',
  '👂', '👃', '👁️', '👀', '🧠', '👤', '🧑‍🤝‍🧑', '👥', '💪', '🦾', '🦿', '🦵', '🦶', '👣', '🧥', '👚', '👕',
  '👔', '👗', '👙', '👖', '👘', '👠', '👡', '👢', '🥿', '👞', '👟', '🥾', '🧦', '🧤', '🧣', '🎩', '🧢', '👒',
  '⛑️', '🎓', '💍', '💄', '💎', '🔪', '🧸', '🎈', '🎉', '🎊', '🎁', '🧧', '🎀', '🥇', '🥈', '🥉', '🏅', '🎖️'
]

// ฟังก์ชันเปิดปิด Emoji Picker สำหรับคอมเมนต์
const toggleEmojiPickerForComment = () => {
  emojiPickerForComment.value = !emojiPickerForComment.value
  activeReplyId.value = null // ปิด emoji picker ของตอบกลับเมื่อเลือกคอมเมนต์
}

// ฟังก์ชันเปิดปิด Emoji Picker สำหรับตอบกลับ
const toggleEmojiPickerForReply = (commentId) => {
  activeReplyId.value = activeReplyId.value === commentId ? null : commentId // เปิด/ปิด emoji picker ของตอบกลับ
  emojiPickerForComment.value = false // ปิด emoji picker ของคอมเมนต์เมื่อเลือกตอบกลับ
}

// ฟังก์ชันเพิ่มอีโมจิลงในคอมเมนต์เป็นข้อความ
const addEmojiToComment = (emoji) => {
  newComment.value += emoji // เพิ่มอีโมจิในข้อความโดยตรงใน newComment
  emojiPickerForComment.value = false // ปิด emoji picker หลังเลือกแล้ว
}

// ฟังก์ชันเพิ่มอีโมจิลงในการตอบกลับเป็นข้อความ
const addEmojiToReply = (emoji, comment) => {
  comment.newReply = (comment.newReply || '') + emoji // เพิ่มอีโมจิในข้อความใน comment.newReply
  activeReplyId.value = null // ปิด emoji picker หลังเลือกแล้ว
}







// ตัวแปรและฟังก์ชันที่ใช้กับ Popup
const showOfferPopup = ref(false)
const offerPrice = ref('')
const offerDetails = ref('')
const additionalInfo = ref('')



// Toggle การเปิดปิด Popup
const toggleOfferPopup = () => {
    showOfferPopup.value = !showOfferPopup.value
}


// ฟังก์ชันส่งข้อเสนอ
const submitOffer = () => {
    // เพิ่มข้อมูลจาก Popup ลงใน newComment
    newComment.value = `ราคา : ${offerPrice.value} บาท\nรายละเอียดข้อเสนอ : ${offerDetails.value}\nข้อมูลเพิ่มเติม : ${additionalInfo.value}`

    // ปิด Popup และรีเซ็ตข้อมูล
    showOfferPopup.value = false
    offerPrice.value = ''
    offerDetails.value = ''
    additionalInfo.value = ''
}








let isNotificationSending = false

const sendNotification = async (message, postId) => {
  if (isNotificationSending) return

  const notificationData = {
    message,
    postId,
    timestamp: new Date().toISOString()
  }

  try {
    isNotificationSending = true
    const notificationsRef = firebaseRef(rtdb, 'notifications/')
    await push(notificationsRef, notificationData)
    showToast('การแจ้งเตือนถูกส่งเรียบร้อยแล้ว', 'success')
  } catch (error) {
    console.error('Error sending notification:', error)
    showToast('เกิดข้อผิดพลาดในการส่งการแจ้งเตือน: ' + error.message, 'error')
  } finally {
    isNotificationSending = false
  }
}








// ฟังก์ชันลบโพสต์ที่หมดอายุ
const deleteExpiredPosts = async () => {
  try {
    const postsRef = collection(db, 'jobPosts')
    const now = new Date();

    const expiredPostsQuery = query(postsRef, where('expiresAt', '<=', now), where('status', '==', 'active'))
    const expiredPostsSnapshot = await getDocs(expiredPostsQuery);

    const deletePromises = expiredPostsSnapshot.docs.map(async (doc) => {
      // เปลี่ยนสถานะเป็น 'expired'
      await updateDoc(doc.ref, { status: 'expired' });

      // ลบโพสต์จาก Firestore หลังจากหมดอายุ
      await deleteDoc(doc.ref)
    });

    await Promise.all(deletePromises); // รอการลบทั้งหมดให้เสร็จสมบูรณ์
    showToast('โพสต์ที่หมดอายุได้ถูกลบออกแล้ว', 'info')
  } catch (error) {
    console.error('Error deleting expired posts:', error)
    showToast('เกิดข้อผิดพลาดในการลบโพสต์ที่หมดอายุ', 'error')
  }
}


// ฟังก์ชันลบโพสต์และคอมเมนต์
const deletePost = async (postId, createdBy) => {
  if (!auth.currentUser) {
    showToast('กรุณาเข้าสู่ระบบก่อน', 'error')
    return;
  }

  if (createdBy !== auth.currentUser.uid) {
    showToast('คุณไม่มีสิทธิ์ในการดำเนินการนี้', 'error')
    return;
  }

  try {
    // ลบคอมเมนต์ที่เชื่อมโยงกับโพสต์ก่อน
    await deleteComments(postId)

    // ลบโพสต์จาก Firestore
    await deleteDoc(doc(db, 'jobPosts', postId))

    // ลบโพสต์จากหน้าจอใน Vue.js
    posts.value = posts.value.filter(post => post.postId !== postId)

    showToast('โพสต์ถูกลบเรียบร้อยแล้ว', 'success')
  } catch (error) {
    console.error('Error deleting post:', error)
    showToast('เกิดข้อผิดพลาดในการลบโพสต์: ' + error.message, 'error')
  }
}




// ฟังก์ชันลบคอมเมนต์ทั้งหมดที่เกี่ยวข้องกับโพสต์
const deleteComments = async (postId) => {
  try {
    const commentsCollectionRef = collection(db, 'jobPosts', postId, 'comments')
    const commentsSnapshot = await getDocs(commentsCollectionRef)

    // ลบคอมเมนต์ทีละรายการ
    const deletePromises = commentsSnapshot.docs.map(commentDoc => deleteDoc(commentDoc.ref))
    await Promise.all(deletePromises)
  } catch (error) {
    console.error('Error deleting comments:', error)
    throw new Error('เกิดข้อผิดพลาดในการลบคอมเมนต์')
  }
}












// ข้อมูลการสมัคร
const prefix = ref('')
const firstName = ref('')
const lastName = ref('')
const citizenId = ref('')
const address = ref('')
const province = ref('')
const district = ref('')
const subDistrict = ref('')
const postalCode = ref('')
const userEmail = ref(accountStore.user?.email || '')
const profileImageUrl = ref('')
const citizenCardFile = ref(null)
const selfieWithCitizenCardFile = ref(null) // เพิ่มตัวแปรนี้
const guideLicenseFile = ref(null)
const selfieWithGuideLicenseFile = ref(null) // เพิ่มตัวแปรนี้
const guideName = ref('')
const selectedPostIndex = ref(null)
const guideLicenseId = ref('')
const provinces = ref([
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร", "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", 
  "ชัยนาท", "ชัยภูมิ", "ชุมพร", "เชียงใหม่", "เชียงราย", "ตรัง", "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม", 
  "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส", "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์", 
  "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พังงา", "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่", 
  "พะเยา", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน", "ยะลา", "ยโสธร", "ร้อยเอ็ด", "ระนอง", "ระยอง", "ราชบุรี", 
  "ลพบุรี", "ลำปาง", "ลำพูน", "เลย", "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ", "สมุทรสงคราม", "สมุทรสาคร", 
  "สระแก้ว", "สระบุรี", "สิงห์บุรี", "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย", "หนองบัวลำภู", "อ่างทอง", 
  "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์", "อุทัยธานี", "อุบลราชธานี"
])







// ฟังก์ชันแปลงไฟล์เป็น Base64 พร้อมบีบอัดขนาดภาพไม่เกิน 30 KB
const convertToCompressedBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const img = new Image()
      img.src = reader.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        let width = img.width
        let height = img.height

        // กำหนดขนาดของภาพให้เล็กลง (800x600)
        const maxWidth = 800
        const maxHeight = 600

        // คำนวณสัดส่วนเพื่อปรับขนาดภาพ
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        // วาดภาพลงใน canvas ที่บีบอัดแล้ว
        ctx.drawImage(img, 0, 0, width, height)

        // บีบอัดภาพโดยเริ่มจากคุณภาพที่ 70%
        let quality = 0.7
        let compressedBase64 = canvas.toDataURL('image/jpeg', quality)

        // ตรวจสอบขนาดของ Base64 และลดคุณภาพจนกว่าจะน้อยกว่า 30 KB
        const targetSize = 30000 * 1.37 // เผื่อไว้สำหรับ encoding overhead (ประมาณ 37%)
        while (compressedBase64.length > targetSize && quality > 0.1) {
          quality -= 0.05 // ลดคุณภาพทีละน้อย
          compressedBase64 = canvas.toDataURL('image/jpeg', quality)
        }

        // ตรวจสอบว่าขนาดของ Base64 น้อยกว่า 20,000 KB หรือไม่
        const minSize = 20000 * 1.37
        if (compressedBase64.length < minSize) {
          while (compressedBase64.length < minSize && quality < 1) {
            quality += 0.05 // เพิ่มคุณภาพทีละน้อยเพื่อให้ได้ขนาดที่มากกว่า 20,000 KB
            compressedBase64 = canvas.toDataURL('image/jpeg', quality)
          }
        }

        resolve(compressedBase64)
      }
      img.onerror = (error) => reject(error)
    }
    reader.onerror = (error) => reject(error)
  })
}






// ฟังก์ชันการสมัครไกด์และบันทึกไฟล์ Base64 ที่บีบอัดลงใน Firestore
const handleGuideApplication = async () => {
  // ตรวจสอบสถานะการล็อกอิน
  if (!auth || !auth.currentUser) {
    showToast('กรุณาเข้าสู่ระบบก่อน', 'error')
    return
  }

  // ตรวจสอบบทบาทของผู้ใช้ (เฉพาะ 'user' เท่านั้นที่สามารถสมัครไกด์ได้)
  if (accountStore.user?.role !== 'user') {
    showToast('เฉพาะผู้ใช้ทั่วไปเท่านั้นที่สามารถสมัครไกด์ได้', 'error')
    return
  }

  // ตรวจสอบว่าข้อมูลที่จำเป็นทั้งหมดถูกกรอกครบถ้วน
  if (
    !prefix.value || 
    !firstName.value || 
    !lastName.value || 
    !citizenId.value || 
    !address.value || 
    !province.value || 
    !district.value || 
    !subDistrict.value || 
    !postalCode.value || 
    !guideLicenseId.value
  ) {
    showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'error')
    return
  }

  // ตรวจสอบว่าไฟล์ที่จำเป็นทั้งหมดถูกอัปโหลด
  if (
    !citizenCardFile.value || 
    !selfieWithCitizenCardFile.value || 
    !guideLicenseFile.value || 
    !selfieWithGuideLicenseFile.value
  ) {
    showToast('กรุณาอัปโหลดไฟล์ที่จำเป็นทั้งหมด', 'error')
    return
  }

  try {
    // แปลงและบีบอัดไฟล์ภาพเป็น Base64 ที่ขนาดไม่เกิน 30 KB
    const citizenCardBase64 = await convertToCompressedBase64(citizenCardFile.value)
    const selfieWithCitizenCardBase64 = await convertToCompressedBase64(selfieWithCitizenCardFile.value)
    const guideLicenseBase64 = await convertToCompressedBase64(guideLicenseFile.value)
    const selfieWithGuideLicenseBase64 = await convertToCompressedBase64(selfieWithGuideLicenseFile.value)

    // บันทึกข้อมูลการสมัครไกด์ใน Firestore
    await setDoc(doc(db, 'guideApplications', auth.currentUser.uid), {
      userId: auth.currentUser.uid,
      guideLicenseId: guideLicenseId.value,
      prefix: prefix.value,
      firstName: firstName.value,
      lastName: lastName.value,
      email: auth.currentUser.email,
      citizenId: citizenId.value,
      address: address.value,
      province: province.value,
      district: district.value,
      subDistrict: subDistrict.value,
      postalCode: postalCode.value,
      citizenCardImage: citizenCardBase64.split(',')[1], // ตัด 'data:image/jpeg;base64,' ออก
      selfieWithCitizenCardImage: selfieWithCitizenCardBase64.split(',')[1],
      guideLicenseImage: guideLicenseBase64.split(',')[1],
      selfieWithGuideLicenseImage: selfieWithGuideLicenseBase64.split(',')[1],
      status: 'pending', // กำหนดสถานะเริ่มต้นเป็น 'pending'
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    // แจ้งเตือนเมื่อการสมัครสำเร็จ
    showToast('ส่งข้อมูลสมัครไกด์สำเร็จ', 'success')
    closeModal()

  } catch (error) {
    console.error('Error during guide application:', error)
    showToast(`เกิดข้อผิดพลาดในการส่งข้อมูล: ${error.message}`, 'error')
  }
}




// ฟังก์ชันจัดการไฟล์ที่อัปโหลด
const handleCitizenCardUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    citizenCardFile.value = file
  }
}

const handleSelfieWithCitizenCardUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    selfieWithCitizenCardFile.value = file
  }
}

const handleGuideLicenseUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    guideLicenseFile.value = file
  }
}

const handleSelfieWithGuideLicenseUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    selfieWithGuideLicenseFile.value = file
  }
}

// ฟังก์ชันปิดป๊อปอัพ
const closeModal = () => {
  showGuideSignUpForm.value = false
  
}



















// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้หรือไกด์ตามบทบาทและ ID/UID
const fetchDataByRole = async (role, idOrUid, isUid = false) => {
  if (!role || !idOrUid) {
    console.warn('ระบุ role และ ID/UID ให้ถูกต้อง')
    return null
  }

  try {
    const collectionName = role === 'guide' ? 'guides' : 'users'
    const collectionRef = collection(db, collectionName)

    if (isUid) {
      // กรณีค้นหาด้วย UID
      const q = query(collectionRef, where('uid', '==', idOrUid))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        // คืนข้อมูลผู้ใช้หรือไกด์ที่ตรงกับ UID
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))[0]
      } else {
        console.warn(`ไม่พบข้อมูลใน ${collectionName} ที่มี UID: ${idOrUid}`)
        return null
      }
    } else {
      // กรณีค้นหาด้วย ID
      const docRef = doc(db, collectionName, idOrUid)
      const docSnapshot = await getDoc(docRef)

      if (docSnapshot.exists()) {
        // คืนข้อมูลผู้ใช้หรือไกด์ที่ตรงกับ ID
        return { id: docSnapshot.id, ...docSnapshot.data() }
      } else {
        console.warn(`ไม่พบข้อมูลใน ${collectionName} ที่มี ID: ${idOrUid}`)
        return null
      }
    }
  } catch (error) {
    console.error(`เกิดข้อผิดพลาดในการดึงข้อมูล ${role}:`, error)
    return null
  }
}






 




// ยืนยันไกด์


const isGuideApproved = ref(false)
const showLoginModal = ref(false)
const toastVisible = ref(false)
const post = ref(null)

const showChatPopup = ref(false)
const selectedChatId = ref(null)
const newMessage = ref('')
const messages = ref([])
const filePreview = ref(null) // ประกาศ filePreview เพื่อเก็บข้อมูลไฟล์ตัวอย่าง
const showEmojiPicker = ref(false)




//จองไกด์



const getEmailLink = (email) => {
  if (!email) return '#'

  const domain = email.split('@')[1].toLowerCase()

  if (domain === 'gmail.com') {
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${email}`
  } else if (domain === 'yahoo.com') {
    return `https://compose.mail.yahoo.com/?to=${email}`
  } else if (domain === 'outlook.com' || domain === 'hotmail.com') {
    return `https://outlook.live.com/owa/?path=/mail/action/compose&to=${email}`
  } else {
    // สำหรับโดเมนอื่น ๆ ใช้ mailto โดยตรง
    return `mailto:${email}`
  }
}





// Extract the offer price from guide's comment
const extractOfferPrice = (commentText) => {
  const match = commentText.match(/ราคา\s*(\d+)\s*บาท/)
  return match ? parseInt(match[1]) : 0
}



// Usage of handleCommentClick with viewProfile flag
// For example, if the user clicks explicitly to view the profile
const openGuideProfile = (comment) => {
  handleCommentClick(comment, true) // Set viewProfile to true to open the profile
}

// For general comments or interactions, call without opening profile
const openCommentWithoutProfile = (comment) => {
  handleCommentClick(comment, false) // Set viewProfile to false to avoid opening the profile
}


// ฟังก์ชันโหลดข้อมูลโพสต์
const loadCurrentPost = async (postId) => {
  try {
    // อ้างอิงเอกสารโพสต์จาก Firestore
    const postDocRef = firebase.firestore().doc(`jobPosts/${postId}`)
    const postSnapshot = await postDocRef.get()

    if (postSnapshot.exists) {
      currentPost.value = postSnapshot.data()
    } else {
      showToast('ไม่พบโพสต์ที่ต้องการ', 'error')
    }
  } catch (error) {
    console.error('Error loading post:', error)
    showToast('เกิดข้อผิดพลาดในการโหลดโพสต์', 'error')
  }
}



const selectedAmount = ref(null); // ให้แน่ใจว่าใช้ ref




// ฟังก์ชันคลิกคอมเมนต์
const handleCommentClick = async (comment, viewProfile = false) => {
  // ตรวจสอบว่ามีข้อมูลคอมเมนต์และ Guide ID หรือไม่
  if (!comment || !comment.guideId) {
    showToast('ไม่พบ Guide ID ที่ถูกต้อง', 'error')
    console.error('Invalid comment or missing guideId:', comment)
    return
  }

  try {
    // ตรวจสอบว่าใครเป็นเจ้าของโพสต์
    const postDocRef = doc(db, 'jobPosts', currentPostId.value)
    const postSnapshot = await getDoc(postDocRef)
    if (postSnapshot.exists()) {
      const postData = postSnapshot.data()
      const postCreatorId = postData.createdBy

      // ตรวจสอบว่าผู้ใช้ปัจจุบันเป็นเจ้าของโพสต์หรือไม่
      if (auth.currentUser.uid !== postCreatorId) {
        showToast('คุณไม่มีสิทธิ์ในการดูคอมเมนต์นี้', 'error')
        return
      }

      // ดึงราคาไกด์จากคอมเมนต์
      const guidePrice = fetchGuidePriceFromComment(comment) || 0
      const separateBudget = postData.separateBudget ? parseInt(postData.separateBudget, 10) : 0
      selectedAmount.value = guidePrice + separateBudget
      console.log(`Total Payment Amount: ${selectedAmount.value}`)
    } else {
      showToast('ไม่พบข้อมูลโพสต์', 'error')
      return
    }

    // ดึงข้อมูลไกด์จากคอลเล็กชัน "guides" โดยใช้ guideId จากคอมเมนต์
    const guideDocRef = doc(db, 'guides', comment.guideId)
    const guideSnapshot = await getDoc(guideDocRef)

    if (guideSnapshot.exists()) {
      const guideData = guideSnapshot.data()
      selectedGuide.value = {
        ...guideData,
        guideId: comment.guideId,
      }
      if (viewProfile) { // Show the guide profile only if explicitly requested
        showGuideProfilePopup.value = true
      }
    } else {
      showToast('ไม่พบข้อมูลไกด์', 'error')
    }
  } catch (error) {
    console.error('Error fetching guide data:', error)
    showToast('เกิดข้อผิดพลาดในการดึงข้อมูลไกด์', 'error')
  }
  await viewGuideProfileFromComment(comment) 
}


const showReviewPopup = ref(false)
const selectedGuideReviews = ref([])
const selectedGuideName = ref('')
const showGuideReviewsPopup = ref(false)
const guideReviews = ref([])




const viewGuideProfileFromComment = async (comment) => {
  if (!comment || !comment.guideId) {
    showToast('ไม่พบข้อมูลคอมเมนต์หรือ Guide ID ไม่ถูกต้อง', 'error')
    return
  }
  const userId = auth.currentUser.uid
  let displayName = 'Guest'
  let profileImage = ''
  let guideId = null

  try {
    // ใช้การค้นหาด้วยฟิลด์ uid ใน users คอลเล็กชัน
    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('uid', '==', comment.guideId))
    const querySnapshot = await getDocs(q)

    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data() // ใช้เอกสารแรกที่เจอ

      if (userData.role === 'guide') {
        selectedGuide.value = {
          guideId: comment.guideId,
          displayName: userData.displayName || 'ไม่พบชื่อไกด์',
          email: userData.email || 'ไม่พบอีเมล',
          profileImage: userData.imageUrl || '',
        }

        // ดึงข้อมูลรีวิวเพื่อคำนวณคะแนนเฉลี่ย
        const reviewsRef = collection(db, 'guides', comment.guideId, 'reviews')
        const reviewsSnapshot = await getDocs(reviewsRef)
        const reviews = reviewsSnapshot.docs.map((doc) => doc.data())
        const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0)
        const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : '0'

        // เพิ่มค่า averageRating ใน selectedGuide
        selectedGuide.value.averageRating = averageRating

        // เปิด popup โปรไฟล์ไกด์
        showGuideProfilePopup.value = true
      } else {
        showToast('ผู้ใช้ไม่ใช่ไกด์', 'error')
      }
    } else {
      showToast('ไม่พบข้อมูลผู้ใช้ใน Firestore', 'error')
      console.error(`Guide ID: ${comment.guideId} ไม่พบใน users collection`)
    }
  } catch (error) {
    console.error('Error fetching guide data:', error)
    showToast('เกิดข้อผิดพลาดในการดึงข้อมูลไกด์', 'error')
  }
}




// ฟังก์ชันเปิดแชทและเลื่อนไปยังแชทล่าสุด
const startChat = async (guideId) => {
  const userId = auth.currentUser.uid
  const chatId = `${guideId}_${userId}`  // ใช้ GuideId และ UserId สร้าง ID ห้องสนทนา

  const chatRef = doc(db, 'chats', chatId)
  const chatSnapshot = await getDoc(chatRef)

  if (!chatSnapshot.exists()) {
    // ถ้าไม่มีแชทระหว่างคู่สนทนา ให้สร้างเอกสารใหม่ใน `chats`
    await setDoc(chatRef, {
      guideId: guideId,
      userId: userId,
      createdAt: serverTimestamp()
    })
  }

  // ตั้งค่า ID ของแชทก่อนเปิดหน้าต่างแชท
  selectedChatId.value = chatId
  showChatPopup.value = true  // แสดงหน้าต่างแชท
  loadMessages(chatId)  // โหลดข้อความในแชทและเลื่อนไปยังข้อความล่าสุด
}






// เรียกฟังก์ชันเมื่อเปิดใช้งานหรือเปลี่ยนแชท
onMounted(() => {
  if (selectedChatId.value) {
    loadMessages(selectedChatId.value)
  }
})



// โหลดข้อความแชทและเลื่อนไปที่ข้อความล่าสุด
const loadMessages = (chatId) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages')
  const q = query(messagesRef, orderBy('createdAt', 'asc'))

  onSnapshot(q, (snapshot) => {
    messages.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    scrollToLatestMessage() // เลื่อนไปที่ข้อความล่าสุดหลังจากโหลดข้อความ
  })
}

// ฟังก์ชันส่งข้อความและเลื่อนไปยังข้อความล่าสุด
const sendMessage = async () => {
  if (newMessage.value.trim() === '' && !filePreview.value) return

  const isGuide = selectedChatId.value.startsWith(auth.currentUser.uid)
  const receiverId = isGuide ? selectedChatId.value.split('_')[1] : selectedChatId.value.split('_')[0]

  const messageData = {
    senderId: auth.currentUser.uid,
    receiverId: receiverId,
    text: newMessage.value,
    createdAt: serverTimestamp(),
  }

  if (filePreview.value) {
    messageData.fileUrl = filePreview.value.url
    messageData.fileName = filePreview.value.isImage ? null : filePreview.value.name
    messageData.isImage = filePreview.value.isImage
    filePreview.value = null
  }

  await addDoc(collection(db, 'chats', selectedChatId.value, 'messages'), messageData)
  newMessage.value = ''
  scrollToLatestMessage() // เลื่อนไปที่ข้อความล่าสุดหลังจากส่งข้อความ
}




// ฟังก์ชันกด Enter เพื่อส่งข้อความ
const handleKeyPress = (event) => {
  if (event.key === 'Enter') {
    sendMessage()
  }
}



watch(selectedChatId, (newChatId) => {
  if (newChatId) {
    loadMessages(newChatId)
  }
})


// ฟังก์ชันเลื่อนไปยังข้อความล่าสุด
const scrollToLatestMessage = () => {
  const chatContainer = document.querySelector('.overflow-y-auto')
  if (chatContainer) {
    chatContainer.scrollTop = chatContainer.scrollHeight
  }
}



// ฟังก์ชันเปิด/ปิด Emoji Picker
const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value
}


// ฟังก์ชันเพิ่มอีโมจิลงในข้อความ
const addEmojiToMessage = (emoji) => {
  newMessage.value += emoji
  showEmojiPicker.value = false
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB


// ฟังก์ชันจัดการการอัปโหลดไฟล์พร้อมแสดงตัวอย่างเป็น Base64 แต่ยังไม่ส่งไปที่ Firestore ทันที
const uploadChatFile = (event) => {
  const selectedFile = event.target.files[0];
  if (!selectedFile) return;

  // ตรวจสอบขนาดไฟล์
  if (selectedFile.size > MAX_FILE_SIZE) {
    showToast("ไฟล์มีขนาดเกินที่กำหนด (10MB)", "error");
    return;
  }

  const isImage = selectedFile.type.startsWith("image/");

  // สร้างตัวอย่างไฟล์ก่อนส่ง
  const reader = new FileReader();
  reader.onloadend = () => {
    filePreview.value = {
      url: reader.result, // ใช้ Base64 URL สำหรับการแสดงผล
      name: selectedFile.name,
      isImage: isImage,
    };
  };

  reader.onerror = (error) => {
    console.error("Error reading file:", error);
    showToast("เกิดข้อผิดพลาดในการเข้ารหัสไฟล์", "error");
  };

  reader.readAsDataURL(selectedFile); // Convert file to Base64
};

// Format timestamp for display
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = timestamp.toDate();
  const now = new Date();
  const differenceInSeconds = Math.floor((now - date) / 1000);

  if (differenceInSeconds < 60) {
    return `${differenceInSeconds} วินาทีที่แล้ว`;
  }

  const differenceInMinutes = Math.floor(differenceInSeconds / 60);
  if (differenceInMinutes < 60) {
    return `${differenceInMinutes} นาทีที่แล้ว`;
  }

  const differenceInHours = Math.floor(differenceInMinutes / 60);
  if (differenceInHours < 24) {
    return `${differenceInHours} ชั่วโมงที่แล้ว`;
  }

  // ถ้าเกิน 24 ชั่วโมง ให้แสดงเป็นวัน เดือน ปี
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};







// Function to navigate to the guide reviews page
const viewGuideReviews = (guideId) => {
  if (!guideId) return showToast('ไม่พบข้อมูลไกด์', 'error')
  router.push({ name: 'GuideReviews', params: { guideId } })
}


// Function to load guide profile and reviews
const loadGuideProfileAndReviews = async (guideId) => {
  if (!guideId) return showToast('ไม่พบข้อมูลไกด์', 'error')
  try {
    const guideRef = doc(db, 'guides', guideId)
    const guideSnapshot = await getDoc(guideRef)
    if (guideSnapshot.exists()) {
      selectedGuide.value = guideSnapshot.data()
      selectedGuide.value.guideId = guideId

      const reviewsRef = collection(db, 'guides', guideId, 'reviews')
      const reviewsSnapshot = await getDocs(reviewsRef)
      guideReviews.value = reviewsSnapshot.docs.map((doc) => doc.data())

      const totalRating = guideReviews.value.reduce((sum, review) => sum + (review.rating || 0), 0)
      averageRating.value = (guideReviews.value.length ? (totalRating / guideReviews.value.length).toFixed(1) : 0)

      showGuideProfilePopup.value = true
    } else {
      showToast('ไม่พบข้อมูลไกด์ใน Firestore', 'error')
    }
  } catch (error) {
    console.error('Error loading guide data and reviews:', error)
    showToast('เกิดข้อผิดพลาดในการดึงข้อมูลไกด์และรีวิว', 'error')
  }
}


// Function to load reviews only
const loadGuideReviews = async (guideId) => {
  if (!guideId) return showToast('ไม่พบข้อมูลไกด์', 'error')
  try {
    const reviewsRef = collection(db, 'guides', guideId, 'reviews')
    const reviewsSnapshot = await getDocs(reviewsRef)
    guideReviews.value = reviewsSnapshot.docs.map((doc) => doc.data())
  } catch (error) {
    console.error('Error loading guide reviews:', error)
    showToast('เกิดข้อผิดพลาดในการโหลดรีวิวไกด์', 'error')
  }
}

// Computed property to calculate average rating
const averageRating = computed(() => {
  if (guideReviews.value.length === 0) return 0
  const totalStars = guideReviews.value.reduce((sum, review) => sum + (review.stars || 0), 0)
  return (totalStars / guideReviews.value.length).toFixed(1)
})


// Function to open the review popup
const openReviewPopup = (guide) => {
  loadGuideReviews(guide.guideId)
  selectedGuide.value = guide
  showReviewPopup.value = true
}



// Function to close the reviews popup
const closeGuideReviewsPopup = () => {
  showReviewPopup.value = false
}



















// ฟังก์ชันสำหรับการจองไกด์
const confirmGuideSelection = async (postId, guideId) => {
  if (isSubmitting) return
  isSubmitting = true

  // ตรวจสอบการล็อกอินของผู้ใช้
  if (!auth.currentUser) {
    showToast('กรุณาเข้าสู่ระบบก่อน', 'error')
    isSubmitting = false
    return
  }

  // ตรวจสอบค่าของ postId และ guideId
  console.log('postId:', postId, 'guideId:', guideId)

  if (!postId || !guideId) {
    console.error('postId หรือ guideId ไม่ถูกต้อง')
    showToast('ข้อมูลโพสต์หรือไกด์ไม่ครบถ้วน', 'error')
    isSubmitting = false
    return
  }

  try {
    // ตรวจสอบ role ของผู้ใช้
    const userData = await getUserData(auth.currentUser.uid)

    if (!userData || userData.role !== 'user') {
      showToast('การจองไกด์ต้องใช้บัญชี User', 'error')
      isSubmitting = false
      return
    }

    // ตรวจสอบการจองที่ยังไม่เสร็จสมบูรณ์
    const userPendingBooking = await checkPendingBooking({ userId: auth.currentUser.uid })

    if (userPendingBooking) {
      const existingBookingGuideId = userPendingBooking.guideId

      // ตรวจสอบว่าเป็นการจองซ้ำกับไกด์คนเดิมหรือไม่
      if (existingBookingGuideId === guideId) {
        showToast('ไม่สามารถกดยืนยันซ้ำได้', 'error')
        isSubmitting = false
        return
      } else {
        showToast('คุณมีการจองไกด์ก่อนหน้าอยู่แล้ว', 'error')
        isSubmitting = false
        return
      }
    }

    // ดำเนินการจองไกด์ต่อไปและเพิ่ม acceptJob พร้อมกับ amount
    const newAcceptJobId = await addAcceptJob(postId, guideId, selectedAmount)

    if (newAcceptJobId) {
      showToast('เลือกไกด์สำเร็จ', 'success')
      await handleGenerateQRCode(postId, guideId) // สร้าง QR Code สำหรับการชำระเงิน

      // Update the job post to indicate guide confirmation
      const jobPostRef = doc(db, 'jobPosts', postId)
      await updateDoc(jobPostRef, {
        guideConfirmed: true,  // Mark that the guide is confirmed
        confirmedGuideId: guideId  // Store the selected guide ID for reference
      })

      showToast('โพสต์อัปเดตเพื่อแสดงการยืนยันการจองแล้ว', 'success')
    }

  } catch (error) {
    showToast('เกิดข้อผิดพลาดในการยืนยันการเลือกไกด์', 'error')
    console.error('Error:', error)
  } finally {
    isSubmitting = false
  }
}






// ฟังก์ชันการอัปเดตสถานะการจอง
const updateBookingStatus = async (postId, guideId) => {
  // อัปเดตสถานะไกด์ใน Firestore
  await activateGuide(guideId)

  // อัปเดตสถานะโพสต์เป็น 'under booking'
  const postDocRef = doc(db, 'jobPosts', postId)
  await updateDoc(postDocRef, {
    status: 'under booking',
    selectedGuide: guideId
  })

  // เพิ่มการจองใน Firestore
  await addAcceptJob(postId, guideId, guideOfferPrice.value)
}


// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้จาก Firestore
const getUserData = async (userId) => {
  try {
    const userDocRef = doc(db, 'users', userId)
    const userSnapshot = await getDoc(userDocRef)

    if (userSnapshot.exists()) {
      return userSnapshot.data()
    } else {
      return null
    }
  } catch (error) {
    showToast('เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้', 'error')
    return null
  }
}



// ฟังก์ชันตรวจสอบการจองที่ยังไม่เสร็จสมบูรณ์หรือการจองซ้ำ
const checkPendingBooking = async ({ userId }) => {
  try {
    const bookingsRef = collection(db, 'acceptJob')
    const bookingsQuery = query(
      bookingsRef,
      where('userId', '==', userId),
      where('status', 'in', ['under booking', 'accepted'])
    )

    const bookingsSnapshot = await getDocs(bookingsQuery)

    // ตรวจสอบว่ามีการจองที่ยังไม่เสร็จสมบูรณ์
    if (!bookingsSnapshot.empty) {
      return bookingsSnapshot.docs[0].data() // คืนค่าข้อมูลการจอง
    }

    return null // ไม่มีการจองที่ยังไม่เสร็จสมบูรณ์
  } catch (error) {
    showToast('เกิดข้อผิดพลาดในการตรวจสอบการจอง', 'error')
    return null
  }
}



// ฟังก์ชันการยืนยันไกด์และอัปเดตสถานะใน Firestore
const activateGuide = async (guideId) => {
  if (!guideId) {
    showToast('ไม่พบข้อมูลไกด์ที่ถูกต้อง', 'error')
    return
  }

  try {
    const guideDocRef = doc(db, 'guides', guideId)
    await updateDoc(guideDocRef, { isActive: true })

    showToast('อัปเดตสถานะไกด์สำเร็จ', 'success')
  } catch (error) {
    showToast('เกิดข้อผิดพลาดในการอัปเดตสถานะไกด์', 'error')
  }
}




// ฟังก์ชันการเขียนข้อมูลการจองและยืนยันไกด์ใน Firestore
const addAcceptJob = async (postId, guideId, amount, slipData) => {
  if (!auth.currentUser) {
    showToast('กรุณาเข้าสู่ระบบก่อน', 'error')
    return null
  }

  if (!postId || !guideId) {
    showToast('ไม่พบข้อมูลโพสต์หรือข้อมูลไกด์ที่ถูกต้อง', 'error')
    return null
  }

  try {
    // ตรวจสอบและแปลงค่า amount เป็น number หรือ string ก่อนบันทึก
    const amountValue = typeof amount === 'object' && amount._value !== undefined 
      ? amount._value 
      : amount

    // สร้างเอกสาร acceptJob
    const acceptJobRef = await addDoc(collection(db, 'acceptJob'), {
      postId,
      guideId,
      userId: auth.currentUser.uid,
      amount: amountValue, // บันทึกค่าเป็น number หรือ string ตามต้องการ
      status: 'accepted',
      acceptedAt: serverTimestamp(),
      createdAt: serverTimestamp()
    })

    acceptJobId.value = acceptJobRef.id // เก็บ ID ของ acceptJob

    // เพิ่มข้อมูลสลิปใน subcollection "slips" ของ acceptJob
    if (slipData && slipData.imageUrl) {
      slipData.userId = auth.currentUser.uid
      slipData.uploadDate = Timestamp.now()

      // เพิ่มข้อมูลสลิปใน subcollection "slips" ภายใต้ acceptJob
      await addDoc(collection(db, 'acceptJob', acceptJobId.value, 'slips'), slipData)

      // แสดง Toastify สำหรับการอัพโหลดสลิป
      showToast('อัพโหลดสลิปสำเร็จ รอสักครู่ กำลังตรวจสอบ...', 'success')
    }

    // แสดง Toastify สำหรับการจอง
    showToast('บันทึกการจองและยืนยันการเลือกไกด์สำเร็จ', 'success')
    return acceptJobId.value
  } catch (error) {
    console.error('Error adding acceptJob:', error)
    showToast('เกิดข้อผิดพลาดในการบันทึกและยืนยันการจองไกด์', 'error')
    return null
  }
}










// ฟังก์ชันปิดป๊อปอัพแสดงโปรไฟล์ไกด์
const closeGuideProfilePopup = () => {
  showGuideProfilePopup.value = false
  selectedGuide.value = null
}







// State Variables
const selectedGuideId = ref(null)
const showPaymentPopup = ref(false)
const showPaymentSuccessPopup = ref(false)
const qrCodeUrl = ref('')
const guideOfferPrice = ref(0)
const countdown = ref(300) // 300 วินาที = 5 นาที
let countdownInterval

const twoDigits = (value) => value.toString().padStart(2, '0')

const userAdditionalBudget = parseInt(separateBudget.value.toString().replace(/,/g, '')) || 0;




// ฟังก์ชันดึงข้อมูลจาก acceptJob
const fetchAcceptJobData = async (userId) => {
  try {
    const acceptJobQuery = query(
      collection(db, 'acceptJob'),
      where('userId', '==', userId),
      where('status', '==', 'accepted')
    )

    const acceptJobSnapshot = await getDocs(acceptJobQuery)

    if (!acceptJobSnapshot.empty) {
      const acceptJobDoc = acceptJobSnapshot.docs[0] // เอาเอกสารแรกที่เจอ
      const acceptJobData = acceptJobDoc.data()

      return {
        postId: acceptJobData.postId,
        guideId: acceptJobData.guideId
      }
    } else {
      console.error('ไม่พบข้อมูลการจองใน acceptJob')
      return null
    }
  } catch (error) {
    console.error('Error fetching acceptJob data:', error)
    return null
  }
}



// ฟังก์ชันดึง separateBudget และคำนวณยอดรวมกับ userAdditionalBudget
const fetchSeparateBudgetAndCalculateTotal = async (postId, userAdditionalBudget, userId) => {
   try {
      const postRef = doc(db, 'jobPosts', postId);
      const postSnapshot = await getDoc(postRef);

      if (postSnapshot.exists()) {
         const postData = postSnapshot.data();

         // ตรวจสอบว่าโพสต์นี้เป็นของผู้ใช้งานหรือไม่
         if (postData.createdBy === userId || postData.createdByEmail === accountStore.user.email) {
            // ตรวจสอบว่ามี separateBudget หรือไม่
            const separateBudget = postData.separateBudget ? parseInt(postData.separateBudget, 10) : 0;
            const totalAmount = separateBudget + (userAdditionalBudget || 0);

            selectedAmount.value = totalAmount;

            console.log(`Total Payment Amount: ${totalAmount}`);
            return totalAmount;
         } else {
            console.error('ผู้ใช้งานไม่มีสิทธิ์ในโพสต์นี้');
            showToast('คุณไม่มีสิทธิ์ในโพสต์นี้', 'error');
            return null;
         }
      } else {
         console.error('ไม่พบเอกสาร jobPosts ที่ระบุ');
         return userAdditionalBudget;
      }
   } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูล separateBudget:', error);
      return userAdditionalBudget;
   }
}




// ฟังก์ชันดึงราคาจากคอมเมนต์ 
const fetchGuidePriceFromComment = (comment) => {
  const amountMatch = comment.text.match(/\d+/) // ค้นหาหมายเลขในข้อความ
  return amountMatch ? parseInt(amountMatch[0]) : null // คืนค่าจำนวนเงิน
}


// ฟังก์ชันที่เรียกใช้เมื่อกดปุ่มยืนยันการเลือกไกด์
const handleGenerateQRCode = async (postId, guideId) => {
  console.log('postId:', postId, 'guideId:', guideId)

  if (postId && guideId) {
    try {
      // ไม่ต้องเรียก fetchSeparateBudgetAndCalculateTotal อีกครั้ง เพราะได้คำนวณใน handleCommentClick แล้ว
      generatePaymentQRCode() // เรียกฟังก์ชัน generatePaymentQRCode โดยตรง
    } catch (error) {
      console.error('Error in handleGenerateQRCode:', error)
      showToast('เกิดข้อผิดพลาดในการสร้าง QR Code', 'error')
    }
  } else {
    console.error('postId หรือ guideId ไม่ถูกต้อง')
    showToast('ข้อมูลโพสต์หรือไกด์ไม่ครบถ้วน', 'error')
  }
}





// ฟังก์ชันสร้าง QR Code สำหรับการชำระเงิน
const generatePaymentQRCode = () => {
  if (selectedAmount.value != null) { // ตรวจสอบ selectedAmount.value
    guideOfferPrice.value = selectedAmount.value; // ตั้งค่าจำนวนเงินให้ตรงกับที่เลือก
    qrCodeUrl.value = generateQRCode(selectedAmount.value.toString()); // ใช้ฟังก์ชันจาก qrUtils.js โดยแปลงค่าเป็น string
    showPaymentPopup.value = true;
    startCountdownUI(); // เริ่มการนับเวลาถอยหลัง
    console.log('สร้าง QR Code สำเร็จสำหรับจำนวนเงิน:', selectedAmount.value);
  } else {
    console.error('ไม่พบจำนวนเงินที่ถูกต้องในการสร้าง QR Code');
    showToast('ไม่พบจำนวนเงินที่ถูกต้องในการสร้าง QR Code', 'error');
  }
}



// ฟังก์ชันเริ่มการนับเวลาถอยหลัง
const startCountdownUI = () => {
  clearInterval(countdownInterval)
  countdown.value = 300

  // เริ่มการนับถอยหลัง
  countdownInterval = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      clearInterval(countdownInterval)
      qrCodeUrl.value = ''
      showPaymentPopup.value = false
      console.error('หมดเวลาการชำระเงิน')
    }
  }, 1000)
}

const acceptJobId = ref('') 
const slipImage = ref(null)





// ฟังก์ชันสำหรับการเลือกไฟล์สลิป
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onloadend = () => {
      if (reader.result) {
        slipImage.value = reader.result // แปลงเป็น Base64
      } else {
        console.error('การแปลงไฟล์เป็น Base64 ล้มเหลว')
        alert('การแปลงไฟล์เป็น Base64 ล้มเหลว กรุณาลองอัปโหลดไฟล์ใหม่')
      }
    }
  } else {
    console.error('ไม่พบไฟล์ที่จะอัปโหลด')
    alert('กรุณาเลือกไฟล์เพื่ออัปโหลด')
  }
}


// ฟังก์ชันการอัพโหลดสลิป
const handleUploadSlip = () => {
  if (!acceptJobId.value) {
    console.error('Invalid acceptJobId:', acceptJobId.value)
    showToast('เกิดข้อผิดพลาดในการสร้าง acceptJob', 'error');
    alert('acceptJobId ไม่ถูกต้อง')
    return
  }
  uploadSlip(acceptJobId.value, auth.currentUser.uid)
}


// ฟังก์ชันการอัพโหลดสลิป
const uploadSlip = async (acceptJobId, userId) => {
  if (!slipImage.value) {
    showToast('กรุณาอัพโหลดสลิปก่อน', 'error')
    return
  }

  try {
    const slipData = {
      userId,
      uploadDate: new Date().toISOString(), // แปลงวันที่เป็น ISO string
      imageUrl: slipImage.value, // ใช้ Base64
      status: 'pending',
    }

    // ตรวจสอบการมีอยู่ของเอกสาร acceptJob
    const acceptJobRef = doc(db, 'acceptJob', acceptJobId)
    const docSnapshot = await getDoc(acceptJobRef)
    
    if (!docSnapshot.exists()) {
      console.error('acceptJob document not found')
      showToast('ไม่พบเอกสาร acceptJob', 'error')
      return
    }

    // ใช้ setDoc เพื่ออัปเดตฟิลด์ slip
    await setDoc(acceptJobRef, { slip: slipData }, { merge: true })

    showToast('อัพโหลดสลิปสำเร็จ รอสักครู่ กำลังตรวจสอบ...', 'success')
    closeUploadPopup() // ปิด Popup หลังจากการอัพโหลดสำเร็จ
  } catch (error) {
    console.error('Error uploading slip:', error)
    showToast('เกิดข้อผิดพลาดในการอัพโหลดสลิป', 'error')
  }
}





// การตรวจสอบสถานะการชำระเงินเมื่อ component ทำการ mount
onMounted(() => {
  checkPaymentStatus()
})


// ฟังก์ชันเปิด Popup อัพโหลดสลิป
const goToUploadSlip = () => {
  showPaymentPopup.value = false
  showUploadProofPopup.value = true
}

// ฟังก์ชันปิด Popup อัพโหลดสลิป
const closeUploadPopup = () => {
  showUploadProofPopup.value = false
  slipImage.value = null
}

// ฟังก์ชันปิดป๊อปอัพการชำระเงิน
const closePaymentPopup = () => {
  showPaymentPopup.value = false
  qrCodeUrl.value = '' // ปิด QR Code เมื่อปิด popup
  clearInterval(countdownInterval.value) // หยุดการนับถอยหลังเมื่อปิด popup
}



// ฟังก์ชันอัพเดตสถานะการตรวจสอบสลิปโดย Admin
const approveSlip = async (slipId) => {
  try {
    const slipRef = doc(db, 'slips', slipId)
    await updateDoc(slipRef, { status: 'approved' })

    // แสดงปุ่ม 'เสร็จสิ้นงาน & ให้คะแนน'
    isGuideApproved.value = true
    showToast('สลิปได้รับการตรวจสอบแล้ว', 'success')
  } catch (error) {
    console.error('Error approving slip:', error)
    showToast('เกิดข้อผิดพลาดในการตรวจสอบสลิป', 'error')
  }
}


// ฟังก์ชันการเช็คสถานะการชำระเงิน
const checkPaymentStatus = async () => {
  if (!acceptJobId.value) return

  try {
    const acceptJobRef = doc(db, 'acceptJob', acceptJobId.value)
    const acceptJobDoc = await getDoc(acceptJobRef)

    if (acceptJobDoc.exists() && acceptJobDoc.data().status === 'approved') {
      isGuideApproved.value = true
    }
  } catch (error) {
    console.error('Error checking payment status:', error)
  }
}



const openUploadPopup = () => {
  showUploadProofPopup.value = true
}







// ฟังก์ชันจัดการการชำระเงิน
const handlePayment = async () => {
  try {
    const charge = await createCharge(guideOfferPrice.value, 'THB', 'cust_test_5fkb7lw6xl') // แทนที่ด้วย customerId ที่ถูกต้อง
    if (charge) {
      showToast('การสร้างการชำระเงินสำเร็จ', 'success')
      validatePayment(); // ตรวจสอบการชำระเงิน
    } else {
      showToast('ไม่สามารถสร้างการชำระเงินได้', 'error')
    }
  } catch (error) {
    console.error('Error in payment:', error)
    showToast('เกิดข้อผิดพลาดในการชำระเงิน', 'error')
  }
}






// ฟังก์ชันตรวจสอบสถานะการชำระเงิน
const validatePayment = async () => {
  try {
    await updateDoc(doc(db, 'jobPosts', currentPostId.value), { status: 'paid' })
    showToast('การชำระเงินสำเร็จ', 'success')
    showPaymentPopup.value = false
  } catch (error) {
    console.error('Error updating payment status:', error)
    showToast('เกิดข้อผิดพลาดในการอัปเดตสถานะการชำระเงิน', 'error')
  }
}



// ฟังก์ชันอัปเดตสถานะการชำระเงิน
const updateBookingStatusToPaid = async (guideId, amount) => {
  try {
    // อัปเดตสถานะโพสต์และการจองใน Firestore
    await updateDoc(doc(db, 'jobPosts', currentPostId.value), {
      status: 'paid',
      selectedGuide: guideId,
      paymentAmount: amount,
      paymentStatus: 'completed'
    })
    showToast('สถานะการจองอัปเดตสำเร็จ', 'success')
  } catch (error) {
    console.error('Error updating booking status:', error)
    showToast('เกิดข้อผิดพลาดในการอัปเดตสถานะการจอง', 'error')
  }
}




// ฟังก์ชันสำหรับลบ acceptJob และ subcollection slips ทั้งหมด
const deleteAcceptJob = async (acceptJobId) => {
  try {
    // ลบ subcollection slips ภายใต้ acceptJob
    const slipsRef = collection(db, 'acceptJob', acceptJobId, 'slips')
    const slipsSnap = await getDocs(slipsRef)
    slipsSnap.forEach(async (doc) => {
      await deleteDoc(doc.ref)
    })

    // ลบ acceptJob เอง
    await deleteDoc(doc(db, 'acceptJob', acceptJobId))

    showToast('ลบข้อมูลสำเร็จ', 'success')
  } catch (error) {
    console.error('Error deleting acceptJob:', error)
    showToast('เกิดข้อผิดพลาดในการลบข้อมูล', 'error')
  }
}


// ฟังก์ชันปิดป๊อปอัพการชำระเงินสำเร็จ
const closePaymentSuccessPopup = () => {
  showPaymentSuccessPopup.value = false
}












// ตัวแปรและสถานะ

const guideId = ref(null)
const displayName = ref('')
const guideUID = ref('')
const guideProfileImage = ref('')
const slips = ref([])
const selectedSlip = ref(null)
const showCompleteButton = ref(true) // เพิ่มตัวแปรนี้


// กำหนด userId จากผู้ใช้ที่เข้าสู่ระบบในขณะนั้น

let userId = null



const loadSlipData = async () => {
  try {
    const userId = auth.currentUser?.uid
    if (!userId) return

    const acceptJobRef = collection(db, 'acceptJob')
    const q = query(acceptJobRef, where('userId', '==', userId))
    const querySnapshot = await getDocs(q)

    console.log("Query Snapshot Size:", querySnapshot.size); // ตรวจสอบว่ามีข้อมูลใน querySnapshot หรือไม่

    querySnapshot.forEach(doc => {
      const data = doc.data()
      console.log("Document data:", data);  // ตรวจสอบข้อมูลที่ดึงมา

      if (data && data.amount && data.guideId && data.postId && data.slips?.status) {
        selectedSlip.value = {
          slip: data.slip,
          guideId: data.guideId,
          postId: data.postId,
          amount: Number(data.amount), // แปลงเป็นตัวเลข
          status: data.slips.status
        }
        
        console.log("Selected Slip after assignment:", selectedSlip.value);  // ตรวจสอบ selectedSlip
        console.log("Selected Slip Amount:", selectedSlip.value.amount);  // ตรวจสอบว่ามีข้อมูล amount หรือไม่

        if (selectedSlip.value.amount) {
          newQRCodeUrl.value = createQRCode(selectedSlip.value.amount)
        } else {
          console.warn("ไม่พบข้อมูลจำนวนเงินใน selectedSlip")
        }
      } else {
        console.warn("ไม่พบข้อมูลที่ต้องการใน acceptJob document")
      }
    })

    // ตั้งค่า isCompleted และบันทึกสถานะลงใน localStorage
    isCompleted.value = false
    localStorage.setItem('isCompleted', JSON.stringify(false))

  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลสลิป:', error)
  }
}



 
// ตัวแปรสำหรับควบคุมการแสดง popup
const showNewSlipPopup = ref(false)
const showQRCodePopup = ref(false)
const countdownMinutes = ref(5)
const countdownSeconds = ref(0)
const newQRCodeUrl = ref('')
const showNewUploadProofPopup = ref(false)
showNewUploadProofPopup.value = true

// ประกาศตัวแปร newSlipImage
const newSlipImage = ref('')








// อัพสลิปใหม่






// ฟังก์ชันเปิด Popup สำหรับแสดง QR Code
const openQRCodePopup = () => {
  if (!selectedSlip.value || !selectedSlip.value.amount) {
    alert('ไม่พบข้อมูลจำนวนเงินสำหรับ QR Code')
    return
  }

  const amount = parseFloat(selectedSlip.value.amount)
  if (isNaN(amount) || amount <= 0) {
    alert('จำนวนเงินไม่ถูกต้อง')
    return
  }

  newQRCodeUrl.value = createQRCode(amount)
  showQRCodePopup.value = true
  startCountdown() // เริ่มนับเวลาถอยหลัง
}



// ฟังก์ชันนับเวลาถอยหลัง
const startCountdown = () => {
  countdownMinutes.value = 5
  countdownSeconds.value = 0

  countdownInterval = setInterval(() => {
    if (countdownSeconds.value === 0 && countdownMinutes.value === 0) {
      clearInterval(countdownInterval)
      newQRCodeUrl.value = '' // ทำลาย QR Code หลังหมดเวลา
      alert('QR Code หมดอายุแล้ว')
      closeQRCodePopup() // ปิด QR Code Popup
      return
    }
    if (countdownSeconds.value === 0) {
      countdownMinutes.value -= 1
      countdownSeconds.value = 59
    } else {
      countdownSeconds.value -= 1
    }
  }, 1000)
}




// ฟังก์ชันสร้างลิงก์ PromptPay QR Code
const createQRCode = (amount) => {
  const promptPayNumber = '0863536018'
  if (isNaN(amount) || amount <= 0) {
    console.log('จำนวนเงินไม่ถูกต้อง')
    return ''
  }
  const formattedAmount = parseFloat(amount).toFixed(2)
  return `https://promptpay.io/${promptPayNumber}/${formattedAmount}`
}





// ฟังก์ชันเปิด Popup สำหรับอัปโหลดสลิปใหม่
const openNewSlipPopup = () => {
  showNewSlipPopup.value = true
}




// ฟังก์ชันสำหรับอัพโหลดสลิปใหม่และแสดง QR Code
const handleUploadAndShowQRCode = () => {
  if (!newSlipImage.value) {
    alert('กรุณาเลือกสลิปก่อน!')
    return
  }

  // เรียกฟังก์ชันอัปเดตสลิปใหม่
  uploadNewSlipUpdate()

  // สร้าง QR Code หลังจากอัปเดตสลิปสำเร็จ
  const amount = parseFloat(selectedSlip.value.amount)
  if (isNaN(amount) || amount <= 0) {
    alert('จำนวนเงินไม่ถูกต้อง')
    return
  }

  newQRCodeUrl.value = createQRCode(amount)

  // เปิด Popup QR Code
  openQRCodePopup()

  // ปิด Popup สำหรับอัปโหลดสลิปใหม่
  closeNewSlipPopup()
}





// ฟังก์ชันสำหรับเลือกไฟล์สลิปใหม่
const handleNewSlipChange = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      newSlipImage.value = e.target.result // เก็บ base64 ของภาพ
    }
    reader.readAsDataURL(file)
  }
}








// ฟังก์ชันอัปโหลดสลิปใหม่และอัปเดตข้อมูลใน acceptJob
const uploadNewSlipUpdate = async () => {
  try {
    if (!selectedSlip.value || !selectedSlip.value.postId || !selectedSlip.value.guideId) {
      alert('ไม่พบข้อมูลที่ต้องการอัปเดต')
      return
    }

    const acceptJobQuery = query(
      collection(db, 'acceptJob'),
      where('postId', '==', selectedSlip.value.postId),
      where('guideId', '==', selectedSlip.value.guideId),
      where('userId', '==', auth.currentUser?.uid)
    )

    const querySnapshot = await getDocs(acceptJobQuery)

    if (querySnapshot.empty) {
      alert('ไม่พบข้อมูลการจองใน acceptJob')
      return
    }

    const acceptJobDoc = querySnapshot.docs[0]
    const acceptJobRef = doc(db, 'acceptJob', acceptJobDoc.id)

    if (newSlipImage.value) {
      await updateDoc(acceptJobRef, {
        slip: {
          imageUrl: newSlipImage.value,
          status: 'pending',
          uploadDate: serverTimestamp()
        }
      })
      alert('อัปเดตสลิปสำเร็จ!')
      closeNewSlipPopup()
    } else {
      alert('กรุณาเลือกสลิปก่อนอัปเดต')
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการอัปเดตสลิป:', error)
    alert('เกิดข้อผิดพลาดในการอัปเดตสลิป กรุณาลองอีกครั้ง')
  }
}








// ฟังก์ชันปิด QR Code และเปิดหน้าอัปโหลดสลิป
const closeQRCodeAndOpenNewSlipPopup = () => {
  closeQRCodePopup()
  showNewSlipPopup.value = true
}



// ฟังก์ชันปิด Popup สำหรับอัปโหลดสลิปใหม่
const closeNewSlipPopup = () => {
  showNewSlipPopup.value = false
  newSlipImage.value = ''
}




// ฟังก์ชันปิด Popup สำหรับแสดง QR Code
const closeQRCodePopup = () => {
  showQRCodePopup.value = false
  clearInterval(countdownInterval)
}






// ฟังก์ชันแปลงไฟล์เป็น Base64
const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (file instanceof File) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    } else {
      reject(new Error('ไม่ใช่ไฟล์ที่ถูกต้อง'));
    }
  });
};





// ปิด popup ตอนรีเฟรชหน้า
onMounted(() => {
  showNewUploadProofPopup.value = false
  showUploadProofPopup.value = false
})







// จบงาน







// ฟังก์ชันเปิด Popup สำหรับ Complete Job & Rate
const openCompleteJobPopup = (event, postId) => {
  event.preventDefault()

  // ตรวจสอบว่า postId ของโพสต์ปัจจุบันตรงกับ selectedSlip หรือไม่
  if (selectedSlip.value && selectedSlip.value.postId !== postId) {
    console.error('ไม่พบโพสต์ที่เลือกสำหรับการเสร็จสิ้นงาน')
    alert(`ไม่พบโพสต์ที่เลือกสำหรับการเสร็จสิ้นงาน postId: ${postId}`)
    return
  }

  loadGuideProfile(selectedSlip.value.guideId)
  showCompleteJobPopup.value = true
  console.log('Completing job for post:', postId)
}


// ฟังก์ชันเลือกการให้ดาว
const selectRating = (star) => {
  selectedRating.value = star
}




// ฟังก์ชันสำหรับโหลดข้อมูลโปรไฟล์ไกด์
const loadGuideProfile = async () => {
  try {
    if (!selectedSlip.value || !selectedSlip.value.guideId) {
      return
    }

    const guideId = selectedSlip.value.guideId

    // เข้าถึงเอกสารในคอลเลกชัน 'users' โดยใช้ guideId เป็น uid
    const userQuerySnapshot = await getDocs(collection(db, 'users'))
    let guideFound = false

    userQuerySnapshot.forEach((doc) => {
      const userData = doc.data()
      if (userData.uid === guideId) {
        guideProfileImage.value = userData.imageUrl || ''
        displayName.value = userData.displayName || 'ไม่มีชื่อไกด์'
        guideFound = true
      }
    })

    if (!guideFound) {
      console.log('ไม่พบข้อมูลไกด์ในคอลเลกชัน "users"')
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการโหลดข้อมูลโปรไฟล์ไกด์:', error)
  }
}




const isCompleted = ref(JSON.parse(localStorage.getItem('isCompleted')) || false)



const submitRating = async () => {
  try {
    if (selectedSlip.value && selectedRating.value > 0 && reviewText.value) {
      console.log("Selected Slip:", selectedSlip.value)
      console.log("Post ID:", selectedSlip.value.postId)

      const reviewsRef = collection(db, 'guides', selectedSlip.value.guideId, 'reviews')

      await addDoc(reviewsRef, {
        userId: auth.currentUser?.uid,
        rating: selectedRating.value,
        comment: reviewText.value,
        createdAt: serverTimestamp()
      })

      if (selectedSlip.value.postId) {
        const jobPostRef = doc(db, 'jobPosts', selectedSlip.value.postId)
        await updateDoc(jobPostRef, {
          status: 'จบทริปแล้ว'
        })

        const reviewsSnapshot = await getDocs(reviewsRef)
        const completedJobsCount = reviewsSnapshot.size

        const guideRef = doc(db, 'guides', selectedSlip.value.guideId)
        await updateDoc(guideRef, {
          completedJobs: completedJobsCount
        })

        selectedRating.value = 0
        reviewText.value = ''
        showCompleteJobPopup.value = false
        isCompleted.value = true // ตั้งค่า isCompleted เป็น true หลังจากส่งรีวิวสำเร็จ
        localStorage.setItem('isCompleted', JSON.stringify(true))

        Toastify({
          text: 'ส่งรีวิวและอัปเดตสถานะการจบทริปสำเร็จ!',
          duration: 3000,
          gravity: 'top',
          position: 'right',
          backgroundColor: '#4caf50',
        }).showToast()

        // ตรวจสอบข้อมูลของ selectedSlip ก่อนเรียก createGuidePaymentRecord
        console.log("Selected Slip before calling createGuidePaymentRecord:", selectedSlip.value);
        
        await createGuidePaymentRecord();
      } else {
        Toastify({
          text: 'ไม่พบ postId ที่เกี่ยวข้องกับการจบทริป',
          duration: 3000,
          gravity: 'top',
          position: 'right',
          backgroundColor: '#ff5a5f',
        }).showToast()
      }
    } else {
      Toastify({
        text: 'กรุณาให้คะแนนและเขียนรีวิวก่อน',
        duration: 3000,
        gravity: 'top',
        position: 'right',
        backgroundColor: '#ff5a5f',
      }).showToast()
    }
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการส่งรีวิวหรืออัปเดตสถานะการจบทริป:', error)
    Toastify({
      text: 'เกิดข้อผิดพลาดในการส่งรีวิวหรืออัปเดตสถานะ กรุณาลองใหม่อีกครั้ง',
      duration: 3000,
      gravity: 'top',
      position: 'right',
      backgroundColor: '#ff5a5f',
    }).showToast()
  }
}




const createGuidePaymentRecord = async () => {
  try {
    if (!selectedSlip.value || isNaN(Number(selectedSlip.value.amount))) {
      console.warn("ไม่พบข้อมูล amount ที่ถูกต้องใน selectedSlip");
      return;
    }

    const amount = Number(selectedSlip.value.amount);
    const netAmount = amount * 0.93; // คำนวณจาก amount

    console.log("Guide ID:", selectedSlip.value.guideId);
    console.log("Original Amount:", amount);
    console.log("Net Amount:", netAmount);

    // ดึงข้อมูลจากคอลเล็กชัน guides เพื่อเอา bankName และ bankAccountNumber
    const guideRef = doc(db, 'guides', selectedSlip.value.guideId);
    const guideSnapshot = await getDoc(guideRef);

    if (!guideSnapshot.exists()) {
      console.warn("ไม่พบข้อมูลไกด์ในคอลเล็กชัน guides");
      return;
    }

    const guideData = guideSnapshot.data();
    const bankName = guideData.bankName || "ไม่ระบุ";
    const bankAccountNumber = guideData.bankAccountNumber || "ไม่ระบุ";

    // ข้อมูลการชำระเงิน
    const guidePaymentData = {
      guideId: selectedSlip.value.guideId,
      userId: auth.currentUser?.uid,
      paymentAmount: netAmount,
      originalAmount: amount,  // เก็บ amount เดิม
      completedDate: serverTimestamp(),
      status: 'Pending',
      bank: bankName,
      bankAccount: bankAccountNumber
    };

    // บันทึกข้อมูลไปที่คอลเล็กชัน guidePayments
    const guidePaymentsRef = collection(db, 'guidePayments');
    await addDoc(guidePaymentsRef, guidePaymentData);
    console.log("เพิ่มข้อมูลการชำระเงินไกด์สำเร็จ");

  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการสร้างข้อมูลการชำระเงินไกด์:", error);
  }
};






// ฟังก์ชันยกเลิกการให้คะแนน
const cancelRating = () => {
  showCompleteJobPopup.value = false
}


onMounted(() => {
  loadGuideProfile()
})




// เพิ่มการรีเซ็ต selectedSlip และ isCompleted เมื่อโหลดข้อมูลใหม่
onMounted(() => {
  loadSlipData()
  isCompleted.value = JSON.parse(localStorage.getItem('isCompleted')) || false
  selectedSlip.value = null // รีเซ็ต selectedSlip เพื่อไม่ให้แสดงในโพสต์เก่า
})










// ประกาศตัวแปรสำหรับจัดการ popup และข้อมูลโพสต์
const showJobAcceptancePopup = ref(false)
const postData = ref(null) // เก็บข้อมูลโพสต์ที่ดึงมา
const guideJobData = ref(null) 



// ฟังก์ชันเปิด Popup และโหลดข้อมูลจาก acceptJob
const openViewJobAcceptancePopup = async () => {
  try {
    // Query คอลเล็กชัน acceptJob เพื่อดึงข้อมูลทั้งหมด
    const acceptJobQuery = query(collection(db, 'acceptJob'));
    const querySnapshot = await getDocs(acceptJobQuery);

    // ตรวจสอบผลลัพธ์การ Query
    if (querySnapshot.empty) {
      alert('ไม่พบข้อมูลการรับงานใน acceptJob');
      return;
    }

    // วนลูปเพื่อตรวจสอบเอกสารใน acceptJob
    for (const acceptJobDoc of querySnapshot.docs) {
      const acceptJobData = acceptJobDoc.data();

      // รับค่า guideId, postId และ userId จาก acceptJob
      const { guideId, postId, userId } = acceptJobData;

      // ตรวจสอบว่ามี guideId, postId และ userId หรือไม่
      if (guideId && postId && userId) {
        // ดึงข้อมูลจาก jobPosts โดยใช้ postId
        const postRef = doc(db, 'jobPosts', postId);
        const postSnapshot = await getDoc(postRef);

        if (postSnapshot.exists()) {
          const postInfo = postSnapshot.data();

          // ดึงข้อมูลจาก comments โดยใช้ postId
          const commentsRef = collection(db, `jobPosts/${postId}/comments`);
          const commentsSnapshot = await getDocs(commentsRef);

          let commentText = 'ไม่มีคอมเมนต์จากไกด์';
          if (!commentsSnapshot.empty) {
            const commentData = commentsSnapshot.docs[0].data();
            commentText = commentData.text; // ดึงรายละเอียดจากคอมเมนต์
          }

          // แปลง travelDates เป็นรูปแบบ "วัน เดือน ปี"
          const startDateFormatted = formatDate(postInfo.travelDates?.start);
          const endDateFormatted = formatDate(postInfo.travelDates?.end);

          // ดึงข้อมูลจาก users โดยใช้ userId
          const userRef = doc(db, 'users', userId);
          const userSnapshot = await getDoc(userRef);

          if (userSnapshot.exists()) {
            const userInfo = userSnapshot.data();

            // รวมข้อมูลทั้งหมดเพื่อแสดงใน popup
            postData.value = {
              location: postInfo.location,
              description: commentText,
              startDate: startDateFormatted,
              endDate: endDateFormatted,
              budget: postInfo.budget,
              email: userInfo.email,
              displayName: userInfo.displayName,
            };

            // แสดง popup
            showJobAcceptancePopup.value = true;
            return; // แสดงข้อมูลสำหรับงานแรกที่ตรงกัน
          }
        }
      }
    }

    alert('ไม่พบข้อมูลการรับงานที่ตรงกัน');
  } catch (error) {
    alert('เกิดข้อผิดพลาดในการโหลดข้อมูลการรับงาน กรุณาลองอีกครั้ง');
  }
};





// ฟังก์ชันปิด Popup
const closeJobAcceptancePopup = () => {
  showJobAcceptancePopup.value = false
}









const showCommentsPopup = ref(false)
const commentedPosts = ref([])
const showAddCommentPopup = ref(false)
const selectedPostId = ref('')
// ตัวแปรสำหรับเก็บคอมเมนต์ที่โหลดมา


const previousComments = ref([])


// ฟังก์ชันเปิด popup แสดงโพสต์ที่เคยคอมเมนต์
const viewComments = async () => {
  try {
    const guideUid = auth.currentUser?.uid
    if (!guideUid) {
      Toastify({
        text: "ไม่พบข้อมูลไกด์ที่ต้องการแสดง",
        duration: 3000,
        gravity: "top",
        position: "center",
        backgroundColor: "#FF6347",
      }).showToast()
      return
    }

    const postsQuery = query(collection(db, 'jobPosts'))
    const postsSnapshot = await getDocs(postsQuery)

    if (postsSnapshot.empty) {
      Toastify({
        text: "ไม่พบโพสต์ใด ๆ",
        duration: 3000,
        gravity: "top",
        position: "center",
        backgroundColor: "#FF6347",
      }).showToast()
      return
    }

    const posts = []

    for (const postDoc of postsSnapshot.docs) {
      const postData = postDoc.data()
      const postId = postDoc.id

      const commentsRef = collection(db, `jobPosts/${postId}/comments`)
      const commentsSnapshot = await getDocs(commentsRef)

      for (const commentDoc of commentsSnapshot.docs) {
        const commentData = commentDoc.data()

        if (commentData.guideId === guideUid) {
          const startDateFormatted = formatDate(postData.travelDates?.start)
          const endDateFormatted = formatDate(postData.travelDates?.end)

          posts.push({
            location: postData.location,
            description: commentData.text,
            startDate: startDateFormatted,
            endDate: endDateFormatted,
            budget: postData.budget,
            postId: postId,
          })

          break
        }
      }
    }

    commentedPosts.value = posts
    showCommentsPopup.value = true
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูลโพสต์:', error)
    Toastify({
      text: "เกิดข้อผิดพลาดในการดึงข้อมูล กรุณาลองอีกครั้ง",
      duration: 3000,
      gravity: "top",
      position: "center",
      backgroundColor: "#FF6347",
    }).showToast()
  }
}






// ฟังก์ชันเปิด popup คอมเมนต์พร้อมการโหลดข้อมูลก่อนหน้า
const openCommentPopup = async (post) => {
  selectedPostId.value = post.postId
  newComment.value = ''
  previousComments.value = [] // รีเซ็ตตัวแปรคอมเมนต์ก่อนหน้า

  await loadPreviousComments(selectedPostId.value) // โหลดคอมเมนต์ก่อนหน้า

  showAddCommentPopup.value = true // แสดง popup
}





// ฟังก์ชันเพิ่มคอมเมนต์ใหม่
const addComment = async () => {
  if (!newComment.value.trim()) {
    Toastify({
      text: "กรุณาเขียนข้อความคอมเมนต์",
      duration: 3000,
      gravity: "top",
      position: "center",
      backgroundColor: "#FF5A5F",
    }).showToast()
    return
  }

  try {
    const commentsRef = collection(db, `jobPosts/${selectedPostId.value}/comments`)
    await addDoc(commentsRef, {
      guideId: auth.currentUser.uid,
      text: newComment.value,
      createdAt: new Date(),
    })

    Toastify({
      text: "คอมเมนต์ถูกบันทึกเรียบร้อย",
      duration: 3000,
      gravity: "top",
      position: "center",
      backgroundColor: "#4CAF50",
    }).showToast()

    await loadPreviousComments(selectedPostId.value) // โหลดคอมเมนต์ใหม่หลังจากเพิ่ม
    showAddCommentPopup.value = false
    viewComments() // Refresh commented posts
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการบันทึกคอมเมนต์:', error)
    Toastify({
      text: "เกิดข้อผิดพลาดในการบันทึกคอมเมนต์ กรุณาลองอีกครั้ง",
      duration: 3000,
      gravity: "top",
      position: "center",
      backgroundColor: "#FF5A5F",
    }).showToast()
  }
}





// ฟังก์ชันโหลดคอมเมนต์ก่อนหน้า
const loadPreviousComments = async (postId) => {
  try {
    const commentsRef = collection(db, `jobPosts/${postId}/comments`)
    const commentsSnapshot = await getDocs(commentsRef)

    // เก็บคอมเมนต์ในตัวแปร previousComments
    const commentsList = commentsSnapshot.docs.map(doc => doc.data())
    previousComments.value = commentsList
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการโหลดคอมเมนต์ก่อนหน้า:', error)
    Toastify({
      text: "เกิดข้อผิดพลาดในการโหลดคอมเมนต์ก่อนหน้า กรุณาลองอีกครั้ง",
      duration: 3000,
      gravity: "top",
      position: "center",
      backgroundColor: "#FF5A5F",
    }).showToast()
  }
}


// ฟังก์ชันปิด popup
const closeCommentsPopup = () => {
  showCommentsPopup.value = false
}




// ฟังก์ชันปิด popup คอมเมนต์
const closeAddCommentPopup = () => {
  showAddCommentPopup.value = false
}







const provincesByRegion = {
  'ภาคเหนือ': ['เชียงใหม่', 'เชียงราย', 'ลำปาง', 'ลำพูน', 'แม่ฮ่องสอน', 'พะเยา', 'แพร่', 'น่าน', 'อุตรดิตถ์', 'ตาก', 'พิษณุโลก', 'สุโขทัย', 'กำแพงเพชร', 'พิจิตร'],
  'ภาคกลาง': ['กรุงเทพฯ', 'นนทบุรี', 'ปทุมธานี', 'พระนครศรีอยุธยา', 'ลพบุรี', 'สระบุรี', 'อ่างทอง', 'สิงห์บุรี', 'ชัยนาท', 'สมุทรสาคร', 'สมุทรสงคราม', 'นครปฐม', 'กาญจนบุรี', 'ราชบุรี'],
  'ภาคตะวันออกเฉียงเหนือ': ['ขอนแก่น', 'อุดรธานี', 'นครราชสีมา', 'บุรีรัมย์', 'สุรินทร์', 'ศรีสะเกษ', 'อุบลราชธานี', 'ยโสธร', 'ชัยภูมิ', 'หนองบัวลำภู', 'กาฬสินธุ์', 'มหาสารคาม', 'ร้อยเอ็ด', 'สกลนคร', 'นครพนม', 'มุกดาหาร', 'หนองคาย', 'บึงกาฬ', 'อำนาจเจริญ'],
  'ภาคตะวันออก': ['ชลบุรี', 'ระยอง', 'จันทบุรี', 'ตราด', 'ฉะเชิงเทรา', 'ปราจีนบุรี', 'สระแก้ว', 'นครนายก'],
  'ภาคตะวันตก': ['กาญจนบุรี', 'ราชบุรี', 'เพชรบุรี', 'ประจวบคีรีขันธ์'],
  'ภาคใต้': ['ภูเก็ต', 'สงขลา', 'สุราษฎร์ธานี', 'นครศรีธรรมราช', 'ปัตตานี', 'ยะลา', 'นราธิวาส', 'กระบี่', 'ตรัง', 'พังงา', 'ชุมพร', 'พัทลุง', 'ระนอง', 'สตูล'],
  'ทั้งหมด': [] // สำหรับเลือกทั้งหมด
}






const showFilterPopup = ref(false)
const selectedProvinces = ref([])
const selectedRegion = ref('ทั้งหมด') // ตั้งค่าเริ่มต้นเป็น 'ทั้งหมด'



// สร้างรายการภูมิภาค
const regions = ref(Object.keys(provincesByRegion))


// Filtered provinces by selected region
const filteredProvincesByRegion = computed(() => {
  if (selectedRegion.value === 'ทั้งหมด') {
    return Object.values(provincesByRegion).flat()
  }
  return provincesByRegion[selectedRegion.value] || []
})




// Select All Computed
const isAllSelected = computed(() => selectedProvinces.value.length === filteredProvincesByRegion.value.length)


// Toggle Select All
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedProvinces.value = []
  } else {
    selectedProvinces.value = [...filteredProvincesByRegion.value]
  }
}

// Job Posts Data
const jobPosts = ref([])


// Fetch Job Posts on Mount
onMounted(async () => {
  const snapshot = await getDocs(collection(db, 'jobPosts'))
  jobPosts.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
})

// Computed for province filtering
const filteredJobPosts = computed(() => {
  if (selectedProvinces.value.length === 0) {
    return jobPosts.value
  }
  return jobPosts.value.filter(post => selectedProvinces.value.includes(post.location))
})

const displayedPosts = computed(() => {
  const provinceFiltered = filteredJobPosts.value
  return provinceFiltered.filter(post => {
    if (userRole.value === 'guide') {
      return post.status !== 'จบทริปแล้ว' && !post.guideConfirmed
    } else {
      return post.createdBy === auth.currentUser?.uid
    }
  })
})











// ฟังก์ชันลบโพสต์หลังจากกด 'จบงาน' และผ่านไป 1-2 วัน
const deletePostAfterCompletion = async (postId) => {
  try {
    setTimeout(async () => {
      await updateDoc(doc(db, 'jobPosts', postId), {
        status: 'completed'
      })
      posts.value = posts.value.filter(post => post.postId !== postId) // ลบโพสต์จากการแสดงผล
    }, 86400000 * 2) // ลบหลังจาก 2 วัน (1 วัน = 86400000 ms)
  } catch (error) {
    console.error('Error deleting post after completion:', error)
  }
}








// ฟังก์ชันแสดง Toast เพียงครั้งเดียว
const showToastOnce = (message, type) => {
  if (!toastVisible.value) {
    toastVisible.value = true
    showToast(message, type)
    setTimeout(() => {
      toastVisible.value = false
    }, 3000)
  }
}












































</script>





<template>
  <UserLayout>
 
    
   

    <!-- Container for Job Posts and Action Buttons -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">

     <!-- Header and Action Buttons -->
    <div class="flex flex-col lg:flex-row justify-between items-center py-6 lg:py-8 rounded-2xl shadow-md px-4 sm:px-6 lg:px-10 w-full bg-white space-y-6 lg:space-y-0 lg:space-x-10">
      
      <!-- Job Posts Title -->
      <div class="flex items-center justify-center mb-8 lg:mb-0">
        <h2 class="text-5xl font-bold text-gray-800">
          โพสต์
        </h2>
      </div>

      <!-- Role and Post Status -->
      <div class="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-8 mb-10 lg:mb-0 lg:space-x-10">
        <!-- User Role -->
        <div class="flex items-center space-x-5 px-6 py-2 border border-gray-300 rounded-full shadow-md">
          <i class="fas fa-user-circle text-gray-600 text-3xl"></i>
          <p class="text-2xl font-bold text-gray-800">
            บทบาท : {{ userRole }}
          </p>
        </div>

        <!-- Post Status -->
        <div v-if="post" class="flex items-center space-x-5 px-6 py-2 border border-gray-300 rounded-full shadow-md">
          <i class="fas fa-info-circle text-gray-600 text-3xl"></i>
          <p class="text-2xl font-bold text-gray-800">
            สถานะโพสต์: {{ post.status }}
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-6 justify-center mt-6 lg:mt-0 lg:space-x-4">
      
      <!-- Right Section: Action Buttons -->
      <div class="flex space-x-4">
        <!-- Button to Open Filter Popup -->
        <button 
          v-if="userRole === 'guide'" 
          @click="showFilterPopup = true"
          class="px-6 py-3 bg-gradient-to-r from-indigo-400 to-purple-600 text-white font-bold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-300"
        >
          เลือกจังหวัดที่ต้องการรับงาน
        </button>

        <!-- View Job Acceptance (Guide only) -->
        <button 
          v-if="userRole === 'guide'" 
          @click="openViewJobAcceptancePopup"
          class="px-6 py-3 bg-gradient-to-r from-green-400 to-green-600 text-white font-bold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-green-300"
        >
          ดูการตอบรับงาน
        </button>

        <!-- View Comments (Guide only) -->
        <button 
          v-if="userRole === 'guide'" 
          @click="viewComments"
          class="px-6 py-3 bg-gradient-to-r from-purple-400 to-purple-600 text-white font-bold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300"
        >
          ดูความคิดเห็น
        </button>

      </div>

        <!-- Sign Up as Guide (User only) -->
        <button 
          v-if="userRole === 'user'" 
          @click="showGuideSignUpForm = !showGuideSignUpForm" 
          class="flex items-center justify-center px-6 py-2 bg-gradient-to-r from-indigo-400 to-indigo-600 text-white text-lg font-bold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 transform focus:outline-none focus:ring-4 focus:ring-indigo-300"
        >
          <i class="fas fa-user-plus mr-2"></i> สมัครเป็นไกด์
        </button>

        <!-- Create Post (User only) -->
        <button 
          v-if="userRole === 'user' && canCreatePost" 
          @click="showForm = !showForm" 
          class="flex items-center justify-center px-6 py-2 bg-gradient-to-r from-blue-400 to-blue-600 text-white text-lg font-bold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 transform focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          <i class="fas fa-plus-circle mr-2"></i> สร้างโพสต์
        </button>

        <!-- View Posts (User only) -->
        <button 
          v-if="userRole === 'user' && canViewPosts" 
          @click="showViewPost = !showViewPost" 
          class="flex items-center justify-center px-6 py-2 bg-gradient-to-r from-green-400 to-green-600 text-white text-lg font-bold rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 transform focus:outline-none focus:ring-4 focus:ring-green-300"
        >
          <i class="fas fa-eye mr-2"></i> ดูโพสต์
        </button>

      </div>
    </div>



<!-- Popup: Create Job Post -->
<div 
  v-if="showForm" 
  class="fixed inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50 px-2"
  @keydown.esc="showForm = false"
>
  <div 
    class="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto p-4 sm:p-6 md:p-8 bg-white rounded-2xl shadow-2xl relative overflow-y-auto max-h-[90vh]"
  >
    <!-- Close Button -->
    <button 
      @click="showForm = false" 
      class="absolute top-2 right-2 w-8 h-8 md:w-10 md:h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:rotate-90 transition duration-300"
    >
      ✕
    </button>

    <!-- Form Title -->
    <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 text-center">
      สร้างโพสต์งานใหม่
    </h2>

    <!-- Form -->
    <form @submit.prevent="postJob" class="space-y-6">
      <!-- หมวดหมู่ 1: ข้อมูลทั่วไป -->
      <div>
        <h3 class="text-xl font-bold text-gray-800 mb-4">ข้อมูลทั่วไป</h3>
        
        <!-- Location Dropdown -->
        <div>
          <label for="location" class="block text-base font-semibold text-gray-900 mb-2">สถานที่</label>
          <select 
            v-model="location" 
            id="location" 
            class="block w-full border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-teal-400 px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none transition duration-300"
            required
          >
            <option disabled value="">เลือกจังหวัด</option>
            <option value="จันทบุรี">จันทบุรี</option>
            <option value="นครราชสีมา">นครราชสีมา</option>
            <option value="เชียงใหม่">เชียงใหม่</option>
            <option value="สุราษฎร์ธานี">สุราษฎร์ธานี</option>
            <option value="ภูเก็ต">ภูเก็ต</option>
          </select>
          <p v-if="locationMessage" class="text-red-600 text-sm mt-1">{{ locationMessage }}</p>
        </div>


        <!-- Budget Input -->
        <div class="mt-4">
          <label for="budget" class="block text-base font-semibold text-gray-900 mb-2">งบประมาณ (บาท)</label>
          <div class="relative">
            <input 
              type="text" 
              v-model="budget" 
              @input="handleBudgetInput"
              id="budget" 
              class="block w-full border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-teal-400 px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none transition duration-300" 
              placeholder="กรอกงบประมาณ"
            />
            <span class="absolute inset-y-0 right-4 flex items-center text-gray-500">฿</span>
          </div>
          <p v-if="budgetMessage" class="text-red-600 text-sm mt-1">{{ budgetMessage }}</p>
        </div>


      </div>

      <!-- หมวดหมู่ 2: ข้อมูลการเดินทาง -->
      <div>
        <h3 class="text-xl font-bold text-gray-800 mb-4">ข้อมูลการเดินทาง</h3>
        
        <!-- Travel Dates Input -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Start Date -->
          <div>
            <label class="block text-base font-semibold text-gray-900 mb-2">วันที่เริ่มต้น</label>
            <input 
              type="date" 
              v-model="travelDates.start" 
              :min="today" 
              class="block w-full border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-teal-400 px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none transition duration-300" 
              required
            />
            <p v-if="startDateMessage" class="text-red-600 text-sm mt-1">{{ startDateMessage }}</p>
          </div>

          <!-- End Date -->
          <div>
            <label class="block text-base font-semibold text-gray-900 mb-2">วันที่สิ้นสุด</label>
            <input 
              type="date" 
              v-model="travelDates.end" 
              :min="travelDates.start || today" 
              class="block w-full border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-teal-400 px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none transition duration-300" 
              required
            />
            <p v-if="guideGenderMessage" class="text-red-600 text-sm mt-1">{{ guideGenderMessage }}</p>
          </div>   
        </div>

        <!-- Guide Gender Selection -->
        <div class="mt-4">
          <label for="guideGender" class="block text-base font-semibold text-gray-900 mb-2">เพศของไกด์</label>
          <select 
            v-model="guideGender" 
            id="guideGender" 
            class="block w-full border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-teal-400 px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none transition duration-300"
            required
          >
            <option value="ไม่ระบุ">ไม่ระบุ</option>
            <option value="ชาย">ชาย</option>
            <option value="หญิง">หญิง</option>
          </select>
          <p v-if="guideGenderMessage" class="text-red-600 text-sm mt-1">{{ guideGenderMessage }}</p>
        </div>

        <!-- Number of People -->
        <div class="mt-4">
          <label for="numberOfPeople" class="block text-base font-semibold text-gray-900 mb-2">จำนวนผู้เข้าร่วม</label>
          <input 
            type="number" 
            v-model="numberOfPeople" 
            id="numberOfPeople" 
            class="block w-full border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-teal-400 px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none transition duration-300" 
            required 
            min="1"
            placeholder="เริ่มต้นที่ 1 คน"
          />
          <p v-if="numberOfPeopleMessage" class="text-red-600 text-sm mt-1">{{ numberOfPeopleMessage }}</p>
        </div>


        <!-- Number of Bedrooms -->
        <div class="mt-4">
          <label for="numberOfBedrooms" class="block text-base font-semibold text-gray-900 mb-2">จำนวนห้องนอน</label>
          <input 
            type="number" 
            v-model="numberOfBedrooms" 
            id="numberOfBedrooms" 
            class="block w-full border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-teal-400 px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none transition duration-300" 
            required 
            min="1"
            placeholder="เริ่มต้นที่ 1 ห้องนอน"
          />
        </div>
        <p v-if="numberOfBedroomsMessage" class="text-red-600 text-sm mt-1">{{ numberOfBedroomsMessage }}</p>

      </div>


      
<!-- Car Type Selection -->
<div class="mt-4">
  <label for="carType" class="block text-base font-semibold text-gray-900 mb-2">ประเภทของรถ</label>
  <select 
    v-model="carType" 
    id="carType" 
    class="block w-full border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-teal-400 px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none transition duration-300"
  >
    <option value="">ไม่ต้องการรถ</option>
    <option value="รถมินิบัส">รถมินิบัส</option>
    <option value="รถตู้">รถตู้</option>
    <option value="อื่นๆ">อื่นๆ</option>
  </select>
  <p v-if="carTypeMessage" class="text-red-600 text-sm mt-1">{{ carTypeMessage }}</p>

</div>

<!-- Custom Car Type Input -->
<div v-if="carType === 'อื่นๆ'" class="mt-4">
  <label for="customCarType" class="block text-base font-semibold text-gray-900 mb-2">กรอกรถที่ต้องการ</label>
  <input 
    type="text" 
    v-model="customCarType" 
    id="customCarType" 
    class="block w-full border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-teal-400 px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none transition duration-300"
    placeholder="เช่น รถออฟโรด, รถกระบะ"
  />
  <p v-if="carTypeMessage" class="text-red-600 text-sm mt-1">{{ carTypeMessage }}</p>

</div>


      <!-- หมวดหมู่ 3: ความต้องการเพิ่มเติม -->
      <div>
        <h3 class="text-xl font-bold text-gray-800 mb-4">ความต้องการเพิ่มเติม</h3>

        <!-- Desired Locations -->
        <div class="mt-4">
          <label for="desiredLocations" class="block text-base font-semibold text-gray-900 mb-2">สถานที่ที่ต้องการไป</label>
          <input 
            type="text" 
            v-model="desiredLocations" 
            id="desiredLocations" 
            class="block w-full border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-teal-400 px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none transition duration-300"
            placeholder="ตัวอย่าง: อุทยานแห่งชาติภูกระดึง"
          />
        </div>

      <!-- Separate Budget Input -->
      <div class="mt-4">
        <label for="separateBudget" class="block text-base font-semibold text-gray-900 mb-2">งบประมาณแยก</label>
        <input 
          type="text" 
          v-model="separateBudget" 
          @input="handleBudgetInput" 
          @change="handleBudgetInput"
          id="separateBudget" 
          class="block w-full border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-teal-400 px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none transition duration-300"
          placeholder="กรอกงบประมาณแยก"
        />

      </div>


</div>



      <!-- Reset Button -->
      <button 
        type="button" 
        @click="resetForm" 
        class="mt-4 w-full py-3 bg-gray-300 text-gray-700 font-bold rounded-full shadow-md hover:bg-gray-400 transition duration-300 focus:outline-none"
      >
        รีเซ็ตข้อมูล
      </button>

      <!-- Submit Button -->
      <div class="mt-6">
        <button 
          type="submit"
          class="w-full py-3 bg-teal-500 text-white font-bold rounded-full shadow-md hover:shadow-lg hover:bg-teal-600 transition duration-300 focus:ring-4 focus:ring-teal-300 focus:outline-none"
        >
          <span class="flex items-center justify-center space-x-2">
            <i class="fas fa-paper-plane text-lg"></i>
            <span>สร้างโพสต์</span>
          </span>
        </button>
      </div>
    </form>
  </div>
</div>





<!-- Display job posts -->
<div class="max-w-4xl mx-auto my-8 px-4 md:px-6 lg:px-8">
  <div 
    v-for="(post, index) in filteredPosts" 
    :key="index" 
    class="relative mb-6 p-6 bg-white rounded-xl shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg"
  >


<!-- Show "ติดจองแล้ว" overlay only for guides when confirmedGuideId exists -->
<div v-if=" userRole === 'guide' && post.confirmedGuideId"
     class="absolute inset-0 bg-gray-700 bg-opacity-75 flex items-center justify-center rounded-xl">
  <span class="text-white font-bold text-lg">ติดจองแล้ว</span>
</div>



    <!-- Header -->
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-xl md:text-2xl font-semibold text-gray-800">
        <span>{{ post.location }}</span> - 
        <span class="text-teal-600 font-bold">{{ post.budget.toLocaleString() }} บาท</span>
      </h3>
    </div>



    <!-- Post details -->
    <div class="space-y-2 mb-4">
      <!-- Travel Dates -->
      <div class="mb-2">
        <p class="text-base font-semibold text-gray-700">วันที่เดินทาง</p>
        <p class="text-sm text-gray-600">
          <span class="font-medium">{{ formatDateThai(post.travelDates.start) }}</span> 
          <span class="mx-1">-</span> 
          <span class="font-medium">{{ formatDateThai(post.travelDates.end) }}</span>
        </p>
      </div>

      <!-- Guide Gender -->
      <div class="mb-2">
        <p class="text-base font-semibold text-gray-700">เพศของไกด์</p>
        <p class="text-sm text-gray-600">{{ post.guideGender || 'ไม่ระบุ' }}</p>
      </div>

      <!-- Number of People -->
      <div class="mb-2">
        <p class="text-base font-semibold text-gray-700">จำนวนผู้เข้าร่วม</p>
        <p class="text-sm text-gray-600">{{ post.numberOfPeople || 1 }}</p>
      </div>

      <!-- Car Type -->
      <div class="mb-2">
        <p class="text-base font-semibold text-gray-700">ประเภทของรถ</p>
        <p class="text-sm text-gray-600">{{ post.carType || 'ไม่ต้องการรถ' }}</p>
      </div>

      <!-- Desired Locations -->
      <div class="mb-2">
        <p class="text-base font-semibold text-gray-700">สถานที่ที่ต้องการไป</p>
        <p class="text-sm text-gray-600">{{ post.desiredLocations || 'ไม่ระบุ' }}</p>
      </div>

      <!-- Separate Budget -->
      <div class="mb-2">
        <p class="text-base font-semibold text-gray-700">งบประมาณแยก</p>
        <p class="text-sm text-gray-600">{{ post.separateBudget.toLocaleString() }} บาท</p>
      </div>

      <!-- วันที่โพสต์ -->
      <div class="mt-4">
        <p class="text-sm text-gray-800">
          โพสต์เมื่อ: {{ new Date(post.createdAt).toLocaleDateString('th-TH', { day: '2-digit', month: 'long', year: 'numeric' }) }} 
          {{ new Date(post.createdAt).toLocaleTimeString('th-TH') }}
        </p>
      </div>
    </div>

    <!-- ปุ่มการทำงาน -->
    <div v-if="post.status !== 'Reserved'" class="flex flex-wrap justify-end space-x-4 mt-4">
      <!-- ปุ่มแสดงความคิดเห็น -->
      <button 
        @click="openComments(post.postId)" 
        class="px-4 py-2 border border-blue-400 text-blue-400 rounded-full hover:bg-blue-400 hover:text-white transition duration-300"
      >
        แสดงความคิดเห็น
      </button>

      <!-- ปุ่มแก้ไขโพสต์ -->
      <button 
        v-if="post.createdBy === accountStore.user?.uid && !post.edited && !post.confirmedGuideId" 
        @click="editPost(post.postId)" 
        class="px-4 py-2 border border-yellow-400 text-yellow-400 rounded-full hover:bg-yellow-400 hover:text-white transition duration-300"
      >
        แก้ไขโพสต์
      </button>


      <!-- ปุ่มลบโพสต์ -->
      <button 
        v-if="post.createdBy === accountStore.user?.uid" 
        @click="deletePost(post.postId, post.createdBy)" 
        class="px-4 py-2 border border-red-400 text-red-400 rounded-full hover:bg-red-400 hover:text-white transition duration-300"
      >
        ลบโพสต์
      </button>

      <!-- ปุ่ม Complete Job & Rate the Guide -->
      <button
        v-if="selectedSlip && selectedSlip.status === 'ตรวจสอบแล้ว' && !isCompleted && selectedSlip.postId === post.postId"
        @click="openCompleteJobPopup($event, post.postId)"
        class="px-4 py-2 border border-teal-400 text-teal-400 rounded-full hover:bg-teal-400 hover:text-white transition duration-300"
      >
        <i class="fas fa-check-circle"></i>
        <span>  เสร็จจบทริป & ให้คะแนนรีวิว</span>
      </button>


      <!-- ปุ่มสำหรับอัพเดทสลิปใหม่ -->
      <button
        v-if="selectedSlip && selectedSlip.status === 'ตรวจสอบไม่ผ่าน' && selectedSlip.postId === post.postId"
        @click="openQRCodePopup(selectedSlip.postId)"
        class="px-4 py-2 border border-yellow-400 text-yellow-400 rounded-full hover:bg-yellow-400 hover:text-white transition duration-300 mt-4"
      >
        <i class="fas fa-sync-alt"></i>
        <span> อัพเดทสลิปใหม่</span>
      </button>



      </div>
  </div>
</div>






<!-- Popup: Edit Job Post -->
<div 
  v-if="showEditForm" 
  class="fixed inset-0 bg-white bg-opacity-70 flex justify-center items-center z-50 px-2"
  @keydown.esc="showEditForm = false"
>
  <div 
    class="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto p-4 sm:p-6 md:p-8 bg-white rounded-2xl shadow-2xl relative overflow-y-auto max-h-[90vh]"
  >
    <!-- Close Button -->
    <button 
      @click="showEditForm = false" 
      class="absolute top-2 right-2 w-8 h-8 md:w-10 md:h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:rotate-90 transition duration-300"
    >
      ✕
    </button>

    <!-- Form Title -->
    <h2 class="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 text-center">
      แก้ไขโพสต์งาน
    </h2>

    <!-- Form -->
    <form @submit.prevent="updateJobPost" class="space-y-6">
      <!-- หมวดหมู่ 1: ข้อมูลทั่วไป -->
      <div>
        <h3 class="text-xl font-bold text-gray-800 mb-4">ข้อมูลทั่วไป</h3>
        
        <!-- Location Dropdown -->
        <div>
          <label for="location" class="block text-base font-semibold text-gray-900 mb-2">สถานที่</label>
          <select 
            v-model="location" 
            id="location" 
            class="block w-full border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-teal-400 px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none transition duration-300"
            required
          >
            <option disabled value="">เลือกจังหวัด</option>
            <option value="จันทบุรี">จันทบุรี</option>
            <option value="นครราชสีมา">นครราชสีมา</option>
            <option value="เชียงใหม่">เชียงใหม่</option>
            <option value="สุราษฎร์ธานี">สุราษฎร์ธานี</option>
            <option value="ภูเก็ต">ภูเก็ต</option>
          </select>
        </div>

        <!-- Budget Input -->
        <div class="mt-4">
          <label for="budget" class="block text-base font-semibold text-gray-900 mb-2">งบประมาณ (บาท)</label>
          <div class="relative">
            <input 
              type="text" 
              v-model="budget" 
              @input="handleBudgetInput"
              id="budget" 
              class="block w-full border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-teal-400 px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none transition duration-300" 
              placeholder="กรอกงบประมาณ"
            />
            <span class="absolute inset-y-0 right-4 flex items-center text-gray-500">฿</span>
          </div>
        </div>
      </div>

      <!-- หมวดหมู่ 2: ข้อมูลการเดินทาง -->
      <div>
        <h3 class="text-xl font-bold text-gray-800 mb-4">ข้อมูลการเดินทาง</h3>
        
        <!-- Travel Dates Input -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Start Date -->
          <div>
            <label class="block text-base font-semibold text-gray-900 mb-2">วันที่เริ่มต้น</label>
            <input 
              type="date" 
              v-model="travelDates.start" 
              :min="today" 
              class="block w-full border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-teal-400 px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none transition duration-300" 
              required
            />
          </div>

          <!-- End Date -->
          <div>
            <label class="block text-base font-semibold text-gray-900 mb-2">วันที่สิ้นสุด</label>
            <input 
              type="date" 
              v-model="travelDates.end" 
              :min="travelDates.start || today" 
              class="block w-full border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-teal-400 px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none transition duration-300" 
              required
            />
          </div>
        </div>

        <!-- Guide Gender Selection -->
        <div class="mt-4">
          <label for="guideGender" class="block text-base font-semibold text-gray-900 mb-2">เพศของไกด์</label>
          <select 
            v-model="guideGender" 
            id="guideGender" 
            class="block w-full border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-teal-400 px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none transition duration-300"
            required
          >
            <option value="ไม่ระบุ">ไม่ระบุ</option>
            <option value="ชาย">ชาย</option>
            <option value="หญิง">หญิง</option>
          </select>
        </div>

        <!-- Number of People -->
        <div class="mt-4">
          <label for="numberOfPeople" class="block text-base font-semibold text-gray-900 mb-2">จำนวนผู้เข้าร่วม</label>
          <input 
            type="number" 
            v-model="numberOfPeople" 
            id="numberOfPeople" 
            class="block w-full border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-teal-400 px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none transition duration-300" 
            required 
            min="1"
            placeholder="เริ่มต้นที่ 1 คน"
          />
        </div>

        <!-- Number of Bedrooms -->
        <div class="mt-4">
          <label for="numberOfBedrooms" class="block text-base font-semibold text-gray-900 mb-2">จำนวนห้องนอน</label>
          <input 
            type="number" 
            v-model="numberOfBedrooms" 
            id="numberOfBedrooms" 
            class="block w-full border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-teal-400 px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none transition duration-300" 
            required 
            min="1"
            placeholder="เริ่มต้นที่ 1 ห้องนอน"
          />
        </div>
      </div>

      <!-- Car Type Selection, Desired Locations, Separate Budget (ตาม Create Job Post) -->
      <div class="mt-4">
        <label for="carType" class="block text-base font-semibold text-gray-900 mb-2">ประเภทของรถ</label>
        <select 
          v-model="carType" 
          id="carType" 
          class="block w-full border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-teal-400 px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none transition duration-300"
        >
          <option value="">ไม่ต้องการรถ</option>
          <option value="รถมินิบัส">รถมินิบัส</option>
          <option value="รถตู้">รถตู้</option>
          <option value="อื่นๆ">อื่นๆ</option>
        </select>
      </div>

      <div class="mt-4">
        <label for="desiredLocations" class="block text-base font-semibold text-gray-900 mb-2">สถานที่ที่ต้องการไป</label>
        <input 
          type="text" 
          v-model="desiredLocations" 
          id="desiredLocations" 
          class="block w-full border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-teal-400 px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none transition duration-300"
          placeholder="ตัวอย่าง: อุทยานแห่งชาติภูกระดึง"
        />
      </div>

      <div class="mt-4">
        <label for="separateBudget" class="block text-base font-semibold text-gray-900 mb-2">งบประมาณแยก</label>
        <input 
          type="text" 
          v-model="separateBudget" 
          @input="handleBudgetInput"
          id="separateBudget" 
          class="block w-full border border-gray-300 rounded-lg shadow-md focus:ring-2 focus:ring-teal-400 px-4 py-2 text-sm bg-white text-gray-900 focus:outline-none transition duration-300"
          placeholder="กรอกงบประมาณแยก"
        />
      </div>

      <!-- Submit Button -->
      <div class="mt-6">
        <button 
          type="submit"
          class="w-full py-3 bg-teal-500 text-white font-bold rounded-full shadow-md hover:shadow-lg hover:bg-teal-600 transition duration-300 focus:ring-4 focus:ring-teal-300 focus:outline-none"
        >
          <span class="flex items-center justify-center space-x-2">
            <i class="fas fa-save text-lg"></i>
            <span>บันทึกการแก้ไข</span>
          </span>
        </button>
      </div>
    </form>
  </div>
</div>













<!-- View Post --> 
<div v-if="showViewPost" class="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 px-4">
  <div class="w-full max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-200 transition-all duration-300 relative">
    
    <!-- Close Button for View Post -->
    <button 
      @click="showViewPost = false" 
      class="absolute top-2 right-2 w-8 h-8 md:w-10 md:h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 hover:rotate-90 transition duration-300 ease-in-out"
    >
      ✕
    </button>
    
    <!-- Title -->
    <h2 class="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center">
      ประวัติโพสต์ของคุณ
    </h2>

    <!-- Scrollable Content Wrapper -->
    <div class="overflow-y-auto max-h-[70vh] px-4">
      <!-- Posts Loop -->
      <div 
        v-for="(post, index) in userPosts" 
        :key="index" 
        class="relative mb-6 p-6 bg-white rounded-xl shadow-md border border-gray-200 transition-all duration-300"
      >
        <!-- หากสถานะโพสต์เป็น "Reserved" -->
        <div v-if="post.status === 'Reserved'" class="absolute inset-0 bg-gray-700 bg-opacity-75 flex items-center justify-center rounded-xl">
          <span class="text-white font-bold text-lg">ติดจองแล้ว</span>
        </div>

        <!-- Post Header -->
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl md:text-2xl font-semibold text-gray-800">
            {{ post.location }} 
            <span class="text-teal-600 font-bold ml-2">{{ post.budget.toLocaleString() }} บาท</span>
          </h3>
        </div>

        <!-- รายละเอียดโพสต์ -->
        <div class="space-y-2 mb-4">
          <!-- Travel Dates -->
          <div>
            <p class="text-base font-semibold text-gray-700">วันที่เดินทาง</p>
            <p class="text-sm text-gray-600">
              <span class="font-medium">{{ formatDateThai(post.travelDates.start) }}</span> 
              <span class="mx-1">-</span> 
              <span class="font-medium">{{ formatDateThai(post.travelDates.end) }}</span>
            </p>
          </div>
          <!-- Other Details... -->
        </div>

        <!-- ปุ่มการทำงาน -->
        <div class="flex justify-end space-x-3 mt-4">
          <button 
            @click="openComments(post.postId)" 
            class="px-4 py-2 border border-blue-400 text-blue-400 rounded-full hover:bg-blue-400 hover:text-white transition duration-300"
          >
            แสดงความคิดเห็น
          </button>

          <button 
            @click="deletePost(post.postId, post.createdBy)" 
            class="px-4 py-2 border border-red-400 text-red-400 rounded-full hover:bg-red-400 hover:text-white transition duration-300"
          >
            ลบโพสต์
          </button>
        </div>
      </div>
    </div>
  </div>
</div>











<!-- Comment Popup -->
<div v-if="showCommentPopup" class="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"> <!-- z-50 -->
  <div class="max-w-2xl w-full bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 p-8 rounded-3xl shadow-2xl relative">

    <!-- Close Button -->
    <button @click="toggleCommentPopup(false)" class="absolute top-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md">✕</button>

    <!-- Comment Header -->
    <h3 class="text-4xl font-extrabold text-white mb-6 text-center drop-shadow-lg tracking-wide">Comments</h3>



  

<!-- Comment List -->
<div v-if="currentPostComments.length > 0" class="overflow-y-auto h-96 space-y-6">
  <div 
    v-for="(comment, index) in currentPostComments" 
    :key="index" 
    class="flex flex-col space-y-3 p-6 bg-gray-800 rounded-xl shadow-lg transition-transform transform hover:scale-105 cursor-pointer max-h-72 overflow-y-auto"
  >
    <!-- Comment Header with Profile Picture -->
    <div class="flex items-start space-x-4">
      <!-- Profile Picture -->
      <div class="w-14 h-14 rounded-full ring ring-indigo-500 ring-offset-2 shadow-lg flex items-center justify-center bg-gradient-to-r from-indigo-400 to-purple-500 overflow-hidden">
        <template v-if="comment.profileImage">
          <img :src="comment.profileImage" alt="Profile Image" class="w-full h-full rounded-full object-cover border border-gray-300" />
        </template>
        <template v-else>
          <font-awesome-icon :icon="['far', 'user']" class="text-gray-600" style="font-size: 1.8rem;" />
        </template>
      </div>

      <!-- Comment Details -->
      <div class="flex-grow bg-gray-900 p-4 rounded-lg shadow-inner max-h-60 overflow-y-auto">
        <div class="flex justify-between items-center mb-2">
          <p class="font-bold text-lg text-white">{{ comment.displayName }}</p>
          <p class="text-sm text-gray-400">{{ comment.createdAt }}</p>
        </div>
        
        <p class="text-gray-300 text-base mb-2 whitespace-pre-line">{{ comment.text }}</p>

        <!-- Display Uploaded File or Image with Zoom -->
        <div v-if="comment.fileData" class="mt-4">
          <template v-if="comment.fileData.isImage">
            <img 
              :src="comment.fileData.url" 
              alt="Uploaded Image" 
              class="rounded-md max-h-40 object-cover mt-2 shadow-md cursor-pointer hover:shadow-lg transition duration-300"
              @click.stop="openImageModal(comment.fileData.url)" 
            />
          </template>
          <template v-else>
            <a :href="comment.fileData.url" target="_blank" download class="text-teal-500 hover:underline">
              ดาวน์โหลดไฟล์: {{ comment.fileData.name }}
            </a>
          </template>
        </div>

      <!-- Display Replies -->
      <div v-if="comment.replies && comment.replies.length > 0" class="mt-4 space-y-4">
        <div v-for="reply in comment.replies" :key="reply.id" class="bg-gray-800 p-4 mt-2 rounded-lg">
          <div class="flex justify-between items-center mb-2">
            <p class="text-sm font-semibold text-teal-400">{{ reply.displayName }}</p>
            <p class="text-xs text-gray-400">{{ reply.createdAt }}</p>
          </div>
          <p class="text-gray-300">{{ reply.text }}</p>

          <!-- Display File in Reply -->
          <div v-if="reply.fileData" class="mt-2">
            <template v-if="reply.fileData.isImage">
              <img 
                :src="reply.fileData.url" 
                alt="Reply Image" 
                class="rounded-md max-h-20 object-cover mt-2 shadow-md cursor-pointer hover:shadow-lg transition duration-300"
                @click.stop="openImageModal(reply.fileData.url)" 
              />
            </template>
            <template v-else>
              <a :href="reply.fileData.url" target="_blank" download class="text-teal-500 hover:underline">
                ดาวน์โหลดไฟล์: {{ reply.fileData.name }}
              </a>
            </template>
          </div>
        </div>
      </div>




        <!-- Replies Section -->
        <div v-if="comment.replies && comment.replies.length > 0" class="mt-4 space-y-3 border-t border-gray-700 pt-2">
          <div v-for="(reply, replyIndex) in comment.replies" :key="replyIndex" class="pl-4 ml-4 text-sm text-gray-300 border-l border-gray-600 space-y-1">
            
            <!-- Profile Picture and Reply Content -->
            <div class="flex items-start space-x-2">
              
              <!-- Profile Picture for Reply -->
              <div v-if="reply.profileImage" class="w-8 h-8 rounded-full ring ring-indigo-500 ring-offset-2 shadow-lg bg-gradient-to-r from-indigo-200 to-purple-300 overflow-hidden">
                <img :src="reply.profileImage" alt="Reply Profile Image" class="w-full h-full rounded-full object-cover border border-gray-300" />
              </div>
              <div v-else class="w-8 h-8 rounded-full ring ring-indigo-500 ring-offset-2 shadow-lg bg-gradient-to-r from-indigo-200 to-purple-300 flex items-center justify-center">
                <font-awesome-icon :icon="['far', 'user']" class="text-gray-500" style="font-size: 1.2rem;" />
              </div>

              <!-- Reply Content and Date -->
              <div class="flex-grow">
                <div class="flex justify-between items-center">
                  <p class="text-teal-300 font-bold">{{ reply.displayName }} :</p>
                  <!-- Date Positioned to the Right -->
                  <p class="text-xs text-gray-500">{{ reply.createdAt }}</p>
                </div>
                <p>{{ reply.text }}</p>

                <!-- Show File if Attached -->
                <div v-if="reply.fileData" class="mt-2">
                  <template v-if="reply.fileData.isImage">
                    <!-- Display image with zoom on click -->
                    <img :src="reply.fileData.url" alt="Reply Image" class="max-h-40 rounded-md shadow-md cursor-pointer" @click="openImageModal(reply.fileData.url)" />
                  </template>
                  <template v-else>
                    <!-- Download link for non-image files -->
                    <a :href="reply.fileData.url" target="_blank" download class="text-teal-500 hover:underline">
                      ดาวน์โหลดไฟล์: {{ reply.fileData.name }}
                    </a>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>




      <!-- Add Reply Form with File Display -->
      <div v-if="isReplying[comment.id]" class="mt-4 flex flex-col items-start space-y-2">
      <textarea 
        v-model="comment.newReply"
        rows="1"
        class="textarea textarea-bordered w-full resize-none focus:ring-2 focus:ring-indigo-500 bg-gray-800 text-white placeholder-gray-400 rounded-lg shadow-md transition duration-300"
        placeholder="เขียนการตอบกลับ..."
        @keyup.enter="addReplyToComment(comment)"
      ></textarea>

        <!-- Display Uploaded File for Reply -->
        <div v-if="replyFileData[comment.id]" class="text-gray-300 text-sm mt-2">
          <template v-if="replyFileData[comment.id].isImage">
            <img :src="replyFileData[comment.id].url" alt="Uploaded Image" class="max-h-40 rounded-lg shadow-md" />
          </template>
          <template v-else>
            ไฟล์ที่อัปโหลด: <a :href="replyFileData[comment.id].url" download class="text-teal-500 hover:underline">
              {{ replyFileData[comment.id].name }}
            </a>
          </template>
        </div>

            <!-- Emoji Button for Reply and File Upload -->
            <div class="flex items-center space-x-2">


        <!-- Emoji Picker for Reply Comment -->
        <div class="relative">
          <button @click="toggleEmojiPickerForReply(comment.id)" class="bg-yellow-400 text-white px-2 py-2 rounded-lg shadow-md transition duration-300">😀</button>
          
          <!-- Emoji Picker Popup for Reply Comment -->
          <div v-if="activeReplyId === comment.id" class="absolute bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 w-64 h-32 overflow-y-auto">
            <div class="flex flex-wrap space-x-2">
              <span v-for="emoji in emojiList" :key="emoji" @click="addEmojiToReply(emoji, comment)" class="cursor-pointer text-2xl hover:bg-gray-100 rounded-full p-1">{{ emoji }}</span>
            </div>
          </div>
        </div>

                  <!-- File Upload for Reply -->
                  <input
          type="file"
          @change="(event) => handleFileUpload(event, 'reply', comment)"
          class="hidden"
          :ref="el => (replyFileInputRefs[comment.id] = el)" 
        />


        
      <!-- File Upload Button -->
      <button @click="openReplyFileInput(comment.id)" class="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition duration-300">
        <font-awesome-icon :icon="['far', 'file']" />
      </button>

      <!-- Send Reply Button -->
      <button @click="addReplyToComment(comment)" class="bg-teal-500 text-white px-3 py-2 rounded-lg shadow-md hover:bg-teal-600 transition duration-300">
        <font-awesome-icon :icon="['fas', 'paper-plane']" />
      </button>
      </div>
    </div>





        <!-- "Reply" and "View Guide Profile" Buttons -->
        <div class="mt-4 flex justify-end space-x-2">

          

          <!-- Reply Button -->
          <button 
            @click.stop="toggleReply(comment)" 
            class="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-full shadow-md hover:bg-blue-600 transition-all duration-300 transform hover:scale-105"
          >
            ตอบกลับ
          </button>


          <button 
            @click.stop="openGuideProfile(comment)" 
            class="px-4 py-2 bg-teal-500 text-white text-sm font-semibold rounded-full shadow-md hover:bg-teal-600 transition-all duration-300 transform hover:scale-105"
          >
            ดูโปรไฟล์ไกด์
          </button>
        </div>
        
  
      </div>
    </div> 
  </div>
</div>

 


<!-- Popup รายละเอียดข้อเสนอ -->
<div v-if="showOfferPopup" class="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
  <div class="max-w-lg w-full bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 p-8 rounded-2xl shadow-2xl relative text-white">
    
    <!-- ปุ่มปิด Popup -->
    <button @click="toggleOfferPopup" class="absolute top-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md">
      ✕
    </button>
    
    <h3 class="text-3xl font-extrabold mb-6 text-center drop-shadow-lg tracking-wide">รายละเอียดข้อเสนอ</h3>

    <!-- ฟอร์มกรอกรายละเอียดข้อเสนอ -->
    <div class="space-y-5">
      <div>
        <label class="block text-sm font-semibold text-gray-300 mb-2">ราคา:</label>
        <input v-model="offerPrice" type="text" class="w-full p-3 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition duration-200" placeholder="ระบุราคา"/>
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-300 mb-2">รายละเอียดข้อเสนอ:</label>
        <textarea v-model="offerDetails" rows="3" class="w-full p-3 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition duration-200" placeholder="รายละเอียดข้อเสนอ"></textarea>
      </div>
      <div>
        <label class="block text-sm font-semibold text-gray-300 mb-2">ข้อมูลเพิ่มเติม:</label>
        <textarea v-model="additionalInfo" rows="2" class="w-full p-3 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 transition duration-200" placeholder="ข้อมูลเพิ่มเติม"></textarea>
      </div>
    </div>

    <!-- ปุ่มยืนยันการส่งข้อเสนอ -->
    <div class="mt-8 flex justify-end">
      <button @click="submitOffer" class="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-md hover:bg-blue-700 transition-all duration-300 transform hover:scale-105">
        ส่งข้อเสนอ
      </button>
    </div>
  </div>
</div>


<!-- Add New Comment Form with Uploaded File Display -->
          <div class="mt-6 flex flex-col items-center space-y-3">
            <textarea 
              v-model.lazy="newComment" 
              rows="2" 
              class="textarea textarea-bordered w-full resize-none focus:ring-4 focus:ring-indigo-500 bg-gray-800 text-white placeholder-gray-400 rounded-2xl shadow-md transition duration-300"
              placeholder="Write a comment..."
              @keyup.enter="addNewComment"
            ></textarea>


      <!-- Display Uploaded File Name for Comment -->
        <div v-if="uploadedFileData" class="mt-2 text-gray-300 text-sm">
          ไฟล์ที่อัปโหลด: {{ uploadedFileData.name }}
        </div>
        
        <!-- ปุ่มเปิด Popup รายละเอียดข้อเสนอ -->
        <button 
          v-if="userRole === 'guide'"
          @click="toggleOfferPopup" 
          class="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-600 transition duration-300"
        >
          รายละเอียดข้อเสนอ
        </button>


      <!-- Emoji Button for Comment -->
      <div class="flex items-center space-x-3">



        <!-- Emoji Picker for Comment -->
        <div class="relative">
          <button @click="toggleEmojiPickerForComment" class="bg-yellow-400 text-white px-2 py-2 rounded-lg shadow-md transition duration-300">😀</button>
          
          <!-- Emoji Picker Popup for Comment อยู่ด้านบน -->
          <div v-if="emojiPickerForComment" class="absolute bottom-full mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 w-64 h-32 overflow-y-auto">
            <div class="flex flex-wrap space-x-2">
              <span v-for="emoji in emojiList" :key="emoji" @click="addEmojiToComment(emoji)" class="cursor-pointer text-2xl hover:bg-gray-100 rounded-full p-1">{{ emoji }}</span>
            </div>
          </div>
        </div>

          <!-- File Upload and Submit Buttons -->
          <input type="file" @change="handleFileUpload" class="hidden" ref="fileInput" />
          <button @click="$refs.fileInput.click()" class="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition duration-300 shadow-lg">
            <font-awesome-icon :icon="['far', 'file']" />
          </button>

          <button @click="addNewComment" class="bg-primary text-white px-4 py-2 rounded-lg shadow-lg hover:bg-primary-focus transition-all duration-300 transform hover:scale-105">
      <font-awesome-icon :icon="['fas', 'paper-plane']" />
    </button>

      </div>
    </div>
    

    <!-- Image Zoom Modal - Overlays the Comment Popup -->
    <div v-if="showImageModal" class="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-90">
      <div class="relative z-100"> <!-- เพิ่ม z-100 -->
        <img :src="zoomedImage" alt="Zoomed Image" class="max-w-full max-h-screen rounded-lg shadow-lg" />
        <button @click="closeImageModal" class="absolute top-4 right-4 text-white text-3xl z-100">&times;</button>
      </div>
    </div>



  </div>
</div>









<!-- Guide Profile Popup -->
<div v-if="showGuideProfilePopup" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
  <div class="bg-white bg-opacity-95 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-lg space-y-8 transition-transform transform scale-100">
  
    <!-- Profile Image -->
    <div class="flex justify-center">
      <template v-if="selectedGuide.profileImage">
        <img 
          :src="selectedGuide.profileImage" 
          alt="Profile Image" 
          class="w-48 h-48 object-cover rounded-full shadow-lg transition-transform hover:scale-105" 
        />
      </template>
      <template v-else>
        <font-awesome-icon :icon="['far', 'user']" class="text-gray-400" style="font-size: 5rem; width: 25%; height: 50%;" />
      </template>   
    </div>

    <!-- Display Name and Email -->
    <div class="text-center">
      <h2 class="text-3xl font-bold text-gray-900">{{ selectedGuide.displayName || 'ไม่พบชื่อไกด์' }}</h2>
      <a 
        :href="getEmailLink(selectedGuide.email)" 
        class="text-lg font-medium text-blue-500 hover:underline flex items-center justify-center mt-2" 
        target="_blank"
      >
        <font-awesome-icon :icon="['far', 'envelope']" class="mr-2 text-lg" />
        {{ selectedGuide.email || 'ไม่พบอีเมล' }}
      </a>

      <!-- Average Rating -->
      <div class="flex items-center justify-center mt-3">
        <div class="flex items-center mr-2">
          <template v-for="i in 5" :key="i">
            <svg
              v-if="i <= selectedGuide.averageRating"
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
        <span class="text-lg font-semibold text-purple-700">{{ selectedGuide.averageRating }} ดาว</span>
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-4">
 
      <!-- ปุ่มยืนยันการเลือกไกด์ พร้อมไอคอน -->
      <button 
        @click="confirmGuideSelection(currentPost.id, selectedGuide.guideId)" 
        class="flex items-center justify-center space-x-2 flex-1 py-3 bg-green-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 hover:bg-green-600"
      >
        <font-awesome-icon :icon="['fas', 'check-circle']" class="text-lg" />
        <span>ยืนยันการเลือกไกด์</span>
      </button>

      <!-- ปุ่มดูรีวิวทั้งหมด พร้อมไอคอน -->
      <button 
        @click="openReviewPopup(selectedGuide)" 
        class="flex items-center justify-center space-x-2 flex-1 py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 hover:bg-blue-600"
      >
        <font-awesome-icon :icon="['fas', 'star']" class="text-lg" />
        <span>ดูรีวิว</span>
      </button>

      <!-- ปุ่มแชท -->
      <button 
        @click="startChat(selectedGuide.guideId)" 
        class="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:bg-blue-600"
      >
        <font-awesome-icon :icon="['fas', 'comments']" class="text-xl" />
      </button>

    </div>

    <!-- ปุ่มปิด -->
    <button 
      @click="closeGuideProfilePopup" 
      class="flex items-center justify-center space-x-2 mt-6 w-full py-3 bg-red-500 text-white font-bold rounded-lg shadow-md hover:bg-red-600 transition-all duration-300"
    >
      <font-awesome-icon :icon="['fas', 'times']" class="text-lg" />
      <span>ปิด</span>
    </button>
    
  </div>
</div>


<!-- Guide Chat Popup -->

<!-- Chat Popup -->
<div v-if="showChatPopup" class="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
  <div class="max-w-lg w-full bg-white p-6 rounded-lg shadow-2xl relative space-y-6">
    <button @click="showChatPopup = false" class="absolute top-4 right-4 text-gray-500 text-xl hover:text-gray-700">✕</button>
    <h3 class="text-3xl font-extrabold text-center text-blue-600">แชทกับ {{ currentChatPartner }}</h3>

<!-- Message Display Area -->
<div class="overflow-y-auto h-64 space-y-4 pr-2">
  <div v-for="message in messages" :key="message.id" class="flex flex-col" 
       :class="{'items-end': message.senderId === auth.currentUser.uid, 'items-start': message.senderId !== auth.currentUser.uid}">
       <div 
        :class="{
          'ml-auto bg-blue-500 text-white font-semibold rounded-l-2xl rounded-tr-2xl': message.senderId === auth.currentUser.uid, 
          'mr-auto bg-blue-600 text-white rounded-r-2xl rounded-tl-2xl shadow-md': message.senderId !== auth.currentUser.uid // เปลี่ยนพื้นหลังเป็นสีน้ำเงินเข้ม และข้อความเป็นสีขาว
        }" 
        class="p-3 max-w-xs shadow-lg"
      >

    <template v-if="message.fileUrl">
      <template v-if="message.isImage">
        <img 
          :src="message.fileUrl" 
          alt="Uploaded Image" 
          class="w-24 h-24 object-cover rounded-lg cursor-pointer"
          @click="openImageModal(message.fileUrl)"
        />
      </template>
      <template v-else>
        <a :href="message.fileUrl" target="_blank" download class="text-white hover:underline font-semibold"> <!-- ปรับข้อความในลิงก์ให้เป็นสีขาวและเข้มขึ้น -->
          <span class="block">ไฟล์: {{ message.fileName }}</span>
          <span>ดาวน์โหลด</span>
        </a>
      </template>
    </template>

    <template v-else>
      <span class="font-semibold text-white">{{ message.text }}</span> <!-- ข้อความของผู้ส่ง -->
    </template>
      </div>

    <!-- Display timestamp below the message box -->
    <div class="text-xs mt-1"
      :class="{
        'text-gray-300 text-right': message.senderId === auth.currentUser.uid,
        'text-gray-600 text-left': message.senderId !== auth.currentUser.uid
      }"
    >
      {{ formatTimestamp(message.createdAt) }}
    </div>
  </div>
</div>

      <!-- File Preview Before Sending -->
        <div v-if="filePreview" class="flex items-center space-x-4 mt-2 p-3 bg-gray-50 rounded-lg shadow-md border border-blue-200">
      <template v-if="filePreview.isImage">
        <img :src="filePreview.url" alt="File Preview" class="w-12 h-12 rounded-lg object-cover" />
      </template>
      <template v-else>
        <span class="text-blue-800 font-semibold">{{ filePreview.name }}</span>
      </template>
    </div>

    <!-- Message Input and Attachment -->
    <div class="flex items-center space-x-2">
      <input type="file" ref="fileInput" @change="uploadChatFile" class="hidden">
      <button @click="$refs.fileInput.click()" class="bg-gray-200 p-2 rounded-full shadow-lg hover:bg-gray-300 transition">
        <font-awesome-icon :icon="['fas', 'paperclip']" class="text-gray-500" />
      </button>

      <!-- Emoji Button -->
      <div class="relative">
        <button @click="toggleEmojiPicker" class="bg-yellow-400 p-2 rounded-full shadow-lg transition">
          <font-awesome-icon :icon="['far', 'smile']" />
        </button>
        <div 
          v-if="showEmojiPicker" 
          class="absolute top-0 transform -translate-y-full mb-2 bg-white border rounded-lg shadow-lg p-3 w-48" 
          style="max-height: 200px; overflow-y: auto;"
        >
          <div class="grid grid-cols-3 gap-3">
            <span 
              v-for="emoji in emojiList" 
              :key="emoji" 
              @click="addEmojiToMessage(emoji)" 
              class="cursor-pointer text-2xl text-center"
            >
              {{ emoji }}
            </span>
          </div>
        </div>
      </div>

      <input 
        v-model="newMessage" 
        type="text" 
        class="flex-grow p-3 border border-gray-300 rounded-full focus:outline-none focus:ring focus:ring-blue-400 focus:border-blue-500 placeholder-gray-500" 
        placeholder="พิมพ์ข้อความ..." 
        @keydown="handleKeyPress"
      />
      <button 
        @click="sendMessage" 
        class="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-full transition-shadow shadow-lg hover:shadow-xl"
      >
        ส่ง
      </button>
    </div>
        <!-- Image Zoom Modal - Overlays the Comment Popup -->
        <div v-if="showImageModal" class="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-90">
      <div class="relative z-100"> <!-- เพิ่ม z-100 -->
        <img :src="zoomedImage" alt="Zoomed Image" class="max-w-full max-h-screen rounded-lg shadow-lg" />
        <button @click="closeImageModal" class="absolute top-4 right-4 text-white text-3xl z-100">&times;</button>
      </div>
    </div>

  </div>
</div>






<!-- Guide Reviews Popup -->
<div v-if="showReviewPopup" class="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
  <div class="max-w-3xl w-full p-8 bg-gradient-to-br from-purple-200 via-white to-indigo-200 rounded-3xl shadow-2xl transform scale-105 transition-transform">
    <button @click="showReviewPopup = false" class="absolute top-4 right-4 text-white bg-red-500 w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-600 focus:outline-none">
      ✕
    </button>
    <h2 class="text-5xl font-extrabold mb-8 text-center text-purple-900 leading-tight">รีวิวของ {{ selectedGuide.displayName }}</h2>
    <div class="max-h-96 overflow-y-auto pr-4">
      <ul class="space-y-6">
        <li v-for="(review, index) in guideReviews" :key="index" class="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <span class="text-xl font-semibold text-indigo-700">{{ review.reviewerName }}</span>
            <div class="flex space-x-1">
              <template v-for="i in 5" :key="i">
                <svg v-if="i <= review.rating" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-6 h-6 text-yellow-400">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" class="w-6 h-6 text-gray-300">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </template>
            </div>
          </div>
          <p class="italic text-lg text-gray-800 mb-4 leading-relaxed">"{{ review.comment }}"</p>
          <span class="text-sm text-gray-500">{{ new Date(review.createdAt.seconds * 1000).toLocaleString('th-TH') }}</span>
        </li>
      </ul>
    </div>
    <button @click="showReviewPopup = false" class="mt-8 w-full py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full font-bold text-xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-400 focus:ring-opacity-50">
      ปิด
    </button>
  </div>
</div>













<!-- Popup ชำระเงินด้วย QR Code -->
<div v-if="showPaymentPopup" class="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
  <div class="max-w-lg w-full p-10 bg-gradient-to-b from-white to-gray-100 rounded-3xl shadow-2xl transition-transform transform scale-105">
    <!-- ปุ่มปิด -->
    <button @click="closePaymentPopup"
            class="absolute top-4 right-4 w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-full flex items-center justify-center shadow-md hover:bg-gradient-to-br hover:from-red-600 hover:to-red-800 transition-all duration-300">
      ✕
    </button>

    <!-- หัวข้อ -->
    <h3 class="text-4xl font-extrabold text-gray-900 mb-6 text-center">สแกน QR Code เพื่อชำระเงิน</h3>

    <!-- QR Code -->
    <div class="flex justify-center mb-6">
      <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="QR Code" 
           class="w-64 h-64 mx-auto rounded-lg shadow-lg border-4 border-dashed border-primary p-2" />
    </div>


    <!-- ยอดชำระ -->
    <div class="bg-primary-light p-4 rounded-xl text-center mb-4">
      <p class="text-lg font-semibold text-primary-dark">
        ยอดชำระ: <span class="text-2xl font-bold">{{ guideOfferPrice }}</span> บาท
      </p>
    </div>


    <!-- แสดงเวลานับถอยหลัง -->
    <div class="flex flex-col items-center mt-4 space-y-2">
      <p class="text-xl font-medium text-gray-700">
        เวลาที่เหลือ: <span class="text-2xl font-bold">{{ Math.floor(countdown / 60) }}:{{ (countdown % 60).toString().padStart(2, '0') }}</span>
      </p>
    </div>

    <!-- ปุ่มไปหน้าอัพโหลดสลิป -->
    <button @click="goToUploadSlip"
            class="mt-6 px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold rounded-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:from-blue-600 hover:to-blue-800">
      อัพโหลดสลิป
    </button>
  </div>
</div>



<!-- Popup สำหรับอัพโหลดสลิป -->
<div v-if="showUploadProofPopup" class="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
  <div class="max-w-lg w-full p-8 bg-gradient-to-b from-white to-gray-100 rounded-3xl shadow-2xl relative">
    <!-- ปุ่มปิด -->
    <button @click="closeUploadPopup" 
            class="absolute top-4 right-4 w-10 h-10 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-full flex items-center justify-center shadow-md hover:bg-gradient-to-br hover:from-red-600 hover:to-red-800 transition-all duration-300">
      ✕
    </button>

    <!-- หัวข้อ -->
    <h3 class="text-4xl font-bold text-gray-900 mb-6 text-center">อัพโหลดสลิปการชำระเงิน</h3>

    <!-- อินพุตเลือกไฟล์สลิป -->
    <div class="flex justify-center mb-4">
      <input type="file" @change="handleFileChange" accept="image/*"
             class="block w-full max-w-xs p-3 border-2 border-gray-300 rounded-md shadow-md focus:ring-2 focus:ring-primary-light transition-all duration-300" />
    </div>

    <!-- แสดงภาพสลิป -->
    <div v-if="slipImage" class="flex justify-center mb-4">
      <img :src="slipImage" alt="Slip Preview" class="w-64 h-auto rounded-xl shadow-lg border-2 border-gray-300" />
    </div>

    <!-- ปุ่มการดำเนินการ -->
    <div class="flex justify-center space-x-6 mt-6">
      <button @click="handleUploadSlip"
              class="px-8 py-3 bg-gradient-to-r from-green-500 to-green-700 text-white font-semibold rounded-lg shadow-xl hover:bg-gradient-to-r hover:from-green-600 hover:to-green-800 transition-all duration-300">
        ยืนยันการอัพโหลด
      </button>
      <button @click="closeUploadPopup"
              class="px-8 py-3 bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold rounded-lg shadow-xl hover:bg-gradient-to-r hover:from-red-600 hover:to-red-800 transition-all duration-300">
        ยกเลิก
      </button>
    </div>
  </div>
</div>










 
<!-- Sign Up as Guide Form Popup -->
<div v-if="showGuideSignUpForm" class="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 transition-all duration-300 ease-in-out">
  <div class="max-w-2xl w-full p-8 bg-gradient-to-br from-white via-gray-50 to-gray-200 rounded-3xl shadow-2xl overflow-auto relative h-[90vh] transform transition-transform duration-300 ease-in-out">
    
      <!-- Close Button -->
      <button 
        @click="closeModal" 
        class="absolute top-4 right-4 w-12 h-12 flex items-center justify-center bg-gradient-to-br from-red-500 to-red-700 text-white rounded-full shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300 ease-in-out transform hover:-rotate-90"
      >
        ✕
      </button>

    
    <!-- Form Title -->
    <h2 class="text-3xl font-extrabold text-gray-800 mb-6 text-center tracking-wide drop-shadow-md">
      Sign Up as a Guide
    </h2>

    <!-- Form -->
    <form @submit.prevent="submitGuideSignUp" class="grid grid-cols-1 md:grid-cols-2 gap-6">

      <!-- Prefix Selection -->
      <div class="col-span-2">
        <label for="prefix" class="block text-lg font-semibold text-gray-700 mb-2">คำนำหน้าชื่อ</label>
        <select 
          v-model="prefix" 
          id="prefix" 
          class="w-full border-2 border-gray-300 rounded-xl p-3 focus:border-primary focus:ring-2 focus:ring-primary transition ease-in-out duration-300"
          required
        >
          <option value="นาย">นาย</option>
          <option value="นาง">นาง</option>
          <option value="นางสาว">นางสาว</option>
        </select>
      </div>

      <!-- First Name Input -->
      <div>
        <label for="firstName" class="block text-lg font-semibold text-gray-700 mb-2">ชื่อ</label>
        <input 
          v-model="firstName" 
          type="text" 
          id="firstName" 
          class="w-full border-2 border-gray-300 rounded-xl p-3 focus:border-primary focus:ring-2 focus:ring-primary transition ease-in-out duration-300" 
          required
        />
      </div>

      <!-- Last Name Input -->
      <div>
        <label for="lastName" class="block text-lg font-semibold text-gray-700 mb-2">นามสกุล</label>
        <input 
          v-model="lastName" 
          type="text" 
          id="lastName" 
          class="w-full border-2 border-gray-300 rounded-xl p-3 focus:border-primary focus:ring-2 focus:ring-primary transition ease-in-out duration-300" 
          required
        />
      </div>

      <!-- Citizen ID Input -->
      <div class="col-span-2">
        <label for="citizenId" class="block text-lg font-semibold text-gray-700 mb-2">เลขบัตรประชาชน</label>
        <input 
          v-model="citizenId" 
          type="text" 
          id="citizenId" 
          maxlength="13" 
          class="w-full border-2 border-gray-300 rounded-xl p-3 focus:border-primary focus:ring-2 focus:ring-primary transition ease-in-out duration-300" 
          required
        />
      </div>

      <!-- File Uploads with Icons -->
      <div class="col-span-2 grid grid-cols-2 gap-4">
        <!-- Upload Citizen Card Image -->
        <div class="flex flex-col items-center">
          <label class="text-lg font-semibold text-gray-700 mb-2">บัตรประชาชน</label>
          <input 
            type="file" 
            @change="handleCitizenCardUpload" 
            accept="image/*" 
            class="file-input w-full border-2 border-gray-300 rounded-xl p-3 focus:border-primary focus:ring-2 focus:ring-primary transition ease-in-out duration-300"
          />
        </div>

        <!-- Upload Selfie with Citizen Card -->
        <div class="flex flex-col items-center">
          <label class="text-lg font-semibold text-gray-700 mb-2">รูปถือลบัตรประชาชน</label>
          <input 
            type="file" 
            @change="handleSelfieWithCitizenCardUpload" 
            accept="image/*" 
            class="file-input w-full border-2 border-gray-300 rounded-xl p-3 focus:border-primary focus:ring-2 focus:ring-primary transition ease-in-out duration-300"
          />
        </div>

        <!-- Guide License ID Input -->
        <div class="col-span-2">
          <label for="guideLicenseId" class="block text-lg font-semibold text-gray-700 mb-2">เลขบัตรมัคคุเทศก์</label>
          <input 
            v-model="guideLicenseId" 
            type="text" 
            id="guideLicenseId" 
            class="w-full border-2 border-gray-300 rounded-xl p-3 focus:border-primary focus:ring-2 focus:ring-primary transition ease-in-out duration-300" 
            required
          />
        </div>

        <!-- Upload Guide License Image -->
        <div class="flex flex-col items-center">
          <label class="text-lg font-semibold text-gray-700 mb-2">บัตรมัคคุเทศก์</label>
          <input 
            type="file" 
            @change="handleGuideLicenseUpload" 
            accept="image/*" 
            class="file-input w-full border-2 border-gray-300 rounded-xl p-3 focus:border-primary focus:ring-2 focus:ring-primary transition ease-in-out duration-300"
          />
        </div>

        <!-- Upload Selfie with Guide License -->
        <div class="flex flex-col items-center">
          <label class="text-lg font-semibold text-gray-700 mb-2">รูปถือลบัตรมัคคุเทศก์</label>
          <input 
            type="file" 
            @change="handleSelfieWithGuideLicenseUpload" 
            accept="image/*" 
            class="file-input w-full border-2 border-gray-300 rounded-xl p-3 focus:border-primary focus:ring-2 focus:ring-primary transition ease-in-out duration-300"
          />
        </div>
      </div>

      <!-- Address Input -->
      <div class="col-span-2">
        <label for="address" class="block text-lg font-semibold text-gray-700 mb-2">ที่อยู่ตามบัตรประชาชน</label>
        <textarea 
          v-model="address" 
          id="address" 
          rows="3" 
          class="w-full border-2 border-gray-300 rounded-xl p-3 focus:border-primary focus:ring-2 focus:ring-primary transition ease-in-out duration-300" 
          required
        ></textarea>
      </div>

      <!-- Province Selection -->
      <div>
        <label for="province" class="block text-lg font-semibold text-gray-700 mb-2">จังหวัด</label>
        <select 
          v-model="province" 
          id="province" 
          class="w-full border-2 border-gray-300 rounded-xl p-3 focus:border-primary focus:ring-2 focus:ring-primary transition ease-in-out duration-300" 
          required
        >
          <option v-for="provinceOption in provinces" :key="provinceOption" :value="provinceOption">
            {{ provinceOption }}
          </option>
        </select>
      </div>

      <!-- District Input -->
      <div>
        <label for="district" class="block text-lg font-semibold text-gray-700 mb-2">อำเภอ/เขต</label>
        <input 
          v-model="district" 
          type="text" 
          id="district" 
          class="w-full border-2 border-gray-300 rounded-xl p-3 focus:border-primary focus:ring-2 focus:ring-primary transition ease-in-out duration-300" 
          required
        />
      </div>

      <!-- Subdistrict Input -->
      <div>
        <label for="subDistrict" class="block text-lg font-semibold text-gray-700 mb-2">ตำบล/แขวง</label>
        <input 
          v-model="subDistrict" 
          type="text" 
          id="subDistrict" 
          class="w-full border-2 border-gray-300 rounded-xl p-3 focus:border-primary focus:ring-2 focus:ring-primary transition ease-in-out duration-300" 
          required
        />
      </div>

      <!-- Postal Code Input -->
      <div>
        <label for="postalCode" class="block text-lg font-semibold text-gray-700 mb-2">รหัสไปรษณีย์</label>
        <input 
          v-model="postalCode" 
          type="text" 
          id="postalCode" 
          class="w-full border-2 border-gray-300 rounded-xl p-3 focus:border-primary focus:ring-2 focus:ring-primary transition ease-in-out duration-300" 
          required
        />
      </div>

        <!-- Submit Button -->
      <div class="col-span-2">
        <button 
          @click="handleGuideApplication" 
          type="button" 
          class="w-full py-4 bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white rounded-full font-bold shadow-lg hover:shadow-2xl hover:scale-105 hover:brightness-110 transition-all duration-300 ease-in-out transform hover:-translate-y-1"
        >
          <span class="flex items-center justify-center gap-2">
            <svg 
              class="w-6 h-6 animate-bounce" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Submit
          </span>
        </button>
      </div>
    </form>
  </div>
</div>
</div>













<!-- Complete Job & Rate the Guide Popup -->
<div v-if="showCompleteJobPopup" class="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 transition-opacity duration-300 ease-in-out">
  <div class="max-w-lg w-full p-10 bg-white rounded-3xl shadow-2xl relative transform transition-transform duration-500 ease-in-out hover:shadow-3xl">
    <!-- ปุ่มปิด -->
    <button @click="cancelRating" class="absolute top-4 right-4 text-gray-600 hover:text-red-500">
      <i class="fas fa-times-circle text-3xl transition-transform duration-200 hover:scale-125"></i>
    </button>

    <!-- หัวข้อ -->
    <h3 class="text-4xl font-extrabold text-gradient-to-br from-teal-600 to-blue-600 mb-8 text-center">
      Complete Job & Rate the Guide
    </h3>

      <!-- มินิโปรไฟล์ของไกด์ -->
      <div class="flex items-center mb-8 bg-gradient-to-r from-teal-100 to-blue-100 p-4 rounded-2xl shadow-lg hover:shadow-xl">
        <template v-if="guideProfileImage">
          <img :src="guideProfileImage" alt="Guide Profile"
              class="w-24 h-24 rounded-full shadow-lg mr-4 border-4 border-teal-500 transition-transform duration-200 hover:scale-105">
        </template>
        <template v-else>
          <font-awesome-icon :icon="['far', 'user']" class="text-gray-400 mr-4" style="font-size: 6rem; width: 6rem; height: 6rem;" />
        </template>
        <div>
          <h3 class="text-lg font-semibold">{{ displayName }}</h3>
        </div>
      </div>



    <!-- ระบบการให้ดาว -->
    <div class="flex items-center space-x-2 mb-6">
      <p class="text-lg font-semibold text-gray-700">ให้คะแนน:</p>
      <div class="flex space-x-1">
        <template v-for="star in 5" :key="star">
          <svg
            @click="selectedRating = star"
            :class="{
              'text-yellow-500': star <= selectedRating,
              'text-gray-300': star > selectedRating,
            }"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 24 24"
            stroke="currentColor"
            class="w-12 h-12 cursor-pointer hover:scale-125 transition-transform duration-200 ease-in-out"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.364 4.21a1 1 0 00.95.69h4.421c.969 0 1.372 1.24.588 1.81l-3.58 2.624a1 1 0 00-.364 1.118l1.364 4.21c.3.921-.755 1.688-1.538 1.118L12 17.011l-3.58 2.624c-.783.57-1.838-.197-1.538-1.118l1.364-4.21a1 1 0 00-.364-1.118L4.305 9.637c-.784-.57-.38-1.81.588-1.81h4.42a1 1 0 00.951-.69l1.365-4.21z"
            />
          </svg>
        </template>
      </div>
    </div>

    <!-- กล่องข้อความสำหรับรีวิว -->
    <div class="mb-8">
      <label for="reviewText" class="block text-lg font-semibold text-gray-700 mb-2">รีวิว</label>
      <textarea v-model="reviewText" rows="4" id="reviewText"
        class="mt-1 block w-full border-2 border-blue-500 rounded-2xl shadow-sm focus:ring-4 focus:ring-teal-300 focus:border-blue-500 sm:text-sm placeholder-gray-400 p-4 transition-shadow duration-200 hover:shadow-md"
        placeholder="เขียนรีวิว..."></textarea>
    </div>

    <!-- ปุ่มยืนยันหรือยกเลิก -->
    <div class="flex justify-between mt-6">
      <button @click="submitRating" 
        class="flex-1 py-4 px-6 font-bold text-lg text-white bg-gradient-to-r from-teal-500 to-blue-600 rounded-full shadow-2xl hover:bg-teal-600 transition-transform duration-300 hover:scale-105 mx-2">
        <i class="fas fa-check-circle mr-2"></i> ยืนยัน
      </button>
      <button @click="cancelRating" 
        class="flex-1 py-4 px-6 font-bold text-lg text-white bg-gradient-to-r from-red-500 to-pink-600 rounded-full shadow-2xl hover:bg-red-600 transition-transform duration-300 hover:scale-105 mx-2">
        <i class="fas fa-times-circle mr-2"></i> ยกเลิก
      </button>
    </div>
  </div>
</div>






<!-- Popup สำหรับแสดง QR Code -->
<div v-if="showQRCodePopup" class="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
  <div class="max-w-lg w-full p-8 bg-white rounded-3xl shadow-2xl relative">
    <!-- ปุ่มปิด -->
    <button @click="closeQRCodePopup"
      class="absolute top-4 right-4 text-white bg-red-600 w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-800">
      ✕
    </button>

    <!-- หัวข้อ -->
    <h3 class="text-2xl font-bold mb-4 text-center">QR Code สำหรับการชำระเงิน</h3>

    <!-- แสดง QR Code -->
    <div v-if="newQRCodeUrl" class="flex justify-center mb-4">
      <img :src="newQRCodeUrl" alt="QR Code" class="w-64 h-auto rounded-xl shadow-lg border-2 border-gray-300">
    </div>

    <!-- แสดงเวลาถอยหลัง -->
    <div class="flex justify-center text-lg font-semibold text-red-600 mb-4">
      <span>{{ countdownMinutes }}:{{ countdownSeconds < 10 ? '0' : '' }}{{ countdownSeconds }}</span>
    </div>

    <!-- ปุ่มไปยังหน้าอัปโหลดสลิป -->
    <div class="flex justify-center mt-6">
      <button @click="closeQRCodeAndOpenNewSlipPopup"
        class="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold rounded-lg shadow-xl hover:from-blue-600 hover:to-blue-800">
        ไปหน้าอัปโหลดสลิป
      </button>
    </div>
  </div>
</div>

<!-- Popup สำหรับอัปเดตสลิปใหม่ -->
<div v-if="showNewSlipPopup" class="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
  <div class="max-w-lg w-full p-8 bg-white rounded-3xl shadow-2xl relative">
    <!-- ปุ่มปิด -->
    <button @click="closeNewSlipPopup"
      class="absolute top-4 right-4 text-white bg-red-600 w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-800">
      ✕
    </button>

    <!-- หัวข้อ -->
    <h3 class="text-2xl font-bold mb-4 text-center">อัปโหลดสลิปใหม่</h3>

    <!-- อินพุตเลือกไฟล์สลิป -->
    <input type="file" @change="handleNewSlipChange" accept="image/*"
      class="block w-full max-w-xs p-2 border-2 border-gray-300 rounded-md shadow-md mb-4">

    <!-- แสดงภาพสลิปที่เลือก -->
    <div v-if="newSlipImage" class="flex justify-center mb-4">
      <img :src="newSlipImage" alt="Slip Preview" class="w-64 h-auto rounded-xl shadow-lg border-2 border-gray-300">
    </div>

    <!-- ปุ่มการดำเนินการ -->
    <div class="flex justify-center space-x-6 mt-6">
      <button @click="uploadNewSlipUpdate"
        class="px-8 py-3 bg-gradient-to-r from-green-500 to-green-700 text-white font-semibold rounded-lg shadow-xl hover:from-green-600 hover:to-green-800">
        ยืนยันอัปโหลดสลิปใหม่
      </button>
      <button @click="closeNewSlipPopup"
        class="px-8 py-3 bg-gradient-to-r from-red-500 to-red-700 text-white font-semibold rounded-lg shadow-xl hover:from-red-600 hover:to-red-800">
        ยกเลิก
      </button>
    </div>
  </div>
</div>












<!-- Popup แสดงข้อมูลการรับงาน -->
<div
  v-if="showJobAcceptancePopup"
  class="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50"
>
  <div
    class="max-w-lg w-full p-8 bg-white rounded-3xl shadow-2xl relative transition-all transform scale-105"
  >
    <!-- ปุ่มปิด -->
    <button
      @click="closeJobAcceptancePopup"
      class="absolute top-4 right-4 text-white bg-red-600 w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all"
    >
      ✕
    </button>

    <!-- หัวข้อ -->
    <h3 class="text-3xl font-bold mb-6 text-center text-gray-800">
      รายละเอียดการรับงาน
    </h3>

    <!-- ข้อมูลโพสต์ -->
    <div v-if="postData" class="space-y-6 text-gray-700">
      <div class="flex items-center">
        <span class="font-semibold w-1/3">สถานที่:</span>
        <span class="w-2/3">{{ postData.location }}</span>
      </div>
      <div class="flex items-center">
        <span class="font-semibold w-1/3">รายละเอียด:</span>
        <span class="w-2/3">{{ postData.description }}</span>
      </div>
      <div class="flex items-center">
        <span class="font-semibold w-1/3">งบประมาณ:</span>
        <span class="w-2/3">{{ postData.budget }} บาท</span>
      </div>
      <div class="flex items-center">
        <span class="font-semibold w-1/3">วันที่เริ่ม:</span>
        <span class="w-2/3">{{ postData.startDate }}</span>
      </div>
      <div class="flex items-center">
        <span class="font-semibold w-1/3">วันที่สิ้นสุด:</span>
        <span class="w-2/3">{{ postData.endDate }}</span>
      </div>
      <div class="flex items-center">
        <span class="font-semibold w-1/3">ผู้สร้างโพสต์:</span>
        <span class="w-2/3">
          {{ postData.displayName }} ({{ postData.email }})
        </span>
      </div>
    </div>

    <!-- ปุ่มปิด -->
    <div class="flex justify-center mt-8">
      <button
        @click="closeJobAcceptancePopup"
        class="px-12 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-full shadow-md hover:from-green-600 hover:to-green-700 transition-all focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50"
      >
        ปิด
      </button>
    </div>
  </div>
</div>









  <!-- Popup แสดงโพสต์ที่เคยคอมเมนต์ -->
  <div v-if="showCommentsPopup" class="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
    <div class="max-w-3xl w-full p-8 bg-gradient-to-r from-purple-100 to-white rounded-3xl shadow-2xl relative transition-all transform scale-105">
      <!-- ปุ่มปิด -->
      <button
        @click="closeCommentsPopup"
        class="absolute top-4 right-4 text-white bg-red-600 w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all"
      >
        ✕
      </button>

      <!-- หัวข้อ -->
      <h3 class="text-4xl font-bold mb-6 text-center text-purple-800">
        โพสต์ที่คุณเคยคอมเมนต์
      </h3>

      <!-- แสดงรายการโพสต์ที่เคยคอมเมนต์ -->
      <div v-if="commentedPosts.length > 0" class="space-y-6 text-gray-700">
        <div
          v-for="(post, index) in commentedPosts"
          :key="index"
          class="bg-white p-6 rounded-2xl shadow-lg transition-transform transform hover:scale-105"
        >
          <div class="flex justify-between items-start mb-2">
            <p class="font-bold text-2xl text-purple-600">สถานที่: {{ post.location }}</p>
            <p class="italic text-gray-500 text-sm">งบประมาณ: {{ post.budget }} บาท</p>
          </div>
          <p class="italic text-gray-600 mb-4">ความคิดเห็นของคุณ: "{{ post.description }}"</p>
          <div class="flex justify-between items-center text-sm">
            <p><strong>วันที่เริ่ม:</strong> {{ post.startDate }}</p>
            <p><strong>วันที่สิ้นสุด:</strong> {{ post.endDate }}</p>
          </div>

          <!-- ปุ่มคอมเมนต์ -->
          <div class="flex justify-end mt-4">
            <button
            @click="openCommentPopup(post)"
            class="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-extrabold rounded-full shadow-lg hover:from-blue-600 hover:to-blue-800 hover:shadow-xl transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-opacity-70"
          >
            <i class="fas fa-comment-dots mr-2"></i> คอมเมนต์เพิ่ม
          </button>

          </div>
        </div>
      </div>

      <div v-else class="text-center text-gray-500 mt-4">
        ไม่พบโพสต์ที่เคยคอมเมนต์
      </div>

      <!-- ปุ่มปิด -->
      <div class="flex justify-center mt-10">
        <button
          @click="closeCommentsPopup"
          class="px-12 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-full shadow-lg hover:from-green-600 hover:to-green-700 transition-all focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50"
        >
          ปิด
        </button>
      </div>
    </div>
  </div>



  
<!-- Popup สำหรับคอมเมนต์ -->
<div v-if="showAddCommentPopup" class="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
  <div class="max-w-md w-full p-6 bg-gradient-to-br from-green-100 to-white rounded-3xl shadow-2xl relative transition-all transform scale-105">
    <!-- ปุ่มปิด -->
    <button
      @click="closeAddCommentPopup"
      class="absolute top-4 right-4 text-white bg-red-600 w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-opacity-70 transition-all"
    >
      ✕
    </button>

    <!-- หัวข้อ -->
    <h3 class="text-4xl font-extrabold mb-6 text-center text-green-700">
      เพิ่มความคิดเห็น
    </h3>

    <!-- แสดงคอมเมนต์ก่อนหน้า -->
    <div v-if="previousComments.length > 0" class="mb-4 space-y-4">
      <div v-for="(comment, index) in previousComments" :key="index" class="bg-gray-100 p-4 rounded-lg">
        <p class="text-gray-800">{{ comment.text }}</p>
      </div>
    </div>

    <!-- ฟอร์มเพิ่มคอมเมนต์ -->
    <textarea
      v-model="newComment"
      rows="4"
      class="w-full p-4 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 transition shadow-md"
      placeholder="เขียนความคิดเห็นที่นี่..."
    ></textarea>

    <!-- ปุ่มบันทึก -->
    <div class="flex justify-center mt-4">
      <button
        @click="addComment"
        class="px-10 py-3 bg-gradient-to-r from-green-500 to-green-700 text-white font-bold rounded-full shadow-lg hover:from-green-600 hover:to-green-800 transition-all focus:outline-none focus:ring-4 focus:ring-green-500 focus:ring-opacity-70"
      >
        <i class="fas fa-save mr-2"></i> บันทึกความคิดเห็น
      </button>
    </div>
  </div>
</div>







<!-- Filter Popup Modal -->
<div v-if="showFilterPopup" class="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center">
  <div class="bg-gradient-to-br from-white to-gray-100 p-10 rounded-3xl shadow-2xl w-full max-w-4xl h-4/5 overflow-y-auto relative transform transition-transform duration-300">
    
    <!-- Close Button -->
    <button 
      @click="showFilterPopup = false" 
      class="absolute top-4 right-4 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-all duration-300 transform hover:scale-110"
      aria-label="Close filter popup"
    >
      ✕
    </button>

    <!-- Title -->
    <h3 class="text-4xl font-bold text-gray-800 mb-6 text-center tracking-wide">
      เลือกจังหวัดและภูมิภาคที่ต้องการรับงาน
    </h3>

    <!-- Region Filter with Stylish Buttons -->
    <div class="flex justify-center mb-6 flex-wrap gap-3">
      <button 
        v-for="region in regions" 
        :key="region" 
        @click="selectedRegion = region"
        :class="[
          'px-6 py-3 text-sm md:text-base font-semibold rounded-full shadow-lg transition-all duration-300 transform',
          'hover:bg-blue-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50',
          selectedRegion === region ? 'bg-blue-700 text-white' : 'bg-gray-200 text-gray-700'
        ]"
      >
        {{ region }}
      </button>
    </div>

    <!-- Select All Button -->
    <div class="flex justify-end mb-6">
      <button 
        @click="toggleSelectAll" 
        class="px-8 py-3 bg-blue-500 text-white font-bold rounded-full shadow-lg hover:bg-blue-600 hover:scale-105 transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {{ isAllSelected ? 'ยกเลิกเลือกทั้งหมด' : 'เลือกทั้งหมด' }}
      </button>
    </div>

    <!-- Province Filter Options with grid layout -->
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4">
      <div 
        v-for="province in filteredProvincesByRegion" 
        :key="province" 
        class="flex items-center space-x-3 bg-gray-100 p-3 rounded-xl shadow-md hover:shadow-lg hover:bg-indigo-200 transition-all duration-200 transform hover:scale-105"
      >
        <input 
          type="checkbox" 
          :value="province" 
          v-model="selectedProvinces" 
          class="form-checkbox h-5 w-5 text-indigo-600 rounded transition-transform duration-200 transform hover:scale-110"
        />
        <label :for="province" class="text-base font-medium text-gray-900">{{ province }}</label>
      </div>
    </div>

    <!-- Confirm Button -->
    <div class="flex justify-center mt-10">
      <button 
        @click="showFilterPopup = false" 
        class="px-14 py-3 bg-green-500 text-white text-lg font-bold rounded-full shadow-lg hover:bg-green-600 hover:scale-105 transition-all duration-300 transform focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        ตกลง
      </button>
    </div>
  </div>
</div>

























<link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css">





<!-- เปิดป๊อปอัพล็อกอิน -->
<user-layout v-if="showLoginModal" @close="showLoginModal = false" />










<!-- Toast notifications -->
<div v-if="eventStore.messages.length > 0" class="fixed bottom-5 right-5 space-y-4">
  <div
    v-for="(message, index) in eventStore.messages"
    :key="index"
    class="toast"
    :class="message.type === 'success' ? 'toast-success' : 'toast-error'"
  >
    <i :class="message.type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'"></i>
    {{ message.message }}
  </div>
</div>





  </UserLayout>
</template>




<style scoped>
.toast {
  padding: 14px 22px;
  border-radius: 12px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15), inset 0 0 10px rgba(255, 255, 255, 0.1);
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  opacity: 0;
  transform: translateX(50px);
  animation: fadeIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, fadeOut 0.5s 2.8s forwards;
  transition: all 0.3s ease-in-out;
  overflow: hidden;
}

/* เพิ่มสไตล์ที่ต้องการ */
.payment-popup {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  padding: 20px;
  border: 2px solid #ccc;
  border-radius: 8px;
  text-align: center;
}

/* Styles สำหรับ Popup */
input[type="file"] {
  cursor: pointer;
  padding: 12px;
  margin-bottom: 16px;
}


.toast::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 5px;
  border-radius: 12px 0 0 12px;
}

.toast-success::before {
  background-color: #28a745;
}

.toast-error::before {
  background-color: #e74c3c;
}

.toast-success {
  background: linear-gradient(145deg, #28a745, #218838);
  color: #fff;
}

.toast-error {
  background: linear-gradient(145deg, #e74c3c, #c0392b);
  color: #fff;
}

.toast i {
  margin-right: 10px;
  font-size: 18px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeOut {
  to {
    opacity: 0;
    transform: translateX(50px);
  }
}

/* Glow effect */
.toast:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2), 0 0 20px rgba(255, 255, 255, 0.3);
  transform: scale(1.05);
}



.filter-section {
  position: fixed;
  left: 20px;
  top: 80px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
}






.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}





</style>