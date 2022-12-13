interface ColorsTypes {
  main: string
  focus: string
}

interface GradientsTypes {
  main: string
  state: string
}

interface SocialMediaColorsTypes {
  main: string
  dark: string
}

interface BadgeColorsTypes {
  background: string
  text: string
}

interface DisplayTypes {
  fontFamily: string
  color: string
  fontWeight: number
  lineHeight: number
  fontSize: string
}

declare module '@mui/material/styles' {
  interface Theme {
    boxShadows: {
      xs: string
      sm: string
      md: string
      lg: string
      xl: string
      xxl: string
      inset: string
      colored: {
        primary: string
        secondary: string
        info: string
        success: string
        warning: string
        error: string
        light: string
        dark: string
      }
      navbarBoxShadow: string
      sliderBoxShadow: {
        thumb: string
      }
      tabsBoxShadow: {
        indicator: string
      }
    }
    borders: {
      borderColor: string
      borderWidth: {
        [key: number | string]: number | string
      }
      borderRadius: {
        [key: number | string]: number | string
      }
    }
    functions: any
  }
  interface ThemeOptions {
    boxShadows: {
      xs: string
      sm: string
      md: string
      lg: string
      xl: string
      xxl: string
      inset: string
      colored: {
        primary: string
        secondary: string
        info: string
        success: string
        warning: string
        error: string
        light: string
        dark: string
      }
      navbarBoxShadow: string
      sliderBoxShadow: {
        thumb: string
      }
      tabsBoxShadow: {
        indicator: string
      }
    }
    borders: {
      borderColor: string
      borderWidth: {
        [key: number | string]: number | string
      }
      borderRadius: {
        [key: number | string]: number | string
      }
    }
    functions: any
  }
  interface Palette {
    background:
      | {
          default: string
          sidenav: string
          card: string
        }
      | any
    white:
      | {
          main: string
          focus: string
        }
      | any
    text:
      | {
          main: string
          focus: string
          primary?: string
          secondary?: string
          disabled?: string
        }
      | any
    transparent:
      | {
          main: string
        }
      | any
    black:
      | {
          light: string
          main: string
          focus: string
        }
      | any
    primary: ColorsTypes | any
    secondary: ColorsTypes | any
    info: ColorsTypes | any
    success: ColorsTypes | any
    warning: ColorsTypes | any
    error: ColorsTypes | any
    light: ColorsTypes | any
    dark: ColorsTypes | any
    grey:
      | {
          [key: string | number]: string
        }
      | any
    gradients:
      | {
          primary: GradientsTypes
          secondary: GradientsTypes
          info: GradientsTypes
          success: GradientsTypes
          warning: GradientsTypes
          error: GradientsTypes
          light: GradientsTypes
          dark: GradientsTypes
        }
      | any
    socialMediaColors:
      | {
          facebook: SocialMediaColorsTypes
          twitter: SocialMediaColorsTypes
          instagram: SocialMediaColorsTypes
          linkedin: SocialMediaColorsTypes
          pinterest: SocialMediaColorsTypes
          youtube: SocialMediaColorsTypes
          vimeo: SocialMediaColorsTypes
          slack: SocialMediaColorsTypes
          dribbble: SocialMediaColorsTypes
          github: SocialMediaColorsTypes
          reddit: SocialMediaColorsTypes
          tumblr: SocialMediaColorsTypes
        }
      | any
    badgeColors:
      | {
          primary: BadgeColorsTypes
          secondary: BadgeColorsTypes
          info: BadgeColorsTypes
          success: BadgeColorsTypes
          warning: BadgeColorsTypes
          error: BadgeColorsTypes
          light: BadgeColorsTypes
          dark: BadgeColorsTypes
        }
      | any
    coloredShadows:
      | {
          [key: string]: string
        }
      | any
    inputBorderColor: string
    tabs:
      | {
          indicator:
            | {
                boxShadow: string
              }
            | any
        }
      | any
  }

