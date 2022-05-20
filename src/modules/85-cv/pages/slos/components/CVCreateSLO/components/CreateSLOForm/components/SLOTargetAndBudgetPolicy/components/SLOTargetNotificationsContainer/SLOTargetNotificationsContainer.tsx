import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import { NotificationRuleRefDTO, useGetNotificationRulesForSLO } from 'services/cv'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { GET_NOTIFICATIONS_PAGE_SIZE } from '@cv/components/Notifications/NotificationsContainer.constants'
import SLOTargetNotifications from './SLOTargetNotifications'

interface SLOTargetNotificationsContainerProps {
  notificationRuleRefs?: NotificationRuleRefDTO[]
  setFieldValue: (field: string, value: any) => void
  identifier: string
}

export default function SLOTargetNotificationsContainer(props: SLOTargetNotificationsContainerProps): JSX.Element {
  const { setFieldValue, identifier } = props
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const [page, setPage] = useState(0)

  const {
    data,
    loading,
    error,
    refetch: getNotifications
  } = useGetNotificationRulesForSLO({
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
    <SLOTargetNotifications
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
