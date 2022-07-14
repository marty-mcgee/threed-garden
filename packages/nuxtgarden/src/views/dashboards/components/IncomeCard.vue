<template>
  <div class="overflow-hidden card">
    <div class="p-3 pb-0 card-header">
      <p class="mb-0 text-sm text-capitalize font-weight-bold">Income</p>
      <h5 class="mb-0 font-weight-bolder">
        $130,832
        <span class="text-sm text-success font-weight-bolder">+90%</span>
      </h5>
    </div>
    <div class="p-0 card-body">
      <div class="chart">
        <canvas id="chart-line-2" class="chart-canvas" height="100"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from "chart.js/auto";

export default {
  name: "IncomeCard",
  mounted() {
    var ctx2 = document.getElementById("chart-line-2").getContext("2d");

    var gradientStroke1 = ctx2.createLinearGradient(0, 230, 0, 50);

    gradientStroke1.addColorStop(1, "rgba(203,12,159,0.02)");
    gradientStroke1.addColorStop(0.2, "rgba(72,72,176,0.0)");
    gradientStroke1.addColorStop(0, "rgba(203,12,159,0)"); //purple colors

    new Chart(ctx2, {
      type: "line",
      data: {
        labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        datasets: [
          {
            label: "Income",
            tension: 0.5,
            borderWidth: 0,
            pointRadius: 0,
            borderColor: "#cb0c9f",
            // eslint-disable-next-line no-dupe-keys
            borderWidth: 2,
            backgroundColor: gradientStroke1,
            data: [60, 80, 75, 90, 67, 100, 90, 110, 120],
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
