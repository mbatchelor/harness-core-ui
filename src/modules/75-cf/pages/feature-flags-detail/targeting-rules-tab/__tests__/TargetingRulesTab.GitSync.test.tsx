/* eslint-disable react/display-name */
/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import * as uuid from 'uuid'
import { TestWrapper } from '@common/utils/testUtils'

import * as cfServicesMock from 'services/cf'
import { FFGitSyncProvider } from '@cf/contexts/ff-git-sync-context/FFGitSyncContext'
import type { GitRepo } from 'services/cf'
import * as useFeatureFlagMock from '@common/hooks/useFeatureFlag'
import { GIT_SYNC_ERROR_CODE } from '@cf/hooks/useGitSync'
import type { TargetingRulesTabProps } from '../TargetingRulesTab'
import TargetingRulesTab from '../TargetingRulesTab'
import mockSegment from './data/mockSegments'
import mockTargets from './data/mockTargets'
import mockFeature from './data/mockFeature'

jest.mock('@governance/EvaluationModal', () => ({
  EvaluationModal: () => <div>GOVERNANCE MODAL</div>
}))

jest.mock('uuid')

const renderComponent = (props: Partial<TargetingRulesTabProps> = {}): void => {
  render(
    <TestWrapper
      path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
      pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
    >
      <FFGitSyncProvider>
        <TargetingRulesTab
          featureFlagData={mockFeature}
          refetchFlag={jest.fn()}
          refetchFlagLoading={false}
          {...props}
        />
      </FFGitSyncProvider>
    </TestWrapper>
  )
}
const setUseGitRepoMock = (repoDetails: Partial<GitRepo> = {}, repoSet = true): void => {
  jest.spyOn(cfServicesMock, 'useGetGitRepo').mockReturnValue({
    loading: false,
    refetch: jest.fn(),
    data: {
      repoDetails: {
        autoCommit: repoDetails.autoCommit || false,
        branch: repoDetails.branch || 'main',
        enabled: repoDetails.enabled ?? true,
        filePath: repoDetails.filePath || '/flags.yaml',
        repoIdentifier: repoDetails.repoIdentifier || 'harnesstest',
        rootFolder: repoDetails.rootFolder || '/.harness/',
        yamlError: repoDetails.yamlError || ''
      },
      repoSet: repoSet
    }
  } as any)
}
describe('TargetingRulesTab GitSync', () => {
  const patchFeatureMock = jest.fn()
  const patchGitRepoMock = jest.fn()

  afterEach(() => {
    jest.clearAllMocks()
  })

  beforeAll(() => {
    jest.spyOn(useFeatureFlagMock, 'useFeatureFlag').mockReturnValue(true)
    jest.spyOn(uuid, 'v4').mockReturnValue('UUID')
  })

  beforeEach(() => {
    jest.spyOn(cfServicesMock, 'useGetAllSegments').mockReturnValue({
      data: { segments: mockSegment },
      loading: false,
      refetch: jest.fn()
    } as any)

    jest.spyOn(cfServicesMock, 'useGetAllTargets').mockReturnValue({
      data: { targets: mockTargets },
      loading: false,
      refetch: jest.fn()
    } as any)

    jest.spyOn(cfServicesMock, 'usePatchFeature').mockReturnValue({
      mutate: patchFeatureMock,
      loading: false,
      refetch: jest.fn()
    } as any)

    jest.spyOn(cfServicesMock, 'usePatchGitRepo').mockReturnValue({
      mutate: patchGitRepoMock,
      loading: false,
      refetch: jest.fn()
    } as any)

    setUseGitRepoMock()
  })

  test('it should open Git Modal and send correct data on save', async () => {
    renderComponent()

    // toggle flag off
    const flagToggle = screen.getByTestId('flag-status-switch')
    expect(flagToggle).toBeChecked()
    userEvent.click(flagToggle)
    expect(flagToggle).not.toBeChecked()

    // click save and assert modal appears
    const saveButton = screen.getByText('save')
    expect(saveButton).toBeInTheDocument()
    userEvent.click(saveButton)
    await waitFor(() => expect(screen.getByTestId('save-flag-to-git-modal-body')).toBeInTheDocument())

    // add commit message and
    userEvent.type(screen.getByPlaceholderText('common.git.commitMessage'), 'MY COMMIT MESSAGE')

    // select autocommit checkbox
    const autoCommitCheckbox = document.querySelector('input[name="autoCommit"]') as HTMLInputElement
    userEvent.click(autoCommitCheckbox)
    expect(autoCommitCheckbox).toBeChecked()

    // click save and assert
    userEvent.click(screen.getByTestId('save-flag-to-git-modal-save-button'))
    await waitFor(() =>
      expect(patchFeatureMock).toBeCalledWith({
        gitDetails: {
          branch: 'main',
          commitMsg: 'MY COMMIT MESSAGE',
          filePath: '/flags.yaml',
          repoIdentifier: 'harnesstest',
          rootFolder: '/.harness/'
        },
        instructions: [
          {
            kind: 'setFeatureFlagState',
            parameters: {
              state: 'off'
            }
          }
        ]
      })
    )

    // assert autocommit endpoint is called
    await waitFor(() => expect(patchGitRepoMock).toBeCalled())
  })

  test('it should send correct data on save with auto commit ON', async () => {
    setUseGitRepoMock({ autoCommit: true })
    renderComponent()

    // toggle flag off
    const flagToggle = screen.getByTestId('flag-status-switch')
    expect(flagToggle).toBeChecked()
    userEvent.click(flagToggle)
    expect(flagToggle).not.toBeChecked()

    // click save
    const saveButton = screen.getByText('save')
    expect(saveButton).toBeInTheDocument()
    userEvent.click(saveButton)

    await waitFor(() =>
      expect(patchFeatureMock).toBeCalledWith({
        gitDetails: {
          branch: 'main',
          commitMsg: 'cf.gitSync.autoCommitMsg',
          filePath: '/flags.yaml',
          repoIdentifier: 'harnesstest',
          rootFolder: '/.harness/'
        },
        instructions: [
          {
            kind: 'setFeatureFlagState',
            parameters: {
              state: 'off'
            }
          }
        ]
      })
    )
  })

  test('it should show error modal', async () => {
    setUseGitRepoMock({ autoCommit: true })

    patchFeatureMock.mockRejectedValue({
      status: GIT_SYNC_ERROR_CODE,
      data: { message: 'error with git sync service' }
    })

    renderComponent()

    // toggle flag off
    const flagToggle = screen.getByTestId('flag-status-switch')
    expect(flagToggle).toBeChecked()
    userEvent.click(flagToggle)
    expect(flagToggle).not.toBeChecked()

    // click save
    const saveButton = screen.getByText('save')
    expect(saveButton).toBeInTheDocument()
    userEvent.click(saveButton)

    await waitFor(() => expect(screen.getByText('cf.gitSync.gitErrorModalTitle')).toBeInTheDocument())
  })

  test('it should show invalid yaml modal', async () => {
    setUseGitRepoMock({ yamlError: 'error with the yaml' })
    renderComponent()

    await waitFor(() => expect(screen.getByText('error with the yaml')).toBeInTheDocument())
  })
})