  interface PaletteOptions {
    background:
      | {
          default: string
          sidenav?: string
          card?: string
        }
      | any
    white:
      | {
          main: string
          focus: string
        }
      | any
    text:
      | {
          main: string
          focus: string
          primary?: string
          secondary?: string
          disabled?: string
        }
      | any
    transparent:
      | {
          main: string
        }
      | any
    black:
      | {
          light: string
          main: string
          focus: string
        }
      | any
    primary: ColorsTypes | any
    secondary: ColorsTypes | any
    info: ColorsTypes | any
    success: ColorsTypes | any
    warning: ColorsTypes | any
    error: ColorsTypes | any
    light: ColorsTypes | any
    dark: ColorsTypes | any
    grey:
      | {
          [key: string | number]: string
        }
      | any
    gradients:
      | {
          primary: GradientsTypes
          secondary: GradientsTypes
          info: GradientsTypes
          success: GradientsTypes
          warning: GradientsTypes
          error: GradientsTypes
          light: GradientsTypes
          dark: GradientsTypes
        }
      | any
    socialMediaColors:
      | {
          facebook: SocialMediaColorsTypes
          twitter: SocialMediaColorsTypes
          instagram: SocialMediaColorsTypes
          linkedin: SocialMediaColorsTypes
          pinterest: SocialMediaColorsTypes
          youtube: SocialMediaColorsTypes
          vimeo: SocialMediaColorsTypes
          slack: SocialMediaColorsTypes
          dribbble: SocialMediaColorsTypes
          github: SocialMediaColorsTypes
          reddit: SocialMediaColorsTypes
          tumblr: SocialMediaColorsTypes
        }
      | any
    badgeColors:
      | {
          primary: BadgeColorsTypes
          secondary: BadgeColorsTypes
          info: BadgeColorsTypes
          success: BadgeColorsTypes
          warning: BadgeColorsTypes
          error: BadgeColorsTypes
          light: BadgeColorsTypes
          dark: BadgeColorsTypes
        }
      | any
    coloredShadows:
      | {
          [key: string]: string
        }
      | any
    inputBorderColor: string
    tabs:
      | {
          indicator:
            | {
                boxShadow: string
              }
            | any
        }
      | any
  }

  interface TypographyVariants {
    fontFamily: string
    fontWeightLighter: number
    fontWeightLight: number
    fontWeightRegular: number
    fontWeightMedium: number
    fontWeightBold: number
    h1: {
      fontFamily: string
      fontSize: string
      fontWeight: number
      color: string
      lineHeight: number
    }
    h2: {
      fontFamily: string
      fontSize: string
      fontWeight: number
      color: string
      lineHeight: number
    }
    h3: {
      fontFamily: string
      fontSize: string
      fontWeight: number
      color: string
      lineHeight: number
    }
    h4: {
      fontFamily: string
      fontSize: string
      fontWeight: number
      color: string
      lineHeight: number
    }
    h5: {
      fontFamily: string
      fontSize: string
      fontWeight: number
      color: string
      lineHeight: number
    }
    h6: {
      fontFamily: string
      fontSize: string
      fontWeight: number
      color: string
      lineHeight: number
    }
    subtitle1: {
      fontFamily: string
      fontSize: string
      fontWeight: number
      lineHeight: number
    }
    subtitle2: {
      fontFamily: string
      fontSize: string
      fontWeight: number
      lineHeight: number
    }
    body1: {
      fontFamily: string
      fontSize: string
      fontWeight: number
      lineHeight: number
    }
    body2: {
      fontFamily: string
      fontSize: string
      fontWeight: number
      lineHeight: number
    }
    button: {
      fontFamily: string
      fontSize: string
      fontWeight: number
      lineHeight: number
      textTransform: any
    }
    caption: {
      fontFamily: string
      fontSize: string
      fontWeight: number
      lineHeight: number
    }
    overline: {
      fontFamily: string
    }
    d1: DisplayTypes
    d2: DisplayTypes
    d3: DisplayTypes
    d4: DisplayTypes
    d5: DisplayTypes
    d6: DisplayTypes
    size: {
      xxs: string
      xs: string
      sm: string
      md: string
      lg: string
      xl: string
      '2xl': string
      '3xl': string
    }
    lineHeight: {
      sm: number
      md: number
      lg: number
    }
  }
}
