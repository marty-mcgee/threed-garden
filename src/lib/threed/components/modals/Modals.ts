import ModalAbout from '#/lib/threed/components/modals/ModalAbout'
import ModalLoading from '#/lib/threed/components/modals/ModalLoading'
import ModalModel3d from '#/lib/threed/components/modals/ModalModel3d'
import ModalShare from '#/lib/threed/components/modals/ModalShare'

const modalsArray = [
  {
    _name: 'Modal: About',
    _component: 'ModalAbout',
    component: ModalAbout,
  },
  {
    _name: 'Modal: Loading',
    _component: 'ModalLoading',
    component: ModalLoading,
  },
  {
    _name: 'Modal: Model3d',
    _component: 'ModalModel3d',
    component: ModalModel3d,
  },
  {
    _name: 'Modal: Share',
    _component: 'ModalShare',
    component: ModalShare,
  },
]

const modals = {
  ModalAbout,
  ModalLoading,
  ModalModel3d,
  ModalShare,
}

export default modals
