// ** MUI Imports
import { styled } from '@mui/material/styles'
import Checkbox from '@mui/material/Checkbox'

const BpIcon = styled('span')(({ theme }) => ({
  width: 16,
  height: 16,
  borderRadius: 3,
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
    backgroundImage:
      "url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath" +
      " fill-rule='evenodd' clip-rule='evenodd' d='M12 5c-.28 0-.53.11-.71.29L7 9.59l-2.29-2.3a1.003 " +
      "1.003 0 00-1.42 1.42l3 3c.18.18.43.29.71.29s.53-.11.71-.29l5-5A1.003 1.003 0 0012 5z' fill='%23fff'/%3E%3C/svg%3E\")"
  }
})

// Inspired by blueprintjs
const BpCheckbox = props => {
  return (
    <Checkbox
      {...props}
      disableRipple
      color='default'
      icon={<BpIcon />}
      checkedIcon={<BpCheckedIcon />}
      inputProps={{ 'aria-label': 'Checkbox demo' }}
      sx={{ '&:hover': { backgroundColor: 'transparent' } }}
    />
  )
}

const CheckboxesCustomized = () => {
  return (
    <div>
      <BpCheckbox />
      <BpCheckbox defaultChecked />
      <BpCheckbox disabled />
    </div>
  )
}

export default CheckboxesCustomized
