/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { MultiSelectOption, SelectOption } from '@harness/uicore'
import type { NotificationRule } from '../../NotificationsContainer.types'

export interface NotificationRuleRowProps {
  notificationRule: NotificationRule
  showDeleteNotificationsIcon: boolean
  handleChangeField: (
    notificationRule: NotificationRule,
    currentFieldValue: SelectOption | MultiSelectOption[] | string,
    currentField: string,
    nextField?: string,
    nextFieldValue?: SelectOption | MultiSelectOption[] | string
  ) => void
  handleDeleteNotificationRule: (id: string) => void
}
