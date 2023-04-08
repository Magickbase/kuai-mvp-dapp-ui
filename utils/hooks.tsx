import { useRouter } from 'next/router'
import { useNexus } from './nexus'

export const useIsOwner = () => {
  const router = useRouter()
  const { address } = useNexus()
  return router.query.address === address
}
