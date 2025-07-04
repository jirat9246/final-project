<script setup>

import UserLayout from '/src/components/layouts/UserLayout.vue';
import { ref } from 'vue'




const places = ref([
  {
    name: 'ตึกชิโนโปรตุกีส เมืองเก่าภูเก็ต',
    description: 'ตึกชิโนโปรตุกีสที่เป็นสัญลักษณ์ของเมืองเก่าภูเก็ต ผสมผสานศิลปะตะวันตกและตะวันออก',
    imageUrl: 'https://cms.dmpcdn.com/travel/2022/03/16/0bebcc10-a4f8-11ec-837d-3f3f1e297725_webp_original.jpg',
    mapLink: 'https://maps.app.goo.gl/Py4zrYhHFh8XaWzz9',
    time: 'เปิดให้เข้าชมตลอดทั้งวัน'
  },
  {
    name: 'แหลมพรหมเทพ',
    description: 'จุดชมพระอาทิตย์ตกที่สวยงามที่สุดในภูเก็ต บรรยากาศโรแมนติก',
    imageUrl: 'https://cms.dmpcdn.com/travel/2020/12/08/362220e0-3908-11eb-94c3-7fc16b629bff_original.jpg',
    mapLink: 'https://maps.app.goo.gl/yLW1mLWp64PFAkvF7',
    time: 'เปิดให้เข้าชมตลอดทั้งวัน'
  },
  {
    name: 'เกาะไม้ท่อน',
    description: 'เกาะส่วนตัวที่มีน้ำทะเลใส สามารถดำน้ำชมปะการังและน้องปลานีโม่ได้',
    imageUrl: 'https://cms.dmpcdn.com/travel/2021/07/02/158e94f0-db04-11eb-bb0c-ffdbc98791f0_original.jpg',
    mapLink: 'https://maps.app.goo.gl/GHNa1vowsfJPRu248',
    time: 'เปิดให้เข้าชมตามรอบเรือ'
  },
  {
    name: 'จุดชมวิว ผาหินดำ',
    description: 'จุดชมวิว 360 องศา ที่มองเห็นเกาะต่างๆ รอบภูเก็ต เป็นสถานที่ Unseen',
    imageUrl: 'https://ik.imagekit.io/tvlk/blog/2024/04/WwfYkmC1-image34-1024x683.jpg?tr=dpr-2,w-675',
    mapLink: 'https://maps.app.goo.gl/f2fw5yeZLi36pyb79',
    time: 'เปิดให้เข้าชมตลอดทั้งวัน'
  },
  {
    name: 'เกาะเฮ',
    description: 'หาดทรายขาว น้ำทะเลใส ดำน้ำ พายเรือคายัค นั่งอาบแดด สวยงามและชิลสุดๆ',
    imageUrl: 'https://cms.dmpcdn.com/travel/2021/03/15/9a7606c0-8556-11eb-90ef-0d2a2de7d51d_original.jpg',
    mapLink: 'https://maps.app.goo.gl/wRQ8dpu5hbgtqfoWA',
    time: 'เปิดให้เข้าชมตามรอบเรือ'
  },
  {
    name: 'หาดไม้ขาว',
    description: 'หาดที่ติดกับสนามบินภูเก็ต สามารถเซลฟี่กับเครื่องบินที่กำลังลงจอดได้',
    imageUrl: 'https://cms.dmpcdn.com/travel/2020/08/20/a23f08f0-e2a6-11ea-9dda-d5a62082e005_original.jpg',
    mapLink: 'https://maps.app.goo.gl/isewyNMrNHNmEGeP9',
    time: 'เปิดให้เข้าชมตลอดทั้งวัน'
  }
])







</script>


<template>
    <UserLayout>





      <div class="bg-gradient-to-r from-blue-600 to-cyan-400 p-8 text-white">
      <h1 class="text-5xl font-extrabold text-center mb-10">เที่ยวภูเก็ต</h1>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <div 
          v-for="place in places" 
          :key="place.name" 
          class="bg-white rounded-lg shadow-xl overflow-hidden hover:shadow-2xl transition-transform transform hover:scale-105"
        >
          <img 
            :src="place.imageUrl" 
            alt="Image" 
            class="w-full h-64 object-cover transition duration-300 hover:scale-105"
          >
          <div class="p-6">
            <h2 class="text-2xl font-bold text-blue-600 mb-2">{{ place.name }}</h2>
            <p class="text-gray-600 font-semibold mb-4">{{ place.description }}</p>

            <div class="flex justify-between items-center">
              <a 
                :href="place.mapLink" 
                target="_blank" 
                class="btn btn-primary bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-bold transition duration-300"
              >
                ดูแผนที่
              </a>
              <span class="text-sm text-gray-500 font-semibold">{{ place.time }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>






        
    </UserLayout>
</template>