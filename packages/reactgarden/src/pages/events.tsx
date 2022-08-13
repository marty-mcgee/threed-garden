import type { NextPage } from "next"
import { GetServerSideProps } from "next"
import axios from "axios"

import { Event } from "../types/interfaces"

const EventsPage: NextPage<{ events: Event[] }> = ({ events }) => (
  <div>
    {events.map((event: Event) => (
      <div key={event.title.rendered}>{event.title.rendered}</div>
    ))}
  </div>
)

export const getServerSideProps: GetServerSideProps = async () => {
  const res = await axios.get<Event[]>(`${process.env.WP_REST_API_URL}/scene`)

  console.log("res.data", res.data)

  return {
    props: { events: res.data },
  }
}

export default EventsPage
