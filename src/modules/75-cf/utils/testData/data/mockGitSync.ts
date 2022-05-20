/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import * as yup from 'yup'
import type { UseGitSync } from '@cf/hooks/useGitSync'

const mockGitSync: UseGitSync = {
  gitRepoDetails: {
    autoCommit: false,
    branch: 'main',
    filePath: '/flags.yaml',
    objectId: '',
    repoIdentifier: 'harnesstest',
    rootFolder: '/.harness/'
  },
  isAutoCommitEnabled: false,
  isGitSyncEnabled: true,
  gitSyncLoading: false,
  handleGitPause: jest.fn(),
  isGitSyncActionsEnabled: true,
  isGitSyncPaused: false,
  apiError: '',
  handleError: jest.fn(),
  saveWithGit: jest.fn(),
  handleAutoCommit: jest.fn(),
  getGitSyncFormMeta: jest.fn(() => ({
    gitSyncInitialValues: {
      gitDetails: {
        commitMsg: '',
        branch: 'main',
        filePath: '/flags.yaml',
        repoIdentifier: 'harnesstest',
        rootFolder: '/.harness/'
      },
      autoCommit: false
    },
    gitSyncValidationSchema: yup.object().shape({
      commitMsg: yup.string()
    })
  }))
}

export default mockGitSync
