import { useEffect, useRef } from 'react'

// Dropzone components
// new way [MM]
// import Dropzone from "dropzone"

// Dropzone styles

// ThreeD Garden components
import MDBox from '#/lib/mui/MDBox'

// Custom styles for the MDDropzone
import MDDropzoneRoot from '#/lib/mui/MDDropzone/MDDropzoneRoot'

// ThreeD Garden context
import { useMaterialUIController } from '#/ui/context'
import Dropzone from 'dropzone'

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
    // new way [MM]
    // Dropzone.autoDiscover = false

    // function createDropzone() {
    //   return new Dropzone(dropzoneRef.current, { ...options })
    // }
    async function createDropzone() {
      const Dropzone = (await import('dropzone')).default

      Dropzone.autoDiscover = false

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
      action='/file-upload'
      ref={dropzoneRef}
      className='form-control dropzone'
      ownerState={{ darkMode }}
    >
      <MDBox
        className='fallback'
        bgColor='transparent'
      >
        <input
          name='file'
          type='file'
          multiple
        />
      </MDBox>
    </MDDropzoneRoot>
  )
}

export default MDDropzone
