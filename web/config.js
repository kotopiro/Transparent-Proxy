// web/config.js
// Put your worker origin here:
window.PROXY_ORIGIN = "https://transparent-proxy.mnxsv69789.workers.dev"; // <- CHANGE to your deployed worker URL

// Shared secret: MUST match the Worker PROXY_KEY secret
// Use a long random string. For production use stronger secret and don't expose publicly.
window.PROXY_KEY = "change_this_to_a_long_random_string_32chars_or_more";
