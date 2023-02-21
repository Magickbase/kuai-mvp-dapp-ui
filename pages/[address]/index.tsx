import type { ProfilePrimaryKey, AddressPrimaryKey, DwebPrimaryKey, StorageItem } from '../../utils/constants'
import { useState } from 'react'
import { Inter } from '@next/font/google'
import { useSignMessage } from 'wagmi'
import Overview from '../../components/overview'
import Section from '../../components/section'
import UpdateInfoDialog, { Item } from '../../components/updateInfoDialog'
import { useAddresses, useIsOwner } from '../../utils/hooks'
import { mockAccount } from '../../utils/mock'
import styles from './address.module.scss'

const inter = Inter({ subsets: ['latin'] })

interface Account {
  name: string
  storage: {
    profile: StorageItem<ProfilePrimaryKey>
    addresses: StorageItem<AddressPrimaryKey>
    custom: StorageItem<string>
    dweb: StorageItem<DwebPrimaryKey>
  }
  permissions: StorageItem<'owner' | 'manager'>
}

const sections: Array<{ namespace: keyof Account['storage'] }> = [
  { namespace: 'profile' },
  { namespace: 'addresses' },
  { namespace: 'custom' },
  { namespace: 'dweb' },
]

export default function Home() {
  const [activeItem, setActiveItem] = useState<Item | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [account, _setAccount] = useState<Account>(mockAccount)
  const isOwner = useIsOwner()
  const { signMessageAsync } = useSignMessage()

  const addresses = useAddresses()

  const handleSubmit = async (newValue: any) => {
    console.log(newValue)
    // send signed to ckb node
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
          console.log(`remove ${namespace}.${field}`)
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
            name={account.name}
            avatar={account.storage.profile.avatar?.value}
            description={account.storage.profile.description?.value}
            onEditBtnClick={handleEditBtnClick}
            isEditable={isOwner && isEditMode}
          />
          {sections.map((s) =>
            s.namespace in account.storage ? (
              <Section {...s} records={account.storage[s.namespace]} key={s.namespace} />
            ) : null
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
      {activeItem && account?.storage ? (
        <UpdateInfoDialog
          item={activeItem}
          storage={account.storage}
          onDismiss={handleDialogDismiss}
          onSubmit={handleSubmit}
        />
      ) : null}
    </>
  )
}
