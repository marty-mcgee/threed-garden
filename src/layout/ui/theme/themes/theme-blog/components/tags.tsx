export default function Tags({ tags }: { tags: any }) {
  return (
    <div className='max-w-2xl mx-auto'>
      <p className='mt-8 text-lg font-bold'>
        Tagged
        {tags.edges.map((tag: any, index: any) => (
          <span
            key={index}
            className='ml-4 font-normal'
          >
            {tag.node.name}
          </span>
        ))}
      </p>
    </div>
  )
}
