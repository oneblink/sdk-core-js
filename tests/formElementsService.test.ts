import { describe, expect, test } from 'vitest'
import _ from 'lodash'
import { FormTypes, SubmissionTypes } from '@oneblink/types'
import {
  findFormElement,
  injectFormElementsIntoForm,
} from '../src/formElementsService'
import { getRootElementValueById } from '../src/submissionService'
import forms from './inject-forms-fixtures/valid-forms.json'
import invalidForms from './inject-forms-fixtures/invalid-forms.json'

describe('getRootElementValueById()', () => {
  const createTextElement = (name: string) => {
    const textElement: FormTypes.TextElement = {
      id: name,
      name,
      type: 'text',
      conditionallyShow: false,
      isDataLookup: false,
      isElementLookup: false,
      label: 'Text',
      readOnly: false,
      required: false,
      requiresAllConditionallyShowPredicates: false,
    }
    return textElement
  }
  const createNumberElement = (name: string) => {
    const numberElement: FormTypes.NumberElement = {
      id: name,
      name,
      type: 'number',
      conditionallyShow: false,
      isDataLookup: false,
      isElementLookup: false,
      label: 'Number',
      readOnly: false,
      required: false,
      requiresAllConditionallyShowPredicates: false,
      isSlider: false,
    }
    return numberElement
  }
  const createSectionElement = (
    id: string,
    elements: FormTypes.FormElement[],
  ) => {
    const sectionsElement: FormTypes.SectionElement = {
      id,
      type: 'section',
      conditionallyShow: false,
      label: 'Section',
      requiresAllConditionallyShowPredicates: false,
      elements,
      isCollapsed: false,
    }
    return sectionsElement
  }
  const createPageElement = (
    id: string,
    elements: FormTypes.FormElement[],
  ): FormTypes.PageElement => {
    return {
      id,
      label: id,
      type: 'page',
      elements,
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
    }
  }
  const createFormElement = (
    id: string,
    elements: FormTypes.FormElement[],
  ): FormTypes.FormFormElement => {
    return {
      id,
      name: id,
      type: 'form',
      elements,
      conditionallyShow: false,
      formId: 1,
      requiresAllConditionallyShowPredicates: false,
    }
  }
  const elements: FormTypes.FormElement[] = [
    createPageElement('Page1', [
      createTextElement('A'),
      createSectionElement('B', [
        createTextElement('B_A'),
        createSectionElement('B_B', [
          createTextElement('B_B_A'),
          createTextElement('B_B_B'),
          createNumberElement('B_B_C'),
        ]),
        createSectionElement('B_C', [
          createNumberElement('B_C_A'),
          createTextElement('B_C_B'),
          createSectionElement('B_C_C', [createTextElement('B_C_C_A')]),
        ]),
      ]),
      createTextElement('C'),
      createNumberElement('D'),
      createFormElement('E', [
        createFormElement('E_A', [createTextElement('E_A_A')]),
      ]),
    ]),
    createPageElement('Page2', [createTextElement('Page2Text')]),
  ]
  const submission: SubmissionTypes.S3SubmissionData['submission'] = {
    A: 'AText',
    B_A: 'B_AText',
    B_B_A: 'B_B_AText',
    B_B_B: 'B_B_BText',
    B_B_C: 123,
    B_C_A: 0,
    B_C_B: 'B_C_BText',
    B_C_C_A: 'B_C_C_AText',
    C: 'CText',
    D: 5,
    Page2Text: 'Page 2 Text',
    E: {
      E_A: {
        E_A_A: 'Nested Form Text',
      },
    },
  }

  test('should return an element value within a submission object', () => {
    const elementNameAndId = 'D'
    const value = getRootElementValueById(
      elementNameAndId,
      elements,
      submission,
    )
    expect(value).toBe(5)
  })
  test('should return a nested element value within a submission object', () => {
    const elementNameAndId = 'B_C_C_A'
    const value = getRootElementValueById(
      elementNameAndId,
      elements,
      submission,
    )
    expect(value).toBe('B_C_C_AText')
  })
  test('should return a nested element value in a nested form within a submission object', () => {
    const elementNameAndId = 'E_A_A'
    const value = getRootElementValueById(
      elementNameAndId,
      elements,
      submission,
    )
    expect(value).toBe('Nested Form Text')
  })
  test('should return undefined when given an invalid element id', () => {
    const value = getRootElementValueById('abc123', elements, submission)
    expect(value).toBe(undefined)
  })
})
describe('findFormElement()', () => {
  test('should find an element in a nested form', () => {
    const elementId = '08138f9b-2b39-4c7d-9bc9-fbdbed3e7308'
    const element = findFormElement(
      [
        {
          name: 'Number',
          label: 'Number',
          type: 'number',
          required: true,
          defaultValue: 0,
          id: 'b1dde277-8ff7-4b59-a2e0-63ba5e010f36',
          conditionallyShow: false,
          requiresAllConditionallyShowPredicates: false,
          readOnly: false,
          isSlider: false,
          isDataLookup: false,
          isElementLookup: false,
        },
        {
          name: 'Nested_Form_with_one_required_element',
          type: 'form',
          id: '56cd2b03-da3d-4229-8891-ce8e47453f6a',
          conditionallyShow: false,
          requiresAllConditionallyShowPredicates: false,
          formId: 2723,
          elements: [
            {
              name: 'Text',
              label: 'Text',
              type: 'text',
              required: true,
              id: elementId,
              defaultValue: undefined,
              conditionallyShow: false,
              requiresAllConditionallyShowPredicates: false,
              readOnly: false,
              isDataLookup: false,
              isElementLookup: false,
            },
          ],
        },
      ],
      (element) => elementId === element.id,
    )
    expect(element).toBeTruthy()
  })
})

