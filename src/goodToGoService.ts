import { GetFieldResponse } from '@spotto/contract'
import { SubmissionEventTypes } from '@oneblink/types'

import { ResourceDefinition } from './types/resource-definitions'

export type GoodToGoFieldResourceDefinition =
  ResourceDefinition<SubmissionEventTypes.GoodToGoUpdateAssetResourceDefinition>

function generateCommonConfig(fieldDefinition: GetFieldResponse) {
  return {
    id: fieldDefinition.id,
    goodToGoCustomFieldName: fieldDefinition.name,
    isRequired: !!fieldDefinition.required,
    displayName: fieldDefinition.label ?? fieldDefinition.name,
  }
}

export function generateGoodToGoFieldResourceDefinitions(
  fieldDefinitions: GetFieldResponse[],
) {
  return fieldDefinitions.reduce<GoodToGoFieldResourceDefinition[]>(
    (memo, fieldDefinition) => {
      switch (fieldDefinition.inputType) {
        case 'SINGLELINE':
          memo.push({
            type: 'TEXT_SINGLE_LINE',
            ...generateCommonConfig(fieldDefinition),
          })
          break
      }

      return memo
    },
    [],
  )
}
