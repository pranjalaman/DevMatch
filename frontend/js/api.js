// ===== Talking to the backend =====

// Sends a request and gives back the answer from the server.
// Example: const project = await callApi('GET', '/projects/7');
// If something goes wrong it throws an error that has:
//   error.message - text to show the user
//   error.status  - HTTP status code (401 = not logged in, 404 = not found, ...)
//   error.fields  - problems with form fields, like { title: 'Max 80 characters' }
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
    throw makeApiError(0, 'Network error. Check your connection and try again.', {});
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
    } else if (status === 404) {
      // FastAPI's own "Not Found" answer, e.g. the backend doesn't have this route yet
      message = 'Not found (the server doesn’t have this yet).';
    }
    throw makeApiError(status, message, fields);
  }

  return data;
}

function makeApiError(status, message, fields) {
  const error = new Error(message);
  error.status = status;
  error.fields = fields;
  return error;
}
