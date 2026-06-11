// JWT verification removed per request — middleware is now a no-op.
export function verifyToken(req, res, next) {
  // Optionally set a dummy user or leave undefined
  req.user = null
  next()
}
