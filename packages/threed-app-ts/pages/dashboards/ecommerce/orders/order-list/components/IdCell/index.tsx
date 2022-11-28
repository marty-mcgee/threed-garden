// @mui material components
import Checkbox from '@mui/material/Checkbox'

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'

// Declaring props types for IdCell
interface Props {
  id: string
  checked?: boolean
}

function IdCell({ id, checked }: Props): JSX.Element {
  return (
    <MDBox
      display='flex'
      alignItems='center'
    >
      <Checkbox defaultChecked={checked} />
      <MDBox ml={1}>
        <MDTypography
          variant='caption'
          fontWeight='medium'
          color='text'
        >
          {id}
        </MDTypography>
      </MDBox>
    </MDBox>
  )
}

// Declaring default props for IdCell
IdCell.defaultProps = {
  checked: false,
}

export default IdCell
