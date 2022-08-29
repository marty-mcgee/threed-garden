// ** React Imports
import { Fragment } from 'react'

// ** MUI Imports
import Fab from '@mui/material/Fab'

// ** Icons Import
import Plus from 'mdi-material-ui/Plus'
import NavigationOutline from 'mdi-material-ui/NavigationOutline'

const ButtonsFabSizes = () => {
  return (
    <Fragment>
      <div className='demo-space-x'>
        <Fab color='primary' aria-label='add' size='small'>
          <Plus />
        </Fab>
        <Fab color='primary' aria-label='add' size='medium'>
          <Plus />
        </Fab>
        <Fab color='primary' aria-label='add' size='large'>
          <Plus />
        </Fab>
      </div>
      <div className='demo-space-x'>
        <Fab variant='extended' size='small'>
          <NavigationOutline sx={{ mr: 1 }} />
          Navigate
        </Fab>
        <Fab variant='extended' size='medium'>
          <NavigationOutline sx={{ mr: 1 }} />
          Navigate
        </Fab>
        <Fab variant='extended' size='large'>
          <NavigationOutline sx={{ mr: 1 }} />
          Navigate
        </Fab>
      </div>
    </Fragment>
  )
}

export default ButtonsFabSizes
