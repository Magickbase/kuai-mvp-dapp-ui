import type { ProfilePrimaryKey, AddressPrimaryKey, DwebPrimaryKey, StorageItem } from '../../utils/constants'
import type { SignMessageArgs } from '@wagmi/core'
import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { useRouter } from 'next/router'
import { Inter } from '@next/font/google'
import { RPC } from '@ckb-lumos/lumos'
import { useSignMessage } from 'wagmi'
import Overview from '../../components/overview'
import Section from '../../components/section'
import UpdateInfoDialog, { Item } from '../../components/updateInfoDialog'
import { useAddresses, useIsOwner } from '../../utils/hooks'
import { signTransaction } from '../../utils/tx'
import { SERVER_API, CKB_NODE } from '../../utils/constants'
import styles from './address.module.scss'

const inter = Inter({ subsets: ['latin'] })

export interface Storage {
  profile: StorageItem<ProfilePrimaryKey>
  addresses: StorageItem<AddressPrimaryKey>
  custom: StorageItem<string>
  dweb: StorageItem<DwebPrimaryKey>
}

const sections: Array<{ namespace: keyof Storage }> = [
  { namespace: 'profile' },
  { namespace: 'addresses' },
  { namespace: 'custom' },
  { namespace: 'dweb' },
]

const submitNewStorage = async (
  addresses: ReturnType<typeof useAddresses>,
  newStorage: Storage,
  signer: (args?: SignMessageArgs | undefined) => Promise<`0x${string}`>
) => {
  const raw = await fetch(`${SERVER_API}/set/${addresses.ckb}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ value: newStorage }),
  }).then((res) => res.json())

  const signedTx = await signTransaction(raw, signer)
  const txHash = await new RPC(CKB_NODE!).sendTransaction(signedTx, 'passthrough')

  console.info({ update: txHash })
  return { txHash }
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [activeItem, setActiveItem] = useState<Item | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [storage, setStorage] = useState<Storage>({
    profile: {},
    addresses: {},
    custom: {},
    dweb: {},
  })

  const router = useRouter()
  const isOwner = useIsOwner()
  const { signMessageAsync } = useSignMessage()

  const addresses = useAddresses()

  const { data: onChainStorage } = useQuery(
    ['storage', addresses.ckb],
    () =>
      fetch(`${SERVER_API}/load/${addresses.ckb}`).then((res) => {
        if (res.status === 404) {
          router.replace('/')
          return
        }
        return res.json()
      }),
    {
      enabled: !!addresses.ckb,
      refetchInterval: 10000,
    }
  )

  useEffect(() => {
    setIsLoading(false)
    setStorage({
      profile: onChainStorage?.profile ?? {},
      addresses: onChainStorage?.addresses ?? {},
      custom: onChainStorage?.custom ?? {},
      dweb: onChainStorage?.dweb ?? {},
    })
  }, [onChainStorage])

  /**
   * update a specific field
   **/
  const handleSubmit = async (newValue: any) => {
    setIsLoading(true)
    const namespace = Object.keys(newValue)[0]
    const field = Object.keys(newValue[namespace])[0]
    const newStorage = JSON.parse(JSON.stringify(storage))
    newStorage[namespace][field] = newValue[namespace][field]
    try {
      const res = await submitNewStorage(addresses, newStorage, signMessageAsync)
    } catch (e) {
      if (e instanceof Error) {
        console.error(e.message)
        window.alert(e.message)
      }
      setIsLoading(false)
    } finally {
      setIsEditMode(false)
      setActiveItem(null)
    }
  }

  /**
   * remove a specific field
   **/
  const handleRemove = async (namespace: string, field: string) => {
    setIsLoading(true)
    const newStorage = JSON.parse(JSON.stringify(storage))
    delete newStorage[namespace][field]
    try {
      const res = await submitNewStorage(addresses, newStorage, signMessageAsync)
      console.debug({ remove: res?.txHash })
    } catch (e) {
      if (e instanceof Error) {
        console.error(e.message)
        window.alert(e.message)
      }
      setIsLoading(false)
    } finally {
      setIsEditMode(false)
    }
  }

  /**
   * destroy the store cell
   **/
  const handleDestroyBtnClick = async () => {
    setIsLoading(true)
    try {
      const raw = await fetch(`${SERVER_API}/clear/${addresses.ckb}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then((res) => res.json())

      const signedTx = await signTransaction(raw, signMessageAsync)
      const txHash = await new RPC(CKB_NODE!).sendTransaction(signedTx, 'passthrough')
      console.info({ destroy: txHash })
      return { txHash }
    } catch (e) {
      if (e instanceof Error) {
        console.error(e.message)
      }
      setIsLoading(false)
    } finally {
      setIsEditMode(false)
    }
  }

  const handleRecordClick = (e: React.MouseEvent<HTMLElement>) => {
    if (e.target instanceof HTMLElement) {
      const {
        dataset: { namespace, field, action },
      } = e.target as HTMLButtonElement
      if (!namespace || !action) {
        return
      }
      switch (action) {
        case 'add': {
          setActiveItem({ namespace })
          break
        }
        case 'edit': {
          setActiveItem({ namespace, field })
          break
        }
        case 'remove': {
          if (field) {
            handleRemove(namespace, field)
          }
          break
        }
        default: {
          // ignore
        }
      }
    }
  }

  const handleDialogDismiss = () => {
    setActiveItem(null)
  }
  const handleEditBtnClick = () => {
    setIsEditMode((is) => !is)
  }

  return (
    <>
      <main className={inter.className} onClick={handleRecordClick}>
        <div className={styles.sections} data-is-editable={isOwner && isEditMode}>
          <Overview
            name={`matickbase.bit`}
            avatar={storage.profile.avatar?.value}
            description={storage.profile.description?.value}
            onEditBtnClick={handleEditBtnClick}
            onDestroyBtnClick={handleDestroyBtnClick}
            isEditable={isOwner && isEditMode}
            isLoading={isLoading}
          />
          {sections.map((s) =>
            s.namespace in storage ? <Section {...s} records={storage[s.namespace]} key={s.namespace} /> : null
          )}
          <Section
            namespace="permissions"
            records={{
              owner: { value: addresses.ckb ?? '' },
              manager: { value: addresses.eth ?? '' },
            }}
          />
        </div>
      </main>
      {activeItem && storage ? (
        <UpdateInfoDialog item={activeItem} storage={storage} onDismiss={handleDialogDismiss} onSubmit={handleSubmit} />
      ) : null}
    </>
  )
}
