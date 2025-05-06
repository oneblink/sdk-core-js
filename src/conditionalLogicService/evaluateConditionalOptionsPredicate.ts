import { FormTypes, ConditionTypes } from '@oneblink/types'

export default function evaluateConditionalOptionsPredicate({
  predicate,
  predicateElement,
  predicateValue,
}: {
  predicate: ConditionTypes.ConditionalPredicateOptions
  predicateValue: unknown
  predicateElement: FormTypes.FormElementWithOptions
}): boolean {
  /**
   * In the @oneblink/apps function formService.parseFormElementOptions dynamic
   * lists are parsed to ensure compliance with One Blink forms. If the dynamic
   * list options include attributes and the element has attributesMapping
   * defined then formService.parseFormElementOptions will attempt to match each
   * dynamic list option attribute value with an option value in the predicate
   * element's options using the element's attributesMapping. For each attribute
   * in the element's attrbutesMapping If a predicate option is found for a
   * particular attribute then the optionIds property of the predicate argument
   * of this function will be appened with either the matched option's id or
   * value.
   *
   * Eg
   *
   *     const element = {
   *       ...elementProps,
   *       options: [
   *         {
   *           id: 'abc123',
   *           label: 'German Shepherd',
   *           value: 'germanShepherd',
   *           attributes: [{ elementId: 'xyz456', optionIds: ['aaa111'] }],
   *         },
   *       ],
   *     }
   *
   * If a predicate option is not found the optionIds property of the predicate
   * argument will contain the dynamic list option's attribute value.
   *
   * Eg
   *
   *     const element = {
   *       ...elementProps,
   *       options: [
   *         {
   *           id: 'abc123',
   *           label: 'German Shepherd',
   *           value: 'germanShepherd',
   *           attributes: [{ elementId: 'xyz456', optionIds: ['dog'] }],
   *         },
   *       ],
   *     }
   */
  return predicate.optionIds.some((optionId) => {
    const option = predicateElement.options?.find((o) => o.id === optionId)

    /**
     * If the predicate element uses injected options using the {ELEMENT:Name}
     * syntax we will not find an option. Referring to the second example above
     * where the optionId is 'dog'. If an injected option's value parses to
     * 'dog' then we can still match it. Ie. optionValue will be set to 'dog'
     * and if the predicateValue is either 'dog' (radio, select, autocomplete)
     * or ['dog'] (checkboxes, select) or {value:'dog'} (compliance) then we
     * will return true for this predicate
     */
    const optionValue = option?.value ?? optionId
    if (optionValue) {
      if (Array.isArray(predicateValue)) {
        return predicateValue.some((modelValue) => {
          return modelValue === optionValue
        })
      } else if (predicateElement.type === 'compliance' && predicateValue) {
        return optionValue === (predicateValue as { value: unknown }).value
      } else {
        return optionValue === predicateValue
      }
    } else {
      return false
    }
  })
}
