// ** React Imports
import { Fragment, useState } from 'react'

// ** MUI Imports
import Button from '@mui/material/Button'
import Switch from '@mui/material/Switch'
import Dialog from '@mui/material/Dialog'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import { styled } from '@mui/material/styles'
import FormControlLabel from '@mui/material/FormControlLabel'
import DialogContentText from '@mui/material/DialogContentText'
import Select from '@mui/material/Select'

// Styled component for the form
const Form = styled('form')({
  margin: 'auto',
  display: 'flex',
  width: 'fit-content',
  flexDirection: 'column'
})

const DialogSizes = () => {
  // ** States
  const [open, setOpen] = useState(false)
  const [fullWidth, setFullWidth] = useState(true)
  const [maxWidth, setMaxWidth] = useState('sm')
  const handleClickOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const handleMaxWidthChange = event => {
    setMaxWidth(event.target.value)
  }

  const handleFullWidthChange = event => {
    setFullWidth(event.target.checked)
  }

  return (
    <Fragment>
      <Button variant='outlined' onClick={handleClickOpen}>
        Open dialog
      </Button>
      <Dialog
        open={open}
        maxWidth={maxWidth}
        fullWidth={fullWidth}
        onClose={handleClose}
        aria-labelledby='max-width-dialog-title'
      >
        <DialogTitle id='max-width-dialog-title'>Optional sizes</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 4 }}>
            You can set my maximum width and whether to adapt or not.
          </DialogContentText>
          <Form noValidate>
            <FormControl sx={{ mt: 2, minWidth: 120 }}>
              <InputLabel htmlFor='max-width'>maxWidth</InputLabel>
              <Select
                label='maxWidth'
                value={maxWidth}
                onChange={handleMaxWidthChange}
                inputProps={{
                  name: 'max-width',
                  id: 'max-width'
                }}
              >
                <MenuItem value={false}>false</MenuItem>
                <MenuItem value='xs'>xs</MenuItem>
                <MenuItem value='sm'>sm</MenuItem>
                <MenuItem value='md'>md</MenuItem>
                <MenuItem value='lg'>lg</MenuItem>
                <MenuItem value='xl'>xl</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              label='Full width'
              sx={{ mt: 2 }}
              control={<Switch checked={fullWidth} onChange={handleFullWidthChange} />}
            />
          </Form>
        </DialogContent>
        <DialogActions className='dialog-actions-dense'>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  )
}

export default DialogSizes
