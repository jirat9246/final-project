<script setup>

import UserLayout from '/src/components/layouts/UserLayout.vue';
import { ref } from 'vue'




const places = ref([
  {
    name: 'เขื่อนเชี่ยวหลาน',
    description: 'เขื่อนเชี่ยวหลาน หรือ เขื่อนรัชชประภา พื้นที่ส่วนใหญ่ติดกับอุทยานแห่งชาติเขาสก มีธรรมชาติที่งดงามและสงบร่มรื่น',
    imageUrl: 'https://travel.mthai.com/app/uploads/2019/03/50011255_1969741456455844_1652341246678532096_n.jpg',
    mapLink: 'https://goo.gl/maps/8Z3At7DwAfJdZtRH6',
    time: 'เปิดให้เข้าชม: ตลอดวัน (ตามรอบเรือท่องเที่ยว)'
  },
  {
    name: 'เขาสามเกลอ',
    description: 'เขาสามเกลอ เป็นภูเขาหินกลางน้ำที่ตั้งอยู่ 3 ลูก กลางเขื่อนเชี่ยวหลาน ได้รับการขนานนามว่า กุ้ยหลินเมืองไทย',
    imageUrl: 'https://cms.dmpcdn.com/travel/2023/02/22/3332b350-b272-11ed-9e26-7d75362e85af_webp_original.jpg',
    mapLink: 'https://goo.gl/maps/KjubynNkvUqWeTgF9',
    time: 'เปิดให้เข้าชม: ตลอดวัน (ตามรอบเรือท่องเที่ยว)'
  },
  {
    name: 'ถ้ำปะการัง',
    description: 'ถ้ำปะการังเป็นสถานที่สุด Unseen ภายในเขาสก มีหินงอกหินย้อยที่แตกเป็นหน่อเล็ก ๆ คล้ายกับปะการังในทะเล',
    imageUrl: 'https://cms.dmpcdn.com/travel/2021/03/17/8486cfd0-86cc-11eb-a403-33d334b99f04_original.jpg',
    mapLink: 'https://goo.gl/maps/5i1FTfWkxUqv4quR7',
    time: 'เปิดให้เข้าชม: 06.00-18.00 น.'
  },
  {
    name: 'ป่าต้นน้ำ บ้านน้ำราด',
    description: 'ป่าต้นน้ำ บ้านน้ำราด เป็นสถานที่ท่องเที่ยว Unseen ของสุราษฎร์ธานี น้ำใสและเกิดขึ้นเองตามธรรมชาติ',
    imageUrl: 'https://cms.dmpcdn.com/travel/2021/04/05/995ef0e0-95fe-11eb-bea4-9b7a915c0478_original.jpg',
    mapLink: 'https://goo.gl/maps/m1ADUuK36sVMro5K8',
    time: 'เปิดให้เข้าชม: 08.00-18.00 น.'
  },
  {
    name: 'พระบรมธาตุไชยา',
    description: 'พระบรมธาตุไชยา วัดพระบรมธาตุไชยาราชวรวิหาร เป็นปูชนียสถานที่สำคัญและเป็นที่บรรจุพระบรมสารีริกธาตุ',
    imageUrl: 'https://cms.dmpcdn.com/travel/2020/12/24/1df4b210-45a8-11eb-9b6d-3fdf37c2e48e_original.jpg',
    mapLink: 'https://goo.gl/maps/WG7SuHbBFkTAVgew8',
    time: 'เปิดให้เข้าชม: 08.00-16.00 น.'
  }
])

</script>


<template>
    <UserLayout>




      <div class="bg-gradient-to-r from-green-600 to-teal-500 p-8 text-white">
      <h1 class="text-5xl font-extrabold text-center mb-10">เที่ยวสุราษฎร์ธานี</h1>

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
            <h2 class="text-2xl font-bold text-green-700 mb-2">{{ place.name }}</h2>
            <p class="text-gray-600 font-semibold mb-4">{{ place.description }}</p>

            <div class="flex justify-between items-center">
              <a 
                :href="place.mapLink" 
                target="_blank" 
                class="btn btn-primary bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-bold transition duration-300"
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



