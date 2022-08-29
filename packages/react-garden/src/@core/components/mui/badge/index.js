// ** MUI Imports
import MuiBadge from '@mui/material/Badge'

// ** Hooks Imports
import useBgColor from 'src/@core/hooks/useBgColor'

const Badge = props => {
  // ** Props
  const { sx, skin, color } = props

  // ** Hook
  const bgColors = useBgColor()

  const colors = {
    primary: { ...bgColors.primaryLight },
    secondary: { ...bgColors.secondaryLight },
    success: { ...bgColors.successLight },
    error: { ...bgColors.errorLight },
    warning: { ...bgColors.warningLight },
    info: { ...bgColors.infoLight }
  }

  return (
    <MuiBadge
      {...props}
      sx={skin === 'light' && color ? Object.assign({ '& .MuiBadge-badge': colors[color] }, sx) : sx}
    />
  )
}

export default Badge
