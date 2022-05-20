import React, { useCallback, useEffect, useState } from 'react'
import type { GetDataError } from 'restful-react'
import {
  getUpdatedNotifications,
  getUpdatedNotificationsRuleRefs,
  toggleNotification
} from '@cv/components/Notifications/NotificationsContainer.utils'
import type { NotificationToToggle } from '@cv/pages/slos/components/CVCreateSLO/components/CreateSLOForm/components/SLOTargetAndBudgetPolicy/SLOTargetAndBudgetPolicy.types'
import { SLOFormFields } from '@cv/pages/slos/components/CVCreateSLO/CVCreateSLO.types'
import type { NotificationRuleResponse, RestResponseNotificationRuleResponse } from 'services/cv'
import NotificationsContainer from '@cv/components/Notifications/NotificationsContainer'
import ConfigureMonitoredServiceAlertConditions from '@cv/components/Notifications/components/ConfigureMonitoredServiceAlertConditions/ConfigureMonitoredServiceAlertConditions'
import { SRMNotificationType } from '@cv/components/Notifications/NotificationsContainer.types'

interface MonitoredServiceNotificationsProps {
  setFieldValue: (field: string, value: any) => void
  setPage: (index: number) => void
  initialNotificationsTableData: NotificationRuleResponse[]
  loading: boolean
  error: GetDataError<unknown> | null
  page: number
  getNotifications: () => Promise<void>
}

export default function MonitoredServiceNotifications(props: MonitoredServiceNotificationsProps): JSX.Element {
  const { setFieldValue, initialNotificationsTableData, setPage, loading, error, page, getNotifications } = props
  const [notificationsInTable, setNotificationsInTable] = useState<NotificationRuleResponse[]>([])

  useEffect(() => {
    if (!notificationsInTable.length && initialNotificationsTableData.length) {
      setNotificationsInTable(initialNotificationsTableData)
    }
  }, [initialNotificationsTableData, notificationsInTable.length])

  const handleCreateNotification = useCallback(
    (latestNotification: RestResponseNotificationRuleResponse) => {
      const updatedNotificationsInTable = getUpdatedNotifications(
        latestNotification,
        notificationsInTable as NotificationRuleResponse[]
      )
      const updatedNotificationRuleRefs = getUpdatedNotificationsRuleRefs(updatedNotificationsInTable)
      setNotificationsInTable(updatedNotificationsInTable)
      setFieldValue(SLOFormFields.NOTIFICATION_RULE_REFS, updatedNotificationRuleRefs)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notificationsInTable]
  )

  const handleDeleteNotification = useCallback((updatedNotifications: NotificationRuleResponse[]) => {
    const updatedNotificationRuleRefs = getUpdatedNotificationsRuleRefs(updatedNotifications)
    setNotificationsInTable(updatedNotifications)
    setFieldValue(SLOFormFields.NOTIFICATION_RULE_REFS, updatedNotificationRuleRefs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggleNotification = useCallback(
    (notificationToToggle: NotificationToToggle) => {
      const updatedNotificationsInTable = toggleNotification(
        notificationToToggle,
        notificationsInTable as NotificationRuleResponse[]
      )
      const updatedNotificationRuleRefs = getUpdatedNotificationsRuleRefs(updatedNotificationsInTable)
      setNotificationsInTable(updatedNotificationsInTable)
      setFieldValue(SLOFormFields.NOTIFICATION_RULE_REFS, updatedNotificationRuleRefs)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [notificationsInTable]
  )

  return (
    <NotificationsContainer
      type={SRMNotificationType.MONITORED_SERVICE}
      handleDeleteNotification={handleDeleteNotification}
      handleCreateNotification={handleCreateNotification}
      handleToggleNotification={handleToggleNotification}
      notificationsInTable={notificationsInTable as NotificationRuleResponse[]}
      setPage={setPage}
      page={page}
      loading={loading}
      error={error}
      getNotifications={getNotifications}
    >
      <ConfigureMonitoredServiceAlertConditions name={'Conditions'} />
    </NotificationsContainer>
  )
}
