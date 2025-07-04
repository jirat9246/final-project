<script setup>

import UserLayout from '/src/components/layouts/UserLayout.vue';

import { ref } from 'vue'

const places = ref([
  {
    name: 'วัดพระธาตุดอยสุเทพ',
    description: 'วัดพระธาตุดอยสุเทพ เป็นปูชนียสถานคู่เมืองเชียงใหม่ตั้งแต่โบราณ มีบันไดนาคเจ็ดเศียรและเจดีย์สีทองทรงเชียงแสน',
    imageUrl: 'https://www.dhakulchan.org/thecube/blog/wp-content/uploads/2021/04/%E0%B8%A7%E0%B8%B1%E0%B8%94%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%98%E0%B8%B2%E0%B8%95%E0%B8%B8%E0%B8%94%E0%B8%AD%E0%B8%A2%E0%B8%AA%E0%B8%B8%E0%B9%80%E0%B8%97%E0%B8%9E.jpg',
    mapLink: 'https://maps.app.goo.gl/xVRzVnF8acZrA5RWA',
    time: 'เปิด: 06.00-20.00 น.'
  },
  {
    name: 'ดอยอินทนนท์',
    description: 'ดอยอินทนนท์ ถือเป็นภูเขาที่สูงที่สุดในประเทศไทย สัมผัสธรรมชาติที่อ่างกาหลวงและพระมหาธาตุนภเมทนีดล',
    imageUrl: 'https://media.istockphoto.com/id/1359360154/th/%E0%B8%A3%E0%B8%B9%E0%B8%9B%E0%B8%96%E0%B9%88%E0%B8%B2%E0%B8%A2/%E0%B8%9E%E0%B8%A3%E0%B8%B0%E0%B8%AD%E0%B8%B2%E0%B8%97%E0%B8%B4%E0%B8%95%E0%B8%A2%E0%B9%8C%E0%B8%95%E0%B8%81%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B8%AA%E0%B8%A7%E0%B8%A2%E0%B8%87%E0%B8%B2%E0%B8%A1%E0%B8%97%E0%B8%B5%E0%B9%88%E0%B8%88%E0%B8%B8%E0%B8%94%E0%B8%8A%E0%B8%A1%E0%B8%A7%E0%B8%B4%E0%B8%A7%E0%B8%84%E0%B8%B4%E0%B8%A7%E0%B9%81%E0%B8%A1%E0%B9%88%E0%B8%9B%E0%B8%B2%E0%B8%99%E0%B9%83%E0%B8%99%E0%B8%94%E0%B8%AD%E0%B8%A2%E0%B8%AD%E0%B8%B4%E0%B8%99%E0%B8%97%E0%B8%99%E0%B8%99%E0%B8%97%E0%B9%8C-%E0%B9%80%E0%B8%8A%E0%B8%B5%E0%B8%A2%E0%B8%87%E0%B9%83%E0%B8%AB%E0%B8%A1%E0%B9%88-%E0%B8%9B%E0%B8%A3%E0%B8%B0%E0%B9%80%E0%B8%97%E0%B8%A8%E0%B9%84%E0%B8%97%E0%B8%A2.jpg?s=612x612&w=0&k=20&c=YjIzMrYlP6UkS_31mo4iyowxxFIAJlymWyr5VwXNWCk=',
    mapLink: 'https://maps.app.goo.gl/GoqQTrsmwui7kqBE9',
    time: 'เปิด: 05.00-18.00 น.'
  },
  {
    name: 'ประตูท่าแพ',
    description: 'ประตูท่าแพเป็นประตูเมืองที่ตั้งอยู่ทางทิศตะวันออกของเมืองเชียงใหม่ เป็นจุดเริ่มต้นของถนนคนเดินท่าแพ',
    imageUrl: 'https://roijang.com/wp-content/uploads/2023/08/shutterstock_2230075667.jpg',
    mapLink: 'https://maps.app.goo.gl/wo8KinkKZyQTqsHz5',
    time: 'เปิดตลอดวัน'
  },
  {
    name: 'ถนนคนเดินท่าแพ',
    description: 'ถนนคนเดินท่าแพ เป็นตลาดที่เต็มไปด้วยร้านค้าต่างๆ ทั้งอาหาร เสื้อผ้า สินค้าพื้นเมือง และของที่ระลึก',
    imageUrl: 'https://f.tpkcdn.com/review-source/42de8397-8cce-8211-e115-56406ae074b9.JPG',
    mapLink: 'https://goo.gl/maps/zZa4q5Z5uVhpcwd96',
    time: 'เปิด: อาทิตย์ 18.00-22.00 น.'
  },
  {
    name: 'ถนนนิมมานเหมินทร์',
    description: 'ถนนนิมมานเหมินทร์ เป็นถนนที่คึกคัก มีทั้งร้านกาแฟ คาเฟ่ ร้านค้า และร้านขายของตกแต่งบ้าน',
    imageUrl: 'https://www.paikanbor.com/wp-content/uploads/2016/08/%E0%B8%9B%E0%B8%81-7.jpg',
    mapLink: 'https://maps.app.goo.gl/6dxtog5RsueUJS6h6',
    time: 'เวลาเปิด-ปิดแตกต่างกันไป'
  },
  {
    name: 'ม่อนแจ่ม',
    description: 'ม่อนแจ่ม เป็นสถานที่ท่องเที่ยวที่มีวิวทิวทัศน์สวยงามของภูเขา และมีอากาศเย็นตลอดปี',
    imageUrl: 'https://cms.dmpcdn.com/travel/2019/10/17/f776c490-f0ba-11e9-bec9-8d0a1e54ca62_original.JPG',
    mapLink: 'https://maps.app.goo.gl/RzmDkMxea18DswqD7',
    time: 'เปิด: 06.00-18.00 น.'
  }
])

</script>


<template>
    <UserLayout>






        <div class="bg-gradient-to-r from-purple-700 to-pink-500 p-8 text-white">
  <h1 class="text-5xl font-extrabold text-center mb-10">เที่ยวเชียงใหม่</h1>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
    <div 
      v-for="place in places" 
      :key="place.name" 
      class="bg-white rounded-lg shadow-xl overflow-hidden hover:shadow-2xl transition duration-300"
    >
      <img 
        :src="place.imageUrl" 
        alt="Image" 
        class="w-full h-64 object-cover transition duration-300 hover:scale-105"
      >

      <div class="p-6">
        <!-- เพิ่ม font-bold ให้ชื่อสถานที่ -->
        <h2 class="text-2xl font-bold text-purple-700 mb-2">{{ place.name }}</h2>

        <!-- เพิ่ม font-semibold ให้คำอธิบาย -->
        <p class="text-gray-600 font-semibold mb-4">{{ place.description }}</p>

        <div class="flex justify-between items-center">
          <a 
            :href="place.mapLink" 
            target="_blank" 
            class="btn btn-primary bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-bold transition duration-300"
          >
            ดูแผนที่
          </a>
          <!-- เพิ่ม font-semibold ให้เวลาเปิดปิด -->
          <span class="text-sm text-gray-500 font-semibold">{{ place.time }}</span>
        </div>
      </div>
    </div>
  </div>
</div>






        
    </UserLayout>
</template>



