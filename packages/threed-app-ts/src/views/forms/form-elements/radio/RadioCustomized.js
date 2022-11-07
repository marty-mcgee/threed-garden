// ** MUI Imports
import { styled } from '@mui/material/styles'
import FormLabel from '@mui/material/FormLabel'
import RadioGroup from '@mui/material/RadioGroup'
import FormControl from '@mui/material/FormControl'
import Radio from '@mui/material/Radio'
import FormControlLabel from '@mui/material/FormControlLabel'

const BpIcon = styled('span')(({ theme }) => ({
  width: 16,
  height: 16,
  borderRadius: '50%',
  backgroundColor: theme.palette.mode === 'dark' ? '#394b59' : '#f5f8fa',
  'input:hover ~ &': {
    backgroundColor: theme.palette.mode === 'dark' ? '#30404d' : '#ebf1f5'
  },
  '.Mui-focusVisible &': {
    outlineOffset: 2,
    outline: '2px auto rgba(19,124,189,.6)'
  },
  'input:disabled ~ &': {
    boxShadow: 'none',
    background: theme.palette.mode === 'dark' ? 'rgba(57,75,89,.5)' : 'rgba(206,217,224,.5)'
  },
  boxShadow:
    theme.palette.mode === 'dark'
      ? '0 0 0 1px rgb(16 22 26 / 40%)'
      : 'inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)',
  backgroundImage:
    theme.palette.mode === 'dark'
      ? 'linear-gradient(180deg,hsla(0,0%,100%,.05),hsla(0,0%,100%,0))'
      : 'linear-gradient(180deg,hsla(0,0%,100%,.8),hsla(0,0%,100%,0))'
}))

const BpCheckedIcon = styled(BpIcon)({
  backgroundColor: '#137cbd',
  backgroundImage: 'linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))',
  'input:hover ~ &': {
    backgroundColor: '#106ba3'
  },
  '&:before': {
    width: 16,
    height: 16,
    content: '""',
    display: 'block',
    backgroundImage: 'radial-gradient(#fff,#fff 28%,transparent 32%)'
  }
})

// Inspired by blueprintjs
const BpRadio = props => {
  return (
    <Radio
      {...props}
      disableRipple
      color='default'
      icon={<BpIcon />}
      checkedIcon={<BpCheckedIcon />}
      sx={{ '&:hover': { backgroundColor: 'transparent' } }}
    />
  )
}

const RadioCustomized = () => {
  return (
    <FormControl>
      <FormLabel component='legend'>Gender</FormLabel>
      <RadioGroup row defaultValue='female' aria-label='gender' name='customized-radios'>
        <FormControlLabel value='female' control={<BpRadio />} label='Female' />
        <FormControlLabel value='male' control={<BpRadio />} label='Male' />
        <FormControlLabel value='other' control={<BpRadio />} label='Other' />
        <FormControlLabel value='disabled' disabled control={<BpRadio />} label='Disabled' />
      </RadioGroup>
    </FormControl>
  )
}

export default RadioCustomized
