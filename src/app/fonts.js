import localFont from "next/font/local";

export const inter = localFont({
  src: "../libraries/font-assets/InterVariable.woff2",
  weight: "400 600",
  style: "normal",
  display: "swap",
  variable: "--font-inter",
});
