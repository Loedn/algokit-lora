import { cn } from '@/features/common/utils'
import { useMemo } from 'react'
import { KeyRegTransaction, InnerKeyRegTransaction } from '../models'
import { DescriptionList } from '@/features/common/components/description-list'
import { AccountLink } from '@/features/accounts/components/account-link'
import { isDefined } from '@/utils/is-defined'
import { transactionSenderLabel } from './labels'

type Props = {
  transaction: KeyRegTransaction | InnerKeyRegTransaction
}

export const voteParticipationKeyLabel = 'Vote Participation Key'
export const selectionParticipationKeyLabel = 'Selection Participation Key'
export const voteFirstValidLabel = 'Vote First Valid'
export const voteLastValidLabel = 'Vote Last Valid'
export const voteKeyDilutionLabel = 'Vote Key Dilution'

export function KeyRegTransactionInfo({ transaction }: Props) {
  const items = useMemo(
    () =>
      [
        {
          dt: transactionSenderLabel,
          dd: <AccountLink address={transaction.sender} showCopyButton={true}></AccountLink>,
        },
        transaction.voteParticipationKey
          ? {
              dt: voteParticipationKeyLabel,
              dd: transaction.voteParticipationKey,
            }
          : undefined,
        transaction.selectionParticipationKey
          ? {
              dt: selectionParticipationKeyLabel,
              dd: transaction.selectionParticipationKey,
            }
          : undefined,
        transaction.voteFirstValid
          ? {
              dt: voteFirstValidLabel,
              dd: transaction.voteFirstValid,
            }
          : undefined,
        transaction.voteLastValid
          ? {
              dt: voteLastValidLabel,
              dd: transaction.voteLastValid,
            }
          : undefined,
        transaction.voteKeyDilution
          ? {
              dt: voteKeyDilutionLabel,
              dd: transaction.voteKeyDilution,
            }
          : undefined,
      ].filter(isDefined),
    [
      transaction.selectionParticipationKey,
      transaction.sender,
      transaction.voteFirstValid,
      transaction.voteKeyDilution,
      transaction.voteLastValid,
      transaction.voteParticipationKey,
    ]
  )

  return (
    <div className={cn('space-y-1')}>
      <h2>Key Registration</h2>
      <DescriptionList items={items} />
    </div>
  )
}
