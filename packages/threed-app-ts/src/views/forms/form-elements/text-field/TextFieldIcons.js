// ** MUI Imports
import Grid from '@mui/material/Grid'
import Input from '@mui/material/Input'
import TextField from '@mui/material/TextField'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import InputAdornment from '@mui/material/InputAdornment'

// ** Icons Imports
import AccountCircleOutline from 'mdi-material-ui/AccountCircleOutline'

const TextFieldIcons = () => {
  return (
    <form className='demo-space-x' noValidate autoComplete='off'>
      <FormControl variant='standard'>
        <InputLabel htmlFor='input-with-icon-adornment'>With a start adornment</InputLabel>
        <Input
          id='input-with-icon-adornment'
          startAdornment={
            <InputAdornment position='start'>
              <AccountCircleOutline />
            </InputAdornment>
          }
        />
      </FormControl>
      <TextField
        label='TextField'
        variant='standard'
        id='input-with-icon-textfield'
        InputProps={{
          startAdornment: (
            <InputAdornment position='start'>
              <AccountCircleOutline />
            </InputAdornment>
          )
        }}
      />
      <div>
        <Grid container spacing={2} alignItems='flex-end'>
          <Grid item>
            <AccountCircleOutline sx={{ color: theme => theme.palette.action.active }} />
          </Grid>
          <Grid item>
            <TextField variant='standard' id='input-with-icon-grid' label='With a grid' />
          </Grid>
        </Grid>
      </div>
    </form>
  )
}

export default TextFieldIcons
