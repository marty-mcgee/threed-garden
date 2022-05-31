<template>
  <div class="mt-4 overflow-hidden card">
    <div class="p-3 card-body">
      <div class="row">
        <div class="col-lg-5">
          <div class="d-flex">
            <div
              class="text-center shadow icon icon-shape bg-gradient-success border-radius-md"
            >
              <i
                class="text-lg ni opacity-10"
                :class="`ni-${icon}`"
                aria-hidden="true"
              ></i>
            </div>
            <div class="ms-3">
              <p class="mb-0 text-sm text-capitalize font-weight-bold">
                {{ title }}
              </p>
              <h5 class="mb-0 font-weight-bolder">{{ count }}</h5>
            </div>
          </div>
          <span
            v-for="({ label, isCompleted }, index) of chart.labels"
            :key="index"
            class="pb-0 mt-3 badge badge-dot d-block text-start"
          >
            <i
              :class="
                isCompleted ? 'bg-gradient-success' : 'bg-gradient-secondary'
              "
            ></i>
            <span class="text-xs text-muted font-weight-bold">{{ label }}</span>
          </span>
        </div>
        <div class="my-auto col-lg-7">
          <div class="chart ms-auto">
            <canvas :id="id" class="chart-canvas" :height="height"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from "chart.js/auto";
export default {
  name: "ProgressDoughnutChart",
  props: {
    id: {
      type: String,
      default: "progress-doughnut-chart",
    },
    icon: {
      type: String,
      default: "delivery-fast",
    },
    height: {
      type: String,
      default: "150",
    },
    title: {
      type: String,
      default: "Progress Doughnut Chart",
    },
    count: {
      type: Number,
      default: 0,
    },
    chart: {
      type: Object,
      required: true,
      lables: {
        type: Array,
        label: String,
        isCompleted: Boolean,
      },
      datasets: {
        type: Object,
        label: String,
        data: Array,
      },
      default: () => {},
    },
  },
  mounted() {
    var ctx1 = document.getElementById(this.id).getContext("2d");

    var gradientStroke1 = ctx1.createLinearGradient(0, 230, 0, 50);

    gradientStroke1.addColorStop(1, "rgba(33,82,255,0.1)");
    gradientStroke1.addColorStop(0.2, "rgba(33,82,255,0.0)");
    gradientStroke1.addColorStop(0, "rgba(33,82,255,0)");

    let chartStatus = Chart.getChart(this.id);
    if (chartStatus != undefined) {
      chartStatus.destroy();
    }
    new Chart(ctx1, {
      type: "doughnut",
      data: {
        labels: this.chart.labels.map(this.getLabels),
        datasets: [
          {
            label: "Projects",
            weight: 9,
            cutout: 50,
            tension: 0.9,
            pointRadius: 2,
            borderWidth: 2,
            backgroundColor: ["#82d616", "#a8b8d8"],
            data: this.chart.datasets.data,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
        scales: {
          y: {
            grid: {
              drawBorder: false,
              display: false,
              drawOnChartArea: false,
              drawTicks: false,
            },
            ticks: {
              display: false,
            },
          },
          x: {
            grid: {
              drawBorder: false,
              display: false,
              drawOnChartArea: false,
              drawTicks: false,
            },
            ticks: {
              display: false,
            },
          },
        },
      },
    });
  },
  methods: {
    getLabels(item) {
      return [item.label];
    },
  },
};
</script>
