import Image from 'next/image'

interface IAuthor {
  node: any
  // firstName
  // lastName
  // avatar { url }
}

export default function Avatar({ author }: { author: IAuthor }) {
  const isAuthorHaveFullName = author?.node?.firstName && author?.node?.lastName

  const name = isAuthorHaveFullName ? `${author.node.firstName} ${author.node.lastName}` : author.node.name || null

  return (
    <div className='flex items-center'>
      <div className='w-12 h-12 relative mr-4'>
        <Image
          src={author.node.avatar.url}
          // layout='fill'
          className='rounded-full'
          alt={name}
        />
      </div>
      <div className='text-xl font-bold'>{name}</div>
    </div>
  )
}
