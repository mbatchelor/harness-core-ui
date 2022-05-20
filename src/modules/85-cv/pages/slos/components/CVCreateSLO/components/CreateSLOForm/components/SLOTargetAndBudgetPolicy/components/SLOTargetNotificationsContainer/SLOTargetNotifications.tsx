import React, { useCallback, useEffect, useState } from 'react'
import type { GetDataError } from 'restful-react'
import NotificationsContainer from '@cv/components/Notifications/NotificationsContainer'
import { SRMNotificationType } from '@cv/components/Notifications/NotificationsContainer.types'
import { SLOFormFields } from '@cv/pages/slos/components/CVCreateSLO/CVCreateSLO.types'
import {
  getUpdatedNotifications,
  getUpdatedNotificationsRuleRefs,
  toggleNotification
} from '@cv/components/Notifications/NotificationsContainer.utils'
import type { RestResponseNotificationRuleResponse, NotificationRuleResponse } from 'services/cv'
import ConfigureSLOAlertConditions from '@cv/components/Notifications/components/ConfigureSLOAlertConditions/ConfigureSLOAlertConditions'
import { useStrings } from 'framework/strings'
import type { NotificationToToggle } from '../../SLOTargetAndBudgetPolicy.types'

interface SLOTargetNotificationsProps {
  setFieldValue: (field: string, value: any) => void
  setPage: (index: number) => void
  initialNotificationsTableData: NotificationRuleResponse[]
  loading: boolean
  error: GetDataError<unknown> | null
  page: number
  getNotifications: () => Promise<void>
}

export default function SLOTargetNotifications(props: SLOTargetNotificationsProps): JSX.Element {
  const { setFieldValue, initialNotificationsTableData, setPage, loading, error, page, getNotifications } = props
  const [notificationsInTable, setNotificationsInTable] = useState<NotificationRuleResponse[]>([])
  const { getString } = useStrings()

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
      type={SRMNotificationType.SERVICE_LEVEL_OBJECTIVE}
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
      <ConfigureSLOAlertConditions name={getString('conditions')} />
    </NotificationsContainer>
  )
}
