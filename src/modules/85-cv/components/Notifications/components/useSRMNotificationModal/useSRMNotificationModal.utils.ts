import type { CVNGNotificationChannel, NotificationRuleCondition, NotificationRuleDTORequestBody } from 'services/cv'
import { defaultOption } from '../../NotificationsContainer.constants'
import type { NotificationConditionRow, SRMNotification } from '../../NotificationsContainer.types'
import type { ChangeType } from '../ConfigureMonitoredServiceAlertConditions/ConfigureMonitoredServiceAlertConditions.constants'

export const createNotificationsPayload = (
  orgIdentifier: string,
  projectIdentifier: string,
  wizardData: SRMNotification
): NotificationRuleDTORequestBody => {
  const { conditions, name, notificationMethod, type } = wizardData || {}
  const updatedConditions = getNotificationConditions(conditions)

  return {
    conditions: updatedConditions,
    //TODO identifier should not required in post call
    identifier: name as string,
    name: name as string,
    notificationMethod: notificationMethod as CVNGNotificationChannel,
    orgIdentifier,
    projectIdentifier,
    type
  }
}

export function getNotificationConditions(conditions?: NotificationConditionRow[]): NotificationRuleCondition[] {
  return (
    conditions?.map(el => {
      return {
        type: el?.condition?.value,
        spec: {
          ...(el.lookBackDuration &&
            el.lookBackDuration !== defaultOption && { lookBackDuration: `${el?.lookBackDuration}m` }),
          ...(el.threshold && el.threshold !== defaultOption && { threshold: el.threshold }),
          ...(el.duration && el.duration !== defaultOption && { period: `${el.duration}m` }),
          ...(el.changeType &&
            el.changeType !== defaultOption && {
              changeEventTypes: el.changeType.map((element: { value: ChangeType }) => element.value)
            })
        }
      }
    }) || []
  )
}
