import { useState } from "react"

// @asseinfo/react-kanban components
// import Board from "@asseinfo/react-kanban"
// new way [MM]
import dynamic from "next/dynamic"

// html-react-parser
import parse from "html-react-parser"

// uuid is a library for generating unique id
import { v4 as uuidv4 } from "uuid"

// @mui material components
import Icon from "@mui/material/Icon"
import { Theme } from "@mui/material/styles"

// ThreeD Garden components
import MDBox from "~/components/mui/MDBox"
import MDButton from "~/components/mui/MDButton"
import MDTypography from "~/components/mui/MDTypography"
import MDInput from "~/components/mui/MDInput"

// ThreeD Garden examples components
import DashboardLayout from "~/components/elements/LayoutContainers/DashboardLayout"
import DashboardNavbar from "~/components/elements/Navbars/DashboardNavbar"
import Footer from "~/components/elements/Footer"

// Kanban application components
import Header from "~/pages/applications/kanban/components/Header"

// Data
import boards from "~/pages/applications/kanban/data"

// ThreeD Garden context
import { useMaterialUIController } from "~/context"

// @asseinfo/react-kanban components
const Board = dynamic(() => import("@asseinfo/react-kanban"), { ssr: false })

function Kanban(): JSX.Element {
  const [controller] = useMaterialUIController()
  const { darkMode } = controller

  const [newCardForm, setNewCardForm] = useState<string | number | boolean>(
    false
  )
  const [formValue, setFormValue] = useState<string>("")

  const openNewCardForm = (
    event: HTMLButtonElement | any,
    id: string | number
  ) => setNewCardForm(id)
  const closeNewCardForm = () => setNewCardForm(false)
  const handeSetFormValue = ({ currentTarget }: any) =>
    setFormValue(currentTarget.value)

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <MDBox display="flex" justifyContent="flex-end" m={2}>
          <Header />
        </MDBox>
        <MDBox
          position="relative"
          my={4}
          sx={({
            palette: { light, background },
            functions: { pxToRem },
            borders: { borderRadius },
          }: Theme | any) => ({
            "& .react-kanban-column": {
              backgroundColor: darkMode ? background.card : light.main,
              width: pxToRem(450),
              margin: `0 ${pxToRem(10)}`,
              padding: pxToRem(20),
              borderRadius: borderRadius.lg,
            },
          })}>
          <Board
            initialBoard={boards}
            allowAddCard
            allowAddColumn
            renderColumnHeader={({ id, title }: any, { addCard }: any) => (
              <>
                <MDBox
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={3}>
                  <MDTypography variant="h6">{title}</MDTypography>
                  <MDButton
                    size="small"
                    iconOnly
                    onClick={(event) => openNewCardForm(event, id)}>
                    <Icon
                      sx={{
                        fontWeight: "bold",
                        color: ({ palette: { dark } }) => dark.main,
                      }}>
                      add
                    </Icon>
                  </MDButton>
                </MDBox>
                {newCardForm === id ? (
                  <MDBox my={2.5}>
                    <MDInput
                      value={formValue}
                      rows="4"
                      onChange={handeSetFormValue}
                      multiline
                      fullWidth
                    />
                    <MDBox display="flex" mt={2}>
                      <MDButton
                        variant="gradient"
                        color="success"
                        size="small"
                        onClick={() => {
                          addCard({ id: uuidv4(), template: formValue })
                          setFormValue("")
                        }}>
                        add
                      </MDButton>
                      <MDBox ml={1}>
                        <MDButton
                          variant="gradient"
                          color="light"
                          size="small"
                          onClick={closeNewCardForm}>
                          cancel
                        </MDButton>
                      </MDBox>
                    </MDBox>
                  </MDBox>
                ) : null}
              </>
            )}
            renderCard={({ id, template }: any, { dragging }: any) => (
              <MDBox
                key={id}
                dragging={dragging.toString() || undefined}
                display="block"
                width="calc(450px - 40px)"
                bgColor={darkMode ? "transparent" : "white"}
                color="text"
                borderRadius="xl"
                mt={2.5}
                py={1.875}
                px={1.875}
                lineHeight={1.5}
                sx={{
                  border: ({
                    borders: { borderWidth },
                    palette: { white },
                  }: any) =>
                    darkMode ? `${borderWidth[1]} solid ${white.main}` : 0,
                  fontSize: ({ typography: { size } }: any) => size.md,
                }}>
                {typeof template === "string" ? parse(template) : template}
              </MDBox>
            )}
            onCardNew={(): any => null}
          />
        </MDBox>
      </MDBox>
      <Footer />
    </DashboardLayout>
  )
}

export default Kanban
