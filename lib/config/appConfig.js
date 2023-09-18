//
// App Config
// -------------------------------------------------------------------------------------
// ! IMPORTANT: Make sure you clear the browser local storage in order to see the config changes in the template.
// ! To clear local storage, you may refer https://www.leadshook.com/help/how-to-clear-local-storage-in-google-chrome-browser/.

// ** Icon Import
import Tree from 'mdi-material-ui/Tree'

// [MM] WordPress Plugin Demo Link
const ThreeDGardenWPPluginDemo = 'https://garden.university/wp-admin/admin.php?page=threedgarden'

const appConfig = {
  // ** Layout Configs
  title: 'ThreeD Garden', // App/Theme Name
  treeIcon: Tree, // Icon Element
  demoLink: ThreeDGardenWPPluginDemo, // [MM] WordPress Plugin Demo Link
  // ** Routing Configs
  routingLoader: false, // true | false
  // ** Other Configs
  disableCustomizer: true, // true | false
  toastPosition: 'bottom-right', // top-left | top-center | top-right | bottom-left | bottom-center | bottom-right
}

export default appConfig
