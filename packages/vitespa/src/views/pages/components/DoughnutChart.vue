<template>
  <canvas id="doughnut-chart" class="chart-canvas" height="300"></canvas>
</template>

<script>
import Chart from "chart.js/auto";
export default {
  name: "bar-chart",
  mounted() {
    // Doughnut chart
    var ctx3 = document.getElementById("doughnut-chart").getContext("2d");

    new Chart(ctx3, {
      type: "doughnut",
      data: {
        labels: ["Creative Tim", "Github", "Bootsnipp", "Dev.to", "Codeinwp"],
        datasets: [
          {
            label: "Projects",
            weight: 9,
            cutout: 60,
            tension: 0.9,
            pointRadius: 2,
            borderWidth: 2,
            backgroundColor: [
              "#2152ff",
              "#3A416F",
              "#f53939",
              "#a8b8d8",
              "#cb0c9f",
            ],
            data: [15, 20, 12, 60, 20],
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
};
</script>
