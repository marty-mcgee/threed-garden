import { FC, forwardRef } from "react"

// @mui material components
import { AvatarProps } from "@mui/material"

// Custom styles for MDAvatar
import MDAvatarRoot from "~/components/MDAvatar/MDAvatarRoot"

// declare props types for MDAvatar
interface Props extends AvatarProps {
  bgColor?:
  | "transparent"
  | "primary"
  | "secondary"
  | "info"
  | "success"
  | "warning"
  | "error"
  | "light"
  | "dark"
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "xxl"
  shadow?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "inset"
  [key: string]: any
}

const MDAvatar: FC<Props> = forwardRef(
  ({ bgColor, size, shadow, ...rest }, ref) => (
    <MDAvatarRoot ref={ref} ownerState={{ shadow, bgColor, size }} {...rest} />
  )
)

// Declaring default props for MDAvatar
MDAvatar.defaultProps = {
  bgColor: "transparent",
  size: "md",
  shadow: "none",
}

export default MDAvatar
