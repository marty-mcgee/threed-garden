// ** MUI Imports
import Grid from '@mui/material/Grid'

// ** Demo Components Imports
import MUIPickers from '#/ui/forms/form-elements/pickers/mui-pickers'
import ReactDatePicker from '#/ui/forms/form-elements/pickers/react-datepicker'

// ** Third Party Styles Imports
// import 'react-datepicker/dist/react-datepicker.css'

const Pickers = () => {
  return (
    <Grid container spacing={6} className='match-height'>
      <Grid item xs={12}>
        <MUIPickers />
      </Grid>
      <Grid item xs={12}>
        <ReactDatePicker />
      </Grid>
    </Grid>
  )
}

export default Pickers
