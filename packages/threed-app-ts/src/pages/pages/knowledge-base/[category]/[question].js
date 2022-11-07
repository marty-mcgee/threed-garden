// ** Next Imports
import Link from 'next/link'

// ** MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import { styled } from '@mui/material/styles'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import CardContent from '@mui/material/CardContent'

// ** Icons Imports
import Cellphone from 'mdi-material-ui/Cellphone'
import CogOutline from 'mdi-material-ui/CogOutline'
import CircleOutline from 'mdi-material-ui/CircleOutline'

// ** Third Party Imports
import axios from 'axios'

// Styled CardContent component
const StyledCardContent = styled(CardContent)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3.75, 5.5),
  backgroundColor: `rgba(${theme.palette.customColors.main}, 0.08)`
}))

// Styled Link component
const StyledLink = styled('a')(({ theme }) => ({
  display: 'block',
  textDecoration: 'none',
  '&:not(:last-of-type)': {
    marginBottom: theme.spacing(6)
  },
  '&:hover *': {
    color: theme.palette.primary.main
  }
}))

// Styled Grid component
const StyledGrid = styled(Grid)(({ theme }) => ({
  [theme.breakpoints.down('md')]: {
    order: -1
  }
}))

// Styled component for the image
const Img = styled('img')({
  width: '100%'
})

const questions = [
  'How Secure Is My Password?',
  'Can I Change My Username?',
  'Where Can I Upload My Avatar?',
  'How Do I Change My Timezone?',
  'How Do I Change My Password?'
]

const KnowledgeBaseCategoryQuestion = () => {
  const renderQuestions = () => {
    return questions.map((question, index) => {
      return (
        <Link href='/' passHref key={index}>
          <StyledLink onClick={e => e.preventDefault()}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CircleOutline sx={{ fontSize: '0.875rem', mr: 2.25, color: 'text.secondary' }} />
              <Typography variant='body2'>{question}</Typography>
            </Box>
          </StyledLink>
        </Link>
      )
    })
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={4}>
        <Card>
          <StyledCardContent>
            <CogOutline sx={{ mr: 3, color: 'primary.main' }} />
            <Typography variant='h6'>{`Account Settings (${questions.length})`}</Typography>
          </StyledCardContent>
          <CardContent sx={{ p: theme => `${theme.spacing(6.75, 5.5, 7.5)} !important` }}>
            {renderQuestions()}
          </CardContent>
        </Card>
      </Grid>
      <StyledGrid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Box sx={{ mb: 3, display: 'flex' }}>
              <Cellphone sx={{ mr: 3.25, fontSize: '1.375rem', mt: 1.25 }} />
              <Typography variant='h6'>Why Was My Developer Application Rejected?</Typography>
            </Box>
            <Typography variant='body2' sx={{ mb: 7 }}>
              Last updated on 10 Dec 2020
            </Typography>
            <Typography variant='body2' sx={{ mb: 7 }}>
              It has been said that astronomy is a humbling and character-building experience. There is perhaps no
              better demonstration of the folly of human conceits than this distant image of our tiny world. To me, it
              underscores our responsibility to deal more kindly with one another, and to preserve and cherish the pale
              blue dot, the only home we’ve ever known. The Earth is a very small stage in a vast cosmic arena. Think of
              the rivers of blood spilled by all those generals and emperors so that, in glory and triumph, they could
              become the momentary masters of a fraction of a dot. Think of the endless cruelties visited by the
              inhabitants of one corner of this pixel on the scarcely distinguishable inhabitants of some other corner,
              how frequent their misunderstandings, how eager they are to kill one another, how fervent their hatreds.
            </Typography>
            <Img alt='kb-category question' src='/images/pages/kb-category-question.png' />
            <Typography sx={{ mt: 7, mb: 1.75 }}>Houston</Typography>
            <Typography variant='body2' sx={{ mb: 5.25 }}>
              that may have seemed like a very long final phase. The auto targeting was taking us right into a … crater,
              with a large number of big boulders and rocks … and it required … flying manually over the rock field to
              find a reasonably good area.
            </Typography>
            <Box sx={{ ml: 6.25, '& > :not(:last-of-type)': { mb: 3.5 } }}>
              <Box sx={{ display: 'flex' }}>
                <CircleOutline sx={{ fontSize: '0.875rem', mt: 0.75, mr: 2.25, color: 'text.secondary' }} />
                <Typography variant='body2'>
                  I am a stranger. I come in peace. Take me to your leader and there will be a massive reward for you in
                  eternity.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex' }}>
                <CircleOutline sx={{ fontSize: '0.875rem', mt: 0.75, mr: 2.25, color: 'text.secondary' }} />
                <Typography variant='body2'>
                  It’s just mind-blowingly awesome. I apologize, and I wish I was more articulate, but it’s hard to be
                  articulate when your mind’s blown — but in a very good way.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex' }}>
                <CircleOutline sx={{ fontSize: '0.875rem', mt: 0.75, mr: 2.25, color: 'text.secondary' }} />
                <Typography variant='body2'>A good rule for rocket experimenters to follow is this</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </StyledGrid>
    </Grid>
  )
}

export const getStaticPaths = async () => {
  const res = await axios.get('/pages/knowledge-base')
  const data = await res.data
  const CategoryResponse = await axios.get('/pages/knowledge-base/categories')
  const categoryData = await CategoryResponse.data
  const paths = []
  data.forEach(item => {
    const category = `${item.category}`
    categoryData.forEach(categoryItem => {
      categoryItem.questions.forEach(question => {
        paths.push({ params: { category, question: `${question.slug}` } })
      })
    })
  })

  return {
    paths,
    fallback: false
  }
}

export const getStaticProps = () => {
  return {
    props: {}
  }
}

export default KnowledgeBaseCategoryQuestion
