import { auth } from "~/app/auth"

export const GET = auth((req) => {
  // const reqJSON = req.json()
  const res = Response.toString()

  if (req.auth) {
    return Response.json({ data: "Protected data" })
    // return Response
    // return req
    // return
    return JSON.parse(res)
  }

  return Response.json({ message: "Not authenticated" }, { status: 401 })
  // return Response
  // return req
  // return
    return JSON.parse(res)
}) as any // TODO: Fix `auth()` return type
