import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { Inter } from '@next/font/google'
import { useQuery } from 'react-query'
import { helpers, config, commons, BI, RPC } from '@ckb-lumos/lumos'
import { omnilock } from '@ckb-lumos/common-scripts'
import { bytes } from '@ckb-lumos/codec'
import { blockchain } from '@ckb-lumos/base'
import { useSignMessage } from 'wagmi'
import styles from './index.module.scss'
import { useAddresses } from '../utils/hooks'
import { signTransaction } from '../utils/tx'
import { SERVER_API, STORAGE_CAPACITY, CKB_NODE } from '../utils/constants'
const inter = Inter({ subsets: ['latin'] })

const CKB_DECIMAL = 10 ** 8
const MIN_CAPACITY = BI.from(STORAGE_CAPACITY!)

const MIN_SHANNON = MIN_CAPACITY.mul(CKB_DECIMAL)

const Index = () => {
  const router = useRouter()
  // patch mismatch hydration
  const [addr, setAddr] = useState<string | undefined>(undefined)
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
      router.push(`/${addresses.eth}`)
    }
  }, [storage, addresses.ckb])

  useEffect(() => {
    setAddr(addresses.ckb)
  }, [addresses.eth])

  const handleClaim = async () => {
    if (!addresses.ckb) return
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
      console.log({ txHash })

      return { txHash }
    } catch (e) {
      if (e instanceof Error) {
        window.alert(e.message)
      }
    }
  }

  const currentBalance = BI.from(meta?.capacity ?? 0)

  return (
    <div className={`${styles.container} ${inter.className}`}>
      <div className={styles.title}>Kuai MVP DApp Demo</div>
      <div className={styles.desc}>
        {addr ? null : 'Connect a wallet to view its storage'}
        {currentBalance.gt(MIN_SHANNON) ? (
          <button onClick={handleClaim}>Claim</button>
        ) : (
          <div>{`At least ${MIN_CAPACITY} CKB required, current balance is around ${currentBalance.div(
            CKB_DECIMAL
          )} CKB, please claim in faucet`}</div>
        )}
      </div>
    </div>
  )
}
export default Index
