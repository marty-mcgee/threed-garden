// ** Mock Adapter
import mock from '#/lib/api/@fake-db/mock'

const navigation = [
  {
    icon: 'HomeOutline',
    title: 'Adventures',
    children: [
      {
        icon: 'ChartDonut',
        title: 'CRM',
        path: '/dashboards/crm',
      },
      {
        icon: 'ChartTimelineVariant',
        title: 'Analytics',
        path: '/dashboards/analytics',
      },
      {
        icon: 'CartOutline',
        title: 'eCommerce',
        path: '/dashboards/ecommerce',
      },
    ],
  },
  {
    icon: 'Apps',
    title: 'Apps',
    children: [
      {
        title: 'Email',
        icon: 'EmailOutline',
        path: '/api/modules/email',
      },
      {
        title: 'Chat',
        icon: 'MessageOutline',
        path: '/api/modules/chat',
      },
      {
        title: 'Calendar',
        icon: 'CalendarBlankOutline',
        path: '/api/modules/calendar',
      },
      {
        title: 'Invoice',
        icon: 'FileDocumentOutline',
        children: [
          {
            title: 'List',
            path: '/api/modules/invoice/list',
          },
          {
            title: 'Preview',
            path: '/api/modules/invoice/preview',
          },
          {
            title: 'Edit',
            path: '/api/modules/invoice/edit',
          },
          {
            title: 'Add',
            path: '/api/modules/invoice/add',
          },
        ],
      },
      {
        title: 'User',
        icon: 'AccountOutline',
        children: [
          {
            title: 'List',
            path: '/api/modules/user/list',
          },
          {
            title: 'View',
            path: '/api/modules/user/view',
          },
        ],
      },
      {
        title: 'Roles',
        icon: 'LockOutline',
        children: [
          {
            title: 'Roles',
            path: '/api/modules/roles',
          },
          {
            title: 'Permissions',
            path: '/api/modules/permissions',
          },
        ],
      },
    ],
  },
  {
    icon: 'PaletteSwatchOutline',
    title: 'UI',
    children: [
      {
        title: 'Typography',
        icon: 'FormatLetterCase',
        path: '/api/typography',
      },
      {
        title: 'Icons',
        path: '/api/icons',
        icon: 'GoogleCirclesExtended',
      },
      {
        title: 'Cards',
        icon: 'CreditCardOutline',
        children: [
          {
            title: 'Basic',
            path: '/api/cards/basic',
          },
          {
            title: 'Statistics',
            path: '/api/cards/statistics',
          },
          {
            title: 'Advanced',
            path: '/api/cards/advanced',
          },
          {
            title: 'Gamification',
            path: '/api/cards/gamification',
          },
          {
            title: 'Actions',
            path: '/api/cards/actions',
          },
          {
            title: 'Widgets',
            path: '/api/cards/widgets',
          },
        ],
      },
      {
        title: 'Components',
        icon: 'ArchiveOutline',
        children: [
          {
            title: 'Accordion',
            path: '/components/accordion',
          },
          {
            title: 'Alerts',
            path: '/components/alerts',
          },
          {
            title: 'Avatars',
            path: '/components/avatars',
          },
          {
            title: 'Badges',
            path: '/components/badges',
          },
          {
            title: 'Buttons',
            path: '/components/buttons',
          },
          {
            title: 'Button Group',
            path: '/components/button-group',
          },
          {
            title: 'Chips',
            path: '/components/chips',
          },
          {
            title: 'Dialogs',
            path: '/components/dialogs',
          },
          {
            title: 'List',
            path: '/components/list',
          },
          {
            title: 'Menu',
            path: '/components/menu',
          },
          {
            title: 'Pagination',
            path: '/components/pagination',
          },
          {
            title: 'Ratings',
            path: '/components/ratings',
          },
          {
            title: 'Snackbar',
            path: '/components/snackbar',
          },
          {
            title: 'Swiper',
            path: '/components/swiper',
          },
          {
            title: 'Tabs',
            path: '/components/tabs',
          },
          {
            title: 'Timeline',
            path: '/components/timeline',
          },
          {
            title: 'Toasts',
            path: '/components/toast',
          },
          {
            title: 'Tree View',
            path: '/components/tree-view',
          },
          {
            title: 'More',
            path: '/components/more',
          },
        ],
      },
    ],
  },
  {
    icon: 'FileOutline',
    title: 'Pages',
    children: [
      {
        title: 'Authentication',
        icon: 'LockOutline',
        children: [
          {
            title: 'Login',
            children: [
              {
                openInNewTab: true,
                title: 'Login v1',
                path: '/pages/auth/login-v1',
              },
              {
                openInNewTab: true,
                title: 'Login v2',
                path: '/pages/auth/login-v2',
              },
              {
                openInNewTab: true,
                title: 'Login With AppBar',
                path: '/pages/auth/login-with-appbar',
              },
            ],
          },
          {
            title: 'Register',
            children: [
              {
                openInNewTab: true,
                title: 'Register v1',
                path: '/pages/auth/register-v1',
              },
              {
                openInNewTab: true,
                title: 'Register v2',
                path: '/pages/auth/register-v2',
              },
            ],
          },
          {
            title: 'Forgot Password',
            children: [
              {
                openInNewTab: true,
                title: 'Forgot Password v1',
                path: '/pages/auth/forgot-password-v1',
              },
              {
                openInNewTab: true,
                title: 'Forgot Password v2',
                path: '/pages/auth/forgot-password-v2',
              },
            ],
          },
          {
            title: 'Reset Password',
            children: [
              {
                openInNewTab: true,
                title: 'Reset Password v1',
                path: '/pages/auth/reset-password-v1',
              },
              {
                openInNewTab: true,
                title: 'Reset Password v2',
                path: '/pages/auth/reset-password-v2',
              },
            ],
          },
        ],
      },
      {
        icon: 'CogOutline',
        title: 'Account Settings',
        path: '/pages/account-settings',
      },
      {
        title: 'Pricing',
        icon: 'CurrencyUsd',
        path: '/pages/pricing',
      },
      {
        title: 'FAQ',
        path: '/pages/faq',
        icon: 'HelpCircleOutline',
      },
      {
        icon: 'BookOpenOutline',
        title: 'Knowledge Base',
        path: '/pages/knowledge-base',
      },
      {
        title: 'Miscellaneous',
        icon: 'FileOutline',
        children: [
          {
            openInNewTab: true,
            title: 'Coming Soon',
            path: '/pages/misc/coming-soon',
          },
          {
            openInNewTab: true,
            title: 'Under Maintenance',
            path: '/pages/misc/under-maintenance',
          },
          {
            openInNewTab: true,
            title: 'Page Not Found - 404',
            path: '/pages/misc/404-not-found',
          },
          {
            openInNewTab: true,
            title: 'Not Authorized - 401',
            path: '/pages/misc/401-not-authorized',
          },
          {
            openInNewTab: true,
            title: 'Server Error - 500',
            path: '/pages/misc/500-server-error',
          },
        ],
      },
      {
        icon: 'VectorArrangeBelow',
        title: 'Action Dialogs',
        path: '/pages/dialog-examples',
      },
    ],
  },
  {
    title: 'Forms & Tables',
    icon: 'CheckboxMarkedOutline',
    children: [
      {
        title: 'Form Elements',
        icon: 'FormSelect',
        children: [
          {
            title: 'Text Field',
            path: '/forms/form-elements/text-field',
          },
          {
            title: 'Select',
            path: '/forms/form-elements/select',
          },
          {
            title: 'Checkbox',
            path: '/forms/form-elements/checkbox',
          },
          {
            title: 'Radio',
            path: '/forms/form-elements/radio',
          },
          {
            title: 'Textarea',
            path: '/forms/form-elements/textarea',
          },
          {
            title: 'Autocomplete',
            path: '/forms/form-elements/autocomplete',
          },
          {
            title: 'Date Pickers',
            path: '/forms/form-elements/pickers',
          },
          {
            title: 'Switch',
            path: '/forms/form-elements/switch',
          },
          {
            title: 'File Uploader',
            path: '/forms/form-elements/file-uploader',
          },
          {
            title: 'Editor',
            path: '/forms/form-elements/editor',
          },
          {
            title: 'Slider',
            path: '/forms/form-elements/slider',
          },
          {
            title: 'Input Mask',
            path: '/forms/form-elements/input-mask',
          },
        ],
      },
      {
        icon: 'CubeOutline',
        title: 'Form Layouts',
        path: '/forms/form-layouts',
      },
      {
        title: 'Form Validation',
        path: '/forms/form-validation',
        icon: 'CheckboxMarkedCircleOutline',
      },
      {
        title: 'Form Wizard',
        path: '/forms/form-wizard',
        icon: 'PackageVariantClosed',
      },
      {
        title: 'Table',
        icon: 'Table',
        path: '/tables/mui',
      },
      {
        title: 'Mui DataGrid',
        icon: 'Table',
        path: '/tables/data-grid',
      },
    ],
  },
  {
    title: 'Charts',
    icon: 'ChartDonut',
    children: [
      {
        title: 'Apex',
        icon: 'ChartLine',
        path: '/charts/apex-charts',
      },
      {
        title: 'Recharts',
        icon: 'ChartBellCurve',
        path: '/charts/recharts',
      },
      {
        title: 'ChartJS',
        path: '/charts/chartjs',
        icon: 'ChartBellCurveCumulative',
      },
    ],
  },
  {
    title: 'Others',
    icon: 'DotsHorizontal',
    children: [
      {
        path: '/acl',
        action: 'read',
        subject: 'acl-page',
        icon: 'ShieldOutline',
        title: 'Access Control',
      },
      {
        title: 'Menu Levels',
        icon: 'Menu',
        children: [
          {
            title: 'Menu Level 2.1',
          },
          {
            title: 'Menu Level 2.2',
            children: [
              {
                title: 'Menu Level 3.1',
              },
              {
                title: 'Menu Level 3.2',
              },
            ],
          },
        ],
      },
      {
        title: 'Disabled Menu',
        icon: 'EyeOffOutline',
        disabled: true,
      },
      {
        title: 'Raise Support',
        icon: 'Lifebuoy',
        externalLink: true,
        openInNewTab: true,
        path: 'https://github.com/marty-mcgee/threed-garden/discussions',
      },
      {
        title: 'Documentation',
        icon: 'FileDocumentOutline',
        externalLink: true,
        openInNewTab: true,
        path: 'https://github.com/marty-mcgee/threed-garden',
      },
    ],
  },
]
mock.onGet('/api/horizontal-nav/data').reply(() => {
  return [200, navigation]
})
