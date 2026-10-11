// ===== Talking to the backend =====

// Sends a request and gives back the answer from the server.
// Example: const project = await callApi('GET', '/projects/7');
// If something goes wrong:
//   - Automatically displays any backend error as a toast notification with a copy button
//   - Throws an error object with { message, status, fields, toastShown }
async function callApi(method, path, body, requestOptions) {
  const options = {
    method: method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin', // send the login cookie
  };
  if (requestOptions && requestOptions.signal) {
    options.signal = requestOptions.signal;
  }
  if (body) {
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch('/api' + path, options);
  } catch (networkProblem) {
    if (networkProblem.name === 'AbortError') {
      throw networkProblem;
    }
    const message = 'Network error. Check your connection and try again.';
    const error = makeApiError(0, message, {});
    if (!requestOptions || !requestOptions.silent) {
      showToast(message, 'error');
      error.toastShown = true;
    }
    throw error;
  }

  const status = response.status;
  let data = null;
  if (status !== 204) { // 204 means "done, nothing to send back"
    try {
      data = await response.json();
    } catch (notJson) {
      data = null;
    }
  }

  if (status >= 400) {
    let message = 'Something went wrong (error ' + status + ')';
    let fields = {};
    if (data && data.error) {
      message = data.error.message || message;
      fields = data.error.fields || {};
      // If validation error with field specifics, format a clear message
      if (fields && Object.keys(fields).length > 0) {
        const details = Object.entries(fields).map(function (pair) {
          return pair[0] + ': ' + pair[1];
        }).join(', ');
        if (!data.error.message || data.error.message === 'Invalid input') {
          message = 'Invalid input (' + details + ')';
        }
      }
    } else if (data && data.detail) {
      if (typeof data.detail === 'string') {
        message = data.detail;
      } else if (typeof data.detail === 'object') {
        message = data.detail.message || JSON.stringify(data.detail);
      }
    } else if (status === 404) {
      // FastAPI's own "Not Found" answer, e.g. the backend doesn't have this route yet
      message = 'Not found (the server doesn’t have this yet).';
    }

    const error = makeApiError(status, message, fields);
    if (!requestOptions || !requestOptions.silent) {
      showToast(message, 'error');
      error.toastShown = true;
    }
    throw error;
  }

  return data;
}

function makeApiError(status, message, fields) {
  const error = new Error(message);
  error.status = status;
  error.fields = fields;
  return error;
}
