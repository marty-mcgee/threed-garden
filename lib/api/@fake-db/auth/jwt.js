// ** JWT import
import jwt from 'jsonwebtoken'

// ** Mock Adapter
import mock from '#/lib/api/@fake-db/mock'

// console.debug('mock', mock)

// ==============================================================
// ! users master

const users = [
  {
    id: 1,
    role: 'admin',
    password: 'admin',
    fullName: 'Garden Master',
    username: 'garden_master',
    email: 'mcgee.marty@gmail.com',
  },
  {
    id: 2,
    role: 'client',
    password: 'client',
    fullName: 'Marty McGee',
    username: 'garden_apprentice',
    email: 'marty@companyjuice.com',
  },
  {
    id: 3,
    role: 'client',
    password: 'client',
    fullName: 'McGee Home Garden',
    username: 'garden_observer',
    email: 'support@companyjuice.com',
  },
]

// ==============================================================
// ! These two secrets will later be in .env file
// ! and not in any other file/source. For demo, it is okay.

const jwtConfig = {
  secret: 'dd7f3089-40c3-403d-af14-d0c228b05cb7',
  refreshTokenSecret: '7c7c1c50-3230-45bf-9eae-c9b2e401c727',
}

// ==============================================================
// JWT LOGIN

mock.onPost('/jwt/login').reply((request) => {
  const { email, password } = JSON.parse(request.data)

  console.debug('request', request)
  // console.debug('request.data', JSON.parse(request.data))

  let error = {
    email: ['Something went wrong'],
  }

  const user = users.find((u) => u.email === email && u.password === password)

  console.debug('user', user)

  if (user) {
    let accessToken = 'heyheyhey'
    try {
      accessToken = jwt.sign({ id: user.id }, jwtConfig.secret)
    } catch (err) {
      // console.debug('err accessToken', jwt.sign({ id: user.id }, jwtConfig.secret))
      accessToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjY4MDUxMjA3fQ.bMvi7fa1KCN8L386wWKmU-945KsCJpmyS7tEum9oK48'
    }
    console.debug('🦁 accessToken', accessToken)

    const response = {
      accessToken,
    }

    return [200, response]
  }
  else {
    error = {
      email: ['email or password is invalid'],
    }

    return [400, { error }]
  }
})

// ==============================================================
// JWT REGISTER

mock.onPost('/jwt/register').reply((request) => {
  if (request.data.length > 0) {
    const { email, password, username } = JSON.parse(request.data)
    const isEmailAlreadyInUse = users.find((user) => user.email === email)
    const isUsernameAlreadyInUse = users.find((user) => user.username === username)

    const error = {
      email: isEmailAlreadyInUse ? 'This email is already in use.' : null,
      username: isUsernameAlreadyInUse ? 'This username is already in use.' : null,
    }
    if (!error.username && !error.email) {
      const { length } = users
      let lastIndex = 0
      if (length) {
        lastIndex = users[length - 1].id
      }

      const userData = {
        id: lastIndex + 1,
        email,
        password,
        username,
        avatar: null,
        fullName: '',
        role: 'admin',
      }
      users.push(userData)
      const accessToken = jwt.sign({ id: userData.id }, jwtConfig.secret)
      const user = { ...userData }
      delete user.password
      const response = { accessToken }

      return [200, response]
    }

    return [200, { error }]
  } else {
    return [401, { error: 'Invalid Data' }]
  }
})

// ==============================================================
// JWT AUTH ME (DECODE)

mock.onGet('/auth/me').reply((config) => {
  // @ts-ignore
  const token = config.headers.Authorization

  // get the decoded payload and header
  const decoded = jwt.decode(token, { complete: true })
  if (decoded) {
    // @ts-ignore
    const { id: userId } = decoded.payload
    const userData = JSON.parse(JSON.stringify(users.find((u) => u.id === userId)))
    delete userData.password

    return [200, { userData }]
  } else {
    return [401, { error: { error: 'Invalid User' } }]
  }
})

// end mock actions
