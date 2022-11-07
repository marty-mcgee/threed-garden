// react-quill components
// import ReactQuill from "react-quill"

// react-quill -- new way for nextjs [MM]
// https://dev.to/a7u/reactquill-with-nextjs-478b
import { useState, useRef } from "react"
import dynamic from 'next/dynamic'

// react-quill styles
// import "react-quill/dist/quill.snow.css"

// Custom styles for the MDEditor
import MDEditorRoot from "~/components/mui/MDEditor/MDEditorRoot"

// ThreeD Garden context
import { useMaterialUIController } from "~/context"

// declaring types for the MDEditor
interface Props {
  [key: string]: any
}

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false })
// ref does not work with dynamic import. you can use this
// const QuillNoSSRWrapper = dynamic(
//   async () => {
//     const { default: RQ } = await import('react-quill')
//     // eslint-disable-next-line react/display-name
//     return ({ forwardedRef, ...props }) => <RQ ref={forwardedRef} {...props} />
//   },
//   { ssr: false }
// )
// const quillRef = useRef(null)

function MDEditor(props: Props): JSX.Element {
  const [controller] = useMaterialUIController()
  const { darkMode } = controller

  const [quillValue, setQuillValue] = useState('')

  return (
    <MDEditorRoot ownerState={{ darkMode }}>
      {/* <ReactQuill theme="snow" {...props} /> */}
      <ReactQuill theme="snow" {...props} value={quillValue} onChange={setQuillValue} />
    </MDEditorRoot>
  )
}

export default MDEditor
