// @material-ui core components
import Card from '@mui/material/Card'
import Grid from '@mui/material/Grid'
import Autocomplete from '@mui/material/Autocomplete'

// ThreeD Garden components
import MDBox from '~/components/mui/MDBox'
import MDTypography from '~/components/mui/MDTypography'

// Settings page components
import FormField from '~/components/account/components/FormField'

// Data
import selectData from '~/components/account/settings/components/BasicInfo/data/selectData'

function BasicInfo(): JSX.Element {
  return (
    <Card
      id='basic-info'
      sx={{ overflow: 'visible' }}
    >
      <MDBox p={3}>
        <MDTypography variant='h5'>Basic Info</MDTypography>
      </MDBox>
      <MDBox
        component='form'
        pb={3}
        px={3}
      >
        <Grid
          container
          spacing={2}
        >
          <Grid
            item
            xs={12}
            sm={6}
          >
            <FormField
              label='First Name'
              placeholder=''
            />
          </Grid>
          <Grid
            item
            xs={12}
            sm={6}
          >
            <FormField
              label='Last Name'
              placeholder=''
            />
          </Grid>
          <Grid
            item
            xs={12}
          >
            <Grid
              container
              spacing={2}
            >
              <Grid
                item
                xs={12}
                sm={4}
              >
                <Autocomplete
                  defaultValue='Male'
                  options={selectData.gender}
                  renderInput={(params) => (
                    <FormField
                      {...params}
                      label="I'm"
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
              <Grid
                item
                xs={12}
                sm={8}
              >
                <Grid
                  container
                  spacing={2}
                >
                  <Grid
                    item
                    xs={12}
                    sm={5}
                  >
                    <Autocomplete
                      defaultValue='February'
                      options={selectData.birthDate}
                      renderInput={(params) => (
                        <FormField
                          {...params}
                          label='Birth Date'
                          InputLabelProps={{ shrink: true }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={4}
                  >
                    <Autocomplete
                      defaultValue='1'
                      options={selectData.days}
                      renderInput={(params) => (
                        <FormField
                          {...params}
                          InputLabelProps={{ shrink: true }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid
                    item
                    xs={12}
                    sm={3}
                  >
                    <Autocomplete
                      defaultValue='2022'
                      options={selectData.years}
                      renderInput={(params) => (
                        <FormField
                          {...params}
                          InputLabelProps={{ shrink: true }}
                        />
                      )}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
          <Grid
            item
            xs={12}
            sm={6}
          >
            <FormField
              label='Email'
              placeholder='example@email.com'
              inputProps={{ type: 'email' }}
            />
          </Grid>
          <Grid
            item
            xs={12}
            sm={6}
          >
            <FormField
              label='confirmation email'
              placeholder='example@email.com'
              inputProps={{ type: 'email' }}
            />
          </Grid>
          <Grid
            item
            xs={12}
            sm={6}
          >
            <FormField
              label='Location'
              placeholder='California'
            />
          </Grid>
          <Grid
            item
            xs={12}
            sm={6}
          >
            <FormField
              label='Phone Number'
              placeholder='+1 707-980-1136'
              inputProps={{ type: 'string' }}
            />
          </Grid>
          <Grid
            item
            xs={12}
            md={6}
          >
            <FormField
              label='Language'
              placeholder='English'
            />
          </Grid>
          <Grid
            item
            xs={12}
            md={6}
          >
            <Autocomplete
              multiple
              defaultValue={['react', 'vue', 'three']}
              options={selectData.skills}
              renderInput={(params) => (
                <FormField
                  {...params}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
        </Grid>
      </MDBox>
    </Card>
  )
}

export default BasicInfo
