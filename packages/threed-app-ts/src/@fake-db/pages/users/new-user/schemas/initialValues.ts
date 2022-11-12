import checkout from '~/@fake-db/pages/users/new-user/schemas/form'

const {
  formField: {
    firstName,
    lastName,
    company,
    email,
    password,
    repeatPassword,
    address1,
    address2,
    city,
    zip,
    twitter,
    facebook,
    instagram,
    publicEmail,
    bio,
  },
} = checkout

const initialValues = {
  [firstName.name]: '',
  [lastName.name]: '',
  [company.name]: '',
  [email.name]: '',
  [password.name]: '',
  [repeatPassword.name]: '',
  [address1.name]: '',
  [address2.name]: '',
  [city.name]: '',
  [zip.name]: '',
  [twitter.name]: '',
  [facebook.name]: '',
  [instagram.name]: '',
  [publicEmail.name]: '',
  [bio.name]: '',
}

export default initialValues
