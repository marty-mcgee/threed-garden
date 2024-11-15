// ==============================================================
// Home Page (main landing page for authorized user)

// 'use client'

// ** Next Imports
// import type { NextPage } from 'next'
import type { TNextPageWithProps } from '#/lib/types/TAppProps'

// ** React Imports
// import { useEffect } from 'react'

// ** RADIX-UI Imports
import {
  Flex,
  Grid,
  Container,
  Button, 
  Heading,
  Text,
} from '@radix-ui/themes'

// ==============================================================

// Home Page (Landing Page)
// const HomePage = (props) => {
// const HomePage: FC<TPageProps> = (props) => {
// const HomePage: NextPage<TPageProps> = (props) => {
const HomePage: TNextPageWithProps = (): JSX.Element => {
  //
  return (
    <Container
      // className='flex'
      style={{
        // display: 'inline-flex',
        // flexDirection: 'row-reverse',
      }}
    >
      {/* <div
        id='ThreeDAppHeader'
        // direction='row'
        // display='flex'
        className=''
        // className='flex'
        style={{
          display: 'inline-flex',
          flexDirection: 'row',
        }}
      >

        <div
          className='flex'
        >
          HEY HEY HEY
        </div>

        <div
          className='flex'
        >
          YO YO YO
        </div>

      </div> */}
      <Container
        className='p-2'
      >
        <Heading as='h1'>
          🥕 ThreeD Garden for FarmBot + Three.js on React + Next.js
        </Heading>
        <Heading as='h2'>
          🌱 part of the threed.ai family
        </Heading>
        <Text
          className='p-2'
        >
          🦆 Home Page (/app/home/page.tsx)
          <br/>
          <br/>
        </Text>
        <Text
          className='p-2'
        >
          🦉 This is the "/home" Landing Page.
          <br/>
          <br/>
        </Text>
      </Container>
    </Container>
  )
}

export default HomePage
