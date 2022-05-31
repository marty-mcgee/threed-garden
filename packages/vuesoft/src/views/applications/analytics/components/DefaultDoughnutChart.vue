<template>
  <div class="card h-100">
    <div class="p-3 pb-0 card-header">
      <div class="d-flex align-items-center">
        <h6 class="mb-0">{{ title }}</h6>
        <button
          type="button"
          class="mb-0 btn btn-icon-only btn-rounded btn-outline-secondary ms-2 btn-sm d-flex align-items-center justify-content-center ms-auto"
          data-bs-toggle="tooltip"
          data-bs-placement="bottom"
          title="See which websites are sending traffic to your website"
        >
          <i class="fas fa-info"></i>
        </button>
      </div>
    </div>
    <div class="p-3 card-body">
      <div class="row">
        <div class="text-center col-lg-5 col-12">
          <div class="mt-5 chart">
            <canvas :id="id" class="chart-canvas" :height="height"></canvas>
          </div>
          <a
            class="mt-4 btn btn-sm"
            :href="actions.route"
            :class="`bg-gradient-${actions.color}`"
          >
            {{ actions.label }}
          </a>
        </div>
        <div class="col-lg-7 col-12">
          <div class="table-responsive">
            <table class="table mb-0 align-items-center">
              <tbody>
                <tr>
                  <td>
                    <div class="px-2 py-1 d-flex">
                      <div>
                        <img
                          src="@/assets/img/small-logos/logo-xd.svg"
                          class="avatar avatar-sm me-2"
                          alt="logo_xd"
                        />
                      </div>
                      <div class="d-flex flex-column justify-content-center">
                        <h6 class="mb-0 text-sm">Adobe</h6>
                      </div>
                    </div>
                  </td>
                  <td class="text-sm text-center align-middle">
                    <span class="text-xs font-weight-bold"> 25% </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="px-2 py-1 d-flex">
                      <div>
                        <img
                          src="@/assets/img/small-logos/logo-atlassian.svg"
                          class="avatar avatar-sm me-2"
                          alt="logo_atlassian"
                        />
                      </div>
                      <div class="d-flex flex-column justify-content-center">
                        <h6 class="mb-0 text-sm">Atlassian</h6>
                      </div>
                    </div>
                  </td>
                  <td class="text-sm text-center align-middle">
                    <span class="text-xs font-weight-bold"> 3% </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="px-2 py-1 d-flex">
                      <div>
                        <img
                          src="@/assets/img/small-logos/logo-slack.svg"
                          class="avatar avatar-sm me-2"
                          alt="logo_slack"
                        />
                      </div>
                      <div class="d-flex flex-column justify-content-center">
                        <h6 class="mb-0 text-sm">Slack</h6>
                      </div>
                    </div>
                  </td>
                  <td class="text-sm text-center align-middle">
                    <span class="text-xs font-weight-bold"> 12% </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="px-2 py-1 d-flex">
                      <div>
                        <img
                          src="@/assets/img/small-logos/logo-spotify.svg"
                          class="avatar avatar-sm me-2"
                          alt="logo_spotify"
                        />
                      </div>
                      <div class="d-flex flex-column justify-content-center">
                        <h6 class="mb-0 text-sm">Spotify</h6>
                      </div>
                    </div>
                  </td>
                  <td class="text-sm text-center align-middle">
                    <span class="text-xs font-weight-bold"> 7% </span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div class="px-2 py-1 d-flex">
                      <div>
                        <img
                          src="@/assets/img/small-logos/logo-jira.svg"
                          class="avatar avatar-sm me-2"
                          alt="logo_jira"
                        />
                      </div>
                      <div class="d-flex flex-column justify-content-center">
                        <h6 class="mb-0 text-sm">Jira</h6>
                      </div>
                    </div>
                  </td>
                  <td class="text-sm text-center align-middle">
                    <span class="text-xs font-weight-bold"> 10% </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Chart from "chart.js/auto";
export default {
  name: "DefaultDoughnutChart",
  props: {
    id: {
      type: String,
      default: "default-doughnut-chart",
    },
    height: {
      type: [String, Number],
      default: "200",
    },
    title: {
      type: String,
      default: "Default Doughnut Chart",
    },
    chart: {
      type: Object,
      required: true,
      labels: String,
      datasets: {
        type: Array,
        label: String,
        data: Array,
      },
    },
    actions: {
      type: Object,
      route: String,
      color: String,
      label: String,
      default: () => ({
        color: "secondary",
        label: "See all refferals",
      }),
    },
  },
  mounted() {
    var chart = document.getElementById(this.id).getContext("2d");

    var gradientStroke2 = chart.createLinearGradient(0, 230, 0, 50);

    gradientStroke2.addColorStop(1, "rgba(20,23,39,0.2)");
    gradientStroke2.addColorStop(0.2, "rgba(72,72,176,0.0)");
    gradientStroke2.addColorStop(0, "rgba(20,23,39,0)"); //purple colors

    let chartStatus = Chart.getChart(this.id);
    if (chartStatus != undefined) {
      chartStatus.destroy();
    }

    new Chart(chart, {
      type: "doughnut",
      data: {
        labels: this.chart.labels,
        datasets: [
          {
            label: this.chart.datasets[0].label,
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
            data: this.chart.datasets[0].data,
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
