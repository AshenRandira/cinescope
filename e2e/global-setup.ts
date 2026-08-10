import { preview } from 'vite'

export default async function startPreview() {
  const previewServer = await preview({
    preview: {
      host: '127.0.0.1',
      port: 4175,
      strictPort: true,
    },
  })

  return async () => {
    await previewServer.close()
  }
}
