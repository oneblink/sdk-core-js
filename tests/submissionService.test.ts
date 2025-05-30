import {
  FormTypes,
  ScheduledTasksTypes,
  SubmissionTypes,
} from '@oneblink/types'
import {
  replaceInjectablesWithElementValues,
  replaceInjectablesWithSubmissionValues,
  getElementSubmissionValue,
  processInjectablesInCustomResource,
} from '../src/submissionService'

describe('replaceInjectablesWithSubmissionValues()', () => {
  const task: ScheduledTasksTypes.Task = {
    versionId: 1,
    taskId: '1',
    name: 'Replace the food',
    formsAppEnvironmentId: 1,
    organisationId: 'string',
    schedule: {
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      recurrence: {
        interval: 'DAY',
      },
    },
    actionIds: [],
    createdAt: new Date().toISOString(),
  }
  const taskGroup: ScheduledTasksTypes.TaskGroup = {
    versionId: 1,
    taskGroupId: '1',
    name: 'Cage',
    taskIds: [task.taskId],
    formsAppEnvironmentId: task.formsAppEnvironmentId,
    organisationId: task.organisationId,
    createdAt: new Date().toISOString(),
  }
  const taskGroupInstance: ScheduledTasksTypes.TaskGroupInstance = {
    versionId: 1,
    taskGroupId: taskGroup.taskGroupId,
    taskGroupInstanceId: 'taskGroupInstanceId',
    label: 'Snake Cage',
    createdAt: new Date().toISOString(),
  }
  const form: FormTypes.Form = {
    id: 1,
    name: 'string',
    description: 'string',
    organisationId: 'string',
    formsAppEnvironmentId: 1,
    formsAppIds: [],
    elements: [
      {
        id: 'd4135b47-9004-4d75-aeb3-d2f6232da111',
        name: 'name',
        type: 'text',
        label: 'Name',
        readOnly: false,
        required: false,
        conditionallyShow: false,
        requiresAllConditionallyShowPredicates: false,
        isElementLookup: false,
        isDataLookup: false,
      },
      {
        id: 'fbad2d53-ddf3-419d-8ff7-e9ef21167222',
        name: 'home',
        type: 'text',
        label: 'Home',
        readOnly: false,
        required: false,
        conditionallyShow: false,
        requiresAllConditionallyShowPredicates: false,
        isElementLookup: false,
        isDataLookup: false,
      },
      {
        id: 'd4135b47-9004-4d75-aeb3-d2f6232da333',
        name: 'ELEMENT_1',
        type: 'text',
        label: 'ELEMENT 1',
        readOnly: false,
        required: false,
        conditionallyShow: false,
        requiresAllConditionallyShowPredicates: false,
        isElementLookup: false,
        isDataLookup: false,
      },
      {
        id: 'fbad2d53-ddf3-419d-8ff7-e9ef21167444',
        name: 'ELEMENT_2',
        type: 'text',
        label: 'ELEMENT 2',
        readOnly: false,
        required: false,
        conditionallyShow: false,
        requiresAllConditionallyShowPredicates: false,
        isElementLookup: false,
        isDataLookup: false,
      },
    ],
    isAuthenticated: false,
    isMultiPage: false,
    postSubmissionAction: 'FORMS_LIBRARY',
    cancelAction: 'FORMS_LIBRARY',
    submissionEvents: [],
    tags: [],
    createdAt: 'string',
    updatedAt: 'string',
  }
  const baseOptions = {
    form,
    submissionId: 'submissionId',
    externalId: undefined,
    previousApprovalId: undefined,
    submissionTimestamp: new Date().toISOString(),
    formatDate: () => '',
    formatDateTime: () => '',
    formatTime: () => '',
    formatCurrency: () => '',
    formatNumber: () => '',
    userProfile: {
      userId: '1',
      username: 'person1',
      email: 'person@email.com',
    },
    task,
    taskGroup,
    taskGroupInstance,
  }
  describe('Form redirect URL', () => {
    test('should replace all instances of {ELEMENT} with correct property value', () => {
      const url = 'https://some-url.com?name={ELEMENT:name}&home={ELEMENT:home}'

      const result = replaceInjectablesWithSubmissionValues(url, {
        ...baseOptions,
        submission: {
          name: 'blinkybill',
          home: 'gosford',
        },
      })

      expect(result).toEqual({
        text: 'https://some-url.com?name=blinkybill&home=gosford',
        hadAllInjectablesReplaced: true,
      })
    })

    test('should replace all INDENTICAL instances of {ELEMENT} with correct property value', () => {
      const url =
        'https://some-url.com?name={ELEMENT:name}&koala={ELEMENT:name}'

      const result = replaceInjectablesWithSubmissionValues(url, {
        ...baseOptions,
        submission: {
          name: 'blinkybill',
          home: 'gosford',
        },
      })

      expect(result).toEqual({
        text: 'https://some-url.com?name=blinkybill&koala=blinkybill',
        hadAllInjectablesReplaced: true,
      })
    })

    test('should replace only one(1) instance of {ELEMENT} with correct property value', () => {
      const url = 'https://some-url.com?name={ELEMENT:name}'

      const result = replaceInjectablesWithSubmissionValues(url, {
        ...baseOptions,
        submission: {
          name: 'blinkybill',
        },
      })
      expect(result).toEqual({
        text: 'https://some-url.com?name=blinkybill',
        hadAllInjectablesReplaced: true,
      })
    })
  })

  describe('element tokens', () => {
    const submission = {
      ELEMENT_1: 'zyx',
      ELEMENT_2: 'wvu',
    }

    test('Replaces element tokens with submission data values', async () => {
      const text = 'abc {ELEMENT:ELEMENT_1} def {ELEMENT:ELEMENT_2}'
      const expected = 'abc zyx def wvu'
      const result = replaceInjectablesWithSubmissionValues(text, {
        ...baseOptions,
        submission,
      })
      expect(result).toEqual({
        text: expected,
        hadAllInjectablesReplaced: true,
      })
    })

    test('Original string is returned if no tokens present', async () => {
      const text = 'abc def {ELEMENT:}'
      const result = replaceInjectablesWithSubmissionValues(text, {
        ...baseOptions,
        submission,
      })
      expect(result).toEqual({
        text,
        hadAllInjectablesReplaced: true,
      })
    })
  })

  describe('email recipient', () => {
    test('should replace instance of {USER:email} with email from user profile', () => {
      const emailRecipient = '{USER:email}'

      const result = replaceInjectablesWithSubmissionValues(emailRecipient, {
        ...baseOptions,
        submission: {
          name: 'blinkybill',
          home: 'gosford',
        },
      })

      expect(result).toEqual({
        text: 'person@email.com',
        hadAllInjectablesReplaced: true,
      })
    })

    test('should replace instance of {ELEMENT} with email from submission', () => {
      const emailRecipient = '{ELEMENT:userEmail}'

      const result = replaceInjectablesWithSubmissionValues(emailRecipient, {
        ...baseOptions,
        submission: {
          name: 'blinkybill',
          home: 'gosford',
          userEmail: 'autre_person@email.com',
        },
      })

      expect(result).toEqual({
        text: 'autre_person@email.com',
        hadAllInjectablesReplaced: true,
      })
    })
  })

  test('should replace instance of {USER:email} and {ELEMENT} together', () => {
    const emailRecipient = '{USER:email};{ELEMENT:userEmail};{USER:email}'

    const result = replaceInjectablesWithSubmissionValues(emailRecipient, {
      ...baseOptions,
      submission: {
        name: 'blinkybill',
        home: 'gosford',
        userEmail: 'autre_person@email.com',
      },
    })

    expect(result).toEqual({
      text: 'person@email.com;autre_person@email.com;person@email.com',
      hadAllInjectablesReplaced: true,
    })
  })

  test('should replace with empty strings when {USER:email} and {ELEMENT} are used together without {ELEMENT} value', () => {
    const emailRecipient = '{USER:email};{ELEMENT:userEmail};{USER:email}'

    const result = replaceInjectablesWithSubmissionValues(emailRecipient, {
      ...baseOptions,
      submission: {
        name: 'blinkybill',
        home: 'gosford',
      },
    })

    expect(result).toEqual({
      text: 'person@email.com;;person@email.com',
      hadAllInjectablesReplaced: false,
    })
  })

  test('should replace with empty strings when {USER:email} and {ELEMENT} are used together without {USER:email} value', () => {
    const emailRecipient = '{USER:email};{ELEMENT:userEmail};{USER:email}'

    const result = replaceInjectablesWithSubmissionValues(emailRecipient, {
      ...baseOptions,
      submission: {
        name: 'blinkybill',
        home: 'gosford',
        userEmail: 'autre_person@email.com',
      },
      userProfile: undefined,
    })

    expect(result).toEqual({
      text: ';autre_person@email.com;',
      hadAllInjectablesReplaced: false,
    })
  })

  describe('task based props', () => {
    const text =
      'Task: {TASK_NAME} | Task Group: {TASK_GROUP_NAME} | Task Group Instance: {TASK_GROUP_INSTANCE_LABEL}'
    const expected =
      'Task: Replace the food | Task Group: Cage | Task Group Instance: Snake Cage'

    test('should be replaced for element values', () => {
      const result = replaceInjectablesWithElementValues(text, {
        ...baseOptions,
        formElements: baseOptions.form.elements,
        submission: {},
      })

      expect(result).toEqual({
        text: expected,
        hadAllInjectablesReplaced: true,
      })
    })

    test('should replace task based props', () => {
      const result = replaceInjectablesWithSubmissionValues(text, {
        ...baseOptions,
        submission: {},
      })

      expect(result).toEqual({
        text: expected,
        hadAllInjectablesReplaced: true,
      })
    })
  })

  describe('logged in user', () => {
    test('should replace instance of {USER:username} with username from user profile', () => {
      const username = '{USER:username}'

      const result = replaceInjectablesWithSubmissionValues(username, {
        ...baseOptions,
        submission: {
          name: 'blinkybill',
          home: 'gosford',
        },
      })

      expect(result).toEqual({
        text: 'person1',
        hadAllInjectablesReplaced: true,
      })
    })
  })

  describe('getElementSubmissionValue', () => {
    const formElements: FormTypes.FormElement[] = [
      {
        id: 'fbad2d53-ddf3-419d-8ff7-e9ef21167224',
        type: 'page',
        label: 'Page 1',
        conditionallyShow: false,
        elements: [
          {
            id: 'fbad2d53-ddf3-419d-8ff7-e9ef21167222',
            name: 'home',
            type: 'text',
            label: 'Home',
            readOnly: false,
            required: false,
            conditionallyShow: false,
            requiresAllConditionallyShowPredicates: false,
            isElementLookup: false,
            isDataLookup: false,
          },
          {
            id: 'd4135b47-9004-4d75-aeb3-d2f6232da111',
            name: 'name',
            type: 'text',
            label: 'Name',
            readOnly: false,
            required: false,
            conditionallyShow: false,
            requiresAllConditionallyShowPredicates: false,
            isElementLookup: false,
            isDataLookup: false,
          },
          {
            id: 'fbad2d53-ddf3-419d-8ff7-e9ef21167223',
            name: 'submarine',
            type: 'form',
            formId: 2,
            conditionallyShow: false,
            elements: [
              {
                id: 'd4135b47-9004-4d75-aeb3-d2f6232da112',
                name: 'name',
                type: 'text',
                label: 'Name',
                readOnly: false,
                required: false,
                conditionallyShow: false,
                requiresAllConditionallyShowPredicates: false,
                isElementLookup: false,
                isDataLookup: false,
              },
              {
                id: 'fbad2d53-ddf3-419d-8ff7-e9ef21167223',
                label: 'Section 8',
                isCollapsed: false,
                type: 'section',
                conditionallyShow: false,
                elements: [
                  {
                    id: 'd4135b47-9004-4d75-aeb3-d2f6232da112',
                    name: 'date',
                    type: 'date',
                    label: 'Date',
                    readOnly: false,
                    required: false,
                    conditionallyShow: false,
                    requiresAllConditionallyShowPredicates: false,
                    isElementLookup: false,
                    isDataLookup: false,
                  },
                ],
              },
            ],
          },
        ],
      },
    ]

    const submission = {
      submarine: {
        name: 'Ringo',
      },
      name: 'George',
    }

    it('should accept property name', () => {
      const result = getElementSubmissionValue({
        propertyName: 'name',
        submission,
        formElements,
        formatDate: () => '',
        formatTime: () => '',
        formatDateTime: () => '',
        formatNumber: () => '',
        formatCurrency: () => '',
      })

      expect(result).toEqual(
        expect.objectContaining({
          element: expect.objectContaining({
            id: 'd4135b47-9004-4d75-aeb3-d2f6232da111',
          }),
          value: 'George',
        }),
      )
    })

    it('should accept elementId', () => {
      const elementId = 'd4135b47-9004-4d75-aeb3-d2f6232da112'
      const result = getElementSubmissionValue({
        elementId,
        submission,
        formElements,
        formatDate: () => '',
        formatTime: () => '',
        formatDateTime: () => '',
        formatNumber: () => '',
        formatCurrency: () => '',
      })

      expect(result).toEqual(
        expect.objectContaining({
          element: expect.objectContaining({ id: elementId }),
          value: 'Ringo',
        }),
      )
    })

    it('should use elementId before propertyName', () => {
      const elementId = 'd4135b47-9004-4d75-aeb3-d2f6232da112'
      //@ts-expect-error intentionally passing both in error
      const result = getElementSubmissionValue({
        elementId,
        propertyName: 'name',
        submission,
        formElements,
        formatDate: () => '',
        formatTime: () => '',
        formatDateTime: () => '',
        formatNumber: () => '',
        formatCurrency: () => '',
      })

      expect(result).toEqual(
        expect.objectContaining({
          element: expect.objectContaining({ id: elementId }),
          value: 'Ringo',
        }),
      )
    })

    it('should work with a root element after an element with elements', () => {
      const formElements: FormTypes.FormElement[] = [
        {
          id: '123',
          type: 'section',
          label: 'Section',
          elements: [
            {
              id: '456',
              type: 'location',
              name: 'location',
              label: 'Location',
              conditionallyShow: false,
              isDataLookup: false,
              isElementLookup: false,
              required: false,
            },
          ],
          isCollapsed: false,
          conditionallyShow: false,
        },
        {
          id: '789',
          type: 'date',
          name: 'date',
          label: 'Date',
          isDataLookup: false,
          isElementLookup: false,
          conditionallyShow: false,
          required: false,
        },
      ]

      const result = getElementSubmissionValue({
        propertyName: 'date',
        submission: { date: '2024-03-13' },
        formElements,
        formatDate: (v) => `date is ${v}`,
        formatTime: () => '',
        formatDateTime: () => '',
        formatNumber: () => '',
        formatCurrency: () => '',
      })

      expect(result?.value).toBe('date is 2024-03-13')
    })

    it('should work with propertyName not in definition', () => {
      const result = getElementSubmissionValue({
        propertyName: 'text',
        submission: { text: 'hello' },
        formElements: [],
        formatDate: () => '',
        formatTime: () => '',
        formatDateTime: () => '',
        formatNumber: () => '',
        formatCurrency: () => '',
      })
      expect(result?.value).toEqual('hello')
    })

    it('should work with nested propertyName not in definition', () => {
      const result = getElementSubmissionValue({
        propertyName: 'text',
        submission: { text: 'hello' },
        formElements: [
          {
            id: 'd4135b47-9004-4d75-aeb3-d2f6232da111',
            type: 'page',
            label: 'Page 1',
            conditionallyShow: false,
            elements: [],
          },
        ],
        formatDate: () => '',
        formatTime: () => '',
        formatDateTime: () => '',
        formatNumber: () => '',
        formatCurrency: () => '',
      })
      expect(result).toEqual({ value: 'hello' })
    })
  })
})

