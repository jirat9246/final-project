<script setup>
import { ref, onMounted, onUnmounted, watch , computed } from 'vue' // เพิ่ม watch
import { useRouter } from 'vue-router'
import { useProfileStore } from '../../stores/user/profileStore'
import { useNotificationStore } from '../../stores/notification'
import { useEventStore } from '../../stores/event'
import { useAccountStore } from '@/stores/account'
import { auth } from '@/firebase'
import { onAuthStateChanged , updatePassword  } from 'firebase/auth'
import Toastify from 'toastify-js'
import "toastify-js/src/toastify.css"
import { defaultProfileImageUrl } from '/src/stores/user/profileStore'
import { getAuth, sendPasswordResetEmail } from 'firebase/auth'
import { getFirestore, doc, collection, query, where, getDocs, updateDoc , onSnapshot , orderBy , getDoc , serverTimestamp , addDoc   } from 'firebase/firestore'
import { db } from '@/firebase' 
import { getFunctions, httpsCallable } from 'firebase/functions'








// ตั้งค่าตัวแปรหลัก
const router = useRouter()
const profileStore = useProfileStore()
const notificationStore = useNotificationStore()
const eventStore = useEventStore()
const accountStore = useAccountStore()
const functions = getFunctions()






// Define states
const searchText = ref('')
const showNotifications = ref(false)
const showLoginModal = ref(false)
const showSignUpModal = ref(false)
const showDropdown = ref(false)
let toastVisible = false // สถานะแสดง toast
const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')
const signUpEmail = ref('')
const signUpPassword = ref('')
const confirmPassword = ref('')
const isLoggedIn = ref(false)
// กำหนด state ของรูปโปรไฟล์
const currentPostId = ref(null)
const displayName = ref('')

const userProfileImage = computed(() => profileStore.profileImage || defaultProfileImageUrl)
const userProfileImageRef = ref(profileStore.profileImage || defaultProfileImageUrl)







watch(
  () => profileStore.profileImage,
  (newImageUrl) => {
    userProfileImageRef.value = newImageUrl
    userProfileImage.value = newImageUrl
  },
  { immediate: true }
)


// ใช้ computed แทนที่การใช้งานตัวแปรตรง ๆ
const computedUserProfileImage = computed(() => {
  return userProfileImageRef.value
})

const userProfileImageComputed = computed(() => {
  return userProfileImageRef.value
})



onAuthStateChanged(auth, (user) => {
  if (user) {
    isLoggedIn.value = true
    profileStore.setUid(user.uid) // Set UID in profileStore
    localStorage.setItem('uid', user.uid) // Save UID in Local Storage

    // Start listening to profile changes
    profileStore.listenToProfileChanges(user.uid)


    



    userProfileImage.value = user.photoURL || defaultProfileImageUrl
    localStorage.setItem('isLoggedIn', 'true')
  } else {
    isLoggedIn.value = false
    profileStore.clearProfileData() // Clear profile data in profileStore
    localStorage.removeItem('isLoggedIn')
  }
})






const showToast = (message, type) => {
  if (toastVisible) return // ถ้า toast กำลังแสดงอยู่ ให้ return ทันที

  toastVisible = true
  Toastify({
    text: message,
    duration: 3000,
    close: true,
    gravity: "top",
    position: "right",
    style: {
      background: type === 'success' ? "linear-gradient(to right, #00b09b, #96c93d)" : "linear-gradient(to right, #f44336, #ff5722)"
    },
    onClose: () => {
      toastVisible = false // เมื่อ toast ปิดแล้ว ให้รีเซ็ตสถานะ
    }
  }).showToast()
}




// Load notifications and messages from localStorage when component is mounted
onMounted(() => {
  try {
    notificationStore.loadNotificationsFromStorage()

    const loggedIn = localStorage.getItem('isLoggedIn')
    if (loggedIn) {
      isLoggedIn.value = true
      const profileData = JSON.parse(localStorage.getItem('profile-data'))
      if (profileData) {
        profileStore.updateProfileData(profileData.email, profileData.name)
      }
    } else {
      isLoggedIn.value = false
    }
  } catch (error) {
    console.error('Error loading messages or notifications:', error)
    showToast('เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error')
  }
})








// ฟังก์ชันเพิ่มการแจ้งเตือนเมื่อมีความคิดเห็นใหม่
const addNewCommentNotification = () => {
  notificationStore.addNotification({
    postId: currentPostId.value,
    message: 'มีคอมเมนต์ใหม่',
    time: new Date().toLocaleString(),
  })
  // เล่นเสียงแจ้งเตือน
  notificationSound.play().catch(error => {
    console.error('Error playing notification sound:', error)
  })
}












// โหลดการแจ้งเตือนจาก localStorage
onMounted(() => {
  notificationStore.loadNotificationsFromStorage()
})

// ฟังก์ชันเปิด/ปิดป๊อปอัป Notifications
const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
}

// ฟังก์ชันตรวจสอบการคลิกนอกป๊อปอัป
const handleClickOutside = (event) => {
  const dropdown = document.getElementById('notificationDropdown')
  if (dropdown && !dropdown.contains(event.target)) {
    showNotifications.value = false
  }
}

// ฟังก์ชันเพิ่มการแจ้งเตือนทั่วไป
const addNotification = (notification) => {
  notificationStore.addNotification(notification)
}

