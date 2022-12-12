// Sales dashboard components
import ProductCell from '#/pages/dashboards/sales/components/ProductCell'
import RefundsCell from '#/pages/dashboards/sales/components/RefundsCell'
import DefaultCell from '#/pages/dashboards/sales/components/DefaultCell'

// Images
import nikeV22 from '#/lib/assets/images/ecommerce/blue-shoe.jpeg'
import businessKit from '#/lib/assets/images/ecommerce/black-mug.jpeg'
import blackChair from '#/lib/assets/images/ecommerce/black-chair.jpeg'
import wirelessCharger from '#/lib/assets/images/ecommerce/bang-sound.jpeg'
import tripKit from '#/lib/assets/images/ecommerce/photo-tools.jpeg'

const dataTableData = {
  columns: [
    { Header: 'product', accessor: 'product', width: '55%' },
    { Header: 'value', accessor: 'value' },
    { Header: 'ads spent', accessor: 'adsSpent', align: 'center' },
    { Header: 'refunds', accessor: 'refunds', align: 'center' },
  ],

  rows: [
    {
      product: (
        <ProductCell
          image={nikeV22.src}
          name='Nike v22 Running'
          orders={8.232}
        />
      ),
      value: <DefaultCell>$130.992</DefaultCell>,
      adsSpent: <DefaultCell>$9.500</DefaultCell>,
      refunds: (
        <RefundsCell
          value={13}
          icon={{ color: 'success', name: 'keyboard_arrow_up' }}
        />
      ),
    },
    {
      product: (
        <ProductCell
          image={businessKit.src}
          name='Business Kit (Mug + Notebook)'
          orders={12.821}
        />
      ),
      value: <DefaultCell>$80.250</DefaultCell>,
      adsSpent: <DefaultCell>$4.200</DefaultCell>,
      refunds: (
        <RefundsCell
          value={40}
          icon={{ color: 'error', name: 'keyboard_arrow_down' }}
        />
      ),
    },
    {
      product: (
        <ProductCell
          image={blackChair.src}
          name='Black Chair'
          orders={2.421}
        />
      ),
      value: <DefaultCell>$40.600</DefaultCell>,
      adsSpent: <DefaultCell>$9.430</DefaultCell>,
      refunds: (
        <RefundsCell
          value={54}
          icon={{ color: 'success', name: 'keyboard_arrow_up' }}
        />
      ),
    },
    {
      product: (
        <ProductCell
          image={wirelessCharger.src}
          name='Wireless Charger'
          orders={5.921}
        />
      ),
      value: <DefaultCell>$91.300</DefaultCell>,
      adsSpent: <DefaultCell>$7.364</DefaultCell>,
      refunds: (
        <RefundsCell
          value={5}
          icon={{ color: 'error', name: 'keyboard_arrow_down' }}
        />
      ),
    },
    {
      product: (
        <ProductCell
          image={tripKit.src}
          name='Mountain Trip Kit (Camera + Backpack)'
          orders={921}
        />
      ),
      value: <DefaultCell>$140.925</DefaultCell>,
      adsSpent: <DefaultCell>$20.531</DefaultCell>,
      refunds: (
        <RefundsCell
          value={121}
          icon={{ color: 'success', name: 'keyboard_arrow_up' }}
        />
      ),
    },
  ],
}

export default dataTableData
