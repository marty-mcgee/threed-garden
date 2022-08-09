// react-quill components
import ReactQuill from "react-quill"

// react-quill styles
import "react-quill/dist/quill.snow.css"

// Custom styles for the MDEditor
import MDEditorRoot from "components/MDEditor/MDEditorRoot"

// Company Juice Dashboard context
import { useMaterialUIController } from "context"

// declaring types for the MDEditor
interface Props {
  [key: string]: any
}

function MDEditor(props: Props): JSX.Element {
  const [controller] = useMaterialUIController()
  const { darkMode } = controller

  return (
    <MDEditorRoot ownerState={{ darkMode }}>
      <ReactQuill theme="snow" {...props} />
    </MDEditorRoot>
  )
}

export default MDEditor
