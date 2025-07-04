<script setup>

import UserLayout from '/src/components/layouts/UserLayout.vue';
import { ref } from 'vue'







const places = ref([
  {
    name: 'เนินนางพญา',
    description: 'จุดชมวิวริมทะเลที่มีทิวทัศน์สวยงาม พร้อมทางจักรยานและกิจกรรมคล้องกุญแจคู่รัก',
    imageUrl: 'https://cms.dmpcdn.com/travel/2020/06/26/6c16e950-b77c-11ea-8fac-236a281cd6c5_original.jpg',
    mapLink: 'https://goo.gl/maps/7zCK9WyZuoMkgSJY7',
    time: 'เปิดให้เข้าชมตลอดทั้งวัน'
  },
  {
    name: 'หาดคุ้งวิมาน',
    description: 'ที่เที่ยวที่เหมาะสำหรับการพักผ่อนในทริปสั้นๆ บรรยากาศเงียบสงบ วิวทิวทัศน์สวยงาม มีร้านค้าและร้านอาหารซีฟู้ดให้บริการ',
    imageUrl: 'https://img.freepik.com/premium-photo/nang-phaya-hill-scenic-point-landmark-chanthaburi-province_38068-16.jpg?w=826',
    mapLink: 'https://maps.app.goo.gl/qiUm1LxrRLUnJYA67',
    time: 'เปิดให้เข้าชมตลอดทั้งวัน'
  },
  {
    name: 'หาดเจ้าหลาว',
    description: 'ชายหาดยอดนิยมสำหรับการพักผ่อน มีหาดทรายสีแดงสวยงาม และกิจกรรมทางทะเลหลากหลาย',
    imageUrl: 'https://static.thairath.co.th/media/Dtbezn3nNUxytg04aiKT7kFK7PScpCyYlbbIEh450zS91f.webp',
    mapLink: 'https://maps.app.goo.gl/hcrz5PXTBrxGKzfq6',
    time: 'เปิดให้เข้าชมตลอดทั้งวัน'
  },
  {
    name: 'น้ำตกพลิ้ว',
    description: 'น้ำตกขนาดกลางที่ตั้งอยู่ในอุทยานแห่งชาติน้ำตกพลิ้ว น้ำใสไหลเย็นตลอดปี และสามารถลงเล่นน้ำได้',
    imageUrl: 'https://cms.dmpcdn.com/travel/2021/05/25/a4698100-bd16-11eb-95c5-c1104c9a1c2b_original.jpg',
    mapLink: 'https://maps.app.goo.gl/fvPFrW1KXYCJLm169',
    time: 'เปิด: 08.30-16.30 น.'
  },
  {
    name: 'เขาคิชฌกูฏ',
    description: 'ที่เที่ยวสายบุญ มีงานนมัสการรอยพระบาทเขาคิชฌกูฏ จัดขึ้นทุกปีในช่วงเดือนมกราคม-มีนาคม',
    imageUrl: 'https://cms.dmpcdn.com/travel/2022/12/21/3684ac70-80f9-11ed-9c99-d560c50e9ffe_webp_original.jpg',
    mapLink: 'https://maps.app.goo.gl/JtyQRAQNgRLmavjd6',
    time: 'เปิด: 10 กุมภาพันธ์ - 9 เมษายน 2567'
  },
  {
    name: 'แกรนด์แคนยอน จันทบุรี',
    description: 'สถานที่เที่ยวลับ สวยงามและอันซีนของจันทบุรี มีวิวที่ไม่เหมือนใครและเหมาะสำหรับการถ่ายรูป',
    imageUrl: 'https://scontent.fkdt1-1.fna.fbcdn.net/v/t1.6435-9/56526756_2396010943782070_119185089060929536_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=13d280&_nc_eui2=AeGMwyxx3vwM-tWb16uR3ht-eYKy9E_9CtR5grL0T_0K1Psze3Rj2BBFd32YdJrW4IBqoqRAcgjZGRIVYGEkT4vD&_nc_ohc=EWd6Z2yx-SoQ7kNvgGjzLEO&_nc_zt=23&_nc_ht=scontent.fkdt1-1.fna&_nc_gid=AznKd6zOWCmzxc1j5bqDXn3&oh=00_AYAx_EwN7zWuaaVwN2AjQd-TTDeBYrLlXcBNUGanfSjgqQ&oe=67492D9F',
    mapLink: 'https://maps.app.goo.gl/v2KCeMbLGtvaqxMV6',
    time: 'เปิดให้เข้าชมตลอดทั้งวัน'
  }
 
])








</script>


<template>
    <UserLayout>




        <div class="bg-gradient-to-r from-green-500 to-blue-500 p-8 text-white">
      <h1 class="text-5xl font-extrabold text-center mb-10">เที่ยวจันทบุรี</h1>

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