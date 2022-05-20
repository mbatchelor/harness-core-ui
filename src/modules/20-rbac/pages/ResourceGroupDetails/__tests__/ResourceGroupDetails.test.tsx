/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act, fireEvent, RenderResult, queryByAttribute, getByText } from '@testing-library/react'
import { findDialogContainer, findPopoverContainer, TestWrapper } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import { accountPathProps, orgPathProps, resourceGroupPathProps } from '@common/utils/routeUtils'
import {
  getResourceTypeHandlerMock,
  getResourceGroupTypeHandlerMock,
  getResourceCategoryListMock
} from '@rbac/utils/RbacFactoryMockData'
import ResourceGroupDetails from '../ResourceGroupDetails'
import {
  resourceTypes,
  resourceGroupDetails,
  resourceGroupDetailsWithHarnessManaged,
  orgMockData,
  projectMockData,
  orgResourceGroupDetails,
  accountResourceGroupDetails
} from './mock'

const updateResourceGroupDetails = jest.fn()
const getResourceGroupDetailsMock = jest.fn().mockImplementation(() => {
  return { data: resourceGroupDetails, refetch: jest.fn(), error: null, loading: false }
})
const updateResourceGroupDetailsMock = (data: any): Promise<{ status: string }> => {
  updateResourceGroupDetails(data.resourceGroup)
  return Promise.resolve({ status: 'SUCCESS' })
}
jest.mock('services/resourcegroups', () => ({
  useGetResourceTypes: jest.fn().mockImplementation(() => {
    return { data: resourceTypes, refetch: jest.fn(), error: null, loading: false }
  }),
  useUpdateResourceGroupV2: jest.fn().mockImplementation(() => ({ mutate: updateResourceGroupDetailsMock })),
  useGetResourceGroupV2: jest.fn().mockImplementation(() => {
    return getResourceGroupDetailsMock()
  })
}))

jest.mock('services/cd-ng', () => ({
  useGetProjectList: jest.fn().mockImplementation(() => {
    return { data: { data: { content: projectMockData } }, refetch: jest.fn(), error: null }
  }),
  useGetOrganizationList: jest.fn().mockImplementation(() => {
    return { ...orgMockData, refetch: jest.fn(), error: null }
  })
}))

jest.mock('@rbac/factories/RbacFactory', () => ({
  getResourceTypeHandler: jest.fn().mockImplementation(resource => getResourceTypeHandlerMock(resource)),
  getResourceCategoryHandler: jest.fn().mockImplementation(resource => getResourceGroupTypeHandlerMock(resource)),
  getResourceCategoryList: jest.fn().mockImplementation(() => getResourceCategoryListMock()),
  getResourceTypeLabelKey: jest.fn(),
  isRegisteredResourceType: jest.fn().mockImplementation(() => true)
}))

