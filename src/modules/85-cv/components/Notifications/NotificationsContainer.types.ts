/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { StepProps, SelectOption, MultiSelectOption } from '@harness/uicore'
import type { GetDataError } from 'restful-react'
import type { NotificationToToggle } from '@cv/pages/slos/components/CVCreateSLO/components/CreateSLOForm/components/SLOTargetAndBudgetPolicy/SLOTargetAndBudgetPolicy.types'
import type {
  CVNGNotificationChannel,
  NotificationRuleDTO,
  NotificationRuleResponse,
  RestResponseNotificationRuleResponse
} from 'services/cv'

export interface NotificationsContainerProps {
  children: JSX.Element
  type: SRMNotificationType
  notificationsInTable: NotificationRuleResponse[]
  handleDeleteNotification: (notifications: NotificationRuleResponse[]) => void
  handleCreateNotification: (latestNotification: RestResponseNotificationRuleResponse) => void
  handleToggleNotification: (notificationToToggle: NotificationToToggle) => void
  setPage: (index: number) => void
  loading: boolean
  error: GetDataError<unknown> | null
  page: number
  getNotifications: () => Promise<void>
}

export type ConfigureMonitoredServiceAlertConditionsProps = StepProps<SRMNotification>

export type ConfigureSLOAlertConditionsProps = StepProps<SRMNotification>

export type NotificationConditions = StepProps<SRMNotification> & {
  conditions?: NotificationConditionRow[]
}

export interface NotificationRule {
  id: string
  condition: SelectOption | null
  changeType?: MultiSelectOption[]
  duration?: string | SelectOption
  lookBackDuration?: string | SelectOption
  value?: string | SelectOption
  threshold?: string
}

export interface SRMNotification {
  identifier?: string
  enabled?: boolean
  name?: string
  notificationMethod?: CVNGNotificationChannel
  conditions?: NotificationConditionRow[]
  type: NotificationRuleDTO['type']
}
export interface NotificationConditionRow {
  [key: string]: any
}

export interface NotificationRulesItem {
  index: number
  conditions: SRMNotification
}

export enum SRMNotificationType {
  MONITORED_SERVICE = 'MonitoredService',
  SERVICE_LEVEL_OBJECTIVE = 'ServiceLevelObjective'
}
