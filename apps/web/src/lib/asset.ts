// Public files are referenced through the build's base URL, so the site also
// works when served from a sub-path (e.g. a preview host).
export const asset = (path: string) => import.meta.env.BASE_URL + path
