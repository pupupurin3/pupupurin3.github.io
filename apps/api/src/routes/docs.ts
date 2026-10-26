import { Hono } from 'hono'
import type { AppEnv } from '../env'

// Interactive API reference, rendered by Scalar from /openapi.json.
const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Portfolio API reference</title>
</head>
<body>
  <script id="api-reference" data-url="/openapi.json"></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.76.0"></script>
</body>
</html>`

export const docsRoutes = new Hono<AppEnv>()
  .get('/', (c) => c.redirect('/docs'))
  .get('/docs', (c) => {
    // The reference page loads its script from a CDN, so it gets a looser policy than the API.
    c.header(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' data: https://cdn.jsdelivr.net https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self'",
    )
    return c.html(page)
  })
