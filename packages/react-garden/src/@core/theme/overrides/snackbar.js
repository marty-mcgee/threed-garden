const Snackbar = (theme, skin) => {
  return {
    MuiSnackbarContent: {
      styleOverrides: {
        root: {
          ...(skin === 'bordered' && { boxShadow: 'none' }),
          backgroundColor: theme.palette.mode === 'light' ? theme.palette.grey[900] : theme.palette.grey[100]
        }
      }
    }
  }
}

export default Snackbar
