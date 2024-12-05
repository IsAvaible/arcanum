import type { AxiosResponse } from 'axios'

/**
 * Convert a blob response to a file
 * @param response - The response from the API
 * @returns The file
 */
export const apiBlobToFile = async (response: AxiosResponse): Promise<File> => {
  return new File(
    [response.data],
    response.headers['content-disposition'].split('filename=')[1].replace(/^"|"$/g, ''),
    {
      type: response.headers['content-type'],
    },
  )
}
