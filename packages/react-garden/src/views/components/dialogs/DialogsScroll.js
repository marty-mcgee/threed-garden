// ** React Imports
import { useEffect, useRef, useState } from 'react'

// ** MUI Imports
import Button from '@mui/material/Button'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Dialog from '@mui/material/Dialog'
import DialogContentText from '@mui/material/DialogContentText'

const DialogsScroll = () => {
  // ** States
  const [open, setOpen] = useState(false)
  const [scroll, setScroll] = useState('paper')

  // ** Ref
  const descriptionElementRef = useRef(null)

  const handleClickOpen = scrollType => () => {
    setOpen(true)
    setScroll(scrollType)
  }
  const handleClose = () => setOpen(false)
  useEffect(() => {
    if (open) {
      const { current: descriptionElement } = descriptionElementRef
      if (descriptionElement !== null) {
        descriptionElement.focus()
      }
    }
  }, [open])

  return (
    <div className='demo-space-x'>
      <Button variant='outlined' onClick={handleClickOpen('paper')}>
        scroll=paper
      </Button>
      <Button variant='outlined' onClick={handleClickOpen('body')}>
        scroll=body
      </Button>
      <Dialog
        open={open}
        scroll={scroll}
        onClose={handleClose}
        aria-labelledby='scroll-dialog-title'
        aria-describedby='scroll-dialog-description'
      >
        <DialogTitle id='scroll-dialog-title'>Subscribe</DialogTitle>
        <DialogContent dividers={scroll === 'paper'}>
          <DialogContentText id='scroll-dialog-description' ref={descriptionElementRef} tabIndex={-1}>
            {[...new Array(50)].map(
              () => `Cotton candy sesame snaps toffee chupa chups caramels. Candy icing gummi bears pastry cake icing brownie
                oat cake. Tootsie roll biscuit chupa chups apple pie muffin jelly-o caramels. Muffin chocolate bar sweet
                cookie chupa chups.`
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: theme => `${theme.spacing(2.5)} !important` }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleClose}>Subscribe</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default DialogsScroll
