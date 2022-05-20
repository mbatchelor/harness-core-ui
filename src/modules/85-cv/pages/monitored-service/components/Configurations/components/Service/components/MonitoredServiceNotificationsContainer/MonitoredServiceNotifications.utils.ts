import type { NotificationRuleResponse } from 'services/cv'

export function getInitialNotificationsTableData(
  initialNotificationsTableData: NotificationRuleResponse[]
): NotificationRuleResponse[] {
  if (Array.isArray(initialNotificationsTableData) && initialNotificationsTableData.length) {
    return [...initialNotificationsTableData]
  } else return []
}
