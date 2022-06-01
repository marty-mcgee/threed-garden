<template>
  <div class="card overflow-hidden">
    <div class="card-header p-3 pb-0">
      <p class="text-sm mb-0 text-capitalize font-weight-bold">{{ title }}</p>
      <h5 class="font-weight-bolder mb-0">
        97
        <span class="text-success text-sm font-weight-bolder">+5%</span>
      </h5>
    </div>
    <div class="card-body p-0">
      <div class="chart">
        <canvas id="chart-widgets-1" class="chart-canvas" height="100"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from "chart.js/auto";

export default {
  name: "CaloriesChart",
  props: {
    title: {
      type: String,
      default: "Calories",
    },
  },
  mounted() {
    var ctx1 = document.getElementById("chart-widgets-1").getContext("2d");

    var gradientStroke1 = ctx1.createLinearGradient(0, 230, 0, 50);

    gradientStroke1.addColorStop(1, "rgba(203,12,159,0.02)");
    gradientStroke1.addColorStop(0.2, "rgba(72,72,176,0.0)");
    gradientStroke1.addColorStop(0, "rgba(203,12,159,0)"); //purple colors

    new Chart(ctx1, {
      type: "line",
      data: {
        labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        datasets: [
          {
            label: "Calories",
            tension: 0.5,
            borderWidth: 0,
            pointRadius: 0,
            borderColor: "#252f40",
            backgroundColor: gradientStroke1,
            data: [50, 45, 60, 60, 80, 65, 90, 80, 100],
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
              display: false,
            },
          },
        },
      },
    });
  },
};
</script>
