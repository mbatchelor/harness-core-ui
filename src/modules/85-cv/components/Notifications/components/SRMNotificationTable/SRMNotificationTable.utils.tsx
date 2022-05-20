import { v4 as uuid } from 'uuid'
import React from 'react'
import { Color, Layout, Text } from '@harness/uicore'
import type { NotificationRuleResponse } from 'services/cv'
import { useStrings } from 'framework/strings'
import ImageDeleteService from '@cv/assets/delete-service.svg'
import { SRMNotification, SRMNotificationType } from '../../NotificationsContainer.types'
import { sloConditionOptions } from '../SLONotificationRuleRow/SLONotificationRuleRow.constants'
import {
  changeTypeOptions,
  conditionOptions
} from '../ConfigureMonitoredServiceAlertConditions/ConfigureMonitoredServiceAlertConditions.constants'

export function getCurrentNotification(data: NotificationRuleResponse): SRMNotification {
  let currentConditions = []
  if (data?.notificationRule?.type === SRMNotificationType.SERVICE_LEVEL_OBJECTIVE) {
    currentConditions = data?.notificationRule?.conditions?.map(condition => {
      return {
        id: uuid(),
        condition: sloConditionOptions.find(el => el.value === condition?.type),
        threshold: condition?.spec?.threshold,
        ...(condition?.spec?.lookBackDuration && {
          lookBackDuration: condition?.spec?.lookBackDuration?.replace('m', '')
        })
      }
    })
  } else if (data?.notificationRule?.type === SRMNotificationType.MONITORED_SERVICE) {
    currentConditions = data?.notificationRule?.conditions?.map(condition => {
      return {
        id: uuid(),
        condition: conditionOptions.find(el => el.value === condition?.type),
        threshold: condition?.spec?.threshold,
        ...(condition?.spec?.period && {
          duration: condition?.spec?.period?.replace('m', '')
        }),
        ...(condition?.spec?.changeEventTypes &&
          condition?.spec?.changeEventTypes.length && {
            changeType: condition?.spec?.changeEventTypes?.map((changeEventType: string | number | symbol) =>
              changeTypeOptions.find(changeTypeOption => changeTypeOption.value === changeEventType)
            )
          })
      }
    })
  }

  return { ...data?.notificationRule, conditions: currentConditions }
}

export const NotificationDeleteContext = ({ notificationName }: { notificationName?: string }): JSX.Element => {
  const { getString } = useStrings()

  return (
    <Layout.Horizontal flex={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <Text color={Color.GREY_800}>
        {getString('cv.notifications.deleteNotificationWarning', { name: notificationName })}
      </Text>
      <div>
        <img src={ImageDeleteService} width="204px" height="202px" />
      </div>
    </Layout.Horizontal>
  )
}
