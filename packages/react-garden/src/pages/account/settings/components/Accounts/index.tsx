import { useState } from "react"

// @mui material components
import Card from "@mui/material/Card"
import Icon from "@mui/material/Icon"
import Switch from "@mui/material/Switch"
import Tooltip from "@mui/material/Tooltip"
import Divider from "@mui/material/Divider"

// ThreeD Garden components
import MDBox from "~/components/mui/MDBox"
import MDTypography from "~/components/mui/MDTypography"
import MDAvatar from "~/components/mui/MDAvatar"
import MDInput from "~/components/mui/MDInput"
import MDButton from "~/components/mui/MDButton"

// Images
import logoSlack from "~/assets/images/logos/small-logos/logo-slack.svg"
import logoSpotify from "~/assets/images/logos/small-logos/logo-spotify.svg"
import logoAtlassian from "~/assets/images/logos/small-logos/logo-atlassian.svg"
import logoAsana from "~/assets/images/logos/small-logos/logo-asana.svg"

// ThreeD Garden components
import { useMaterialUIController } from "~/context"

function Accounts(): JSX.Element {
  const [controller] = useMaterialUIController()
  const { darkMode } = controller

  const [slack2FA, setSlack2FA] = useState<boolean>(true)
  const [spotify2FA, setSpotify2FA] = useState<boolean>(true)
  const [atlassian2FA, setAtlassian2FA] = useState<boolean>(true)
  const [asana2FA, setAsana2FA] = useState<boolean>(false)

  const handleSetSlack2FA = () => setSlack2FA(!slack2FA)
  const handleSetSpotify2FA = () => setSpotify2FA(!spotify2FA)
  const handleSetAtlassian2FA = () => setAtlassian2FA(!atlassian2FA)
  const handleSetAsana2FA = () => setAsana2FA(!asana2FA)

  return (
    <Card id="accounts">
      <MDBox p={3} lineHeight={1}>
        <MDBox mb={1}>
          <MDTypography variant="h5">Accounts</MDTypography>
        </MDBox>
        <MDTypography variant="button" color="text">
          Here you can setup and manage your integration settings.
        </MDTypography>
      </MDBox>
      <MDBox pt={2} pb={3} px={3}>
        <MDBox
          display="flex"
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          flexDirection={{ xs: "column", sm: "row" }}>
          <MDBox display="flex" alignItems="center">
            <MDAvatar src={logoSlack} alt="Slack logo" variant="rounded" />
            <MDBox ml={2}>
              <MDTypography variant="h5" fontWeight="medium">
                Slack
              </MDTypography>
              <MDBox display="flex" alignItems="flex-end">
                <MDTypography variant="button" color="text">
                  Show less
                </MDTypography>
                <MDTypography
                  variant="button"
                  color="text"
                  sx={{ lineHeight: 0 }}>
                  <Icon fontSize="small">expand_less</Icon>
                </MDTypography>
              </MDBox>
            </MDBox>
          </MDBox>
          <MDBox
            display="flex"
            alignItems="center"
            justifyContent="flex-end"
            width={{ xs: "100%", sm: "auto" }}
            mt={{ xs: 1, sm: 0 }}>
            <MDBox lineHeight={0} mx={2}>
              <MDTypography variant="button" color="text">
                {slack2FA ? "Enabled" : "Disabled"}
              </MDTypography>
            </MDBox>
            <MDBox mr={1}>
              <Switch checked={slack2FA} onChange={handleSetSlack2FA} />
            </MDBox>
          </MDBox>
        </MDBox>
        <MDBox ml={2} pl={6} pt={2} lineHeight={1}>
          <MDTypography variant="button" color="text">
            You haven&apos;t added your Slack yet or you aren&apos;t authorized.
            Please add our Slack Bot to your account by clicking on here. When
            you&apos;ve added the bot, send your verification code that you have
            received.
          </MDTypography>
          <MDBox
            bgColor={darkMode ? "grey-900" : "grey-100"}
            borderRadius="lg"
            display="flex"
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            flexDirection={{ xs: "column", sm: "row" }}
            my={3}
            py={1}
            pl={{ xs: 1, sm: 2 }}
            pr={1}>
            <MDTypography variant="button" fontWeight="medium" color="text">
              Verification Code
            </MDTypography>
            <MDBox
              width={{ xs: "100%", sm: "25%", md: "15%" }}
              mt={{ xs: 1, sm: 0 }}>
              <Tooltip title="Copy" placement="top">
                <MDInput size="small" value="1172913" />
              </Tooltip>
            </MDBox>
          </MDBox>
          <MDBox
            bgColor={darkMode ? "grey-900" : "grey-100"}
            borderRadius="lg"
            display="flex"
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
            flexDirection={{ xs: "column", sm: "row" }}
            my={3}
            py={1}
            pl={{ xs: 1, sm: 2 }}
            pr={1}>
            <MDTypography variant="button" fontWeight="medium" color="text">
              Connected account
            </MDTypography>
            <MDBox
              display="flex"
              alignItems={{ xs: "flex-start", sm: "center" }}
              flexDirection={{ xs: "column", sm: "row" }}>
              <MDBox mr={2} mb={{ xs: 1, sm: 0 }} lineHeight={0}>
                <MDTypography variant="button" fontWeight="medium">
                  support@companyjuice.com
                </MDTypography>
              </MDBox>
              <MDButton variant="gradient" color="dark" size="small">
                delete
              </MDButton>
            </MDBox>
          </MDBox>
        </MDBox>
        <Divider />
        <MDBox
          display="flex"
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          flexDirection={{ xs: "column", sm: "row" }}>
          <MDBox display="flex" alignItems="center">
            <MDAvatar src={logoSpotify} alt="Slack logo" variant="rounded" />
            <MDBox ml={2} lineHeight={0}>
              <MDTypography variant="h5" fontWeight="medium">
                Spotify
              </MDTypography>
              <MDTypography variant="button" color="text">
                Music
              </MDTypography>
            </MDBox>
          </MDBox>
          <MDBox
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
            width={{ xs: "100%", sm: "auto" }}
            mt={{ xs: 1, sm: 0 }}>
            <MDBox lineHeight={0} mx={2}>
              <MDTypography variant="button" color="text">
                {spotify2FA ? "Enabled" : "Disabled"}
              </MDTypography>
            </MDBox>
            <MDBox mr={1}>
              <Switch checked={spotify2FA} onChange={handleSetSpotify2FA} />
            </MDBox>
          </MDBox>
        </MDBox>
        <Divider />
        <MDBox
          display="flex"
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          flexDirection={{ xs: "column", sm: "row" }}>
          <MDBox display="flex" alignItems="center">
            <MDAvatar src={logoAtlassian} alt="Slack logo" variant="rounded" />
            <MDBox ml={2} lineHeight={0}>
              <MDTypography variant="h5" fontWeight="medium">
                Atlassian
              </MDTypography>
              <MDTypography variant="button" color="text">
                Payment vendor
              </MDTypography>
            </MDBox>
          </MDBox>
          <MDBox
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
            width={{ xs: "100%", sm: "auto" }}
            mt={{ xs: 1, sm: 0 }}>
            <MDBox lineHeight={0} mx={2}>
              <MDTypography variant="button" color="text">
                {atlassian2FA ? "Enabled" : "Disabled"}
              </MDTypography>
            </MDBox>
            <MDBox mr={1}>
              <Switch checked={atlassian2FA} onChange={handleSetAtlassian2FA} />
            </MDBox>
          </MDBox>
        </MDBox>
        <Divider />
        <MDBox
          display="flex"
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          flexDirection={{ xs: "column", sm: "row" }}>
          <MDBox display="flex" alignItems="center">
            <MDAvatar src={logoAsana} alt="Slack logo" variant="rounded" />
            <MDBox ml={2} lineHeight={0}>
              <MDTypography variant="h5" fontWeight="medium">
                Asana
              </MDTypography>
              <MDTypography variant="button" color="text">
                Organize your team
              </MDTypography>
            </MDBox>
          </MDBox>
          <MDBox
            display="flex"
            alignItems="center"
            justifyContent="flex-end"
            width={{ xs: "100%", sm: "auto" }}
            mt={{ xs: 1, sm: 0 }}>
            <MDBox lineHeight={0} mx={2}>
              <MDTypography variant="button" color="text">
                {asana2FA ? "Enabled" : "Disabled"}
              </MDTypography>
            </MDBox>
            <MDBox mr={1}>
              <Switch checked={asana2FA} onChange={handleSetAsana2FA} />
            </MDBox>
          </MDBox>
        </MDBox>
      </MDBox>
    </Card>
  )
}

export default Accounts
