/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo } from 'lodash-es'

import { Icon, Layout, Text } from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import type { GitSyncEntityDTO, PipelineInfoConfig } from 'services/cd-ng'
import type { EntityGitDetails, NGTemplateInfoConfig } from 'services/template-ng'
import { useGitSyncStore } from 'framework/GitRepoStore/GitSyncStoreContext'
import { useStrings } from 'framework/strings'
import { getRepoDetailsByIndentifier } from '@common/utils/gitSyncUtils'
import GitFilters, { GitFilterScope } from '@common/components/GitFilters/GitFilters'
import { useQueryParams } from '@common/hooks'
import type { GitQueryParams } from '@common/interfaces/RouteInterfaces'
import { getEntityUrl, getRepoEntityObject } from '@gitsync/common/gitSyncUtils'
import { DefaultNewPipelineId } from './PipelineContext/PipelineActions'
import GitPopover from '../GitPopover/GitPopover'

interface StudioGitPopoverProps {
  gitDetails: EntityGitDetails
  identifier: string
  isReadonly: boolean
  entityData: PipelineInfoConfig | NGTemplateInfoConfig
  onGitBranchChange: (selectedFilter: GitFilterScope) => void
  entityType: string
}

const breakWord = 'break-word'

export function GitDetails(props: StudioGitPopoverProps): React.ReactElement {
  const { gitDetails, identifier, isReadonly, onGitBranchChange, entityType } = props
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const { gitSyncRepos, loadingRepos } = useGitSyncStore()
  const { getString } = useStrings()

  const getDisabledOptionTitleText = (): string => {
    return getString('common.gitSync.branchSyncNotAllowed', { entityType })
  }

  if (gitDetails?.objectId || (identifier === DefaultNewPipelineId && gitDetails.repoIdentifier)) {
    const repo = getRepoDetailsByIndentifier(gitDetails?.repoIdentifier, gitSyncRepos)
    const repoEntity: GitSyncEntityDTO = getRepoEntityObject(repo, gitDetails)
    const repoName: string = defaultTo(repo?.name, '')
    return (
      <>
        <Layout.Vertical spacing="large">
          <Text font={{ size: 'small' }} color={Color.GREY_400}>
            {getString('repository')}
          </Text>
          <Layout.Horizontal spacing="small" style={{ alignItems: 'center' }}>
            <Icon name="repository" size={16} color={Color.GREY_700} />
            <Text
              font={FontVariation.SMALL}
              style={{ wordWrap: breakWord, maxWidth: '200px' }}
              lineClamp={1}
              color={Color.GREY_800}
            >
              {repoName}
            </Text>
          </Layout.Horizontal>
        </Layout.Vertical>
        {identifier === DefaultNewPipelineId && !loadingRepos ? null : (
          <Layout.Vertical spacing="large">
            <Text font={{ size: 'small' }} color={Color.GREY_400}>
              {getString('common.git.filePath')}
            </Text>
            <Layout.Horizontal spacing="small" style={{ alignItems: 'center' }}>
              <Icon name="repository" size={16} color={Color.GREY_700} />
              <Text
                data-testid={`${repoEntity.folderPath}${repoEntity.entityGitPath}`}
                font={FontVariation.SMALL}
                style={{ wordWrap: breakWord, maxWidth: '200px' }}
                lineClamp={1}
                color={Color.GREY_800}
              >
                {getEntityUrl(repoEntity)}
              </Text>
            </Layout.Horizontal>
          </Layout.Vertical>
        )}

        <Layout.Vertical spacing="large">
          <Text font={{ size: 'small' }} color={Color.GREY_400}>
            {getString('pipelineSteps.deploy.inputSet.branch')}
          </Text>
          <Layout.Horizontal spacing="small" style={{ alignItems: 'center' }}>
            {identifier === DefaultNewPipelineId || isReadonly ? (
              <>
                <Icon name="git-new-branch" size={14} color={Color.GREY_700} />
                <Text
                  font={FontVariation.SMALL}
                  style={{ wordWrap: breakWord, maxWidth: '200px' }}
                  lineClamp={1}
                  color={Color.GREY_800}
                >
                  {gitDetails?.branch}
                </Text>
              </>
            ) : (
              <>
                <Icon name="git-new-branch" size={14} color={Color.GREY_700} />
                <GitFilters
                  onChange={onGitBranchChange}
                  showRepoSelector={false}
                  defaultValue={{ repo: defaultTo(repoIdentifier, ''), branch, getDefaultFromOtherRepo: true }}
                  showBranchIcon={false}
                  shouldAllowBranchSync={false}
                  getDisabledOptionTitleText={getDisabledOptionTitleText}
                />
              </>
            )}
          </Layout.Horizontal>
        </Layout.Vertical>
      </>
    )
  } else {
    return <></>
  }
}

export function StudioGitPopover(props: StudioGitPopoverProps): JSX.Element {
  return <GitPopover data={props.gitDetails} customUI={<GitDetails {...props} />} />
}

export default StudioGitPopover
