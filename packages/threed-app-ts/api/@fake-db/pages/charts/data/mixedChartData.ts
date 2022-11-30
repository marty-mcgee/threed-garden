// types
interface Types {
  labels: any
  datasets: any
}

const mixedChartData: Types = {
  labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      chartType: 'thin-bar',
      label: 'Organic Search',
      color: 'dark',
      data: [50, 40, 300, 220, 500, 250, 400, 230, 500],
    },
    {
      chartType: 'gradient-line',
      label: 'Referral',
      color: 'info',
      data: [30, 90, 40, 140, 290, 290, 340, 230, 400],
    },
  ],
}

export default mixedChartData
