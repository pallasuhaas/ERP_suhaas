// Turn an HTTP failure into a message that is safe to show to users.
// status 0 means the request never reached the server (fetch threw a TypeError).
export function friendlyError(status, text = '') {
  if (status === 0) return "Can't reach the server. Check your connection and try again."

  // Prefer the backend's own message when it sends a short, readable one
  try {
    const body = JSON.parse(text)
    const msg = typeof body?.message === 'string' ? body.message.trim() : ''
    if (msg && msg.length <= 200 && !msg.includes('Exception') && !msg.includes('\n')) return msg
  } catch { /* not JSON */ }

  if (status === 400) return 'Please check the details you entered.'
  if (status === 404) return 'Not found.'
  if (status === 409) return 'That record already exists.'
  if (status >= 500)  return 'Server error, please try again.'
  return `Something went wrong (error ${status}). Please try again.`
}

// fetch() wrapper used by req(): network failures become a friendly Error too
export async function safeFetch(url, opts) {
  try {
    return await fetch(url, opts)
  } catch (e) {
    if (e instanceof TypeError) throw new Error(friendlyError(0))
    throw e
  }
}
