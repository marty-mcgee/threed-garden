//
// Config
// -------------------------------------------------------------------------------------
// ! IMPORTANT: Make sure you clear the browser local storage in order to see the config changes in the template.
// ! To clear local storage, you may refer https://www.leadshook.com/help/how-to-clear-local-storage-in-google-chrome-browser/.

// ** Icon Import
import TreeIcon from 'mdi-material-ui/Tree'

const themeConfig = {
  // ** Layout Configs
  title: 'ThreeD Garden', // App/Theme Name
  layout: 'vertical', // vertical | horizontal
  mode: 'dark', // light | dark
  direction: 'ltr', // ltr | rtl
  skin: 'default', // default | bordered | semi-dark, //! Note: semi-dark value will only work for Vertical Layout
  contentWidth: 'full', // full | boxed
  footer: 'static', // fixed | static | hidden
  // ** Routing Configs
  routingLoader: true, // true | false
  // ** Navigation (Menu) Configs
  navHidden: false, // true | false
  menuTextTruncate: false, // true | false
  navSubItemIcon: TreeIcon, // Icon Element
  verticalNavToggleType: 'accordion', // accordion | collapse, //! Note: This is for Vertical navigation menu only
  navCollapsed: false, // true | false, //! Note: This is for Vertical navigation menu only
  navigationSize: 256, // Number in PX(Pixels), //! Note: This is for Vertical navigation menu only
  collapsedNavigationSize: 63, // Number in PX(Pixels), //! Note: This is for Vertical navigation menu only
  afterVerticalNavMenuContentPosition: 'static', // fixed | static
  beforeVerticalNavMenuContentPosition: 'static', // fixed | static
  horizontalMenuToggle: 'hover', // click | hover, //! Note: This is for Horizontal navigation menu only
  horizontalMenuAnimation: true, // true | false
  // ** AppBar Configs
  appBar: 'fixed', // fixed | static | hidden, //! Note: hidden value will only work for Vertical Layout
  appBarBlur: true, // true | false
  // ** Other Configs
  responsiveFontSizes: true, // true | false
  disableRipple: true, // true | false
  disableCustomizer: true, // true | false
  toastPosition: 'bottom-right', // top-left | top-center | top-right | bottom-left | bottom-center | bottom-right
}

export default themeConfig
