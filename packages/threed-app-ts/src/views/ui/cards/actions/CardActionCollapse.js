// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Card from '@mui/material/Card'
import Collapse from '@mui/material/Collapse'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Icon Imports
import ChevronUp from 'mdi-material-ui/ChevronUp'
import ChevronDown from 'mdi-material-ui/ChevronDown'

const CardActionCollapse = () => {
  // ** State
  const [collapsed, setCollapsed] = useState(true)

  return (
    <Card>
      <CardHeader
        title='Collapsible'
        action={
          <IconButton
            size='small'
            aria-label='collapse'
            sx={{ color: 'text.secondary' }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {!collapsed ? <ChevronDown fontSize='small' /> : <ChevronUp fontSize='small' />}
          </IconButton>
        }
      />
      <Collapse in={collapsed}>
        <CardContent>
          <Typography variant='body2'>
            You can specifically add collapsible action using <code>actionCollapse</code> prop Click on{' '}
            <ChevronUp fontSize='small' sx={{ verticalAlign: 'bottom' }} /> icon to see it in action
          </Typography>
        </CardContent>
      </Collapse>
    </Card>
  )
}

export default CardActionCollapse
