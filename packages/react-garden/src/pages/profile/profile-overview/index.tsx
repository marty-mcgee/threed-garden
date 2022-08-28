// @mui material components
import Grid from "@mui/material/Grid"
import Divider from "@mui/material/Divider"

// @mui icons
import FacebookIcon from "@mui/icons-material/Facebook"
import TwitterIcon from "@mui/icons-material/Twitter"
import InstagramIcon from "@mui/icons-material/Instagram"

// ThreeD Garden components
import MDBox from "~/components/mui/MDBox"
import MDTypography from "~/components/mui/MDTypography"

// ThreeD Garden examples components
import DashboardLayout from "~/components/elements/LayoutContainers/DashboardLayout"
import DashboardNavbar from "~/components/elements/Navbars/DashboardNavbar"
import Footer from "~/components/elements/Footer"
import ProfileInfoCard from "~/components/elements/Cards/InfoCards/ProfileInfoCard"
import ProfilesList from "~/components/elements/Lists/ProfilesList"
import DefaultProjectCard from "~/components/elements/Cards/ProjectCards/DefaultProjectCard"

// Overview page components
import Header from "~/pages/profile/components/Header"
import PlatformSettings from "~/pages/profile/profile-overview/components/PlatformSettings"

// Data
import profilesListData from "~/pages/profile/profile-overview/data/profilesListData"

// Images
import homeDecor1 from "~/assets/images/any/home-decor-1.jpg"
import homeDecor2 from "~/assets/images/any/home-decor-2.jpg"
import homeDecor3 from "~/assets/images/any/home-decor-3.jpg"
import homeDecor4 from "~/assets/images/any/home-decor-4.jpg"
import team1 from "~/assets/images/people/team-1.jpg"
import team2 from "~/assets/images/people/team-2.jpg"
import team3 from "~/assets/images/people/team-3.jpg"
import team4 from "~/assets/images/people/team-4.jpg"

function Overview(): JSX.Element {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <Header>
        <MDBox pt={2} px={2} lineHeight={1.25}>
          <MDTypography variant="h6" fontWeight="medium">
            Projects
          </MDTypography>
          <MDBox mb={1}>
            <MDTypography variant="button" color="text">
              Architectural designs of houses and gardens using ThreeD Garden..
            </MDTypography>
          </MDBox>
        </MDBox>
        <Divider orientation="horizontal" sx={{ mt: 1, mb: 1 }} />
        <MDBox p={2}>
          <Grid container spacing={6}>
            <Grid item xs={12} md={6} xl={3}>
              <DefaultProjectCard
                image={homeDecor1.src}
                label="project #1"
                title="modern"
                description="As Uber works through a huge amount of internal management turmoil."
                action={{
                  type: "internal",
                  route: "/profile/profile-overview",
                  color: "info",
                  label: "view project",
                }}
                authors={[
                  { image: team1.src, name: "Elena Morison" },
                  { image: team2.src, name: "Ryan Milly" },
                  { image: team3.src, name: "Jen Daniels" },
                  { image: team4.src, name: "Vic Peterson" },
                ]}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <DefaultProjectCard
                image={homeDecor2.src}
                label="project #2"
                title="scandinavian"
                description="Music is something that everyone has their own specific opinion about."
                action={{
                  type: "internal",
                  route: "/profile/profile-overview",
                  color: "info",
                  label: "view project",
                }}
                authors={[
                  { image: team3.src, name: "Jen Daniels" },
                  { image: team4.src, name: "Vic Peterson" },
                  { image: team1.src, name: "Elena Morison" },
                ]}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <DefaultProjectCard
                image={homeDecor3.src}
                label="project #3"
                title="minimalist"
                description="Different people have different taste, and various types of music."
                action={{
                  type: "internal",
                  route: "/profile/profile-overview",
                  color: "info",
                  label: "view project",
                }}
                authors={[
                  { image: team4.src, name: "Vic Peterson" },
                  { image: team3.src, name: "Jen Daniels" },
                  { image: team2.src, name: "Ryan Milly" },
                  { image: team1.src, name: "Elena Morison" },
                ]}
              />
            </Grid>
            <Grid item xs={12} md={6} xl={3}>
              <DefaultProjectCard
                image={homeDecor4.src}
                label="project #4"
                title="gothic"
                description="Why would anyone pick blue over pink? Pink is obviously a better color."
                action={{
                  type: "internal",
                  route: "/profile/profile-overview",
                  color: "info",
                  label: "view project",
                }}
                authors={[
                  { image: team2.src, name: "Ryan Milly" },
                  { image: team3.src, name: "Jen Daniels" },
                  { image: team1.src, name: "Elena Morison" },
                ]}
              />
            </Grid>
          </Grid>
        </MDBox>
        <Divider orientation="horizontal" sx={{ mt: 1, mb: 1 }} />
        <MDBox mt={0} mb={0}>
          <Grid container spacing={1}>
            <Grid item xs={12} md={6} xl={4}>
              <PlatformSettings />
            </Grid>
            <Grid item xs={12} md={6} xl={4} sx={{ display: "flex" }}>
              <Divider orientation="vertical" sx={{ ml: -2, mr: 1 }} />
              <ProfileInfoCard
                title="profile information"
                description="Hiya, I’m Marty McGee. Enigmatic Decisions: If you can’t decide, the answer is no. If two equally difficult paths, choose the one more painful in the short term, because pain avoidance is creating an illusion of equality."
                info={{
                  fullName: "Marty McGee",
                  mobile: "+1 707-980-1136",
                  email: "mcgee.marty@email.com",
                  location: "USA",
                }}
                social={[
                  {
                    link: "https://www.facebook.com/mcgee.marty/",
                    icon: <FacebookIcon />,
                    color: "facebook",
                  },
                  {
                    link: "https://twitter.com/martymcgee/",
                    icon: <TwitterIcon />,
                    color: "twitter",
                  },
                  {
                    link: "https://www.instagram.com/mcgeehomegarden/",
                    icon: <InstagramIcon />,
                    color: "instagram",
                  },
                ]}
                action={{ route: "", tooltip: "Edit Profile" }}
                shadow={false}
              />
              <Divider orientation="vertical" sx={{ mx: 0 }} />
            </Grid>
            <Grid item xs={12} xl={4}>
              <ProfilesList
                title="conversations"
                profiles={profilesListData}
                shadow={false}
              />
            </Grid>
          </Grid>
        </MDBox>
        <Divider orientation="horizontal" sx={{ mt: 1, mb: 1 }} />
      </Header>
      <Footer />
    </DashboardLayout>
  )
}

export default Overview
