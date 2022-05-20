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
import { useStrings, String } from 'framework/strings'
import { DeleteSegmentQueryParams, GetSegmentQueryParams, useDeleteSegment, useGetSegment } from 'services/cf'
import routes from '@common/RouteDefinitions'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { PageSpinner, useToaster } from '@common/components'
import { formatDate, formatTime, getErrorMessage, showToaster } from '@cf/utils/CFUtils'
import { useSyncedEnvironment } from '@cf/hooks/useSyncedEnvironment'
import { useConfirmAction } from '@common/hooks'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { DetailPageTemplate } from '@cf/components/DetailPageTemplate/DetailPageTemplate'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import useActiveEnvironment from '@cf/hooks/useActiveEnvironment'
import usePlanEnforcement from '@cf/hooks/usePlanEnforcement'
import TargetManagementToolbar from '@cf/components/TargetManagementToolbar/TargetManagementToolbar'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { useFFGitSyncContext } from '@cf/contexts/ff-git-sync-context/FFGitSyncContext'
import { FlagsUseSegment } from './flags-use-segment/FlagsUseSegment'
import { SegmentSettings } from './segment-settings/SegmentSettings'

import css from './SegmentDetailPage.module.scss'

export const SegmentDetailPage: React.FC = () => {
  const { getString } = useStrings()
  const { showError, clear } = useToaster()
  const {
    accountId: accountIdentifier,
    orgIdentifier,
    projectIdentifier,
    segmentIdentifier
  } = useParams<Record<string, string>>()
  const { activeEnvironment: environmentIdentifier, withActiveEnvironment } = useActiveEnvironment()
  const {
    data: segment,
    loading: segmentLoading,
    refetch,
    error: segmentError
  } = useGetSegment({
    identifier: segmentIdentifier,
    queryParams: {
      accountIdentifier,
      orgIdentifier,
      projectIdentifier,
      environmentIdentifier
    } as GetSegmentQueryParams
  })
  const {
    data: envData,
    loading: envLoading,
    error: envError,
    refetch: envRefetch
  } = useSyncedEnvironment({
    accountId: accountIdentifier,
    orgIdentifier,
    projectIdentifier,
    environmentIdentifier
  })
  const label = `${getString('cf.shared.targetManagement')}: ${getString('cf.shared.segments')}`
  const breadcrumbs = [
    {
      label,
      url: withActiveEnvironment(
        routes.toCFSegments({
          accountId: accountIdentifier,
          orgIdentifier,
          projectIdentifier
        })
      )
    }
  ]
  const history = useHistory()
  const { mutate: deleteSegment } = useDeleteSegment({
    queryParams: {
      projectIdentifier,
      environmentIdentifier: segment?.environment as string,
      accountIdentifier,
      orgIdentifier
    } as DeleteSegmentQueryParams
  })

  const { isPlanEnforcementEnabled } = usePlanEnforcement()
  const planEnforcementProps = isPlanEnforcementEnabled
    ? {
        featuresProps: {
          featuresRequest: {
            featureNames: [FeatureIdentifier.MAUS]
          }
        }
      }
    : undefined

  const deleteSegmentConfirm = useConfirmAction({
    title: getString('cf.segments.delete.title'),
    message: <String useRichText stringID="cf.segments.delete.message" vars={{ name: segment?.name }} />,
    intent: Intent.DANGER,
    action: async () => {
      clear()

      try {
        deleteSegment(segment?.identifier as string)
          .then(() => {
            history.push(
              routes.toCFSegments({
                projectIdentifier,
                orgIdentifier,
                accountId: accountIdentifier
              })
            )
            showToaster(getString('cf.messages.segmentDeleted'))
          })
          .catch(error => {
            showError(getErrorMessage(error), 0, 'cf.delete.segment.error')
          })
      } catch (error) {
        showError(getErrorMessage(error), 0, 'cf.delete.segment.error')
      }
    }
  })

  useDocumentTitle(label)

  const gitSync = useFFGitSyncContext()

  const loading = segmentLoading || envLoading
  const error = segmentError || envError

  if (loading) {
    if (!segment) {
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
          envRefetch()
          refetch()
        }}
      />
    )

    if (!segment) {
      return ErrorComponent
    }

    return <Container className={css.fullSizeContentStyle}>{ErrorComponent}</Container>
  }

  return (
    <DetailPageTemplate
      breadcrumbs={breadcrumbs}
      title={segment?.name}
      subTitle={getString('cf.targetDetail.createdOnDate', {
        date: formatDate(segment?.createdAt as number),
        time: formatTime(segment?.createdAt as number)
      })}
      identifier={segment?.identifier}
      menuItems={[
        {
          icon: 'cross',
          text: getString('delete'),
          onClick: deleteSegmentConfirm,
          permission: {
            resource: { resourceType: ResourceType.ENVIRONMENT, resourceIdentifier: environmentIdentifier },
            permission: PermissionIdentifier.DELETE_FF_TARGETGROUP
          },
          ...planEnforcementProps
        }
      ]}
      metaData={{ environment: envData?.data?.name as string }}
    >
      <Layout.Vertical height="100%" className={css.gitSyncContainer}>
        {gitSync.isGitSyncActionsEnabled && <TargetManagementToolbar />}
        <Layout.Horizontal height="100%">
          <FlagsUseSegment gitSync={gitSync} />
          <SegmentSettings onUpdate={refetch} segment={segment} />
        </Layout.Horizontal>
      </Layout.Vertical>
    </DetailPageTemplate>
  )
}
