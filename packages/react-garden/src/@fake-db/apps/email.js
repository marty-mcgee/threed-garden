// ** Mock Adapter
import mock from 'src/@fake-db/mock'

const data = {
  emails: [
    {
      id: 1,
      from: {
        email: 'tommys@mail.com',
        name: 'Tommy Sicilia',
        avatar: '/images/avatars/1.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@mail.com'
        }
      ],
      subject: 'How to Succeed with Your Shopify Store',
      cc: [],
      bcc: [],
      message:
        '<p>Hi John,</p><p>How to Choose the Perfect Shopify Theme and Build Your Online Store Fast! (keywords: how to create a shopify store, how to start selling on shopify)</p><p>Shopify Tutorials That Will Save You 5 Hours of Time and $150 A Month!</p><p>Can I Start My Own ECommerce Business Without Knowing How To Code?</p><p>The One Thing All Shopify Entrepreneurs Have in Common</p><p>Regrads,</p><p>Tommy Sicilia</p>',
      attachments: [
        {
          fileName: 'log.txt',
          thumbnail: '/images/icons/file-icons/txt.png',
          url: '',
          size: '5mb'
        },
        {
          fileName: 'performance.xls',
          thumbnail: '/images/icons/file-icons/xls.png',
          url: '',
          size: '10mb'
        }
      ],
      isStarred: false,
      labels: ['private'],
      time: 'Mon Dec 10 2018 07:46:00 GMT+0000 (GMT)',
      replies: [],
      folder: 'inbox',
      isRead: true
    },
    {
      id: 2,
      from: {
        email: 'tressag@mail.com',
        name: 'Tressa Gass',
        avatar: '/images/avatars/6.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@mail.com'
        }
      ],
      subject: 'Please find attached the latest Company Report',
      cc: ['vrushankbrahmshatriya@mail.com'],
      bcc: ['menka@mail.com'],
      message:
        ' <p>Hello John,</p><p>I hope you are doing well.</p><p> I am sending over a company report for company. It is a PDF file.</p><p>Please let me know if you want to schedule a call or any other questions.</p><p>Regrads</p><p>Tressa Gass</p>',
      attachments: [
        {
          fileName: 'company-report.pdf',
          thumbnail: '/images/icons/file-icons/pdf.png',
          url: '',
          size: '32mb'
        }
      ],
      isStarred: true,
      labels: ['company', 'private'],
      time: 'Mon Dec 10 2018 07:55:00 GMT+0000 (GMT)',
      replies: [],
      folder: 'inbox',
      isRead: true
    },
    {
      id: 3,
      from: {
        email: 'hettiem@mail.com',
        name: 'Hettie Mcerlean',
        avatar: '/images/avatars/3.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@mail.com'
        }
      ],
      subject: 'Your order has been delivered',
      cc: [],
      bcc: [],
      message:
        '<p>Hello John,</p><p>Your order has just been delivered. Here is the delivery confirmation number: #569443</p><p>Regrads</p><p>If you have any questions, please feel free to reach out to our customer service team at customerService@email.com</p><p>Hettie Mcerlean</p>',
      attachments: [],
      isStarred: false,
      labels: ['company'],
      time: 'Mon Dec 10 2018 08:35:00 GMT+0000 (GMT)',
      replies: [],
      folder: 'spam',
      isRead: true
    },
    {
      id: 4,
      from: {
        email: 'louettae@mail.com',
        name: 'Louetta Esses',
        avatar: '/images/avatars/4.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@mail.com'
        }
      ],
      subject: 'Update Can Change Your Personal Life',
      cc: [],
      bcc: [],
      message:
        '<p>Hi John,</p><p>5 Biggest Ways in Which the Latest iOS Update Can Change Your Personal Life</p><p>1.Group FaceTime</p><p>2. Memoji & Animoji </p><p>3. Person to Person Payments</p><p>4. Screen Time </p><p>5. Shortcuts App on Macs </p><p>Regrads,</p><p>Louetta Esses</p>',
      attachments: [
        {
          fileName: 'update.doc',
          thumbnail: '/images/icons/file-icons/doc.png',
          url: '',
          size: '32mb'
        }
      ],
      isStarred: false,
      labels: ['important'],
      time: 'Mon Dec 11 2018 09:04:10 GMT+0000 (GMT)',
      replies: [],
      folder: 'inbox',
      isRead: true
    },
    {
      id: 5,
      from: {
        email: 'bposvner0@zdnet.com',
        name: 'Bobbie Posvner',
        avatar: '/images/avatars/8.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@dot.gov'
        }
      ],
      subject: 'Your opinion matters to us. Tell us how you feel!',
      cc: [],
      bcc: [],
      message:
        "<p>Hello John,</p><p>Recently you shopped with us and we know your order has been delivered to you.</p><p>Would you please write a review? It's really important to us.</p><p>Regards,</p><p>Bobbie Posvner</p>",
      attachments: [],
      isStarred: true,
      labels: ['private'],
      time: 'Tue Dec 12 2018 11:55:00 GMT+0000 (GMT)',
      replies: [],
      folder: 'spam',
      isRead: true
    },
    {
      id: 6,
      from: {
        email: 'rgilder1@illinois.edu',
        name: 'Rebecca Gilder',
        avatar: '/images/avatars/6.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@google.co.uk'
        }
      ],
      subject: 'World Tourism Day Event Invitation',
      cc: [],
      bcc: [],
      message:
        '<p>Hello John, </p><p>You have been invited to the World Tourism Day event on this weekend.</p><p>The event starts at 10:00 AM and ends at 5:00PM.</p><p>Regards</p><p>Rebecca Gilder</p>',
      attachments: [],
      isStarred: false,
      labels: ['personal'],
      time: 'Thu Dec 13 2018 08:25:00 GMT+0000 (GMT)',
      replies: [],
      folder: 'trash',
      isRead: true
    },
    {
      id: 7,
      from: {
        email: 'swilby2@yandex.ru',
        name: 'Shawn Wilby',
        avatar: '/images/avatars/1.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@altervista.org'
        }
      ],
      subject: 'Delivery Note',
      cc: [],
      bcc: [],
      message:
        '<p>Hello John, </p><p>Shipping Details:</p><p>Order Number: 82080</p><p>Delivered-to: <strong>John Doe</strong></p><p>Email: <strong>johndoe@altervista.org</strong></p><p>Address: <strong>99 El ABCD San Francisco, CA. United States </strong></p><p>Thank You for being with Us!</p><p>Regards</p><p>Shawn Wilby</p>',
      attachments: [],
      isStarred: false,
      labels: ['company'],
      time: 'Fri Dec 14 2018 04:49:23 GMT+0000 (GMT)',
      replies: [],
      folder: 'draft',
      isRead: true
    },
    {
      id: 8,
      from: {
        email: 'wmannering3@mozilla.org',
        name: 'Waldemar Mannering',
        avatar: '/images/avatars/5.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@sciencedaily.com'
        }
      ],
      subject: 'Refer friends. Get rewards.',
      cc: [],
      bcc: [],
      message:
        '<p>Hi John, </p><p>At Auto Sales, we understand that our customers are our greatest resource, and the only real way that an automotive dealership can grow is through word of mouth.</p><p>If you had a wonderful experience with us, the greatest thanks you can give is to pass along your praise and positive experience with Auto Sales to your family, friends, and colleagues.</p><p>As a reward for promoting us, we will pay you $200 for every referral you send our way who purchases a pre-owned vehicle of under $15,000. For every purchase over $15,000, we will pay you a referral of $300.</p><p>Regards</p><p>Waldemar Mannering</p>',
      attachments: [],
      isStarred: false,
      labels: ['private'],
      time: 'Tue Dec 15 2018 11:02:28 GMT+0000 (GMT)',
      replies: [],
      folder: 'inbox',
      isRead: false
    },
    {
      id: 9,
      from: {
        email: 'hfrostdyke4@scientificamerican.com',
        name: 'Heath Frostdyke',
        avatar: '/images/avatars/1.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@weibo.com'
        }
      ],
      subject: 'Good Hair Day!',
      cc: [],
      bcc: [],
      message:
        '<p>Hello John, </p><p>Good Hair Day is all about recognizing the significance a good hair day can have on your confidence, self-esteem, and overall happiness. A good hair day is different for everyone and this year we want to help you achieve your best hair!</p><p>Book with our stylist today to get 10% discount.</p><p>Regards</p><p>Heath Frostdyke</p>',
      attachments: [],
      isStarred: true,
      labels: ['personal'],
      time: 'Tue Jan 01 2018 18:31:19 GMT+0000 (GMT)',
      replies: [],
      folder: 'trash',
      isRead: false
    },
    {
      id: 10,
      from: {
        email: 'pjentzsch5@tamu.edu',
        name: 'Paulita Jentzsch',
        avatar: '/images/avatars/7.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@skype.com'
        }
      ],
      subject: 'Travel to Europe',
      cc: [],
      bcc: [],
      message:
        '<p>Hello John, </p><p>Use code WILD_TRAVELER to get 25% off on flight bookings to Europe.</p><p>Offer only valid till the weekends.</p><p>Regards</p><p>Paulita Jentzsch</p>',
      attachments: [],
      isStarred: true,
      labels: ['important'],
      time: 'Tue Jan 03 2018 08:05:33 GMT+0000 (GMT)',
      replies: [],
      folder: 'draft',
      isRead: false
    },
    {
      id: 11,
      from: {
        email: 'lminghetti6@yale.edu',
        name: 'Lowell Minghetti',
        avatar: '/images/avatars/4.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@fda.gov'
        }
      ],
      subject: 'Cyber Monday Sale!',
      cc: [],
      bcc: [],
      message:
        '<p>Hi John, </p><p>Take 30% Off Your Entire Purchase!</p><p>This monday you can take 30% off your entire purchase! Simply enter the promo code HGASNC18 during your checkout to activate your savings! </p><p>Regards</p><p>Lowell Minghetti</p>',
      attachments: [
        {
          fileName: 'ElementumLigula.js',
          thumbnail: '/images/icons/file-icons/js.png',
          url: '',
          size: '29mb'
        }
      ],
      isStarred: false,
      labels: ['company'],
      time: 'Tue Jan 03 2018 01:05:20 GMT+0000 (GMT)',
      replies: [],
      folder: 'trash',
      isRead: true
    },
    {
      id: 12,
      from: {
        email: 'efinessy7@sbwire.com',
        name: 'Eugenie Finessy',
        avatar: '/images/avatars/2.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@odnoklassniki.ru'
        }
      ],
      subject: "BOOK LOVER'S DAY",
      cc: [],
      bcc: [],
      message:
        '<p>Hello John, </p><p>Whenever you read a good book, you are making efforts to open a new door to let more light come in.</p><p>May you are blessed with more and more books. Happy National Book Lover’s Day to you.</p><p>Regards</p><p>Eugenie Finessy</p>',
      attachments: [],
      isStarred: false,
      labels: ['personal'],
      time: 'Tue Jan 04 2018 21:26:54 GMT+0000 (GMT)',
      replies: [],
      folder: 'sent',
      isRead: true
    },
    {
      id: 13,
      from: {
        email: 'tmckeurton8@163.com',
        name: 'Tadio McKeurton',
        avatar: '/images/avatars/3.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@nifty.com'
        }
      ],
      subject: 'Handmade Goods',
      cc: [],
      bcc: [],
      message:
        '<p>Hey John, </p><p>Painted wood blocks, stackable wood blocks</p> <p>Fall is almost here and these little blocks are the perfect décor to begin your fall decorating! These stacked blocks say Count Your Blessings and are in beautiful fall colors.</p><p>Regards</p><p>Tadio McKeurton</p>',
      attachments: [],
      isStarred: false,
      labels: ['important'],
      time: 'Tue Jan 05 2018 19:00:00 GMT+0000 (GMT)',
      replies: [],
      folder: 'draft',
      isRead: true
    },
    {
      id: 14,
      from: {
        email: 'ebegg9@wikia.com',
        name: 'Eb Begg',
        avatar: '/images/avatars/8.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@51.la'
        }
      ],
      subject: 'App Update',
      cc: [],
      bcc: [],
      message:
        '<p>Hello John, </p><p>We have released the update 8.6.1 for the app</p><p>Update your application. Don’t miss our new Feature</p><p>Regards</p><p>Eb Begg</p>',
      attachments: [],
      isStarred: false,
      labels: ['company'],
      time: 'Tue Jan 06 2018 23:12:13 GMT+0000 (GMT)',
      replies: [],
      folder: 'inbox',
      isRead: true
    },
    {
      id: 15,
      from: {
        email: 'mspata@sina.com.cn',
        name: 'Modestine Spat',
        avatar: '/images/avatars/3.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@oracle.com'
        }
      ],
      subject: 'Password Reset',
      cc: [],
      bcc: [],
      message:
        '<p>Hey John, </p><p>I just wanted to let you know that your password has been changed. You can safely ignore this email if you requested this change.</p><p>Otherwise, please do let us know and we will be here to help. </p><p>Regards</p><p>Modestine Spat</p>',
      attachments: [],
      isStarred: false,
      labels: ['company'],
      time: 'Tue Jan 07 2018 12:25:03 GMT+0000 (GMT)',
      replies: [],
      folder: 'inbox',
      isRead: false
    },
    {
      id: 16,
      from: {
        email: 'cprandob@rambler.ru',
        name: 'Chase Prando',
        avatar: '/images/avatars/4.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@vistaprint.com'
        }
      ],
      subject: 'Course Update',
      cc: [],
      bcc: [],
      message:
        '<p>Hey John, </p><p>You have completed more than 68% of the course</p><p>We noticed that you have not attended or advanced the course for over a week.</p><p>It is very important for us that you finish your studies, as regular classes are a guarantee of knowledge and successful completion!</p><p>For help, we have allocated a free opportunity to contact the course teacher within 2 days</p><p>Regards</p><p>Chase Prando</p>',
      attachments: [],
      isStarred: false,
      labels: ['company'],
      time: 'Tue Jan 08 2018 00:36:40 GMT+0000 (GMT)',
      replies: [],
      folder: 'sent',
      isRead: true
    },
    {
      id: 17,
      from: {
        email: 'nbartlesc@merriam-webster.com',
        name: 'Normand Bartles',
        avatar: '/images/avatars/8.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@si.edu'
        }
      ],
      subject: 'Earth Hour',
      cc: [],
      bcc: [],
      message:
        '<p>Hey John, </p><p>Earth Hour has always drawn its power from the people - and this year was no exception. We showed that despite the physical distance, we were still able to unite digitally to speak up for nature louder than ever.</p><p>You can still take part in the earth hour virtual spotlight.</p><p>Regards</p><p>Normand Bartles</p>',
      attachments: [],
      isStarred: false,
      labels: ['personal'],
      time: 'Tue Jan 09 2018 22:06:50 GMT+0000 (GMT)',
      replies: [],
      folder: 'spam',
      isRead: true
    },
    {
      id: 18,
      from: {
        email: 'rgennd@dedecms.com',
        name: 'Robin Genn',
        avatar: '/images/avatars/6.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@about.com'
        }
      ],
      subject: "Happy Teacher's Day!",
      cc: [],
      bcc: [],
      message:
        "<p>Happy Teacher's Day John, </p><p>Teachers have to lead by example, and you have always been an excellent example to follow. As a student, I feel very grateful to have such a great mentor in my life. Happy Teacher’s Day!</p><p>Especially for Teacher's Day, we held a postcard competition for students. We invite you to enjoy this creativity. The kids tried very hard!</p><p>Regards</p><p>Robin Genn</p>",
      attachments: [],
      isStarred: true,
      labels: ['personal'],
      time: 'Tue Jan 10 2018 01:51:24 GMT+0000 (GMT)',
      replies: [],
      folder: 'spam',
      isRead: true
    },
    {
      id: 19,
      from: {
        email: 'eramelote@webeden.co.uk',
        name: 'Emmalynn Ramelot',
        avatar: '/images/avatars/8.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@tinypic.com'
        }
      ],
      subject: 'Newly Improved Product',
      cc: [],
      bcc: [],
      message:
        '<p>Hey John, </p><p>The Newly Improved Product is Here!</p><p>What is New in Finance?</p><p>1. Dual Authentication</p><p>2. Transparent System</p><p>3. Beta Test </p><p>Regards</p><p>Emmalynn Ramelot</p>',
      attachments: [],
      isStarred: true,
      labels: ['personal'],
      time: 'Tue Jan 11 2018 14:25:46 GMT+0000 (GMT)',
      replies: [],
      folder: 'spam',
      isRead: false
    },
    {
      id: 20,
      from: {
        email: 'pcuzenf@mediafire.com',
        name: 'Penni Cuzen',
        avatar: '/images/avatars/8.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@google.es'
        }
      ],
      subject: 'Meet your new banker.',
      cc: [],
      bcc: [],
      message:
        "<p>Hey John, </p><p>Having a direct human contact that understands the finance industry can take your project to the next level.</p><p>Amelia is that person for you. She's happy to help with any of your project needs.</p><p>Regards</p><p>Penni Cuzen</p>",
      attachments: [
        {
          fileName: 'bank-statement.pdf',
          thumbnail: '/images/icons/file-icons/pdf.png',
          url: '',
          size: '4mb'
        }
      ],
      isStarred: false,
      labels: ['private'],
      time: 'Tue Jan 12 2018 04:16:10 GMT+0000 (GMT)',
      replies: [
        {
          id: 40,
          from: {
            email: 'johndoe@mail.com',
            name: 'John Doe',
            avatar: '/images/avatars/6.png'
          },
          to: [
            {
              name: 'me',
              email: 'hettiem@mail.com'
            }
          ],
          subject: 'It was the best sandcastle he had ever seen.',
          cc: [],
          bcc: [],
          message:
            '<p>Hello Hettie,</p><p>Marshmallow cookie jelly liquorice. Powder macaroon cake pastry biscuit. Cotton candy cotton candy jelly chocolate bar. Sesame snaps candy gummi bears cake cookie jujubes. Sweet I love sweet roll. Sesame snaps I love marzipan. Jelly powder tootsie roll. Marshmallow pudding cookie fruitcake liquorice powder. I love I love cookie chupa chups fruitcake ice cream I love biscuit I love. Tiramisu apple pie candy canes cookie gummies. Donut toffee bear claw topping jelly-o. Cupcake icing muffin. Cookie brownie wafer pie sweet. Icing sesame snaps halvah toffee marshmallow lemon drops jelly.</p><p>Tiramisu candy canes powder. Powder chocolate bar halvah liquorice cake I love danish. Cake wafer apple pie. Bear claw fruitcake I love marzipan dessert marzipan lollipop. Halvah gingerbread jelly chupa chups tiramisu I love wafer gummi bears. Candy powder caramels candy gummies. Tart tart cupcake brownie. Bear claw gummies toffee. Tiramisu donut cake chocolate bar. Halvah chocolate bar donut jelly-o. Icing candy brownie chocolate. Pastry bear claw halvah gummies chocolate bar chocolate. Apple pie danish wafer I love biscuit.</p><p>Regrads,</p><p>John Doe</p>',
          attachments: [],
          isStarred: false,
          labels: [],
          time: 'Mon Dec 15 2018 10:56:00 GMT+0000 (GMT)',
          replies: [],
          folder: 'inbox',
          isRead: false
        },
        {
          id: 41,
          from: {
            email: 'hettiem@mail.com',
            name: 'Hettie Mcerlean',
            avatar: '/images/avatars/1.png'
          },
          to: [
            {
              name: 'me',
              email: 'johndoe@mail.com'
            }
          ],
          subject: 'I’m a living furnace.',
          cc: [],
          bcc: [],
          message:
            '<p>Oat cake tart danish jelly beans brownie I love. Liquorice I love lollipop chocolate cake carrot cake toffee. Tart muffin candy canes croissant sugar plum lollipop. Macaroon cheesecake marshmallow powder sweet roll bonbon candy apple pie candy canes.</p><p>Regrads,</p><p>Hettie Mcerlean</p>',
          attachments: [],
          isStarred: false,
          labels: [],
          time: 'Mon Dec 16 2018 11:25:00 GMT+0000 (GMT)',
          replies: [],
          folder: 'inbox',
          isRead: false
        }
      ],
      folder: 'spam',
      isRead: false
    },
    {
      id: 21,
      from: {
        email: 'abaldersong@utexas.edu',
        name: 'Ardis Balderson',
        avatar: '/images/avatars/2.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@ow.ly'
        }
      ],
      subject: 'Bank transfer initiated.',
      cc: [],
      bcc: [],
      message:
        '<p>Hey John, </p><p>Bank transfers initiated before 7 PM ET on business days will typically be available in your bank account the next business day. Business days are Mon-Fri, excluding bank holidays.</p><p>Transfers are reviewed which may result in delays or funds being frozen or removed from your account. Learn more</p><p>Regards</p><p>Ardis Balderson</p>',
      attachments: [],
      isStarred: true,
      labels: ['company'],
      time: new Date(new Date().getTime() - 7 * 60 * 60 * 1000),
      replies: [],
      folder: 'inbox',
      isRead: false
    },
    {
      id: 22,
      from: {
        email: 'dmallallh@ask.com',
        name: 'Dagmar Mallall',
        avatar: '/images/avatars/8.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@furl.net'
        }
      ],
      subject: 'Accounting software',
      cc: [],
      bcc: [],
      message:
        '<p>Hey John, </p><p>Take on the market with our powerful platforms.</p><p>Log in online anytime, anywhere on your Mac, PC, tablet or phone and see up-to-date financials. Accounting software with all the time-saving tools you need to grow your business.</p><p>Regards</p><p>Dagmar Mallall</p>',
      attachments: [],
      isStarred: false,
      labels: ['company'],
      time: new Date(new Date().getTime() - 5 * 20 * 60 * 1000),
      replies: [],
      folder: 'draft',
      isRead: false
    },
    {
      id: 23,
      from: {
        email: 'nmacgaughyi@aol.com',
        name: 'Nada MacGaughy',
        avatar: '/images/avatars/3.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@cnet.com'
        }
      ],
      subject: 'Labor Day Sale',
      cc: [],
      bcc: [],
      message:
        '<p>Hey John, </p><p>There is a time for business and a time for pleasure. There is a time to work and a time to rest. Labor Day is your time for pleasure and rest. Enjoy!</p><p>Sale starting today! Save up to 25% off for all lessons.</p><p>Regards</p><p>Nada MacGaughy</p>',
      attachments: [],
      isStarred: false,
      labels: ['private'],
      time: new Date(new Date().getTime() - 2 * 60 * 60 * 1000),
      replies: [],
      folder: 'trash',
      isRead: false
    },
    {
      id: 24,
      from: {
        email: 'douldcottj@yellowpages.com',
        name: 'Dalila Ouldcott',
        avatar: '/images/avatars/1.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@github.io'
        }
      ],
      subject: 'Order Feedback',
      cc: [],
      bcc: [],
      message:
        "<p>Hey John, </p><p>What did you think o your recent purchase?</p><p> We'd love to hear your feedback on your recent order. Please share your experience in a review to help other pet parents just like you.</p><p>Regards</p><p>Dalila Ouldcott</p>",
      attachments: [
        {
          fileName: 'example.doc',
          thumbnail: '/images/icons/file-icons/doc.png',
          url: '',
          size: '21mb'
        }
      ],
      isStarred: false,
      labels: ['personal'],
      time: new Date(new Date().getTime() - 1 * 30 * 60 * 1000),
      replies: [
        {
          id: 25,
          from: {
            email: 'johndoe@mail.com',
            name: 'John Doe',
            avatar: '/images/avatars/1.png'
          },
          to: [
            {
              name: 'me',
              email: 'hettiem@mail.com'
            }
          ],
          subject: '🎯 Focused impactful open system',
          cc: [],
          bcc: [],
          message:
            '<p>Hello Hettie,</p><p>Marshmallow cookie jelly liquorice. Powder macaroon cake pastry biscuit. Cotton candy cotton candy jelly chocolate bar. Sesame snaps candy gummi bears cake cookie jujubes. Sweet I love sweet roll. Sesame snaps I love marzipan. Jelly powder tootsie roll. Marshmallow pudding cookie fruitcake liquorice powder. I love I love cookie chupa chups fruitcake ice cream I love biscuit I love. Tiramisu apple pie candy canes cookie gummies. Donut toffee bear claw topping jelly-o. Cupcake icing muffin. Cookie brownie wafer pie sweet. Icing sesame snaps halvah toffee marshmallow lemon drops jelly.</p><p>Tiramisu candy canes powder. Powder chocolate bar halvah liquorice cake I love danish. Cake wafer apple pie. Bear claw fruitcake I love marzipan dessert marzipan lollipop. Halvah gingerbread jelly chupa chups tiramisu I love wafer gummi bears. Candy powder caramels candy gummies. Tart tart cupcake brownie. Bear claw gummies toffee. Tiramisu donut cake chocolate bar. Halvah chocolate bar donut jelly-o. Icing candy brownie chocolate. Pastry bear claw halvah gummies chocolate bar chocolate. Apple pie danish wafer I love biscuit.</p><p>Regrads,</p><p>John Doe</p>',
          attachments: [],
          isStarred: false,
          labels: [],
          time: 'Mon Dec 10 2018 10:56:00 GMT+0000 (GMT)',
          replies: [],
          folder: 'inbox',
          isRead: false
        },
        {
          id: 26,
          from: {
            email: 'hettiem@mail.com',
            name: 'Hettie Mcerlean',
            avatar: '/images/avatars/3.png'
          },
          to: [
            {
              name: 'me',
              email: 'johndoe@mail.com'
            }
          ],
          subject: 'Profound systemic alliance 🎉 🎊',
          cc: [],
          bcc: [],
          message:
            '<p>Oat cake tart danish jelly beans brownie I love. Liquorice I love lollipop chocolate cake carrot cake toffee. Tart muffin candy canes croissant sugar plum lollipop. Macaroon cheesecake marshmallow powder sweet roll bonbon candy apple pie candy canes.</p><p>Regrads,</p><p>Hettie Mcerlean</p>',
          attachments: [],
          isStarred: false,
          labels: [],
          time: 'Mon Dec 10 2018 11:25:00 GMT+0000 (GMT)',
          replies: [],
          folder: 'inbox',
          isRead: false
        }
      ],
      folder: 'inbox',
      isRead: true
    },
    {
      id: 27,
      from: {
        email: 'lkubicek0@cdbaby.com',
        name: 'Lockwood Kubicek',
        avatar: '/images/avatars/2.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@github.io'
        }
      ],
      subject: 'Finally Start Running',
      cc: [],
      bcc: [],
      message:
        '<p>Hey John, </p><p>How TO Finally Start Running</p><p>Order an individual training and nutrition program from our specialists! Only now there is a 20% discount! </p><p>Regards</p><p>Lockwood Kubicek</p>',
      attachments: [],
      isStarred: false,
      labels: ['private'],
      time: new Date(new Date().getTime() - 1 * 30 * 60 * 1000),
      replies: [],
      folder: 'inbox',
      isRead: true
    },
    {
      id: 28,
      from: {
        email: 'mosgarby1@accuweather.com',
        name: 'Milena Osgarby',
        avatar: '/images/avatars/3.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@github.io'
        }
      ],
      subject: 'Eco Food',
      cc: [],
      bcc: [],
      message:
        '<p>Hey John, </p><p>Hey! We replenish our assortment with healthy eco food. On this occasion, we really want to play the same game with you! Can you guess what category of new products we are adding?🍯🍓🍵</p><p>Test your intuition, answer the letter!🔮 All members will receive a discount 20% on purchases in the next email!💌</p><p>Regards</p><p>Milena Osgarby</p>',
      attachments: [],
      isStarred: false,
      labels: ['important'],
      time: new Date(new Date().getTime() - 1 * 30 * 60 * 1000),
      replies: [
        {
          id: 50,
          from: {
            email: 'johndoe@mail.com',
            name: 'John Doe',
            avatar: '/images/avatars/6.png'
          },
          to: [
            {
              name: 'me',
              email: 'hettiem@mail.com'
            }
          ],
          subject: 'It was the best sandcastle he had ever seen.',
          cc: [],
          bcc: [],
          message:
            '<p>Hello Hettie,</p><p>Marshmallow cookie jelly liquorice. Powder macaroon cake pastry biscuit. Cotton candy cotton candy jelly chocolate bar. Sesame snaps candy gummi bears cake cookie jujubes. Sweet I love sweet roll. Sesame snaps I love marzipan. Jelly powder tootsie roll. Marshmallow pudding cookie fruitcake liquorice powder. I love I love cookie chupa chups fruitcake ice cream I love biscuit I love. Tiramisu apple pie candy canes cookie gummies. Donut toffee bear claw topping jelly-o. Cupcake icing muffin. Cookie brownie wafer pie sweet. Icing sesame snaps halvah toffee marshmallow lemon drops jelly.</p><p>Tiramisu candy canes powder. Powder chocolate bar halvah liquorice cake I love danish. Cake wafer apple pie. Bear claw fruitcake I love marzipan dessert marzipan lollipop. Halvah gingerbread jelly chupa chups tiramisu I love wafer gummi bears. Candy powder caramels candy gummies. Tart tart cupcake brownie. Bear claw gummies toffee. Tiramisu donut cake chocolate bar. Halvah chocolate bar donut jelly-o. Icing candy brownie chocolate. Pastry bear claw halvah gummies chocolate bar chocolate. Apple pie danish wafer I love biscuit.</p><p>Regrads,</p><p>John Doe</p>',
          attachments: [],
          isStarred: false,
          labels: [],
          time: 'Mon Dec 15 2018 10:56:00 GMT+0000 (GMT)',
          replies: [],
          folder: 'inbox',
          isRead: false
        },
        {
          id: 51,
          from: {
            email: 'hettiem@mail.com',
            name: 'Hettie Mcerlean',
            avatar: '/images/avatars/1.png'
          },
          to: [
            {
              name: 'me',
              email: 'johndoe@mail.com'
            }
          ],
          subject: 'I’m a living furnace.',
          cc: [],
          bcc: [],
          message:
            '<p>Oat cake tart danish jelly beans brownie I love. Liquorice I love lollipop chocolate cake carrot cake toffee. Tart muffin candy canes croissant sugar plum lollipop. Macaroon cheesecake marshmallow powder sweet roll bonbon candy apple pie candy canes.</p><p>Regrads,</p><p>Hettie Mcerlean</p>',
          attachments: [],
          isStarred: false,
          labels: [],
          time: 'Mon Dec 16 2018 11:25:00 GMT+0000 (GMT)',
          replies: [],
          folder: 'inbox',
          isRead: false
        }
      ],
      folder: 'inbox',
      isRead: true
    },
    {
      id: 29,
      from: {
        email: 'pBuffay@email.com',
        name: 'Pheoebe Buffay',
        avatar: '/images/avatars/6.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@github.io'
        }
      ],
      subject: 'Personal Insurance',
      cc: [],
      bcc: [],
      message:
        '<p>Hey John, </p><p>Your personal insurance agent</p><p>If you have any problems with questions about your insurance, you can contact your personal agent.</p><p>Regards</p><p>Pheoebe Buffay</p>',
      attachments: [],
      isStarred: false,
      labels: ['personal'],
      time: new Date(new Date().getTime() - 1 * 30 * 60 * 1000),
      replies: [],
      folder: 'inbox',
      isRead: true
    },
    {
      id: 30,
      from: {
        email: 'gabramow2@elegantthemes.com',
        name: 'Gabriel Abramow',
        avatar: '/images/avatars/4.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@github.io'
        }
      ],
      subject: 'Forgot your password?',
      cc: [],
      bcc: [],
      message:
        '<p>Hey John, </p><p>There was a request to change your password!</p><p>If did not make this request, just ignore this email. Otherwise, please click the button below to change your password:</p><p>Regards</p><p>Gabriel Abramow</p>',
      attachments: [],
      isStarred: false,
      labels: ['company'],
      time: new Date(new Date().getTime() - 1 * 30 * 60 * 1000),
      replies: [],
      folder: 'inbox',
      isRead: true
    },
    {
      id: 31,
      from: {
        email: 'tolrenshaw3@twitpic.com',
        name: 'Temple Olrenshaw',
        avatar: '/images/avatars/5.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@github.io'
        }
      ],
      subject: 'April Fools Day Movies',
      cc: [],
      bcc: [],
      message:
        '<p>Hey John, </p><p>The Best Movies on April Fool’s Day</p><p>Finding any genuine April Fool’s moments in movies is kind of like trying to peek through a wheat field to find individual stalks, but at the very least there are a few movies that seem to have the spirit of April Fool’s Day down when it comes to their sense of humor.</p><p>So instead of finding individual scenes about the day in question it seems like more fun to go ahead and treat the reader to a few films that might be great to watch this coming Sunday when the day of fools is upon us.</p><p>Regards</p><p>Temple Olrenshaw</p>',
      attachments: [],
      isStarred: false,
      labels: ['company'],
      time: new Date(new Date().getTime() - 1 * 30 * 60 * 1000),
      replies: [
        {
          id: 32,
          from: {
            email: 'johndoe@mail.com',
            name: 'John Doe',
            avatar: '/images/avatars/1.png'
          },
          to: [
            {
              name: 'me',
              email: 'hettiem@mail.com'
            }
          ],
          subject: 'The underground bunker was filled with chips and candy.',
          cc: [],
          bcc: [],
          message:
            '<p>Hello Hettie,</p><p>Marshmallow cookie jelly liquorice. Powder macaroon cake pastry biscuit. Cotton candy cotton candy jelly chocolate bar. Sesame snaps candy gummi bears cake cookie jujubes. Sweet I love sweet roll. Sesame snaps I love marzipan. Jelly powder tootsie roll. Marshmallow pudding cookie fruitcake liquorice powder. I love I love cookie chupa chups fruitcake ice cream I love biscuit I love. Tiramisu apple pie candy canes cookie gummies. Donut toffee bear claw topping jelly-o. Cupcake icing muffin. Cookie brownie wafer pie sweet. Icing sesame snaps halvah toffee marshmallow lemon drops jelly.</p><p>Tiramisu candy canes powder. Powder chocolate bar halvah liquorice cake I love danish. Cake wafer apple pie. Bear claw fruitcake I love marzipan dessert marzipan lollipop. Halvah gingerbread jelly chupa chups tiramisu I love wafer gummi bears. Candy powder caramels candy gummies. Tart tart cupcake brownie. Bear claw gummies toffee. Tiramisu donut cake chocolate bar. Halvah chocolate bar donut jelly-o. Icing candy brownie chocolate. Pastry bear claw halvah gummies chocolate bar chocolate. Apple pie danish wafer I love biscuit.</p><p>Regrads,</p><p>John Doe</p>',
          attachments: [],
          isStarred: false,
          labels: [],
          time: 'Mon Jan 5 2019 10:56:00 GMT+0000 (GMT)',
          replies: [],
          folder: 'inbox',
          isRead: false
        },
        {
          id: 33,
          from: {
            email: 'hettiem@mail.com',
            name: 'Hettie Mcerlean',
            avatar: '/images/avatars/1.png'
          },
          to: [
            {
              name: 'me',
              email: 'johndoe@mail.com'
            }
          ],
          subject: 'The truth is that you pay for your lifestyle in hours.',
          cc: [],
          bcc: [],
          message:
            '<p>Oat cake tart danish jelly beans brownie I love. Liquorice I love lollipop chocolate cake carrot cake toffee. Tart muffin candy canes croissant sugar plum lollipop. Macaroon cheesecake marshmallow powder sweet roll bonbon candy apple pie candy canes.</p><p>Regrads,</p><p>Hettie Mcerlean</p>',
          attachments: [],
          isStarred: false,
          labels: [],
          time: 'Mon Jan 8 2019 11:25:00 GMT+0000 (GMT)',
          replies: [],
          folder: 'inbox',
          isRead: false
        }
      ],
      folder: 'inbox',
      isRead: true
    },
    {
      id: 66,
      from: {
        email: 'hidden@mail.com',
        name: 'Hidden Mail',
        avatar: '/images/avatars/1.png'
      },
      to: [
        {
          name: 'me',
          email: 'johndoe@mail.com'
        }
      ],
      subject: 'Hidden Mail',
      cc: [],
      bcc: [],
      message:
        '<p>Hi John,</p><p>Biscuit lemon drops marshmallow. Cotton candy marshmallow bear claw. Dragée tiramisu cookie cotton candy. Carrot cake sweet roll I love macaroon wafer jelly soufflé I love dragée. Jujubes jelly I love carrot cake topping I love. Sweet candy I love chupa chups dragée. Tart I love gummies. Chocolate bar carrot cake candy wafer candy canes oat cake I love. Sesame snaps icing pudding sweet roll marshmallow. Cupcake brownie sweet roll chocolate bar I love gummies. Biscuit biscuit macaroon sesame snaps macaroon icing I love soufflé caramels. Apple pie candy jelly. I love icing gummi bears jelly-o pie muffin apple pie.</p><p>Marshmallow halvah brownie cake marzipan ice cream marshmallow. I love lollipop toffee croissant liquorice wafer muffin. Lollipop jelly beans caramels lollipop tootsie roll pudding pie macaroon tootsie roll. Oat cake jujubes gummies cake cake powder cupcake soufflé muffin. Chocolate caramels muffin tart. Jelly beans caramels dessert cotton candy liquorice chocolate cake. Chupa chups muffin bear claw I love. Biscuit jujubes soufflé tart caramels pie sugar plum. Croissant jelly beans cake. Ice cream chocolate liquorice dessert cookie chocolate cake. Powder tart sweet roll macaroon croissant. Sweet tootsie roll macaroon gummi bears macaroon. Gingerbread cake tart.</p><p>Regrads,</p><p>Kristeen Sicilia</p>',
      attachments: [],
      isStarred: true,
      labels: ['private'],
      time: 'Mon Dec 10 2018 07:46:00 GMT+0000 (GMT)',
      replies: [],
      folder: 'starred',
      isRead: true
    }
  ]
}
let paramsFilteredMails = []

