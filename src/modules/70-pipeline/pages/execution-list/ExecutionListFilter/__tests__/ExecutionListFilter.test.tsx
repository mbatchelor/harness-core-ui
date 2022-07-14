/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, getByText, render } from '@testing-library/react'
import { act } from 'react-dom/test-utils'

import { TestWrapper } from '@common/utils/testUtils'
import { accountPathProps, pipelineModuleParams, pipelinePathProps } from '@common/utils/routeUtils'
import routes from '@common/RouteDefinitions'
import { defaultAppStoreValues } from '@common/utils/DefaultAppStoreData'
import filters from '@pipeline/pages/pipeline-deployment-list/__tests__/filters.json'
import services from '@pipeline/pages/pipelines/__tests__/mocks/services.json'
import environments from '@pipeline/pages/pipelines/__tests__/mocks/environments.json'

import { ExecutionFilters } from '../ExecutionListFilter'

jest.mock('services/pipeline-ng', () => ({
  useGetFilterList: jest.fn().mockImplementation(() => {
    return { mutate: jest.fn(() => Promise.resolve(filters)), loading: false }
  }),
  usePostFilter: jest.fn(() => ({
    mutate: jest.fn(),
    loading: false,
    cancel: jest.fn()
  })),
  useUpdateFilter: jest.fn(() => ({
    mutate: jest.fn(),
    loading: false,
    cancel: jest.fn()
  })),
  useDeleteFilter: jest.fn(() => ({
    mutate: jest.fn(),
    loading: false,
    cancel: jest.fn()
  }))
}))

jest.mock('services/cd-ng', () => ({
  useGetServiceDefinitionTypes: jest.fn().mockImplementation(() => ({ loading: false, data: {}, refetch: jest.fn() })),
  useGetServiceListForProject: jest
    .fn()
    .mockImplementation(() => ({ loading: false, data: services, refetch: jest.fn() })),
  useGetEnvironmentListForProject: jest
    .fn()
    .mockImplementation(() => ({ loading: false, data: environments, refetch: jest.fn() }))
}))

const params = {
  accountId: 'testAcc',
  orgIdentifier: 'testOrg',
  projectIdentifier: 'test',
  pipelineIdentifier: 'pipeline1',
  module: 'cd'
}

const TEST_PATH = routes.toPipelines({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams })

describe('<ExecutionFilters /> test', () => {
  test('snapshot testing', () => {
    const { container } = render(
      <TestWrapper path={TEST_PATH} pathParams={params} defaultAppStoreValues={defaultAppStoreValues}>
        <ExecutionFilters />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('snapshot testing for opened filter drawer', async () => {
    const { container } = render(
      <TestWrapper path={TEST_PATH} pathParams={params} defaultAppStoreValues={defaultAppStoreValues}>
        <ExecutionFilters />
      </TestWrapper>
    )
    let drawerArr = document.getElementsByClassName('bp3-drawer')
    expect(drawerArr).toHaveLength(0)
    const filterBtn = container.getElementsByTagName('button')[0]
    await act(async () => {
      fireEvent.click(filterBtn)
    })
    drawerArr = document.getElementsByClassName('bp3-drawer')
    expect(drawerArr).toHaveLength(1)
    const filterDrawer = drawerArr[0] as HTMLElement
    expect(getByText(filterDrawer, 'Filter')).toBeDefined()
    expect(filterDrawer).toMatchSnapshot()
  })
})
