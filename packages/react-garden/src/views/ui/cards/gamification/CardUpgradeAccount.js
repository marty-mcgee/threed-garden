// ** MUI Imports
import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'

// ** Hook
import { useSettings } from 'src/@core/hooks/useSettings'

// Styled component for the triangle shaped background image
const TriangleImg = styled('img')(({ theme }) => ({
  right: 0,
  bottom: 0,
  width: '10.375rem',
  position: 'absolute',
  ...(theme.direction === 'rtl' ? { transform: 'scaleX(-1)' } : {})
}))

// Styled component for the avatar image
const AvatarImg = styled('img')({
  right: 49,
  bottom: 10,
  height: '11rem',
  position: 'absolute'
})

const CardUpgradeAccount = () => {
  // ** Hook
  const { settings } = useSettings()
  const imageSrc = settings.mode === 'light' ? 'triangle-light.png' : 'triangle-dark.png'

  return (
    <Card sx={{ position: 'relative' }}>
      <CardContent>
        <Typography variant='h6'>Upgrade Account 👩🏻‍💻</Typography>
        <Typography variant='body2'>Add 15 team members</Typography>
        <Typography variant='h5' sx={{ color: 'primary.main', fontWeight: 600, mt: 3.5 }}>
          $199
        </Typography>
        <Typography variant='body2' sx={{ mb: 4.25 }}>
          40% OFF 🤩
        </Typography>
        <Button size='small' variant='contained'>
          Upgrade Plan
        </Button>
        <TriangleImg alt='triangle background' src={`/images/misc/${imageSrc}`} />
        <AvatarImg alt='Upgrade Account' src='/images/cards/pose-m-9.png' />
      </CardContent>
    </Card>
  )
}

export default CardUpgradeAccount
