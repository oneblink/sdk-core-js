import { SubmissionEventTypes } from '@oneblink/types'

/**
 * Converts a Webhook sbuscription into its corresponding Form workflow event
 *
 * @param webhookSubscription The subscription to be converted
 * @returns
 */
function convertToFormWorkflowEvent(
  webhookSubscription: SubmissionEventTypes.WebhookSubscription,
): SubmissionEventTypes.FormWorkflowEvent {
  const url = new URL(webhookSubscription.callbackUrl)
  if (
    url.hostname.endsWith('logic.azure.com') ||
    url.hostname.endsWith('logic.azure.us') ||
    url.hostname.endsWith('api.powerplatform.com')
  ) {
    return {
      type: 'POWER_AUTOMATE_FLOW',
      label: webhookSubscription.label,
      configuration: {
        url: webhookSubscription.callbackUrl,
        formId: webhookSubscription.formId,
      },
    }
  }

  if (url.hostname.endsWith('civicplus.com')) {
    return {
      type: 'CP_INTEGRATION_HUB_WEBHOOK',
      label: webhookSubscription.label,
      configuration: {
        url: webhookSubscription.callbackUrl,
        formId: webhookSubscription.formId,
      },
    }
  }

  return {
    type: 'CALLBACK',
    label: webhookSubscription.label,
    configuration: {
      url: webhookSubscription.callbackUrl,
    },
  }
}

export { convertToFormWorkflowEvent }
