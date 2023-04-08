import { createContext, useState, useCallback, useContext } from 'react'
import { helpers, Script } from '@ckb-lumos/lumos'

export const useNexusConnect = () => {
  const nexus = (globalThis as any).ckb ?? null
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')
  const [wallet, setWallet] = useState<any>(null)
  const [locks, setLocks] = useState<Array<Script>>([])

  const connect = useCallback(async () => {
    if (wallet) return
    setStatus('connecting')
    try {
      const w = await nexus.request({ method: 'wallet_enable' })
      setWallet(w)
      const unusedLocks = await nexus.request({
        method: 'wallet_fullOwnership_getOffChainLocks',
        params: { change: 'external' },
      })

      const { objects: usedLocks } = await nexus.request({
        method: 'wallet_fullOwnership_getOnChainLocks',
        params: { change: 'external' },
      })
      setLocks([...usedLocks, ...unusedLocks])
      setStatus('connected')
    } catch (e) {
      if (e instanceof Error) {
        window.alert(e.message)
      }
      setStatus('disconnected')
    }
  }, [nexus])

  const address = locks[0] ? helpers.encodeToAddress(locks[0]) : null
  const signer = (tx: helpers.TransactionSkeletonObject) =>
    nexus?.request({ method: 'wallet_fullOwnership_signTransaction', params: { tx } }) ??
    Promise.reject('Nexus is not connected')

  return {
    status,
    connect,
    wallet,
    locks,
    address,
    signer,
  }
}

export const NexusContext = createContext<ReturnType<typeof useNexusConnect>>({
  wallet: null,
  locks: [],
  connect: () => Promise.resolve(),
  status: 'disconnected',
  address: null,
  signer: () => Promise.reject('Nexus is not connected'),
})

export const NexusProvider = NexusContext.Provider
export const useNexus = () => useContext(NexusContext)
