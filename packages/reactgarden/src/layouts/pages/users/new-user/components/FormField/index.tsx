// formik components
import { ErrorMessage, Field } from "formik"

// ThreeD Garden components
import MDBox from "~/components/MDBox"
import MDTypography from "~/components/MDTypography"
import MDInput from "~/components/MDInput"

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
        variant="standard"
        label={label}
        fullWidth
      />
      <MDBox mt={0.75}>
        <MDTypography
          component="div"
          variant="caption"
          color="error"
          fontWeight="regular">
          {/* <ErrorMessage name={name} /> */} ErrorMessage fails type check
        </MDTypography>
      </MDBox>
    </MDBox>
  )
}

export default FormField
