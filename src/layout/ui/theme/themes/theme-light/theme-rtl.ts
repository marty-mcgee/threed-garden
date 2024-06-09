// @mui material components
import { createTheme } from '@mui/material/styles'
// import Fade from "@mui/material/Fade";

// ThreeD Garden Base Styles
import colors from '#/layout/ui/theme/themes/theme-light/base/colors'
import breakpoints from '#/layout/ui/theme/themes/theme-light/base/breakpoints'
import typography from '#/layout/ui/theme/themes/theme-light/base/typography'
import boxShadows from '#/layout/ui/theme/themes/theme-light/base/boxShadows'
import borders from '#/layout/ui/theme/themes/theme-light/base/borders'
import globals from '#/layout/ui/theme/themes/theme-light/base/globals'

// ThreeD Garden Helper Functions
import boxShadow from '#/layout/ui/theme/themes/theme-light/functions/boxShadow'
import hexToRgb from '#/layout/ui/theme/themes/theme-light/functions/hexToRgb'
import linearGradient from '#/layout/ui/theme/themes/theme-light/functions/linearGradient'
import pxToRem from '#/layout/ui/theme/themes/theme-light/functions/pxToRem'
import rgba from '#/layout/ui/theme/themes/theme-light/functions/rgba'

// ThreeD Garden components base styles for @mui material components
import sidenav from '#/layout/ui/theme/themes/theme-light/components/sidenav'
import list from '#/layout/ui/theme/themes/theme-light/components/list'
import listItem from '#/layout/ui/theme/themes/theme-light/components/list/listItem'
import listItemText from '#/layout/ui/theme/themes/theme-light/components/list/listItemText'
import card from '#/layout/ui/theme/themes/theme-light/components/card'
import cardMedia from '#/layout/ui/theme/themes/theme-light/components/card/cardMedia'
import cardContent from '#/layout/ui/theme/themes/theme-light/components/card/cardContent'
import button from '#/layout/ui/theme/themes/theme-light/components/button'
import iconButton from '#/layout/ui/theme/themes/theme-light/components/iconButton'
import input from '#/layout/ui/theme/themes/theme-light/components/form/input'
import inputLabel from '#/layout/ui/theme/themes/theme-light/components/form/inputLabel'
import inputOutlined from '#/layout/ui/theme/themes/theme-light/components/form/inputOutlined'
import textField from '#/layout/ui/theme/themes/theme-light/components/form/textField'
import menu from '#/layout/ui/theme/themes/theme-light/components/menu'
import menuItem from '#/layout/ui/theme/themes/theme-light/components/menu/menuItem'
import switchButton from '#/layout/ui/theme/themes/theme-light/components/form/switchButton'
import divider from '#/layout/ui/theme/themes/theme-light/components/divider'
import tableContainer from '#/layout/ui/theme/themes/theme-light/components/table/tableContainer'
import tableHead from '#/layout/ui/theme/themes/theme-light/components/table/tableHead'
import tableCell from '#/layout/ui/theme/themes/theme-light/components/table/tableCell'
import linearProgress from '#/layout/ui/theme/themes/theme-light/components/linearProgress'
import breadcrumbs from '#/layout/ui/theme/themes/theme-light/components/breadcrumbs'
import slider from '#/layout/ui/theme/themes/theme-light/components/slider'
import avatar from '#/layout/ui/theme/themes/theme-light/components/avatar'
import tooltip from '#/layout/ui/theme/themes/theme-light/components/tooltip'
import appBar from '#/layout/ui/theme/themes/theme-light/components/appBar'
import tabs from '#/layout/ui/theme/themes/theme-light/components/tabs'
import tab from '#/layout/ui/theme/themes/theme-light/components/tabs/tab'
import stepper from '#/layout/ui/theme/themes/theme-light/components/stepper'
import step from '#/layout/ui/theme/themes/theme-light/components/stepper/step'
import stepConnector from '#/layout/ui/theme/themes/theme-light/components/stepper/stepConnector'
import stepLabel from '#/layout/ui/theme/themes/theme-light/components/stepper/stepLabel'
import stepIcon from '#/layout/ui/theme/themes/theme-light/components/stepper/stepIcon'
import select from '#/layout/ui/theme/themes/theme-light/components/form/select'
import formControlLabel from '#/layout/ui/theme/themes/theme-light/components/form/formControlLabel'
import formLabel from '#/layout/ui/theme/themes/theme-light/components/form/formLabel'
import checkbox from '#/layout/ui/theme/themes/theme-light/components/form/checkbox'
import radio from '#/layout/ui/theme/themes/theme-light/components/form/radio'
import autocomplete from '#/layout/ui/theme/themes/theme-light/components/form/autocomplete'
import flatpickr from '#/layout/ui/theme/themes/theme-light/components/flatpickr'
import container from '#/layout/ui/theme/themes/theme-light/components/container'
import popover from '#/layout/ui/theme/themes/theme-light/components/popover'
import buttonBase from '#/layout/ui/theme/themes/theme-light/components/buttonBase'
import icon from '#/layout/ui/theme/themes/theme-light/components/icon'
import svgIcon from '#/layout/ui/theme/themes/theme-light/components/svgIcon'
import link from '#/layout/ui/theme/themes/theme-light/components/link'
import dialog from '#/layout/ui/theme/themes/theme-light/components/dialog'
import dialogTitle from '#/layout/ui/theme/themes/theme-light/components/dialog/dialogTitle'
import dialogContent from '#/layout/ui/theme/themes/theme-light/components/dialog/dialogContent'
import dialogContentText from '#/layout/ui/theme/themes/theme-light/components/dialog/dialogContentText'
import dialogActions from '#/layout/ui/theme/themes/theme-light/components/dialog/dialogActions'

export default createTheme({
  direction: 'rtl',
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
        ...flatpickr,
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
