// formik components
import { ErrorMessage, Field } from 'formik'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'
import MDInput from '#/lib/mui/MDInput'

// Declaring props types for FormField
interface Props {
  label: string
  name: string
  [key: string]: any
}

function FormField({ label, name, ...rest }: Props): JSX.Element {
  return (
    <MDBox mb={1.5}>
      <Field
        {...rest}
        name={name}
        as={MDInput}
        variant='standard'
        label={label}
        fullWidth
      />
      <MDBox mt={0.75}>
        <MDTypography
          component='div'
          variant='caption'
          color='error'
          fontWeight='regular'
        >
          <ErrorMessage name={name} />
        </MDTypography>
      </MDBox>
    </MDBox>
  )
}

export default FormField
