// ** Mock Adapter
import mock from 'src/@fake-db/mock'

const searchData = [
  {
    id: 1,
    url: '/dashboards/crm',
    icon: 'ChartDonut',
    title: 'CRM Dashboard',
    category: 'dashboards'
  },
  {
    id: 2,
    url: '/dashboards/analytics',
    icon: 'ChartTimelineVariant',
    title: 'Analytics Dashboard',
    category: 'dashboards'
  },
  {
    id: 3,
    url: '/dashboards/ecommerce',
    icon: 'CartOutline',
    title: 'eCommerce Dashboard',
    category: 'dashboards'
  },
  {
    id: 4,
    url: '/apps/email',
    icon: 'EmailOutline',
    title: 'Email',
    category: 'appsPages'
  },
  {
    id: 5,
    url: '/apps/chat',
    icon: 'MessageOutline',
    title: 'Chat',
    category: 'appsPages'
  },
  {
    id: 6,
    url: '/apps/calendar',
    icon: 'CalendarBlankOutline',
    title: 'Calendar',
    category: 'appsPages'
  },
  {
    id: 7,
    url: '/apps/invoice/list',
    icon: 'FormatListNumbered',
    title: 'Invoice List',
    category: 'appsPages'
  },
  {
    id: 8,
    url: '/apps/invoice/preview',
    icon: 'FileDocumentOutline',
    title: 'Invoice Preview',
    category: 'appsPages'
  },
  {
    id: 9,
    url: '/apps/invoice/edit',
    icon: 'PencilOutline',
    title: 'Invoice Edit',
    category: 'appsPages'
  },
  {
    id: 10,
    url: '/apps/invoice/add',
    icon: 'Plus',
    title: 'Invoice Add',
    category: 'appsPages'
  },
  {
    id: 11,
    url: '/apps/user/list',
    icon: 'FormatListNumbered',
    title: 'User List',
    category: 'appsPages'
  },
  {
    id: 12,
    url: '/apps/user/view',
    icon: 'AccountOutline',
    title: 'User View',
    category: 'appsPages'
  },
  {
    id: 13,
    url: '/apps/roles',
    icon: 'ShieldOutline',
    title: 'Roles',
    category: 'appsPages'
  },
  {
    id: 14,
    url: '/apps/permissions',
    icon: 'LockOutline',
    title: 'Permissions',
    category: 'appsPages'
  },
  {
    id: 15,
    url: '/pages/auth/login-v1',
    icon: 'Login',
    title: 'Login V1',
    category: 'appsPages'
  },
  {
    id: 16,
    url: '/pages/auth/login-v2',
    icon: 'Login',
    title: 'Login V2',
    category: 'appsPages'
  },
  {
    id: 17,
    url: '/pages/auth/login-with-appbar',
    icon: 'Login',
    title: 'Login With AppBar',
    category: 'appsPages'
  },
  {
    id: 18,
    url: '/pages/auth/register-v1',
    icon: 'AccountPlusOutline',
    title: 'Register V1',
    category: 'appsPages'
  },
  {
    id: 19,
    url: '/pages/auth/register-v2',
    icon: 'AccountPlusOutline',
    title: 'Register V2',
    category: 'appsPages'
  },
  {
    id: 20,
    url: '/pages/auth/forgot-password-v1',
    icon: 'LockOutline',
    title: 'Forgot Password V1',
    category: 'appsPages'
  },
  {
    id: 21,
    url: '/pages/auth/forgot-password-v2',
    icon: 'LockOutline',
    title: 'Forgot Password V2',
    category: 'appsPages'
  },
  {
    id: 22,
    url: '/pages/auth/reset-password-v1',
    icon: 'LockReset',
    title: 'Reset Password V1',
    category: 'appsPages'
  },
  {
    id: 23,
    url: '/pages/auth/reset-password-v2',
    icon: 'LockReset',
    title: 'Reset Password V2',
    category: 'appsPages'
  },
  {
    id: 24,
    url: '/pages/account-settings',
    icon: 'CogOutline',
    title: 'Account Settings',
    category: 'appsPages'
  },
  {
    id: 25,
    url: '/pages/pricing',
    icon: 'CurrencyUsd',
    title: 'Pricing',
    category: 'appsPages'
  },
  {
    id: 26,
    url: '/pages/faq',
    icon: 'HelpCircleOutline',
    title: 'FAQ',
    category: 'appsPages'
  },
  {
    id: 27,
    url: '/pages/knowledge-base',
    icon: 'BookOpenOutline',
    title: 'Knowledge Base',
    category: 'appsPages'
  },
  {
    id: 28,
    url: '/pages/misc/coming-soon',
    icon: 'ClockOutline',
    title: 'Coming Soon',
    category: 'appsPages'
  },
  {
    id: 29,
    url: '/pages/misc/under-maintenance',
    icon: 'Screwdriver',
    title: 'Under Maintenance',
    category: 'appsPages'
  },
  {
    id: 30,
    url: '/pages/misc/404-not-found',
    icon: 'AlertCircleOutline',
    title: 'Page Not Found - 404',
    category: 'appsPages'
  },
  {
    id: 31,
    url: '/pages/misc/401-not-authorized',
    icon: 'AccountMultipleRemoveOutline',
    title: 'Not Authorized - 401',
    category: 'appsPages'
  },
  {
    id: 32,
    url: '/pages/misc/500-server-error',
    icon: 'AccountMultipleRemoveOutline',
    title: 'Server Error - 500',
    category: 'appsPages'
  },
  {
    id: 33,
    url: '/pages/dialog-examples',
    icon: 'VectorArrangeBelow',
    title: 'Dialog Examples',
    category: 'appsPages'
  },
  {
    id: 34,
    url: '/ui/typography',
    icon: 'FormatTextVariantOutline',
    title: 'Typography',
    category: 'userInterface'
  },
  {
    id: 35,
    url: '/ui/icons',
    icon: 'StarOutline',
    title: 'Icons',
    category: 'userInterface'
  },
  {
    id: 36,
    url: '/ui/cards/basic',
    icon: 'CardOutline',
    title: 'Card Basic',
    category: 'userInterface'
  },
  {
    id: 37,
    url: '/ui/cards/statistics',
    icon: 'CardTextOutline',
    title: 'Card Statistics',
    category: 'userInterface'
  },
  {
    id: 38,
    url: '/ui/cards/advanced',
    icon: 'CardBulletedSettingsOutline',
    title: 'Card Advanced',
    category: 'userInterface'
  },
  {
    id: 39,
    url: '/ui/cards/gamification',
    icon: 'CardAccountDetailsOutline',
    title: 'Card Gamification',
    category: 'userInterface'
  },
  {
    id: 40,
    url: '/ui/cards/actions',
    icon: 'CardPlusOutline',
    title: 'Card Actions',
    category: 'userInterface'
  },
  {
    id: 41,
    url: '/ui/cards/widgets',
    icon: 'ChartBoxOutline',
    title: 'Card Widgets',
    category: 'userInterface'
  },
  {
    id: 42,
    url: '/components/accordion',
    icon: 'FullscreenExit',
    title: 'Accordion',
    category: 'userInterface'
  },
  {
    id: 43,
    url: '/components/alerts',
    icon: 'AlertOutline',
    title: 'Alerts',
    category: 'userInterface'
  },
  {
    id: 44,
    url: '/components/avatars',
    icon: 'AccountCircleOutline',
    title: 'Avatars',
    category: 'userInterface'
  },
  {
    id: 45,
    url: '/components/badges',
    icon: 'CircleOutline',
    title: 'Badges',
    category: 'userInterface'
  },
  {
    id: 46,
    url: '/components/buttons',
    icon: 'GestureTapButton',
    title: 'Buttons',
    category: 'userInterface'
  },
  {
    id: 47,
    url: '/components/button-group',
    icon: 'CheckboxMultipleBlankOutline',
    title: 'Button Group',
    category: 'userInterface'
  },
  {
    id: 48,
    url: '/components/chips',
    icon: 'CardOutline',
    title: 'Chips',
    category: 'userInterface'
  },
  {
    id: 49,
    url: '/components/dialogs',
    icon: 'TextBoxOutline',
    title: 'Dialogs',
    category: 'userInterface'
  },
  {
    id: 50,
    url: '/components/list',
    icon: 'FormatListBulleted',
    title: 'List',
    category: 'userInterface'
  },
  {
    id: 51,
    url: '/components/menu',
    icon: 'Menu',
    title: 'Menu',
    category: 'userInterface'
  },
  {
    id: 52,
    url: '/components/pagination',
    icon: 'DotsHorizontal',
    title: 'Pagination',
    category: 'userInterface'
  },
  {
    id: 53,
    url: '/components/ratings',
    icon: 'StarOutline',
    title: 'Ratings',
    category: 'userInterface'
  },
  {
    id: 54,
    url: '/components/snackbar',
    icon: 'AlertCircleOutline',
    title: 'Snackbar',
    category: 'userInterface'
  },
  {
    id: 55,
    url: '/components/swiper',
    icon: 'CardOutline',
    title: 'Swiper',
    category: 'userInterface'
  },
  {
    id: 56,
    url: '/components/tabs',
    icon: 'Tab',
    title: 'Tabs',
    category: 'userInterface'
  },
  {
    id: 57,
    url: '/components/toast',
    icon: 'RectangleOutline',
    title: 'Toast',
    category: 'userInterface'
  },
  {
    id: 58,
    url: '/components/timeline',
    icon: 'TimelineOutline',
    title: 'Timeline',
    category: 'userInterface'
  },
  {
    id: 59,
    url: '/components/tree-view',
    icon: 'FileTreeOutline',
    title: 'Tree View',
    category: 'userInterface'
  },
  {
    id: 60,
    url: '/components/more',
    icon: 'ViewGridPlusOutline',
    title: 'More Components',
    category: 'userInterface'
  },
  {
    id: 61,
    url: '/forms/form-elements/text-field',
    icon: 'Lastpass',
    title: 'TextField',
    category: 'formsTables'
  },
  {
    id: 62,
    url: '/forms/form-elements/select',
    icon: 'FormatListCheckbox',
    title: 'Select',
    category: 'formsTables'
  },
  {
    id: 63,
    url: '/forms/form-elements/checkbox',
    icon: 'CheckboxOutline',
    title: 'Checkbox',
    category: 'formsTables'
  },
  {
    id: 64,
    url: '/forms/form-elements/radio',
    icon: 'RadioboxMarked',
    title: 'Radio',
    category: 'formsTables'
  },
  {
    id: 65,
    url: '/forms/form-elements/textarea',
    icon: 'CardTextOutline',
    title: 'Textarea',
    category: 'formsTables'
  },
  {
    id: 66,
    url: '/forms/form-elements/autocomplete',
    icon: 'Lastpass',
    title: 'Autocomplete',
    category: 'formsTables'
  },
  {
    id: 67,
    url: '/forms/form-elements/pickers',
    icon: 'CalendarRange',
    title: 'Date Pickers',
    category: 'formsTables'
  },
  {
    id: 68,
    url: '/forms/form-elements/switch',
    icon: 'ToggleSwitchOutline',
    title: 'Switch',
    category: 'formsTables'
  },
  {
    id: 69,
    url: '/forms/form-elements/file-uploader',
    icon: 'TrayArrowUp',
    title: 'File Uploader',
    category: 'formsTables'
  },
  {
    id: 70,
    url: '/forms/form-elements/editor',
    icon: 'SquareEditOutline',
    title: 'Editor',
    category: 'formsTables'
  },
  {
    id: 71,
    url: '/forms/form-elements/slider',
    icon: 'TransitConnectionHorizontal',
    title: 'Slider',
    category: 'formsTables'
  },
  {
    id: 72,
    url: '/forms/form-elements/input-mask',
    icon: 'Lastpass',
    title: 'Input Mask',
    category: 'formsTables'
  },
  {
    id: 73,
    url: '/forms/form-layouts',
    icon: 'ViewGridOutline',
    title: 'Form Layouts',
    category: 'formsTables'
  },
  {
    id: 74,
    url: '/forms/form-validation',
    icon: 'AlertOutline',
    title: 'Form Validation',
    category: 'formsTables'
  },
  {
    id: 75,
    url: '/forms/form-wizard',
    icon: 'TransitConnectionHorizontal',
    title: 'Form Wizard',
    category: 'formsTables'
  },
  {
    id: 76,
    url: '/tables/mui',
    icon: 'Table',
    title: 'Table',
    category: 'formsTables'
  },
  {
    id: 77,
    url: '/tables/data-grid',
    icon: 'Table',
    title: 'Mui DataGrid',
    category: 'formsTables'
  },
  {
    id: 78,
    url: '/charts/apex-charts',
    icon: 'ChartLine',
    title: 'Apex Charts',
    category: 'chartsMisc'
  },
  {
    id: 79,
    url: '/charts/recharts',
    icon: 'ChartBellCurveCumulative',
    title: 'Recharts',
    category: 'chartsMisc'
  },
  {
    id: 80,
    url: '/charts/chartjs',
    icon: 'ChartBellCurve',
    title: 'ChartJS',
    category: 'chartsMisc'
  },
  {
    id: 81,
    url: '/acl',
    icon: 'ShieldOutline',
    title: 'Access Control (ACL)',
    category: 'chartsMisc'
  }
]

