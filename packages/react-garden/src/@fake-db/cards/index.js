// ** Mock Adapter
import mock from 'src/@fake-db/mock'

const cardStatsData = {
  statsHorizontal: [
    {
      stats: '2,856',
      trend: 'negative',
      trendNumber: '10.2%',
      title: 'New Customers',
      icon: 'AccountOutline'
    },
    {
      stats: '28.6K',
      color: 'success',
      icon: 'CurrencyUsd',
      trendNumber: '25.8%',
      title: 'Total Revenue'
    },
    {
      color: 'info',
      stats: '16.6K',
      trend: 'negative',
      icon: 'TrendingUp',
      trendNumber: '12.1%',
      title: 'New Transactions'
    },
    {
      icon: 'Poll',
      stats: '2,856',
      color: 'warning',
      trendNumber: '54.6%',
      title: 'Total Profit'
    }
  ],
  statsVertical: [
    {
      stats: '862',
      trend: 'negative',
      trendNumber: '-18%',
      title: 'New Project',
      subtitle: 'Yearly Project',
      icon: 'BriefcaseVariantOutline'
    },
    {
      icon: 'Poll',
      stats: '$25.6k',
      color: 'secondary',
      trendNumber: '+42%',
      title: 'Total Profit',
      subtitle: 'Weekly Profit'
    },
    {
      stats: '$95.2k',
      title: 'Revenue',
      color: 'success',
      trendNumber: '+12%',
      icon: 'CurrencyUsd',
      subtitle: 'Revenue Increase'
    },
    {
      color: 'error',
      stats: '44.10k',
      trend: 'negative',
      title: 'Logistics',
      trendNumber: '-25%',
      icon: 'TruckOutline',
      subtitle: 'Regional Logistics'
    },
    {
      stats: '268',
      icon: 'Check',
      title: 'Reports',
      color: 'warning',
      trend: 'negative',
      trendNumber: '-8%',
      subtitle: 'System Bugs'
    },
    {
      stats: '1.2k',
      color: 'info',
      icon: 'TrendingUp',
      trendNumber: '+12%',
      title: 'Transactions',
      subtitle: 'Daily Transactions'
    }
  ],
  statsCharacter: [
    {
      stats: '13.7k',
      title: 'Ratings',
      trendNumber: '+38%',
      chipColor: 'primary',
      chipText: 'Year of 2022',
      src: '/images/cards/pose_f9.png'
    },
    {
      stats: '24.5k',
      trend: 'negative',
      title: 'Sessions',
      trendNumber: '-22%',
      chipText: 'Last Week',
      chipColor: 'secondary',
      src: '/images/cards/pose_m18.png'
    },
    {
      stats: '2,856',
      chipColor: 'info',
      title: 'Customers',
      trendNumber: '+59%',
      chipText: 'Last Quarter',
      src: '/images/cards/pose_m1.png'
    },
    {
      stats: '42.5k',
      trendNumber: '+26%',
      chipColor: 'warning',
      title: 'Total Orders',
      chipText: 'Last Month',
      src: '/images/cards/pose_m35.png'
    }
  ]
}
mock.onGet('/cards/statistics').reply(() => {
  return [200, cardStatsData]
})
