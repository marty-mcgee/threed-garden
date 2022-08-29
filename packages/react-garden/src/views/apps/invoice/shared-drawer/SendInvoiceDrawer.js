// ** MUI Imports
import Drawer from '@mui/material/Drawer'
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import FormControl from '@mui/material/FormControl'

// ** Icons Imports
import Close from 'mdi-material-ui/Close'
import Attachment from 'mdi-material-ui/Attachment'

// ** Custom Components Imports
import CustomChip from 'src/@core/components/mui/chip'

const Header = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3, 4),
  justifyContent: 'space-between',
  backgroundColor: theme.palette.background.default
}))

const SendInvoiceDrawer = ({ open, toggle }) => {
  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={toggle}
      sx={{ '& .MuiDrawer-paper': { width: [300, 400] } }}
      ModalProps={{ keepMounted: true }}
    >
      <Header>
        <Typography variant='h6'>Send Invoice</Typography>
        <Close fontSize='small' onClick={toggle} sx={{ cursor: 'pointer' }} />
      </Header>
      <Box sx={{ p: 5 }}>
        <FormControl fullWidth sx={{ mb: 6 }}>
          <TextField type='email' label='From' variant='outlined' defaultValue='shelbyComapny@email.com' />
        </FormControl>
        <FormControl fullWidth sx={{ mb: 6 }}>
          <TextField type='email' label='To' variant='outlined' defaultValue='qConsolidated@email.com' />
        </FormControl>
        <FormControl fullWidth sx={{ mb: 6 }}>
          <TextField label='Subject' variant='outlined' defaultValue='Invoice of purchased Admin Templates' />
        </FormControl>
        <FormControl fullWidth sx={{ mb: 6 }}>
          <TextField
            rows={10}
            multiline
            label='Message'
            type='textarea'
            variant='outlined'
            defaultValue={`Dear Queen Consolidated,

Thank you for your business, always a pleasure to work with you!

We have generated a new invoice in the amount of $95.59

We would appreciate payment of this invoice by 05/11/2019`}
          />
        </FormControl>
        <Box sx={{ mb: 6 }}>
          <CustomChip
            size='small'
            skin='light'
            color='primary'
            label='Invoice Attached'
            sx={{ borderRadius: '5px' }}
            icon={<Attachment fontSize='small' />}
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

export default SendInvoiceDrawer
