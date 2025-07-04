<script setup>
import AdminLayout from "/src/components/layouts/AdminLayout.vue";
import { ref, onMounted, watch } from "vue";
import { useDashboardStore } from "/src/stores/admin/dashboard"; 
import ApexCharts from 'vue3-apexcharts';

// Current year and next 5 years for the bar chart
const startYear = 2024;
const next5Years = Array.from({ length: 5 }, (v, i) => startYear + i);

// Bar chart for registration data over the next 5 years
const priceChart = ref({
  options: {
    chart: {
      id: "vuechart-example",
      responsive: [
        {
          breakpoint: 1000,
          options: {
            chart: {
              width: "100%",
            },
            legend: {
              position: "bottom",
            },
          },
        },
      ],
    },
    xaxis: {
      categories: next5Years,
    },
    yaxis: {
      min: 0,
      max: 200,
      tickAmount: 4,
      labels: {
        formatter: function (val) {
          return Math.round(val);
        },
      },
    },
  },
  series: [
    {
      name: "Registrations",
      data: [0, 0, 0, 0, 0],
    },
  ],
});

// Donut chart for user-guide distribution
const categoryChart = ref({
  options: {
    chart: {
      type: "donut",
      width: 250,
    },
    labels: ["Users", "Guides"],
  },
  series: [0, 0],
});

// Store of the Dashboard
const dashboardStore = useDashboardStore();

// Fetch data from the store when the component is mounted
onMounted(async () => {
  await dashboardStore.fetchDashboardData();

  priceChart.value.series[0].data = dashboardStore.registrationData;

  categoryChart.value.series = [dashboardStore.users, dashboardStore.guides];
});

// Watch for changes in the store and update local refs
watch(
  () => dashboardStore.registrationData,
  (newVal) => {
    priceChart.value.series[0].data = newVal;
  }
);

watch(
  () => dashboardStore.guides,
  (newVal) => {
    categoryChart.value.series[1] = newVal;
  }
);

watch(
  () => dashboardStore.users,
  (newVal) => {
    categoryChart.value.series[0] = newVal;
  }
);

watch(
  () => dashboardStore.newRegisters,
  (newVal) => {
    // Update the stat display for New Registers
    newRegisterCount.value = newVal;
  }
);

const newRegisterCount = ref(dashboardStore.newRegisters);

</script>

<template>
  <AdminLayout>
    <div class="text-4xl font-extrabold text-indigo-700 my-6 tracking-wide text-left">
      Dashboard
    </div>

    <!-- Statistics section -->
    <div class="stats w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl text-white shadow-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
      <!-- Card for Guides -->
      <div class="stat flex items-center justify-between p-4 bg-white rounded-2xl shadow-lg text-gray-800 transition-all duration-300 hover:shadow-2xl transform hover:scale-105">
        <div>
          <div class="stat-title text-xl font-semibold">Guides</div>
          <div class="stat-value text-4xl font-extrabold text-indigo-600">{{ dashboardStore.getGuideCount }}</div> 
        </div>
        <div class="text-indigo-600 text-5xl">👨‍✈️</div>
      </div>

      <!-- Card for Users -->
      <div class="stat flex items-center justify-between p-4 bg-white rounded-2xl shadow-lg text-gray-800 transition-all duration-300 hover:shadow-2xl transform hover:scale-105">
        <div>
          <div class="stat-title text-xl font-semibold">Users</div>
          <div class="stat-value text-4xl font-extrabold text-purple-600">{{ dashboardStore.getUserCount }}</div> 
        </div>
        <div class="text-purple-600 text-5xl">👥</div>
      </div>

      <!-- Card for New Registers -->
      <div class="stat flex items-center justify-between p-4 bg-white rounded-2xl shadow-lg text-gray-800 transition-all duration-300 hover:shadow-2xl transform hover:scale-105">
        <div>
          <div class="stat-title text-xl font-semibold">New Registers</div>
          <div class="stat-value text-4xl font-extrabold text-pink-600">{{ newRegisterCount }}</div> 
        </div>
        <div class="text-pink-600 text-5xl">📝</div>
      </div>
    </div>

    <!-- Chart section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
      <!-- Bar Chart -->
      <div class="p-4 bg-white rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl transform hover:scale-105">
        <apexchart
          type="bar"
          width="100%"
          :options="priceChart.options"
          :series="priceChart.series"
        ></apexchart>
      </div>

      <!-- Donut Chart -->
      <div class="p-4 bg-white rounded-2xl shadow-lg transition-all duration-300 hover:shadow-2xl transform hover:scale-105">
        <apexchart 
          type="donut" 
          :options="categoryChart.options" 
          :series="categoryChart.series"
        ></apexchart>
      </div>
    </div>
  </AdminLayout>
</template>
