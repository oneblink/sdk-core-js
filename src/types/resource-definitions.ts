export type ResourceDefinitionChoice = {
  value: string | number
  label: string
}

type ResourceDefinitionBase = {
  id: string
  isRequired: boolean
  displayName: string
}

export interface ResourceDefinitionWithChoices {
  type: 'CHOICE_SINGLE' | 'CHOICE_MULTIPLE'
  choices: ResourceDefinitionChoice[]
}

export type ResourceDefinition<T> = T &
  ResourceDefinitionBase &
  (
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
    | ResourceDefinitionWithChoices
  )
