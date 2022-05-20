/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import cx from 'classnames'

import { Layout, Text, Container, Card, CardBody } from '@harness/uicore'
import { FontVariation } from '@harness/design-system'

import { Classes, Menu } from '@blueprintjs/core'
import { Link, useParams } from 'react-router-dom'
import routes from '@common/RouteDefinitions'
import { DashboardType, IDashboard } from '@dashboards/types/DashboardTypes'
import DashboardTags from '@dashboards/components/DashboardTags/DashboardTags'
import RbacMenuItem from '@rbac/components/MenuItem/MenuItem'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'

import { useStrings } from 'framework/strings'

import moduleTagCss from '@dashboards/common/ModuleTags.module.scss'

export interface DashboardCardProps {
  dashboard: IDashboard
  cloneDashboard: (dashboard: IDashboard) => void
  deleteDashboard: (dashboardId: string) => void
  editDashboard: (dashboard: IDashboard) => void
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  dashboard,
  cloneDashboard,
  deleteDashboard,
  editDashboard
}): React.ReactElement => {
  const { getString } = useStrings()
  const { accountId, folderId } = useParams<{ accountId: string; folderId: string }>()
  const [menuOpen, setMenuOpen] = useState(false)

  const onCardMenuInteraction = (nextOpenState: boolean, e?: React.SyntheticEvent<HTMLElement>): void => {
    e?.preventDefault()
    setMenuOpen(nextOpenState)
  }

  const onCloneClick = (event: React.MouseEvent<HTMLElement>): void => {
    event.stopPropagation()
    setMenuOpen(false)
    cloneDashboard(dashboard)
  }

  const onDeleteClick = (event: React.MouseEvent<HTMLElement>): void => {
    event.stopPropagation()
    setMenuOpen(false)
    deleteDashboard(dashboard.id)
  }

  const onEditClick = (event: React.MouseEvent<HTMLElement>): void => {
    event.stopPropagation()
    setMenuOpen(false)
    editDashboard(dashboard)
  }

  const cardPath = routes.toViewCustomDashboard({
    viewId: dashboard.id,
    accountId: accountId,
    folderId: folderId === 'shared' ? 'shared' : dashboard?.resourceIdentifier
  })

  return (
    <Link to={cardPath}>
      <Card interactive className={cx(moduleTagCss.card)}>
        <Container>
          <CardBody.Menu
            menuContent={
              <Menu>
                {dashboard?.type === DashboardType.ACCOUNT && (
                  <RbacMenuItem
                    icon="edit"
                    text={getString('edit')}
                    onClick={onEditClick}
                    permission={{
                      permission: PermissionIdentifier.EDIT_DASHBOARD,
                      resource: {
                        resourceType: ResourceType.DASHBOARDS
                      }
                    }}
                  />
                )}
                <RbacMenuItem
                  icon="duplicate"
                  text={getString('projectCard.clone')}
                  onClick={onCloneClick}
                  permission={{
                    permission: PermissionIdentifier.EDIT_DASHBOARD,
                    resource: {
                      resourceType: ResourceType.DASHBOARDS
                    }
                  }}
                />
                {dashboard?.type === DashboardType.ACCOUNT && (
                  <>
                    <Menu.Divider />
                    <RbacMenuItem
                      icon="trash"
                      text={getString('delete')}
                      onClick={onDeleteClick}
                      permission={{
                        permission: PermissionIdentifier.EDIT_DASHBOARD,
                        resource: {
                          resourceType: ResourceType.DASHBOARDS
                        }
                      }}
                    />
                  </>
                )}
              </Menu>
            }
            menuPopoverProps={{
              className: Classes.DARK,
              isOpen: menuOpen,
              onInteraction: onCardMenuInteraction
            }}
          />
          <Layout.Vertical spacing="large">
            <Text font={{ variation: FontVariation.CARD_TITLE }}>{dashboard?.title}</Text>
            <DashboardTags dashboard={dashboard} />
            {dashboard?.type !== DashboardType.SHARED && (
              <Layout.Horizontal spacing="small">
                <Text
                  icon="eye-open"
                  iconProps={{ padding: { right: 'small' } }}
                  font={{ variation: FontVariation.CARD_TITLE }}
                >
                  {dashboard?.view_count}
                </Text>
                <Text
                  icon="star-empty"
                  iconProps={{ padding: { right: 'small' } }}
                  font={{ variation: FontVariation.CARD_TITLE }}
                >
                  {dashboard?.favorite_count}
                </Text>
              </Layout.Horizontal>
            )}
          </Layout.Vertical>
        </Container>
      </Card>
    </Link>
  )
}

export default DashboardCard
