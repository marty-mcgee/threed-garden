// import * as React from "react"
import Typography from "@mui/material/Typography"
import MuiLink from "@mui/material/Link"

export default function Copyright() {
  return (
    <Typography variant="body2" color="dark">
      {"© "}
      <MuiLink color="inherit" href="https://companyjuice.com/?ref=threedgarden.com">
        Company Juice (Open Source Solutions)
      </MuiLink>{" "}
      {new Date().getFullYear()}
    </Typography>
  )
}
