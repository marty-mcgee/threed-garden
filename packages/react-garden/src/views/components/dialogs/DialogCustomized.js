// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

// ** Icons Imports
import Close from 'mdi-material-ui/Close'

const DialogCustomized = () => {
  // ** State
  const [open, setOpen] = useState(false)
  const handleClickOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  return (
    <div>
      <Button variant='outlined' onClick={handleClickOpen}>
        Open dialog
      </Button>
      <Dialog onClose={handleClose} aria-labelledby='customized-dialog-title' open={open}>
        <DialogTitle id='customized-dialog-title' sx={{ p: 4 }}>
          <Typography variant='h6' component='span'>
            Modal title
          </Typography>
          <IconButton
            aria-label='close'
            onClick={handleClose}
            sx={{ top: 10, right: 10, position: 'absolute', color: theme => theme.palette.grey[500] }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 4 }}>
          <Typography gutterBottom>
            Chupa chups jelly-o candy sweet roll wafer cake chocolate bar. Brownie sweet roll topping cake chocolate
            cake cheesecake tiramisu chocolate cake. Jujubes liquorice chocolate bar pastry. Chocolate jujubes caramels
            pastry.
          </Typography>
          <Typography gutterBottom>
            Ice cream marshmallow dragée bonbon croissant. Carrot cake sweet donut ice cream bonbon oat cake danish
            sugar plum. Gingerbread gummies marzipan gingerbread.
          </Typography>
          <Typography gutterBottom>
            Soufflé toffee ice cream. Jelly-o pudding sweet roll bonbon. Marshmallow liquorice icing. Jelly beans
            chocolate bar chocolate marzipan candy fruitcake jujubes.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: theme => `${theme.spacing(3)} !important` }}>
          <Button onClick={handleClose}>Save changes</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default DialogCustomized
