// ThreeD Garden Base Styles
import colors from '~/ui/themes/theme-light/base/colors'

const { gradients, dark } = colors

function configs(labels: any, datasets: any) {
  const backgroundColors = []

  if (datasets.backgroundColors) {
    datasets.backgroundColors.forEach((color: string) =>
      gradients[color] ? backgroundColors.push(gradients[color].state) : backgroundColors.push(dark.main)
    )
  } else {
    backgroundColors.push(dark.main)
  }

  return {
    data: {
      labels,
      datasets: [
        {
          label: datasets.label,
          backgroundColor: backgroundColors,
          data: datasets.data,
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
  }
}

export default configs
