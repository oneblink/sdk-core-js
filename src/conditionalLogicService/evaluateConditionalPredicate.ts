import { FormTypes, ConditionTypes, SubmissionTypes } from '@oneblink/types'
import { FormElementsCtrl } from './types.js'
import { typeCastService, formElementsService } from '../index.js'
import evaluateConditionalOptionsPredicate from './evaluateConditionalOptionsPredicate.js'
import { conditionallyShowByPredicate } from './conditionallyShowElement.js'
import { flattenFormElements } from '../formElementsService.js'

const fnMap = {
  '>': (lhs: number, rhs: number) => lhs > rhs,
  '>=': (lhs: number, rhs: number) => lhs >= rhs,
  '===': (lhs: number, rhs: number) => lhs === rhs,
  '!==': (lhs: number, rhs: number) => lhs !== rhs,
  '<=': (lhs: number, rhs: number) => lhs <= rhs,
  '<': (lhs: number, rhs: number) => lhs < rhs,
}

function getElementAndValue(
  formElementsCtrl: FormElementsCtrl,
  elementId: string,
): { formElementWithName?: FormTypes.FormElementWithName; value?: unknown } {
  const formElement = formElementsCtrl.flattenedElements.find(
    (formElement) => formElement.id === elementId,
  )
  if (formElement) {
    const formElementWithName =
      typeCastService.formElements.toNamedElement(formElement)
    if (formElementWithName) {
      return {
        formElementWithName,
        value: formElementsCtrl.model?.[formElementWithName.name],
      }
    }
  } else if (formElementsCtrl.parentFormElementsCtrl) {
    return getElementAndValue(
      formElementsCtrl.parentFormElementsCtrl,
      elementId,
    )
  }
  return {}
}

