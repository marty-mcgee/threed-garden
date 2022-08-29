// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Grid from '@mui/material/Grid'
import Radio from '@mui/material/Radio'
import Select from '@mui/material/Select'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import MenuItem from '@mui/material/MenuItem'
import { styled } from '@mui/material/styles'
import Accordion from '@mui/material/Accordion'
import TextField from '@mui/material/TextField'
import FormLabel from '@mui/material/FormLabel'
import Typography from '@mui/material/Typography'
import InputLabel from '@mui/material/InputLabel'
import RadioGroup from '@mui/material/RadioGroup'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import FormControlLabel from '@mui/material/FormControlLabel'

// ** Third Party Imports
import Payment from 'payment'
import Cards from 'react-credit-cards'

// ** Icons Imports
import ChevronDown from 'mdi-material-ui/ChevronDown'

// ** Styled Component Imports
import CardWrapper from 'src/@core/styles/libs/react-credit-cards'

// ** Util Import
import { formatCVC, formatExpirationDate, formatCreditCardNumber } from 'src/@core/utils/format'

// ** Styles Import
import 'react-credit-cards/es/styles-compiled.css'

// Styled component for the Box wrappers in Delivery Options' accordion
const BoxWrapper = styled(Box)(({ theme }) => ({
  borderWidth: 1,
  display: 'flex',
  cursor: 'pointer',
  borderStyle: 'solid',
  padding: theme.spacing(5),
  borderColor: theme.palette.divider,
  '&:first-of-type': {
    borderTopLeftRadius: theme.shape.borderRadius,
    borderTopRightRadius: theme.shape.borderRadius
  },
  '&:last-of-type': {
    borderBottomLeftRadius: theme.shape.borderRadius,
    borderBottomRightRadius: theme.shape.borderRadius
  }
}))

