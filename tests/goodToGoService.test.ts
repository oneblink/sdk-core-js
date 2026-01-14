import { describe, expect, it } from 'vitest'
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

  it('should use field name if label is not provided', () => {
    const fields: GetFieldResponse[] = [
      {
        id: 'a',
        name: 'text',
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
        displayName: 'text',
      },
    ])
  })
})
