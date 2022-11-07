// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Divider from '@mui/material/Divider'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Third Party Imports
import { Radar, Tooltip, PolarGrid, RadarChart, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

// ** Icons Imports
import Circle from 'mdi-material-ui/Circle'

const data = [
  {
    subject: 'Battery',
    'iPhone 11': 41,
    'Samsung s20': 65
  },
  {
    subject: 'Brand',
    'iPhone 11': 64,
    'Samsung s20': 46
  },
  {
    subject: 'Camera',
    'iPhone 11': 81,
    'Samsung s20': 42
  },
  {
    subject: 'Memory',
    'iPhone 11': 60,
    'Samsung s20': 25
  },
  {
    subject: 'Storage',
    'iPhone 11': 42,
    'Samsung s20': 58
  },
  {
    subject: 'Display',
    'iPhone 11': 42,
    'Samsung s20': 63
  },
  {
    subject: 'OS',
    'iPhone 11': 33,
    'Samsung s20': 76
  },
  {
    subject: 'Price',
    'iPhone 11': 23,
    'Samsung s20': 43
  }
]

const CustomTooltip = data => {
  const { active, payload } = data
  if (active && payload) {
    return (
      <div className='recharts-custom-tooltip'>
        <Typography>{data.label}</Typography>
        <Divider />
        {data &&
          data.payload &&
          data.payload.map(i => {
            return (
              <Box sx={{ display: 'flex', alignItems: 'center' }} key={i.dataKey}>
                <Circle sx={{ color: i.fill, mr: 2.5, fontSize: '0.6rem' }} />
                <span>
                  {i.dataKey}: {i.payload[i.dataKey]}
                </span>
              </Box>
            )
          })}
      </div>
    )
  }

  return null
}

const RechartsRadarChart = () => {
  return (
    <Card>
      <CardHeader title='Mobile Comparison' titleTypographyProps={{ variant: 'h6' }} />
      <CardContent>
        <Box sx={{ height: 350 }}>
          <ResponsiveContainer>
            <RadarChart cx='50%' cy='50%' height={350} data={data} style={{ direction: 'ltr' }}>
              <PolarGrid />
              <PolarAngleAxis dataKey='subject' />
              <PolarRadiusAxis />
              <Tooltip content={CustomTooltip} />
              <Radar dataKey='iPhone 11' stroke='#fde802' fill='#fde802' fillOpacity={1} />
              <Radar dataKey='Samsung s20' stroke='#9b88fa' fill='#9b88fa' fillOpacity={0.8} />
            </RadarChart>
          </ResponsiveContainer>
        </Box>
        <Box sx={{ display: 'flex', mb: 4, justifyContent: 'center' }}>
          <Box sx={{ mr: 6, display: 'flex', alignItems: 'center' }}>
            <Circle sx={{ mr: 1.5, fontSize: '0.75rem', color: '#fde802' }} />
            <Typography>iPhone 11</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Circle sx={{ mr: 1.5, fontSize: '0.75rem', color: '#9b88fa' }} />
            <Typography>Samsung s20</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

export default RechartsRadarChart
