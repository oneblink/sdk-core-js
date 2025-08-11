# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- support for `requiresAllConditionallyShowOptionsPredicates` in options elements

## [8.7.0] - 2025-08-11

### Added

- support for `CHECKBOXES`,`DROPDOWN`,`DATE`,`DATETIME` types to `goodToGoService`

## [8.6.0] - 2025-07-25

### Added

- `goodToGoService`

## [8.5.1] - 2025-07-10

### Added

- lookup button form element

## [8.5.0] - 2025-07-01

### Changed

- `submissionService.processInjectablesInCustomResource()`, `submissionService.replaceInjectablesWithSubmissionValues()` and `submissionService.replaceInjectablesWithElementValues()` to support `ELEMENT_VALUE:` token

## [8.4.0] - 2025-06-03

### Added

- support for `displayAsCurrency` for number elements

## [8.3.0] - 2025-05-22

### Added

- `IMAGE` type to resource-definitions
- zipCode and postalCode to user profile

## [8.2.0] - 2025-05-06

### Added

- address and department details to user profile

## [8.1.0] - 2025-04-30

### Added

- `pointCadastralParcel` form element

### Changed

- `typeCastService.toLookupElement` and `typeCastService.toAutoLookupElement` to include `arcGISWebMap`

### Removed

- `arcGISWebMap` from `formElementsService.infoPageElements`

## [8.0.0] - 2025-04-04

### Removed

- **[BREAKING]** `ResourceDefinition['checkIsFormElementSupported']` property

## [7.4.0] - 2025-03-11

### Added

- `sharepointService`
- `freshdeskService`

## [7.3.2] - 2024-12-09

### Changed

- `formElementsService.parseDynamicFormElementOptions()` to include `imageUrl`

## [7.3.1] - 2024-11-13

### Changed

- return type for `schedulingService.checkFormSchedulingEvent` to `FormSchedulingEvent`

## [7.3.0] - 2024-09-25

### Added

- `getDisplayDetailsFromFormSubmissionPayment` to `paymentService`

## [7.2.0] - 2024-09-10

### Added

- `webhookSubscriptionService`

## [7.1.0] - 2024-09-03

### Added

- `submissionService.processInjectablesInCustomResource()`

## [7.0.0] - 2024-08-13

### Removed

- **[BREAKING]** support for NodeJS 16

### Changed

- `formElementsService.getRootElementValueById()` to support retrieving submission data from nested forms

## [6.3.1] - 2024-08-07

### Changed

- check if repeatable set element value is an empty array

## [6.3.0] - 2024-06-21

### Added

- `ADDRESS_DETAILS` predicate type added to `conditionalLogicService.evaluateConditionalPredicate`

## [6.2.0] - 2024-06-04

### Added

- `googleAddress` to typed Lookup Elements
- `groups` to `parseUserProfile()`

## [6.1.0] - 2024-04-30

## Added

- support for `FORM` predicate type in `evaluateConditionalPredicate`

## [6.0.1] - 2024-03-14

### Fixed

- replaceCustomValues working with nested values and propertyName

## [6.0.0] - 2024-03-06

### Added

- `excludeNestedElements` option to `submissionService.replaceInjectablesWithElementValues()`, `submissionService.replaceInjectablesWithSubmissionValues()` and `formElementsService.matchElementsTagRegex()`

### Changed

- **[BREAKING]** `submissionService.replaceInjectablesWithElementValues()` and `submissionService.replaceInjectablesWithSubmissionValues()` return value to be an object with a `hadAllInjectablesReplaced` property
- **[BREAKING]** allow `submissionService.getElementSubmissionValue` to accept an optional `elementId` property and return element and value

### Removed

- **[BREAKING]** `formElementsService.ElementWYSIWYGRegex`

## [5.4.0] - 2024-02-18

### Added

- `arcGISWebMap` form element to `submissionService`

## [5.3.1] - 2024-02-07

## [5.3.0] - 2024-01-30

### Added

- Westpac Quickstream payment event to typeCastService

## [5.2.0] - 2024-01-18

### Added

- `apiNSWLiquorLicense` form element to `typeCastService` and `submissionService`

### Fixed

- repeatable set conditional logic not evaluating predicate elements correctly

## [5.1.0] - 2023-11-20

### Added

- `formElementsService.injectFormElementsIntoForm()`
- username to `replaceInjectablesWithElementValues`

## [5.0.0] - 2023-11-01

### Added

- `{TASK_NAME}`, `{TASK_GROUP_NAME}` and `{TASK_GROUP_INSTANCE_LABEL}` to replaceable parameters

## [4.2.0] - 2023-10-23

### Added

- `REPEATABLESET` predicate type to `conditionalLogicService.evaluateConditionalPredicate`

## [4.1.1] - 2023-10-15

### Added

- CI job for building docs

## [4.1.0] - 2023-08-29

### Added

- `formElementsService.fixElementName()`

