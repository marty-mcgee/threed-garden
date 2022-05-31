<template>
  <div class="overflow-hidden card">
    <div class="p-3 pb-0 card-header">
      <div class="d-flex align-items-center">
        <div
          class="text-center shadow icon icon-shape border-radius-md bg-gradient-success"
        >
          <i
            class="text-lg ni opacity-10"
            :class="`ni-${icon}`"
            aria-hidden="true"
          ></i>
        </div>
        <div :class="isRTL ? 'me-3' : 'ms-3'">
          <p class="mb-0 text-sm text-capitalize font-weight-bold">
            {{ title }}
          </p>
          <h5 class="mb-0 font-weight-bolder">{{ count }}</h5>
        </div>
        <div
          class="progress-wrapper w-25"
          :class="isRTL ? 'me-auto' : 'ms-auto'"
        >
          <div class="progress-info">
            <div class="progress-j">
              <span class="text-xs font-weight-bold">{{ progress }}%</span>
            </div>
          </div>
          <div class="progress">
            <div
              class="progress-bar bg-success"
              :class="`w-${progress}`"
              role="progressbar"
              :aria-valuenow="progress"
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      </div>
    </div>
    <div class="p-0 mt-3 card-body">
      <div class="chart">
        <canvas :id="id" class="chart-canvas" :height="height"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from "chart.js/auto";
import { mapState } from "vuex";
export default {
  name: "ProgressLineChart",
  props: {
    id: {
      type: String,
      default: "progress-line-chart",
    },
    height: {
      type: String,
      default: "100",
    },
    icon: {
      type: String,
      default: "calendar-grid-58",
    },
    title: {
      type: String,
      default: "Tasks",
    },
    count: {
      type: Number,
      default: 0,
    },
    progress: {
      type: Number,
      default: 0,
    },
    chart: {
      type: Object,
      required: true,
      labels: Array,
      data: Array,
    },
  },
  computed: {
    ...mapState(["isRTL"]),
  },
  mounted() {
    var ctx = document.getElementById(this.id).getContext("2d");

    var gradientStroke1 = ctx.createLinearGradient(0, 230, 0, 50);

    gradientStroke1.addColorStop(1, "rgba(33,82,255,0.1)");

    let chartStatus = Chart.getChart(this.id);
    if (chartStatus != undefined) {
      chartStatus.destroy();
    }
    new Chart(ctx, {
      type: "line",
      data: {
        labels: this.chart.labels,
        datasets: [
          {
            label: "Tasks",
            tension: 0.3,
            pointRadius: 2,
            pointBackgroundColor: "#82d616",
            borderColor: "#82d616",
            borderWidth: 2,
            backgroundColor: gradientStroke1,
            data: this.chart.data,
            maxBarThickness: 6,
            fill: true,
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
              color: "#252f40",
              padding: 10,
            },
          },
          // eslint-disable-next-line no-dupe-keys
          y: {
            grid: {
              drawBorder: false,
              display: false,
              drawOnChartArea: true,
              drawTicks: false,
              borderDash: [5, 5],
            },
            ticks: {
              display: true,
              padding: 10,
              color: "#9ca2b7",
            },
          },
          // eslint-disable-next-line no-dupe-keys
          x: {
            grid: {
              drawBorder: false,
              display: true,
              drawOnChartArea: true,
              drawTicks: false,
              borderDash: [5, 5],
            },
            ticks: {
              display: true,
              padding: 10,
              color: "#9ca2b7",
            },
          },
        },
      },
    });
  },
};
</script>