describe('Resource Groups Page', () => {
  let renderObj: RenderResult
  beforeEach(() => {
    renderObj = render(
      <TestWrapper
        path={routes.toResourceGroupDetails({ ...accountPathProps, ...resourceGroupPathProps })}
        pathParams={{ accountId: 'dummy', resourceGroupIdentifier: 'dummyResourceGroupIdentifier' }}
        defaultFeatureFlagValues={{ CUSTOM_RESOURCEGROUP_SCOPE: true }}
      >
        <ResourceGroupDetails />
      </TestWrapper>
    )
  })
  afterEach(() => {
    renderObj.unmount()
  })
  test('render data', async () => {
    const { container } = renderObj
    expect(container).toMatchSnapshot()
  })
  test('test connector selection and save', async () => {
    updateResourceGroupDetails.mockReset()
    const { getAllByText, container } = renderObj
    const connector = queryByAttribute('data-testid', container, 'CHECK-BOX-CONNECTOR')
    expect(connector).toBeTruthy()
    act(() => {
      fireEvent.click(connector!)
    })
    expect(getAllByText('rbac.resourceGroup.all')[0]).toBeTruthy()
    await act(async () => {
      fireEvent.click(getByText(container, 'save'))
    })
    expect(updateResourceGroupDetails).toHaveBeenCalledWith({
      accountIdentifier: 'kmpySmUISimoRrJL6NL73w',
      identifier: 'ewrewew',
      name: 'nameewrewew',
      includedScopes: [
        {
          filter: 'EXCLUDING_CHILD_SCOPES',
          accountIdentifier: 'kmpySmUISimoRrJL6NL73w'
        }
      ],
      resourceFilter: {
        includeAllResources: false,
        resources: [{ resourceType: 'SECRET' }, { resourceType: 'CONNECTOR' }]
      },
      tags: {},
      description: '',
      color: '#0063f7'
    })
  })
  test('test orgs selection and save', async () => {
    const { container, getByTestId } = renderObj
    const specifiedResource = getByTestId('static-SECRET')
    act(() => {
      fireEvent.click(specifiedResource)
    })
    const addResources = getByTestId('addResources-SECRET')
    expect(addResources).toBeTruthy()
    act(() => {
      fireEvent.click(addResources)
    })
    let form = findDialogContainer()
    expect(form).toBeTruthy()

    act(() => {
      fireEvent.click(getByText(form!, 'cancel'))
    })
    form = findDialogContainer()
    expect(form).toBeFalsy()

    await act(async () => {
      fireEvent.click(getByText(container, 'save'))
    })
    expect(updateResourceGroupDetails).toBeCalledWith({
      accountIdentifier: 'kmpySmUISimoRrJL6NL73w',
      identifier: 'ewrewew',
      name: 'nameewrewew',
      includedScopes: [
        {
          filter: 'EXCLUDING_CHILD_SCOPES',
          accountIdentifier: 'kmpySmUISimoRrJL6NL73w'
        }
      ],
      resourceFilter: {
        includeAllResources: false,
        resources: [{ resourceType: 'SECRET' }, { resourceType: 'CONNECTOR' }]
      },
      tags: {},
      description: '',
      color: '#0063f7'
    })
  })
  test('test change of resource scope', async () => {
    const { container } = renderObj
    const scope = getByText(container, 'rbac.scopeItems.accountOnly')
    act(() => {
      fireEvent.click(scope)
    })

    let form = findDialogContainer()
    expect(form).toBeTruthy()

    const customScope = getByText(form!, 'rbac.scopeItems.specificOrgsAndProjects')
    act(() => {
      fireEvent.click(customScope)
    })

    const includeCurrentScope = getByText(form!, 'rbac.resourceScope.includeAccResources')
    act(() => {
      fireEvent.click(includeCurrentScope)
    })

    const addOrgs = getByText(form!, 'rbac.resourceScope.selectOrgsandProjects')
    act(() => {
      fireEvent.click(addOrgs)
    })

    const selectOrg = getByText(form!, 'Select')
    act(() => {
      fireEvent.click(selectOrg)
    })
    const popover = findPopoverContainer()
    expect(popover).toBeTruthy()

    const defaultOrg = getByText(popover!, 'default')
    act(() => {
      fireEvent.click(defaultOrg)
    })

    const includeProjects = getByText(form!, 'rbac.resourceScope.includeProjResources')
    act(() => {
      fireEvent.click(includeProjects)
    })

    act(() => {
      fireEvent.click(getByText(form!, 'common.apply'))
    })
    form = findDialogContainer()
    expect(form).toBeFalsy()

    await act(async () => {
      fireEvent.click(getByText(container, 'save'))
    })
    expect(updateResourceGroupDetails).toHaveBeenCalled()
  })
})
test('with harness managed resources', async () => {
  getResourceGroupDetailsMock.mockImplementation(() => {
    return { data: resourceGroupDetailsWithHarnessManaged, refetch: jest.fn(), error: null, loading: false }
  })
  const { queryByText } = render(
    <TestWrapper
      path={routes.toResourceGroupDetails({ ...accountPathProps, ...resourceGroupPathProps })}
      pathParams={{ accountId: 'dummy', resourceGroupIdentifier: 'dummyResourceGroupIdentifier' }}
    >
      <ResourceGroupDetails />
    </TestWrapper>
  )
  const save = queryByText('save')
  expect(save).toBeFalsy()
})
test('Account Scope Resource Group Details', async () => {
  getResourceGroupDetailsMock.mockImplementation(() => {
    return { data: accountResourceGroupDetails, refetch: jest.fn(), error: null, loading: false }
  })
  const { container } = render(
    <TestWrapper
      path={routes.toResourceGroupDetails({ ...accountPathProps, ...resourceGroupPathProps })}
      pathParams={{
        accountId: 'dummy',
        resourceGroupIdentifier: 'dummyResourceGroupIdentifier'
      }}
      defaultFeatureFlagValues={{ CUSTOM_RESOURCEGROUP_SCOPE: true }}
    >
      <ResourceGroupDetails />
    </TestWrapper>
  )

  let scope = getByText(container, 'rbac.scopeItems.specificOrgsAndProjects')
  act(() => {
    fireEvent.click(scope)
  })

  let form = findDialogContainer()
  expect(form).toBeTruthy()

  const includeCurrentScope = queryByAttribute('data-testid', form!, 'INCLUDE_ACC_RESOURCES')
  expect(includeCurrentScope).toBeTruthy()
  act(() => {
    fireEvent.click(includeCurrentScope!)
  })

  act(() => {
    fireEvent.click(getByText(form!, 'common.apply'))
  })
  form = findDialogContainer()
  expect(form).toBeFalsy()

  scope = getByText(container, 'rbac.scopeItems.specificOrgsAndProjects')
  act(() => {
    fireEvent.click(scope)
  })
  form = findDialogContainer()
  expect(form).toBeTruthy()
})

test('Org Scope Resource Group Details', async () => {
  getResourceGroupDetailsMock.mockImplementation(() => {
    return { data: orgResourceGroupDetails, refetch: jest.fn(), error: null, loading: false }
  })
  const { container } = render(
    <TestWrapper
      path={routes.toResourceGroupDetails({ ...accountPathProps, ...orgPathProps, ...resourceGroupPathProps })}
      pathParams={{
        accountId: 'dummy',
        orgIdentifier: 'testOrg',
        resourceGroupIdentifier: 'dummyResourceGroupIdentifier'
      }}
      defaultFeatureFlagValues={{ CUSTOM_RESOURCEGROUP_SCOPE: true }}
    >
      <ResourceGroupDetails />
    </TestWrapper>
  )

  const scope = getByText(container, 'rbac.scopeItems.specificProjects')
  act(() => {
    fireEvent.click(scope)
  })

  const form = findDialogContainer()
  expect(form).toBeTruthy()
})
