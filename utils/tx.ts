import type { SignMessageArgs } from '@wagmi/core'
import { helpers, config, commons } from '@ckb-lumos/lumos'
import { hexToByteArray } from '@ckb-lumos/helpers/lib/utils'
import { bytes } from '@ckb-lumos/codec'
import { blockchain } from '@ckb-lumos/base'

export const signTransaction = async (
  skeletonObject: helpers.TransactionSkeletonObject,
  signer: (args?: SignMessageArgs | undefined) => Promise<`0x${string}`>
) => {
  const CONFIG = config.getConfig()
  let txSkeleton = helpers.objectToTransactionSkeleton(skeletonObject)
  txSkeleton = commons.omnilock.prepareSigningEntries(txSkeleton, { config: CONFIG })

  const { message } = txSkeleton.get('signingEntries').get(0) ?? {}
  if (!message) {
    throw new Error('Fail to get message to sign')
  }
  const rawMessage = hexToByteArray(message)

  let signedMessage: string = await signer({ message: new Uint8Array(rawMessage) })

  let v = Number.parseInt(signedMessage.slice(-2), 16)
  if (v >= 27) v -= 27
  signedMessage = '0x' + signedMessage.slice(2, -2) + v.toString(16).padStart(2, '0')

  const signedWitness = bytes.hexify(
    blockchain.WitnessArgs.pack({
      lock: commons.omnilock.OmnilockWitnessLock.pack({
        signature: bytes.bytify(signedMessage).buffer,
      }),
    })
  )

  txSkeleton = txSkeleton.update('witnesses', (witnesses) => witnesses.set(0, signedWitness))

  const signedTx = helpers.createTransactionFromSkeleton(txSkeleton)
  return signedTx
}