export default function evaluateConditionalPredicate({
  predicate,
  formElementsCtrl,
}: {
  predicate: ConditionTypes.ConditionalPredicate
  formElementsCtrl: FormElementsCtrl
}): FormTypes.FormElementWithName | undefined {
  const { formElementWithName: predicateElement, value: predicateValue } =
    getElementAndValue(formElementsCtrl, predicate.elementId)
  if (!predicateElement) {
    return
  }
  switch (predicate.type) {
    case 'VALUE': {
      if (Array.isArray(predicateValue)) {
        return !predicate.hasValue === !predicateValue.length
          ? predicateElement
          : undefined
      }
      return !predicate.hasValue === !predicateValue
        ? predicateElement
        : undefined
    }
    case 'NUMERIC': {
      // if the operator fn doesn't exist, hide the control
      const operatorFn = fnMap[predicate.operator]
      if (!operatorFn) return undefined

      const lhs = Number.parseFloat(predicateValue as string)
      // if left is not a number, hide the control
      if (isNaN(lhs)) return undefined

      let rhsValue = NaN
      switch (predicate.compareWith) {
        case 'ELEMENT': {
          const { value: comparisonValue } = getElementAndValue(
            formElementsCtrl,
            predicate.value,
          )
          rhsValue =
            comparisonValue === 'string'
              ? Number.parseFloat(comparisonValue)
              : (comparisonValue as number)
          break
        }
        case 'VALUE':
        default: {
          rhsValue = predicate.value
          break
        }
      }

      const rhs =
        typeof rhsValue === 'string' ? Number.parseFloat(rhsValue) : rhsValue

      // if right is not a number, hide the control
      if (isNaN(rhs)) return undefined

      return operatorFn(lhs, rhs) ? predicateElement : undefined
    }
    case 'BETWEEN': {
      const value = Number.parseFloat(predicateValue as string)
      if (Number.isNaN(value)) {
        return undefined
      }

      return value >= predicate.min && value <= predicate.max
        ? predicateElement
        : undefined
    }
    case 'REPEATABLESET': {
      const {
        formElementWithName: repeatableSetElement,
        value: repeatableSetValue,
      } = getElementAndValue(formElementsCtrl, predicate.elementId)

      if (!repeatableSetElement) {
        return
      }

      if (
        repeatableSetElement.type !== 'repeatableSet' ||
        !Array.isArray(repeatableSetValue)
      ) {
        return
      }

      for (const entry of repeatableSetValue) {
        const result = conditionallyShowByPredicate(
          {
            model: entry,
            flattenedElements: formElementsService.flattenFormElements(
              repeatableSetElement.elements,
            ),
            parentFormElementsCtrl: formElementsCtrl,
          },
          predicate.repeatableSetPredicate,
          [],
        )

        if (result) {
          return predicateElement
        }
      }
      return
    }
    case 'FORM':
      if (predicate.predicate) {
        if (
          !predicateElement ||
          predicateElement.type !== 'form' ||
          !predicateElement.elements
        ) {
          return
        }
        const formModel = formElementsCtrl.model?.[predicateElement.name] as
          | SubmissionTypes.S3SubmissionData['submission']
          | undefined

        const result = conditionallyShowByPredicate(
          {
            model: formModel,
            flattenedElements: flattenFormElements(predicateElement.elements),
            parentFormElementsCtrl: formElementsCtrl,
          },
          predicate.predicate,
          [],
        )

        if (result) {
          return predicateElement
        }
      }
      return
    case 'ADDRESS_PROPERTY': {
      // Only element types that should work as predicate element should be Point, Point V3 or Geoscape.
      if (
        predicateElement.type === 'pointAddress' ||
        predicateElement.type === 'geoscapeAddress' ||
        predicateElement.type === 'pointAddressV3'
      ) {
        if (predicateValue && typeof predicateValue === 'object') {
          if (predicate.definition.property === 'STATE_EQUALITY') {
            switch (predicateElement.type) {
              case 'pointAddressV3': {
                if (
                  'properties' in predicateValue &&
                  predicateValue.properties &&
                  typeof predicateValue.properties === 'object' &&
                  'stateTerritory' in predicateValue.properties &&
                  typeof predicateValue.properties.stateTerritory === 'string'
                ) {
                  // Validate that it has the properties we want, in case submission data
                  // is incorrect but has the right element reference.
                  const result =
                    predicateValue.properties.stateTerritory ===
                    predicate.definition.value
                  if (result) {
                    return predicateElement
                  }
                  return
                }
                break
              }
              case 'geoscapeAddress':
              case 'pointAddress': {
                // Validate that it has the properties we want, in case submission data
                // is incorrect but has the right element reference.
                if (
                  'addressDetails' in predicateValue &&
                  predicateValue.addressDetails &&
                  typeof predicateValue.addressDetails === 'object' &&
                  'stateTerritory' in predicateValue.addressDetails &&
                  typeof predicateValue.addressDetails.stateTerritory ===
                    'string'
                ) {
                  const result =
                    predicateValue.addressDetails.stateTerritory ===
                    predicate.definition.value
                  if (result) {
                    return predicateElement
                  }
                  return
                }
              }
            }
          }
          // If the property isn't State Equality, we are checking Physical addresses. This only exists for Point and Point V3.
          switch (predicateElement.type) {
            case 'pointAddressV3': {
              // If the value is true, we only want to return the element for PO Boxes. If it's false, then we only want
              // to return element for non mail address addresses.
              if (
                'properties' in predicateValue &&
                predicateValue.properties &&
                typeof predicateValue.properties === 'object' &&
                'dataset' in predicateValue.properties &&
                typeof predicateValue.properties.dataset === 'string'
              ) {
                const result = predicate.definition.value
                  ? predicateValue.properties.dataset.startsWith('mailAddress')
                  : predicateValue.properties.dataset.startsWith('gnaf')
                if (result) {
                  return predicateElement
                }
              }
              break
            }
            case 'pointAddress': {
              // If the value is true, we only want to return the element for PO Boxes. If it's false, then we only want
              // to return element for non mail address addresses.
              if (
                'dataset' in predicateValue &&
                typeof predicateValue.dataset === 'string'
              ) {
                const result = predicate.definition.value
                  ? predicateValue.dataset === 'mailAddress'
                  : predicateValue.dataset === 'GNAF'
                if (result) {
                  return predicateElement
                }
              }
              break
            }
          }
        }
      }
      break
    }
    case 'OPTIONS':
    default: {
      const optionsPredicateElement =
        typeCastService.formElements.toOptionsElement(predicateElement)
      if (!optionsPredicateElement) {
        return undefined
      }

      // If the predicate element does not have any options to evaluate,
      // we will show the element.
      // Unless the predicate element has dynamic options and
      // options have not been fetched yet.
      if (!Array.isArray(optionsPredicateElement.options)) {
        return optionsPredicateElement.optionsType !== 'DYNAMIC'
          ? predicateElement
          : undefined
      } else {
        return evaluateConditionalOptionsPredicate({
          predicate,
          predicateValue,
          predicateElement: optionsPredicateElement,
        })
          ? predicateElement
          : undefined
      }
    }
  }
}
