import type { ProfilePrimaryKey, AddressPrimaryKey, DwebPrimaryKey, StorageItem } from '../utils/constants'
import { useCallback, useEffect, useState } from 'react'
import Head from 'next/head'
import { Inter } from '@next/font/google'
import Header from '../components/header'
import Overview from '../components/overview'
import Section from '../components/section'
import UpdateInfoDialog, { Item } from '../components/updateInfoDialog'
import { mockAccount } from '../utils/mock'
import styles from './index.module.scss'
import { connectToMetaMask, Ethereum } from '../utils/linkMetamask'

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
  const [isEditable, setIsEditable] = useState(false)
  const [account, _setAccount] = useState<Account>(mockAccount)

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
    setIsEditable((is) => !is)
  }

  const [omnilockAddress, setOmnilockAddress]= useState('')
  const connectWallet = useCallback(() => {
    connectToMetaMask().then(setOmnilockAddress)
  }, [setOmnilockAddress])
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Ethereum.ethereum.selectedAddress) connectWallet();
      Ethereum.ethereum.addListener("accountsChanged", connectWallet);
    }, 100)
    return () => clearTimeout(timer)
  }, []);
  
  return (
    <>
      <Head>
        <title>MVP DApp for Kuai</title>
        <meta name="description" content="MVP DApp to verify abstract of cell" />
        <meta name="referrer" content="no-referrer" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Header connectWallet={connectWallet} />

      <main className={inter.className} onClick={handleRecordClick}>
        <div className={styles.sections} data-is-editable={isEditable}>
          <Overview
            name={account.name}
            avatar={account.storage.profile.avatar?.value}
            description={account.storage.profile.description?.value}
            onEditBtnClick={handleEditBtnClick}
            isEditable={isEditable}
            omnilockAddress={omnilockAddress}
          />
          {sections.map((s) =>
            s.namespace in account.storage ? (
              <Section {...s} records={account.storage[s.namespace]} key={s.namespace} />
            ) : null
          )}
          <Section namespace="permissions" records={mockAccount.permissions} />
        </div>
      </main>
      {activeItem && account?.storage ? (
        <UpdateInfoDialog item={activeItem} storage={account.storage} onDismiss={handleDialogDismiss} />
      ) : null}
    </>
  )
}
