<template>
  <canvas :id="id" class="chart-canvas" height="300"></canvas>
</template>

<script>
import Chart from "chart.js/auto";
export default {
  name: "DefaultLineChart",
  props: {
    id: {
      type: String,
      default: "chart-line",
    },
    title: {
      type: String,
      default: "Default Line Chart",
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
    var chart = document.getElementById(this.id).getContext("2d");

    var gradientStroke2 = chart.createLinearGradient(0, 230, 0, 50);

    gradientStroke2.addColorStop(1, "rgba(20,23,39,0.2)");
    gradientStroke2.addColorStop(0.2, "rgba(72,72,176,0.0)");
    gradientStroke2.addColorStop(0, "rgba(20,23,39,0)");

    let chartStatus = Chart.getChart(this.id);
    if (chartStatus != undefined) {
      chartStatus.destroy();
    }
    if (this.chart.datasets.length === 3) {
      new Chart(chart, {
        type: "line",
        data: {
          labels: this.chart.labels,
          datasets: [
            {
              label: this.chart.datasets[0].label,
              tension: 0.4,
              borderWidth: 0,
              pointRadius: 2,
              pointBackgroundColor: "#cb0c9f",
              borderColor: "#cb0c9f",
              // eslint-disable-next-line no-dupe-keys
              borderWidth: 3,
              backgroundColor: gradientStroke2,
              data: this.chart.datasets[0].data,
              maxBarThickness: 6,
            },
            {
              label: this.chart.datasets[1].label,
              tension: 0.4,
              borderWidth: 0,
              pointRadius: 2,
              pointBackgroundColor: "#3A416F",
              borderColor: "#3A416F",
              // eslint-disable-next-line no-dupe-keys
              borderWidth: 3,
              backgroundColor: gradientStroke2,
              data: this.chart.datasets[1].data,
              maxBarThickness: 6,
            },
            {
              label: this.chart.datasets[2].label,
              tension: 0.4,
              borderWidth: 0,
              pointRadius: 2,
              pointBackgroundColor: "#17c1e8",
              borderColor: "#17c1e8",
              // eslint-disable-next-line no-dupe-keys
              borderWidth: 3,
              backgroundColor: gradientStroke2,
              data: this.chart.datasets[2].data,
              maxBarThickness: 6,
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
            x: {
              grid: {
                drawBorder: false,
                display: true,
                drawOnChartArea: true,
                drawTicks: true,
                borderDash: [5, 5],
              },
              ticks: {
                display: true,
                color: "#9ca2b7",
                padding: 10,
              },
            },
          },
        },
      });
    } else if (this.chart.datasets.length === 2) {
      new Chart(chart, {
        type: "line",
        data: {
          labels: this.chart.labels,
          datasets: [
            {
              label: this.chart.datasets[0].label,
              tension: 0.4,
              borderWidth: 0,
              pointRadius: 2,
              pointBackgroundColor: "#cb0c9f",
              borderColor: "#cb0c9f",
              // eslint-disable-next-line no-dupe-keys
              borderWidth: 3,
              backgroundColor: gradientStroke2,
              data: this.chart.datasets[0].data,
              maxBarThickness: 6,
            },
            {
              label: this.chart.datasets[1].label,
              tension: 0.4,
              borderWidth: 0,
              pointRadius: 2,
              pointBackgroundColor: "#3A416F",
              borderColor: "#3A416F",
              // eslint-disable-next-line no-dupe-keys
              borderWidth: 3,
              backgroundColor: gradientStroke2,
              data: this.chart.datasets[1].data,
              maxBarThickness: 6,
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
            x: {
              grid: {
                drawBorder: false,
                display: true,
                drawOnChartArea: true,
                drawTicks: true,
                borderDash: [5, 5],
              },
              ticks: {
                display: true,
                color: "#9ca2b7",
                padding: 10,
              },
            },
          },
        },
      });
    } else if (this.chart.datasets.length === 1) {
      new Chart(chart, {
        type: "line",
        data: {
          labels: this.chart.labels,
          datasets: [
            {
              label: this.chart.datasets[0].label,
              tension: 0.4,
              borderWidth: 0,
              pointRadius: 2,
              pointBackgroundColor: "#cb0c9f",
              borderColor: "#cb0c9f",
              // eslint-disable-next-line no-dupe-keys
              borderWidth: 3,
              backgroundColor: gradientStroke2,
              data: this.chart.datasets[0].data,
              maxBarThickness: 6,
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
            x: {
              grid: {
                drawBorder: false,
                display: true,
                drawOnChartArea: true,
                drawTicks: true,
                borderDash: [5, 5],
              },
              ticks: {
                display: true,
                color: "#9ca2b7",
                padding: 10,
              },
            },
          },
        },
      });
    }
  },
};
</script>
