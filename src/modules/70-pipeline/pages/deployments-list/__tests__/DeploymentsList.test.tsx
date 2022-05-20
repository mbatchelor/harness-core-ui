/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import { branchStatusMock, gitConfigs, sourceCodeManagers } from '@connectors/mocks/mock'

import data from '../../pipeline-deployment-list/__tests__/execution-list.json'
import pipelines from '../../../components/PipelineModalListView/__tests__/RunPipelineListViewMocks'
import filters from '../../pipeline-deployment-list/__tests__/filters.json'
import services from '../../pipelines/__tests__/mocks/services.json'
import environments from '../../pipelines/__tests__/mocks/environments.json'
import DeploymentsList from '../DeploymentsList'

jest.mock('@common/components/YAMLBuilder/YamlBuilder')
jest.mock('@common/utils/YamlUtils', () => ({}))

jest.mock('@pipeline/components/Dashboards/PipelineSummaryCards/PipelineSummaryCards', () => () => <div />)
jest.mock('@pipeline/components/Dashboards/BuildExecutionsChart/PipelineBuildExecutionsChart', () => () => <div />)

const mockGetCallFunction = jest.fn()

jest.mock('services/pipeline-ng', () => ({
  useGetListOfExecutions: jest.fn(() => ({
    mutate: jest.fn(() => Promise.resolve(data)),
    loading: false,
    cancel: jest.fn()
  })),
  useGetPipelineList: jest.fn().mockImplementation(args => {
    mockGetCallFunction(args)
    return { mutate: jest.fn(() => Promise.resolve(pipelines)), cancel: jest.fn(), loading: false }
  }),
  useHandleInterrupt: jest.fn(() => ({})),
  useHandleStageInterrupt: jest.fn(() => ({})),
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

const getListOfBranchesWithStatus = jest.fn(() => Promise.resolve(branchStatusMock))
const getListGitSync = jest.fn(() => Promise.resolve(gitConfigs))

jest.mock('services/cd-ng', () => ({
  useGetServiceListForProject: jest
    .fn()
    .mockImplementation(() => ({ loading: false, data: services, refetch: jest.fn() })),
  useGetEnvironmentListForProject: jest
    .fn()
    .mockImplementation(() => ({ loading: false, data: environments, refetch: jest.fn() })),
  useListGitSync: jest.fn().mockImplementation(() => {
    return { data: gitConfigs, refetch: getListGitSync }
  }),
  useGetListOfBranchesWithStatus: jest.fn().mockImplementation(() => {
    return { data: branchStatusMock, refetch: getListOfBranchesWithStatus, loading: false }
  }),
  useGetSourceCodeManagers: jest.fn().mockImplementation(() => {
    return { data: sourceCodeManagers, refetch: jest.fn() }
  })
}))

const testPath = routes.toDeployments({
  accountId: ':accountId',
  orgIdentifier: ':orgIdentifier',
  projectIdentifier: ':projectIdentifier',
  module: ':module'
})
const testParams = {
  accountId: 'accountId',
  orgIdentifier: 'orgIdentifier',
  projectIdentifier: 'projectIdentifier',
  module: 'cd'
}

describe('Pipeline Deployments List', () => {
  test('CD module', () => {
    const { queryByText, queryAllByText } = render(
      <TestWrapper path={testPath} pathParams={testParams}>
        <DeploymentsList />
      </TestWrapper>
    )

    expect(queryByText('pipeline.noDeploymentText')).toBeTruthy()
    expect(queryAllByText('deploymentsText')).toBeTruthy()
  })

  test('CI module', () => {
    const { queryByText, queryAllByText } = render(
      <TestWrapper path={testPath} pathParams={{ ...testParams, module: 'ci' }}>
        <DeploymentsList />
      </TestWrapper>
    )

    expect(queryByText('pipeline.noBuildsText')).toBeTruthy()
    expect(queryAllByText('buildsText')).toBeTruthy()
  })

  test('STO module', () => {
    const { queryByText, queryAllByText } = render(
      <TestWrapper path={testPath} pathParams={{ ...testParams, module: 'sto' }}>
        <DeploymentsList />
      </TestWrapper>
    )

    expect(queryByText('stoSteps.noScansText')).toBeTruthy()
    expect(queryAllByText('common.purpose.sto.continuous')).toBeTruthy()
  })
})
