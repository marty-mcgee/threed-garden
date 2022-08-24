// ========================================================
import dynamic from "next/dynamic"
// import Demo from "~/components/threed/Demo"

const DynamicJqueryDemo = dynamic(
  () => import("~/components/threed/Demo"),
  { loading: () => <p>...</p>, ssr: false }
)

const DemoPage = () => {
  const word = "HEY HEY HEY -- DEMO PAGE"
  return (
    <DynamicJqueryDemo />
  )
}

export default DemoPage
