import { createStore } from 'vuex'
import profileStore from '/src/stores/user/profileStore'
import product from '/src/stores/user/product'

export default createStore({
  modules: {
    profile: profileStore,
    product: product
  }
})
