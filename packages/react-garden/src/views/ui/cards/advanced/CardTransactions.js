// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'

// ** Icons Imports
import ChevronUp from 'mdi-material-ui/ChevronUp'
import ChevronDown from 'mdi-material-ui/ChevronDown'
import DotsVertical from 'mdi-material-ui/DotsVertical'

// ** Custom Components Imports
import CustomAvatar from 'src/@core/components/mui/avatar'

const data = [
  {
    imgWidth: 20,
    imgHeight: 22,
    title: 'Paypal',
    imgAlt: 'paypal',
    amount: '+$24,820',
    avatarColor: 'error',
    subtitle: 'Received Money',
    imgSrc: '/images/cards/paypal.png',
    trend: <ChevronUp sx={{ color: 'success.main' }} />
  },
  {
    imgWidth: 20,
    imgHeight: 15,
    amount: '-$1,250',
    title: 'Credit Card',
    imgAlt: 'credit-card',
    avatarColor: 'success',
    subtitle: 'Digital Ocean',
    imgSrc: '/images/cards/credit-card.png',
    trend: <ChevronDown sx={{ color: 'error.main' }} />
  },
  {
    imgWidth: 20,
    imgHeight: 15,
    amount: '-$99',
    imgAlt: 'atm-card',
    title: 'Mastercard',
    subtitle: 'Netflix',
    avatarColor: 'warning',
    imgSrc: '/images/cards/atm-card.png',
    trend: <ChevronDown sx={{ color: 'error.main' }} />
  },
  {
    imgWidth: 20,
    imgHeight: 18,
    amount: '-$82',
    title: 'Wallet',
    imgAlt: 'wallet',
    subtitle: "Mac'D",
    avatarColor: 'primary',
    imgSrc: '/images/cards/wallet.png',
    trend: <ChevronDown sx={{ color: 'error.main' }} />
  },
  {
    imgWidth: 20,
    imgHeight: 12,
    title: 'Transfer',
    amount: '+$8,349',
    subtitle: 'Refund',
    avatarColor: 'info',
    imgAlt: 'arrow-growth',
    imgSrc: '/images/cards/arrow-growth.png',
    trend: <ChevronUp sx={{ color: 'success.main' }} />
  },
  {
    imgWidth: 20,
    imgHeight: 18,
    title: 'Wallet',
    amount: '-$124',
    imgAlt: 'wallet',
    subtitle: 'Buy Watch',
    avatarColor: 'primary',
    imgSrc: '/images/cards/wallet.png',
    trend: <ChevronDown sx={{ color: 'error.main' }} />
  }
]

const CardTransactions = () => {
  return (
    <Card>
      <CardHeader
        title='Transactions'
        action={
          <IconButton size='small' aria-label='settings' className='card-more-options' sx={{ color: 'text.secondary' }}>
            <DotsVertical />
          </IconButton>
        }
      />
      <CardContent>
        {data.map((item, index) => {
          return (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                mb: index !== data.length - 1 ? 7 : undefined
              }}
            >
              <CustomAvatar skin='light' color={item.avatarColor} variant='rounded' sx={{ mr: 3 }}>
                <img alt={item.imgAlt} src={item.imgSrc} width={item.imgWidth} height={item.imgHeight} />
              </CustomAvatar>
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <Box sx={{ mr: 2, display: 'flex', flexDirection: 'column' }}>
                  <Typography sx={{ mb: 0.5, fontWeight: 600, fontSize: '0.875rem' }}>{item.title}</Typography>
                  <Typography variant='caption'>{item.subtitle}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ mr: 1, fontWeight: 600 }}>{item.amount}</Typography>
                  {item.trend}
                </Box>
              </Box>
            </Box>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default CardTransactions
