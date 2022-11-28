import type { NextPage } from 'next'
import { GetServerSideProps } from 'next'
import axios from 'axios'

import { IEvent } from '~/types/interfaces'

const EventsPage: NextPage<{ events: IEvent[] }> = ({ events }) => (
  <div>
    {events.map((event: IEvent) => (
      <div key={event.title.rendered}>{event.title.rendered}</div>
    ))}
  </div>
)

export const getServerSideProps: GetServerSideProps = async () => {
  let res = { data: [{ title: { rendered: 'HEY HEY HEY' } }] }

  try {
    res = await axios.get<IEvent[]>(`${process.env.WP_REST_API_URL}/event`)
  } catch (e: any) {
    res.data = [{ title: { rendered: 'HEY HEY HEY' } }]
    console.log('catch e', e)
  }

  console.log('res.data', res.data)

  return {
    props: { events: res.data },
  }
}

export default EventsPage
