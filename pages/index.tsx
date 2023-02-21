import { useState, useEffect } from 'react'
import { useSignMessage } from 'wagmi'
import { useRouter } from 'next/router'
import { Inter } from '@next/font/google'
import { useQuery } from 'react-query'
import { BI, RPC } from '@ckb-lumos/lumos'
import { useAddresses } from '../utils/hooks'
import { signTransaction } from '../utils/tx'
import { SERVER_API, STORAGE_CAPACITY, CKB_NODE } from '../utils/constants'
import styles from './index.module.scss'

const inter = Inter({ subsets: ['latin'] })

const CKB_DECIMAL = 10 ** 8
const MIN_CAPACITY = BI.from(STORAGE_CAPACITY!)

const MIN_SHANNON = MIN_CAPACITY.mul(CKB_DECIMAL)

const Index = () => {
  const router = useRouter()
  // patch mismatch hydration
  const [addr, setAddr] = useState<string | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const addresses = useAddresses()

  const { signMessageAsync } = useSignMessage()

  const { data: storage } = useQuery(
    ['storage', addresses.ckb],
    () => fetch(`${SERVER_API}/load/${addresses.ckb}`).then((res) => res.json()),
    {
      enabled: !!addresses.ckb,
      refetchInterval: 10000,
    }
  )

  const { data: meta } = useQuery(
    ['meta', addresses.ckb],
    () => fetch(`${SERVER_API}/meta/${addresses.ckb}`).then((res) => res.json()),
    {
      enabled: !!addresses.ckb,
      refetchInterval: 10000,
    }
  )

  useEffect(() => {
    if (storage) {
      router.replace(`/${addresses.eth}`)
    }
  }, [storage, addresses.ckb])

  useEffect(() => {
    setAddr(addresses.ckb)
  }, [addresses.eth])

  const handleClaim = async () => {
    if (!addresses.ckb) return
    setIsLoading(true)
    try {
      const raw = await fetch(`${SERVER_API}/claim/${addresses.ckb}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ capacity: MIN_SHANNON.toHexString() }),
      }).then((res) => res.json())

      const signedTx = await signTransaction(raw, signMessageAsync)
      const txHash = await new RPC(CKB_NODE!).sendTransaction(signedTx, 'passthrough')

      console.info({ claim: txHash })

      return { txHash }
    } catch (e) {
      if (e instanceof Error) {
        window.alert(e.message)
      }
      setIsLoading(false)
    }
  }

  const currentBalance = BI.from(meta?.capacity ?? 0)

  return (
    <div className={`${styles.container} ${inter.className}`}>
      <div className={styles.title}>Kuai MVP DApp Demo</div>
      <div className={styles.desc}>
        {addr ? null : 'Connect a wallet to view its storage'}
        {currentBalance.gt(MIN_SHANNON) ? (
          <button onClick={handleClaim} disabled={isLoading} className={styles.claim}>
            {isLoading ? 'Claiming' : 'Claim'}
          </button>
        ) : (
          <div className={styles.faucet}>
            {`At least ${MIN_CAPACITY} CKB required, current balance is around ${currentBalance.div(
              CKB_DECIMAL
            )} CKB, please claim in `}
            <a href="https://faucet.nervos.org/" target="_blank" rel="noopener noreferrer">
              Faucet
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
export default Index
