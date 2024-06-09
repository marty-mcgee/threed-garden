// @mui material components
// import type { Theme } from '@mui/material/styles' // need this here ?? maybe
import { createTheme } from '@mui/material/styles'
// import Fade from "@mui/material/Fade";

// ThreeD Garden Base Styles
import colors from '#/layout/ui/theme/themes/theme-dark/base/colors'
import breakpoints from '#/layout/ui/theme/themes/theme-dark/base/breakpoints'
import typography from '#/layout/ui/theme/themes/theme-dark/base/typography'
import boxShadows from '#/layout/ui/theme/themes/theme-dark/base/boxShadows'
import borders from '#/layout/ui/theme/themes/theme-dark/base/borders'
import globals from '#/layout/ui/theme/themes/theme-dark/base/globals'

// ThreeD Garden Helper Functions
import boxShadow from '#/layout/ui/theme/themes/theme-dark/functions/boxShadow'
import hexToRgb from '#/layout/ui/theme/themes/theme-dark/functions/hexToRgb'
import linearGradient from '#/layout/ui/theme/themes/theme-dark/functions/linearGradient'
import pxToRem from '#/layout/ui/theme/themes/theme-dark/functions/pxToRem'
import rgba from '#/layout/ui/theme/themes/theme-dark/functions/rgba'

// ThreeD Garden components base styles for @mui material components
import sidenav from '#/layout/ui/theme/themes/theme-dark/components/sidenav'
import list from '#/layout/ui/theme/themes/theme-dark/components/list'
import listItem from '#/layout/ui/theme/themes/theme-dark/components/list/listItem'
import listItemText from '#/layout/ui/theme/themes/theme-dark/components/list/listItemText'
import card from '#/layout/ui/theme/themes/theme-dark/components/card'
import cardMedia from '#/layout/ui/theme/themes/theme-dark/components/card/cardMedia'
import cardContent from '#/layout/ui/theme/themes/theme-dark/components/card/cardContent'
import button from '#/layout/ui/theme/themes/theme-dark/components/button'
import iconButton from '#/layout/ui/theme/themes/theme-dark/components/iconButton'
import input from '#/layout/ui/theme/themes/theme-dark/components/form/input'
import inputLabel from '#/layout/ui/theme/themes/theme-dark/components/form/inputLabel'
import inputOutlined from '#/layout/ui/theme/themes/theme-dark/components/form/inputOutlined'
import textField from '#/layout/ui/theme/themes/theme-dark/components/form/textField'
import menu from '#/layout/ui/theme/themes/theme-dark/components/menu'
import menuItem from '#/layout/ui/theme/themes/theme-dark/components/menu/menuItem'
import switchButton from '#/layout/ui/theme/themes/theme-dark/components/form/switchButton'
import divider from '#/layout/ui/theme/themes/theme-dark/components/divider'
import tableContainer from '#/layout/ui/theme/themes/theme-dark/components/table/tableContainer'
import tableHead from '#/layout/ui/theme/themes/theme-dark/components/table/tableHead'
import tableCell from '#/layout/ui/theme/themes/theme-dark/components/table/tableCell'
import linearProgress from '#/layout/ui/theme/themes/theme-dark/components/linearProgress'
import breadcrumbs from '#/layout/ui/theme/themes/theme-dark/components/breadcrumbs'
import slider from '#/layout/ui/theme/themes/theme-dark/components/slider'
import avatar from '#/layout/ui/theme/themes/theme-dark/components/avatar'
import tooltip from '#/layout/ui/theme/themes/theme-dark/components/tooltip'
import appBar from '#/layout/ui/theme/themes/theme-dark/components/appBar'
import tabs from '#/layout/ui/theme/themes/theme-dark/components/tabs'
import tab from '#/layout/ui/theme/themes/theme-dark/components/tabs/tab'
import stepper from '#/layout/ui/theme/themes/theme-dark/components/stepper'
import step from '#/layout/ui/theme/themes/theme-dark/components/stepper/step'
import stepConnector from '#/layout/ui/theme/themes/theme-dark/components/stepper/stepConnector'
import stepLabel from '#/layout/ui/theme/themes/theme-dark/components/stepper/stepLabel'
import stepIcon from '#/layout/ui/theme/themes/theme-dark/components/stepper/stepIcon'
import select from '#/layout/ui/theme/themes/theme-dark/components/form/select'
import formControlLabel from '#/layout/ui/theme/themes/theme-dark/components/form/formControlLabel'
import formLabel from '#/layout/ui/theme/themes/theme-dark/components/form/formLabel'
import checkbox from '#/layout/ui/theme/themes/theme-dark/components/form/checkbox'
import radio from '#/layout/ui/theme/themes/theme-dark/components/form/radio'
import autocomplete from '#/layout/ui/theme/themes/theme-dark/components/form/autocomplete'
// import flatpickr from '#/layout/ui/theme/themes/theme-dark/components/flatpickr'
import container from '#/layout/ui/theme/themes/theme-dark/components/container'
import popover from '#/layout/ui/theme/themes/theme-dark/components/popover'
import buttonBase from '#/layout/ui/theme/themes/theme-dark/components/buttonBase'
import icon from '#/layout/ui/theme/themes/theme-dark/components/icon'
import svgIcon from '#/layout/ui/theme/themes/theme-dark/components/svgIcon'
import link from '#/layout/ui/theme/themes/theme-dark/components/link'
import dialog from '#/layout/ui/theme/themes/theme-dark/components/dialog'
import dialogTitle from '#/layout/ui/theme/themes/theme-dark/components/dialog/dialogTitle'
import dialogContent from '#/layout/ui/theme/themes/theme-dark/components/dialog/dialogContent'
import dialogContentText from '#/layout/ui/theme/themes/theme-dark/components/dialog/dialogContentText'
import dialogActions from '#/layout/ui/theme/themes/theme-dark/components/dialog/dialogActions'

