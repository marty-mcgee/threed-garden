// ** Mock Adapter
import mock from 'src/@fake-db/mock'

const data = {
  knowledgeBase: [
    {
      imgWidth: 142,
      imgHeight: 180,
      title: 'Sales Automation 👩🏻‍💻',
      category: 'sales-automation',
      imgSrc: '/images/pages/kb-sales.png',
      desc: 'There is perhaps no better demonstration of the folly of image of our tiny world.'
    },
    {
      imgWidth: 186,
      imgHeight: 180,
      title: 'Marketing Automation 🚀',
      category: 'marketing-automation',
      imgSrc: '/images/pages/kb-marketing.png',
      desc: 'Look again at that dot. That’s here. That’s home. That’s us. On it everyone you love.'
    },
    {
      imgWidth: 125,
      imgHeight: 180,
      title: 'API Questions 📱',
      category: 'api-questions',
      imgSrc: '/images/pages/kb-api.png',
      desc: 'Every hero and coward, every creator and destroyer of civilization.'
    },
    {
      imgWidth: 172,
      imgHeight: 180,
      title: 'Email Marketing ✉️',
      category: 'email-marketing',
      imgSrc: '/images/pages/kb-email.png',
      desc: 'There is perhaps no better demonstration of the folly of human conceits.'
    },
    {
      imgWidth: 166,
      imgHeight: 180,
      title: 'Personalization 🤩',
      category: 'personalization',
      imgSrc: '/images/pages/kb-personalization.png',
      desc: 'It has been said that astronomy is a humbling and character experience.'
    },
    {
      imgWidth: 161,
      imgHeight: 180,
      title: 'Demand Generation 🤟🏻',
      category: 'demand-generation',
      imgSrc: '/images/pages/kb-demand.png',
      desc: 'Competent means we will never take anything for granted.'
    }
  ],
  knowledgeBaseCategory: [
    {
      icon: 'CogOutline',
      iconColor: 'primary',
      title: 'Account Settings',
      questions: [
        {
          slug: 'how-secure-is-my-password',
          question: 'How Secure Is My Password?'
        },
        {
          slug: 'can-i-change-my-username',
          question: 'Can I Change My Username?'
        },
        {
          slug: 'where-can-i-upload-my-avatar',
          question: 'Where Can I Upload My Avatar?'
        },
        {
          slug: 'how-do-i-change-my-timezone',
          question: 'How Do I Change My Timezone?'
        },
        {
          slug: 'how-do-i-change-my-password',
          question: 'How Do I Change My Password?'
        }
      ]
    },
    {
      icon: 'Link',
      iconColor: 'success',
      title: 'API Questions',
      questions: [
        {
          slug: 'what-technologies-are-used',
          question: 'What Technologies Are Used?'
        },
        {
          slug: 'what-are-the-api-limits',
          question: 'What Are The API Limits?'
        },
        {
          slug: 'why-was-my-application-rejected',
          question: 'Why Was My Application Rejected?'
        },
        {
          slug: 'where-can-i-find-the-documentation',
          question: 'Where can I find the documentation?'
        },
        {
          slug: 'how-do-i-get-an-api-key',
          question: 'How Do I Get An API Key?'
        }
      ]
    },
    {
      title: 'Billing',
      iconColor: 'error',
      icon: 'CurrencyUsd',
      questions: [
        {
          slug: 'can-i-contact-a-salés-rep',
          question: 'Can I Contact A Salés Rep?'
        },
        {
          slug: 'do-i-need-to-pay-vat',
          question: 'Do I Need To Pay VAT?'
        },
        {
          slug: 'can-i-get-a-refund',
          question: 'Can I Get A Refund?'
        },
        {
          slug: 'difference-annual-&-monthly-billing',
          question: 'Difference Annual & Monthly Billing'
        },
        {
          slug: 'what-happens-if-the-price-increases',
          question: 'What Happens If The Price Increases?'
        }
      ]
    },
    {
      iconColor: 'warning',
      icon: 'LockOpenOutline',
      title: 'Copyright & Legal',
      questions: [
        {
          slug: 'how-do-i-contact-legal',
          question: 'How Do I Contact Legal?'
        },
        {
          slug: 'where-are-your-offices-located',
          question: 'Where Are Your Offices Located?'
        },
        {
          slug: 'who-owns-the-copyright-on-text',
          question: 'Who Owns The Copyright On Text?'
        },
        {
          slug: 'our-content-policy',
          question: 'Our Content Policy'
        },
        {
          slug: 'how-do-i-file-a-dmca',
          question: 'How Do I File A DMCA?'
        }
      ]
    },
    {
      icon: 'Cellphone',
      iconColor: 'info',
      title: 'Mobile Apps',
      questions: [
        {
          slug: 'how-do-i-download-the-android-app',
          question: 'How Do I Download The Android App?'
        },
        {
          slug: 'how-to-download-our-iPad-app',
          question: 'How To Download Our iPad App'
        },
        {
          slug: 'where-can-i-upload-my-avatar',
          question: 'Where Can I Upload My Avatar?'
        },
        {
          slug: 'can-i-use-my-android-phone',
          question: 'Can I Use My Android Phone?'
        },
        {
          slug: 'is-there-an-iOS-app',
          question: 'Is There An iOS App?'
        }
      ]
    },
    {
      title: 'Using KnowHow',
      icon: 'InformationOutline',
      questions: [
        {
          slug: 'customization',
          question: 'Customization'
        },
        {
          slug: 'upgrading',
          question: 'Upgrading'
        },
        {
          slug: 'customizing-your-theme',
          question: 'Customizing Your Theme'
        },
        {
          slug: 'upgrading-your-theme',
          question: 'Upgrading Your Theme'
        }
      ]
    }
  ]
}

// Knowledge Base
mock.onGet('/pages/knowledge-base').reply(config => {
  const { q = '' } = config.params ?? ''
  const queryLowered = q.toLowerCase()

  const filteredData = data.knowledgeBase.filter(obj => {
    return obj.title.toLowerCase().includes(queryLowered) || obj.desc.toLowerCase().includes(queryLowered)
  })

  return [200, filteredData]
})

// Knowledge Base Category
mock.onGet('/pages/knowledge-base/categories').reply(config => {
  const { q = '' } = config.params ?? ''
  const queryLowered = q.toLowerCase()
  const filteredData = []
  Object.entries(data.knowledgeBaseCategory).forEach(entry => {
    const categoryObj = entry[1]

    const filteredQAndA = categoryObj.questions.filter(obj => {
      return obj.question.toLowerCase().includes(queryLowered)
    })
    if (filteredQAndA.length) {
      filteredData.push({ ...categoryObj, questions: filteredQAndA })
    }
  })

  return [200, filteredData]
})
