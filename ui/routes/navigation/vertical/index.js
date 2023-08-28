// ** Icon imports
import ChartPie from 'mdi-material-ui/ChartPie'
import ChartDonut from 'mdi-material-ui/ChartDonut'
import LockOutline from 'mdi-material-ui/LockOutline'
import HomeOutline from 'mdi-material-ui/HomeOutline'
import AccountOutline from 'mdi-material-ui/AccountOutline'
import DotsHorizontal from 'mdi-material-ui/DotsHorizontal'
import CreditCardOutline from 'mdi-material-ui/CreditCardOutline'
import ManageAccount from 'mdi-material-ui/VectorArrangeBelow'
import FileDocumentOutline from 'mdi-material-ui/FileDocumentOutline'
import CalendarBlankOutline from 'mdi-material-ui/CalendarBlankOutline'

const navigation = () => {
  const word = '[MM] HEY HEY HEY'
  return [
    {
      title: 'Home Base',
      icon: HomeOutline,
      badgeContent: 'demo', // 'new'
      badgeColor: 'primary', // 'error'
      children: [
        {
          title: 'Participate',
          path: '/participate',
          icon: ChartDonut,
          badgeContent: 'demo', // 'new'
          badgeColor: 'primary', // 'error'
        },
      ],
    },
    // {
    //   title: 'Participate',
    //   path: '/participate',
    //   icon: HomeOutline,
    //   badgeContent: 'demo', // 'new'
    //   badgeColor: 'primary', // 'error'
    // },
    {
      title: 'My Account',
      path: '/pages/account-settings',
      icon: ManageAccount,
    },
    {
      title: 'Calendar',
      icon: CalendarBlankOutline,
      path: '/ui/modules/calendar',
    },
    {
      title: 'Actions',
      icon: CreditCardOutline,
      badgeContent: '$$$$',
      path: '/pages/dialog-examples',
    },
    {
      title: 'eCommerce',
      icon: HomeOutline,
      path: '/dashboards/ecommerce',
    },
    {
      title: 'Clients',
      icon: HomeOutline,
      path: '/dashboards/crm',
    },
    {
      sectionTitle: 'Administration',
    },
    // {
    //   title: 'Email',
    //   icon: EmailOutline,
    //   path: '/ui/modules/email'
    // },
    // {
    //   title: 'Chat',
    //   icon: MessageOutline,
    //   path: '/ui/modules/chat'
    // },
    // {
    //   title: 'Invoice',
    //   icon: FileDocumentOutline,
    //   children: [
    //     {
    //       title: 'List',
    //       path: '/ui/modules/invoice/list'
    //     },
    //     {
    //       title: 'Preview',
    //       path: '/ui/modules/invoice/preview'
    //     },
    //     {
    //       title: 'Edit',
    //       path: '/ui/modules/invoice/edit'
    //     },
    //     {
    //       title: 'Add',
    //       path: '/ui/modules/invoice/add'
    //     }
    //   ]
    // },
    {
      title: 'Users',
      icon: AccountOutline,
      badgeContent: '', // 'new'
      badgeColor: 'primary', // 'error'
      children: [
        {
          title: 'List Users (all)',
          path: '/ui/modules/user/list',
        },
        {
          title: 'View User (id:1)',
          path: '/ui/modules/user/view',
        },
        {
          title: 'User Roles',
          icon: LockOutline,
          children: [
            {
              title: 'Roles',
              path: '/ui/modules/roles',
            },
            {
              title: 'Permissions',
              path: '/ui/modules/permissions',
            },
          ],
        },
        {
          title: 'Authentication',
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
        // {
        //   title: 'Pricing',
        //   path: '/pages/pricing'
        // },
        // {
        //   title: 'FAQ',
        //   path: '/pages/faq'
        // },
        // {
        //   title: 'Knowledge Base',
        //   path: '/pages/knowledge-base'
        // },
        // {
        //   title: 'Miscellaneous',
        //   children: [
        //     {
        //       openInNewTab: true,
        //       title: 'Coming Soon',
        //       path: '/pages/misc/coming-soon'
        //     },
        //     {
        //       openInNewTab: true,
        //       title: 'Under Maintenance',
        //       path: '/pages/misc/under-maintenance'
        //     },
        //     {
        //       openInNewTab: true,
        //       title: 'Page Not Found - 404',
        //       path: '/pages/misc/404-not-found'
        //     },
        //     {
        //       openInNewTab: true,
        //       title: 'Not Authorized - 401',
        //       path: '/pages/misc/401-not-authorized'
        //     },
        //     {
        //       openInNewTab: true,
        //       title: 'Server Error - 500',
        //       path: '/pages/misc/500-server-error'
        //     }
        //   ]
        // }
      ],
    },
    // {
    //   sectionTitle: 'User Interface'
    // },
    // {
    //   title: 'Typography',
    //   icon: FormatLetterCase,
    //   path: '/ui/typography'
    // },
    // {
    //   title: 'Icons',
    //   path: '/ui/icons',
    //   icon: GoogleCirclesExtended
    // },
    // {
    //   title: 'Cards',
    //   icon: CreditCardOutline,
    //   children: [
    //     {
    //       title: 'Basic',
    //       path: '/ui/cards/basic'
    //     },
    //     {
    //       title: 'Statistics',
    //       path: '/ui/cards/statistics'
    //     },
    //     {
    //       title: 'Advanced',
    //       path: '/ui/cards/advanced'
    //     },
    //     {
    //       title: 'Gamification',
    //       path: '/ui/cards/gamification'
    //     },
    //     {
    //       title: 'Actions',
    //       path: '/ui/cards/actions'
    //     },
    //     {
    //       title: 'Widgets',
    //       path: '/ui/cards/widgets'
    //     }
    //   ]
    // },
    // {
    //   badgeContent: '18',
    //   title: 'Components',
    //   icon: ArchiveOutline,
    //   badgeColor: 'primary',
    //   children: [
    //     {
    //       title: 'Accordion',
    //       path: '/components/accordion'
    //     },
    //     {
    //       title: 'Alerts',
    //       path: '/components/alerts'
    //     },
    //     {
    //       title: 'Avatars',
    //       path: '/components/avatars'
    //     },
    //     {
    //       title: 'Badges',
    //       path: '/components/badges'
    //     },
    //     {
    //       title: 'Buttons',
    //       path: '/components/buttons'
    //     },
    //     {
    //       title: 'Button Group',
    //       path: '/components/button-group'
    //     },
    //     {
    //       title: 'Chips',
    //       path: '/components/chips'
    //     },
    //     {
    //       title: 'Dialogs',
    //       path: '/components/dialogs'
    //     },
    //     {
    //       title: 'List',
    //       path: '/components/list'
    //     },
    //     {
    //       title: 'Menu',
    //       path: '/components/menu'
    //     },
    //     {
    //       title: 'Pagination',
    //       path: '/components/pagination'
    //     },
    //     {
    //       title: 'Ratings',
    //       path: '/components/ratings'
    //     },
    //     {
    //       title: 'Snackbar',
    //       path: '/components/snackbar'
    //     },
    //     {
    //       title: 'Swiper',
    //       path: '/components/swiper'
    //     },
    //     {
    //       title: 'Tabs',
    //       path: '/components/tabs'
    //     },
    //     {
    //       title: 'Timeline',
    //       path: '/components/timeline'
    //     },
    //     {
    //       title: 'Toasts',
    //       path: '/components/toast'
    //     },
    //     {
    //       title: 'Tree View',
    //       path: '/components/tree-view'
    //     },
    //     {
    //       title: 'More',
    //       path: '/components/more'
    //     },
    //   ]
    // },
    // {
    //   sectionTitle: 'Forms & Tables'
    // },
    // {
    //   title: 'Form Elements',
    //   icon: FormSelect,
    //   children: [
    //     {
    //       title: 'Text Field',
    //       path: '/forms/form-elements/text-field'
    //     },
    //     {
    //       title: 'Select',
    //       path: '/forms/form-elements/select'
    //     },
    //     {
    //       title: 'Checkbox',
    //       path: '/forms/form-elements/checkbox'
    //     },
    //     {
    //       title: 'Radio',
    //       path: '/forms/form-elements/radio'
    //     },
    //     {
    //       title: 'Textarea',
    //       path: '/forms/form-elements/textarea'
    //     },
    //     {
    //       title: 'Autocomplete',
    //       path: '/forms/form-elements/autocomplete'
    //     },
    //     {
    //       title: 'Date Pickers',
    //       path: '/forms/form-elements/pickers'
    //     },
    //     {
    //       title: 'Switch',
    //       path: '/forms/form-elements/switch'
    //     },
    //     {
    //       title: 'File Uploader',
    //       path: '/forms/form-elements/file-uploader'
    //     },
    //     {
    //       title: 'Editor',
    //       path: '/forms/form-elements/editor'
    //     },
    //     {
    //       title: 'Slider',
    //       path: '/forms/form-elements/slider'
    //     },
    //     {
    //       title: 'Input Mask',
    //       path: '/forms/form-elements/input-mask'
    //     },
    //   ]
    // },
    // {
    //   icon: CubeOutline,
    //   title: 'Form Layouts',
    //   path: '/forms/form-layouts'
    // },
    // {
    //   title: 'Form Validation',
    //   path: '/forms/form-validation',
    //   icon: CheckboxMarkedCircleOutline
    // },
    // {
    //   title: 'Form Wizard',
    //   path: '/forms/form-wizard',
    //   icon: PackageVariantClosed
    // },
    // {
    //   title: 'Table',
    //   icon: Table,
    //   path: '/tables/mui'
    // },
    // {
    //   title: 'Mui DataGrid',
    //   icon: Table,
    //   path: '/tables/data-grid'
    // },
    {
      sectionTitle: 'Reporting',
    },
    {
      title: 'Analytics',
      icon: ChartPie,
      path: '/dashboards/analytics',
    },
    {
      title: 'Charts',
      icon: ChartDonut,
      children: [
        {
          title: 'Apex',
          path: '/charts/apex-charts',
        },
        {
          title: 'Recharts',
          path: '/charts/recharts',
        },
        {
          title: 'ChartJS',
          path: '/charts/chartjs',
        },
      ],
    },
    // {
    //   path: '/acl',
    //   action: 'read',
    //   subject: 'acl-page',
    //   icon: ShieldOutline,
    //   title: 'Access Control'
    // },
    {
      title: 'Raise Support',
      icon: DotsHorizontal,
      externalLink: true,
      openInNewTab: true,
      path: 'https://github.com/marty-mcgee/threed-garden/discussions',
    },
    {
      title: 'Documentation',
      icon: FileDocumentOutline,
      externalLink: true,
      openInNewTab: true,
      path: 'https://github.com/marty-mcgee/threed-garden',
    },
    // {
    //   title: 'Others',
    //   icon: DotsHorizontal,
    //   children: [
    //     {
    //       title: 'Menu Levels',
    //       children: [
    //         {
    //           title: 'Menu Level 2.1'
    //         },
    //         {
    //           title: 'Menu Level 2.2',
    //           children: [
    //             {
    //               title: 'Menu Level 3.1'
    //             },
    //             {
    //               title: 'Menu Level 3.2'
    //             }
    //           ]
    //         }
    //       ]
    //     },
    //     {
    //       title: 'Disabled Menu',
    //       disabled: true
    //     }
    //   ]
    // }
  ]
}

export default navigation
