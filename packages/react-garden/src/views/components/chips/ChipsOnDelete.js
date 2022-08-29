// ** React Imports
import { Fragment } from 'react'

// ** MUI Imports
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'

// ** Icons Imports
import DeleteOutline from 'mdi-material-ui/DeleteOutline'

const ChipsOnDelete = () => {
  const handleDelete = () => {
    console.info('You clicked the delete icon.')
  }

  return (
    <Fragment>
      <Typography sx={{ fontWeight: 500 }}>Default</Typography>
      <div className='demo-space-x'>
        <Chip label='Basic' variant='outlined' onDelete={handleDelete} />
        <Chip label='Primary' color='primary' variant='outlined' onDelete={handleDelete} />
        <Chip label='Secondary' color='secondary' variant='outlined' onDelete={handleDelete} />
      </div>
      <Typography sx={{ mt: 4, fontWeight: 500 }}>Custom</Typography>
      <div className='demo-space-x'>
        <Chip label='Basic' onDelete={handleDelete} deleteIcon={<DeleteOutline />} />
        <Chip label='Primary' color='primary' onDelete={handleDelete} deleteIcon={<DeleteOutline />} />
        <Chip label='Secondary' color='secondary' onDelete={handleDelete} deleteIcon={<DeleteOutline />} />
      </div>
    </Fragment>
  )
}

export default ChipsOnDelete