// ฟังก์ชันลบการแจ้งเตือนเฉพาะ
const removeNotification = (index) => {
  notificationStore.removeNotification(index)
}

// ฟังก์ชันลบการแจ้งเตือนทั้งหมด
const clearAllNotifications = () => {
  notificationStore.clearNotifications()
}

// ฟังก์ชันจัดการข้อความแจ้งเตือนป๊อปอัป
const popupMessage = (type, message) => {
  eventStore.popupMessage(type, message)
}

// ฟังก์ชันแสดงรายละเอียดโพสต์
const viewPost = (postId) => {
  showNotifications.value = false
  router.push({ name: 'postdetail', params: { id: postId } })
}



// ใช้ watch เพื่อตรวจสอบการเปลี่ยนแปลงของ email
watch(email, (newValue) => {
  if (!newValue) {
    emailError.value = 'โปรดป้อนอีเมลผู้ใช้'
    setTimeout(() => {
      emailError.value = ''
    }, 5000) // แสดงข้อความแจ้งเตือนเป็นเวลา 5 วินาที
  } else {
    emailError.value = ''
  }
})

// ใช้ watch เพื่อตรวจสอบการเปลี่ยนแปลงของ password
watch(password, (newValue) => {
  if (!newValue) {
    passwordError.value = 'โปรดป้อนรหัสผ่าน'
    setTimeout(() => {
      passwordError.value = ''
    }, 5000) // แสดงข้อความแจ้งเตือนเป็นเวลา 5 วินาที
  } else {
    passwordError.value = ''
  }
})

// ฟังก์ชัน Login
const login = async () => {
  if (!email.value) {
    emailError.value = 'โปรดป้อนอีเมลผู้ใช้'
    return
  }
  
  if (!password.value) {
    passwordError.value = 'โปรดป้อนรหัสผ่าน'
    return
  }
  
  try {
    await accountStore.signInAdmin(email.value, password.value)

    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('profile-data', JSON.stringify({
      email: email.value,
      name: 'User Name',
      profileImage: ''
    }))

    // Update profile data in store
    profileStore.updateProfileData(email.value, 'User Name')
    isLoggedIn.value = true
    closeLoginModal()

    // Show success message using Toastify
    showToast('เข้าสู่ระบบสำเร็จ!', 'success')

    // Redirect user based on role
    router.push(accountStore.isAdmin ? { name: 'admin-dashboard' } : { name: 'home' })
  } catch (error) {
    // Show error message using Toastify
    showToast('เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูลอีกครั้ง!', 'error')
    console.error("Login error:", error)
  }
}

















// Logout function
const logout = async () => {
  try {
    await auth.signOut()
    await accountStore.logout()

    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('profile-data')
    isLoggedIn.value = false

    router.push({ name: 'home' })
  } catch (error) {
    console.error('Error during logout:', error)
  }
}





const showPassword = ref(false)
const showConfirmPassword  = ref(false)
const showSignUpPassword = ref(false)
const confirmPasswordError = ref('')
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/
const thaiCharPattern = /[ก-๙]/ // ตรวจสอบว่ามีตัวอักษรไทยหรือไม่


watch([signUpPassword, confirmPassword], () => {
  // ตรวจสอบว่าไม่มีภาษาไทยในรหัสผ่าน
  if (thaiCharPattern.test(signUpPassword.value)) {
    confirmPasswordError.value = 'กรุณาใส่รหัสผ่านเป็นภาษาอังกฤษเท่านั้น'
  } 
  // ตรวจสอบว่ารหัสผ่านและรหัสยืนยันตรงกัน
  else if (confirmPassword.value && signUpPassword.value !== confirmPassword.value) {
    confirmPasswordError.value = 'รหัสผ่านไม่ตรงกัน'
  } 
  // ล้างข้อความแจ้งเตือนเมื่อรหัสผ่านตรงตามเงื่อนไขทั้งหมด
  else {
    confirmPasswordError.value = ''
  }
})



// ฟังก์ชัน togglePasswordVisibility เพื่อเปลี่ยนสถานะ showPassword
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// toggle function for each input field to change immediately
const toggleSignUpPasswordVisibility = () => {
  showSignUpPassword.value = !showSignUpPassword.value
}

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value
}


// Handle search
const handleSearch = (event) => {
  if (event.key === 'Enter') {
    router.push({
      name: 'search',
      query: { q: searchText.value },
    })
  }
}

// Open/Close Login Modal
const openLoginModal = () => {
  showLoginModal.value = true
}
const closeLoginModal = () => {
  showLoginModal.value = false
  email.value = ''
  password.value = ''
}

// Open/Close SignUp Modal
const openSignUp = () => {
  closeLoginModal()
  showSignUpModal.value = true
}
const closeSignUpModal = () => {
  showSignUpModal.value = false
  displayName.value = ''
  signUpEmail.value = ''
  signUpPassword.value = ''
  confirmPassword.value = ''
}