// ** GET Search Data
mock.onGet('/app-bar/search').reply(config => {
  const { q = '' } = config.params
  const queryLowered = q.toLowerCase()

  const exactData = {
    dashboards: [],
    appsPages: [],
    userInterface: [],
    formsTables: [],
    chartsMisc: []
  }

  const includeData = {
    dashboards: [],
    appsPages: [],
    userInterface: [],
    formsTables: [],
    chartsMisc: []
  }
  searchData.forEach(obj => {
    const isMatched = obj.title.toLowerCase().startsWith(queryLowered)
    if (isMatched && exactData[obj.category].length < 5) {
      exactData[obj.category].push(obj)
    }
  })
  searchData.forEach(obj => {
    const isMatched =
      !obj.title.toLowerCase().startsWith(queryLowered) && obj.title.toLowerCase().includes(queryLowered)
    if (isMatched && includeData[obj.category].length < 5) {
      includeData[obj.category].push(obj)
    }
  })
  const categoriesCheck = []
  Object.keys(exactData).forEach(category => {
    if (exactData[category].length > 0) {
      categoriesCheck.push(category)
    }
  })
  const resultsLength = categoriesCheck.length === 1 ? 5 : 3

  return [
    200,
    [
      ...exactData.dashboards.concat(includeData.dashboards).slice(0, resultsLength),
      ...exactData.appsPages.concat(includeData.appsPages).slice(0, resultsLength),
      ...exactData.userInterface.concat(includeData.userInterface).slice(0, resultsLength),
      ...exactData.formsTables.concat(includeData.formsTables).slice(0, resultsLength),
      ...exactData.chartsMisc.concat(includeData.chartsMisc).slice(0, resultsLength)
    ]
  ]
})
