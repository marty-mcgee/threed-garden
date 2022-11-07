// ** Next Import
import Link from 'next/link'

// ** MUI Imports
import Card from '@mui/material/Card'
import Select from '@mui/material/Select'
import Button from '@mui/material/Button'
import Switch from '@mui/material/Switch'
import MenuItem from '@mui/material/MenuItem'
import { styled } from '@mui/material/styles'
import InputLabel from '@mui/material/InputLabel'
import Box from '@mui/material/Box'
import CardContent from '@mui/material/CardContent'

// ** Icons Imports
import SendOutline from 'mdi-material-ui/SendOutline'
import CurrencyUsd from 'mdi-material-ui/CurrencyUsd'

const OptionsWrapper = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}))

const EditActions = ({ id, toggleSendInvoiceDrawer, toggleAddPaymentDrawer }) => {
  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Button
            fullWidth
            sx={{ mb: 3.5 }}
            variant='contained'
            startIcon={<SendOutline />}
            onClick={toggleSendInvoiceDrawer}
          >
            Send Invoice
          </Button>
          <Link href={`/apps/invoice/preview/${id}`} passHref>
            <Button fullWidth component='a' sx={{ mb: 3.5 }} color='secondary' variant='outlined'>
              Preview
            </Button>
          </Link>
          <Button fullWidth color='secondary' variant='outlined' sx={{ mb: 3.5 }}>
            Save
          </Button>
          <Button
            fullWidth
            color='success'
            variant='contained'
            startIcon={<CurrencyUsd />}
            onClick={toggleAddPaymentDrawer}
          >
            Add Payment
          </Button>
        </CardContent>
      </Card>

      <Select fullWidth defaultValue='Internet Banking' sx={{ mb: 4 }}>
        <MenuItem value='Internet Banking'>Internet Banking</MenuItem>
        <MenuItem value='Debit Card'>Debit Card</MenuItem>
        <MenuItem value='Credit Card'>Credit Card</MenuItem>
        <MenuItem value='Paypal'>Paypal</MenuItem>
        <MenuItem value='UPI Transfer'>UPI Transfer</MenuItem>
      </Select>
      <OptionsWrapper sx={{ mb: 1 }}>
        <InputLabel
          htmlFor='invoice-edit-payment-terms'
          sx={{ cursor: 'pointer', fontSize: '0.875rem', color: 'text.secondary' }}
        >
          Payment Terms
        </InputLabel>
        <Switch defaultChecked id='invoice-edit-payment-terms' />
      </OptionsWrapper>
      <OptionsWrapper sx={{ mb: 1 }}>
        <InputLabel
          htmlFor='invoice-edit-client-notes'
          sx={{ cursor: 'pointer', fontSize: '0.875rem', color: 'text.secondary' }}
        >
          Client Notes
        </InputLabel>
        <Switch id='invoice-edit-client-notes' />
      </OptionsWrapper>
      <OptionsWrapper>
        <InputLabel
          htmlFor='invoice-edit-payment-stub'
          sx={{ cursor: 'pointer', fontSize: '0.875rem', color: 'text.secondary' }}
        >
          Payment Stub
        </InputLabel>
        <Switch id='invoice-edit-payment-stub' />
      </OptionsWrapper>
    </Box>
  )
}

export default EditActions
