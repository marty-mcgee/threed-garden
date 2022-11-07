// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Fade from '@mui/material/Fade'
import Card from '@mui/material/Card'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Icon Imports
import Close from 'mdi-material-ui/Close'

const CardActionClose = () => {
  // ** State
  const [visibility, setVisibility] = useState(true)

  return (
    <Fade in={visibility} timeout={300}>
      <Card>
        <CardHeader
          title='Remove Card'
          action={
            <IconButton
              size='small'
              aria-label='collapse'
              sx={{ color: 'text.secondary' }}
              onClick={() => setVisibility(false)}
            >
              <Close fontSize='small' />
            </IconButton>
          }
        />
        <CardContent>
          <Typography variant='body2'>
            You can specifically add remove action using <code>actionRemove</code> prop Click on{' '}
            <Close fontSize='small' sx={{ verticalAlign: 'bottom' }} /> icon to see it in action
          </Typography>
        </CardContent>
      </Card>
    </Fade>
  )
}

export default CardActionClose
