import './style.css'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import VueApexCharts from 'vue3-apexcharts'

// Import Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import { faBell, faFile, faUser, faEnvelope, faSmile } from '@fortawesome/free-regular-svg-icons' // เพิ่ม faSmile จาก regular icons
import { faEye, faEyeSlash, faPaperPlane, faComments, faCheckCircle, faStar, faTimes, faPaperclip } from '@fortawesome/free-solid-svg-icons' // เพิ่ม faPaperclip จาก solid icons
import '@fortawesome/fontawesome-free/css/all.css'
import "toastify-js/src/toastify.css"

// Import App and Router
import App from './App.vue'
import router from './router'

// สร้าง Vue application
const app = createApp(App)

// ใช้งาน Pinia, Router, และ VueApexCharts
app.use(createPinia())
app.use(router)
app.use(VueApexCharts)

// เพิ่ม Font Awesome icons เข้าสู่ library
library.add(faGoogle, faBell, faEye, faEyeSlash, faUser, faFile, faPaperPlane, faEnvelope, faComments, faCheckCircle, faStar, faTimes, faPaperclip, faSmile)

// Register the Font Awesome component globally
app.component('font-awesome-icon', FontAwesomeIcon)

// Mount the app
app.mount('#app')
