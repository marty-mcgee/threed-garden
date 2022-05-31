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
              <default-line-chart
                id="line-chart"
                title="Line chart"
                :chart="{
                  labels: [
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec',
                  ],
                  datasets: [
                    {
                      label: 'Organic Search',
                      data: [50, 40, 300, 220, 500, 250, 400, 230, 500],
                    },
                    {
                      label: 'Referral',
                      data: [30, 90, 40, 140, 290, 290, 340, 230, 400],
                    },
                    {
                      label: 'Direct',
                      data: [40, 80, 70, 90, 30, 90, 140, 130, 200],
                    },
                  ],
                }"
              />
            </div>
          </div>
        </div>
      </div>
      <div class="col-md-6 mt-md-0">
        <div class="card z-index-2">
          <gradient-line-chart
            id="chart-line"
            title="Line chart with gradient"
            :chart="{
              labels: [
                'Apr',
                'May',
                'Jun',
                'Jul',
                'Aug',
                'Sep',
                'Oct',
                'Nov',
                'Dec',
              ],
              datasets: [
                {
                  label: 'Mobile Apps',
                  data: [50, 40, 300, 220, 500, 250, 400, 230, 500],
                },
                {
                  label: 'Websites',
                  data: [30, 90, 40, 140, 290, 290, 340, 230, 400],
                },
              ],
            }"
          />
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
              <bar-chart
                :chart="{
                  labels: ['16-20', '21-25', '26-30', '31-36', '36-42', '42+'],
                  datasets: {
                    label: 'Sales by age',
                    data: [15, 20, 12, 60, 20, 15],
                  },
                }"
              />
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
              <bar-chart-horizontal
                :chart="{
                  labels: ['16-20', '21-25', '26-30', '31-36', '36-42', '42+'],
                  datasets: {
                    label: 'Sales by age',
                    data: [15, 20, 12, 60, 20, 15],
                  },
                }"
              />
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
              <mixed-chart
                :chart="{
                  labels: [
                    'Apr',
                    'May',
                    'Jun',
                    'Jul',
                    'Aug',
                    'Sep',
                    'Oct',
                    'Nov',
                    'Dec',
                  ],
                  datasets: [
                    {
                      label: 'Organic Search',
                      data: [50, 40, 300, 220, 500, 250, 400, 230, 500],
                    },
                    {
                      label: 'Referral',
                      data: [30, 90, 40, 140, 290, 290, 340, 230, 400],
                    },
                  ],
                }"
              />
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
              <bubble-chart
                :chart="{
                  labels: [
                    '0',
                    '10',
                    '20',
                    '30',
                    '40',
                    '50',
                    '60',
                    '70',
                    '80',
                    '90',
                  ],
                  datasets: [
                    {
                      label: 'Dataset 1',
                      data: [
                        {
                          x: 100,
                          y: 0,
                          r: 10,
                        },
                        {
                          x: 60,
                          y: 30,
                          r: 20,
                        },
                        {
                          x: 40,
                          y: 350,
                          r: 10,
                        },
                        {
                          x: 80,
                          y: 80,
                          r: 10,
                        },
                        {
                          x: 20,
                          y: 30,
                          r: 15,
                        },
                        {
                          x: 0,
                          y: 100,
                          r: 5,
                        },
                      ],
                    },
                    {
                      label: 'Dataset 2',
                      data: [
                        {
                          x: 70,
                          y: 40,
                          r: 10,
                        },
                        {
                          x: 30,
                          y: 60,
                          r: 20,
                        },
                        {
                          x: 10,
                          y: 300,
                          r: 25,
                        },
                        {
                          x: 60,
                          y: 200,
                          r: 10,
                        },
                        {
                          x: 50,
                          y: 300,
                          r: 15,
                        },
                        {
                          x: 20,
                          y: 350,
                          r: 5,
                        },
                      ],
                    },
                  ],
                }"
              />
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
              <doughnut-chart
                :chart="{
                  labels: [
                    'Creative Tim',
                    'Github',
                    'Bootsnipp',
                    'Dev.to',
                    'Codeinwp',
                  ],
                  datasets: {
                    label: 'Projects',
                    data: [15, 20, 12, 60, 20],
                  },
                }"
              />
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
              <pie-chart
                id="pie-chart-component"
                height="300"
                :chart="{
                  labels: ['Facebook', 'Direct', 'Organic', 'Referral'],
                  datasets: {
                    label: 'Projects',
                    data: [15, 20, 12, 60],
                  },
                }"
              />
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
              <radar-chart
                :chart="{
                  labels: [
                    'English',
                    'Maths',
                    'Physics',
                    'Chemistry',
                    'Biology',
                    'History',
                  ],
                  datasets: [
                    {
                      label: 'Stduent A',
                      data: [65, 75, 70, 80, 60, 80],
                    },
                    {
                      label: 'Stduent B',
                      data: [54, 65, 60, 70, 70, 75],
                    },
                  ],
                }"
              />
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
              <polar-chart
                :chart="{
                  labels: ['Red', 'Green', 'Yellow', 'Grey', 'Blue'],
                  datasets: {
                    label: 'My First Dataset',
                    data: [11, 16, 7, 3, 14],
                  },
                }"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import DefaultLineChart from "../../examples/Charts/DefaultLineChart.vue";
import GradientLineChart from "../../examples/Charts/GradientLineChart.vue";
import BarChart from "./components/BarChart.vue";
import BarChartHorizontal from "./components/BarChartHorizontal.vue";
import MixedChart from "./components/MixedChart.vue";
import BubbleChart from "./components/BubbleChart.vue";
import DoughnutChart from "./components/DoughnutChart.vue";
import PieChart from "@/examples/Charts/PieChart.vue";
import RadarChart from "./components/RadarChart.vue";
import PolarChart from "./components/PolarChart.vue";

export default {
  name: "Charts",
  components: {
    DefaultLineChart,
    GradientLineChart,
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
