/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { useToaster } from '@harness/uicore'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import type { ErrorHandlerProps } from '@rbac/utils/utils'
import type { GitSyncErrorResponse } from 'services/cf'
import { useFFGitSyncContext } from '@cf/contexts/ff-git-sync-context/FFGitSyncContext'
import { GIT_SYNC_ERROR_CODE } from './useGitSync'
import { useGovernance } from './useGovernance'

interface UseResponseErrorReturn {
  handleResponseError: (error: any) => void
}

const useResponseError = (): UseResponseErrorReturn => {
  const { getRBACErrorMessage } = useRBACError()

  const { handleError: handleGovernanceError, isGovernanceError } = useGovernance()
  const { showError } = useToaster()
  const { handleError: handleGitSyncError } = useFFGitSyncContext()

  const handleResponseError = (error: any): void => {
    if (error.status === GIT_SYNC_ERROR_CODE) {
      handleGitSyncError(error.data as GitSyncErrorResponse)
    } else if (isGovernanceError(error.data)) {
      handleGovernanceError(error.data)
    } else {
      showError(getRBACErrorMessage(error as ErrorHandlerProps))
    }
  }

  return {
    handleResponseError
  }
}

export default useResponseError
