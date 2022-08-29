// ** MUI Imports
import MuiChip from '@mui/material/Chip'

// ** Hooks Imports
import useBgColor from 'src/@core/hooks/useBgColor'

const Chip = props => {
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
    <MuiChip
      {...props}
      variant='filled'
      {...(skin === 'light' && { className: 'MuiChip-light' })}
      sx={skin === 'light' && color ? Object.assign(colors[color], sx) : sx}
    />
  )
}

export default Chip
