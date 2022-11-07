// ** MUI Imports
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import { alpha, styled } from '@mui/material/styles'
import MuiInputBase from '@mui/material/InputBase'

// Styled InputBase component
const InputBase = styled(MuiInputBase)(({ theme }) => ({
  marginTop: theme.spacing(4),
  '& .MuiInputBase-input': {
    fontSize: 16,
    width: 'auto',
    borderRadius: 4,
    padding: '10px 12px',
    position: 'relative',
    backgroundColor: theme.palette.background.paper,
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    border: theme.palette.mode === 'light' ? '1px solid #ced4da' : `1px solid ${theme.palette.divider}`,
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"'
    ].join(','),
    '&:focus': {
      borderColor: theme.palette.primary.main,
      boxShadow: `${alpha(theme.palette.primary.main, 0.25)} 0 0 0 0.2rem`
    }
  }
}))

const TextFieldCustomized = () => {
  return (
    <form noValidate autoComplete='off'>
      <FormControl variant='standard'>
        <InputLabel shrink htmlFor='bootstrap-input' sx={{ transform: 'translate(0, -4px) scale(0.75)' }}>
          Bootstrap
        </InputLabel>
        <InputBase defaultValue='react-bootstrap' id='bootstrap-input' />
      </FormControl>
    </form>
  )
}

export default TextFieldCustomized
