// ** MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Component Import
import ReactApexcharts from 'src/@core/components/react-apexcharts'

const donutColors = {
  series1: '#fdd835',
  series2: '#00d4bd',
  series3: '#826bf8',
  series4: '#32baff',
  series5: '#ffa1a1'
}

const ApexDonutChart = () => {
  const options = {
    legend: {
      show: true,
      position: 'bottom'
    },
    stroke: { width: 0 },
    labels: ['Operational', 'Networking', 'Hiring', 'R&D'],
    colors: [donutColors.series1, donutColors.series5, donutColors.series3, donutColors.series2],
    dataLabels: {
      enabled: true,
      formatter(val) {
        return `${parseInt(val, 10)}%`
      }
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            name: {
              fontSize: '2rem',
              fontFamily: 'Montserrat'
            },
            value: {
              fontSize: '1rem',
              fontFamily: 'Montserrat',
              formatter(val) {
                return `${parseInt(val, 10)}`
              }
            },
            total: {
              show: true,
              fontSize: '1.5rem',
              label: 'Operational',
              formatter() {
                return '31%'
              }
            }
          }
        }
      }
    },
    responsive: [
      {
        breakpoint: 992,
        options: {
          chart: {
            height: 380
          },
          legend: {
            position: 'bottom'
          }
        }
      },
      {
        breakpoint: 576,
        options: {
          chart: {
            height: 320
          },
          plotOptions: {
            pie: {
              donut: {
                labels: {
                  show: true,
                  name: {
                    fontSize: '1.5rem'
                  },
                  value: {
                    fontSize: '1rem'
                  },
                  total: {
                    fontSize: '1.5rem'
                  }
                }
              }
            }
          }
        }
      }
    ]
  }
  const series = [85, 16, 50, 50]

  return (
    <Card>
      <CardHeader
        title='Expense Ratio'
        titleTypographyProps={{ variant: 'h6' }}
        subheader='Spending on various categories'
        subheaderTypographyProps={{ variant: 'caption', sx: { color: 'text.disabled' } }}
      />
      <CardContent
        sx={{
          '& .apexcharts-canvas .apexcharts-pie .apexcharts-datalabel-label, & .apexcharts-canvas .apexcharts-pie .apexcharts-datalabel-value':
            { fontSize: '1.2rem' }
        }}
      >
        <ReactApexcharts options={options} series={series} type='donut' height={400} />
      </CardContent>
    </Card>
  )
}

export default ApexDonutChart
