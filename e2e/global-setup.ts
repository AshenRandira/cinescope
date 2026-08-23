import { preview } from 'vite'

export default async function startPreview() {
  const previewPort = Number.parseInt(
    process.env.CINESCOPE_E2E_PORT ?? '4175',
    10,
  )
  const previewServer = await preview({
    preview: {
      host: '127.0.0.1',
      port: previewPort,
      strictPort: true,
    },
  })

  return async () => {
    await previewServer.close()
  }
}
