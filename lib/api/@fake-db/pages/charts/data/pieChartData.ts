// types
interface Types {
  labels: any
  datasets: any
}

const pieChartData: Types = {
  labels: ['Facebook', 'Direct', 'Organic', 'Referral'],
  datasets: {
    label: 'Projects',
    backgroundColors: ['info', 'primary', 'dark', 'secondary', 'primary'],
    data: [15, 20, 12, 60],
  },
}

export default pieChartData