export default createTheme({
  breakpoints: { ...breakpoints },
  palette: { ...colors },
  typography: { ...typography },
  boxShadows: { ...boxShadows },
  borders: { ...borders },
  functions: {
    boxShadow,
    hexToRgb,
    linearGradient,
    pxToRem,
    rgba,
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ...globals,
        // ...flatpickr,
        ...container,
      },
    },
    MuiDrawer: { ...sidenav },
    MuiList: { ...list },
    MuiListItem: { ...listItem },
    MuiListItemText: { ...listItemText },
    MuiCard: { ...card },
    MuiCardMedia: { ...cardMedia },
    MuiCardContent: { ...cardContent },
    MuiButton: { ...button },
    MuiIconButton: { ...iconButton },
    MuiInput: { ...input },
    MuiInputLabel: { ...inputLabel },
    MuiOutlinedInput: { ...inputOutlined },
    MuiTextField: { ...textField },
    MuiMenu: { ...menu },
    MuiMenuItem: { ...menuItem },
    MuiSwitch: { ...switchButton },
    MuiDivider: { ...divider },
    MuiTableContainer: { ...tableContainer },
    MuiTableHead: { ...tableHead },
    MuiTableCell: { ...tableCell },
    MuiLinearProgress: { ...linearProgress },
    MuiBreadcrumbs: { ...breadcrumbs },
    MuiSlider: { ...slider },
    MuiAvatar: { ...avatar },
    MuiTooltip: { ...tooltip },
    MuiAppBar: { ...appBar },
    MuiTabs: { ...tabs },
    MuiTab: { ...tab },
    MuiStepper: { ...stepper },
    MuiStep: { ...step },
    MuiStepConnector: { ...stepConnector },
    MuiStepLabel: { ...stepLabel },
    MuiStepIcon: { ...stepIcon },
    MuiSelect: { ...select },
    MuiFormControlLabel: { ...formControlLabel },
    MuiFormLabel: { ...formLabel },
    MuiCheckbox: { ...checkbox },
    MuiRadio: { ...radio },
    MuiAutocomplete: { ...autocomplete },
    MuiPopover: { ...popover },
    MuiButtonBase: { ...buttonBase },
    MuiIcon: { ...icon },
    MuiSvgIcon: { ...svgIcon },
    MuiLink: { ...link },
    MuiDialog: { ...dialog },
    MuiDialogTitle: { ...dialogTitle },
    MuiDialogContent: { ...dialogContent },
    MuiDialogContentText: { ...dialogContentText },
    MuiDialogActions: { ...dialogActions },
  },
})
