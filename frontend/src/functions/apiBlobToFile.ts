import type { AxiosResponse } from 'axios'

/**
 * Convert a blob response to a file
 * @param response - The response from the API
 * @returns The file
 */
export const apiBlobToFile = async (response: AxiosResponse): Promise<File> => {
  if (!response.headers['content-disposition']) {
    throw new Error('Response does not contain a content-disposition header')
  }
  return new File(
    [response.data],
    response.headers['content-disposition'].split('filename=')[1].replace(/^"|"$/g, ''),
    {
      type: response.headers['content-type'],
    },
  )
}
