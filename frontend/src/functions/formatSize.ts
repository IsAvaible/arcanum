export const formatSize = (bytes: number) => {
  const k = 1024
  const dm = 2
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  if (bytes === 0) {
    return `0${sizes[0]}`
  }
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const formattedSize = parseFloat((bytes / Math.pow(k, i)).toFixed(dm))
  return `${formattedSize}${sizes[i]}`
}
