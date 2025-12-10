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
        case 'RICHTEXT':
        case 'MULTILINE':
          memo.push({
            type: 'TEXT_MULTI_LINE',
            ...generateCommonConfig(fieldDefinition),
          })
          break
        case 'RADIO':
        case 'DROPDOWN':
          if (fieldDefinition.options) {
            memo.push({
              type: 'CHOICE_SINGLE',
              ...generateCommonConfig(fieldDefinition),
              choices: fieldDefinition.options.map((option) => ({
                label: option,
                value: option,
              })),
            })
          }
          break
        case 'CHECKBOXES':
          if (fieldDefinition.options) {
            memo.push({
              type: 'CHOICE_MULTIPLE',
              ...generateCommonConfig(fieldDefinition),
              choices: fieldDefinition.options.map((option) => ({
                label: option,
                value: option,
              })),
            })
          }
          break
        case 'DATE':
        case 'DATETIME':
          memo.push({
            type: fieldDefinition.inputType,
            ...generateCommonConfig(fieldDefinition),
          })
          break
        case 'DECIMAL':
          memo.push({
            type: 'NUMBER',
            ...generateCommonConfig(fieldDefinition),
          })
          break
        case 'INTEGER':
          memo.push({
            type: 'INTEGER',
            ...generateCommonConfig(fieldDefinition),
          })
          break
        case 'SWITCH':
          memo.push({
            type: 'BOOLEAN',
            ...generateCommonConfig(fieldDefinition),
          })
          break
        case 'LINK':
          memo.push({
            type: 'URL',
            ...generateCommonConfig(fieldDefinition),
          })
          break
        case undefined:
          break
        default: {
          const n: never = fieldDefinition.inputType
          return n
        }
      }

      return memo
    },
    [],
  )
}
