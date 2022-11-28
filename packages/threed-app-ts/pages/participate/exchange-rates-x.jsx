import { useQuery, gql } from "@apollo/client"

// string
const EXCHANGE_RATES = gql`
  query GetExchangeRates {
    rates(currency: "USD") {
      currency
      rate
    }
  }
`
// openExchangeRates @rest(
//   type: "openExchangeRates",
//   path: "/latest",
//   endpoint: "openExchangeRate"
// ) {
//   rates
// }

function ExchangeRatePage() {

  // return <div>MARTY MARTY MARTY MARTY</div>

  // const data = null
  // const loading = false
  // const error = "HEY HEY HEY"

  // try {
  const {
    data,
    loading,
    error
  } = useQuery(EXCHANGE_RATES)
  console.debug("DATA RETURNED", data, loading, error)

  if (loading) {
    return <div>loading...</div>
  }

  if (error) {
    return <div>error.yoyoyo</div> // <div>{error}</div>
  }

  if (data?.rates) {
    return data.rates.map(({ currency, rate }) => (
      <div key={currency}>
        <p>
          {currency}: {rate}
        </p>
      </div>
    ))
  }
  // else {
  // return <div>error.heyheyhey</div>
  // }

  // } catch (err) {
  //   console.debug("DATA RETURNED with err", err) // , data, loading, error
  //   return <div>error.heyheyhey</div>
  // }
}

export default ExchangeRatePage
