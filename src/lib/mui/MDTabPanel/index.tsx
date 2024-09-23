import { ReactNode } from 'react'
// import Box from '@mui/material/Box'
import {
  Box,
} from '@radix-ui/themes'

interface TabPanelProps {
  children?: ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <Box
      role='tabpanel'
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      // sx={{ overflow: 'scroll' }}
      {...other}
    >
      {value === index && 
        <Box 
          // sx={{ overflow: 'scroll' }}
        >
          {children}
        </Box>
      }
    </Box>
  )
}

export default TabPanel

export function tabProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  }
}
