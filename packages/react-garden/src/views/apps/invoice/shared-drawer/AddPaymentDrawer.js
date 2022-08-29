// ** React Imports
import { useState, forwardRef } from 'react'

// ** MUI Imports
import Drawer from '@mui/material/Drawer'
import Button from '@mui/material/Button'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import InputLabel from '@mui/material/InputLabel'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'

// ** Third Party Imports
import Cleave from 'cleave.js/react'
import DatePicker from 'react-datepicker'

// ** Icons Imports
import Close from 'mdi-material-ui/Close'

// ** Styled Component
import CleaveWrapper from 'src/@core/styles/libs/react-cleave'
import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'

// ** Third Party Styles Imports
import 'react-datepicker/dist/react-datepicker.css'

const CustomInput = forwardRef(({ ...props }, ref) => {
  return <TextField inputRef={ref} {...props} />
})

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3, 4),
  justifyContent: 'space-between',
  backgroundColor: theme.palette.background.default
}))

const EditInvoiceDrawer = ({ open, toggle }) => {
  // ** State
  const [date, setDate] = useState(new Date())

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={toggle}
      variant='temporary'
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: [300, 400] } }}
    >
      <Header>
        <Typography variant='h6'>Add Payment</Typography>
        <Close fontSize='small' onClick={toggle} sx={{ cursor: 'pointer' }} />
      </Header>
      <Box sx={{ p: 5 }}>
        <Box sx={{ mb: 6 }}>
          <InputLabel htmlFor='invoice-balance'>Invoice Balance</InputLabel>
          <TextField fullWidth id='invoice-balance' InputProps={{ disabled: true }} defaultValue='5000.00' />
        </Box>
        <Box sx={{ mb: 6 }}>
          <CleaveWrapper>
            <InputLabel htmlFor='invoice-payment-amt'>Payment Amount</InputLabel>
            <Cleave
              id='invoice-payment-amt'
              options={{ prefix: '$', numeral: true, numeralThousandsGroupStyle: 'thousand' }}
            />
          </CleaveWrapper>
        </Box>
        <Box sx={{ mb: 6 }}>
          <InputLabel htmlFor='invoice-payment-date'>Payment Date</InputLabel>
          <DatePickerWrapper sx={{ '& .MuiFormControl-root': { width: '100%' } }}>
            <DatePicker
              selected={date}
              id='invoice-payment-date'
              customInput={<CustomInput />}
              onChange={date => setDate(date)}
            />
          </DatePickerWrapper>
        </Box>
        <Box sx={{ mb: 6 }}>
          <InputLabel htmlFor='payment-method'>Payment Method</InputLabel>
          <FormControl fullWidth>
            <Select labelId='payment-method' id='payment-method-select' defaultValue='select-method'>
              <MenuItem value='select-method' disabled>
                Select Payment Method
              </MenuItem>
              <MenuItem value='Cash'>Cash</MenuItem>
              <MenuItem value='Bank Transfer'>Bank Transfer</MenuItem>
              <MenuItem value='Credit'>Credit</MenuItem>
              <MenuItem value='Debit'>Debit</MenuItem>
              <MenuItem value='Paypal'>Paypal</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ mb: 6 }}>
          <InputLabel htmlFor='payment-note'>Internal Payment Note</InputLabel>
          <TextField
            rows={6}
            multiline
            fullWidth
            id='payment-note'
            variant='outlined'
            placeholder='Internal Payment Note'
          />
        </Box>

        <Box>
          <Button size='large' variant='contained' onClick={toggle} sx={{ mr: 4 }}>
            Send
          </Button>
          <Button size='large' variant='outlined' color='secondary' onClick={toggle}>
            Cancel
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

export default EditInvoiceDrawer
