import { Inter } from '@next/font/google'
import Wallet from '../wallet'
import styles from './index.module.scss'

const inter = Inter({ subsets: ['latin'] })

const Navbar = () => {
  return (
    <header className={`${styles.container} ${inter.className}`}>
      <div>Kuai MVP DApp</div>
      <div className={styles.items}>
        <span>search</span>
        <span>home</span>

        <span>
          <Wallet />
        </span>
      </div>
    </header>
  )
}

export default Navbar
