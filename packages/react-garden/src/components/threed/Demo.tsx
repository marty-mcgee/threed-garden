// <script type="text/javascript" data-cfasync="false">

const Demo = (): JSX.Element => {

  var fragment = null
  var readOnly = false
  var UILayout = "default"

  if (!!window.location.hash) { // for old fragment type links. very rare.
    var tmpFragment = window.location.hash.substr(1)
    var tmpUILayout = "default"
    if (tmpFragment.endsWith("_plan")) {
      tmpFragment = tmpFragment.split("_")[0]
      tmpUILayout = "planView"
    } else if (tmpFragment.endsWith("_3d")) {
      tmpFragment = tmpFragment.split("_")[0]
      tmpUILayout = "3dView"
    }

    var re = /[0-9A-Fa-f]/g
    if (re.test(tmpFragment) && tmpFragment.length >= 40 && tmpFragment.length < 50) {
      // reload with static url
      if (tmpUILayout === "planView") {
        window.location.href = "/plan/" + tmpFragment
      } else if (tmpUILayout === "3dView") {
        window.location.href = "/3d/" + tmpFragment
      } else {
        window.location.href = "/edit/" + tmpFragment
      }
    }
  }

  return (
    <div id="DEMO">
      DEMO

    </div>
  )
}

export default Demo
