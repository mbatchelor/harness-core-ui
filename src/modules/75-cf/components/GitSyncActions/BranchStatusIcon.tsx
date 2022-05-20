/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { ReactElement } from 'react'
import { Text, Container, Icon, Utils } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { useFFGitSyncContext } from '@cf/contexts/ff-git-sync-context/FFGitSyncContext'
import css from './GitSyncActions.module.scss'

interface BranchStatusIconProps {
  isLoading?: boolean
  isSettingsOpen: boolean
}

const BranchStatusIcon = ({ isSettingsOpen, isLoading }: BranchStatusIconProps): ReactElement => {
  const { getString } = useStrings()
  const { isGitSyncPaused, gitRepoDetails, gitSyncLoading, isAutoCommitEnabled } = useFFGitSyncContext()

  const getIcon = (): JSX.Element => {
    if (isGitSyncPaused) {
      return <Icon name="disable" size={15} data-testid="git-paused-icon" className={css.pausedIcon} />
    } else if (gitSyncLoading || isLoading) {
      return <Icon name="steps-spinner" size={15} className={css.loadingSpinner} data-testid="git-sync-spinner" />
    }
    return (
      <Icon
        data-testid="auto-commit-status-icon"
        name="full-circle"
        size={10}
        className={isAutoCommitEnabled ? css.autoCommitEnabled : css.autoCommitDisabled}
      />
    )
  }

  const getToolTipText = (): string => {
    return isGitSyncPaused
      ? getString('cf.gitSync.syncingPaused')
      : getString('cf.gitSync.branchStatus', {
          branch: gitRepoDetails?.branch,
          status: isAutoCommitEnabled ? 'ON' : 'OFF'
        })
  }

  return (
    <Container className={css.gitStatusIcon}>
      <Utils.WrapOptionalTooltip
        tooltipProps={{
          isDark: true,
          disabled: isSettingsOpen
        }}
        tooltip={
          <Container padding="medium" data-testid="git-sync-status-tooltip">
            <Text color={Color.WHITE}>{getToolTipText()}</Text>
          </Container>
        }
      >
        {getIcon()}
      </Utils.WrapOptionalTooltip>
    </Container>
  )
}

export default BranchStatusIcon
