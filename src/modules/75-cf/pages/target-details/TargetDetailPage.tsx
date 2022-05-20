/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { Container, Layout, PageError } from '@wings-software/uicore'
import { Intent } from '@harness/design-system'
import { String, useStrings } from 'framework/strings'
import { DeleteTargetQueryParams, GetTargetQueryParams, Target, useDeleteTarget, useGetTarget } from 'services/cf'
import routes from '@common/RouteDefinitions'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { PageSpinner, useToaster } from '@common/components'
import { formatDate, formatTime, getErrorMessage, showToaster } from '@cf/utils/CFUtils'
import { useConfirmAction } from '@common/hooks'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { useGetEnvironment } from 'services/cd-ng'
import { DetailPageTemplate } from '@cf/components/DetailPageTemplate/DetailPageTemplate'
import useActiveEnvironment from '@cf/hooks/useActiveEnvironment'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import TargetManagementToolbar from '@cf/components/TargetManagementToolbar/TargetManagementToolbar'

import { useFFGitSyncContext } from '@cf/contexts/ff-git-sync-context/FFGitSyncContext'
import { TargetSettings } from './target-settings/TargetSettings'
import { FlagSettings } from './flag-settings/FlagSettings'

import css from './TargetDetailPage.module.scss'

export const TargetDetailPage: React.FC = () => {
  const { getString } = useStrings()
  const { showError, clear } = useToaster()
  const {
    accountId: accountIdentifier,
    orgIdentifier,
    projectIdentifier,
    targetIdentifier
  } = useParams<Record<string, string>>()
  const { activeEnvironment: environmentIdentifier, withActiveEnvironment } = useActiveEnvironment()
  const {
    data: target,
    loading,
    refetch,
    error
  } = useGetTarget({
    identifier: targetIdentifier,
    queryParams: {
      accountIdentifier,
      orgIdentifier,
      projectIdentifier,
      environmentIdentifier
    } as GetTargetQueryParams
  })

  const label = `${getString('cf.shared.targetManagement')}: ${getString('pipeline.targets.title')}`
  const breadcrumbs = [
    {
      label,
      url: withActiveEnvironment(
        routes.toCFTargets({
          accountId: accountIdentifier,
          orgIdentifier,
          projectIdentifier
        })
      )
    }
  ]
  const history = useHistory()
  const { mutate: deleteTarget } = useDeleteTarget({
    queryParams: {
      projectIdentifier,
      environmentIdentifier: target?.environment as string,
      accountIdentifier,
      orgIdentifier
    } as DeleteTargetQueryParams
  })

  const { data: environment } = useGetEnvironment({
    environmentIdentifier,
    queryParams: {
      accountId: accountIdentifier,
      projectIdentifier,
      orgIdentifier
    }
  })

  const deleteTargetConfirm = useConfirmAction({
    title: getString('cf.targets.deleteTarget'),
    message: <String stringID="cf.targets.deleteTargetMessage" vars={{ name: target?.name }} useRichText />,
    intent: Intent.DANGER,
    action: async () => {
      clear()

      try {
        deleteTarget(target?.identifier as string)
          .then(() => {
            history.push(
              withActiveEnvironment(
                routes.toCFTargets({
                  projectIdentifier,
                  orgIdentifier,
                  accountId: accountIdentifier
                })
              )
            )
            showToaster(getString('cf.messages.targetDeleted'))
          })
          .catch(_error => {
            showError(getErrorMessage(_error), 0, 'cf.delete.target.error')
          })
      } catch (_error) {
        showError(getErrorMessage(_error), 0, 'cf.delete.target.error')
      }
    }
  })

  const gitSync = useFFGitSyncContext()

  useDocumentTitle(label)

  if (loading) {
    if (!target) {
      return <PageSpinner />
    }

    return (
      <Container className={css.fullSizeContentStyle}>
        <ContainerSpinner />
      </Container>
    )
  }

  if (error) {
    const ErrorComponent = (
      <PageError
        message={getErrorMessage(error)}
        onClick={() => {
          refetch()
        }}
      />
    )

    if (!target) {
      return ErrorComponent
    }

    return <Container className={css.fullSizeContentStyle}>{ErrorComponent}</Container>
  }

  return (
    <DetailPageTemplate
      menuItems={[
        {
          icon: 'cross',
          text: getString('delete'),
          onClick: deleteTargetConfirm,
          permission: {
            resource: { resourceType: ResourceType.ENVIRONMENT, resourceIdentifier: environmentIdentifier },
            permission: PermissionIdentifier.DELETE_FF_TARGETGROUP
          }
        }
      ]}
      breadcrumbs={breadcrumbs}
      title={target?.name}
      subTitle={getString('cf.targetDetail.createdOnDate', {
        date: formatDate(target?.createdAt as number),
        time: formatTime(target?.createdAt as number)
      })}
      identifier={target?.identifier}
      metaData={{ environment: environment?.data?.name as string }}
    >
      <Layout.Vertical height="100%" className={css.gitSyncContainer}>
        {gitSync.isGitSyncActionsEnabled && <TargetManagementToolbar />}
        <Layout.Horizontal height="100%">
          <TargetSettings target={target as Target} />
          <FlagSettings target={target} gitSync={gitSync} />
        </Layout.Horizontal>
      </Layout.Vertical>
    </DetailPageTemplate>
  )
}
