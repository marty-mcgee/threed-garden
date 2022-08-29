// ** Mock Adapter
import mock from 'src/@fake-db/mock'

const data = [
  {
    id: 'common',
    title: 'Common',
    icon: 'HelpCircleOutline',
    subtitle: 'Most asked questions.',
    qAndA: [
      {
        id: 'general-settings',
        question: 'General settings',
        answer:
          'Sesame snaps tart bonbon tiramisu jelly beans lemon drops bear claw candy gummi bears. Caramels pudding sweet donut tootsie roll gummies macaroon. Lemon drops caramels sesame snaps dessert jujubes. Cupcake chocolate bonbon cake tiramisu. Gummies candy canes ice cream biscuit. Jelly gummies wafer danish chupa chups sugar plum cookie.'
      },
      {
        id: 'users',
        question: 'Users',
        answer:
          'Chocolate sweet roll lemon drops chocolate cake candy canes halvah. Donut fruitcake sweet roll brownie carrot cake cake. Donut jujubes pudding candy macaroon. Gummies gingerbread croissant bonbon. Cookie toffee cupcake cotton candy candy canes dessert cotton candy liquorice. Jelly beans gummi bears toffee chocolate bar chocolate cake.'
      },
      {
        id: 'personal-data',
        question: 'Personal data',
        answer:
          'Liquorice pie donut tootsie roll marzipan liquorice topping pie. Muffin sweet roll soufflé croissant cookie cotton candy toffee. Tootsie roll chocolate cake wafer jelly beans soufflé danish tart. Halvah dragée chocolate bar gingerbread apple pie ice cream ice cream fruitcake. Chocolate bar pudding apple pie cheesecake dragée topping ice cream cookie.'
      },
      {
        id: 'advanced-settings',
        question: 'Advanced settings',
        answer:
          'Halvah liquorice pastry marshmallow sugar plum. Dessert chocolate pastry gummi bears pastry. Gingerbread bonbon pudding oat cake jujubes pie wafer tart brownie. Soufflé jujubes icing powder liquorice. Sweet donut toffee liquorice dessert dragée. Topping cake danish chupa chups chupa chups gummies. Cotton candy gummies chocolate cake oat cake.'
      }
    ]
  },
  {
    id: 'payment',
    title: 'Payment',
    icon: 'CurrencyUsd',
    subtitle: 'Payment methods questions.',
    qAndA: [
      {
        id: 'subscription',
        question: 'Does my subscription automatically renew?',
        answer:
          'Gummi bears marshmallow lemon drops bear claw tootsie roll. Powder marzipan icing cake gummies bonbon pie candy canes dragée. Soufflé chupa chups apple pie bonbon. Caramels gummi bears caramels dragée wafer. Toffee marzipan sugar plum sesame snaps. Bear claw ice cream danish dragée tiramisu tiramisu sugar plum chupa chups muffin.'
      },
      {
        id: 'access',
        question: 'Can I store the item on an intranet so everyone has access?',
        answer:
          'Gummies powder croissant. Tiramisu powder lemon drops halvah cake soufflé. Fruitcake carrot cake cotton candy oat cake croissant cookie. Gingerbread gingerbread carrot cake sweet liquorice danish. Topping topping candy canes sugar plum chocolate. Croissant macaroon lemon drops tart cotton candy bear claw oat cake pastry marshmallow.'
      },
      {
        id: 'non-exclusive',
        question: 'What does non-exclusive mean?',
        answer:
          'Powder muffin gummies cake liquorice halvah danish. Cake oat cake lemon drops dessert. Jelly fruitcake tiramisu chocolate jujubes caramels cotton candy gummi bears. Dessert cupcake lollipop gummies cupcake muffin biscuit biscuit. Brownie sweet cotton candy. Croissant sweet lollipop sesame snaps jelly-o croissant tiramisu dessert chupa chups.'
      },
      {
        id: 'license',
        question: 'Is the Regular License the same thing as an editorial license?',
        answer:
          'Fruitcake marshmallow oat cake sweet chocolate bar topping sesame snaps sesame snaps. Oat cake gummies dessert cake pudding chocolate gummi bears topping. Pudding tootsie roll toffee. Brownie sweet candy canes jujubes pie halvah jelly beans jujubes. Sugar plum cookie donut liquorice gummi bears chocolate. Fruitcake pastry croissant pie bear claw.'
      }
    ]
  },
  {
    id: 'product',
    title: 'Product & Services',
    icon: 'BriefcaseVariantOutline',
    subtitle: 'Product related questions.',
    qAndA: [
      {
        id: 'delivery',
        question: 'Can I avail of an open delivery?',
        answer:
          'Danish croissant candy canes donut wafer pastry. Sugar plum cupcake gingerbread lemon drops soufflé cookie bear claw jelly beans. Brownie cake danish muffin cake toffee cake fruitcake icing. Jujubes icing chupa chups croissant. Topping chocolate cake jelly beans lemon drops biscuit. Gingerbread pastry halvah croissant caramels cheesecake apple pie.'
      },
      {
        id: 'shipment',
        question: 'I haven’t received the refund of my returned shipment. What do I do?',
        answer:
          'Gummies cookie jujubes brownie bonbon chupa chups. Gummi bears danish wafer candy canes. Cheesecake gummies chocolate apple pie apple pie macaroon candy canes chocolate cake. Soufflé sesame snaps pie sesame snaps gummi bears wafer wafer. Marzipan bonbon chupa chups marzipan oat cake pudding biscuit ice cream chocolate cake.'
      },
      {
        id: 'location',
        question: 'How can I ship my order to an international location?',
        answer:
          'Tart jujubes pudding pie candy cheesecake soufflé marshmallow cake. Cake bear claw lemon drops lemon drops jelly beans liquorice sweet roll. Dessert gingerbread cotton candy. Tootsie roll gingerbread cotton candy sugar plum pudding pastry candy canes. Cupcake gummies chocolate bar. Soufflé danish tootsie roll croissant apple pie wafer.'
      },
      {
        id: 'order',
        question: 'I missed the delivery of my order today. What should I do?',
        answer:
          'Chupa chups chocolate jujubes pie gummies caramels chocolate cake gingerbread halvah. Pastry halvah tiramisu icing jujubes carrot cake jujubes candy canes. Wafer ice cream jelly tootsie roll sweet dessert. Candy cookie topping. Dessert topping caramels danish ice cream ice cream. Cotton candy bonbon biscuit cake topping pie ice cream jelly cupcake.'
      }
    ]
  }
]
mock.onGet('/pages/faqs').reply(config => {
  const { q = '' } = config.params ?? ''
  const queryLowered = q.toLowerCase()
  const filteredData = []
  data.forEach(entry => {
    const filteredQAndAOfCategory = entry.qAndA.filter(qAndAObj => {
      return qAndAObj.question.toLowerCase().includes(queryLowered)
    })
    if (filteredQAndAOfCategory.length) {
      filteredData.push({ ...entry, qAndA: filteredQAndAOfCategory })
    }
  })

  return [200, filteredData]
})
