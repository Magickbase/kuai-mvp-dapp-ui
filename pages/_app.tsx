import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { QueryClient, QueryClientProvider } from 'react-query'
import { config } from '@ckb-lumos/lumos'
import Header from '../components/header'
import '../style/global.scss'
import { NexusProvider, useNexusConnect } from '../utils/nexus'

const queryClient = new QueryClient()

export default function App({ Component, pageProps }: AppProps) {
  const nexus = useNexusConnect()
  useEffect(() => {
    const ckbConfig = config.predefined.AGGRON4
    config.initializeConfig(ckbConfig)
  }, [])
  return (
    <NexusProvider value={nexus}>
      <QueryClientProvider client={queryClient}>
        <Header />
        <Component {...pageProps} />
      </QueryClientProvider>
    </NexusProvider>
  )
}
