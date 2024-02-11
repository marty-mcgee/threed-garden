'use client'

import { useQuery, gql } from "@apollo/client"

// string
const EXCHANGE_RATES = gql`
  query GetExchangeRates {
    latest(
      quoteCurrencies: ["USD", "CAD", "GBP", "JPY"]
    ) {
      quote
      date
      baseCurrency
      quoteCurrency
      meta {
        sources {
          name
        }
      }
    }
  }
  # openExchangeRates @rest(
  #   type: "openExchangeRates",
  #   path: "/latest",
  #   endpoint: "openExchangeRate"
  # ) {
  #   latest
  # }
`

function ExchangeRatePage() {

  // return <div>MARTY MARTY MARTY MARTY</div>

  // const data = null
  // const loading = false
  // const error = "HEY HEY HEY"

  try {
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
      console.debug("DATA RETURNED with error", error) // , data, loading, error
      return <div>error.yoyoyo</div> // <div>{error}</div>
    }

    if (data.latest) {
      return data.latest.map(({ quoteCurrency, quote, baseCurrency }) => (
        <div key={quoteCurrency}>
          <p>
            {baseCurrency} 1 == {quoteCurrency} {quote}
          </p>
        </div>
      ))
    }
    else {
      return <div>error.heyheyhey</div>
    }

  } catch (err) {
    console.debug("DATA RETURNED with err", err) // , data, loading, error
    return <div>error.errerrerr</div>
  }
}

export default ExchangeRatePage
