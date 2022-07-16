<template>
  <div class="py-4 container-fluid">
    <div class="row">
      <div class="col-md-6">
        <h5 class="mb-0">Charts</h5>
        <p class="mb-0 text-sm">
          Charts on this page use Chart.js - Simple yet flexible JavaScript
          charting for designers & developers.
        </p>
      </div>
    </div>
    <div class="mt-4 row">
      <div class="col-md-6">
        <div class="card z-index-2">
          <div class="p-3 pb-0 card-header">
            <h6>Line chart</h6>
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
            <h6>Line chart with gradient</h6>
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
            <h6>Bar chart</h6>
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
            <h6>Bar chart horizontal</h6>
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
            <h6>Mixed chart</h6>
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
            <h6>Bubble chart</h6>
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
            <h6>Doughnut chart</h6>
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
            <h6>Pie chart</h6>
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
            <h6>Radar chart</h6>
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
            <h6>Polar chart</h6>
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
import LineChart from "./components/LineChart.vue";
import LineChartGradient from "./components/LineChartGradient.vue";
import BarChart from "./components/BarChart.vue";
import BarChartHorizontal from "./components/BarChartHorizontal.vue";
import MixedChart from "./components/MixedChart.vue";
import BubbleChart from "./components/BubbleChart.vue";
import DoughnutChart from "./components/DoughnutChart.vue";
import PieChart from "./components/PieChart.vue";
import RadarChart from "./components/RadarChart.vue";
import PolarChart from "./components/PolarChart.vue";

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
};
</script>
