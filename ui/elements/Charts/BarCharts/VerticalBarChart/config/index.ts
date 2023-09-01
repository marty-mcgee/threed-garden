// ThreeD Garden Base Styles
import typography from '#/ui/theme/themes/theme-light/base/typography'

function configs(labels: any, datasets: any) {
  return {
    data: {
      labels,
      datasets: [...datasets],
    },
    options: {
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
            color: '#9ca2b7',
            font: {
              size: 11,
              family: typography.fontFamily,
              style: 'normal',
              lineHeight: 2,
            },
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
            color: '#9ca2b7',
            padding: 10,
            font: {
              size: 11,
              family: typography.fontFamily,
              style: 'normal',
              lineHeight: 2,
            },
          },
        },
      },
    },
  }
}

export default configs
