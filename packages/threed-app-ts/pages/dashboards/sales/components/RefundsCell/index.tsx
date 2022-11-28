// @mui material components
import Icon from '@mui/material/Icon'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'

// Declaring props types for RefundsCell
interface Props {
  value: string | number
  icon: {
    color: 'info' | 'success' | 'warning' | 'error'
    name: string
  }
}

function RefundsCell({ value, icon }: Props): JSX.Element {
  return (
    <MDBox
      display='flex'
      justifyContent='center'
      alignItems='center'
      px={2}
    >
      <MDTypography
        variant='button'
        fontWeight='regular'
        color='text'
      >
        {value}
      </MDTypography>
      <MDBox
        color={icon.color}
        lineHeight={0}
      >
        <Icon
          sx={{ fontWeight: 'bold' }}
          fontSize='small'
        >
          {icon.name}
        </Icon>
      </MDBox>
    </MDBox>
  )
}

export default RefundsCell
