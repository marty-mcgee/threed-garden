import { useState } from "react"

// react-images-viewer components
import ImgsViewer from "react-images-viewer"

// @mui material components
import Stack from "@mui/material/Stack"

// ThreeD Garden components
import MDBox from "~/components/MDBox"

// Images
import image1 from "~/assets/images/products/product-details-1.jpg"
import image2 from "~/assets/images/products/product-details-2.jpg"
import image3 from "~/assets/images/products/product-details-3.jpg"
import image4 from "~/assets/images/products/product-details-4.jpg"
import image5 from "~/assets/images/products/product-details-5.jpg"

function ProductImages(): JSX.Element {
  const [currentImage, setCurrentImage] = useState<string>(image1)
  const [imgsViewer, setImgsViewer] = useState<boolean | number>(false)
  const [imgsViewerCurrent, setImgsViewerCurrent] = useState<number>(0)

  const handleSetCurrentImage = ({ currentTarget }: any) => {
    setCurrentImage(currentTarget.src)
    setImgsViewerCurrent(Number(currentTarget.id))
  }

  const openImgsViewer = () => setImgsViewer(true)
  const closeImgsViewer = () => setImgsViewer(false)
  const imgsViewerNext = () => setImgsViewerCurrent(imgsViewerCurrent + 1)
  const imgsViewerPrev = () => setImgsViewerCurrent(imgsViewerCurrent - 1)

  return (
    <MDBox>
      <ImgsViewer
        imgs={[
          { src: image1 },
          { src: image2 },
          { src: image3 },
          { src: image4 },
          { src: image5 },
        ]}
        isOpen={imgsViewer}
        onClose={closeImgsViewer}
        currImg={imgsViewerCurrent}
        onClickPrev={imgsViewerPrev}
        onClickNext={imgsViewerNext}
        backdropCloseable
      />

      <MDBox
        component="img"
        src={currentImage}
        alt="Product Image"
        shadow="lg"
        borderRadius="lg"
        width="100%"
        onClick={openImgsViewer}
      />
      <MDBox mt={2} pt={1}>
        <Stack direction="row" spacing={3}>
          <MDBox
            component="img"
            id="0"
            src={image1}
            alt="small image 1"
            borderRadius="lg"
            shadow="md"
            width="100%"
            height="5rem"
            minHeight="5rem"
            sx={{ cursor: "pointer", objectFit: "cover" }}
            onClick={handleSetCurrentImage}
          />
          <MDBox
            component="img"
            id="1"
            src={image2}
            alt="small image 2"
            borderRadius="lg"
            shadow="md"
            width="100%"
            height="5rem"
            minHeight="5rem"
            sx={{ cursor: "pointer", objectFit: "cover" }}
            onClick={handleSetCurrentImage}
          />
          <MDBox
            component="img"
            id="2"
            src={image3}
            alt="small image 3"
            borderRadius="lg"
            shadow="md"
            width="100%"
            height="5rem"
            minHeight="5rem"
            sx={{ cursor: "pointer", objectFit: "cover" }}
            onClick={handleSetCurrentImage}
          />
          <MDBox
            component="img"
            id="3"
            src={image4}
            alt="small image 4"
            borderRadius="lg"
            shadow="md"
            width="100%"
            height="5rem"
            minHeight="5rem"
            sx={{ cursor: "pointer", objectFit: "cover" }}
            onClick={handleSetCurrentImage}
          />
          <MDBox
            component="img"
            id="4"
            src={image5}
            alt="small image 5"
            borderRadius="lg"
            shadow="md"
            width="100%"
            height="5rem"
            minHeight="5rem"
            sx={{ cursor: "pointer", objectFit: "cover" }}
            onClick={handleSetCurrentImage}
          />
        </Stack>
      </MDBox>
    </MDBox>
  )
}

export default ProductImages
