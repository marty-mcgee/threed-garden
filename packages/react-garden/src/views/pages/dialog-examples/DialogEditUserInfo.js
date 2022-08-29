// ** React Imports
import { useState, forwardRef } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Switch from '@mui/material/Switch'
import Dialog from '@mui/material/Dialog'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import CardContent from '@mui/material/CardContent'
import Fade from '@mui/material/Fade'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import FormControlLabel from '@mui/material/FormControlLabel'
import Select from '@mui/material/Select'

// ** Icons Imports
import Close from 'mdi-material-ui/Close'
import AccountOutline from 'mdi-material-ui/AccountOutline'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})

const DialogEditUserInfo = () => {
  // ** States
  const [show, setShow] = useState(false)
  const [languages, setLanguages] = useState([])

  const handleChange = event => {
    const {
      target: { value }
    } = event
    setLanguages(typeof value === 'string' ? value.split(',') : value)
  }

  return (
    <Card>
      <CardContent sx={{ textAlign: 'center' }}>
        <AccountOutline sx={{ mb: 2, fontSize: '2rem' }} />
        <Typography variant='h6' sx={{ mb: 4 }}>
          Edit User Info
        </Typography>
        <Typography sx={{ mb: 3 }}>Use this modal to modify the existing user&prime;s current information.</Typography>
        <Button variant='contained' onClick={() => setShow(true)}>
          Show
        </Button>
      </CardContent>
      <Dialog
        fullWidth
        open={show}
        maxWidth='md'
        scroll='body'
        onClose={() => setShow(false)}
        TransitionComponent={Transition}
        onBackdropClick={() => setShow(false)}
      >
        <DialogContent sx={{ pb: 8, px: { xs: 8, sm: 15 }, pt: { xs: 8, sm: 12.5 }, position: 'relative' }}>
          <IconButton
            size='small'
            onClick={() => setShow(false)}
            sx={{ position: 'absolute', right: '1rem', top: '1rem' }}
          >
            <Close />
          </IconButton>
          <Box sx={{ mb: 8, textAlign: 'center' }}>
            <Typography variant='h5' sx={{ mb: 3 }}>
              Edit User Information
            </Typography>
            <Typography variant='body2'>Updating user details will receive a privacy audit.</Typography>
          </Box>
          <Grid container spacing={6}>
            <Grid item sm={6} xs={12}>
              <TextField fullWidth defaultValue='Oliver' label='First Name' placeholder='John' />
            </Grid>
            <Grid item sm={6} xs={12}>
              <TextField fullWidth defaultValue='Queen' label='Last Name' placeholder='Doe' />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth defaultValue='oliverQueen' label='Username' placeholder='johnDoe' />
            </Grid>
            <Grid item sm={6} xs={12}>
              <TextField
                fullWidth
                label='Billing Email'
                placeholder='johnDoe@email.com'
                defaultValue='oliverQueen@email.com'
              />
            </Grid>
            <Grid item sm={6} xs={12}>
              <FormControl fullWidth>
                <InputLabel id='status-select'>Status</InputLabel>
                <Select defaultValue='Status' fullWidth labelId='status-select' label='Status'>
                  <MenuItem value='Status'>Status</MenuItem>
                  <MenuItem value='Active'>Active</MenuItem>
                  <MenuItem value='Inactive'>Inactive</MenuItem>
                  <MenuItem value='Suspended'>Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item sm={6} xs={12}>
              <TextField fullWidth label='Tax ID' placeholder='Tax-7490' defaultValue='Tax-8894' />
            </Grid>
            <Grid item sm={6} xs={12}>
              <TextField fullWidth label='Contact' placeholder='+ 123 456 7890' defaultValue='+1 609 933 4422' />
            </Grid>
            <Grid item sm={6} xs={12}>
              <FormControl fullWidth>
                <InputLabel id='language-select'>Language</InputLabel>
                <Select
                  multiple
                  fullWidth
                  label='Language'
                  value={languages}
                  onChange={handleChange}
                  labelId='language-select'
                  renderValue={selected => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map(value => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value='English'>English</MenuItem>
                  <MenuItem value='Spanish'>Spanish</MenuItem>
                  <MenuItem value='French'>French</MenuItem>
                  <MenuItem value='German'>German</MenuItem>
                  <MenuItem value='Hindi'>Hindi</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item sm={6} xs={12}>
              <FormControl fullWidth>
                <InputLabel id='country-select'>Country</InputLabel>
                <Select
                  fullWidth
                  label='Country'
                  placeholder='UK'
                  labelId='country-select'
                  defaultValue='Select Country'
                >
                  <MenuItem value='Select Country'>Select Country</MenuItem>
                  <MenuItem value='France'>France</MenuItem>
                  <MenuItem value='Russia'>Russia</MenuItem>
                  <MenuItem value='China'>China</MenuItem>
                  <MenuItem value='UK'>UK</MenuItem>
                  <MenuItem value='US'>US</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel control={<Switch defaultChecked />} label='Make this default shipping address' />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ pb: { xs: 8, sm: 12.5 }, justifyContent: 'center' }}>
          <Button variant='contained' sx={{ mr: 1 }} onClick={() => setShow(false)}>
            Submit
          </Button>
          <Button variant='outlined' color='secondary' onClick={() => setShow(false)}>
            Discard
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default DialogEditUserInfo
