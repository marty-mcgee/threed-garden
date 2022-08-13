import type { NextPage } from 'next';
import { GetServerSideProps } from 'next';
import axios from 'axios';

import { Event } from '../types/interfaces';

const Home: NextPage = ({ events }) => (
  <div>
    {events.map((event: Event) => (
      <div key={event.title}>{event.title}</div>
    ))}
  </div>
);

const Events: NextPage<{ events: Event[] }> = ({ events }) => (
  <div>
    {events.map((event: Event) => (
      <div key={event.title}>{event.title}</div>
    ))}
  </div>
);

export const getServerSideProps: GetServerSideProps = async () => {
  const res = await axios.get<Event[]>(`${process.env.API_URL}/events`);

  return {
    props: { events: res.data },
  };
};

// export default { Home, Events };
export default Events;
