import { useState } from 'react'

// @mui material components
import Grid from '@mui/material/Grid'
// ThreeD Garden components
import MDBox from '~/components/mui/MDBox'
import MDTypography from '~/components/mui/MDTypography'

// Pricing page components
import FaqCollapse from '~/pages/pricing/components/FaqCollapse'

function Faq(): JSX.Element {
  const [collapse, setCollapse] = useState<number | boolean>(false)

  return (
    <MDBox
      mt={8}
      mb={6}
    >
      <Grid
        container
        justifyContent='center'
      >
        <Grid
          item
          xs={12}
          md={8}
        >
          <MDTypography
            variant='h2'
            align='center'
            fontWeight='bold'
            gutterBottom
          >
            Frequently Asked Questions
          </MDTypography>
          <MDBox mb={2}>
            <MDTypography
              variant='body2'
              align='center'
              color='text'
            >
              A lot of people don&apos;t appreciate the moment until it’s passed. I&apos;m not trying my hardest, and
              I&apos;m not trying to do
            </MDTypography>
          </MDBox>
        </Grid>
        <Grid
          item
          xs={12}
          md={10}
        >
          <FaqCollapse
            title='How do I order?'
            open={collapse === 1}
            onClick={() => (collapse === 1 ? setCollapse(false) : setCollapse(1))}
          >
            We’re not always in the position that we want to be at. We’re constantly growing. We’re constantly making
            mistakes. We’re constantly trying to express ourselves and actualize our dreams. If you have the opportunity
            to play this game of life you need to appreciate every moment. A lot of people don’t appreciate the moment
            until it’s passed.
          </FaqCollapse>
          <FaqCollapse
            title='How can i make the payment?'
            open={collapse === 2}
            onClick={() => (collapse === 2 ? setCollapse(false) : setCollapse(2))}
          >
            It really matters and then like it really doesn’t matter. What matters is the people who are sparked by it.
            And the people who are like offended by it, it doesn’t matter. Because it&apos;s about motivating the doers.
            Because I’m here to follow my dreams and inspire other people to follow their dreams, too. We’re not always
            in the position that we want to be at. We’re constantly growing. We’re constantly making mistakes. We’re
            constantly trying to express ourselves and actualize our dreams. If you have the opportunity to play this
            game of life you need to appreciate every moment. A lot of people don’t appreciate the moment until it’s
            passed.
          </FaqCollapse>
          <FaqCollapse
            title='How much time does it take to receive the order?'
            open={collapse === 3}
            onClick={() => (collapse === 3 ? setCollapse(false) : setCollapse(3))}
          >
            The time is now for it to be okay to be great. People in this world shun people for being great. For being a
            bright color. For standing out. But the time is now to be okay to be the greatest you. Would you believe in
            what you believe in, if you were the only one who believed it? If everything I did failed - which it
            doesn&apos;t, it actually succeeds - just the fact that I&apos;m willing to fail is an inspiration. People
            are so scared to lose that they don&apos;t even try. Like, one thing people can&apos;t say is that I&apos;m
            not trying, and I&apos;m not trying my hardest, and I&apos;m not trying to do the best way I know how.
          </FaqCollapse>
          <FaqCollapse
            title='Can I resell the products?'
            open={collapse === 4}
            onClick={() => (collapse === 4 ? setCollapse(false) : setCollapse(4))}
          >
            I always felt like I could do anything. That’s the main thing people are controlled by! Thoughts- their
            perception of themselves! They&apos;re slowed down by their perception of themselves. If you&apos;re taught
            you can’t do anything, you won’t do anything. I was taught I could do everything.
            <br />
            <br />
            If everything I did failed - which it doesn&apos;t, it actually succeeds - just the fact that I&apos;m
            willing to fail is an inspiration. People are so scared to lose that they don&apos;t even try. Like, one
            thing people can&apos;t say is that I&apos;m not trying, and I&apos;m not trying my hardest, and I&apos;m
            not trying to do the best way I know how.
          </FaqCollapse>
          <FaqCollapse
            title='Where do I find the shipping details?'
            open={collapse === 5}
            onClick={() => (collapse === 5 ? setCollapse(false) : setCollapse(5))}
          >
            There’s nothing I really wanted to do in life that I wasn’t able to get good at. That’s my skill. I’m not
            really specifically talented at anything except for the ability to learn. That’s what I do. That’s what I’m
            here for. Don’t be afraid to be wrong because you can’t learn anything from a compliment. I always felt like
            I could do anything. That’s the main thing people are controlled by! Thoughts- their perception of
            themselves! They&apos;re slowed down by their perception of themselves. If you&apos;re taught you can’t do
            anything, you won’t do anything. I was taught I could do everything.
          </FaqCollapse>
        </Grid>
      </Grid>
    </MDBox>
  )
}

export default Faq
