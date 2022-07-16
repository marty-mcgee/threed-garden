<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <div class="col-md-6">
        <h5 class="mb-0">Charts</h5>
        <p class="mb-0 text-sm">
          Charts using Chart.js
        </p>
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-md-6">
        <div class="card z-index-2">
          <div class="p-3 pb-0 card-header">
            <h6>Line Chart</h6>
          </div>
          <div class="p-3 card-body">
            <div class="chart">
              <line-chart />
            </div>
          </div>
        </div>
      </div>
      <div class="mt-4 col-md-6 mt-md-0">
        <div class="card z-index-2">
          <div class="p-3 pb-0 card-header">
            <h6>Line Chart with Gradient</h6>
          </div>
          <div class="p-3 card-body">
            <div class="chart">
              <line-chart-gradient />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-md-6">
        <div class="card z-index-2">
          <div class="p-3 pb-0 card-header">
            <h6>Bar Chart: Vertical</h6>
          </div>
          <div class="p-3 card-body">
            <div class="chart">
              <bar-chart />
            </div>
          </div>
        </div>
      </div>
      <div class="mt-4 col-md-6 mt-md-0">
        <div class="card z-index-2">
          <div class="p-3 pb-0 card-header">
            <h6>Bar Chart: Horizontal</h6>
          </div>
          <div class="p-3 card-body">
            <div class="chart">
              <bar-chart-horizontal />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-md-6">
        <div class="card z-index-2">
          <div class="p-3 pb-0 card-header">
            <h6>Mixed Chart</h6>
          </div>
          <div class="p-3 card-body">
            <div class="chart">
              <mixed-chart />
            </div>
          </div>
        </div>
      </div>
      <div class="mt-4 col-md-6 mt-md-0">
        <div class="card z-index-2">
          <div class="p-3 pb-0 card-header">
            <h6>Bubble Chart</h6>
          </div>
          <div class="p-3 card-body">
            <div class="chart">
              <bubble-chart />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-md-6">
        <div class="card z-index-2">
          <div class="p-3 pb-0 card-header">
            <h6>Doughnut Chart</h6>
          </div>
          <div class="p-3 card-body">
            <div class="chart">
              <doughnut-chart />
            </div>
          </div>
        </div>
      </div>
      <div class="mt-4 col-md-6 mt-md-0">
        <div class="card z-index-2">
          <div class="p-3 pb-0 card-header">
            <h6>Pie Chart</h6>
          </div>
          <div class="p-3 card-body">
            <div class="chart">
              <pie-chart />
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-md-6">
        <div class="card z-index-2">
          <div class="p-3 pb-0 card-header">
            <h6>Radar Chart</h6>
          </div>
          <div class="p-5 card-body">
            <div class="chart">
              <radar-chart />
            </div>
          </div>
        </div>
      </div>
      <div class="mt-4 col-md-6 mt-md-0">
        <div class="card z-index-2">
          <div class="p-3 pb-0 card-header">
            <h6>Polar Chart</h6>
          </div>
          <div class="p-5 card-body">
            <div class="chart">
              <polar-chart />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import LineChart from "@/components/sections/charts/LineChart.vue"
import LineChartGradient from "@/components/sections/charts/LineChartGradient.vue"
import BarChart from "@/components/sections/charts/BarChart.vue"
import BarChartHorizontal from "@/components/sections/charts/BarChartHorizontal.vue"
import MixedChart from "@/components/sections/charts/MixedChart.vue"
import BubbleChart from "@/components/sections/charts/BubbleChart.vue"
import DoughnutChart from "@/components/sections/charts/DoughnutChart.vue"
import PieChart from "@/components/sections/charts/PieChart.vue"
import RadarChart from "@/components/sections/charts/RadarChart.vue"
import PolarChart from "@/components/sections/charts/PolarChart.vue"

export default {
  name: "Charts",
  components: {
    LineChart,
    LineChartGradient,
    BarChart,
    BarChartHorizontal,
    MixedChart,
    BubbleChart,
    DoughnutChart,
    PieChart,
    RadarChart,
    PolarChart,
  },
}
</script>
