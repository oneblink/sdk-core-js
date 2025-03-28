import { ColumnDefinition } from '@microsoft/microsoft-graph-types'
import { SubmissionEventTypes } from '@oneblink/types'
import { ResourceDefinition } from './types/resource-definitions'

export type SharepointColumnResourceDefinition =
  ResourceDefinition<SubmissionEventTypes.SharepointColumnResourceDefinitionBase>

export function generateSharepointColumnResourceDefinitions(
  columnDefinitions: ColumnDefinition[],
) {
  return columnDefinitions.reduce<SharepointColumnResourceDefinition[]>(
    (memo, columnDefinition) => {
      if (
        !columnDefinition.readOnly &&
        columnDefinition.columnGroup !== '_Hidden' &&
        columnDefinition.name &&
        columnDefinition.id &&
        columnDefinition.displayName
      ) {
        if (columnDefinition.text?.allowMultipleLines) {
          memo.push({
            id: columnDefinition.id,
            isRequired: false,
            sharepointColumnDefinitionName: columnDefinition.name,
            displayName: columnDefinition.displayName,
            type: 'TEXT_MULTI_LINE',
          })
        } else if (columnDefinition.text) {
          memo.push({
            id: columnDefinition.id,
            isRequired: false,
            sharepointColumnDefinitionName: columnDefinition.name,
            displayName: columnDefinition.displayName,
            type: 'TEXT_SINGLE_LINE',
          })
        } else if (columnDefinition.choice?.choices?.length) {
          memo.push({
            id: columnDefinition.id,
            isRequired: false,
            sharepointColumnDefinitionName: columnDefinition.name,
            displayName: columnDefinition.displayName,
            type: 'CHOICE_SINGLE',
            choices: columnDefinition.choice.choices.map((choice) => ({
              label: choice,
              value: choice,
            })),
            checkIsFormElementSupported(
              formElementWithOptions,
              { formsAppEnvironmentId, formElementOptionsSets },
            ) {
              const formElementOptionsSetId =
                formElementWithOptions.dynamicOptionSetId
              return (
                !!formElementOptionsSetId &&
                formElementWithOptions.optionsType === 'DYNAMIC' &&
                formElementOptionsSets.some((formElementOptionsSet) => {
                  return (
                    formElementOptionsSet.type === 'SHAREPOINT_LIST_COLUMN' &&
                    formElementOptionsSet.environments.some(
                      (env) =>
                        env.formsAppEnvironmentId === formsAppEnvironmentId &&
                        env.sharepointColumn.id === columnDefinition.id,
                    )
                  )
                })
              )
            },
          })
        } else if (columnDefinition.dateTime?.format === 'dateOnly') {
          memo.push({
            id: columnDefinition.id,
            isRequired: false,
            sharepointColumnDefinitionName: columnDefinition.name,
            displayName: columnDefinition.displayName,
            type: 'DATE',
          })
        } else if (columnDefinition.dateTime) {
          memo.push({
            id: columnDefinition.id,
            isRequired: false,
            sharepointColumnDefinitionName: columnDefinition.name,
            displayName: columnDefinition.displayName,
            type: 'DATETIME',
          })
        } else if (columnDefinition.number) {
          memo.push({
            id: columnDefinition.id,
            isRequired: false,
            sharepointColumnDefinitionName: columnDefinition.name,
            displayName: columnDefinition.displayName,
            type: 'NUMBER',
          })
        } else if (columnDefinition.boolean) {
          memo.push({
            id: columnDefinition.id,
            isRequired: false,
            sharepointColumnDefinitionName: columnDefinition.name,
            displayName: columnDefinition.displayName,
            type: 'BOOLEAN',
          })
        }
      }

      return memo
    },
    [],
  )
}