// Register new user
const signUp = async () => {
  // Check if password meets length, contains at least one number, and no Thai characters
  const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/ // ต้องมีอย่างน้อย 8 ตัวอักษร รวมถึงตัวอักษรอังกฤษและตัวเลข ไม่มีตัวอักษรไทย
  const thaiCharPattern = /[ก-๙]/ // ตรวจสอบว่ามีตัวอักษรไทยหรือไม่

  if (thaiCharPattern.test(signUpPassword.value)) {
    showToast('กรุณาใส่รหัสผ่านเป็นภาษาอังกฤษเท่านั้น', 'error')
    return
  }

  if (!passwordPattern.test(signUpPassword.value)) {
    showToast('รหัสผ่านต้องมี ตัวอักษรอังกฤษ ตัวเลข และยาวอย่างน้อย 8 ตัว', 'error')
    return
  }


  // Check if passwords match
  if (signUpPassword.value !== confirmPassword.value) {
    confirmPasswordError.value = 'รหัสผ่านไม่ตรงกัน'
    return
  } else {
    confirmPasswordError.value = ''
  }

  try {
    console.log("Checking if email exists...")
    const emailExists = await accountStore.checkEmailExists(signUpEmail.value)
    if (emailExists) {
      showToast('อีเมลนี้ถูกใช้ไปแล้ว', 'error')
      return
    }

    console.log("Creating new user...")
    await accountStore.createUser(signUpEmail.value, signUpPassword.value, displayName.value)

    console.log("Logging in with new user...")
    await accountStore.signInAdmin(signUpEmail.value, signUpPassword.value)

    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('profile-data', JSON.stringify({
      email: signUpEmail.value,
      name: displayName.value,
      profileImage: ''
    }))

    profileStore.updateProfileData(signUpEmail.value, displayName.value)
    isLoggedIn.value = true
    closeSignUpModal()


    showToast('สมัครสมาชิกสำเร็จ!', 'success')
    router.push({ name: 'home' })
  } catch (error) {
    showToast('การสมัครไม่สำเร็จ โปรดลองอีกครั้ง!', 'error')
    console.error("Sign-up error:", error.message)
  }
}








// Login with Google
const signInWithGoogle = async () => {
  try {
    const user = await accountStore.signInWithGoogle()
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('profile-data', JSON.stringify({
      email: user.email,
      name: user.displayName
    }))
    profileStore.updateProfileData(user.email, user.displayName)
    
    // ซ่อน Modal เมื่อล็อกอินสำเร็จ
    showLoginModal.value = false
    
    // เปลี่ยนไปยังหน้าโฮม
    router.push({ name: 'home' })
  } catch (error) {
    console.error("Login error:", error)
  }
}








// States
const showForgotPasswordModal = ref(false)
const forgotPasswordEmail = ref('')
const showResetForm = ref(false)
const newPassword = ref('')

// Open Forgot Password Modal
const openForgotPasswordModal = () => {
  showForgotPasswordModal.value = true
  showResetForm.value = false
}

// Close Forgot Password Modal
const closeForgotPasswordModal = () => {
  showForgotPasswordModal.value = false
  forgotPasswordEmail.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
}



// Function to send reset email directly with Firebase Authentication
const requestPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email, {
      url: 'https://tourism-commerce.firebaseapp.com/resetpassword' // URL สำหรับ ResetPassword.vue
    })
    showToast('ส่งอีเมลเปลี่ยนรหัสผ่านสำเร็จ โปรดตรวจสอบที่อีเมลของคุณ', 'success')
    closeForgotPasswordModal()
  } catch (error) {
    console.error('Error sending reset link:', error)
    showToast('เกิดข้อผิดพลาดในการส่งอีเมลเปลี่ยนรหัสผ่าน', 'error')
  }
}

// Verify email before sending reset
const verifyEmail = () => {
  if (!forgotPasswordEmail.value) {
    showToast('กรุณากรอกอีเมล', 'error')
    return
  }
  requestPasswordReset(forgotPasswordEmail.value)
}










// State variables
const chats = ref([])
const currentChatPartner = ref('')
const currentGuideId = ref('') // Variable to store the current guide ID
const selectedChatId = ref(null)
const showChatList = ref(false)
const showChatPopup = ref(false)
const messages = ref([])
const newMessage = ref('')
const filePreview = ref(null)
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const showEmojiPicker = ref(false)
const showImageModal = ref(false)
const zoomedImage = ref(null) // Variable to store the image URL for zoom




// ฟังก์ชันโหลดข้อมูลผู้ใช้และกำหนดบทบาท
const getUserRoleAndGuideId = async (userId) => {
  const userRef = doc(db, 'users', userId)
  const userSnapshot = await getDoc(userRef)

  let role = 'user'
  let guideId = userId

  if (userSnapshot.exists()) {
    const userData = userSnapshot.data()
    role = userData.role
    if (role === 'guide') {
      guideId = userData.uid || userId
    }
  }

  return { role, guideId }
}




