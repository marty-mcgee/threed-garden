// ==============================================================
// IMPORT RESOURCES

// **
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
// import { Row, Col, Button } from 'antd'

// **
import { Faucet, GasGauge } from 'eth-components/ant'
// **
import { useEthersAppContext } from 'eth-hooks/context'
// **
import React, { FC, ReactNode, Suspense } from 'react'

// **
import { Ramp, getFaucetAvailable, ThemeSwitcher } from '~common/components'
// **
import { networkDefinitions } from '~common/constants'
// **
import { getNetworkInfo } from '~common/functions'
// **
import { IScaffoldAppProviders } from '~common/models'
// **
import { FAUCET_ENABLED } from '#/lib/config/nextjsApp.config'

// ** Types + Interfaces Imports
import { TAppProps } from '#/lib/types/TAppProps'

// ==============================================================
// EXPORT RESOURCES

export interface IEthPageFooterProps {
  scaffoldAppProviders: IScaffoldAppProviders
  price: number
  children?: ReactNode
  appProps: TAppProps
}

/**
 * 🗺 Footer: Extra UI like gas price, eth price, faucet, and support:
 * @param props
 * @returns
 */
export const EthPageFooter: FC<IEthPageFooterProps> = (props) => {
  // passed in by nextjs getInitalProps
  const appProps: TAppProps = props.appProps

  const ethersAppContext = useEthersAppContext()

  // Faucet Tx can be used to send funds from the faucet
  const faucetAvailable = getFaucetAvailable(props.scaffoldAppProviders, ethersAppContext, FAUCET_ENABLED)

  const network = getNetworkInfo(ethersAppContext.chainId)

  const left = (
    <div
      style={{
        position: 'relative',
        textAlign: 'left',
        left: 0,
        bottom: 0,
        top: 60,
        paddingBottom: 16,
      }}
    >
      <Grid container
        // align='middle'
        // gutter={[4, 4]}
      >
        <Grid item>
          <Ramp
            price={props.price}
            address={ethersAppContext?.account ?? ''}
            networks={networkDefinitions}
          />
        </Grid>
        <Grid item
          // span={2}
          // style={{
          //   textAlign: 'center',
          //   opacity: 0.8,
          // }}
        >
          <GasGauge
            chainId={props.scaffoldAppProviders.currentTargetNetwork.chainId}
            currentNetwork={network}
            provider={ethersAppContext.provider}
            speed='average'
          />
        </Grid>
      </Grid>
      <Grid container
        // align='middle'
        // gutter={[4, 4]}
      >
        <Grid item>
          {
            /*  if the local provider has a signer, let's show the faucet:  */
            faucetAvailable &&
            props.scaffoldAppProviders?.mainnetAdaptor &&
            props.scaffoldAppProviders?.localAdaptor ? (
              <Faucet
                localAdaptor={props.scaffoldAppProviders.localAdaptor}
                price={props.price}
                mainnetAdaptor={props.scaffoldAppProviders.mainnetAdaptor}
              />
            ) : (
              <></>
            )
          }
        </Grid>
      </Grid>
    </div>
  )

  // const right = <ThemeSwitcher />
  // const right = <div />
  const right = (
    <div
      style={{
        position: 'relative',
        textAlign: 'left',
        left: 0,
        bottom: 0,
        top: 60,
        paddingBottom: 16,
      }}
    >
      <Grid container
        // align='middle'
        // gutter={[4, 4]}
      >
        <Grid item
          // span={2}
          // style={{
          //   textAlign: 'center',
          //   opacity: 1,
          // }}
        >
          <Button
            onClick={(): void => {
              // window.open('https://t.me/joinchat/KByvmRe5wkR-8F_zz6AjpA');
              window.open('https://github.com/marty-mcgee/threed-garden/discussions')
            }}
            // size='large'
            // shape='round'
          >
            <span
              style={{
                marginRight: 8,
              }}
              role='img'
              aria-label='support'
            >
              💬
            </span>
            Support
          </Button>
        </Grid>
        <Grid item
          // span={2}
          // style={{
          //   textAlign: 'center',
          //   opacity: 1,
          // }}
        >
          <ThemeSwitcher />
        </Grid>
      </Grid>
    </div>
  )

  return (
    <>
      <Suspense fallback={<div/>}>
        {left}
        {right}
      </Suspense>
    </>
  )
}
