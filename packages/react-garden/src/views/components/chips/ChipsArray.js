// ** React Imports
import { useState } from 'react'

// ** MUI Imports
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'

const ChipsArray = () => {
  // ** State
  const [chipData, setChipData] = useState([
    { key: 0, avatar: '/images/avatars/1.png', avatarAlt: 'User Avatar', label: 'Norman Santiago' },
    { key: 1, avatar: '/images/avatars/2.png', avatarAlt: 'User Avatar', label: 'Cecelia Tucker' },
    { key: 2, label: 'Max Burns' },
    { key: 3, avatar: '/images/avatars/4.png', avatarAlt: 'User Avatar', label: 'Ellen Nguyen' },
    { key: 4, avatar: '/images/avatars/5.png', avatarAlt: 'User Avatar', label: 'Edward Francis' }
  ])

  const handleDelete = chipToDelete => () => {
    setChipData(chips => chips.filter(chip => chip.key !== chipToDelete.key))
  }

  return (
    <div className='demo-space-x'>
      {chipData.map(data => (
        <Chip
          key={data.key}
          label={data.label}
          avatar={<Avatar src={data.avatar} alt={data.avatarAlt} />}
          onDelete={data.key === 2 ? undefined : handleDelete(data)}
        />
      ))}
    </div>
  )
}

export default ChipsArray
