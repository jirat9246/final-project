import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/user/HomeView.vue'
import SearchView from '@/views/user/SearchView.vue'
import ProfileView from '@/views/user/ProfileView.vue'
import SuccessView from '@/views/user/SuccessView.vue'
import CheckoutView from '@/views/user/CheckoutView.vue'
import CartView from '@/views/user/CartView.vue'
import SettingsView from '@/views/user/SettingsView.vue'
import JobView from '@/views/user/JobView.vue'
import RankView from '@/views/user/RankView.vue'
import PromotionView from '@/views/user/PromotionView.vue'
import BankInfoView from '@/views/user/BankInfoView.vue'
import ContactInfoView from '@/views/user/ContactInfoView.vue'
import IDCardInfoView from '@/views/user/IDCardInfoView.vue'
import GuideCardInfoView from '@/views/user/GuideCardInfoView.vue'
import PostDetailView from '@/views/user/PostDetailView.vue'

import ResetPasswordView from '@/views/user/ResetPassword.vue'

import { h } from 'vue'


import AdminLogin from '@/views/admin/LoginView.vue'
import AdminDashboard from '@/views/admin/DashboardView.vue'
import AdminComponent from '@/views/admin/AdminComponent.vue'


import AdminProductList from '@/views/admin/product/ListView.vue'
import AdminProductUpdate from '@/views/admin/product/UpdateView.vue'

import AdminUserList from '@/views/admin/user/ListView.vue'
import AdminUserUpdate from '@/views/admin/user/UpdateView.vue'

import AdminGuideList from '@/views/admin/guide/ListView.vue'
import AdminGuideUpdate from '@/views/admin/guide/UpdateView.vue'
import AdminGuideProflie from '@/views/admin/guide/ProflieView.vue'

import AdminPromotionList from '@/views/admin/promotion/ListView.vue'
import AdminPromotionUpdate from '@/views/admin/promotion/UpdateView.vue'


import AdminPaymentVerification from '@/views/admin/payments/PaymentVerification.vue'
import AdminGuidePaymentNotification from '@/views/admin/guidepayment/GuidePaymentNotificationView.vue'

import { useAccountStore } from '@/stores/account'






import SuratthaniView from '@/views/user/province/SuratthaniView.vue'
import ChanthaburiView from '@/views/user/province/ChanthaburiView.vue'
import ChiangmaiView from '@/views/user/province/ChiangmaiView.vue'
import PhuketView from '@/views/user/province/PhuketView.vue'
import NakhonratchasimaView from '@/views/user/province/NakhonratchasimaView.vue'







const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
    },
    {
      path: '/search',
      name: 'search',
      component: SearchView,
    },
    {
      path: '/cart',
      name: 'cart',
      component: CartView,
    },
    {
      path: '/checkout',
      name: 'checkout',
      component: CheckoutView,
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsView,
    },
    {
      path: '/success',
      name: 'success',
      component: SuccessView,
    },
    {
      path: '/job',
      name: 'job',
      component: JobView,
    }
    
    ,
    {
      path: '/rank',
      name: 'rank',
      component: RankView,
    },
    {
      path: '/promotion',
      name: 'promotion',
      component: PromotionView,
    },
    {
      path: '/bankinfo',
      name: 'bankinfo',
      component: BankInfoView,
    },
    {
      path: '/contactinfo',
      name: 'contactinfo',
      component: ContactInfoView,
    },
    {
      path: '/idcardinfo',
      name: 'idcardinfo',
      component: IDCardInfoView,
    },
    {
      path: '/guidecardinfo',
      name: 'guidecardinfo',
      component: GuideCardInfoView,
    },
    {
      // เปลี่ยนจาก /postdetail เป็น /posts/:id เพื่อรองรับ postId
      path: '/posts/:id',
      name: 'postdetail',
      component: PostDetailView,
    },


    {
      path: '/resetpassword',
      name: 'resetpassword',
      component: ResetPasswordView
    },







    /* admin site */
    {
      path: '/admin/login',
      name: 'login',
      component: AdminLogin,
    },

    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: AdminDashboard,
    },
    {
      path: '/admin/admincomponent',
      name: 'admin-admincomponent',
      component: AdminComponent,
    },
    {
      path: '/admin/products',
      name: 'admin-products-list',
      component: AdminProductList,
    },
    {
      path: '/admin/products/create',
      name: 'admin-products-create',
      component: AdminProductUpdate,
    },
    {
      path: '/admin/products/update/:id',
      name: 'admin-products-update',
      component: AdminProductUpdate,
    },

    {
      path: '/admin/promotions',
      name: 'admin-promotions-list',
      component: AdminPromotionList,
    },
    {
      path: '/admin/promotions/create',
      name: 'admin-promotions-create',
      component: AdminPromotionUpdate,
    },
    {
      path: '/admin/promotions/update/:id',
      name: 'admin-promotions-update',
      component: AdminPromotionUpdate,
    },


    {
      path: '/admin/users',
      name: 'admin-users-list',
      component: AdminUserList,
    },
    {
      path: '/admin/users/update/:id',
      name: 'admin-users-update',
      component: AdminUserUpdate,
    },


    {
      path: '/admin/guides',
      name: 'admin-guides-list',
      component: AdminGuideList,
    },
    {
      path: '/admin/guides/update/:id',
      name: 'admin-guides-update',
      component: AdminGuideUpdate,
    },
    {
      path: '/admin/guides/profile/:id',
      name: 'guide-profile',
      component: AdminGuideProflie,
    },
    {
      path: '/admin/payments',
      name: 'admin-payments-paymentverification',
      component: AdminPaymentVerification,
    },


    {
      path: '/admin/guidepayment',
      name: 'admin-guidepayment-guidepaymentnotification',
      component: AdminGuidePaymentNotification,
    },










    {
      path: '/user/province/chanthaburi',
      name: 'ChanthaburiView',
      component: ChanthaburiView,
    },
    {
      path: '/user/province/chiangmai',
      name: 'ChiangmaiView',
      component: ChiangmaiView,
    },
    {
      path: '/user/province/nakhonratchasima',
      name: 'NakhonratchasimaView',
      component: NakhonratchasimaView,
    },
    {
      path: '/user/province/phuket',
      name: 'PhuketView',
      component: PhuketView,
    },
    {
      path: '/user/province/suratthani',
      name: 'SuratthaniView',
      component: SuratthaniView,
    },





  ]


})








router.beforeEach(async (to, from, next) => {
  try {
    const accountStore = useAccountStore()
    await accountStore.checkAuth()

    if (to.name.includes('admin') && !accountStore.isAdmin) {
      return next({ name: 'home' })
    }

    if (to.name === 'login' && accountStore.isAdmin) {
      return next({ name: 'admin-dashboard' })
    }

    next()
  } catch (error) {
    console.error('Error during authentication check:', error)
    next({ name: 'home' }) // นำทางกลับไปหน้า home หากเกิดข้อผิดพลาด
  }
})






export default router;
