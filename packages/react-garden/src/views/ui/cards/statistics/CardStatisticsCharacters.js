// ** MUI Import
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'

// ** Custom Components Imports
import CardStatisticsCharacter from 'src/@core/components/card-statistics/card-stats-with-image'

const CardStatsCharacter = ({ data }) => {
  if (data) {
    return (
      <Box sx={{ mt: [7, 7, 5.75] }}>
        <Grid container spacing={6}>
          <Grid item xs={12} sm={6} lg={3}>
            <CardStatisticsCharacter data={data[0]} />
          </Grid>
          <Grid item xs={12} sm={6} lg={3} sx={{ mt: [7, 0] }}>
            <CardStatisticsCharacter data={data[1]} />
          </Grid>
          <Grid item xs={12} sm={6} lg={3} sx={{ mt: { xs: 7, lg: 0 } }}>
            <CardStatisticsCharacter data={data[2]} />
          </Grid>
          <Grid item xs={12} sm={6} lg={3} sx={{ mt: { xs: 7, lg: 0 } }}>
            <CardStatisticsCharacter data={data[3]} />
          </Grid>
        </Grid>
      </Box>
    )
  } else {
    return null
  }
}

export default CardStatsCharacter