describe('processInjectablesInCustomResource', () => {
  const formElements: FormTypes.FormElement[] = [
    {
      id: 'element1',
      name: 'Family_Name',
      type: 'text',
      label: 'Family Name',
      readOnly: false,
      required: false,
      conditionallyShow: false,
      requiresAllConditionallyShowPredicates: false,
      isElementLookup: false,
      isDataLookup: false,
    },
    {
      id: 'element2',
      type: 'repeatableSet',
      name: 'Children',
      label: 'Children',
      conditionallyShow: false,
      elements: [
        {
          id: 'element3',
          name: 'Child_Name',
          type: 'text',
          label: 'Child Name',
          readOnly: false,
          required: false,
          conditionallyShow: false,
          requiresAllConditionallyShowPredicates: false,
          isElementLookup: false,
          isDataLookup: false,
        },
      ],
    },
  ]

  const submission: SubmissionTypes.S3SubmissionData['submission'] = {
    Family_Name: 'Smith',
    Children: [
      {
        Child_Name: 'John',
      },
      {
        Child_Name: 'Jane',
      },
    ],
  }

  const replaceRootInjectables = (
    text: string,
    entry: SubmissionTypes.S3SubmissionData['submission'],
    elements: FormTypes.FormElement[],
  ) => {
    return replaceInjectablesWithElementValues(text, {
      userProfile: undefined,
      task: undefined,
      taskGroup: undefined,
      taskGroupInstance: undefined,
      formatDateTime: (value) => new Date(value).toString(),
      formatDate: (value) => new Date(value).toDateString(),
      formatTime: (value) => new Date(value).toTimeString(),
      formatNumber: (value) => value.toString(),
      formatCurrency: (value) => value.toFixed(2),
      submission: entry,
      formElements: elements,
      excludeNestedElements: true,
    }).text
  }

  it('should replace injectable values correctly', () => {
    const resource = '{ELEMENT:Children|Child_Name} {ELEMENT:Family_Name}'
    const result = processInjectablesInCustomResource({
      resource,
      submission,
      formElements,
      replaceRootInjectables,
    })

    expect(result).toMatchSnapshot()
  })

  it('should handle single element without iteration', () => {
    const resource = '{ELEMENT:Family_Name}'
    const result = processInjectablesInCustomResource({
      resource,
      submission,
      formElements,
      replaceRootInjectables,
    })

    expect(result).toMatchSnapshot()
  })

  it('should handle missing element values gracefully', () => {
    const resource = '{ELEMENT:Non_Existing_Element}'
    const result = processInjectablesInCustomResource({
      resource,
      submission,
      formElements,
      replaceRootInjectables,
    })

    expect(result).toMatchSnapshot()
  })

  it('should correctly replace nested injectables', () => {
    const resource =
      '{ELEMENT:Children|Child_Name} is part of the {ELEMENT:Family_Name} family'
    const result = processInjectablesInCustomResource({
      resource,
      submission,
      formElements,
      replaceRootInjectables,
    })

    expect(result).toMatchSnapshot()
  })

  it('should return an empty array if no injectables are present', () => {
    const resource = 'No injectables here'
    const result = processInjectablesInCustomResource({
      resource,
      submission,
      formElements,
      replaceRootInjectables,
    })

    expect(result).toMatchSnapshot()
  })

  it('should handle multiple replacements correctly', () => {
    const resource = '{ELEMENT:Family_Name} {ELEMENT:Family_Name}'
    const result = processInjectablesInCustomResource({
      resource,
      submission,
      formElements,
      replaceRootInjectables,
    })

    expect(result).toMatchSnapshot()
  })

  it('should replace injectable values correctly when resource is not a string', () => {
    type Book = {
      book_title: string
      favorite_sentence: string
    }
    const books: Book[] = [
      {
        book_title: 'The Adventures of {ELEMENT:heros|name}',
        favorite_sentence:
          'It was a bright cold day in April, and the clocks were striking thirteen.',
      },
      {
        book_title: 'The Mysterious Case of {ELEMENT:detectives|name}',
        favorite_sentence: 'Elementary, my dear Watson.',
      },
      {
        book_title: 'Strange Times in {ELEMENT:cities|name}',
        favorite_sentence:
          'It was the best of times, it was the worst of times.',
      },
      {
        book_title: 'The Journey of {ELEMENT:heros|name}',
        favorite_sentence: 'Not all those who wander are lost.',
      },
      {
        book_title: '{ELEMENT:adjectives|name} Nights',
        favorite_sentence: 'To be, or not to be, that is the question.',
      },
    ]

    const result = books.reduce<Book[]>((memo, book) => {
      const map = processInjectablesInCustomResource<Book>({
        resource: book,
        submission: {
          heros: [{ name: 'Superman' }, { name: 'Wonder Woman' }],
          detectives: [{ name: 'Sherlock Holmes' }, { name: 'Hercule Poirot' }],
          cities: [{ name: 'Gotham' }, { name: 'Metropolis' }],
          adjectives: [{ name: 'Brave' }, { name: 'Mysterious' }],
        },
        formElements: [
          {
            id: 'element1',
            type: 'repeatableSet',
            name: 'heros',
            label: 'Heros',
            conditionallyShow: false,
            elements: [
              {
                id: 'element2',
                name: 'name',
                type: 'text',
                label: 'Name',
                readOnly: false,
                required: false,
                conditionallyShow: false,
                requiresAllConditionallyShowPredicates: false,
                isElementLookup: false,
                isDataLookup: false,
              },
            ],
          },
          {
            id: 'element3',
            type: 'repeatableSet',
            name: 'detectives',
            label: 'Detectives',
            conditionallyShow: false,
            elements: [
              {
                id: 'element4',
                name: 'name',
                type: 'text',
                label: 'Name',
                readOnly: false,
                required: false,
                conditionallyShow: false,
                requiresAllConditionallyShowPredicates: false,
                isElementLookup: false,
                isDataLookup: false,
              },
            ],
          },
          {
            id: 'element5',
            type: 'repeatableSet',
            name: 'cities',
            label: 'Cities',
            conditionallyShow: false,
            elements: [
              {
                id: 'element6',
                name: 'name',
                type: 'text',
                label: 'Name',
                readOnly: false,
                required: false,
                conditionallyShow: false,
                requiresAllConditionallyShowPredicates: false,
                isElementLookup: false,
                isDataLookup: false,
              },
            ],
          },
          {
            id: 'element7',
            type: 'repeatableSet',
            name: 'adjectives',
            label: 'Adjectives',
            conditionallyShow: false,
            elements: [
              {
                id: 'element8',
                name: 'name',
                type: 'text',
                label: 'Name',
                readOnly: false,
                required: false,
                conditionallyShow: false,
                requiresAllConditionallyShowPredicates: false,
                isElementLookup: false,
                isDataLookup: false,
              },
            ],
          },
        ],
        replaceRootInjectables: (book, entry, elements) => {
          const book_title = replaceInjectablesWithElementValues(
            book.book_title,
            {
              userProfile: undefined,
              task: undefined,
              taskGroup: undefined,
              taskGroupInstance: undefined,
              formatDateTime: (value) => new Date(value).toString(),
              formatDate: (value) => new Date(value).toDateString(),
              formatTime: (value) => new Date(value).toTimeString(),
              formatNumber: (value) => value.toString(),
              formatCurrency: (value) => value.toFixed(2),
              submission: entry,
              formElements: elements,
              excludeNestedElements: true,
            },
          ).text
          return [
            book_title,
            book_title,
            {
              ...book,
              book_title,
            } as Book,
          ]
        },
        prepareNestedInjectables: (book, preparer) => {
          return {
            ...book,
            book_title: preparer(book.book_title),
          }
        },
      })

      return [...memo, ...map.values()]
    }, [])

    expect(result).toMatchSnapshot()
  })
})
