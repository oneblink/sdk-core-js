import { describe, expect, test } from 'vitest'
import { WebhookSubscription } from '@oneblink/types/typescript/submissionEvents'
import { convertToFormWorkflowEvent } from '../src/webhookSubscriptionService'

describe('convert webhook subscriptions', () => {
  test('should return power automate for logic.azure.com', () => {
    const subscription: WebhookSubscription = {
      id: 1,
      createdAt: new Date().toISOString(),
      callbackUrl: 'https://prod-38.westus.logic.azure.com/workflows/123',
      organisationId: 'abc123',
      keyId: 'zyx987',
    }
    const result = convertToFormWorkflowEvent(subscription)
    expect(result.type).toEqual('POWER_AUTOMATE_FLOW')
  })
  test('should return power automate for logic.azure.us', () => {
    const subscription: WebhookSubscription = {
      id: 1,
      createdAt: new Date().toISOString(),
      callbackUrl: 'https://prod-28.usgovtexas.logic.azure.us/workflows/123',
      organisationId: 'abc123',
      keyId: 'zyx987',
    }
    const result = convertToFormWorkflowEvent(subscription)
    expect(result.type).toEqual('POWER_AUTOMATE_FLOW')
  })
  test('should return civicplus integration hub for civicplus.com', () => {
    const subscription: WebhookSubscription = {
      id: 1,
      createdAt: new Date().toISOString(),
      callbackUrl: 'https://prod.civicplus.com/workflows/123',
      organisationId: 'abc123',
      keyId: 'zyx987',
    }
    const result = convertToFormWorkflowEvent(subscription)
    expect(result.type).toEqual('CP_INTEGRATION_HUB_WEBHOOK')
  })
  test('should return CALLBACK for testdomain.com', () => {
    const subscription: WebhookSubscription = {
      id: 1,
      createdAt: new Date().toISOString(),
      callbackUrl: 'https://prod.testdomain.com/workflows/123',
      organisationId: 'abc123',
      keyId: 'zyx987',
    }
    const result = convertToFormWorkflowEvent(subscription)
    expect(result.type).toEqual('CALLBACK')
  })
})
