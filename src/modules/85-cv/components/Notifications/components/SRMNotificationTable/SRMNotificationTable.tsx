/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import {
  Text,
  Layout,
  Button,
  Switch,
  Container,
  Icon,
  ButtonVariation,
  TableV2,
  NoDataCard
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import type { CellProps, Renderer } from 'react-table'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import { getIconByNotificationMethod } from '@notifications/Utils/Utils'
import type { NotificationType } from '@notifications/interfaces/Notifications'
import type { NotificationRuleResponse } from 'services/cv'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import RbacButton from '@rbac/components/Button/Button'
import noDataNotifications from '@cv/assets/noDataNotifications.svg'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import ContextMenuActions from '@cv/components/ContextMenuActions/ContextMenuActions'
import { useSRMNotificationModal } from '../useSRMNotificationModal/useSRMNotificationModal'
import type { CustomColumn, NotificationRulesItem, SRMNotificationTableProps } from './SRMNotificationTable.types'
import { SRMNotificationType } from '../../NotificationsContainer.types'
import { getCurrentNotification, NotificationDeleteContext } from './SRMNotificationTable.utils'
import css from './SRMNotificationTable.module.scss'

function SRMNotificationTable(props: SRMNotificationTableProps): React.ReactElement {
  const {
    data: notificationsData,
    onUpdate,
    gotoPage,
    totalPages,
    totalItems,
    pageSize,
    pageIndex,
    notificationRulesComponent,
    handleDeleteNotification,
    handleCreateNotification,
    handleToggleNotification,
    getExistingNotificationNames = (_skipIndex?: number) => []
  } = props
  const { getString } = useStrings()
  const { projectIdentifier } = useParams<ProjectPathProps & { identifier: string }>()

  const { openNotificationModal } = useSRMNotificationModal({
    getExistingNotificationNames,
    notificationRulesComponent,
    handleCreateNotification
  })

  const getAddNotificationButton = (): JSX.Element => (
    <RbacButton
      icon="plus"
      text={getString('cv.notifications.newNotificationRule')}
      variation={ButtonVariation.PRIMARY}
      onClick={() => openNotificationModal()}
      permission={{
        permission: PermissionIdentifier.EDIT_MONITORED_SERVICE,
        resource: {
          resourceType: ResourceType.MONITOREDSERVICE,
          resourceIdentifier: projectIdentifier
        }
      }}
    />
  )

  const RenderColumnEnabled: Renderer<CellProps<NotificationRulesItem>> = ({ row }) => {
    const data = row.original
    const currentNotification = data?.notificationRule
    return (
      <Switch
        checked={(data as any)?.enabled}
        onChange={e => {
          handleToggleNotification({
            identifier: currentNotification?.identifier as string,
            enabled: e.currentTarget.checked
          })
        }}
      />
    )
  }

  const RenderColumnName: Renderer<CellProps<NotificationRulesItem>> = ({ row }) => {
    const data = row.original
    return (
      <Text color={Color.BLACK} lineClamp={1}>
        {data?.notificationRule?.name}
      </Text>
    )
  }

  const RenderColumnCategory: Renderer<CellProps<NotificationRulesItem>> = ({ row }) => {
    const data = row.original
    return (
      <Text color={Color.BLACK} lineClamp={1}>
        {data?.notificationRule?.type === SRMNotificationType.SERVICE_LEVEL_OBJECTIVE ? 'SLO' : 'Service Health'}
      </Text>
    )
  }

  const RenderColumnMethod: Renderer<CellProps<NotificationRulesItem>> = ({ row }) => {
    const data = row.original.notificationRule?.notificationMethod?.type
    return (
      <Layout.Horizontal spacing="small">
        <Icon name={getIconByNotificationMethod(data as NotificationType)} />
        <Text>{data}</Text>
      </Layout.Horizontal>
    )
  }

  const RenderColumnMenu: Renderer<CellProps<NotificationRuleResponse>> = ({ row, column }) => {
    const data = row.original
    const {
      notificationRule: { name, identifier }
    } = data || {}

    const handleEdit = (): void => {
      const currentNotification = getCurrentNotification(data)
      ;(column as any).openNotificationModal?.(currentNotification)
    }

    const handleDelete = (): void => {
      const updatedNotifications = notificationsData.filter(
        notification => notification?.notificationRule?.identifier !== identifier
      )
      handleDeleteNotification(updatedNotifications)
    }

    return (
      <ContextMenuActions
        titleText={getString('cv.notifications.deleteNotification', { name })}
        contentText={<NotificationDeleteContext notificationName={name} />}
        confirmButtonText={getString('yes')}
        deleteLabel={getString('delete')}
        onDelete={handleDelete}
        editLabel={getString('edit')}
        onEdit={handleEdit}
        RbacPermissions={{
          edit: {
            permission: PermissionIdentifier.EDIT_MONITORED_SERVICE,
            resource: {
              resourceType: ResourceType.MONITOREDSERVICE,
              resourceIdentifier: projectIdentifier
            }
          },
          delete: {
            permission: PermissionIdentifier.DELETE_MONITORED_SERVICE,
            resource: {
              resourceType: ResourceType.MONITOREDSERVICE,
              resourceIdentifier: projectIdentifier
            }
          }
        }}
      />
    )
  }

  const columns: CustomColumn<NotificationRuleResponse>[] = useMemo(
    () => [
      {
        Header: getString('enabledLabel').toUpperCase(),
        id: 'enabled',
        className: css.notificationTableHeader,
        accessor: row => row.enabled,
        onUpdate: onUpdate,
        width: '20%',
        Cell: RenderColumnEnabled,
        disableSortBy: true
      },
      {
        Header: getString('cv.notifications.notificationName').toUpperCase(),
        id: 'name',
        className: css.notificationTableHeader,
        accessor: row => row.notificationRule.name,
        width: '25%',
        Cell: RenderColumnName,
        disableSortBy: true
      },
      {
        Header: 'CATEGORY',
        id: 'category',
        className: css.notificationTableHeader,
        width: '25%',
        Cell: RenderColumnCategory,
        disableSortBy: true
      },
      {
        Header: getString('notifications.notificationMethod').toUpperCase(),
        id: 'methods',
        className: css.notificationTableHeader,
        accessor: row => row.notificationRule.type,
        width: '28%',
        Cell: RenderColumnMethod,
        disableSortBy: true
      },
      {
        Header: '',
        id: 'menu',
        className: css.notificationTableHeader,
        width: '2%',
        Cell: RenderColumnMenu,
        onUpdate: onUpdate,
        openNotificationModal: openNotificationModal,
        disableSortBy: true
      }
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onUpdate, openNotificationModal, notificationsData]
  )

  if (!notificationsData.length) {
    return (
      <>
        <NoDataCard
          image={noDataNotifications}
          containerClassName={css.notificationsNoData}
          message={'There are no notifications'}
          button={getAddNotificationButton()}
        />
      </>
    )
  }

  return (
    <>
      <Container>
        <Layout.Horizontal flex className={css.headerActions}>
          <Button
            variation={ButtonVariation.PRIMARY}
            text={getString('notifications.name')}
            icon="plus"
            id="newNotificationBtn"
            onClick={() => openNotificationModal()}
          />
        </Layout.Horizontal>
      </Container>
      <Container padding={{ bottom: 'huge' }} className={css.content}>
        <TableV2<NotificationRuleResponse>
          columns={columns}
          data={notificationsData}
          className={css.notificationTable}
          pagination={{
            itemCount: totalItems,
            pageSize: pageSize,
            pageCount: totalPages,
            pageIndex: pageIndex,
            gotoPage: gotoPage
          }}
        />
      </Container>
    </>
  )
}

export default SRMNotificationTable
