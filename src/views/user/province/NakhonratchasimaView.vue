<script setup>

import UserLayout from '/src/components/layouts/UserLayout.vue';
import { ref } from 'vue'

const places = ref([
  {
    name: 'วัดศาลาลอย',
    description: 'วัดเก่าแก่คู่บ้านคู่เมืองโคราช มีอายุกว่า 200 ปี สร้างขึ้นโดยท้าวสุรนารี',
    imageUrl: 'https://cms.dmpcdn.com/travel/2019/12/26/e0ad3d90-27c2-11ea-96b9-fb57831f8879_original.JPG',
    mapLink: 'https://maps.app.goo.gl/dkvY6Wm1HHK6caY98',
    time: 'เปิด: 08.00-18.00 น.'
  },
  {
    name: 'จุดชมวิว กังหันลม เขายายเที่ยง',
    description: 'จุดชมวิวพร้อมกังหันลมขนาดใหญ่ อยู่บริเวณอ่างเก็บน้ำ เหมาะสำหรับการถ่ายรูปและปั่นจักรยาน',
    imageUrl: 'https://cms.dmpcdn.com/travel/2021/03/04/3fcbe130-7cab-11eb-831f-95001ff398fc_original.jpg',
    mapLink: 'https://maps.app.goo.gl/6URyi1tnRyw3guD67',
    time: 'เปิด: 08.00-18.00 น.'
  },
  {
    name: 'วิหารเทพวิทยาคม',
    description: 'อุทยานธรรมกลางบึงน้ำที่สวยงาม อุทิศให้หลวงพ่อคูณ เป็นมหาวิหารแห่งพระไตรปิฎก',
    imageUrl: 'https://static.wixstatic.com/media/d6b0a9_88ea904b80a443e39ab130eb69b78f74~mv2.jpg/v1/fill/w_640,h_400,al_c,q_80,usm_0.66_1.00_0.01,enc_auto/d6b0a9_88ea904b80a443e39ab130eb69b78f74~mv2.jpg',
    mapLink: 'https://maps.app.goo.gl/NsbGed8JnAHtAcVWA',
    time: 'เปิด: 08.30-17.00 น.'
  },
  {
    name: 'ทุ่งทานตะวัน ไร่มณีศร',
    description: 'ทุ่งดอกทานตะวันและดอกไม้อื่น ๆ ที่บานสะพรั่งในช่วงหน้าหนาว',
    imageUrl: 'https://mpics.mgronline.com/pics/Images/564000012363002.JPEG',
    mapLink: 'https://maps.app.goo.gl/aFsocyTCueR8rvkJA',
    time: 'เปิด: 06.00-18.00 น.'
  },
  {
    name: 'ผาเก็บตะวัน',
    description: 'จุดชมพระอาทิตย์ขึ้นพร้อมกิจกรรมปลูกป่า ยิงเมล็ดพันธุ์ข้ามผา เพื่อสร้างป่า',
    imageUrl: 'https://cms.dmpcdn.com/travel/2019/10/18/00b778d0-f181-11e9-863e-c117c6e9f994_original.JPG',
    mapLink: 'https://maps.app.goo.gl/bvgE4rS9fNr5cw2y7',
    time: 'เปิด: 06.00-18.00 น.'
  },
  {
    name: 'อุทยานแห่งชาติเขาใหญ่',
    description: 'แหล่งท่องเที่ยวธรรมชาติใกล้กรุงเทพฯ ที่สามารถเดินป่า เที่ยวน้ำตก และส่องสัตว์ได้',
    imageUrl: 'https://cms.dmpcdn.com/travel/2022/11/15/69446770-64cc-11ed-9c82-6d61ce48bf9a_webp_original.jpg',
    mapLink: 'https://maps.app.goo.gl/58rwMu1QMHbLQDtj9',
    time: 'เปิด: 06.00-18.00 น.'
  }
])


</script>


<template>
    <UserLayout>





        <div class="bg-gradient-to-r from-green-500 to-yellow-400 p-8 text-white">
      <h1 class="text-5xl font-extrabold text-center mb-10">เที่ยวโคราช</h1>

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
                class="btn btn-primary bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-bold transition duration-300"
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