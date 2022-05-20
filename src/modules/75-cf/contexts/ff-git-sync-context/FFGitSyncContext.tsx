/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import * as yup from 'yup'
import { useGitSync, UseGitSync } from '@cf/hooks/useGitSync'

/* istanbul ignore next */
export const FFGitSyncContext = React.createContext<UseGitSync>({
  apiError: '',
  gitSyncLoading: false,
  getGitSyncFormMeta: () => ({
    gitSyncInitialValues: {
      gitDetails: {
        branch: '',
        filePath: '',
        repoIdentifier: '',
        rootFolder: '',
        commitMsg: ''
      },
      autoCommit: false
    },
    gitSyncValidationSchema: yup.object().shape({
      commitMsg: yup.string()
    })
  }),
  gitRepoDetails: {
    branch: '',
    filePath: '',
    objectId: '',
    repoIdentifier: '',
    rootFolder: ''
  },
  handleAutoCommit: () => Promise.resolve(undefined),
  handleError: () => Promise.resolve(undefined),
  handleGitPause: () => Promise.resolve(undefined),
  saveWithGit: () => Promise.resolve(undefined),
  isAutoCommitEnabled: false,
  isGitSyncActionsEnabled: false,
  isGitSyncEnabled: false,
  isGitSyncPaused: false
})

export const useFFGitSyncContext = (): UseGitSync => {
  return React.useContext(FFGitSyncContext)
}

export const FFGitSyncProvider: React.FC = ({ children }) => {
  const gitSync = useGitSync()
  return <FFGitSyncContext.Provider value={{ ...gitSync }}>{children}</FFGitSyncContext.Provider>
}
