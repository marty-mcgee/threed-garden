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

// Styled component for the trophy image
const TrophyImg = styled('img')({
  right: 35,
  bottom: 20,
  width: '5.188rem',
  position: 'absolute'
})

const CardAward = () => {
  // ** Hook
  const { settings } = useSettings()

  // ** Var
  const imageSrc = settings.mode === 'light' ? 'triangle-light.png' : 'triangle-dark.png'

  return (
    <Card sx={{ position: 'relative' }}>
      <CardContent>
        <Typography variant='h6'>Congratulations John! 🥳</Typography>
        <Typography variant='body2'>Best seller of the month</Typography>
        <Typography variant='h5' sx={{ mt: 3.5, color: 'primary.main' }}>
          $42.8k
        </Typography>
        <Typography variant='body2' sx={{ mb: 4.25 }}>
          78% of target 🚀
        </Typography>
        <Button size='small' variant='contained'>
          View Sales
        </Button>
        <TriangleImg alt='triangle background' src={`/images/misc/${imageSrc}`} />
        <TrophyImg alt='trophy' src='/images/misc/trophy.png' />
      </CardContent>
    </Card>
  )
}

export default CardAward
