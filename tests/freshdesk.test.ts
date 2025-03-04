import {
  generateFreshdeskTicketFieldDefinitions,
  setFreshdeskFieldOptions,
} from '../src/freshdeskService'
import { FreshdeskTypes } from '@oneblink/types'
import freshdeskFieldFixture from './freshdeskFieldsFixture.json'

describe('generateFreshdeskTicketFieldDefinitions', () => {
  it('should return an empty array when given an empty input', () => {
    expect(generateFreshdeskTicketFieldDefinitions([])).toEqual([])
  })

  it('should map TEXT_SINGLE_LINE fields correctly', () => {
    const fields: FreshdeskTypes.FreshdeskField[] = [
      //@ts-expect-error Not filling in all properties
      {
        id: 1,
        name: 'Field1',
        type: 'custom_text',
        label_for_customers: 'Field 1',
        required_for_customers: true,
      },
    ]
    expect(generateFreshdeskTicketFieldDefinitions(fields)).toEqual([
      {
        displayName: 'Field 1',
        freshdeskFieldName: 'Field1',
        id: '1',
        isRequired: true,
        type: 'TEXT_SINGLE_LINE',
      },
    ])
  })

  it('should map TEXT_MULTI_LINE fields correctly', () => {
    const fields: FreshdeskTypes.FreshdeskField[] = [
      //@ts-expect-error Not filling in all properties
      {
        id: 2,
        name: 'Field2',
        type: 'custom_paragraph',
        label_for_customers: 'Field 2',
        required_for_customers: true,
      },
    ]
    expect(generateFreshdeskTicketFieldDefinitions(fields)).toEqual([
      {
        displayName: 'Field 2',
        freshdeskFieldName: 'Field2',
        id: '2',
        isRequired: true,
        type: 'TEXT_MULTI_LINE',
      },
    ])
  })

  it('should map CHOICE_SINGLE fields correctly', () => {
    const fields: FreshdeskTypes.FreshdeskField[] = [
      //@ts-expect-error Not filling in all properties
      {
        id: 3,
        name: 'Field3',
        type: 'custom_dropdown',
        label_for_customers: 'Field 3',
        required_for_customers: true,
        options: [
          { label: 'option 1', value: 'value 1' },
          { label: 'option 2', value: 'value 2' },
        ],
      },
    ]
    expect(generateFreshdeskTicketFieldDefinitions(fields)).toEqual([
      {
        checkIsFormElementSupported: expect.any(Function),
        choices: [
          {
            label: 'option 1',
            value: 'value 1',
          },
          {
            label: 'option 2',
            value: 'value 2',
          },
        ],
        displayName: 'Field 3',
        freshdeskFieldName: 'Field3',
        id: '3',
        isRequired: true,
        type: 'CHOICE_SINGLE',
      },
    ])
  })

  it('should map DATE fields correctly', () => {
    const fields: FreshdeskTypes.FreshdeskField[] = [
      //@ts-expect-error Not filling in all properties
      {
        id: 4,
        name: 'Field4',
        type: 'custom_date',
        label_for_customers: 'Field 4',
        required_for_customers: true,
      },
    ]
    expect(generateFreshdeskTicketFieldDefinitions(fields)).toEqual([
      {
        displayName: 'Field 4',
        freshdeskFieldName: 'Field4',
        id: '4',
        isRequired: true,
        type: 'DATE',
      },
    ])
  })

  it('should map NUMBER fields correctly', () => {
    const fields: FreshdeskTypes.FreshdeskField[] = [
      //@ts-expect-error Not filling in all properties
      {
        id: 5,
        name: 'Field5',
        type: 'custom_number',
        label_for_customers: 'Field 5',
        required_for_customers: true,
      },
    ]
    expect(generateFreshdeskTicketFieldDefinitions(fields)).toEqual([
      {
        displayName: 'Field 5',
        freshdeskFieldName: 'Field5',
        id: '5',
        isRequired: true,
        type: 'NUMBER',
      },
    ])
  })

  it('should map BOOLEAN fields correctly', () => {
    const fields: FreshdeskTypes.FreshdeskField[] = [
      //@ts-expect-error Not filling in all properties
      {
        id: 6,
        name: 'Field6',
        type: 'custom_checkbox',
        label_for_customers: 'Field 6',
        required_for_customers: true,
      },
    ]
    expect(generateFreshdeskTicketFieldDefinitions(fields)).toEqual([
      {
        displayName: 'Field 6',
        freshdeskFieldName: 'Field6',
        id: '6',
        isRequired: true,
        type: 'BOOLEAN',
      },
    ])
  })

  it('should map EMAIL fields correctly', () => {
    const fields: FreshdeskTypes.FreshdeskField[] = [
      //@ts-expect-error Not filling in all properties
      {
        id: 7,
        name: 'Field7',
        type: 'default_requester',
        label_for_customers: 'Field 7',
        required_for_customers: true,
      },
    ]
    expect(generateFreshdeskTicketFieldDefinitions(fields)).toEqual([
      {
        displayName: 'Field 7',
        freshdeskFieldName: 'Field7',
        id: '7',
        isRequired: true,
        type: 'EMAIL',
      },
    ])
  })

  it('should map DEPENDENT_FIELD fields correctly', () => {
    const fields: FreshdeskTypes.FreshdeskField[] = [
      //@ts-expect-error Not filling in all properties
      {
        id: 8,
        name: 'Field8',
        type: 'nested_field',
        label_for_customers: 'Field 8',
        required_for_customers: true,
        options: [
          {
            label: 'AUS',
            value: 'AUS',
            options: [
              {
                label: 'NSW',
                value: 'NSW',
                options: [
                  {
                    label: 'Newcastle',
                    value: 'Newcastle',
                  },
                  {
                    label: 'Gosford',
                    value: 'Gosford',
                  },
                ],
              },
            ],
          },
        ],
      },
    ]
    expect(generateFreshdeskTicketFieldDefinitions(fields)).toEqual([
      {
        choices: [
          {
            label: 'AUS',
            subCategories: [
              {
                items: [
                  {
                    label: 'Newcastle',
                    value: 'Newcastle',
                  },
                  {
                    label: 'Gosford',
                    value: 'Gosford',
                  },
                ],
                label: 'NSW',
                value: 'NSW',
              },
            ],
            value: 'AUS',
          },
        ],
        displayName: 'Field 8',
        freshdeskFieldName: 'Field8',
        id: '8',
        isRequired: true,
        type: 'DEPENDENT_FIELD',
      },
    ])
  })

  it('should return the correct value when choices is used over options', () => {
    const fields: FreshdeskTypes.FreshdeskField[] = [
      //@ts-expect-error Not filling in all properties
      {
        id: 3,
        name: 'Field3',
        type: 'custom_dropdown',
        label_for_customers: 'Field 3',
        required_for_customers: true,
        choices: ['value 1', 'value 2'],
      },
    ]
    expect(generateFreshdeskTicketFieldDefinitions(fields)).toEqual([
      {
        checkIsFormElementSupported: expect.any(Function),
        choices: [
          {
            label: 'value 1',
            value: 'value 1',
          },
          {
            label: 'value 2',
            value: 'value 2',
          },
        ],
        displayName: 'Field 3',
        freshdeskFieldName: 'Field3',
        id: '3',
        isRequired: true,
        type: 'CHOICE_SINGLE',
      },
    ])
  })

  it('should map DEPENDENT_FIELD field correctly when choices is used', () => {
    const fields: FreshdeskTypes.FreshdeskField[] = [
      //@ts-expect-error Not filling in all properties
      {
        id: 8,
        name: 'Field8',
        type: 'nested_field',
        label_for_customers: 'Field 8',
        required_for_customers: true,
        choices: {
          AUS: {
            NSW: ['Sydney', 'Gosford'],
            QLD: ['Brisbane', 'Gold Coast'],
          },
          USA: {
            Texas: ['Austin', 'Dallas'],
            Kansas: ['Kansas City', 'Manhattan'],
          },
        },
      },
    ]
    expect(generateFreshdeskTicketFieldDefinitions(fields)).toMatchSnapshot()
  })
})

describe('setFreshdeskFieldOptions', () => {
  it('should transform all of the fields correctly', () => {
    const freshdeskFields = setFreshdeskFieldOptions(
      freshdeskFieldFixture as FreshdeskTypes.FreshdeskField[],
    )
    expect(freshdeskFields).toMatchSnapshot()

    expect(setFreshdeskFieldOptions(freshdeskFields)).toMatchSnapshot()
  })
})
