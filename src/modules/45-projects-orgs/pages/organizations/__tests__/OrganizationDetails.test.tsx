/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, getAllByText, render, waitFor, screen } from '@testing-library/react'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import { orgPathProps } from '@common/utils/routeUtils'
import mockImport from 'framework/utils/mockImport'
import OrganizationDetailsPage from '../OrganizationDetails/OrganizationDetailsPage'
import {
  getOrgAggregateMockData as getOrgMockData,
  invitesMockData,
  response,
  roleMockData,
  userMockData
} from './OrganizationsMockData'

jest.mock('@common/hooks', () => ({
  ...(jest.requireActual('@common/hooks') as any),
  useMutateAsGet: jest.fn().mockImplementation(() => {
    return { data: userMockData, refetch: jest.fn(), error: null, loading: false }
  })
}))

jest.mock('services/cd-ng', () => ({
  useGetOrganizationAggregateDTO: jest.fn().mockImplementation(() => {
    return { ...getOrgMockData, refetch: jest.fn(), error: null, loading: false }
  }),
  useGetSmtpConfig: jest.fn().mockImplementation(() => {
    return {
      loading: false,
      data: {
        status: 'SUCCESS',
        data: {}
      }
    }
  }),
  useStartTrialLicense: jest.fn().mockImplementation(() => {
    return {
      loading: false,
      data: {
        status: 'SUCCESS',
        data: {}
      }
    }
  }),
  useStartFreeLicense: jest.fn().mockImplementation(() => {
    return {
      loading: false,
      data: {
        status: 'SUCCESS',
        data: {}
      }
    }
  }),
  useGetInvites: jest.fn().mockImplementation(() => ({ data: invitesMockData, loading: false, refetch: jest.fn() })),
  useAddUsers: jest.fn().mockImplementation(() => ({ mutate: () => Promise.resolve(response) })),
  useDeleteInvite: jest.fn().mockImplementation(() => ({ mutate: () => Promise.resolve(response) })),
  useUpdateInvite: jest.fn().mockImplementation(() => ({ mutate: () => Promise.resolve(response) }))
}))

jest.mock('services/rbac', () => ({
  useGetRoleList: jest.fn().mockImplementation(() => ({ data: roleMockData, loading: false, refetch: jest.fn() }))
}))

const renderComponent = () => {
  return render(
    <TestWrapper
      path={routes.toOrganizationDetails({ ...orgPathProps })}
      pathParams={{ accountId: 'testAcc', orgIdentifier: 'testOrg' }}
    >
      <OrganizationDetailsPage />
    </TestWrapper>
  )
}
describe('Organization Details', () => {
  test('Render', async () => {
    const { container } = renderComponent()
    expect(container).toMatchSnapshot()
  })
  test('Manage Organizations', async () => {
    renderComponent()
    const back = screen.getByText('orgsText')
    fireEvent.click(back)
    await waitFor(() => screen.getByTestId('location'))
    expect(
      screen.getByTestId('location').innerHTML.endsWith(routes.toOrganizations({ accountId: 'testAcc' }))
    ).toBeTruthy()
  })
  // eslint-disable-next-line jest/no-disabled-tests, jest/expect-expect
  test.skip('Route Resources', async () => {
    const resources = screen.getByText('resources')
    fireEvent.click(resources)
    await waitFor(() => screen.getByTestId('location'))
    // expect(
    //   getByTestId('location').innerHTML.endsWith(
    //     routes.toResources({
    //       accountId: 'testAcc',
    //       orgIdentifier: getOrgMockData.data.data.organizationResponse.organization.identifier
    //     })
    //   )
    // ).toBeTruthy()
  })
  test('Click on Add Admin', async () => {
    const { container } = renderComponent()

    const plus = getAllByText(container, '+')[0]
    await act(async () => {
      fireEvent.click(plus)
      await waitFor(() => getAllByText(document.body, 'projectsOrgs.invite')[0])
    })
    const form = findDialogContainer()
    expect(form).toBeTruthy()
  })
  test('Click on Add Collaborator', async () => {
    const { container } = renderComponent()
    const plus = getAllByText(container, '+')[1]
    await act(async () => {
      fireEvent.click(plus)
      await waitFor(() => getAllByText(document.body, 'projectsOrgs.invite')[0])
    })
    const form = findDialogContainer()
    expect(form).toBeTruthy()
  })

  test('Governance should be visible when pipeline governance enabled', async () => {
    mockImport('@common/hooks/useFeatureFlag', {
      useFeatureFlags: () => ({ OPA_PIPELINE_GOVERNANCE: true, OPA_FF_GOVERNANCE: false })
    })

    renderComponent()

    expect(screen.getByText('common.governance')).toBeTruthy()
  })

  test('Governance should be visible when ff governance enabled', async () => {
    mockImport('@common/hooks/useFeatureFlag', {
      useFeatureFlags: () => ({ OPA_PIPELINE_GOVERNANCE: false, OPA_FF_GOVERNANCE: true })
    })

    renderComponent()

    expect(screen.getByText('common.governance')).toBeTruthy()
  })

  test('Audit trail should be visible', async () => {
    mockImport('@common/hooks/useFeatureFlag', {
      useFeatureFlags: () => ({ AUDIT_TRAIL_WEB_INTERFACE: true })
    })

    renderComponent()

    expect(screen.getByText('common.auditTrail')).toBeTruthy()
    expect(screen.getByText('projectsOrgs.orgAccessCtrlAndAuditTrail')).toBeTruthy()
  })
})
