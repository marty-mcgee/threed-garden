<template>
  <canvas id="radar-chart" class="chart-canvas" height="100"></canvas>
</template>

<script>
import Chart from "chart.js/auto";
export default {
  name: "BarChart",
  mounted() {
    // Radar chart
    var ctx9 = document.getElementById("radar-chart").getContext("2d");

    new Chart(ctx9, {
      type: "radar",
      data: {
        labels: [
          "English",
          "Maths",
          "Physics",
          "Chemistry",
          "Biology",
          "History",
        ],
        datasets: [
          {
            label: "Student A",
            backgroundColor: "rgba(58,65,111,0.2)",
            data: [65, 75, 70, 80, 60, 80],
            borderDash: [5, 5],
          },
          {
            label: "Student B",
            backgroundColor: "rgba(203,12,159,0.2)",
            data: [54, 65, 60, 70, 70, 75],
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
