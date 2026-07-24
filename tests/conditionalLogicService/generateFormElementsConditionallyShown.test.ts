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
      enableSubmission: undefined,
    })
    expect(
      result.formElementsConditionallyShown.dependant?.type === 'formElement' &&
        result.formElementsConditionallyShown.dependant?.dependencyIsLoading,
    ).toBe(true)
  })

  test('Dependant option element will evaluate options as "show" when dynamic option dependencies have not loaded but nothing selected in dependency', () => {
    const result = generateFormElementsConditionallyShown({
      formElements: [dynamicOptionsElement, dependantOptionsElement],
      submission: {},
      enableSubmission: undefined,
    })
    expect(
      result.formElementsConditionallyShown.dependant?.type === 'formElement' &&
        result.formElementsConditionallyShown.dependant?.options?.length ===
          2 &&
        result.formElementsConditionallyShown.dependant?.dependencyIsLoading ===
          undefined,
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
      enableSubmission: undefined,
    })
    expect(result.formElementsConditionallyShown).toEqual({
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

  test('enables submission based on a nested form element predicate', () => {
    const nestedTextElement: FormElement = {
      id: 'nested-text-id',
      name: 'nested_text',
      label: 'Nested Text',
      type: 'text',
      required: false,
      conditionallyShow: false,
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
    }
    const nestedFormElement: FormElement = {
      id: 'nested-form-id',
      name: 'nested_form',
      type: 'form',
      formId: 1,
      conditionallyShow: false,
      elements: [nestedTextElement],
    }

    const enabledResult = generateFormElementsConditionallyShown({
      formElements: [nestedFormElement],
      submission: {
        nested_form: {
          nested_text: 'ready',
        },
      },
      enableSubmission: {
        requiresAllConditionalPredicates: true,
        conditionalPredicates: [
          {
            elementId: 'nested-form-id',
            type: 'FORM',
            predicate: {
              elementId: 'nested-text-id',
              type: 'VALUE',
              hasValue: true,
            },
          },
        ],
      },
    })

    expect(enabledResult.isSubmissionEnabled).toBe(true)
    expect(enabledResult.formElementsConditionallyShown.nested_form).toEqual({
      type: 'formElements',
      isHidden: false,
      formElements: {
        nested_text: {
          type: 'formElement',
          isHidden: false,
        },
      },
    })

    const disabledResult = generateFormElementsConditionallyShown({
      formElements: [nestedFormElement],
      submission: {
        nested_form: {},
      },
      enableSubmission: {
        requiresAllConditionalPredicates: true,
        conditionalPredicates: [
          {
            elementId: 'nested-form-id',
            type: 'FORM',
            predicate: {
              elementId: 'nested-text-id',
              type: 'VALUE',
              hasValue: true,
            },
          },
        ],
      },
    })

    expect(disabledResult.isSubmissionEnabled).toBe(false)
  })

  test('enables submission based on a repeatable set element predicate', () => {
    const nestedTextElement: FormElement = {
      id: 'rs-text-id',
      name: 'rs_text',
      label: 'Repeatable Set Text',
      type: 'text',
      required: false,
      conditionallyShow: false,
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
    }
    const repeatableSetElement: FormElement = {
      id: 'repeatable-set-id',
      name: 'repeatable_set',
      label: 'Repeatable Set',
      type: 'repeatableSet',
      conditionallyShow: false,
      readOnly: false,
      elements: [nestedTextElement],
    }

    const enabledResult = generateFormElementsConditionallyShown({
      formElements: [repeatableSetElement],
      submission: {
        repeatable_set: [{ rs_text: 'ready' }],
      },
      enableSubmission: {
        requiresAllConditionalPredicates: true,
        conditionalPredicates: [
          {
            elementId: 'repeatable-set-id',
            type: 'REPEATABLESET',
            repeatableSetPredicate: {
              elementId: 'rs-text-id',
              type: 'VALUE',
              hasValue: true,
            },
          },
        ],
      },
    })

    expect(enabledResult.isSubmissionEnabled).toBe(true)
    expect(enabledResult.formElementsConditionallyShown.repeatable_set).toEqual(
      {
        type: 'repeatableSet',
        isHidden: false,
        entries: {
          '0': {
            rs_text: {
              type: 'formElement',
              isHidden: false,
            },
          },
        },
      },
    )

    const disabledResult = generateFormElementsConditionallyShown({
      formElements: [repeatableSetElement],
      submission: {
        repeatable_set: [{}],
      },
      enableSubmission: {
        requiresAllConditionalPredicates: true,
        conditionalPredicates: [
          {
            elementId: 'repeatable-set-id',
            type: 'REPEATABLESET',
            repeatableSetPredicate: {
              elementId: 'rs-text-id',
              type: 'VALUE',
              hasValue: true,
            },
          },
        ],
      },
    })

    expect(disabledResult.isSubmissionEnabled).toBe(false)
  })

  test('enables submission based on an element nested in pages and sections', () => {
    const showPageElement: FormElement = {
      id: 'show-page-id',
      name: 'show_page',
      label: 'Show Page',
      type: 'boolean',
      required: false,
      conditionallyShow: false,
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
      defaultValue: false,
    }
    const nestedTextElement: FormElement = {
      id: 'page-section-text-id',
      name: 'page_section_text',
      label: 'Page Section Text',
      type: 'text',
      required: false,
      conditionallyShow: false,
      readOnly: false,
      isDataLookup: false,
      isElementLookup: false,
    }
    const sectionElement: FormElement = {
      id: 'section-id',
      type: 'section',
      label: 'Section',
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      isCollapsed: false,
      elements: [nestedTextElement],
    }
    const pageElement: FormElement = {
      id: 'page-id',
      type: 'page',
      label: 'Page',
      conditionallyShow: true,
      requiresAllConditionallyShowPredicates: false,
      conditionallyShowPredicates: [
        {
          elementId: 'show-page-id',
          type: 'VALUE',
          hasValue: true,
        },
      ],
      elements: [sectionElement],
    }
    const formElements = [showPageElement, pageElement]
    const enableSubmission = {
      requiresAllConditionalPredicates: true,
      conditionalPredicates: [
        {
          elementId: 'page-section-text-id',
          type: 'VALUE' as const,
          hasValue: true,
        },
      ],
    }

    const enabledResult = generateFormElementsConditionallyShown({
      formElements,
      submission: {
        show_page: true,
        page_section_text: 'ready',
      },
      enableSubmission,
    })

    expect(enabledResult.isSubmissionEnabled).toBe(true)
    expect(enabledResult.formElementsConditionallyShown).toEqual({
      show_page: {
        type: 'formElement',
        isHidden: false,
      },
      'page-id': {
        type: 'formElement',
        isHidden: false,
      },
      'section-id': {
        type: 'formElement',
        isHidden: false,
      },
      page_section_text: {
        type: 'formElement',
        isHidden: false,
      },
    })

    const emptyValueResult = generateFormElementsConditionallyShown({
      formElements,
      submission: {
        show_page: true,
      },
      enableSubmission,
    })

    expect(emptyValueResult.isSubmissionEnabled).toBe(false)

    const hiddenByPageResult = generateFormElementsConditionallyShown({
      formElements,
      submission: {
        page_section_text: 'ready',
      },
      enableSubmission,
    })

    expect(hiddenByPageResult.isSubmissionEnabled).toBe(false)
    expect(
      hiddenByPageResult.formElementsConditionallyShown.page_section_text,
    ).toEqual({
      type: 'formElement',
      isHidden: true,
    })
  })
})
