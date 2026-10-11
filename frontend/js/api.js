// ===== Talking to the backend =====

// true = use the demo server in mock.js, false = use the real backend
let useDemoData = false;

// We always use the real backend now.
// Add ?mock to the page address (e.g. localhost:8080/?mock) to use the demo data instead.
async function checkBackend() {
  if (location.search.includes('mock')) {
    useDemoData = true;
  }
}

// Sends a request and gives back the answer from the server.
// Example: const project = await callApi('GET', '/projects/7');
// If something goes wrong it throws an error that has:
//   error.message - text to show the user
//   error.status  - HTTP status code (401 = not logged in, 404 = not found, ...)
//   error.fields  - problems with form fields, like { title: 'Max 80 characters' }
async function callApi(method, path, body) {
  let status;
  let data;

  if (useDemoData) {
    const answer = await fakeServer(method, path, body);
    status = answer.status;
    data = answer.data;
  } else {
    const options = {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin', // send the login cookie
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    let response;
    try {
      response = await fetch('/api' + path, options);
    } catch (networkProblem) {
      throw makeApiError(0, 'Network error. Check your connection and try again.', {});
    }

    status = response.status;
    data = null;
    if (status !== 204) { // 204 means "done, nothing to send back"
      try {
        data = await response.json();
      } catch (notJson) {
        data = null;
      }
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
