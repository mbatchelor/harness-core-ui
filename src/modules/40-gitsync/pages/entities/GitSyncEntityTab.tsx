/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  Container,
  Collapse,
  IconName,
  Text,
  Layout,
  FormInput,
  Formik,
  FormikForm,
  SelectOption
} from '@wings-software/uicore'
import type { IconProps } from '@harness/icons'
import { noop } from 'lodash-es'
import { Color } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import { useGitSyncStore } from 'framework/GitRepoStore/GitSyncStoreContext'
import { GitBranchDTO, GitSyncConfig, useGetListOfBranchesWithStatus } from 'services/cd-ng'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { branchSyncStatus } from '@common/components/GitContextForm/GitContextForm'
import { Page } from '@common/exports'
import EntitiesPreview from './EntitiesPreview'
import css from './GitSyncEntityTab.module.scss'

interface IEntitiesPreviewWrapper {
  key?: string
  repository: GitSyncConfig
}

const EntitiesPreviewWrapper: React.FC<IEntitiesPreviewWrapper> = prop => {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { repository } = prop
  const [selectedBranch, setSelectedBranch] = useState(repository.branch)
  const [searchTerm, setSearchTerm] = useState('')

  const collapseProps = {
    collapsedIcon: 'main-chevron-right' as IconName,
    expandedIcon: 'main-chevron-down' as IconName,
    iconProps: { size: 16 } as IconProps,
    isOpen: false,
    isRemovable: false,
    className: 'collapse',
    collapseHeaderClassName: css.collapseHeader
  }

  const GetCollapseHeading = (gitRepo: GitSyncConfig): JSX.Element => {
    const {
      data: branchList,
      loading: loadingBranchList,
      refetch: getListOfBranchesWithStatus
    } = useGetListOfBranchesWithStatus({
      lazy: true,
      debounce: 500
    })

    const defaultBranchSelect: SelectOption = {
      label: gitRepo.branch || '',
      value: gitRepo.branch || '',
      icon: { name: 'git-new-branch' }
    }

    const [branchSelectOptions, setBranchSelectOptions] = React.useState<SelectOption[]>([defaultBranchSelect])

    React.useEffect(() => {
      getListOfBranchesWithStatus({
        queryParams: {
          accountIdentifier: accountId,
          orgIdentifier,
          projectIdentifier,
          yamlGitConfigIdentifier: gitRepo.identifier,
          page: 0,
          size: 20,
          branchSyncStatus: branchSyncStatus.SYNCED,
          searchTerm
        },
        debounce: 300
      })
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm])

    React.useEffect(() => {
      if (!loadingBranchList && branchList?.data?.branches?.content?.length) {
        const syncedBranchOption: SelectOption[] = []

        branchList.data.branches.content.forEach((branch: GitBranchDTO) => {
          if (branch.branchSyncStatus === branchSyncStatus.SYNCED) {
            syncedBranchOption.push({
              label: branch.branchName || '',
              value: branch.branchName || '',
              icon: { name: 'git-new-branch' }
            })
          }
        })

        setBranchSelectOptions(syncedBranchOption)
      }

      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loadingBranchList])

    return (
      <Layout.Horizontal flex className={css.header}>
        <Text font={{ size: 'medium', weight: 'semi-bold' }} margin={{ left: 'small' }} color={Color.PRIMARY_7} inline>
          {gitRepo.name}
        </Text>

        <Formik
          initialValues={{
            branch: gitRepo.branch
          }}
          formName="gitSyncEntityForm"
          onSubmit={noop}
        >
          <FormikForm
            onClick={(event: React.MouseEvent<HTMLElement, MouseEvent>) => {
              event.stopPropagation()
            }}
          >
            <FormInput.Select
              name="branch"
              items={branchSelectOptions}
              onQueryChange={(query: string) => setSearchTerm(query)}
              onChange={(branch: SelectOption, event) => {
                setSelectedBranch(branch.value as string)
                event?.preventDefault()
                event?.stopPropagation()
              }}
            />
          </FormikForm>
        </Formik>
      </Layout.Horizontal>
    )
  }

  return (
    <Container className={css.collapseFeatures}>
      <Collapse {...collapseProps} heading={GetCollapseHeading(repository)}>
        <EntitiesPreview repo={repository} branch={selectedBranch || ''} />
      </Collapse>
    </Container>
  )
}

const GitSyncEntityTab: React.FC = () => {
  const { gitSyncRepos } = useGitSyncStore()

  return (
    <Page.Body>
      <Container className={css.bodyContainer}>
        {gitSyncRepos?.map((gitRepo: GitSyncConfig, index: number) => {
          return <EntitiesPreviewWrapper repository={gitRepo} key={(gitRepo?.identifier || '') + index} />
        })}
      </Container>
    </Page.Body>
  )
}

export default GitSyncEntityTab
