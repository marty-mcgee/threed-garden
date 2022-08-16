/* eslint-disable no-dupe-keys */
// Company Juice Dashboard Base Styles
import colors from "~/themes/theme-light/base/colors"

const { gradients, dark } = colors

function configs(labels: any, datasets: any, cutout: number = 60) {
  const backgroundColors = []

  if (datasets.backgroundColors) {
    datasets.backgroundColors.forEach((color: string) => {
      if (gradients[color]) {
        if (color === "info") {
          backgroundColors.push(gradients.info.main)
        } else {
          backgroundColors.push(gradients[color].state)
        }
      } else {
        backgroundColors.push(dark.main)
      }
    })
  } else {
    backgroundColors.push(dark.main)
  }

  return {
    data: {
      labels,
      datasets: [
        {
          label: datasets.label,
          weight: 9,
          cutout,
          tension: 0.9,
          pointRadius: 2,
          borderWidth: 2,
          backgroundColor: backgroundColors,
          fill: false,
          data: datasets.data,
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
  }
}

export default configs
