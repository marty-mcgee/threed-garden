import { useEffect, useRef } from "react"

// Dropzone components
import Dropzone from "dropzone"

// Dropzone styles
import "dropzone/dist/dropzone.css"

// Company Juice Dashboard components
import MDBox from "components/MDBox"

// Custom styles for the MDDropzone
import MDDropzoneRoot from "components/MDDropzone/MDDropzoneRoot"

// Company Juice Dashboard context
import { useMaterialUIController } from "context"

// Declaring props types for MDDropzone
interface Props {
  options: {
    [key: string | number]: any
  }
}

function MDDropzone({ options }: Props): JSX.Element {
  const [controller] = useMaterialUIController()
  const { darkMode } = controller

  const dropzoneRef = useRef<HTMLFormElement | null>(null)

  useEffect(() => {
    Dropzone.autoDiscover = false

    function createDropzone() {
      return new Dropzone(dropzoneRef.current, { ...options })
    }

    function removeDropzone() {
      if (Dropzone.instances.length > 0) Dropzone.instances.forEach((dz: any) => dz.destroy())
    }

    createDropzone()

    return () => removeDropzone()
  }, [options])

  return (
    <MDDropzoneRoot
      action="/file-upload"
      ref={dropzoneRef}
      className="form-control dropzone"
      ownerState={{ darkMode }}
    >
      <MDBox className="fallback" bgColor="transparent">
        <input name="file" type="file" multiple />
      </MDBox>
    </MDDropzoneRoot>
  )
}

export default MDDropzone
