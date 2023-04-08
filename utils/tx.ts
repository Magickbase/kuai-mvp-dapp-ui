import { helpers, WitnessArgs } from '@ckb-lumos/lumos'
import { bytes } from '@ckb-lumos/codec'
import { blockchain } from '@ckb-lumos/base'

export const signTransaction = async (skeletonObject: helpers.TransactionSkeletonObject, signer: any) => {
  const txSkeleton = helpers.objectToTransactionSkeleton(skeletonObject)
  const tx = helpers.createTransactionFromSkeleton(txSkeleton)
  const signatures = await signer(tx)

  const inputCells = txSkeleton.get('inputs').toArray()
  const inputArgs = inputCells.map((cell) => cell.cellOutput.lock.args)
  for (let index = 0; index < signatures.length; index++) {
    const [lock, sig] = signatures[index]
    const newWitnessArgs: WitnessArgs = {
      lock: sig,
    }
    const newWitness = bytes.hexify(blockchain.WitnessArgs.pack(newWitnessArgs))
    const inputIndex = inputArgs.findIndex((arg) => arg === lock.args)
    tx.witnesses[inputIndex] = newWitness
  }
  return tx
}
