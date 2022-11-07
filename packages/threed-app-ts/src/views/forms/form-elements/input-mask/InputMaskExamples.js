// ** MUI Imports
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'

// ** CleaveJS Imports
import Cleave from 'cleave.js/react'
import 'cleave.js/dist/addons/cleave-phone.us'

const InputMaskExamples = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12} sm={6} lg={4}>
        <InputLabel htmlFor='credit-card' sx={{ mb: 2, fontSize: '.75rem' }}>
          Credit Card
        </InputLabel>
        <Cleave id='credit-card' options={{ creditCard: true }} placeholder='0000 0000 0000 0000' />
      </Grid>
      <Grid item xs={12} sm={6} lg={4}>
        <InputLabel htmlFor='phone-number' sx={{ mb: 2, fontSize: '.75rem' }}>
          Phone Number
        </InputLabel>
        <Cleave id='phone-number' placeholder='1 234 567 8900' options={{ phone: true, phoneRegionCode: 'US' }} />
      </Grid>
      <Grid item xs={12} sm={6} lg={4}>
        <InputLabel htmlFor='date' sx={{ mb: 2, fontSize: '.75rem' }}>
          Date
        </InputLabel>
        <Cleave
          id='date'
          placeholder='2001-01-01'
          options={{ date: true, delimiter: '-', datePattern: ['Y', 'm', 'd'] }}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={4}>
        <InputLabel htmlFor='time' sx={{ mb: 2, fontSize: '.75rem' }}>
          Time
        </InputLabel>
        <Cleave id='time' placeholder='12:00:00' options={{ time: true, timePattern: ['h', 'm', 's'] }} />
      </Grid>
      <Grid item xs={12} sm={6} lg={4}>
        <InputLabel htmlFor='numeral' sx={{ mb: 2, fontSize: '.75rem' }}>
          Numeral
        </InputLabel>
        <Cleave id='numeral' placeholder='10,000' options={{ numeral: true, numeralThousandsGroupStyle: 'thousand' }} />
      </Grid>
      <Grid item xs={12} sm={6} lg={4}>
        <InputLabel htmlFor='blocks' sx={{ mb: 2, fontSize: '.75rem' }}>
          Blocks
        </InputLabel>
        <Cleave id='blocks' placeholder='Blocks [4, 3, 3]' options={{ blocks: [4, 3, 3], uppercase: true }} />
      </Grid>
      <Grid item xs={12} sm={6} lg={4}>
        <InputLabel htmlFor='delimiter' sx={{ mb: 2, fontSize: '.75rem' }}>
          Delimiter
        </InputLabel>
        <Cleave
          id='delimiter'
          placeholder="Delimiter: '.'"
          options={{ delimiter: '·', blocks: [3, 3, 3], uppercase: true }}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={4}>
        <InputLabel htmlFor='custom-delimiter' sx={{ mb: 2, fontSize: '.75rem' }}>
          Custom Delimiters
        </InputLabel>
        <Cleave
          id='custom-delimiter'
          placeholder="Delimiter: ['.', '.', '-']"
          options={{ delimiters: ['.', '.', '-'], blocks: [3, 3, 3, 2], uppercase: true }}
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={4}>
        <InputLabel htmlFor='prefix' sx={{ mb: 2, fontSize: '.75rem' }}>
          Prefix
        </InputLabel>
        <Cleave id='prefix' options={{ prefix: '+63', blocks: [3, 3, 3, 4], uppercase: true }} />
      </Grid>
    </Grid>
  )
}

export default InputMaskExamples
