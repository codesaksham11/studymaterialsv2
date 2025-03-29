// Place this code in a file named: functions/_middleware.js

// --- Constants ---
const UNLOCKED_VALUE = 'unlocked'; // The value we expect in valid cookies

// --- Helper Function: Parse Cookies ---
function parseCookies(cookieString) {
  const cookies = new Map();
  if (cookieString) {
    cookieString.split(';').forEach(cookie => {
      const parts = cookie.match(/(.*?)=(.*)/);
      if (parts) {
        const name = parts[1]?.trim();
        const value = (parts[2] || '').trim();
        if (name) {
          cookies.set(name, value);
        }
      }
    });
  }
  return cookies;
}

// --- Helper Function: Check Cookie ---
function hasValidCookie(cookies, cookieName) {
  return cookies.has(cookieName) && cookies.get(cookieName) === UNLOCKED_VALUE;
}

// --- Helper Function: Generate Block Response ---
function blockAccess(reason = "Access Denied") {
  console.log(`Middleware Blocking: ${reason}`); // Logs appear in Pages Functions logs
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head><title>Access Denied</title><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: sans-serif; text-align: center; padding: 50px 15px;">
      <h1 style="color: #dc3545;">Access Denied (Error 403)</h1>
      <p>You do not have permission to view this page.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p style="margin-top:20px;">Please ensure you have unlocked this content correctly using the code provided.</p>
      <button onclick="window.history.back()" style="padding: 10px 20px; font-size: 1rem; cursor: pointer; background-color: #6c757d; color: white; border: none; border-radius: 5px; margin-top: 15px;">Go Back</button>
    </body>
    </html>`,
    {
      status: 403, // Forbidden
      headers: { 'Content-Type': 'text/html' }
    }
  );
}

// --- Main Middleware Function ---
export async function onRequest(context) {
  const { request, next } = context; // Get request object and 'next' function
  const url = new URL(request.url);
  const pathname = url.pathname;
  const cookies = parseCookies(request.headers.get('Cookie') || '');

  // Skip middleware logic for static assets if needed (optional optimization)
  // if (pathname.startsWith('/images/') || pathname.startsWith('/css/') || pathname.startsWith('/js/')) {
  //     return next(); // Serve assets directly
  // }

  // --- Define Protected Path Prefixes (IMPORTANT: Must match your folder structure) ---
  const protectedTopperPaths = [
    // Add the base paths for each topper's protected content pages
    '/sumanbasyal/',
    '/kshitijchapagain/', // Add when you create this folder
    '/pranavkhanal/'      // Add when you create this folder
  ];

  // --- Layer 1: Check Protected Subject Pages within Topper Folders ---
  for (const prefix of protectedTopperPaths) {
    // Check if the path starts with a protected prefix AND targets an HTML file within it
    if (pathname.startsWith(prefix) && pathname.endsWith('.html')) {
      // Extract topper name (e.g., "suman") and subject file (e.g., "science.html")
      const pathParts = pathname.substring(1).split('/'); // ["sumanbasyal", "science.html"]
      if (pathParts.length >= 2) {
        // Normalize 'basyal' to 'suman' IF NEEDED for cookie consistency. Adjust if using 'basyal_' cookies.
        let topperName = pathParts[0];
        if (topperName === 'sumanbasyal') topperName = 'suman';
        // Add similar normalizations if needed:
        // if (topperName === 'kshitijchapagain') topperName = 'kshitij';
        // if (topperName === 'pranavkhanal') topperName = 'pranav';

        const subjectFile = pathParts[1];
        const subjectName = subjectFile.replace('.html', ''); // e.g., "science"

        // Construct the required cookie name (e.g., "suman_science")
        const requiredCookie = `${topperName}_${subjectName}`;
        console.log(`Middleware: Path match ${pathname}. Requires cookie: ${requiredCookie}`);

        if (!hasValidCookie(cookies, requiredCookie)) {
          return blockAccess(`Missing or invalid access for ${topperName}'s ${subjectName} notes`);
        }
        // If cookie is valid for this specific subject page, allow it and stop further checks for this request
        console.log(`Middleware: Access allowed for ${pathname}`);
        return next(); // Proceed to serve the file
      }
    }
  } // End Layer 1 Loop

  // --- Layer 2: Check Note Viewer Page ---
  if (pathname === '/notepage_viewer.html') {
    console.log("Middleware: Checking viewer page access...");
    const topicParam = url.searchParams.get('topic');

    if (!topicParam) {
      return blockAccess("Missing topic identifier in URL");
    }

    // Extract required cookie name from topic parameter (e.g., "suman_science" from "suman_science_force")
    const topicParts = topicParam.split('_');
    if (topicParts.length < 2) {
      // Basic format check - ensure at least topper_subject_...
      return blockAccess("Invalid topic identifier format");
    }
    // Construct required cookie name (e.g., "suman_science")
    const requiredCookie = `${topicParts[0]}_${topicParts[1]}`;
    console.log(`Middleware: Viewer topic ${topicParam}. Requires cookie: ${requiredCookie}`);

    if (!hasValidCookie(cookies, requiredCookie)) {
      return blockAccess(`Missing or invalid access for the subject related to topic ${topicParam}`);
    }
    console.log(`Middleware: Access allowed for viewer with topic ${topicParam}`);
    // If cookie is valid for the viewer + topic, allow it
    return next(); // Proceed to serve the viewer page
  }

  // --- Allow Other Requests ---
  // If the request didn't trigger any blocking condition above (e.g., index.html, CSS, JS, allowed pages), let it pass through.
  console.log(`Middleware: Allowing request for ${pathname} (No specific rule matched or check passed)`);
  return next(); // Let Cloudflare Pages serve the requested static file or handle other functions
}
