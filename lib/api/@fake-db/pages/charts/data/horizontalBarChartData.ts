// types
interface Types {
  labels: any
  datasets: any
}

const horizontalBarChartData: Types = {
  labels: ['16-20', '21-25', '26-30', '31-36', '36-42', '42+'],
  datasets: [
    {
      label: 'Sales by age',
      color: 'dark',
      data: [15, 20, 12, 60, 20, 15],
    },
  ],
}

export default horizontalBarChartData
