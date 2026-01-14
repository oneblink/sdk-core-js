import { describe, expect, test } from 'vitest'
import { FormElement } from '@oneblink/types/typescript/forms'
import { generateFormElementsConditionallyShown } from '../../src/conditionalLogicService'

describe('generateFormElementsConditionallyShown', () => {
  const dynamicOptionsElement: FormElement = {
    name: 'dynamic',
    label: 'Radio',
    type: 'radio',
    required: false,
    id: '3ffbcd4d-d81e-4197-8ad6-179fccbb00b8',
    conditionallyShow: false,
    readOnly: false,
    buttons: false,
    optionsType: 'DYNAMIC',
    conditionallyShowOptions: false,
    isDataLookup: false,
    isElementLookup: false,
    dynamicOptionSetId: 123,
  }

  const dependantOptionsElement: FormElement = {
    name: 'dependant',
    label: 'Checkbox',
    type: 'checkboxes',
    required: false,
    id: 'bcfd48ca-01ea-47b8-af50-71c017773325',
    conditionallyShow: false,
    options: [
      {
        id: '310d340d-a778-4a66-b15b-9037d1689bad',
        label: 'Val1',
        value: 'Val1',
        attributes: [
          {
            elementId: '3ffbcd4d-d81e-4197-8ad6-179fccbb00b8',
            optionIds: ['option1'],
          },
        ],
      },
      {
        id: 'b576c455-43dc-49bb-ba76-c1e924b8a9bb',
        label: 'Val2',
        value: 'Val2',
        attributes: [
          {
            elementId: '3ffbcd4d-d81e-4197-8ad6-179fccbb00b8',
            optionIds: ['option2'],
          },
        ],
      },
    ],
    readOnly: false,
    buttons: false,
    optionsType: 'CUSTOM',
    conditionallyShowOptions: true,
    isDataLookup: false,
    isElementLookup: false,
    canToggleAll: false,
    conditionallyShowOptionsElementIds: [
      '3ffbcd4d-d81e-4197-8ad6-179fccbb00b8',
    ],
  }

  test('Dependant option element will evaluate options as "loading" when waiting for dynamic option dependencies to load and dependency has option selected', () => {
    const result = generateFormElementsConditionallyShown({
      formElements: [dynamicOptionsElement, dependantOptionsElement],
      submission: { dynamic: 'option1' },
    })
    expect(
      result.dependant?.type === 'formElement' &&
        result.dependant?.dependencyIsLoading,
    ).toBe(true)
  })

  test('Dependant option element will evaluate options as "show" when dynamic option dependencies have not loaded but nothing selected in dependency', () => {
    const result = generateFormElementsConditionallyShown({
      formElements: [dynamicOptionsElement, dependantOptionsElement],
      submission: {},
    })
    expect(
      result.dependant?.type === 'formElement' &&
        result.dependant?.options?.length === 2 &&
        result.dependant?.dependencyIsLoading === undefined,
    ).toBe(true)
  })

  test('element is shown when predicate element is in a repeatable set and the predicate element is also conditional based on another element in the same repeatable set', () => {
    const result = generateFormElementsConditionallyShown({
      formElements: [
        {
          id: '4f4a7b58-2010-44c2-bb76-58da221c64af',
          name: 'rs',
          label: 'repeatable set',
          type: 'repeatableSet',
          conditionallyShow: false,
          minSetEntries: 1,
          elements: [
            {
              id: 'e1806f93-10b4-488d-917a-7b4773b46dec',
              name: 'switch_one',
              label: 'Switch One (turn on to show switch 2)',
              type: 'boolean',
              required: false,
              conditionallyShow: false,
              readOnly: false,
              isDataLookup: false,
              isElementLookup: false,
              defaultValue: true,
            },
            {
              id: '279f670c-0880-49e0-811a-c88cc68fc5e1',
              name: 'switch_two',
              label: 'Switch 2 (turn on to show message two)',
              type: 'boolean',
              required: false,
              conditionallyShow: true,
              readOnly: false,
              isDataLookup: false,
              isElementLookup: false,
              defaultValue: true,
              requiresAllConditionallyShowPredicates: false,
              conditionallyShowPredicates: [
                {
                  elementId: 'e1806f93-10b4-488d-917a-7b4773b46dec',
                  type: 'VALUE',
                  hasValue: true,
                },
              ],
            },
          ],
          readOnly: false,
        },
        {
          id: 'cf677846-6ca4-4e87-ac06-1d0ec0324c56',
          name: 'Switch_2_message',
          label: 'Switch Two Message',
          type: 'heading',
          headingType: 2,
          conditionallyShow: true,
          requiresAllConditionallyShowPredicates: false,
          conditionallyShowPredicates: [
            {
              elementId: '4f4a7b58-2010-44c2-bb76-58da221c64af',
              type: 'REPEATABLESET',
              repeatableSetPredicate: {
                elementId: '279f670c-0880-49e0-811a-c88cc68fc5e1',
                type: 'VALUE',
                hasValue: true,
              },
            },
          ],
        },
      ],
      submission: {
        rs: [{ switch_one: true, switch_two: true }],
      },
    })
    expect(result).toEqual({
      rs: {
        type: 'repeatableSet',
        isHidden: false,
        entries: {
          '0': {
            switch_one: {
              isHidden: false,
              type: 'formElement',
            },
            switch_two: {
              isHidden: false,
              type: 'formElement',
            },
          },
        },
      },
      Switch_2_message: {
        type: 'formElement',
        isHidden: false,
      },
    })
  })
})
