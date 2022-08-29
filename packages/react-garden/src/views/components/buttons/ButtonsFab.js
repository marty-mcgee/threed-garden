// ** MUI Imports
import Box from '@mui/material/Box'
import Fab from '@mui/material/Fab'
import Typography from '@mui/material/Typography'

// ** Icons Import
import Plus from 'mdi-material-ui/Plus'
import Pencil from 'mdi-material-ui/Pencil'

const ButtonsFab = () => {
  return (
    <>
      <Typography sx={{ fontWeight: 500 }}>Circular Variant</Typography>
      <Box sx={{ mb: 6 }} className='demo-space-x'>
        <Fab aria-label='edit'>
          <Pencil />
        </Fab>
        <Fab color='primary' aria-label='edit'>
          <Pencil />
        </Fab>
        <Fab color='secondary' aria-label='edit'>
          <Pencil />
        </Fab>
        <Fab color='success' aria-label='edit'>
          <Pencil />
        </Fab>
        <Fab color='error' aria-label='edit'>
          <Pencil />
        </Fab>
        <Fab color='warning' aria-label='edit'>
          <Pencil />
        </Fab>
        <Fab color='info' aria-label='edit'>
          <Pencil />
        </Fab>
        <Fab disabled aria-label='edit'>
          <Pencil />
        </Fab>
      </Box>
      <Typography sx={{ fontWeight: 500 }}>Extended Variant</Typography>
      <div className='demo-space-x'>
        <Fab variant='extended'>
          <Plus sx={{ mr: 1 }} />
          Add
        </Fab>
        <Fab color='primary' variant='extended'>
          <Plus sx={{ mr: 1 }} />
          Add
        </Fab>
        <Fab color='secondary' variant='extended'>
          <Plus sx={{ mr: 1 }} />
          Add
        </Fab>
        <Fab color='success' variant='extended'>
          <Plus sx={{ mr: 1 }} />
          Add
        </Fab>
        <Fab color='error' variant='extended'>
          <Plus sx={{ mr: 1 }} />
          Add
        </Fab>
        <Fab color='warning' variant='extended'>
          <Plus sx={{ mr: 1 }} />
          Add
        </Fab>
        <Fab color='info' variant='extended'>
          <Plus sx={{ mr: 1 }} />
          Add
        </Fab>
        <Fab disabled variant='extended'>
          <Plus sx={{ mr: 1 }} />
          Add
        </Fab>
      </div>
    </>
  )
}

export default ButtonsFab
