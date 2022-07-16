<template>
  <div class="mt-4 overflow-hidden card">
    <div class="p-3 card-body">
      <div class="row">
        <div class="col-lg-5">
          <div class="d-flex">
            <div
              class="text-center shadow icon icon-shape bg-gradient-info border-radius-md"
            >
              <i
                class="text-lg ni ni-delivery-fast opacity-10"
                aria-hidden="true"
              ></i>
            </div>
            <div class="ms-3">
              <p class="mb-0 text-sm text-capitalize font-weight-bold">
                Projects
              </p>
              <h5 class="mb-0 font-weight-bolder">115</h5>
            </div>
          </div>
          <span class="pb-0 mt-3 badge badge-dot d-block text-start">
            <i class="bg-gradient-info"></i>
            <span class="text-xs text-muted font-weight-bold">Done</span>
          </span>
          <span class="badge badge-dot d-block text-start">
            <i class="bg-gradient-secondary"></i>
            <span class="text-xs text-muted font-weight-bold">In progress</span>
          </span>
        </div>
        <div class="my-auto col-lg-7">
          <div class="chart ms-auto">
            <canvas :id="chartId" class="chart-canvas" height="150"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from "chart.js/auto";
export default {
  name: "ProjectsCard",
  data() {
    return {
      chartId: "chart-bar",
    };
  },
  mounted() {
    var ctx1 = document.getElementById("chart-line").getContext("2d");

    var gradientStroke1 = ctx1.createLinearGradient(0, 230, 0, 50);

    gradientStroke1.addColorStop(1, "rgba(33,82,255,0.1)");
    gradientStroke1.addColorStop(0.2, "rgba(33,82,255,0.0)");
    gradientStroke1.addColorStop(0, "rgba(33,82,255,0)"); //purple colors

    new Chart(this.chartId, {
      type: "doughnut",
      data: {
        labels: ["Done", "In progress"],
        datasets: [
          {
            label: "Projects",
            weight: 9,
            cutout: 50,
            tension: 0.9,
            pointRadius: 2,
            borderWidth: 2,
            backgroundColor: ["#2152ff", "#a8b8d8"],
            data: [75, 25],
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
