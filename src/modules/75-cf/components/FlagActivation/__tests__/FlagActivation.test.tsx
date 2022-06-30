/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, RenderResult, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import * as cfServiceMock from 'services/cf'

import mockFeature from '@cf/utils/testData/data/mockFeature'
import mockGitSync from '@cf/utils/testData/data/mockGitSync'
import FlagActivation from '../FlagActivation'

jest.mock('services/cf')

jest.mock('@cf/hooks/useEnvironmentSelectV2', () => ({
  useEnvironmentSelectV2: jest.fn().mockReturnValue({
    data: [],
    loading: false,
    error: undefined,
    refetch: jest.fn(),
    EnvironmentSelect: function EnvironmentSelect() {
      return <div />
    }
  })
}))

const renderComponent = (): RenderResult => {
  return render(
    <TestWrapper
      path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
      pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      defaultFeatureFlagValues={{
        FFM_1513: false,
        FFM_2134_FF_PIPELINES_TRIGGER: false
      }}
    >
      <FlagActivation
        refetchFlagLoading={false}
        gitSync={mockGitSync}
        flagData={mockFeature}
        projectIdentifier="chris_test"
        refetchFlag={jest.fn()}
      />
    </TestWrapper>
  )
}

describe('FlagActivation', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest
      .spyOn(cfServiceMock, 'useGetAllFeatures')
      .mockReturnValue({ data: [], loading: false, mutate: jest.fn() } as any)
    jest
      .spyOn(cfServiceMock, 'useGetTargetsAndSegmentsInfo')
      .mockReturnValue({ data: [], loading: false, mutate: jest.fn() } as any)
    jest
      .spyOn(cfServiceMock, 'useGetAllSegments')
      .mockReturnValue({ data: [], loading: false, mutate: jest.fn() } as any)
    jest
      .spyOn(cfServiceMock, 'useGetAllTargetAttributes')
      .mockReturnValue({ data: [], loading: false, mutate: jest.fn() } as any)
    jest
      .spyOn(cfServiceMock, 'useGetFeatureEvaluations')
      .mockReturnValue({ data: [], loading: false, mutate: jest.fn() } as any)
    jest.spyOn(cfServiceMock, 'usePatchFeature').mockReturnValue({ data: [], loading: false, mutate: jest.fn() } as any)
    jest
      .spyOn(cfServiceMock, 'useGetAllTargets')
      .mockReturnValue({ data: [], loading: false, mutate: jest.fn() } as any)
  })

  test('it should render correctly', async () => {
    const { container } = renderComponent()

    expect(container).toMatchSnapshot()
  })

  test('it should render form correctly', async () => {
    const patchMock = jest.fn()
    jest.spyOn(cfServiceMock, 'usePatchFeature').mockReturnValue({ data: [], loading: false, mutate: patchMock } as any)

    renderComponent()

    // Edit flag variation
    await waitFor(() => expect(screen.getByText('cf.featureFlags.rules.editRules')).toBeInTheDocument())

    userEvent.click(screen.getByText('cf.featureFlags.rules.editRules'))

    expect(document.getElementsByName('onVariation')[0]).toBeInTheDocument()

    userEvent.click(document.getElementsByName('onVariation')[0])
    userEvent.click(screen.getByText('False'))

    expect(document.getElementsByName('onVariation')[0]).toHaveValue('False')
    expect(screen.getByText('save')).toBeInTheDocument()

    // Assert modal appears
    userEvent.click(screen.getByText('save'))

    const saveToGitModal = document.getElementById('save-flag-to-git-modal-body')
    await waitFor(() => expect(saveToGitModal).toBeInTheDocument())

    expect(saveToGitModal).toMatchSnapshot()
  })
})