// ------------------------------------------------
// GET: Return Emails
mock.onGet('/apps/email/allEmails').reply(() => {
  return [200, { emails: data.emails }]
})

// ------------------------------------------------
// GET: Return Emails
mock.onGet('/apps/email/emails').reply(config => {
  const { q = '', folder = 'inbox', label } = config.params
  const queryLowered = q.toLowerCase()
  function isInFolder(email) {
    if (folder === 'trash') return email.folder === 'trash'
    if (folder === 'starred') return email.isStarred && email.folder !== 'trash'

    return email.folder === (folder || email.folder) && email.folder !== 'trash'
  }

  const filteredData = data.emails.filter(
    email =>
      (email.from.name.toLowerCase().includes(queryLowered) ||
        email.subject.toLowerCase().includes(queryLowered) ||
        email.message.toLowerCase().includes(queryLowered)) &&
      isInFolder(email) &&
      (label ? email.labels.includes(label) : true)
  )
  paramsFilteredMails = filteredData

  // ------------------------------------------------
  // Email Meta
  // ------------------------------------------------
  const emailsMeta = {
    inbox: data.emails.filter(email => !email.isRead && email.folder === 'inbox').length,
    draft: data.emails.filter(email => email.folder === 'draft').length,
    spam: data.emails.filter(email => !email.isRead && email.folder === 'spam').length
  }

  return [
    200,
    {
      emails: filteredData,
      emailsMeta
    }
  ]
})

