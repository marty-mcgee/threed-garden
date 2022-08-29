// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Radio from '@mui/material/Radio'
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import FormLabel from '@mui/material/FormLabel'
import TextField from '@mui/material/TextField'
import RadioGroup from '@mui/material/RadioGroup'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import FormControlLabel from '@mui/material/FormControlLabel'

// ** Icons Imports
import CloudOutline from 'mdi-material-ui/CloudOutline'
import AccountOutline from 'mdi-material-ui/AccountOutline'
import HelpCircleOutline from 'mdi-material-ui/HelpCircleOutline'

// ** Third Party Imports
import Payment from 'payment'
import Cards from 'react-credit-cards'

// ** Custom Components Imports
import CustomChip from 'src/@core/components/mui/chip'

// ** Styled Component Imports
import CardWrapper from 'src/@core/styles/libs/react-credit-cards'

// ** Util Import
import { formatCVC, formatExpirationDate, formatCreditCardNumber } from 'src/@core/utils/format'

// ** Styles Import
import 'react-credit-cards/es/styles-compiled.css'

// ** Styled Component
const StyledGrid = styled(Grid)(({ theme }) => ({
  marginTop: theme.spacing(4.8),
  [theme.breakpoints.down('md')]: {
    order: -1
  }
}))

const Chip = styled(CustomChip)(({ theme }) => ({
  height: 20,
  fontWeight: 600,
  fontSize: '0.75rem',
  marginTop: theme.spacing(2.25),
  marginBottom: theme.spacing(5.5),
  '& .MuiChip-label': {
    padding: theme.spacing(0, 1.7)
  }
}))

const CreditCardWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.down('xl')]: {
    '& > div:first-of-type': {
      marginBottom: theme.spacing(6)
    }
  },
  [theme.breakpoints.up('xl')]: {
    alignItems: 'center',
    flexDirection: 'row',
    '& > div:first-of-type': {
      marginRight: theme.spacing(6)
    }
  }
}))

const TabBilling = () => {
  // ** States
  const [name, setName] = useState('')
  const [cvc, setCvc] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [focus, setFocus] = useState()
  const [expiry, setExpiry] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('card')
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

  return (
    <CardContent>
      <form>
        <Grid container spacing={7}>
          <Grid item xs={12} md={8} sx={{ mt: 2.8 }}>
            <Grid container spacing={7}>
              <Grid item xs={12}>
                <FormControl>
                  <FormLabel sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>Payment Method</FormLabel>
                  <RadioGroup
                    row
                    value={paymentMethod}
                    aria-label='payment method'
                    name='account-settings-billing-radio'
                    onChange={e => setPaymentMethod(e.target.value)}
                  >
                    <FormControlLabel value='card' label='Credit/Debit/ATM Card' control={<Radio />} />
                    <FormControlLabel value='cod' label='COD/Cheque' control={<Radio />} />
                  </RadioGroup>
                </FormControl>
              </Grid>
              {paymentMethod === 'card' ? (
                <Grid item xs={12}>
                  <CreditCardWrapper>
                    <CardWrapper>
                      <Cards cvc={cvc} focused={focus} expiry={expiry} name={name} number={cardNumber} />
                    </CardWrapper>
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
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          name='name'
                          value={name}
                          label='Name'
                          autoComplete='off'
                          onBlur={handleBlur}
                          placeholder='John Doe'
                          onFocus={e => setFocus(e.target.name)}
                          onChange={e => setName(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          name='expiry'
                          value={expiry}
                          autoComplete='off'
                          label='Expiry Date'
                          placeholder='MM/YY'
                          onBlur={handleBlur}
                          onChange={handleInputChange}
                          inputProps={{ maxLength: '5' }}
                          onFocus={e => setFocus(e.target.name)}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          name='cvc'
                          value={cvc}
                          label='CVC Code'
                          autoComplete='off'
                          onBlur={handleBlur}
                          onChange={handleInputChange}
                          onFocus={e => setFocus(e.target.name)}
                          placeholder={Payment.fns.cardType(cardNumber) === 'amex' ? '1234' : '123'}
                        />
                      </Grid>
                    </Grid>
                  </CreditCardWrapper>
                </Grid>
              ) : null}
            </Grid>
          </Grid>

          <StyledGrid item xs={12} md={4}>
            <Box
              sx={{
                borderRadius: 1,
                p: theme => theme.spacing(2.5, 5.75, 4.75),
                border: theme => `1px solid ${theme.palette.divider}`
              }}
            >
              <Box sx={{ ml: -2.25, display: 'flex', alignItems: 'center' }}>
                <Typography variant='h6'>Your Current Plan</Typography>
              </Box>
              <Chip skin='light' color='primary' label='Basic Plan' />
              <Box sx={{ my: 3, display: 'flex', alignItems: 'center' }}>
                <AccountOutline sx={{ mr: 2, fontSize: '1.125rem', color: 'text.secondary' }} />
                <Typography variant='body2'>5 Users</Typography>
              </Box>
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
                <CloudOutline sx={{ mr: 2, fontSize: '1.125rem', color: 'text.secondary' }} />
                <Typography variant='body2'>10 GB storage</Typography>
              </Box>
              <Box sx={{ mb: 6.75, display: 'flex', alignItems: 'center' }}>
                <HelpCircleOutline sx={{ mr: 2, fontSize: '1.125rem', color: 'text.secondary' }} />
                <Typography variant='body2'>Basic Support</Typography>
              </Box>
              <Button fullWidth variant='contained'>
                Upgrade Plan
              </Button>
            </Box>
          </StyledGrid>

          <Grid item xs={12} sx={{ mt: paymentMethod === 'card' ? 3 : undefined }}>
            <Button variant='contained' sx={{ mr: 3.5 }}>
              Save Changes
            </Button>
            <Button
              type='reset'
              variant='outlined'
              color='secondary'
              onClick={() => {
                setCvc('')
                setName('')
                setExpiry('')
                setCardNumber('')
              }}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </form>
    </CardContent>
  )
}

export default TabBilling
