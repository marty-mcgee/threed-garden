// ** React Imports
import { Fragment } from 'react'

// ** MUI Imports
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

const ChipsColors = () => {
  return (
    <Fragment>
      <Typography sx={{ fontWeight: 500 }}>Filled Chips</Typography>
      <div className='demo-space-x'>
        <Chip label='Primary' color='primary' />
        <Chip label='Secondary' color='secondary' />
        <Chip label='Success' color='success' />
        <Chip label='Error' color='error' />
        <Chip label='Warning' color='warning' />
        <Chip label='Info' color='info' />
      </div>
      <Typography sx={{ mt: 4, fontWeight: 500 }}>Outlined Chips</Typography>
      <div className='demo-space-x'>
        <Chip label='Primary' color='primary' variant='outlined' />
        <Chip label='Secondary' color='secondary' variant='outlined' />
        <Chip label='Success' color='success' variant='outlined' />
        <Chip label='Error' color='error' variant='outlined' />
        <Chip label='Warning' color='warning' variant='outlined' />
        <Chip label='Info' color='info' variant='outlined' />
      </div>
    </Fragment>
  )
}

export default ChipsColors
