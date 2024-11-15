
import objectsJSON from '#/app/api/home-design/objects.json'
// export const revalidate = 60

// export async function GET() {
//   const data = objectsJSON // await fetch('https://api.vercel.app/blog')
//   const objects = data // await data.json()

//   return Response.json(objects)
// }

export async function GET() {
  return new Response(
    JSON.stringify(objectsJSON),
    {
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )
}