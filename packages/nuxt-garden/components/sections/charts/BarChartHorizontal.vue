<template>
  <canvas id="bar-chart-horizontal" class="chart-canvas" height="300"></canvas>
</template>

<script>
// import Chart from "chart.js/auto";
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default {
  name: "BarChart",
  mounted() {
    // Bar chart horizontal
    var ctx6 = document.getElementById("bar-chart-horizontal").getContext("2d");

    new Chart(ctx6, {
      type: "bar",
      data: {
        labels: ["16-20", "21-25", "26-30", "31-36", "36-42", "42+"],
        datasets: [
          {
            label: "Sales by age",
            weight: 5,
            borderWidth: 0,
            borderRadius: 4,
            backgroundColor: "#3A416F",
            data: [15, 20, 12, 60, 20, 15],
            fill: false,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
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
              display: false,
              drawOnChartArea: true,
              drawTicks: true,
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
  },
};
</script>
