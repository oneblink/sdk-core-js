import type { Field } from '@salesforce/types/partner'
import { ResourceDefinition } from './types/resource-definitions.js'
import { SubmissionEventTypes } from '@oneblink/types'

export type SalesforceFieldDefinition =
  ResourceDefinition<SubmissionEventTypes.SalesforceObjectRecordFieldResourceDefinition>

const generateCommonConfig = (fieldDefinition: Field) => {
  return {
    displayName: fieldDefinition.label,
    id: fieldDefinition.name,
    isRequired:
      fieldDefinition.createable &&
      !fieldDefinition.nillable &&
      !fieldDefinition.defaultedOnCreate,
    salesforceObjectRecordFieldName: fieldDefinition.name,
  }
}

export const generateSalesforceFieldDefinitions = (
  fieldDefinitions: Field[],
) => {
  return fieldDefinitions.reduce<SalesforceFieldDefinition[]>((memo, field) => {
    switch (field.type) {
      case 'string':
      case 'encryptedstring': {
        memo.push({
          type: 'TEXT_SINGLE_LINE',
          ...generateCommonConfig(field),
        })
        break
      }
      case 'textarea': {
        memo.push({
          type: 'TEXT_MULTI_LINE',
          ...generateCommonConfig(field),
        })
        break
      }
      case 'picklist': {
        memo.push({
          type: 'CHOICE_SINGLE',
          ...generateCommonConfig(field),
          choices:
            field.picklistValues?.map((v) => ({
              label: v.label ?? v.value,
              value: v.value,
            })) ?? [],
        })
        break
      }
      case 'combobox': {
        memo.push({
          type: 'CHOICE_MULTIPLE',
          ...generateCommonConfig(field),
          choices:
            field.picklistValues?.map((v) => ({
              label: v.label ?? v.value,
              value: v.value,
            })) ?? [],
        })
        break
      }
      case 'multipicklist': {
        memo.push({
          type: 'CHOICE_MULTIPLE',
          ...generateCommonConfig(field),
          choices:
            field.picklistValues?.map((v) => ({
              label: v.label ?? v.value,
              value: v.value,
            })) ?? [],
        })
        break
      }
      case 'boolean': {
        memo.push({
          type: 'BOOLEAN',
          ...generateCommonConfig(field),
        })
        break
      }
      case 'date': {
        memo.push({
          type: 'DATE',
          ...generateCommonConfig(field),
        })
        break
      }
      case 'datetime': {
        memo.push({
          type: 'DATETIME',
          ...generateCommonConfig(field),
        })
        break
      }
      case 'time': {
        memo.push({
          type: 'DATETIME',
          ...generateCommonConfig(field),
        })
        break
      }
      case 'email': {
        memo.push({
          type: 'EMAIL',
          ...generateCommonConfig(field),
        })
        break
      }
      case 'url': {
        memo.push({
          type: 'URL',
          ...generateCommonConfig(field),
        })
        break
      }
      case 'int':
      case 'long': {
        memo.push({
          type: 'INTEGER',
          ...generateCommonConfig(field),
        })
        break
      }
      case 'double':
      case 'currency': {
        memo.push({
          type: 'NUMBER',
          ...generateCommonConfig(field),
        })
        break
      }
      case 'percent': {
        memo.push({
          type: 'NUMBER',
          ...generateCommonConfig(field),
        })
        break
      }
      case 'floatarray':
      case 'textarray': {
        // TODO: Maybe support these two. Investigation required.
        break
      }

      case 'json':
      case 'reference':
      case 'id':
      case 'location':
      case 'datacategorygroupreference':
      case 'base64':
      case 'phone':
      case 'complexvalue':
      case 'anyType':
      case 'address': {
        // Unsupported Salesforce field types
        break
      }
    }
    return memo
  }, [])
}
