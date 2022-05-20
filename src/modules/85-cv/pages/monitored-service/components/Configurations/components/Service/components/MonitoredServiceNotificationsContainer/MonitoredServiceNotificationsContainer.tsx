import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { NotificationRuleRefDTO, useGetNotificationRulesForMonitoredService } from 'services/cv'
import { GET_NOTIFICATIONS_PAGE_SIZE } from '@cv/components/Notifications/NotificationsContainer.constants'
import MonitoredServiceNotifications from './MonitoredServiceNotifications'

interface MonitoredServiceNotificationsProps {
  notificationRuleRefs?: NotificationRuleRefDTO[]
  setFieldValue: (field: string, value: any) => void
  identifier: string
}

export default function MonitoredServiceNotificationsContainer(props: MonitoredServiceNotificationsProps): JSX.Element {
  const { setFieldValue, identifier } = props
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const [page, setPage] = useState(0)

  const {
    data,
    loading,
    error,
    refetch: getNotifications
  } = useGetNotificationRulesForMonitoredService({
    queryParams: {
      accountId,
      orgIdentifier,
      projectIdentifier,
      pageNumber: page,
      pageSize: GET_NOTIFICATIONS_PAGE_SIZE
    },
    identifier
  })

  return (
    <MonitoredServiceNotifications
      setFieldValue={setFieldValue}
      initialNotificationsTableData={data?.data?.content || []}
      setPage={setPage}
      page={page}
      loading={loading}
      error={error}
      getNotifications={getNotifications}
    />
  )
}
