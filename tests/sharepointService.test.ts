import { generateSharepointColumnResourceDefinitions } from '../src/sharepointService'
import { ColumnDefinition } from '@microsoft/microsoft-graph-types'

describe('generateSharepointColumnResourceDefinitions', () => {
  it('should return an empty array when given an empty input', () => {
    expect(generateSharepointColumnResourceDefinitions([])).toEqual([])
  })

  it('should exclude columns that are readOnly', () => {
    const columns: ColumnDefinition[] = [
      { id: '1', name: 'Column1', displayName: 'Column 1', readOnly: true },
    ]
    expect(generateSharepointColumnResourceDefinitions(columns)).toEqual([])
  })

  it('should exclude columns that belong to the _Hidden group', () => {
    const columns: ColumnDefinition[] = [
      {
        id: '2',
        name: 'Column2',
        displayName: 'Column 2',
        columnGroup: '_Hidden',
      },
    ]
    expect(generateSharepointColumnResourceDefinitions(columns)).toEqual([])
  })

  it('should map TEXT_SINGLE_LINE columns correctly', () => {
    const columns: ColumnDefinition[] = [
      { id: '3', name: 'Column3', displayName: 'Column 3', text: {} },
    ]
    expect(generateSharepointColumnResourceDefinitions(columns)).toEqual([
      {
        id: '3',
        isRequired: false,
        sharepointColumnDefinitionName: 'Column3',
        displayName: 'Column 3',
        type: 'TEXT_SINGLE_LINE',
      },
    ])
  })

  it('should map TEXT_MULTI_LINE columns correctly', () => {
    const columns: ColumnDefinition[] = [
      {
        id: '4',
        name: 'Column4',
        displayName: 'Column 4',
        text: { allowMultipleLines: true },
      },
    ]
    expect(generateSharepointColumnResourceDefinitions(columns)).toEqual([
      {
        id: '4',
        isRequired: false,
        sharepointColumnDefinitionName: 'Column4',
        displayName: 'Column 4',
        type: 'TEXT_MULTI_LINE',
      },
    ])
  })

  it('should map CHOICE_SINGLE columns correctly', () => {
    const columns: ColumnDefinition[] = [
      {
        id: '5',
        name: 'Column5',
        displayName: 'Column 5',
        choice: { choices: ['A', 'B'] },
      },
    ]
    expect(generateSharepointColumnResourceDefinitions(columns)).toEqual([
      {
        id: '5',
        isRequired: false,
        sharepointColumnDefinitionName: 'Column5',
        displayName: 'Column 5',
        type: 'CHOICE_SINGLE',
        choices: [
          { label: 'A', value: 'A' },
          { label: 'B', value: 'B' },
        ],
      },
    ])
  })

  it('should map DATE columns correctly', () => {
    const columns: ColumnDefinition[] = [
      {
        id: '6',
        name: 'Column6',
        displayName: 'Column 6',
        dateTime: { format: 'dateOnly' },
      },
    ]
    expect(generateSharepointColumnResourceDefinitions(columns)).toEqual([
      {
        id: '6',
        isRequired: false,
        sharepointColumnDefinitionName: 'Column6',
        displayName: 'Column 6',
        type: 'DATE',
      },
    ])
  })

  it('should map DATETIME columns correctly', () => {
    const columns: ColumnDefinition[] = [
      { id: '7', name: 'Column7', displayName: 'Column 7', dateTime: {} },
    ]
    expect(generateSharepointColumnResourceDefinitions(columns)).toEqual([
      {
        id: '7',
        isRequired: false,
        sharepointColumnDefinitionName: 'Column7',
        displayName: 'Column 7',
        type: 'DATETIME',
      },
    ])
  })

  it('should map NUMBER columns correctly', () => {
    const columns: ColumnDefinition[] = [
      { id: '8', name: 'Column8', displayName: 'Column 8', number: {} },
    ]
    expect(generateSharepointColumnResourceDefinitions(columns)).toEqual([
      {
        id: '8',
        isRequired: false,
        sharepointColumnDefinitionName: 'Column8',
        displayName: 'Column 8',
        type: 'NUMBER',
      },
    ])
  })

  it('should map BOOLEAN columns correctly', () => {
    const columns: ColumnDefinition[] = [
      { id: '9', name: 'Column9', displayName: 'Column 9', boolean: {} },
    ]
    expect(generateSharepointColumnResourceDefinitions(columns)).toEqual([
      {
        id: '9',
        isRequired: false,
        sharepointColumnDefinitionName: 'Column9',
        displayName: 'Column 9',
        type: 'BOOLEAN',
      },
    ])
  })
})
