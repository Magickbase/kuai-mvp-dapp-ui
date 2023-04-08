import { useContext } from 'react'
import { NexusContext } from '../../utils/nexus'
import styles from './index.module.scss'

const Wallet = () => {
  const { connect, status, address } = useContext(NexusContext)

  const handleConnect = () => {
    connect()
  }

  if (status === 'connecting') {
    return <span className={styles.container}>Connecting</span>
  }

  if (status === 'disconnected') {
    return (
      <button onClick={handleConnect} className={styles.container}>
        Connect
      </button>
    )
  }

  if (!address) {
    return <span className={styles.container}>Unknown</span>
  }

  return <span className={styles.container}>{`${address.slice(0, 6)}...${address.slice(-6)}`}</span>
}

export default Wallet
