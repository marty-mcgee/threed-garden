// types
interface Types {
  labels: any
  datasets: any
}

const polarChartData: Types = {
  labels: ['Red', 'Green', 'Yellow', 'Grey', 'Blue'],
  datasets: {
    label: 'My First Dataset',
    data: [11, 16, 7, 3, 14],
    backgroundColors: ['info', 'primary', 'dark', 'secondary', 'success'],
  },
}

export default polarChartData