## [4.0.0] - 2023-07-26

### Added

- `formElementsService.parseDynamicFormElementOptions()`

### Removed

- **[BREAKING]** `formElementsService.parseFormElementOptionsSet()`

## [3.2.0] - 2023-07-03

### Added

- `toAutoLookupElement` to `typeCastService.formElements`

## [3.1.0] - 2023-06-23

### Added

- `formElementsService.determineIsInfoPage()`
- `gov-pay` payment event to payment event check

## [3.0.0] - 2023-06-05

### Removed

- **[BREAKING]** support for NodeJS 14

### Fixed

- Submission value (Non Element) injectable replacement was only replacing first instance in a string

### Added

- Also inject user email with `replaceInjectablesWithElementValues`

## [2.0.0] - 2023-05-08

### Changed

- **[BREAKING]** `submissionService.replaceElementValues()` to `submissionService.replaceInjectablesWithElementValues()`
- **[BREAKING]** `submissionService.replaceCustomValues()` to `submissionService.replaceInjectablesWithSubmissionValues()`

### Added

- **[BREAKING]** required `formatDateTime()` option to `submissionService.getElementSubmissionValue()`, `submissionService.replaceCustomValues()` and `submissionService.replaceElementValues()`

## [1.0.1] - 2023-04-20

### Added

- `@microsoft/eslint-plugin-sdl` eslint plugin

## [1.0.0] - 2023-04-14

### Added

- unit tests for allowing an element to be used twice in a conditional predicate
- support for NodeJS 18

### Removed

- **[BREAKING]** support for NodeJS 12

## [0.4.6] - 2023-03-03

### Added

- `WYSIWYGRegex` to `formElementsService`
- `matchElementsTagRegex` to `formElementsService`
- `replaceElementValues` to `submissionService`

### Changed

- message returned from ABN service when business name isn't found

## [0.4.5] - 2023-02-10

### Added

- `generateFormElementsConditionallyShown` - Dependant option set elements will now return a `dependencyIsLoading?` property

## [0.4.4] - 2022-09-13

### Changed

- Added `emailVerified`, `phoneNumber` and `phoneNumberVerified` values to `UserProfile`

## [0.4.3] - 2022-08-28

## [0.4.2] - 2022-07-29

### Changed

- update `getABNNumberFromABNRecord` to look for `isCurrentIndicator` equal to 'Y'

## [0.4.1] - 2022-06-17

### Added

- type checks to submission data
- `freshdeskDependentField` form element

## [0.4.0] - 2022-04-19

### Added

- `schedulingService`
- `submissionService`
- `paymentService`
- `fileUploadService`
- `'ELEMENT'` based `'NUMERIC'` conditional predicates to allow showing a form element based on the numeric value of another form element

### Removed

- **[BREAKING]** `validatePaymentAmount()` function. Replaced by `paymentService.checkForPaymentEvent()`
- **[BREAKING]** `getContentDisposition()` function. Replaced by `fileUploadService.getContentDisposition()`
- **[BREAKING]** `replaceCustomValues()` function. Moved into `submissionService`
- **[BREAKING]** `getElementSubmissionValue()` function. Moved into `submissionService`
- **[BREAKING]** `conditionalLogicService.evaluateConditionalPredicate()` function.
- **[BREAKING]** `conditionalLogicService.evaluateConditionalOptionsPredicate()` function.

## [0.3.6] - 2022-03-29

### Added

- Payment validation for payments

## [0.3.5] - 2022-03-16

### Fixed

- Removed test script

## [0.3.4] - 2022-03-15

### Added

- `toStorageElement` to `typeCastService.formElements`
- added generateFormElementsConditionallyShown to conditionalLogicService
- added flattenFormElements to formElementService

## [0.3.3] - 2022-01-24

### Added

- contentDisposition function for file upload

## [0.3.2] - 2021-12-21

### Added

- `abnService`

## [0.3.1] - 2021-12-09

### Added

- `abn` element and relating information

## [0.3.0] - 2021-12-02

### Added

- `bsb` and `files` to lookup form elements

### Changed

- **[BREAKING]** `getElementSubmissionValue` `form` parameter to `formElements`

## [0.2.5] - 2021-11-19

### Fixed

- `replaceCustomValues()` only replacing element submission data that is a string

## [0.2.4] - 2021-11-15

### Fixed

- `getElementSubmissionValue` not catering for `'autocomplete'` form elements having no options

## [0.2.3] - 2021-11-11

### Changed

- **[BREAKING]** `getElementSubmissionValue` function to use labels and obey element rules for certain elements

## [0.1.3] - 2021-09-20

### Fixed

- `replaceCustomValues()` adding `"undefined"` to string

## [0.1.2] - 2021-09-08

### Added

- [`userService`](./docs/userService.md)

## [0.1.1] - 2021-09-01

### Added

- `previousApprovalId` to `replaceCustomValues`

## [0.1.0] - 2021-07-20

Initial release
