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
import * as useFeatureFlagMock from '@common/hooks/useFeatureFlag'
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

describe('TargetingRulesTab Governance', () => {
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
    jest.spyOn(cfServicesMock, 'useGetGitRepo').mockReturnValue({
      loading: false,
      refetch: jest.fn(),
      data: {
        repoDetails: {
          autoCommit: false,
          branch: 'main',
          enabled: false,
          filePath: '/flags.yaml',
          repoIdentifier: 'harnesstest',
          rootFolder: '/.harness/',
          yamlError: ''
        },
        repoSet: false
      }
    } as any)

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
  })

  test('it should show governance modal if governance data present in successful response', async () => {
    patchFeatureMock.mockResolvedValue({
      details: { governanceMetadata: { status: 'warning', message: 'governance warning' } }
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

    await waitFor(() => expect(screen.getByText('GOVERNANCE MODAL')).toBeInTheDocument())
  })

  test('it should show governance modal on governance error response', async () => {
    patchFeatureMock.mockRejectedValue({
      data: { details: { governanceMetadata: { status: 'error', message: 'governance error' } } }
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

    await waitFor(() => expect(screen.getByText('GOVERNANCE MODAL')).toBeInTheDocument())
  })
})
