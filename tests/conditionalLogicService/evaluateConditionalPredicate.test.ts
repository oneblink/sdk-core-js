import { ConditionTypes, FormTypes } from '@oneblink/types'
import evaluateConditionalPredicate from '../../src/conditionalLogicService/evaluateConditionalPredicate'
import { flattenFormElements } from '../../src/formElementsService'

describe('evaluateConditionalPredicate', () => {
  const predicate: ConditionTypes.ConditionalPredicate = {
    elementId: 'predicateNumber',
    type: 'NUMERIC',
    operator: '===',
    compareWith: 'ELEMENT',
    value: 'comparisonNumber',
  }
  const predicateElement: FormTypes.FormElement = {
    id: 'predicateNumber',
    name: 'predicateNumber',
    label: 'predicateNumber',
    type: 'number',
    required: false,
    isSlider: false,
    conditionallyShow: false,
    isDataLookup: false,
    isElementLookup: false,
  }
  const comparisonElement: FormTypes.FormElement = {
    id: 'comparisonNumber',
    name: 'comparisonNumber',
    label: 'comparisonNumber',
    type: 'number',
    required: false,
    isSlider: false,
    conditionallyShow: false,
    isDataLookup: false,
    isElementLookup: false,
  }
  const conditionalElement: FormTypes.FormElement = {
    id: 'conditionalElement',
    name: 'conditionalElement',
    label: 'conditionalElement',
    type: 'text',
    required: false,
    conditionallyShow: true,
    conditionallyShowPredicates: [predicate],
    isDataLookup: false,
    isElementLookup: false,
  }

  test('should show root element', () => {
    const isShown = evaluateConditionalPredicate({
      predicate,
      formElementsCtrl: {
        flattenedElements: [
          predicateElement,
          comparisonElement,
          conditionalElement,
        ],
        model: {
          predicateNumber: 1,
          comparisonNumber: 1,
        },
      },
    })
    expect(isShown).toBe(predicateElement)
  })

  test('should hide root element', () => {
    const isShown = evaluateConditionalPredicate({
      predicate,
      formElementsCtrl: {
        flattenedElements: [
          predicateElement,
          comparisonElement,
          conditionalElement,
        ],
        model: {
          predicateNumber: 1,
          comparisonNumber: 2,
        },
      },
    })
    expect(isShown).toBe(undefined)
  })

  test('should show repeatable set element', () => {
    const repeatableSetElement: FormTypes.FormElement = {
      id: 'repeatableSet',
      name: 'repeatableSet',
      label: 'repeatableSet',
      type: 'repeatableSet',
      conditionallyShow: false,
      elements: [conditionalElement],
    }
    const isShown = evaluateConditionalPredicate({
      predicate,
      formElementsCtrl: {
        flattenedElements: repeatableSetElement.elements,
        model: {},
        parentFormElementsCtrl: {
          flattenedElements: [
            predicateElement,
            comparisonElement,
            repeatableSetElement,
          ],
          model: {
            predicateNumber: 1,
            comparisonNumber: 1,
          },
        },
      },
    })
    expect(isShown).toBe(predicateElement)
  })

  test('should show element conditionally shown from element within a form element', () => {
    const comparisonElementOne: FormTypes.FormElement = {
      id: 'comparisonNumberOne',
      name: 'comparisonNumberOne',
      label: 'comparisonNumber',
      type: 'number',
      required: false,
      isSlider: false,
      conditionallyShow: false,
      isDataLookup: false,
      isElementLookup: false,
    }
    const comparisonElementTwo: FormTypes.FormElement = {
      id: 'comparisonNumberTwo',
      name: 'comparisonNumberTwo',
      label: 'comparisonNumber',
      type: 'number',
      required: false,
      isSlider: false,
      conditionallyShow: false,
      isDataLookup: false,
      isElementLookup: false,
    }
    const nestedPredicate: ConditionTypes.ConditionalPredicate = {
      elementId: 'comparisonNumberOne',
      type: 'NUMERIC',
      operator: '===',
      compareWith: 'ELEMENT',
      value: 'comparisonNumberTwo',
    }
    const nestedFormPredicate: ConditionTypes.ConditionalPredicate = {
      elementId: 'formFormElement',
      type: 'FORM',
      predicate: nestedPredicate,
    }
    const formFormElement: FormTypes.FormFormElement = {
      id: 'formFormElement',
      formId: 1,
      name: 'formFormElement',
      type: 'form',
      conditionallyShow: false,
      elements: [comparisonElementOne, comparisonElementTwo],
    }
    const isShown = evaluateConditionalPredicate({
      predicate: nestedFormPredicate,
      formElementsCtrl: {
        flattenedElements: flattenFormElements([formFormElement]),
        model: {
          formFormElement: {
            comparisonNumberOne: 1,
            comparisonNumberTwo: 1,
          },
        },
      },
    })

    expect(isShown).toBe(formFormElement)
  })

  test('should show element conditionally shown from element within a deeply nested form element', () => {
    const comparisonElementOne: FormTypes.FormElement = {
      id: 'comparisonNumberOne',
      name: 'comparisonNumberOne',
      label: 'comparisonNumber',
      type: 'number',
      required: false,
      isSlider: false,
      conditionallyShow: false,
      isDataLookup: false,
      isElementLookup: false,
    }
    const comparisonElementTwo: FormTypes.FormElement = {
      id: 'comparisonNumberTwo',
      name: 'comparisonNumberTwo',
      label: 'comparisonNumber',
      type: 'number',
      required: false,
      isSlider: false,
      conditionallyShow: false,
      isDataLookup: false,
      isElementLookup: false,
    }
    const nestedPredicate: ConditionTypes.ConditionalPredicate = {
      elementId: 'comparisonNumberOne',
      type: 'NUMERIC',
      operator: '===',
      compareWith: 'ELEMENT',
      value: 'comparisonNumberTwo',
    }
    const nestedFormPredicate: ConditionTypes.ConditionalPredicate = {
      elementId: 'childFormFormElement',
      type: 'FORM',
      predicate: nestedPredicate,
    }
    const formPredicate: ConditionTypes.ConditionalPredicate = {
      elementId: 'parentFormFormElement',
      type: 'FORM',
      predicate: nestedFormPredicate,
    }
    const childFormFormElement: FormTypes.FormFormElement = {
      id: 'childFormFormElement',
      formId: 1,
      name: 'childFormFormElement',
      type: 'form',
      conditionallyShow: false,
      elements: [comparisonElementOne, comparisonElementTwo],
    }
    const parentFormFormElement: FormTypes.FormFormElement = {
      id: 'parentFormFormElement',
      formId: 1,
      name: 'parentFormFormElement',
      type: 'form',
      conditionallyShow: false,
      elements: [childFormFormElement],
    }
    const isShown = evaluateConditionalPredicate({
      predicate: formPredicate,
      formElementsCtrl: {
        flattenedElements: flattenFormElements([parentFormFormElement]),
        model: {
          parentFormFormElement: {
            childFormFormElement: {
              comparisonNumberOne: 1,
              comparisonNumberTwo: 1,
            },
          },
        },
      },
    })

    expect(isShown).toBe(parentFormFormElement)
  })

  describe('Point and Geoscape Element conditional predicates', () => {
    const conditionalPredicatePoint: ConditionTypes.ConditionalPredicate = {
      elementId: 'predicatePoint',
      type: 'ADDRESS_PROPERTY',
      definition: { property: 'IS_PO_BOX_ADDRESS', value: true },
    }

    const conditionalPredicatePointV3: ConditionTypes.ConditionalPredicate = {
      elementId: 'predicatePointV3',
      type: 'ADDRESS_PROPERTY',
      definition: { property: 'IS_PO_BOX_ADDRESS', value: true },
    }

    const conditionalPredicateGeoscape: ConditionTypes.ConditionalPredicate = {
      elementId: 'predicateGeoscape',
      type: 'ADDRESS_PROPERTY',
      definition: { property: 'STATE_EQUALITY', value: 'NSW' },
    }

    const predicatePoint: FormTypes.PointAddressElement = {
      id: 'predicatePoint',
      name: 'predicatePoint',
      label: 'predicatePoint',
      type: 'pointAddress',
      required: false,
      conditionallyShow: false,
      isDataLookup: false,
      isElementLookup: false,
    }

    const predicatePointV3: FormTypes.PointAddressV3Element = {
      id: 'predicatePointV3',
      name: 'predicatePointV3',
      label: 'predicatePointV3',
      type: 'pointAddressV3',
      required: false,
      conditionallyShow: false,
      isDataLookup: false,
      isElementLookup: false,
    }

    const predicateGeoscape: FormTypes.GeoscapeAddressElement = {
      id: 'predicateGeoscape',
      name: 'predicateGeoscape',
      label: 'predicateGeoscape',
      type: 'geoscapeAddress',
      required: false,
      conditionallyShow: false,
      isDataLookup: false,
      isElementLookup: false,
    }

    test('should show element using NSW Point PO Box', () => {
      const shownElement: FormTypes.FormElement = {
        id: 'shownNumber',
        name: 'shownNumber',
        label: 'shownNumber',
        type: 'number',
        required: false,
        isSlider: false,
        conditionallyShow: true,
        conditionallyShowPredicates: [conditionalPredicatePoint],
        isDataLookup: false,
        isElementLookup: false,
      }
      const isShown = evaluateConditionalPredicate({
        predicate: conditionalPredicatePoint,
        formElementsCtrl: {
          flattenedElements: [predicatePoint, shownElement],
          model: {
            predicatePoint: {
              dataset: 'mailAddress',
            },
          },
        },
      })
      expect(isShown).toBe(predicatePoint)
    })
    test('should show element using NSW Point V3 PO Box', () => {
      const shownElement: FormTypes.FormElement = {
        id: 'shownNumber',
        name: 'shownNumber',
        label: 'shownNumber',
        type: 'number',
        required: false,
        isSlider: false,
        conditionallyShow: true,
        conditionallyShowPredicates: [conditionalPredicatePointV3],
        isDataLookup: false,
        isElementLookup: false,
      }
      const isShown = evaluateConditionalPredicate({
        predicate: conditionalPredicatePointV3,
        formElementsCtrl: {
          flattenedElements: [predicatePointV3, shownElement],
          model: {
            predicatePointV3: {
              properties: {
                dataset: 'mailAddress',
              },
            },
          },
        },
      })
      expect(isShown).toBe(predicatePointV3)
    })
    test('should show element using NSW Point physical address', () => {
      const conditionalPredicatePointNoPO: ConditionTypes.ConditionalPredicate =
        {
          elementId: 'predicatePoint',
          type: 'ADDRESS_PROPERTY',
          definition: { property: 'IS_PO_BOX_ADDRESS', value: false },
        }

      const shownElement: FormTypes.FormElement = {
        id: 'shownNumber',
        name: 'shownNumber',
        label: 'shownNumber',
        type: 'number',
        required: false,
        isSlider: false,
        conditionallyShow: true,
        conditionallyShowPredicates: [conditionalPredicatePointNoPO],
        isDataLookup: false,
        isElementLookup: false,
      }
      const isShown = evaluateConditionalPredicate({
        predicate: conditionalPredicatePointNoPO,
        formElementsCtrl: {
          flattenedElements: [predicatePoint, shownElement],
          model: {
            predicatePoint: {
              dataset: 'GNAF',
            },
          },
        },
      })
      expect(isShown).toBe(predicatePoint)
    })
    test('should show element using NSW Point V3 physical address', () => {
      const conditionalPredicatePointNoPO: ConditionTypes.ConditionalPredicate =
        {
          elementId: 'predicatePointV3',
          type: 'ADDRESS_PROPERTY',
          definition: { property: 'IS_PO_BOX_ADDRESS', value: false },
        }

      const shownElement: FormTypes.FormElement = {
        id: 'shownNumber',
        name: 'shownNumber',
        label: 'shownNumber',
        type: 'number',
        required: false,
        isSlider: false,
        conditionallyShow: true,
        conditionallyShowPredicates: [conditionalPredicatePointNoPO],
        isDataLookup: false,
        isElementLookup: false,
      }
      const isShown = evaluateConditionalPredicate({
        predicate: conditionalPredicatePointNoPO,
        formElementsCtrl: {
          flattenedElements: [predicatePointV3, shownElement],
          model: {
            predicatePointV3: {
              properties: { dataset: 'gnaf,mailingAddress' },
            },
          },
        },
      })
      expect(isShown).toBe(predicatePointV3)
    })
    test('should show element using NSW Point with states', () => {
      const conditionalPredicatePointStates: ConditionTypes.ConditionalPredicate =
        {
          elementId: 'predicatePoint',
          type: 'ADDRESS_PROPERTY',
          definition: { property: 'STATE_EQUALITY', value: 'NSW' },
        }

      const shownElement: FormTypes.FormElement = {
        id: 'shownNumber',
        name: 'shownNumber',
        label: 'shownNumber',
        type: 'number',
        required: false,
        isSlider: false,
        conditionallyShow: true,
        conditionallyShowPredicates: [conditionalPredicatePointStates],
        isDataLookup: false,
        isElementLookup: false,
      }
      const isShown = evaluateConditionalPredicate({
        predicate: conditionalPredicatePointStates,
        formElementsCtrl: {
          flattenedElements: [predicatePoint, shownElement],
          model: {
            predicatePoint: {
              addressDetails: {
                stateTerritory: 'NSW',
              },
            },
          },
        },
      })
      expect(isShown).toBe(predicatePoint)
    })
    test('should show element using NSW Point V3 with states', () => {
      const conditionalPredicatePointStates: ConditionTypes.ConditionalPredicate =
        {
          elementId: 'predicatePointV3',
          type: 'ADDRESS_PROPERTY',
          definition: { property: 'STATE_EQUALITY', value: 'NSW' },
        }

      const shownElement: FormTypes.FormElement = {
        id: 'shownNumber',
        name: 'shownNumber',
        label: 'shownNumber',
        type: 'number',
        required: false,
        isSlider: false,
        conditionallyShow: true,
        conditionallyShowPredicates: [conditionalPredicatePointStates],
        isDataLookup: false,
        isElementLookup: false,
      }
      const isShown = evaluateConditionalPredicate({
        predicate: conditionalPredicatePointStates,
        formElementsCtrl: {
          flattenedElements: [predicatePointV3, shownElement],
          model: {
            predicatePointV3: {
              properties: {
                stateTerritory: 'NSW',
              },
            },
          },
        },
      })
      expect(isShown).toBe(predicatePointV3)
    })
    test('should show element using Geoscape with States', () => {
      const shownElement: FormTypes.FormElement = {
        id: 'shownNumber',
        name: 'shownNumber',
        label: 'shownNumber',
        type: 'number',
        required: false,
        isSlider: false,
        conditionallyShow: true,
        conditionallyShowPredicates: [conditionalPredicateGeoscape],
        isDataLookup: false,
        isElementLookup: false,
      }
      const isShown = evaluateConditionalPredicate({
        predicate: conditionalPredicateGeoscape,
        formElementsCtrl: {
          flattenedElements: [predicateGeoscape, shownElement],
          model: {
            predicateGeoscape: {
              addressDetails: {
                stateTerritory: 'NSW',
              },
            },
          },
        },
      })
      expect(isShown).toBe(predicateGeoscape)
    })
  })
})
