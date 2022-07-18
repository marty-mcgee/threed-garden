<template>
  <canvas id="mixed-chart" class="chart-canvas" height="300"></canvas>
</template>

<script>
// import Chart from "chart.js/auto";
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default {
  name: "BarChart",
  mounted() {
    // Mixed chart
    var ctx7 = document.getElementById("mixed-chart").getContext("2d");

    var gradientStroke1 = ctx7.createLinearGradient(0, 230, 0, 50);

    gradientStroke1.addColorStop(1, "rgba(203,12,159,0.2)");
    gradientStroke1.addColorStop(0.2, "rgba(72,72,176,0.0)");
    gradientStroke1.addColorStop(0, "rgba(203,12,159,0)"); //purple colors

    new Chart(ctx7, {
      data: {
        labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        datasets: [
          {
            type: "bar",
            label: "Organic Search",
            weight: 5,
            tension: 0.4,
            borderWidth: 0,
            pointBackgroundColor: "#3A416F",
            borderColor: "#3A416F",
            backgroundColor: "#3A416F",
            borderRadius: 4,
            borderSkipped: false,
            data: [50, 40, 300, 220, 500, 250, 400, 230, 500],
            maxBarThickness: 10,
          },
          {
            type: "line",
            label: "Referral",
            tension: 0.4,
            borderWidth: 0,
            pointRadius: 0,
            pointBackgroundColor: "#cb0c9f",
            borderColor: "#cb0c9f",
            // eslint-disable-next-line no-dupe-keys
            borderWidth: 3,
            backgroundColor: gradientStroke1,
            data: [30, 90, 40, 140, 290, 290, 340, 230, 400],
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
              display: true,
              drawOnChartArea: true,
              drawTicks: false,
              borderDash: [5, 5],
            },
            ticks: {
              display: true,
              padding: 10,
              color: "#b2b9bf",
              font: {
                size: 11,
                family: "Open Sans",
                style: "normal",
                lineHeight: 2,
              },
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
              color: "#b2b9bf",
              padding: 10,
              font: {
                size: 11,
                family: "Open Sans",
                style: "normal",
                lineHeight: 2,
              },
            },
          },
        },
      },
    });
  },
};
</script>
