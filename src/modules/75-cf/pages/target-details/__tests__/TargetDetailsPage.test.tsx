/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, getAllByText, getByText, render, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import mockFeatureFlags from '@cf/pages/feature-flags-detail/__tests__/mockFeatureFlags'
import mockImport from 'framework/utils/mockImport'
import { FFGitSyncProvider } from '@cf/contexts/ff-git-sync-context/FFGitSyncContext'
import { TargetDetailPage } from '../TargetDetailPage'

jest.mock('@cf/hooks/useGitSync', () => ({
  useGitSync: jest.fn(() => ({
    getGitSyncFormMeta: jest.fn().mockReturnValue({
      gitSyncInitialValues: {},
      gitSyncValidationSchema: {}
    }),
    isAutoCommitEnabled: false,
    isGitSyncEnabled: true,
    isGitSyncActionsEnabled: true,
    handleAutoCommit: jest.fn()
  }))
}))

describe('TargetDetailPage', () => {
  test('TargetDetailPage should render loading correctly', async () => {
    mockImport('services/cf', {
      useGetTarget: () => ({
        data: undefined,
        loading: true,
        error: undefined,
        refetch: jest.fn()
      })
    })

    mockImport('services/cd-ng', {
      useGetEnvironment: () => ({ loading: true, refetch: jest.fn() })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/onboarding/detail"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <TargetDetailPage />
      </TestWrapper>
    )

    expect(container.querySelector('.bp3-spinner')).toBeDefined()
  })

  test('TargetDetailPage should render error correctly', async () => {
    const error = { message: 'SOME ERROR OCCURS' }

    mockImport('services/cf', {
      useGetTarget: () => ({
        data: undefined,
        loading: false,
        error,
        refetch: jest.fn()
      })
    })

    mockImport('services/cd-ng', {
      useGetEnvironment: () => ({ loading: true, refetch: jest.fn() })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/onboarding/detail"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <TargetDetailPage />
      </TestWrapper>
    )

    expect(getAllByText(container, error.message)).toBeDefined()
  })

  test('TargetDetailPage should render data correctly', async () => {
    mockImport('services/cf', {
      useGetTarget: () => ({
        data: {
          account: '',
          anonymous: false,
          attributes: {},
          createdAt: 1619803434843,
          environment: 'foobar',
          identifier: 't1',
          name: 't1',
          org: '',
          project: 'TNHUFF_PROJECT',
          segments: []
        },
        loading: false,
        error: undefined,
        refetch: jest.fn()
      }),
      useGetAllFeatures: () => mockFeatureFlags
    })

    mockImport('services/cd-ng', {
      useGetEnvironment: () => ({
        loading: false,
        data: {
          status: 'SUCCESS',
          data: {
            accountId: 'zEaak-FLS425IEO7OLzMUg',
            orgIdentifier: 'Harness',
            projectIdentifier: 'TNHUFF_PROJECT',
            identifier: 'foobar',
            name: 'foobar',
            description: '',
            color: '#0063F7',
            type: 'PreProduction',
            deleted: false,
            tags: {},
            version: 0
          },
          metaData: null,
          correlationId: '2f10cef7-2e6b-4dd2-b7ea-7f9d9973b034'
        },
        refetch: jest.fn()
      })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/onboarding/detail"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <FFGitSyncProvider>
          <TargetDetailPage />
        </FFGitSyncProvider>
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('TargetDetailPage should render its segments', async () => {
    mockImport('services/cf', {
      useGetTarget: () => ({
        data: {
          account: '',
          anonymous: false,
          attributes: {},
          createdAt: 1619803434843,
          environment: 'foobar',
          identifier: 't1',
          name: 't1',
          org: '',
          project: 'TNHUFF_PROJECT',
          segments: []
        },
        loading: false,
        error: undefined,
        refetch: jest.fn()
      }),
      useGetAllFeatures: () => mockFeatureFlags,
      useGetTargetSegments: () => ({
        excludedSegments: [
          { identifier: 's2', name: 's2' },
          { identifier: 's1', name: 's1' }
        ],
        identifier: 't1',
        includedSegments: [
          { identifier: 'segment1', name: 'segment1' },
          { identifier: 'segment2', name: 'segment2' }
        ],
        ruleSegments: []
      })
    })

    mockImport('services/cd-ng', {
      useGetEnvironment: () => ({
        loading: false,
        data: {
          status: 'SUCCESS',
          data: {
            accountId: 'zEaak-FLS425IEO7OLzMUg',
            orgIdentifier: 'Harness',
            projectIdentifier: 'TNHUFF_PROJECT',
            identifier: 'foobar',
            name: 'foobar',
            description: '',
            color: '#0063F7',
            type: 'PreProduction',
            deleted: false,
            tags: {},
            version: 0
          },
          metaData: null,
          correlationId: '2f10cef7-2e6b-4dd2-b7ea-7f9d9973b034'
        },
        refetch: jest.fn()
      })
    })

    const { container } = render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/onboarding/detail"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <FFGitSyncProvider>
          <TargetDetailPage />
        </FFGitSyncProvider>
      </TestWrapper>
    )

    fireEvent.click(getByText(container, 'cf.shared.segments'))
    expect(container).toMatchSnapshot()
  })

  test('Delete function should work', async () => {
    const mutate = jest.fn(() => {
      return Promise.resolve({ data: {} })
    })

    mockImport('services/cf', {
      useGetTarget: () => ({
        data: {
          account: '',
          anonymous: false,
          attributes: {},
          createdAt: 1619803434843,
          environment: 'foobar',
          identifier: 't1',
          name: 't1',
          org: '',
          project: 'TNHUFF_PROJECT',
          segments: []
        },
        loading: false,
        error: undefined,
        refetch: jest.fn()
      }),
      useGetAllFeatures: () => mockFeatureFlags,
      useDeleteTarget: () => ({ mutate })
    })

    mockImport('services/cd-ng', {
      useGetEnvironment: () => ({
        loading: false,
        data: {
          status: 'SUCCESS',
          data: {
            accountId: 'zEaak-FLS425IEO7OLzMUg',
            orgIdentifier: 'Harness',
            projectIdentifier: 'TNHUFF_PROJECT',
            identifier: 'foobar',
            name: 'foobar',
            description: '',
            color: '#0063F7',
            type: 'PreProduction',
            deleted: false,
            tags: {},
            version: 0
          },
          metaData: null,
          correlationId: '2f10cef7-2e6b-4dd2-b7ea-7f9d9973b034'
        },
        refetch: jest.fn()
      })
    })

    render(
      <TestWrapper
        path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/onboarding/detail"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <TargetDetailPage />
      </TestWrapper>
    )
    ;(document.querySelector('[data-icon="Options"]') as HTMLButtonElement)?.click()
    ;(document.querySelector('[icon="cross"]') as HTMLButtonElement)?.click()

    expect(getByText(document.body, 'confirm')).toBeDefined()
    fireEvent.click(getByText(document.body, 'confirm') as HTMLButtonElement)
    await waitFor(() => expect(mutate).toBeCalledTimes(1))
  })
})
