/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { useToaster, Text } from '@wings-software/uicore'
import { Intent } from '@harness/design-system'
import { useModalHook } from '@harness/use-modal'
import type { MutateRequestOptions } from 'restful-react/dist/Mutate'
import { useStrings } from 'framework/strings'
import routes from '@common/RouteDefinitions'
import type { DeleteFeatureFlagQueryParams, Feature, GitSyncErrorResponse } from 'services/cf'
import { useConfirmAction, useQueryParams } from '@common/hooks'
import { GitSyncFormValues, GIT_SYNC_ERROR_CODE, UseGitSync } from '@cf/hooks/useGitSync'
import { getErrorMessage, showToaster } from '@cf/utils/CFUtils'
import SaveFlagToGitModal from '../../SaveFlagToGitModal/SaveFlagToGitModal'

interface UseDeleteFlagModalProps {
  featureFlag: Feature
  gitSync: UseGitSync
  deleteFeatureFlag: (
    data: string,
    mutateRequestOptions?: MutateRequestOptions<DeleteFeatureFlagQueryParams, void> | undefined
  ) => void
  queryParams: DeleteFeatureFlagQueryParams
}

interface UseDeleteFlagModalReturn {
  confirmDeleteFlag: () => void
}

const useDeleteFlagModal = (props: UseDeleteFlagModalProps): UseDeleteFlagModalReturn => {
  const { featureFlag, gitSync, queryParams, deleteFeatureFlag } = props
  const { gitSyncInitialValues, gitSyncValidationSchema } = gitSync.getGitSyncFormMeta()

  const urlQuery: Record<string, string> = useQueryParams()
  const { projectIdentifier, orgIdentifier, accountId } = useParams<Record<string, string>>()

  const { showError } = useToaster()
  const { getString } = useStrings()
  const history = useHistory()

  const featureFlagListURL =
    routes.toCFFeatureFlags({
      projectIdentifier: projectIdentifier,
      orgIdentifier: orgIdentifier,
      accountId
    }) + `${urlQuery?.activeEnvironment ? `?activeEnvironment=${urlQuery.activeEnvironment}` : ''}`

  const [showGitModal, hideGitModal] = useModalHook(() => {
    return (
      <SaveFlagToGitModal
        flagName={featureFlag.name}
        flagIdentifier={featureFlag.identifier}
        gitSyncInitialValues={gitSyncInitialValues}
        gitSyncValidationSchema={gitSyncValidationSchema}
        onSubmit={handleDeleteFlag}
        onClose={() => {
          hideGitModal()
        }}
      />
    )
  }, [featureFlag.name, featureFlag.identifier, gitSync])

  const handleDeleteFlag = async (gitSyncFormValues?: GitSyncFormValues): Promise<void> => {
    let commitMsg = ''

    if (gitSync.isGitSyncEnabled) {
      if (gitSync.isAutoCommitEnabled) {
        commitMsg = gitSyncInitialValues.gitDetails.commitMsg
      } else {
        commitMsg = gitSyncFormValues?.gitDetails.commitMsg || ''
      }
    }

    try {
      await deleteFeatureFlag(featureFlag.identifier, { queryParams: { ...queryParams, commitMsg } })

      if (gitSync.isGitSyncEnabled && gitSyncFormValues?.autoCommit) {
        await gitSync.handleAutoCommit(gitSyncFormValues?.autoCommit)
      }

      history.replace(featureFlagListURL)
      showToaster(getString('cf.messages.flagDeleted'))
    } catch (error: any) {
      if (error.status === GIT_SYNC_ERROR_CODE) {
        gitSync.handleError(error.data as GitSyncErrorResponse)
      } else {
        showError(getErrorMessage(error), 0, 'cf.delete.ff.error')
      }
    }
  }

  const confirmDeleteFlag = useConfirmAction({
    title: getString('cf.featureFlags.deleteFlag'),
    confirmText: getString('delete'),
    message: (
      <Text>
        <span
          dangerouslySetInnerHTML={{
            __html: getString('cf.featureFlags.deleteFlagMessage', { name: featureFlag.name })
          }}
        />
      </Text>
    ),
    intent: Intent.DANGER,
    action: async () => {
      if (gitSync?.isGitSyncEnabled && !gitSync?.isAutoCommitEnabled) {
        showGitModal()
      } else {
        handleDeleteFlag()
      }
    }
  })

  return { confirmDeleteFlag }
}

export default useDeleteFlagModal
