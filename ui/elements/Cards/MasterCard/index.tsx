// @mui material components
import type { Theme } from '@mui/material/styles'
import Card from '@mui/material/Card'
import Icon from '@mui/material/Icon'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'

// Images
import pattern from '#/lib/assets/images/illustrations/pattern-tree.svg'
import masterCardLogo from '#/lib/assets/images/logos/mastercard.png'

interface Props {
  color?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error' | 'dark'
  number: number
  holder: string
  expires: string
  [key: string]: any
}

function MasterCard({ color, number, holder, expires }: Props): JSX.Element {
  const numbers: string[] = [...`${number}`]

  if (numbers.length < 16 || numbers.length > 16) {
    throw new Error(
      "Invalid value for the prop number, the value for the number prop shouldn't be greater than or less than 16 digits"
    )
  }

  const num1 = numbers.slice(0, 4).join('')
  const num2 = numbers.slice(4, 8).join('')
  const num3 = numbers.slice(8, 12).join('')
  const num4 = numbers.slice(12, 16).join('')

  return (
    <Card
      sx={({ palette: { gradients }, functions: { linearGradient }, boxShadows: { xl } }: Theme) => ({
        background: gradients[color]
          ? linearGradient(gradients[color].main, gradients[color].state)
          : linearGradient(gradients.dark.main, gradients.dark.state),
        boxShadow: xl,
        position: 'relative',
      })}
    >
      <MDBox
        position='absolute'
        top={0}
        left={0}
        width='100%'
        height='100%'
        opacity={0.2}
        sx={{
          backgroundImage: `url(${pattern.src})`,
          backgroundSize: 'cover',
          borderRadius: 5,
        }}
      />
      <MDBox
        position='relative'
        zIndex={2}
        px={4}
        py={2}
      >
        <MDBox
          color='white'
          p={1}
          lineHeight={0}
          display='inline-block'
        >
          <Icon>wifi</Icon>
        </MDBox>
        <MDTypography
          variant='h5'
          color='white'
          fontWeight='medium'
          sx={{ mt: 3, mb: 5, pb: 1 }}
        >
          {num1}&nbsp;&nbsp;{num2}&nbsp;&nbsp;{num3}&nbsp;&nbsp;{num4}
        </MDTypography>
        <MDBox
          display='flex'
          justifyContent='space-between'
          alignItems='center'
        >
          <MDBox
            display='flex'
            alignItems='center'
          >
            <MDBox
              mr={5}
              lineHeight={1}
            >
              <MDTypography
                variant='button'
                color='white'
                fontWeight='regular'
                opacity={0.8}
              >
                Card Holder
              </MDTypography>
              <MDTypography
                variant='h6'
                color='white'
                fontWeight='medium'
                textTransform='capitalize'
              >
                {holder}
              </MDTypography>
            </MDBox>
            <MDBox lineHeight={1}>
              <MDTypography
                variant='button'
                color='white'
                fontWeight='regular'
                opacity={0.8}
              >
                Expires
              </MDTypography>
              <MDTypography
                variant='h6'
                color='white'
                fontWeight='medium'
              >
                {expires}
              </MDTypography>
            </MDBox>
          </MDBox>
          <MDBox
            display='flex'
            justifyContent='flex-end'
            width='20%'
          >
            <MDBox
              component='img'
              src={masterCardLogo.src}
              alt='master card'
              width='60%'
              mt={1}
            />
          </MDBox>
        </MDBox>
      </MDBox>
    </Card>
  )
}

// Declaring default props for MasterCard
MasterCard.defaultProps = {
  color: 'dark',
}

export default MasterCard
