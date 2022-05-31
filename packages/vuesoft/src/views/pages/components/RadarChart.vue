<template>
  <canvas :id="id" class="chart-canvas" :height="height"></canvas>
</template>

<script>
import Chart from "chart.js/auto";
export default {
  name: "RadarChart",
  props: {
    id: {
      type: String,
      default: "radar-chart",
    },
    height: {
      type: [String, Number],
      default: "100",
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
    // Radar chart
    var ctx = document.getElementById(this.id).getContext("2d");

    let chartStatus = Chart.getChart(this.id);
    if (chartStatus != undefined) {
      chartStatus.destroy();
    }

    new Chart(ctx, {
      type: "radar",
      data: {
        labels: this.chart.labels,
        datasets: [
          {
            label: this.chart.datasets[0].label,
            backgroundColor: "rgba(58,65,111,0.2)",
            data: this.chart.datasets[0].data,
            borderDash: [5, 5],
          },
          {
            label: this.chart.datasets[1].label,
            backgroundColor: "rgba(203,12,159,0.2)",
            data: this.chart.datasets[1].label,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
  },
};
</script>
