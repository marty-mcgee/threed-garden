<template>
  <canvas id="polar-chart" class="chart-canvas" height="100"></canvas>
</template>

<script>
import Chart from "chart.js/auto";
export default {
  name: "BarChart",
  mounted() {
    // Radar chart
    var ctx10 = document.getElementById("polar-chart").getContext("2d");

    new Chart(ctx10, {
      type: "polarArea",
      data: {
        labels: ["Red", "Green", "Yellow", "Grey", "Blue"],
        datasets: [
          {
            label: "My First Dataset",
            data: [11, 16, 7, 3, 14],
            backgroundColor: [
              "#17c1e8",
              "#cb0c9f",
              "#3A416F",
              "#a8b8d8",
              "#82d616",
            ],
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
