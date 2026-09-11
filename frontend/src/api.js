export async function apiRequest(path, options = {}) {
  let response
  try {
    response = await fetch('/api' + path, options)
  } catch {
    throw new Error('Cannot reach the server. Check that the backend is running.')
  }
  let data
  try {
    data = await response.json()
  } catch {
    throw new Error('The server is unavailable. Check that the backend is running.')
  }
  if (!response.ok) {
    let message = data.detail || 'Something went wrong. Please try again.'
    if (Array.isArray(message)) message = message.map((item) => item.msg).join(' ')
    throw new Error(message)
  }
  return data
}

export function jsonRequest(body) {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }
}