const FormLayoutsCollapsible = () => {
  // ** States
  const [cvc, setCvc] = useState('')
  const [name, setName] = useState('')
  const [focus, setFocus] = useState('')
  const [expiry, setExpiry] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [option, setOption] = useState('standard')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [expanded, setExpanded] = useState('panel1')

  const handleChange = panel => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false)
  }
  const handleBlur = () => setFocus('')

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
    <form onSubmit={e => e.preventDefault()}>
      <Accordion expanded={expanded === 'panel1'} onChange={handleChange('panel1')}>
        <AccordionSummary
          expandIcon={<ChevronDown />}
          id='form-layouts-collapsible-header-1'
          aria-controls='form-layouts-collapsible-content-1'
        >
          <Typography variant='subtitle1' sx={{ fontWeight: 500 }}>
            Delivery Address
          </Typography>
        </AccordionSummary>
        <Divider sx={{ m: 0 }} />
        <AccordionDetails>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label='Full Name' placeholder='Leonard Carter' />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label='Phone No.' placeholder='+1-123-456-8790' />
            </Grid>
            <Grid item xs={12}>
              <TextField multiline rows={3} fullWidth label='Address' placeholder='1456, Liberty Street' />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type='number' label='ZIP Code' placeholder='10005' />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label='Landmark' placeholder='Nr. Wall Street' />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label='City' placeholder='New York' />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='form-layouts-collapsible-select-label'>Country</InputLabel>
                <Select
                  label='Country'
                  defaultValue=''
                  id='form-layouts-collapsible-select'
                  labelId='form-layouts-collapsible-select-label'
                >
                  <MenuItem value='UK'>UK</MenuItem>
                  <MenuItem value='USA'>USA</MenuItem>
                  <MenuItem value='Australia'>Australia</MenuItem>
                  <MenuItem value='Germany'>Germany</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl>
                <FormLabel>Address Type</FormLabel>
                <RadioGroup
                  row
                  defaultValue='home'
                  aria-label='address type'
                  name='form-layouts-collapsible-address-radio'
                >
                  <FormControlLabel value='home' control={<Radio />} label='Home (All day delivery)' />
                  <FormControlLabel value='office' control={<Radio />} label='Office (Delivery between 10 AM - 5 PM)' />
                </RadioGroup>
              </FormControl>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'panel2'} onChange={handleChange('panel2')}>
        <AccordionSummary
          expandIcon={<ChevronDown />}
          id='form-layouts-collapsible-header-2'
          aria-controls='form-layouts-collapsible-content-2'
        >
          <Typography variant='subtitle1' sx={{ fontWeight: 500 }}>
            Delivery Options
          </Typography>
        </AccordionSummary>
        <Divider sx={{ m: 0 }} />
        <AccordionDetails sx={{ pt: 6, pb: 6 }}>
          <BoxWrapper
            onClick={() => setOption('standard')}
            sx={option === 'standard' ? { borderColor: 'primary.main' } : {}}
          >
            <Radio
              value='standard'
              checked={option === 'standard'}
              name='form-layouts-collapsible-options-radio'
              inputProps={{ 'aria-label': 'Standard Delivery' }}
              sx={{ mr: 2, ml: -2.5, mt: -2.5, alignItems: 'flex-start' }}
            />
            <Box sx={{ width: '100%' }}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 600 }}>Standard 3-5 Days</Typography>
                <Typography sx={{ fontWeight: 700 }}>Free</Typography>
              </Box>
              <Typography variant='body2'>Friday, 15 Nov - Monday, 18 Nov</Typography>
            </Box>
          </BoxWrapper>
          <BoxWrapper
            onClick={() => setOption('express')}
            sx={option === 'express' ? { borderColor: 'primary.main' } : {}}
          >
            <Radio
              value='express'
              checked={option === 'express'}
              name='form-layouts-collapsible-options-radio'
              inputProps={{ 'aria-label': 'Express Delivery' }}
              sx={{ mr: 2, ml: -2.5, mt: -2.5, alignItems: 'flex-start' }}
            />
            <Box sx={{ width: '100%' }}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 600 }}>Express</Typography>
                <Typography sx={{ fontWeight: 700 }}>$5.00</Typography>
              </Box>
              <Typography variant='body2'>Friday, 15 Nov - Sunday, 17 Nov</Typography>
            </Box>
          </BoxWrapper>
          <BoxWrapper
            onClick={() => setOption('overnight')}
            sx={option === 'overnight' ? { borderColor: 'primary.main' } : {}}
          >
            <Radio
              value='overnight'
              checked={option === 'overnight'}
              name='form-layouts-collapsible-options-radio'
              inputProps={{ 'aria-label': 'Overnight Delivery' }}
              sx={{ mr: 2, ml: -2.5, mt: -2.5, alignItems: 'flex-start' }}
            />
            <Box sx={{ width: '100%' }}>
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 600 }}>Overnight</Typography>
                <Typography sx={{ fontWeight: 700 }}>$10.00</Typography>
              </Box>
              <Typography variant='body2'>Friday, 15 Nov - Saturday, 16 Nov</Typography>
            </Box>
          </BoxWrapper>
        </AccordionDetails>
      </Accordion>

      <Accordion expanded={expanded === 'panel3'} onChange={handleChange('panel3')}>
        <AccordionSummary
          expandIcon={<ChevronDown />}
          id='form-layouts-collapsible-header-3'
          aria-controls='form-layouts-collapsible-content-3'
        >
          <Typography variant='subtitle1' sx={{ fontWeight: 500 }}>
            Payment Method
          </Typography>
        </AccordionSummary>
        <Divider sx={{ m: 0 }} />
        <AccordionDetails>
          <Grid container spacing={5}>
            <Grid item xs={12}>
              <Grid container spacing={6}>
                <Grid item xs={12}>
                  <RadioGroup
                    row
                    value={paymentMethod}
                    aria-label='payment type'
                    name='form-layouts-collapsible-payment-radio'
                    onChange={e => setPaymentMethod(e.target.value)}
                  >
                    <FormControlLabel value='card' control={<Radio />} label='Credit/Debit/ATM Card' />
                    <FormControlLabel value='cash' control={<Radio />} label='Cash on Delivery' />
                  </RadioGroup>
                </Grid>
                {paymentMethod === 'card' ? (
                  <Grid item xs={12}>
                    <Grid container spacing={6}>
                      <Grid item xs={12}>
                        <CardWrapper>
                          <Cards cvc={cvc} focused={focus} expiry={expiry} name={name} number={cardNumber} />
                        </CardWrapper>
                      </Grid>
                      <Grid item xs={12} md={8} xl={6} sx={{ mt: 2 }}>
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
                      </Grid>
                    </Grid>
                  </Grid>
                ) : null}
              </Grid>
            </Grid>
          </Grid>
        </AccordionDetails>
        <Divider sx={{ m: 0 }} />
        <AccordionDetails>
          <Button size='large' type='submit' variant='contained' sx={{ mr: 4 }}>
            Place Order
          </Button>
          <Button size='large' variant='outlined'>
            Cancel
          </Button>
        </AccordionDetails>
      </Accordion>
    </form>
  )
}

export default FormLayoutsCollapsible
