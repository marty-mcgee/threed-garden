/* eslint-disable no-dupe-keys */

// Company Juice Dashboard Base Styles
import colors from "themes/theme-light/base/colors"

const { gradients } = colors

function configs(color: string, labels: any, label: any, data: any) {
  return {
    data: {
      labels,
      datasets: [
        {
          label,
          tension: 0,
          pointRadius: 3,
          pointBackgroundColor: gradients[color]
            ? gradients[color].main
            : gradients.info.main,
          borderColor: gradients[color]
            ? gradients[color].main
            : gradients.info.main,
          borderWidth: 4,
          backgroundColor: "transparent",
          maxBarThickness: 6,
          fill: true,
          data,
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
            display: true,
            padding: 10,
            color: "#9ca2b7",
            font: {
              size: 14,
              weight: 300,
              family: "Roboto",
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
            drawTicks: false,
            borderDash: [5, 5],
            color: "#c1c4ce5c",
          },
          ticks: {
            display: true,
            padding: 10,
            color: "#9ca2b7",
            font: {
              size: 14,
              weight: 300,
              family: "Roboto",
              style: "normal",
              lineHeight: 2,
            },
          },
        },
      },
    },
  }
}

export default configs
