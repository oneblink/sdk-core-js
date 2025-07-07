import { GetFieldResponse } from '@spotto/contract'
import { generateGoodToGoFieldResourceDefinitions } from '../src/goodToGoService'

describe('generateGoodToGoFieldResourceDefinitions', () => {
  it('should map TEXT_SINGLE_LINE fields correctly', () => {
    const fields: GetFieldResponse[] = [
      {
        id: 'a',
        name: 'text',
        label: 'Text',
        required: true,
        dataType: 'STRING',
        inputType: 'SINGLELINE',
      },
    ]

    expect(generateGoodToGoFieldResourceDefinitions(fields)).toEqual([
      {
        type: 'TEXT_SINGLE_LINE',
        id: 'a',
        goodToGoCustomFieldName: 'text',
        isRequired: true,
        displayName: 'Text',
      },
    ])
  })

  it('should map TEXT_MULTI_LINE fields correctly', () => {
    const fields: GetFieldResponse[] = [
      {
        id: 'b',
        name: 'textarea',
        label: 'Textarea',
        required: true,
        dataType: 'STRING',
        inputType: 'MULTILINE',
      },
    ]

    expect(generateGoodToGoFieldResourceDefinitions(fields)).toEqual([
      {
        type: 'TEXT_MULTI_LINE',
        id: 'b',
        goodToGoCustomFieldName: 'textarea',
        isRequired: true,
        displayName: 'Textarea',
      },
    ])
  })

  it('should map DATE fields correctly', () => {
    const fields: GetFieldResponse[] = [
      {
        id: 'c',
        name: 'date',
        label: 'Date',
        dataType: 'DATE',
      },
    ]

    expect(generateGoodToGoFieldResourceDefinitions(fields)).toEqual([
      {
        type: 'DATE',
        id: 'c',
        goodToGoCustomFieldName: 'date',
        displayName: 'Date',
        isRequired: false,
      },
    ])
  })

  it('should skip fields that are not yet supported', () => {
    const fields: GetFieldResponse[] = [
      {
        id: 'd',
        name: 'checkbox',
        label: 'Checkbox',
        dataType: 'STRING',
        inputType: 'CHECKBOXES',
      },
    ]

    expect(generateGoodToGoFieldResourceDefinitions(fields)).toEqual([])
  })

  it('should map a mix of fields correctly', () => {
    const fields: GetFieldResponse[] = [
      {
        id: 'a',
        name: 'text',
        label: 'Text',
        required: true,
        dataType: 'STRING',
        inputType: 'SINGLELINE',
      },
      {
        id: 'b',
        name: 'textarea',
        label: 'Textarea',
        required: true,
        dataType: 'STRING',
        inputType: 'MULTILINE',
      },
      {
        id: 'c',
        name: 'date',
        label: 'Date',
        dataType: 'DATE',
      },
    ]

    expect(generateGoodToGoFieldResourceDefinitions(fields)).toEqual([
      {
        type: 'TEXT_SINGLE_LINE',
        id: 'a',
        goodToGoCustomFieldName: 'text',
        isRequired: true,
        displayName: 'Text',
      },
      {
        type: 'TEXT_MULTI_LINE',
        id: 'b',
        goodToGoCustomFieldName: 'textarea',
        displayName: 'Textarea',
        isRequired: true,
      },
      {
        type: 'DATE',
        id: 'c',
        goodToGoCustomFieldName: 'date',
        displayName: 'Date',
        isRequired: false,
      },
    ])
  })

  it('should use field name if label is not provided', () => {
    const fields: GetFieldResponse[] = [
      {
        id: 'a',
        name: 'text',
        required: true,
        dataType: 'STRING',
        inputType: 'SINGLELINE',
      },
      {
        id: 'b',
        name: 'textarea',
        required: true,
        dataType: 'STRING',
        inputType: 'MULTILINE',
      },
      {
        id: 'c',
        name: 'date',
        dataType: 'DATE',
      },
    ]

    expect(generateGoodToGoFieldResourceDefinitions(fields)).toEqual([
      {
        type: 'TEXT_SINGLE_LINE',
        id: 'a',
        goodToGoCustomFieldName: 'text',
        isRequired: true,
        displayName: 'text',
      },
      {
        type: 'TEXT_MULTI_LINE',
        id: 'b',
        goodToGoCustomFieldName: 'textarea',
        displayName: 'textarea',
        isRequired: true,
      },
      {
        type: 'DATE',
        id: 'c',
        goodToGoCustomFieldName: 'date',
        displayName: 'date',
        isRequired: false,
      },
    ])
  })
})
