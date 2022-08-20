<template>
  <div class="overflow-hidden card">
    <div class="p-3 pb-0 card-header">
      <div class="d-flex align-items-center">
        <div
          class="text-center shadow icon icon-shape border-radius-md"
          :class="bgColor"
        >
          <i
            class="text-lg ni ni-calendar-grid-58 opacity-10"
            aria-hidden="true"
          ></i>
        </div>
        <div :class="$store.state.isRTL ? 'me-3' : 'ms-3'">
          <p class="mb-0 text-sm text-capitalize font-weight-bold">
            {{ title }}
          </p>
          <h5 class="mb-0 font-weight-bolder">480</h5>
        </div>
        <div
          class="progress-wrapper w-25"
          :class="$store.state.isRTL ? 'me-auto' : 'ms-auto'"
        >
          <div class="progress-info">
            <div class="progress-j">
              <span class="text-xs font-weight-bold">60%</span>
            </div>
          </div>
          <div class="progress">
            <div
              class="progress-bar w-60"
              :class="bgColor"
              role="progressbar"
              aria-valuenow="60"
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
        </div>
      </div>
    </div>
    <div class="p-0 mt-3 card-body">
      <div class="chart">
        <canvas id="chart-line" class="chart-canvas" height="100"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
// import Chart from "chart.js/auto";
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

export default {
  name: "TasksCard",
  props: {
    title: {
      type: String,
      default: "Tasks",
    },
    bgColor: {
      type: String,
      default: "bg-gradient-info",
    },
  },
  mounted() {
    var ctx1 = document.getElementById("chart-line").getContext("2d");

    var gradientStroke1 = ctx1.createLinearGradient(0, 230, 0, 50);

    gradientStroke1.addColorStop(1, "rgba(33,82,255,0.1)");
    gradientStroke1.addColorStop(0.2, "rgba(33,82,255,0.0)");
    gradientStroke1.addColorStop(0, "rgba(33,82,255,0)"); //purple colors

    new Chart(ctx1, {
      type: "line",
      data: {
        labels: ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        datasets: [
          {
            label: "Tasks",
            tension: 0.3,
            pointRadius: 2,
            pointBackgroundColor: "#2152ff",
            borderColor: "#2152ff",
            borderWidth: 2,
            backgroundColor: gradientStroke1,
            data: [40, 45, 42, 41, 40, 43, 40, 42, 39],
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
              color: "#252f40",
              padding: 10,
            },
          },
          // eslint-disable-next-line no-dupe-keys
          y: {
            grid: {
              drawBorder: false,
              display: false,
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
          // eslint-disable-next-line no-dupe-keys
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
