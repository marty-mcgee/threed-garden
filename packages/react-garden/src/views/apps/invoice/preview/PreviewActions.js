// ** Next Import
import Link from 'next/link'

// ** MUI Imports
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import CardContent from '@mui/material/CardContent'

// ** Icons Imports
import SendOutline from 'mdi-material-ui/SendOutline'
import CurrencyUsd from 'mdi-material-ui/CurrencyUsd'

const PreviewActions = ({ id, toggleSendInvoiceDrawer, toggleAddPaymentDrawer }) => {
  return (
    <Card>
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
        <Link href={`/apps/invoice/edit/${id}`} passHref>
          <Button fullWidth component='a' sx={{ mb: 3.5 }} color='secondary' variant='outlined'>
            Edit Invoice
          </Button>
        </Link>
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
  )
}

export default PreviewActions
