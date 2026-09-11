import { configureStore, createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { apiRequest, jsonRequest } from './api'

export const loadRecords = createAsyncThunk('complaints/list', async () =>
  apiRequest('/complaints')
)

export const openComplaint = createAsyncThunk('complaints/open', async (id) =>
  apiRequest('/complaints/' + id)
)

export const sendMessage = createAsyncThunk(
  'complaints/message',
  async ({ message, file }, { getState, dispatch }) => {
    const current = getState().complaints.current
    let response
    if (file) {
      const form = new FormData()
      form.append('file', file)
      form.append('message', message)
      if (current) {
        form.append('complaint_id', current.id)
        form.append('version', current.version)
      }
      response = await apiRequest('/extract', { method: 'POST', body: form })
    } else {
      response = await apiRequest(
        '/assistant',
        jsonRequest({
          message,
          complaint_id: current?.id || null,
          version: current?.version || null
        })
      )
    }
    dispatch(loadRecords())
    return response
  }
)

export const saveComplaint = createAsyncThunk(
  'complaints/save',
  async (_, { getState, dispatch }) => {
    const current = getState().complaints.current
    const response = await apiRequest(
      '/complaints/' + current.id + '/save',
      jsonRequest({ version: current.version })
    )
    dispatch(loadRecords())
    return response
  }
)

const complaintsSlice = createSlice({
  name: 'complaints',
  initialState: {
    current: null,
    records: [],
    messages: [],
    busy: false,
    saving: false,
    loading: false,
    recordsLoading: false,
    error: '',
    recordsError: '',
    changedFields: [],
    notice: ''
  },
  reducers: {
    newComplaint(state) {
      state.current = null
      state.messages = []
      state.error = ''
      state.changedFields = []
      state.notice = ''
    },
    clearError(state) {
      state.error = ''
    }
  },
  extraReducers: (builder) => {
    builder.addCase(loadRecords.pending, (state) => {
      state.recordsLoading = true
      state.recordsError = ''
    })
    builder.addCase(loadRecords.fulfilled, (state, action) => {
      state.recordsLoading = false
      state.records = action.payload
    })
    builder.addCase(loadRecords.rejected, (state, action) => {
      state.recordsLoading = false
      state.recordsError = action.error.message
    })
    builder.addCase(openComplaint.pending, (state) => {
      state.loading = true
      state.error = ''
      state.notice = ''
    })
    builder.addCase(openComplaint.fulfilled, (state, action) => {
      state.loading = false
      state.current = action.payload
      state.messages = action.payload.messages
      state.changedFields = []
    })
    builder.addCase(openComplaint.rejected, (state, action) => {
      state.loading = false
      state.error = action.error.message
    })
    builder.addCase(sendMessage.pending, (state, action) => {
      state.busy = true
      state.error = ''
      state.notice = ''
      state.changedFields = []
      const { message, file } = action.meta.arg
      state.messages.push({
        role: 'user',
        content: file ? 'Uploaded ' + file.name + (message ? '\n' + message : '') : message,
        pending: true
      })
    })
    builder.addCase(sendMessage.fulfilled, (state, action) => {
      state.busy = false
      const { complaint, reply, changed_fields } = action.payload
      if (complaint) {
        state.current = complaint
        state.messages = complaint.messages
      } else {
        state.messages = state.messages.map((message) => ({ ...message, pending: false }))
        state.messages.push({ role: 'assistant', content: reply })
      }
      state.changedFields = changed_fields
    })
    builder.addCase(sendMessage.rejected, (state, action) => {
      state.busy = false
      state.messages = state.messages.filter((message) => !message.pending)
      state.error = action.error.message
    })
    builder.addCase(saveComplaint.pending, (state) => {
      state.saving = true
      state.error = ''
      state.notice = ''
    })
    builder.addCase(saveComplaint.fulfilled, (state, action) => {
      state.saving = false
      state.current = action.payload
      state.notice = 'Complaint logged. Ready for QA review.'
    })
    builder.addCase(saveComplaint.rejected, (state, action) => {
      state.saving = false
      state.error = action.error.message
    })
  }
})

export const { newComplaint, clearError } = complaintsSlice.actions
export const store = configureStore({ reducer: { complaints: complaintsSlice.reducer } })
