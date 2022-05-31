<template>
  <div class="overflow-hidden card">
    <div class="p-3 pb-0 card-header">
      <p class="mb-0 text-sm text-capitalize font-weight-bold">{{ title }}</p>
      <!-- eslint-disable vue/no-v-html -->
      <h5 class="mb-0 font-weight-bolder" v-html="description"></h5>
    </div>
    <div class="p-0 card-body">
      <div class="chart">
        <canvas :id="id" class="chart-canvas" :height="height"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from "chart.js/auto";
export default {
  name: "MiniGradientLineChart",
  props: {
    id: {
      type: String,
      default: "chart-line",
    },
    height: {
      type: [String, Number],
      default: "100",
    },
    title: {
      type: String,
      default: "Mini Gradient Line Chart",
    },
    description: {
      type: String,
      default: "",
    },
    chart: {
      type: Object,
      required: true,
      labels: Array,
      datasets: {
        type: Array,
        label: String,
        data: Array,
      },
    },
  },
  mounted() {
    var ctx2 = document.getElementById(this.id).getContext("2d");

    var gradientStroke1 = ctx2.createLinearGradient(0, 230, 0, 50);

    gradientStroke1.addColorStop(1, "rgba(203,12,159,0.02)");
    gradientStroke1.addColorStop(0.2, "rgba(72,72,176,0.0)");
    gradientStroke1.addColorStop(0, "rgba(203,12,159,0)");

    let chartStatus = Chart.getChart(this.id);
    if (chartStatus != undefined) {
      chartStatus.destroy();
    }
    new Chart(ctx2, {
      type: "line",
      data: {
        labels: this.chart.labels,
        datasets: [
          {
            label: this.chart.datasets.label,
            tension: 0.5,
            borderWidth: 0,
            pointRadius: 0,
            borderColor: "#cb0c9f",
            // eslint-disable-next-line no-dupe-keys
            borderWidth: 2,
            backgroundColor: gradientStroke1,
            data: this.chart.datasets[0].data,
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
              drawOnChartArea: true,
              drawTicks: false,
              borderDash: [5, 5],
            },
            ticks: {
              // eslint-disable-next-line no-unused-vars
              callback: function (value, index, values) {
                return "$" + value;
              },
              display: true,
              padding: 10,
              color: "#9ca2b7",
            },
          },
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
