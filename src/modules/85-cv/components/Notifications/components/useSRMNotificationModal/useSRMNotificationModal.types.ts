import type { RestResponseNotificationRuleResponse } from 'services/cv'
import type { SRMNotification } from '../../NotificationsContainer.types'

export interface UseNotificationModalProps {
  onCloseModal?: () => void
  getExistingNotificationNames?: (skipIndex?: number) => string[]
  notificationRulesComponent: JSX.Element
  handleCreateNotification: (latestNotification: RestResponseNotificationRuleResponse) => void
}

export interface UseNotificationModalReturn {
  openNotificationModal: (NotificationRules?: SRMNotification, index?: number) => void
  closeNotificationModal: () => void
}
