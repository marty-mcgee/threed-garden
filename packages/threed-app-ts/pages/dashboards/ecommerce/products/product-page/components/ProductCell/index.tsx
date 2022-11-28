// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'
import MDTypography from '#/lib/mui/MDTypography'
import MDAvatar from '#/lib/mui/MDAvatar'
import { StaticImageData } from 'next/image'

// Declaring props types for ProductCell
interface Props {
  image: StaticImageData
  name: string
}

function ProductCell({ image, name }: Props): JSX.Element {
  return (
    <MDBox
      display='flex'
      alignItems='center'
      pr={2}
    >
      <MDBox mr={2}>
        <MDAvatar
          src={image.src}
          alt={name}
        />
      </MDBox>
      <MDTypography
        variant='button'
        fontWeight='medium'
      >
        {name}
      </MDTypography>
    </MDBox>
  )
}

export default ProductCell
