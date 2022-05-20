/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { MultiSelectOption, SelectOption } from '@harness/uicore'
import { v4 as uuid } from 'uuid'
import type {
  NotificationRuleRefDTO,
  NotificationRuleResponse,
  RestResponseNotificationRuleResponse
} from 'services/cv'
import type { NotificationToToggle } from '@cv/pages/slos/components/CVCreateSLO/components/CreateSLOForm/components/SLOTargetAndBudgetPolicy/SLOTargetAndBudgetPolicy.types'
import { defaultOption } from './NotificationsContainer.constants'
import type { NotificationRule, SRMNotification } from './NotificationsContainer.types'

export const createNotificationRule = (): NotificationRule => {
  return {
    id: uuid(),
    condition: null
  }
}

export function getUpdatedNotificationRules({
  conditions,
  notificationRule,
  currentField,
  currentFieldValue,
  nextField,
  nextFieldValue
}: {
  conditions: NotificationRule[]
  notificationRule: NotificationRule
  currentField: string
  currentFieldValue: string | SelectOption | MultiSelectOption[]
  nextField?: string
  nextFieldValue?: string | SelectOption | MultiSelectOption[]
}): NotificationRule[] {
  return conditions.map(el => {
    if (el.id === notificationRule.id) {
      return {
        ...el,
        [currentField]: currentFieldValue,
        ...(nextField && { [nextField]: nextFieldValue ?? defaultOption })
      }
    } else return el
  })
}

export function isNotificationEdited(
  notificationRuleRefs: NotificationRuleRefDTO[],
  latestNotificationIdentifer: string
): boolean {
  return notificationRuleRefs.some(
    notificationRuleRef => notificationRuleRef?.notificationRuleRef === latestNotificationIdentifer
  )
}

export function toggleNotification(
  notificationToToggle: NotificationToToggle,
  notificationsInTable: NotificationRuleResponse[]
): NotificationRuleResponse[] {
  return notificationsInTable.map(el => {
    if (el?.notificationRule?.identifier === notificationToToggle?.identifier) {
      return {
        ...el,
        enabled: !!notificationToToggle?.enabled
      }
    } else return el
  })
}

export function getUpdatedNotifications(
  latestNotification: RestResponseNotificationRuleResponse,
  notificationsInTable: NotificationRuleResponse[]
): NotificationRuleResponse[] {
  let updatedNotificationsInTable: NotificationRuleResponse[] = []
  const latestNotificationData = latestNotification?.resource as NotificationRuleResponse
  const latestNotificationIdentifier = latestNotification?.resource?.notificationRule?.identifier || ''

  if (!notificationsInTable.length) {
    // first time create
    updatedNotificationsInTable = [latestNotificationData]
  } else if (
    notificationsInTable.some(
      notificationInTable => notificationInTable?.notificationRule?.identifier === latestNotificationIdentifier
    )
  ) {
    // edit notification
    updatedNotificationsInTable = notificationsInTable.map(el => {
      if (el?.notificationRule?.identifier === latestNotificationIdentifier) {
        return {
          ...latestNotificationData,
          enabled: el?.enabled
        }
      } else {
        return el
      }
    })
  } else {
    // creation of notification
    updatedNotificationsInTable = [latestNotificationData, ...notificationsInTable]
  }

  return updatedNotificationsInTable
}

export function getUpdatedNotificationsRuleRefs(
  updatedNotificationsInTable: NotificationRuleResponse[]
): NotificationRuleRefDTO[] {
  return updatedNotificationsInTable.map(el => {
    return {
      enabled: !!el?.enabled,
      notificationRuleRef: el?.notificationRule?.identifier
    }
  })
}

export const getInitialNotificationRules = (prevStepData?: SRMNotification): NotificationRule[] => {
  return (prevStepData?.conditions as NotificationRule[]) || [createNotificationRule()]
}
