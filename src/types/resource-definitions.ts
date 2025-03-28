import { FormTypes } from '@oneblink/types'

export type ResourceDefinitionChoice = {
  value: string | number
  label: string
}

export type ResourceDefinition<T> = T & {
  id: string
  isRequired: boolean
  displayName: string
} & (
    | {
        type:
          | 'TEXT_SINGLE_LINE'
          | 'TEXT_MULTI_LINE'
          | 'EMAIL'
          | 'DATE'
          | 'DATETIME'
          | 'NUMBER'
          | 'BOOLEAN'
      }
    | {
        type: 'CHOICE_SINGLE' | 'CHOICE_MULTIPLE'
        choices: ResourceDefinitionChoice[]
        checkIsFormElementSupported: (
          formElementWithOptions: FormTypes.FormElementWithOptions,
          options: {
            formElementOptionsSets: FormTypes.FormElementOptionSet[]
            formsAppEnvironmentId: number
          },
        ) => boolean
      }
  )
