// ** Redux Imports
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// ** Axios Imports
import axios from 'axios'

// ** Fetch User Profile
export const fetchUserProfile = createAsyncThunk('appChat/fetchUserProfile', async () => {
  const response = await axios.get('/apps/chat/users/profile-user')

  return response.data
})

// ** Fetch Chats & Contacts
export const fetchChatsContacts = createAsyncThunk('appChat/fetchChatsContacts', async () => {
  const response = await axios.get('/apps/chat/chats-and-contacts')

  return response.data
})

// ** Select Chat
export const selectChat = createAsyncThunk('appChat/selectChat', async (id, { dispatch }) => {
  const response = await axios.get('/apps/chat/get-chat', {
    params: {
      id
    }
  })
  await dispatch(fetchChatsContacts())

  return response.data
})

// ** Send Msg
export const sendMsg = createAsyncThunk('appChat/sendMsg', async (obj, { dispatch }) => {
  const response = await axios.post('/apps/chat/send-msg', {
    data: {
      obj
    }
  })
  if (obj.contact) {
    await dispatch(selectChat(obj.contact.id))
  }
  await dispatch(fetchChatsContacts())

  return response.data
})

export const appChatSlice = createSlice({
  name: 'appChat',
  initialState: {
    chats: null,
    contacts: null,
    userProfile: null,
    selectedChat: null
  },
  reducers: {
    removeSelectedChat: state => {
      state.selectedChat = null
    }
  },
  extraReducers: builder => {
    builder.addCase(fetchUserProfile.fulfilled, (state, action) => {
      state.userProfile = action.payload
    })
    builder.addCase(fetchChatsContacts.fulfilled, (state, action) => {
      state.contacts = action.payload.contacts
      state.chats = action.payload.chatsContacts
    })
    builder.addCase(selectChat.fulfilled, (state, action) => {
      state.selectedChat = action.payload
    })
  }
})

export const { removeSelectedChat } = appChatSlice.actions

export default appChatSlice.reducer
