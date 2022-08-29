// ** MUI Imports
import Chip from '@mui/material/Chip'

// ** Icons Imports
import ArrowLeftThinCircleOutline from 'mdi-material-ui/ArrowLeftThinCircleOutline'
import ArrowRightThinCircleOutline from 'mdi-material-ui/ArrowRightThinCircleOutline'

const ChipsIcon = () => {
  return (
    <div className='demo-space-x'>
      <Chip label='Previous' icon={<ArrowLeftThinCircleOutline fontSize='small' />} />
      <Chip label='Next' color='primary' variant='outlined' icon={<ArrowRightThinCircleOutline fontSize='small' />} />
    </div>
  )
}

export default ChipsIcon
