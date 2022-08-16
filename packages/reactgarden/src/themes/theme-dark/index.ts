// @mui material components
import { createTheme } from "@mui/material/styles"
// import Fade from "@mui/material/Fade";

// Company Juice Dashboard Base Styles
import colors from "~/themes/theme-dark/base/colors"
import breakpoints from "~/themes/theme-dark/base/breakpoints"
import typography from "~/themes/theme-dark/base/typography"
import boxShadows from "~/themes/theme-dark/base/boxShadows"
import borders from "~/themes/theme-dark/base/borders"
import globals from "~/themes/theme-dark/base/globals"

// Company Juice Dashboard Helper Functions
import boxShadow from "~/themes/theme-dark/functions/boxShadow"
import hexToRgb from "~/themes/theme-dark/functions/hexToRgb"
import linearGradient from "~/themes/theme-dark/functions/linearGradient"
import pxToRem from "~/themes/theme-dark/functions/pxToRem"
import rgba from "~/themes/theme-dark/functions/rgba"

// Company Juice Dashboard components base styles for @mui material components
import sidenav from "~/themes/theme-dark/components/sidenav"
import list from "~/themes/theme-dark/components/list"
import listItem from "~/themes/theme-dark/components/list/listItem"
import listItemText from "~/themes/theme-dark/components/list/listItemText"
import card from "~/themes/theme-dark/components/card"
import cardMedia from "~/themes/theme-dark/components/card/cardMedia"
import cardContent from "~/themes/theme-dark/components/card/cardContent"
import button from "~/themes/theme-dark/components/button"
import iconButton from "~/themes/theme-dark/components/iconButton"
import input from "~/themes/theme-dark/components/form/input"
import inputLabel from "~/themes/theme-dark/components/form/inputLabel"
import inputOutlined from "~/themes/theme-dark/components/form/inputOutlined"
import textField from "~/themes/theme-dark/components/form/textField"
import menu from "~/themes/theme-dark/components/menu"
import menuItem from "~/themes/theme-dark/components/menu/menuItem"
import switchButton from "~/themes/theme-dark/components/form/switchButton"
import divider from "~/themes/theme-dark/components/divider"
import tableContainer from "~/themes/theme-dark/components/table/tableContainer"
import tableHead from "~/themes/theme-dark/components/table/tableHead"
import tableCell from "~/themes/theme-dark/components/table/tableCell"
import linearProgress from "~/themes/theme-dark/components/linearProgress"
import breadcrumbs from "~/themes/theme-dark/components/breadcrumbs"
import slider from "~/themes/theme-dark/components/slider"
import avatar from "~/themes/theme-dark/components/avatar"
import tooltip from "~/themes/theme-dark/components/tooltip"
import appBar from "~/themes/theme-dark/components/appBar"
import tabs from "~/themes/theme-dark/components/tabs"
import tab from "~/themes/theme-dark/components/tabs/tab"
import stepper from "~/themes/theme-dark/components/stepper"
import step from "~/themes/theme-dark/components/stepper/step"
import stepConnector from "~/themes/theme-dark/components/stepper/stepConnector"
import stepLabel from "~/themes/theme-dark/components/stepper/stepLabel"
import stepIcon from "~/themes/theme-dark/components/stepper/stepIcon"
import select from "~/themes/theme-dark/components/form/select"
import formControlLabel from "~/themes/theme-dark/components/form/formControlLabel"
import formLabel from "~/themes/theme-dark/components/form/formLabel"
import checkbox from "~/themes/theme-dark/components/form/checkbox"
import radio from "~/themes/theme-dark/components/form/radio"
import autocomplete from "~/themes/theme-dark/components/form/autocomplete"
import flatpickr from "~/themes/theme-dark/components/flatpickr"
import container from "~/themes/theme-dark/components/container"
import popover from "~/themes/theme-dark/components/popover"
import buttonBase from "~/themes/theme-dark/components/buttonBase"
import icon from "~/themes/theme-dark/components/icon"
import svgIcon from "~/themes/theme-dark/components/svgIcon"
import link from "~/themes/theme-dark/components/link"
import dialog from "~/themes/theme-dark/components/dialog"
import dialogTitle from "~/themes/theme-dark/components/dialog/dialogTitle"
import dialogContent from "~/themes/theme-dark/components/dialog/dialogContent"
import dialogContentText from "~/themes/theme-dark/components/dialog/dialogContentText"
import dialogActions from "~/themes/theme-dark/components/dialog/dialogActions"

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
