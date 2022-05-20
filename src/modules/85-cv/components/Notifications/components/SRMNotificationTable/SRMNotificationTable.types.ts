/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { Column } from 'react-table'
import type { NotificationToToggle } from '@cv/pages/slos/components/CVCreateSLO/components/CreateSLOForm/components/SLOTargetAndBudgetPolicy/SLOTargetAndBudgetPolicy.types'
import type { NotificationRuleResponse, RestResponseNotificationRuleResponse } from 'services/cv'
import type { SRMNotification } from '../../NotificationsContainer.types'

export interface SRMNotificationTableProps {
  data: NotificationRuleResponse[]
  onUpdate?: (data?: NotificationRulesItem, action?: any, closeModal?: () => void) => void
  gotoPage: (index: number) => void
  totalPages: number
  totalItems: number
  pageItemCount?: number
  pageSize: number
  pageIndex: number
  getExistingNotificationNames?: (skipIndex?: number) => string[]
  notificationRulesComponent: JSX.Element
  handleDeleteNotification: (notifications: NotificationRuleResponse[]) => void
  handleCreateNotification: (latestNotification: RestResponseNotificationRuleResponse) => void
  handleToggleNotification: (notificationToToggle: NotificationToToggle) => void
}

export type CustomColumn<T extends Record<string, any>> = Column<T> & {
  onUpdate?: (data: NotificationRulesItem) => void
}

export interface NotificationRulesItem {
  index: number
  notificationRule: SRMNotification
}
