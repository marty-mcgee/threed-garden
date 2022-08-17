// ThreeD Garden components
import MDBox from "~/components/MDBox"
import MDTypography from "~/components/MDTypography"
import MDAvatar from "~/components/MDAvatar"

// Declaring props types for ProductCell
interface Props {
  image: string
  name: string
}

function ProductCell({ image, name }: Props): JSX.Element {
  return (
    <MDBox display="flex" alignItems="center" pr={2}>
      <MDBox mr={2}>
        <MDAvatar src={image} alt={name} />
      </MDBox>
      <MDTypography variant="button" fontWeight="medium">
        {name}
      </MDTypography>
    </MDBox>
  )
}

export default ProductCell