// ------------------------------------------------
// POST: Update Emails Label
// ------------------------------------------------
mock.onPost('/apps/email/update-emails-label').reply(config => {
  const { emailIds, label } = JSON.parse(config.data).data
  function updateMailLabels(email) {
    const labelIndex = email.labels.indexOf(label)
    if (labelIndex === -1) email.labels.push(label)
    else email.labels.splice(labelIndex, 1)
  }
  data.emails.forEach(email => {
    if (emailIds.includes(email.id)) updateMailLabels(email)
  })

  return [200]
})

// ------------------------------------------------
// GET: GET Single Email
// ------------------------------------------------
mock.onGet('/apps/email/get-email').reply(config => {
  const { id } = config.params
  const emailId = Number(id)
  const mail = paramsFilteredMails.find(i => i.id === emailId)
  if (mail) {
    const mailIndex = paramsFilteredMails.findIndex(i => i.id === mail.id)
    mailIndex > 0 ? (mail.hasPreviousMail = true) : (mail.hasPreviousMail = false)
    mailIndex < paramsFilteredMails.length - 1 ? (mail.hasNextMail = true) : (mail.hasNextMail = false)
  }

  return mail ? [200, mail] : [404]
})

// ------------------------------------------------
// POST: Update Email
// ------------------------------------------------
mock.onPost('/apps/email/update-emails').reply(config => {
  const { emailIds, dataToUpdate } = JSON.parse(config.data).data
  function updateMailData(email) {
    Object.assign(email, dataToUpdate)
  }
  data.emails.forEach(email => {
    if (emailIds.includes(email.id)) updateMailData(email)
  })

  return [200]
})

// ------------------------------------------------
// GET: Paginate Existing Email
// ------------------------------------------------
mock.onGet('/apps/email/paginate-email').reply(config => {
  const { dir, emailId } = config.params
  const currentEmailIndex = paramsFilteredMails.findIndex(e => e.id === emailId)
  const newEmailIndex = dir === 'previous' ? currentEmailIndex - 1 : currentEmailIndex + 1
  const newEmail = paramsFilteredMails[newEmailIndex]
  if (newEmail) {
    const mailIndex = paramsFilteredMails.findIndex(i => i.id === newEmail.id)
    mailIndex > 0 ? (newEmail.hasPreviousMail = true) : (newEmail.hasPreviousMail = false)
    mailIndex < paramsFilteredMails.length - 1 ? (newEmail.hasNextMail = true) : (newEmail.hasNextMail = false)
  }

  return newEmail ? [200, newEmail] : [404]
})
