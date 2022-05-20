/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, getAllByText, getByText, render, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import mockImport from 'framework/utils/mockImport'
import { FFGitSyncProvider } from '@cf/contexts/ff-git-sync-context/FFGitSyncContext'
import { SegmentDetailPage } from '../SegmentDetailPage'
import mockSegment from './mockSegment'
import mockTargets from './mockTargets'
import mockEnvironment from '../../environment-details/__tests__/mockEnvironment'

jest.mock('@cf/hooks/useGitSync', () => ({
  useGitSync: jest.fn(() => ({
    getGitSyncFormMeta: jest.fn(() => ({
      gitSyncInitialValues: {},
      gitSyncValidationSchema: {}
    })),
    isAutoCommitEnabled: false,
    isGitSyncEnabled: true,
    isGitSyncActionsEnabled: true,
    handleAutoCommit: jest.fn()
  }))
}))

describe('SegmentDetailsPage', () => {
  test('SegmentDetailsPage should render loading correctly', async () => {
    mockImport('services/cf', {
      useGetSegment: () => ({
        data: undefined,
        loading: true,
        error: undefined,
        refetch: jest.fn()
      })
    })

    mockImport('@cf/hooks/useSyncedEnvironment', {
      useSyncedEnvironment: () => ({ loading: true, refetch: jest.fn() })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/onboarding/detail"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <SegmentDetailPage />
      </TestWrapper>
    )

    expect(container.querySelector('.bp3-spinner')).toBeDefined()
  })

  test('SegmentDetailsPage should render error correctly 1', async () => {
    const error = { message: 'SOME ERROR OCCURS' }

    mockImport('services/cf', {
      useGetSegment: () => ({
        data: undefined,
        loading: undefined,
        error,
        refetch: jest.fn()
      })
    })

    mockImport('@cf/hooks/useSyncedEnvironment', {
      useSyncedEnvironment: () => ({ data: mockEnvironment, loading: undefined, error: undefined, refetch: jest.fn() })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/onboarding/detail"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <SegmentDetailPage />
      </TestWrapper>
    )

    expect(getAllByText(container, error.message)).toBeDefined()
  })

  test('SegmentDetailsPage should render error correctly 2', async () => {
    const error = { message: 'SOME ERROR OCCURS' }

    mockImport('services/cf', {
      useGetSegment: () => ({
        data: mockSegment,
        loading: undefined,
        error: undefined,
        refetch: jest.fn()
      })
    })

    mockImport('@cf/hooks/useSyncedEnvironment', {
      useSyncedEnvironment: () => ({ data: undefined, loading: undefined, error, refetch: jest.fn() })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/onboarding/detail"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <SegmentDetailPage />
      </TestWrapper>
    )

    expect(getAllByText(container, error.message)).toBeDefined()
  })

  test('SegmentDetailsPage should render data correctly', async () => {
    mockImport('services/cf', {
      useGetSegment: () => ({
        data: mockSegment,
        loading: undefined,
        error: undefined,
        refetch: jest.fn()
      }),

      useGetSegmentFlags: () => ({
        data: []
      }),

      useGetAllTargets: () => ({
        data: mockTargets
      })
    })

    mockImport('@cf/hooks/useSyncedEnvironment', {
      useSyncedEnvironment: () => ({ data: mockEnvironment, loading: undefined, error: undefined, refetch: jest.fn() })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/onboarding/detail"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <FFGitSyncProvider>
          <SegmentDetailPage />
        </FFGitSyncProvider>
      </TestWrapper>
    )

    expect(getAllByText(container, mockSegment.name)).toBeDefined()
    expect(container).toMatchSnapshot()
  })

  test('Delete function should work', async () => {
    const mutate = jest.fn(() => {
      return Promise.resolve({ data: {} })
    })

    mockImport('services/cf', {
      useGetSegment: () => ({
        data: mockSegment,
        loading: undefined,
        error: undefined,
        refetch: jest.fn()
      }),

      useGetSegmentFlags: () => ({
        data: []
      }),

      useGetAllTargets: () => ({
        data: mockTargets
      }),

      useDeleteSegment: () => ({
        mutate
      })
    })

    mockImport('@cf/hooks/useSyncedEnvironment', {
      useSyncedEnvironment: () => ({ data: mockEnvironment, loading: undefined, error: undefined, refetch: jest.fn() })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/onboarding/detail"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <SegmentDetailPage />
      </TestWrapper>
    )

    expect(getAllByText(container, mockSegment.name)).toBeDefined()
    ;(document.querySelector('[data-icon="Options"]') as HTMLButtonElement)?.click()
    ;(document.querySelector('[icon="cross"]') as HTMLButtonElement)?.click()

    expect(getByText(document.body, 'confirm')).toBeDefined()
    fireEvent.click(getByText(document.body, 'confirm') as HTMLButtonElement)
    await waitFor(() => expect(mutate).toBeCalledTimes(1))
  })
})