describe('injectFormElementsIntoForm()', () => {
  test('returns expected element array', () => {
    const testForms = _.cloneDeep(forms)

    const form = testForms.forms[0]
    const result = injectFormElementsIntoForm(
      // @ts-expect-error ???
      form,
      testForms.forms,
      true,
    )
    expect(result).toEqual([
      {
        id: '1a',
        name: 'heading',
        type: 'heading',
        label: 'Heading',
      },
      {
        id: '1b',
        name: 'form',
        type: 'form',
        label: 'form',
        formId: 2,
        elements: [
          {
            id: '2a',
            name: 'text_1',
            type: 'text',
            label: 'text',
          },
          {
            id: '2b',
            name: 'form',
            type: 'form',
            label: 'form',
            formId: 3,
            elements: [
              {
                id: '3a',
                name: 'text_1',
                type: 'text',
                label: 'text',
                headingType: 1,
              },
              {
                id: '3b',
                name: 'text_2',
                type: 'text',
                label: 'text',
              },
            ],
          },
          {
            id: '2c',
            name: 'text_2',
            type: 'text',
            label: 'text',
          },
        ],
      },
      {
        id: '1c',
        name: 'repeatableSet',
        type: 'repeatableSet',
        label: 'Repeatable Set',
        elements: [
          {
            id: '1c1',
            name: 'form',
            type: 'form',
            label: 'form',
            formId: 2,
            elements: [
              {
                id: '2a',
                name: 'text_1',
                type: 'text',
                label: 'text',
              },
              {
                id: '2b',
                name: 'form',
                type: 'form',
                label: 'form',
                formId: 3,
                elements: [
                  {
                    id: '3a',
                    name: 'text_1',
                    type: 'text',
                    label: 'text',
                    headingType: 1,
                  },
                  {
                    id: '3b',
                    name: 'text_2',
                    type: 'text',
                    label: 'text',
                  },
                ],
              },
              {
                id: '2c',
                name: 'text_2',
                type: 'text',
                label: 'text',
              },
            ],
          },
        ],
      },
    ])
  })
  test('ignore elements with infinite loop', () => {
    const testForms = _.cloneDeep(invalidForms)

    const form = testForms.forms[1]
    const result = injectFormElementsIntoForm(
      // @ts-expect-error ???
      form,
      testForms.forms,
      true,
    )
    expect(result).toEqual([
      {
        id: '2a',
        name: 'text_1',
        type: 'text',
        label: 'text',
      },
      {
        id: '2b',
        name: 'form',
        type: 'form',
        label: 'form',
        formId: 1,
        elements: [
          {
            id: '1a',
            name: 'heading',
            type: 'heading',
            label: 'Heading',
          },
          {
            id: '1b',
            name: 'repeatableSet',
            type: 'repeatableSet',
            label: 'Repeatable Set',
            elements: [],
          },
          {
            id: '1c',
            name: 'form',
            type: 'form',
            label: 'form',
            formId: 3,
            elements: [
              {
                id: '3a',
                name: 'text_1',
                type: 'text',
                label: 'text',
                headingType: 1,
              },
              {
                id: '3b',
                name: 'text_2',
                type: 'text',
                label: 'text',
              },
            ],
          },
        ],
      },
      {
        id: '2c',
        name: 'text_2',
        type: 'text',
        label: 'text',
      },
    ])
  })
  test('should return detailed html element when isAuthenticated is false', () => {
    const testForms = _.cloneDeep(forms)

    const form = testForms.forms[0]
    const result = injectFormElementsIntoForm(
      // @ts-expect-error ???
      form,
      testForms.forms,
      false,
    )
    expect(result).toEqual([
      {
        id: '1a',
        name: 'heading',
        type: 'heading',
        label: 'Heading',
      },
      {
        id: '1b',
        name: 'Form_requires_authenticated',
        type: 'html',
        label: 'Form Requires Authentication.',
        formId: 2,
        defaultValue:
          'Unable to display the embedded form for this element, as the form requires authentication. Please login and refresh to view this embedded form.',
      },
      {
        id: '1c',
        name: 'repeatableSet',
        type: 'repeatableSet',
        label: 'Repeatable Set',
        elements: [
          {
            id: '1c1',
            name: 'Form_requires_authenticated',
            type: 'html',
            label: 'Form Requires Authentication.',
            formId: 2,
            defaultValue:
              'Unable to display the embedded form for this element, as the form requires authentication. Please login and refresh to view this embedded form.',
          },
        ],
      },
    ])
  })
  test('should return detailed html element when form is not found', () => {
    const testForms = _.cloneDeep(invalidForms)

    const form = testForms.forms[3]
    const result = injectFormElementsIntoForm(
      // @ts-expect-error ???
      form,
      testForms.forms,
      false,
    )
    expect(result).toEqual([
      {
        id: '4a',
        name: 'text_1',
        type: 'text',
        label: 'text',
        headingType: 1,
      },
      {
        id: '4b',
        name: 'text_2',
        type: 'text',
        label: 'text',
      },
      {
        id: '4c',
        name: 'Form_not_found',
        type: 'html',
        label: 'Form not found.',
        formId: 1234567890,
        defaultValue:
          'Unable to display the embedded form for this element, as the form was not found. Please contact your Administrator.',
      },
    ])
  })
})
