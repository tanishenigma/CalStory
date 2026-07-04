/**
 * /api/fit/callback — Google OAuth2 implicit-flow redirect handler.
 *
 * Google redirects here with the access token in the URL hash fragment
 * (e.g. #access_token=...&expires_in=3600&token_type=Bearer).
 *
 * Because hash fragments are never sent to the server, this route
 * serves a tiny HTML page that reads the fragment client-side,
 * stores the token in sessionStorage via a postMessage or direct
 * write, and then navigates the user to /fitness.
 *
 * This route is GET only.
 */

import { NextResponse } from "next/server";

export const runtime = "edge";

export function GET() {
  // Serve a minimal HTML page that parses the URL fragment and stores
  // the token in sessionStorage before redirecting to /fitness.
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Connecting Google Fit…</title>
</head>
<body>
  <script>
    (function () {
      try {
        var fragment = window.location.hash.slice(1);
        var params = new URLSearchParams(fragment);
        var token = params.get("access_token");
        var expiresIn = parseInt(params.get("expires_in") ?? "3600", 10);
        var error = params.get("error");

        if (error) {
          // Permission denied or user cancelled — redirect with a flag
          window.location.replace("/fitness?fit_error=" + encodeURIComponent(error));
          return;
        }

        if (token) {
          var expiry = Date.now() + expiresIn * 1000;
          sessionStorage.setItem("calstory_gfit_token", token);
          sessionStorage.setItem("calstory_gfit_token_expiry", String(expiry));
        }

        window.location.replace("/fitness?fit_connected=1");
      } catch (e) {
        window.location.replace("/fitness?fit_error=callback_failed");
      }
    })();
  </script>
  <p>Connecting to Google Fit&hellip;</p>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
