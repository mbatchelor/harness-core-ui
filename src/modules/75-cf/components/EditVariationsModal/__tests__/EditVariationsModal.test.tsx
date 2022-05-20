/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { TestWrapper } from '@common/utils/testUtils'
import * as cfServiceMock from 'services/cf'

import mockFeature from '@cf/utils/testData/data/mockFeature'
import mockPermission from '@cf/utils/testData/data/mockPermission'
import mockGitSync from '@cf/utils/testData/data/mockGitSync'
import { EditVariationsModal } from '../EditVariationsModal'

jest.mock('services/cf')

jest.mock('@cf/hooks/useEnvironmentSelectV2', () => ({
  useEnvironmentSelectV2: jest.fn().mockReturnValue({ data: [], loading: false })
}))

const renderComponent = (): void => {
  render(
    <TestWrapper
      path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags"
      pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
    >
      <EditVariationsModal
        accountIdentifier="dummy"
        orgIdentifier="dummy"
        projectIdentifier="dummy"
        gitSync={mockGitSync}
        feature={mockFeature}
        permission={mockPermission}
        onSuccess={jest.fn()}
        setGovernanceMetadata={jest.fn()}
      />
    </TestWrapper>
  )
}

describe('EditVariationsModal', () => {
  test('it should render correctly', async () => {
    jest.spyOn(cfServiceMock, 'usePatchFeature').mockReturnValue({ loading: false, mutate: jest.fn() } as any)

    renderComponent()

    userEvent.click(screen.getByTestId('open-edit-variations-modal'))

    await waitFor(() => expect(screen.getByTestId('edit-variation-modal')).toBeInTheDocument())

    expect(screen.getByTestId('edit-variation-modal')).toMatchSnapshot()
  })

  // eslint-disable-next-line jest/no-disabled-tests
  test.skip('it should call onSubmit correctly when variation changed', async () => {
    const patchMock = jest.fn()
    jest.spyOn(cfServiceMock, 'usePatchFeature').mockReturnValue({ loading: false, mutate: patchMock } as any)

    renderComponent()

    userEvent.click(screen.getByTestId('open-edit-variations-modal'))

    await waitFor(() => expect(screen.getByTestId('edit-variation-modal')).toBeInTheDocument())

    const variation1 = document.getElementsByName('variations.0.name')[0]
    userEvent.clear(variation1)
    await userEvent.type(variation1, 'new variation')

    await userEvent.type(screen.getByPlaceholderText('common.git.commitMessage'), 'test commit message')
    userEvent.click(screen.getByText('save'))

    await waitFor(() =>
      expect(patchMock).toBeCalledWith({
        gitDetails: {
          branch: 'main',
          commitMsg: 'test commit message',
          filePath: '/flags.yaml',
          repoIdentifier: 'harnesstest',
          rootFolder: '/.harness/'
        },
        instructions: [
          { kind: 'updateVariation', parameters: { identifier: 'true', name: 'new variation', value: 'true' } }
        ]
      })
    )
  })
})
