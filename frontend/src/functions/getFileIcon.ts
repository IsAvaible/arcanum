export const getFileIcon = (type: string): string => {
  if (type.startsWith('image')) {
    return 'pi-image'
  } else if (type.startsWith('audio')) {
    return 'pi-headphones'
  } else if (type.startsWith('application/pdf')) {
    return 'pi-file-pdf'
  } else if (type.startsWith('video')) {
    return 'pi-video'
  } else {
    return 'pi-file'
  }
}
