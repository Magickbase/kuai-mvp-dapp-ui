import type { AppProps } from 'next/app'
import { useEffect } from 'react'
import { WagmiConfig, createClient, mainnet, configureChains } from 'wagmi'
import { publicProvider } from '@wagmi/core/providers/public'
import { QueryClient, QueryClientProvider } from 'react-query'
import { config } from '@ckb-lumos/lumos'
import Header from '../components/header'
import '../style/global.scss'

const { provider, webSocketProvider } = configureChains([mainnet], [publicProvider()])
const queryClient = new QueryClient()
const client = createClient({ autoConnect: true, provider, webSocketProvider })

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    const ckbConfig = config.predefined.AGGRON4
    config.initializeConfig(ckbConfig)
  }, [])
  return (
    <WagmiConfig client={client}>
      <QueryClientProvider client={queryClient}>
        <Header />
        <Component {...pageProps} />
      </QueryClientProvider>
    </WagmiConfig>
  )
}
