import { auth } from "auth"

export const GET = auth((req) => {
  if (req.auth) {
    // return Response.json({ data: "Protected data" })
    // return Response
    // return req
    return
  }

  // return Response.json({ message: "Not authenticated" }, { status: 401 })
  // return Response
  // return req
  return
}) as any // TODO: Fix `auth()` return type
