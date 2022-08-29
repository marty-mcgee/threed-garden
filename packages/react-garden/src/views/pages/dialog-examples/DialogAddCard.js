// ** React Imports
import { useState, forwardRef } from 'react'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Switch from '@mui/material/Switch'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import Fade from '@mui/material/Fade'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import FormControlLabel from '@mui/material/FormControlLabel'

// ** Third Party Imports
import Payment from 'payment'
import Cards from 'react-credit-cards'

// ** Util Import
import { formatCVC, formatExpirationDate, formatCreditCardNumber } from 'src/@core/utils/format'

// ** Styled Component Imports
import CardWrapper from 'src/@core/styles/libs/react-credit-cards'

// ** Styles Import
import 'react-credit-cards/es/styles-compiled.css'

// ** Icons Imports
import Close from 'mdi-material-ui/Close'
import CreditCardOutline from 'mdi-material-ui/CreditCardOutline'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})

const DialogAddCard = () => {
  // ** States
  const [name, setName] = useState('')
  const [show, setShow] = useState(false)
  const [cvc, setCvc] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [focus, setFocus] = useState()
  const [expiry, setExpiry] = useState('')
  const handleBlur = () => setFocus(undefined)

  const handleInputChange = ({ target }) => {
    if (target.name === 'number') {
      target.value = formatCreditCardNumber(target.value, Payment)
      setCardNumber(target.value)
    } else if (target.name === 'expiry') {
      target.value = formatExpirationDate(target.value)
      setExpiry(target.value)
    } else if (target.name === 'cvc') {
      target.value = formatCVC(target.value, cardNumber, Payment)
      setCvc(target.value)
    }
  }

  const handleClose = () => {
    setShow(false)
    setCvc('')
    setName('')
    setExpiry('')
    setCardNumber('')
    setFocus(undefined)
  }

  return (
    <Card>
      <CardContent sx={{ textAlign: 'center' }}>
        <CreditCardOutline sx={{ mb: 2, fontSize: '2rem' }} />
        <Typography variant='h6' sx={{ mb: 4 }}>
          Add New Card
        </Typography>
        <Typography sx={{ mb: 3 }}>
          Quickly collect the credit card details, built in input mask and form validation support.
        </Typography>
        <Button variant='contained' onClick={() => setShow(true)}>
          Show
        </Button>
      </CardContent>
      <Dialog
        fullWidth
        open={show}
        maxWidth='sm'
        scroll='body'
        onClose={handleClose}
        onBackdropClick={handleClose}
        TransitionComponent={Transition}
      >
        <DialogContent sx={{ pb: 8, px: { xs: 8, sm: 15 }, pt: { xs: 8, sm: 12.5 }, position: 'relative' }}>
          <IconButton size='small' onClick={handleClose} sx={{ position: 'absolute', right: '1rem', top: '1rem' }}>
            <Close />
          </IconButton>
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant='h5' sx={{ mb: 3 }}>
              Add New Card
            </Typography>
            <Typography variant='body2'>Add card for future billing</Typography>
          </Box>
          <Grid container spacing={6}>
            <Grid item xs={12}>
              <CardWrapper sx={{ '& .rccs': { m: '0 auto', display: { xs: 'none', sm: 'block' } } }}>
                <Cards cvc={cvc} focused={focus} expiry={expiry} name={name} number={cardNumber} />
              </CardWrapper>
            </Grid>
            <Grid item xs={12}>
              <Grid container spacing={6}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    name='number'
                    value={cardNumber}
                    autoComplete='off'
                    label='Card Number'
                    onBlur={handleBlur}
                    onChange={handleInputChange}
                    placeholder='0000 0000 0000 0000'
                    onFocus={e => setFocus(e.target.name)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    name='name'
                    value={name}
                    autoComplete='off'
                    onBlur={handleBlur}
                    label='Name on Card'
                    placeholder='John Doe'
                    onChange={e => setName(e.target.value)}
                    onFocus={e => setFocus(e.target.name)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    name='expiry'
                    label='Expiry'
                    value={expiry}
                    onBlur={handleBlur}
                    placeholder='MM/YY'
                    onChange={handleInputChange}
                    inputProps={{ maxLength: '5' }}
                    onFocus={e => setFocus(e.target.name)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    name='cvc'
                    label='CVC'
                    value={cvc}
                    autoComplete='off'
                    onBlur={handleBlur}
                    onChange={handleInputChange}
                    onFocus={e => setFocus(e.target.name)}
                    placeholder={Payment.fns.cardType(cardNumber) === 'amex' ? '1234' : '123'}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch defaultChecked />}
                    label='Save Card for future billing?'
                    sx={{ '& .MuiTypography-root': { color: 'text.secondary' } }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ pb: { xs: 8, sm: 12.5 }, justifyContent: 'center' }}>
          <Button variant='contained' sx={{ mr: 1 }} onClick={handleClose}>
            Submit
          </Button>
          <Button variant='outlined' color='secondary' onClick={handleClose}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default DialogAddCard
