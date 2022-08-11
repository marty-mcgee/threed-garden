/*eslint-disable*/
import React from "react"
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles"
import Hidden from "@material-ui/core/Hidden"
// layout for this page
import Admin from "layouts/Admin"
// core components
import GridItem from "components/Grid/GridItem"
import GridContainer from "components/Grid/GridContainer"
import Card from "components/Card/Card"
import CardHeader from "components/Card/CardHeader"
import CardBody from "components/Card/CardBody"

import styles from "styles/jss/nextjs-material-dashboard/views/iconsStyle"

function Icons() {
  const useStyles = makeStyles(styles)
  const classes = useStyles()
  return (
    <GridContainer>
      <GridItem xs={12} sm={12} md={12}>
        <Card plain>
          <CardHeader plain color="primary">
            <h4 className={classes.cardTitleWhite}>Material Design Icons</h4>
            <p className={classes.cardCategoryWhite}>
              Handcrafted by our friends from{" "}
              <a
                href="https://design.google.com/icons/?ref=creativetime"
                target="_blank">
                Google
              </a>
            </p>
          </CardHeader>
          <CardBody>
            <Hidden only={["sm", "xs"]}>
              <iframe
                className={classes.iframe}
                src="https://material.io/icons/"
                title="Icons iframe">
                <p>Your browser does not support iframes.</p>
              </iframe>
            </Hidden>
            <Hidden only={["lg", "md"]}>
              <GridItem xs={12} sm={12} md={6}>
                <h5>
                  The icons are visible on Desktop mode inside an iframe. Since
                  the iframe is not working on Mobile and Tablets please visit
                  the icons on their original page on Google. Check the
                  <a
                    href="https://design.google.com/icons/?ref=creativetime"
                    target="_blank">
                    Material Icons
                  </a>
                </h5>
              </GridItem>
            </Hidden>
          </CardBody>
        </Card>
      </GridItem>
    </GridContainer>
  )
}

Icons.layout = Admin

export default Icons