// ฟังก์ชันโหลดคู่สนทนาจาก users หรือ guides collection โดยใช้ partnerId
const getPartnerData = async (partnerId, partnerType) => {
  if (!partnerId) {
    return {}
  }

  try {
    let partnerInfo;

    if (partnerType === 'guide') {
      const guideRef = doc(db, 'guides', partnerId)
      const guideSnapshot = await getDoc(guideRef)

      if (guideSnapshot.exists()) {
        const guideData = guideSnapshot.data()
        const userUid = guideData.uid

        const usersRef = collection(db, 'users')
        const userQuery = query(usersRef, where('uid', '==', userUid))
        const userSnapshot = await getDocs(userQuery)

        if (!userSnapshot.empty) {
          partnerInfo = userSnapshot.docs[0].data()
        } else {
          return {}
        }
      } else {
        return {}
      }
    } else {
      const userRef = doc(db, 'users', partnerId)
      const userSnapshot = await getDoc(userRef)

      if (userSnapshot.exists()) {
        partnerInfo = userSnapshot.data()
      } else {
        return {}
      }
    }

    return {
      partnerName: partnerInfo.displayName || 'Unknown User',
      partnerEmail: partnerInfo.email || '',
      partnerImageUrl: partnerInfo.imageUrl || '',
      partnerProfileImage: partnerInfo.profileImage || '',
      partnerRole: partnerType
    }
  } catch (error) {
    console.error("Error fetching partner data:", error)
    return {}
  }
}




// ฟังก์ชันหลักในการโหลดข้อมูลแชทล่าสุด
const loadRecentChats = async () => {
  const userId = auth.currentUser.uid
  const { role, guideId } = await getUserRoleAndGuideId(userId)

  const chatsRef = collection(db, 'chats')
  const userChatsQuery = query(chatsRef, where('userId', '==', userId))
  const guideChatsQuery = query(chatsRef, where('guideId', '==', guideId))

  const [userChatsSnapshot, guideChatsSnapshot] = await Promise.all([
    getDocs(userChatsQuery),
    getDocs(guideChatsQuery)
  ])

  const combinedSnapshots = [...userChatsSnapshot.docs, ...guideChatsSnapshot.docs]
  const uniqueChats = Array.from(new Map(combinedSnapshots.map(doc => [doc.id, doc])).values())

  const chatsData = await Promise.all(uniqueChats.map(async (document) => {
    const chatData = document.data()
    const partnerId = chatData.userId === userId ? chatData.guideId : chatData.userId
    const partnerType = chatData.userId === userId ? 'guide' : 'user'
    const partnerData = await getPartnerData(partnerId, partnerType)

    return {
      id: document.id,
      partnerName: partnerData.partnerName || 'Unknown User',
      partnerProfileImage: partnerData.partnerProfileImage || partnerData.partnerImageUrl || '',
      lastMessage: chatData.lastMessage || 'ไม่มีข้อความล่าสุด',
      lastMessageAt: chatData.lastMessageAt || null,
      ...chatData
    }
  }))

  chats.value = chatsData
}



// Open chat and load messages with the latest message displayed
const openChat = async (chatId, partnerName, partnerId) => {
  console.log("Chat ID:", chatId)
  console.log("Partner Name:", partnerName)
  console.log("Partner ID:", partnerId)
  selectedChatId.value = chatId
  currentChatPartner.value = partnerName
  currentGuideId.value = partnerId
  showChatPopup.value = true
  showChatList.value = false
  loadMessages(chatId)
}

// Load messages for the selected chat and scroll to the latest message
const loadMessages = (chatId) => {
  const messagesRef = collection(db, 'chats', chatId, 'messages')
  const q = query(messagesRef, orderBy('createdAt', 'asc'))

  onSnapshot(q, (snapshot) => {
    messages.value = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    scrollToLatestMessage()
  })
}



// ฟังก์ชันส่งข้อความ
const sendMessage = async () => {
  if (newMessage.value.trim() === '' && !filePreview.value) return;

  const isGuide = selectedChatId.value.startsWith(auth.currentUser.uid);
  const receiverId = isGuide ? selectedChatId.value.split('_')[1] : selectedChatId.value.split('_')[0];

  const messageData = {
    senderId: auth.currentUser.uid,
    receiverId: receiverId,
    text: newMessage.value,
    createdAt: serverTimestamp(),
  };

  if (filePreview.value) {
    messageData.fileUrl = filePreview.value.url;
    messageData.fileName = filePreview.value.isImage ? null : filePreview.value.name;
    messageData.isImage = filePreview.value.isImage;
    filePreview.value = null;
  }

  await addDoc(collection(db, 'chats', selectedChatId.value, 'messages'), messageData);
  newMessage.value = '';
};




// Handle Enter key for sending message
const handleKeyPress = (event) => {
  if (event.key === 'Enter') {
    sendMessage()
  }
}






