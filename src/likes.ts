export function setupLikes(element: HTMLButtonElement) {
  let likes = 0
  const setLikes = (count: number) => {
    likes = count
    element.innerHTML = `Likes: ${likes}`
  }
  element.addEventListener('click', () => setLikes(++likes))
  setLikes(0)
}
