<template>
  <div class="card h-100">
    <div class="p-3 pb-0 card-header">
      <div class="d-flex justify-content-between">
        <h6 class="mb-0">Sales by Age</h6>
      </div>
    </div>
    <div class="p-3 card-body">
      <div class="chart">
        <canvas :id="chartId" class="chart-canvas" height="300"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from "chart.js/auto";
export default {
  name: "SalesChartCard",
  data() {
    return {
      chartId: "chart-bar",
    };
  },
  mounted() {
    var ctx3 = document.getElementById(this.chartId).getContext("2d");

    // Bar chart
    new Chart(ctx3, {
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
