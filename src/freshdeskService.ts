import { FreshdeskTypes, SubmissionEventTypes } from '@oneblink/types'
import {
  ResourceDefinition,
  ResourceDefinitionChoice,
} from './types/resource-definitions'

export const multilineFieldType = 'custom_paragraph'
export const emailFieldType = 'default_requester'
export const textFieldTypes = [
  multilineFieldType,
  'custom_text',
  'default_subject',
  emailFieldType,
]

export const numberFieldTypes = ['custom_number', 'custom_decimal']

export const dateFieldType = 'custom_date'
export const checkboxFieldType = 'custom_checkbox'
export const choiceFieldTypes = [
  'custom_dropdown',
  checkboxFieldType,
  'default_priority',
  'default_status',
  'default_source',
  'default_ticket_type',
  'default_agent',
  'default_group',
]

export type FreshdeskFieldDefinition =
  | ResourceDefinition<SubmissionEventTypes.BaseFreshdeskSubmissionEventFieldMapping>
  | FreshdeskDependentField

export type FreshdeskFieldCategory = ResourceDefinitionChoice & {
  subCategories: Array<
    ResourceDefinitionChoice & {
      items: Array<ResourceDefinitionChoice>
    }
  >
}

export type FreshdeskDependentField = {
  type: 'DEPENDENT_FIELD'
  id: string
  isRequired: boolean
  displayName: string
  freshdeskFieldName: string
  choices: FreshdeskFieldCategory[]
}

export function generateFreshdeskTicketFieldDefinitions(
  fields: FreshdeskTypes.FreshdeskField[],
) {
  return fields.reduce<FreshdeskFieldDefinition[]>((memo, freshdeskField) => {
    const isCheckboxField = freshdeskField.type === checkboxFieldType
    const isRequired =
      freshdeskField.required_for_customers ||
      freshdeskField.name === 'ticket_type'
    const isTextField = textFieldTypes.includes(freshdeskField.type)
    const isMultilineTextField = freshdeskField.type === multilineFieldType
    const isEmailField = freshdeskField.type === emailFieldType
    const isDateField = freshdeskField.type === dateFieldType
    const isNumberField = numberFieldTypes.includes(freshdeskField.type)
    const isChoiceField = choiceFieldTypes.includes(freshdeskField.type)

    const baseField = {
      id: freshdeskField.id.toString(),
      displayName: freshdeskField.label_for_customers,
      isRequired,
      freshdeskFieldName: freshdeskField.name,
    }
    if (isCheckboxField) {
      memo.push({
        type: 'BOOLEAN',
        ...baseField,
      })
    } else if (isDateField) {
      memo.push({
        type: 'DATE',
        ...baseField,
      })
    } else if (isNumberField) {
      memo.push({
        type: 'NUMBER',
        ...baseField,
      })
    } else if (isEmailField) {
      memo.push({
        type: 'EMAIL',
        ...baseField,
      })
    } else if (isMultilineTextField) {
      memo.push({
        type: 'TEXT_MULTI_LINE',
        ...baseField,
      })
    } else if (isTextField) {
      memo.push({
        type: 'TEXT_SINGLE_LINE',
        ...baseField,
      })
    } else if (
      (freshdeskField.options || freshdeskField.choices) &&
      isChoiceField
    ) {
      memo.push({
        type: 'CHOICE_SINGLE',
        ...baseField,
        choices: transformFreshdeskChoicesIntoOptions(
          freshdeskField.options,
          freshdeskField.choices,
        ),
        checkIsFormElementSupported(formElementWithOptions) {
          if (freshdeskField.type === 'nested_field') {
            return false
          }

          return (
            formElementWithOptions.freshdeskFieldName === freshdeskField.name
          )
        },
      })
    } else if (
      freshdeskField.type === 'nested_field' &&
      (freshdeskField.options?.length || freshdeskField.choices)
    ) {
      const choices = transformFreshdeskChoicesIntoOptions(
        freshdeskField.options,
        freshdeskField.choices,
      ).reduce<FreshdeskFieldCategory[]>((categoriesMemo, category) => {
        const subCategories = category.options?.reduce<
          FreshdeskFieldCategory['subCategories']
        >((subCategoriesMemo, subCategory) => {
          if (subCategory.options?.length) {
            subCategoriesMemo.push({
              value: subCategory.value,
              label: subCategory.label,
              items: subCategory.options.map(({ value, label }) => ({
                value,
                label,
              })),
            })
          }

          return subCategoriesMemo
        }, [])

        if (subCategories?.length) {
          categoriesMemo.push({
            value: category.value,
            label: category.label,
            subCategories,
          })
        }

        return categoriesMemo
      }, [])

      if (choices.length) {
        memo.push({
          type: 'DEPENDENT_FIELD',
          ...baseField,
          choices,
        })
      }
    }

    return memo
  }, [])
}

/**
 * This internal function is used to decide if `options` or `choices` should be
 * used. If there is no `options` parameter passed in, it will use the `choices`
 * configuration to create the options required for the options required.
 *
 * @param options
 * @param choices
 * @returns
 */
function transformFreshdeskChoicesIntoOptions(
  options: FreshdeskTypes.FreshdeskFieldOption[] | undefined,
  choices: FreshdeskTypes.FreshdeskField['choices'],
): FreshdeskTypes.FreshdeskFieldOption[] {
  if (options) {
    return options
  }
  if (choices) {
    if (Array.isArray(choices)) {
      return choices.map((choice) => ({
        label: choice,
        value: choice,
      }))
    } else if (typeof choices === 'object') {
      return Object.entries(choices).map(([key, value]) => {
        if (typeof value === 'number') {
          return {
            label: key,
            value,
          }
        } else if (Array.isArray(value)) {
          return {
            label: value[0],
            value: parseInt(key),
          }
        }
        return {
          label: key,
          value: key,
          options: Object.entries(value).map(([subCategory, items]) => ({
            label: subCategory,
            value: subCategory,
            options: items.map((item) => ({
              label: item,
              value: item,
            })),
          })),
        }
      })
    }
  }
  return []
}
