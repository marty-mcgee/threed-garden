import type { NextPage } from 'next'
import { GetServerSideProps } from 'next'
import axios from 'axios'

import { IScene } from '#/lib/types/interfaces'

const ScenesPage: NextPage<{ scenes: IScene[] }> = ({ scenes }) => (
  <div>
    {scenes.map((scene: IScene) => (
      <div key={scene.title.rendered}>{scene.title.rendered}</div>
    ))}
  </div>
)

export const getServerSideProps: GetServerSideProps = async () => {
  let res = { data: [{ title: { rendered: 'HEY HEY HEY' } }] }

  try {
    res = await axios.get<IScene[]>(`${process.env.WP_REST_API_URL}/scene`)
  } catch (e: any) {
    res.data = [{ title: { rendered: 'HEY HEY HEY' } }]
    console.log('catch e', e)
  }

  console.log('res.data', res.data)

  return {
    props: { scenes: res.data },
  }
}

export default ScenesPage
