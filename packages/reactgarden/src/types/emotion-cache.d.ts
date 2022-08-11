import { AppProps } from "next/app"
import { EmotionCache } from "@emotion/react"

export interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache
}