// ฟังก์ชันจัดการการอัปโหลดไฟล์พร้อมแสดงตัวอย่างเป็น Base64 แต่ยังไม่ส่งไปที่ Firestore ทันที
const uploadChatFile = (event) => {
  const selectedFile = event.target.files[0];
  if (!selectedFile) return;

  if (selectedFile.size > MAX_FILE_SIZE) {
    showToast("ไฟล์มีขนาดเกินที่กำหนด (10MB)", "error");
    return;
  }

  const isImage = selectedFile.type.startsWith("image/");

  const reader = new FileReader();
  reader.onloadend = () => {
    filePreview.value = {
      url: reader.result,
      name: selectedFile.name,
      isImage: isImage,
    };
  };

  reader.onerror = (error) => {
    console.error("Error reading file:", error);
    showToast("เกิดข้อผิดพลาดในการเข้ารหัสไฟล์", "error");
  };

  reader.readAsDataURL(selectedFile);
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

  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

// Load recent chats when component is mounted
onMounted(() => {
  loadRecentChats()
})


watch(selectedChatId, (newChatId) => {
  if (newChatId) {
    loadMessages(newChatId)
  }
})



// Scroll to the latest message
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


// Open image modal
const openImageModal = (imageUrl) => {
  zoomedImage.value = imageUrl
  showImageModal.value = true
}

// Close image modal
const closeImageModal = () => {
  zoomedImage.value = null
  showImageModal.value = false
}







</script>










<template>

  
<div class="w-full flex flex-col min-h-screen">
  <!-- Navbar -->
    <div class="navbar bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 shadow-2xl py-4 rounded-b-3xl w-full flex justify-between items-center">
   
   
   <!-- Logo -->
   <div class="flex-1 px-4">
      <RouterLink 
        :to="{ name: 'home' }" 
        class="text-3xl font-extrabold text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text hover:text-yellow-300 transition-all duration-500 hover:scale-110"
      >
        WangNa
      </RouterLink>
    </div>


   <!-- Menu Links -->
    <div class="hidden md:flex space-x-8 px-4">
      <RouterLink 
        :to="{ name: 'job' }" 
        class="btn btn-ghost text-xl font-semibold text-gray-700 hover:text-indigo-600 transition-all"
      >
        โพสต์
      </RouterLink>
      <RouterLink 
        :to="{ name: 'rank' }" 
        class="btn btn-ghost text-xl font-semibold text-gray-700 hover:text-purple-600 transition-all"
      >
        อันดับ
      </RouterLink>
      <RouterLink 
        :to="{ name: 'promotion' }" 
        class="btn btn-ghost text-xl font-semibold text-gray-700 hover:text-pink-600 transition-all"
      >
        โปรโมชั่น
      </RouterLink>
    </div>

  <!-- Dropdown Menu for Mobile -->
  <div class="flex md:hidden relative">
    <button class="btn btn-ghost focus:outline-none" @click="showDropdown = !showDropdown">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>


      <!-- Dropdown Content -->
      <div 
        v-if="showDropdown" 
        class="absolute top-12 right-0 bg-white shadow-lg rounded-lg z-50 py-2 w-40 border border-gray-200"
      >
        <RouterLink 
          :to="{ name: 'job' }" 
          class="block px-4 py-2 text-gray-700 hover:bg-indigo-100 hover:text-indigo-600 transition-all"
        >
          JOB
        </RouterLink>
        <RouterLink 
          :to="{ name: 'rank' }" 
          class="block px-4 py-2 text-gray-700 hover:bg-purple-100 hover:text-purple-600 transition-all"
        >
          RANK
        </RouterLink>
        <RouterLink 
          :to="{ name: 'promotion' }" 
          class="block px-4 py-2 text-gray-700 hover:bg-pink-100 hover:text-pink-600 transition-all"
        >
          PROMOTION
        </RouterLink>
      </div>
    </div>
    
      <div class="flex-none flex items-center space-x-4 px-4">
      
        <div class="form-control relative">
          <input 
            type="text" 
            placeholder="Search for something..." 
            class="input input-bordered w-32 md:w-64 lg:w-80 xl:w-96 rounded-full px-5 py-3 focus:outline-none focus:ring-4 focus:ring-pink-400 shadow-lg transition-all duration-300 transform hover:scale-110 hover:shadow-xl bg-gradient-to-r from-purple-100 to-indigo-100 text-gray-700 placeholder-gray-400"
            v-model="searchText" 
            @keyup="handleSearch"
          />
          <svg xmlns="http://www.w3.org/2000/svg" class="absolute right-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-500 pointer-events-none transition-transform duration-300 hover:text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16a6 6 0 1110.92-4.92M15 15l5 5" />
          </svg>
        </div>
      </div>




     


    
        <!-- Notification Button -->
        <div class="relative">
          <button 
            class="btn btn-ghost btn-circle hover:bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300 transform hover:scale-110 focus:ring focus:ring-pink-200 shadow-lg" 
            @click="toggleNotifications">
            <div class="indicator">
              <font-awesome-icon 
                icon="fa-regular fa-bell" 
                :shake="notificationStore.notifications.length > 0" 
                size="xl" 
                style="color: #1a3665;" 
                class="transition-transform duration-200 hover:scale-110" 
              />
              <span 
                v-if="notificationStore.notifications.length > 0" 
                class="badge badge-xs badge-primary indicator-item bg-red-500 text-white animate-bounce">
                {{ notificationStore.notifications.length }}
              </span>
            </div>
          </button>

        <!-- Notification Dropdown -->
        <div 
          v-if="showNotifications" 
          id="notificationDropdown"
          class="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 transition-opacity duration-300"
          style="top: 50px;"
          @click.stop>
          <div class="p-6 space-y-4 max-h-96 overflow-y-auto">
            <div class="flex items-center mb-4">
              <h3 class="text-lg font-semibold text-gray-800">Notifications</h3>
            </div>

            <!-- Notification Items -->
            <div v-for="(notification, index) in notificationStore.notifications" 
                :key="index" 
                class="notification-item bg-gray-100 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out relative">
              <p class="text-gray-900 font-semibold mb-1">{{ notification.message }}</p>
              <span class="absolute top-2 right-2 text-xs text-gray-400">{{ notification.time }}</span>
              <div class="flex justify-between items-center mt-2">
                <button @click="viewPost(notification.postId)" class="btn btn-sm bg-indigo-500 text-white rounded-full">
                  ดูโพสต์
                </button>
                <button @click="removeNotification(index)" class="btn btn-sm bg-red-500 text-white rounded-full">
                  ลบ
                </button>
              </div>
            </div>

            <!-- No Notifications Message -->
            <div v-if="notificationStore.notifications.length === 0" class="text-center text-gray-500">
              <i class="fas fa-inbox text-gray-300 text-3xl mb-2"></i>
              <p>ไม่มีการแจ้งเตือน</p>
            </div>

            <!-- Clear All Button -->
            <div v-if="notificationStore.notifications.length > 0" class="text-center mt-4">
              <button @click="clearAllNotifications" class="btn btn-sm bg-yellow-500 text-white px-4 py-2 rounded-full">
                เคลียร์ทั้งหมด
              </button>
            </div>
          </div>
        </div>
      </div>





        <!-- Profile Avatar or Login Button -->
        <div v-if="isLoggedIn" class="ml-4">
          <div class="dropdown dropdown-end">
            <div tabindex="0" role="button" class="btn btn-ghost btn-circle avatar">
              <div class="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100">
                <template v-if="computedUserProfileImage">
                  <img :src="computedUserProfileImage" alt="User Profile" class="w-full h-full rounded-full object-cover" />
                </template>
                <template v-else>
                  <font-awesome-icon :icon="['far', 'user']" class="text-gray-500" style="font-size: 2.5rem;" />
                </template>
              </div>
            </div>
            <ul tabindex="0" class="menu menu-sm dropdown-content bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
              <li>
                <RouterLink :to="{ name: 'profile' }" class="justify-between">
                  Profile
                </RouterLink>
              </li>
              <li><a @click="logout">Logout</a></li>
            </ul>
          </div>
        </div>

        <div v-else class="ml-4">
          <button @click="openLoginModal" class="btn btn-primary px-6 py-2 rounded-full text-white font-semibold bg-gradient-to-r from-indigo-500 to-pink-500 hover:bg-indigo-600 transition-transform duration-300 hover:scale-105">
            LOGIN
          </button>
        </div>
       
     
 
   

<!-- Login Modal -->
<div v-if="showLoginModal" class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
  <div class="relative bg-white rounded-lg shadow-2xl p-10 w-96 transition-transform transform hover:scale-105">
    
    <!-- Close (X) Icon -->
    <button 
      @click="closeLoginModal" 
      class="absolute top-4 right-4 btn btn-circle btn-sm bg-gray-200 hover:bg-red-500 text-gray-700 hover:text-white transition-all duration-300"
    >
      ✕
    </button>

    <!-- Title -->
    <h2 class="text-3xl font-bold mb-8 text-center text-gray-800">เข้าสู่ระบบ</h2>
    
    <!-- Email Input -->
    <div class="relative mb-6">
      <input 
        v-model="email" 
        type="email" 
        placeholder="อีเมล" 
        class="input input-bordered w-full px-4 py-3 rounded-lg border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
      />
      <transition name="fade">
        <p v-if="emailError" class="absolute -bottom-5 left-0 text-xs text-red-500 mt-2">{{ emailError }}</p>
      </transition>
    </div>

    <!-- Password Input with Show/Hide Toggle -->
    <div class="relative mb-6">
      <input 
        v-model="password" 
        :type="showPassword ? 'text' : 'password'" 
        placeholder="รหัสผ่าน" 
        class="input input-bordered w-full px-4 py-3 rounded-lg border-gray-300 shadow-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
      />
      <button 
        @click="togglePasswordVisibility" 
        class="absolute right-3 top-3 text-gray-500 hover:text-indigo-500 transition-colors duration-200"
        type="button"
      >
        <font-awesome-icon :icon="showPassword ? 'eye-slash' : 'eye'" />
      </button>
      <transition name="fade">
        <p v-if="passwordError" class="absolute -bottom-7 left-0 text-xs text-red-500 mt-2">{{ passwordError }}</p>
      </transition>
    </div>

    <!-- Forgot Password Button -->
    <div class="flex justify-end mb-8">
      <button 
        @click="openForgotPasswordModal" 
        class="text-sm text-indigo-600 hover:underline transition-colors duration-200"
      >
        ลืมรหัสผ่าน?
      </button>
    </div>

    <!-- Login Button -->
    <button 
      @click="login" 
      class="w-full py-3 mb-4 text-white font-semibold bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors duration-300 shadow-lg focus:outline-none transform hover:scale-105"
    >
      เข้าสู่ระบบ
    </button>

    <!-- Sign Up Button -->
    <button 
      @click="openSignUp" 
      class="w-full py-3 mb-4 text-indigo-600 font-semibold border border-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors duration-300 shadow-lg focus:outline-none transform hover:scale-105"
    >
      สมัครสมาชิก
    </button>
    
    <!-- Sign in with Google Button -->
    <button 
      @click="signInWithGoogle" 
      class="w-full py-3 flex items-center justify-center border border-gray-300 rounded-lg hover:shadow-lg transition-shadow duration-300 bg-white hover:bg-gray-50"
    >
      <font-awesome-icon :icon="['fab', 'google']" class="h-5 w-5 mr-2 text-gray-600" />
      <span class="font-semibold text-gray-700">เข้าสู่ระบบด้วย Google</span>
    </button>
  </div>
</div>










<!-- Sign Up Modal -->
<div v-if="showSignUpModal" class="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70">
  <div class="relative bg-white rounded-lg shadow-2xl p-10 w-96 transition-transform transform hover:scale-105">
    
    <!-- Close (X) Icon -->
    <button 
      @click="closeSignUpModal" 
      class="absolute top-4 right-4 btn btn-circle btn-sm bg-gray-200 hover:bg-red-500 text-gray-700 hover:text-white transition-all duration-300"
    >
      ✕
    </button>

    <!-- Title -->
    <h2 class="text-3xl font-bold mb-4 text-center text-gray-800">สมัครสมาชิก</h2>


    <!-- Display Name Input -->
    <input 
      v-model="displayName" 
      type="text" 
      placeholder="ชื่อที่แสดง" 
      class="input input-bordered w-full mb-4 px-4 py-3 rounded-lg border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
    />

    <!-- Email Input -->
    <input 
      v-model="signUpEmail" 
      type="email" 
      placeholder="อีเมล" 
      class="input input-bordered w-full mb-4 px-4 py-3 rounded-lg border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200"
    />

    <!-- Password Input with Show/Hide Toggle -->
    <div class="relative mb-2">
      <input 
        v-model="signUpPassword" 
        :type="showSignUpPassword ? 'text' : 'password'" 
        placeholder="รหัสผ่าน" 
        class="input input-bordered w-full px-4 py-3 rounded-lg border-gray-300 shadow-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-50"
      />
      <button 
        @click="toggleSignUpPasswordVisibility" 
        class="absolute right-3 top-3 text-gray-500 hover:text-indigo-500 transition-colors duration-200"
        type="button"
      >
        <font-awesome-icon :icon="showSignUpPassword ? 'eye-slash' : 'eye'" />
      </button>
    </div>
    <p class="text-xs text-gray-500 mb-4">รหัสผ่านต้องมี ตัวอักษรอังกฤษ ตัวเลข และยาวอย่างน้อย 8 ตัว</p>

      <!-- Confirm Password Input with Show/Hide Toggle -->
    <div class="relative mb-4">
      <input 
        v-model="confirmPassword" 
        :type="showConfirmPassword ? 'text' : 'password'" 
        placeholder="ยืนยันรหัสผ่าน" 
        class="input input-bordered w-full px-4 py-3 rounded-lg border-gray-300 shadow-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-100"
      />
      <button 
        @click="toggleConfirmPasswordVisibility" 
        class="absolute right-3 top-3 text-gray-500 hover:text-indigo-500"
        type="button"
      >
        <font-awesome-icon :icon="showConfirmPassword ? 'eye-slash' : 'eye'" />
      </button>
    </div>
    <p v-if="confirmPasswordError" class="text-xs text-red-500 mb-4">{{ confirmPasswordError }}</p>

    <!-- Sign Up Button -->
    <button 
      @click="signUp" 
      class="w-full py-3 mb-4 text-white font-semibold bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors duration-300 shadow-lg focus:outline-none transform hover:scale-105"
    >
      สมัครสมาชิก
    </button>
  </div>
</div>






<!-- Forgot Password Modal -->
<div v-if="showForgotPasswordModal" class="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
  <div class="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-transform duration-300 hover:scale-105">
    <!-- Close Button (X) -->
    <button @click="closeForgotPasswordModal" class="absolute top-4 right-4 text-gray-600 hover:text-red-500 transition-colors duration-200">
      ✕
    </button>

    <!-- Title -->
    <h2 class="text-3xl font-extrabold text-center text-gray-800 mb-6">ลืมรหัสผ่าน</h2>
    <p class="text-center text-gray-500 mb-8">กรุณากรอกอีเมลของคุณเพื่อรับลิงก์รีเซ็ตรหัสผ่าน</p>

    <!-- Email Input -->
    <div class="relative mb-6">
      <input 
        v-model="forgotPasswordEmail" 
        type="email" 
        placeholder="กรอกอีเมลของคุณ" 
        class="w-full px-4 py-3 rounded-full border border-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-300 transition-all duration-200"
      />
      <svg xmlns="http://www.w3.org/2000/svg" class="absolute right-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12H8m0 0v4m0-4V8m0 4h4" />
      </svg>
    </div>

    <!-- Reset Link Button -->
    <button 
      @click="verifyEmail" 
      class="w-full py-3 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-lg shadow-lg transition-all duration-300 transform hover:scale-105 hover:bg-indigo-600 focus:outline-none focus:ring-4 focus:ring-pink-200"
    >
      ส่งลิงก์รีเซ็ตรหัสผ่าน
    </button>
  </div>
</div>





</div>






<!-- Chat Button -->
<button 
  v-if="isLoggedIn" 
  @click="showChatList = true" 
  class="fixed bottom-6 right-6 flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105"
  title="เปิดแชท"
>
  <font-awesome-icon :icon="['fas', 'comments']" class="text-2xl" />
</button>




<!-- Chat List Modal -->
<div v-if="showChatList" class="fixed inset-0 bg-black bg-opacity-70 flex justify-end items-end z-50 p-4">
  <div class="w-80 bg-white p-6 rounded-lg shadow-2xl relative transition duration-300 transform hover:scale-105">
    <button @click="showChatList = false" class="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors">
      ✕
    </button>
    <h2 class="text-xl font-semibold text-center text-blue-500 mb-4">แชท</h2>
    
    <ul class="space-y-4 overflow-y-auto h-80 px-2">
      <li 
        v-for="chat in chats" 
        :key="chat.id" 
        @click="openChat(chat.id, chat.partnerName, chat.partnerId)" 
        class="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-md cursor-pointer hover:bg-blue-100 transition-all duration-300 transform hover:scale-95"
      >
        <!-- รูปโปรไฟล์ของคู่สนทนา -->
        <div v-if="chat.partnerProfileImage" class="w-12 h-12 rounded-full ring ring-indigo-500 ring-offset-2 shadow-lg bg-gradient-to-r from-indigo-200 to-purple-300 overflow-hidden">
          <img :src="chat.partnerProfileImage" alt="Profile Image" class="w-full h-full rounded-full object-cover border border-gray-300" />
        </div>
        <div v-else class="w-12 h-12 rounded-full ring ring-indigo-500 ring-offset-2 shadow-lg bg-gradient-to-r from-indigo-200 to-purple-300 flex items-center justify-center">
          <font-awesome-icon :icon="['far', 'user']" class="text-gray-500" style="font-size: 1.2rem;" />
        </div>
        
        <!-- ข้อมูลคู่สนทนา -->
        <div class="flex-1">
          <div class="text-lg font-semibold text-gray-900">{{ chat.partnerName }}</div>
          <div class="text-sm text-gray-600 truncate">{{ chat.lastMessage }}</div>
        </div>
        
        <!-- เวลา -->
        <span class="text-xs text-gray-400">{{ formatTimestamp(chat.lastMessageAt) }}</span>
      </li>
    </ul>
  </div>
</div>





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





<slot></slot>

<!-- Footer -->
<footer class="footer bg-gradient-to-r from-gray-800 via-gray-900 to-black text-gray-300 p-10 mt-16 rounded-lg shadow-lg">
  <div class="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
    <nav>
      <h6 class="footer-title text-xl font-semibold text-white mb-4">บริการ</h6>
      <ul class="space-y-2">
        <li><a href="#" class="link link-hover hover:text-primary transition-colors duration-300">การสร้างแบรนด์</a></li>
        <li><a href="#" class="link link-hover hover:text-primary transition-colors duration-300">การออกแบบ</a></li>
        <li><a href="#" class="link link-hover hover:text-primary transition-colors duration-300">การตลาด</a></li>
        <li><a href="#" class="link link-hover hover:text-primary transition-colors duration-300">โฆษณา</a></li>
      </ul>
    </nav>

    <nav>
      <h6 class="footer-title text-xl font-semibold text-white mb-4">บริษัท</h6>
      <ul class="space-y-2">
        <li><a href="#" class="link link-hover hover:text-primary transition-colors duration-300">เกี่ยวกับเรา</a></li>
        <li><a href="#" class="link link-hover hover:text-primary transition-colors duration-300">ติดต่อเรา</a></li>
        <li><a href="#" class="link link-hover hover:text-primary transition-colors duration-300">ร่วมงานกับเรา</a></li>
        <li><a href="#" class="link link-hover hover:text-primary transition-colors duration-300">ชุดสื่อประชาสัมพันธ์</a></li>
      </ul>
    </nav>

    <nav>
      <h6 class="footer-title text-xl font-semibold text-white mb-4">ข้อกำหนด</h6>
      <ul class="space-y-2">
        <li><a href="#" class="link link-hover hover:text-primary transition-colors duration-300">เงื่อนไขการใช้งาน</a></li>
        <li><a href="#" class="link link-hover hover:text-primary transition-colors duration-300">นโยบายความเป็นส่วนตัว</a></li>
        <li><a href="#" class="link link-hover hover:text-primary transition-colors duration-300">นโยบายคุกกี้</a></li>
      </ul>
    </nav>
  </div>

  <div class="border-t border-gray-700 mt-8 pt-6">
    <div class="container mx-auto flex justify-center space-x-4">
      <a href="#" class="text-gray-300 hover:text-blue-400 transition-colors duration-300">
        <i class="fab fa-facebook fa-2x"></i>
      </a>
      <a href="#" class="text-gray-300 hover:text-light-blue-500 transition-colors duration-300">
        <i class="fab fa-twitter fa-2x"></i>
      </a>
      <a href="#" class="text-gray-300 hover:text-pink-500 transition-colors duration-300">
        <i class="fab fa-instagram fa-2x"></i>
      </a>
      <a href="#" class="text-gray-300 hover:text-red-600 transition-colors duration-300">
        <i class="fab fa-youtube fa-2x"></i>
      </a>
    </div>
  </div>

  <div class="text-center text-gray-400 text-sm mt-4">
    © 2024 บริษัทของคุณ สงวนลิขสิทธิ์
  </div>
</footer>

 














</div>


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

   

   
</template>



<style scoped>
.notification {
  position: relative;
}

.notification-list {
  position: absolute;
  right: 0;
  top: 50px;
  background-color: white;
  border: 1px solid #ddd;
  padding: 10px;
  box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.1);
}

.notification-item {
  margin-bottom: 10px;
}



/* เอฟเฟกต์เฟดอินสำหรับข้อความแจ้งเตือน */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease-in-out;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}



.user-layout {
  position: relative;
}

</style>
