import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Inter } from '@next/font/google'
import { useQuery } from 'react-query'
import { BI, RPC } from '@ckb-lumos/lumos'
import { signTransaction } from '../utils/tx'
import { SERVER_API, STORAGE_CAPACITY, CKB_NODE } from '../utils/constants'
import styles from './index.module.scss'
import { useNexus } from '../utils/nexus'

const inter = Inter({ subsets: ['latin'] })

const CKB_DECIMAL = 10 ** 8
const MIN_CAPACITY = BI.from(STORAGE_CAPACITY!)

const MIN_SHANNON = MIN_CAPACITY.mul(CKB_DECIMAL)

const Index = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const { address, signer } = useNexus()

  const { data: storage } = useQuery(
    ['storage', address],
    () =>
      fetch(`${SERVER_API}/load/${address}`).then(async (res) => {
        const r = await res.json()
        if (res.status !== 200) {
          throw new Error(JSON.stringify(r))
        }
        return r
      }),
    {
      enabled: !!address,
      refetchInterval: 10000,
    }
  )

  const { data: meta } = useQuery(
    ['meta', address],
    () =>
      fetch(`${SERVER_API}/meta/${address}`)
        .then((res) => {
          if (res.status !== 200) {
            throw new Error('fail to fetch meta')
          }
          return res.json()
        })
        .then((res) => res.data),
    {
      enabled: !!address,
      refetchInterval: 10000,
    }
  )

  useEffect(() => {
    if (storage) {
      router.replace(`/${address}`)
    }
  }, [storage, address])

  const handleClaim = async () => {
    if (!address) return
    setIsLoading(true)
    try {
      const raw = await fetch(`${SERVER_API}/claim/${address}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ capacity: MIN_SHANNON.toHexString() }),
      })
        .then((res) => {
          if (res.status !== 200) {
            throw new Error('fail to claim')
          }
          return res.json()
        })
        .then((res) => res.data)

      const signedTx = await signTransaction(raw, signer)
      const txHash = await new RPC(CKB_NODE!).sendTransaction(signedTx, 'passthrough')

      return { txHash }
    } catch (e) {
      if (e instanceof Error) {
        window.alert(e.message)
      }
      setIsLoading(false)
    }
  }

  const handleCopyAddr = () => {
    if (address) {
      window.navigator.clipboard.writeText(address)
      setIsCopied(true)
      setTimeout(() => {
        setIsCopied(false)
      }, 3000)
    }
  }

  const currentBalance = BI.from(meta?.capacity ?? 0)

  return (
    <div className={`${styles.container} ${inter.className}`}>
      <div className={styles.title}>Kuai MVP DApp Demo</div>
      <div className={styles.desc}>
        {address ? (
          currentBalance.gt(MIN_SHANNON) ? (
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
              <br />
              <button onClick={handleCopyAddr} disabled={isCopied} className={styles.copy}>
                {isCopied ? 'CKB Address Copied' : `Copy CKB Address`}
              </button>
            </div>
          )
        ) : (
          'Connect a wallet to view its storage'
        )}
      </div>
    </div>
  )
}
export default Index
