/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, getByTestId, getByText, queryByAttribute, render, waitFor } from '@testing-library/react'
import { act } from 'react-dom/test-utils'
import { useLocation } from 'react-router-dom'

import { TestWrapper } from '@common/utils/testUtils'
import { accountPathProps, pipelineModuleParams, pipelinePathProps } from '@common/utils/routeUtils'
import routes from '@common/RouteDefinitions'
import { defaultAppStoreValues } from '@common/utils/DefaultAppStoreData'
import filters from '@pipeline/pages/pipeline-deployment-list/__tests__/filters.json'
import services from '@pipeline/pages/pipelines/__tests__/mocks/services.json'
import environments from '@pipeline/pages/pipelines/__tests__/mocks/environments.json'
import mocks from '@pipeline/components/PipelineModalListView/__tests__/RunPipelineListViewMocks'

import { PipelineDeploymentListHeader } from '../ExecutionListSubHeader'

const mockGetCallFunction = jest.fn()

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
  })),
  useGetPipelineList: jest.fn().mockImplementation(args => {
    mockGetCallFunction(args)
    return { mutate: jest.fn(() => Promise.resolve(mocks)), cancel: jest.fn(), loading: false }
  })
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

jest.useFakeTimers()

const params = {
  accountId: 'testAcc',
  orgIdentifier: 'testOrg',
  projectIdentifier: 'test',
  pipelineIdentifier: 'pipeline1',
  module: 'cd'
}

const TEST_PATH = routes.toPipelines({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams })

function ComponentWrapper(): React.ReactElement {
  const location = useLocation()
  return (
    <React.Fragment>
      <PipelineDeploymentListHeader onRunPipeline={jest.fn()} />
      <div data-testid="location">{`${location.pathname}${location.search}`}</div>
    </React.Fragment>
  )
}

describe('<PipelineDeploymentListHeader /> test', () => {
  let renderedComponent: HTMLElement
  beforeEach(async () => {
    await act(async () => {
      const { container } = render(
        <TestWrapper path={TEST_PATH} pathParams={params} defaultAppStoreValues={defaultAppStoreValues}>
          <ComponentWrapper />
        </TestWrapper>
      )
      renderedComponent = container
    })
  })

  test('snapshot testing', () => {
    expect(renderedComponent).toMatchSnapshot()
  })

  test('test deployment list tabs by click on those tabs', async () => {
    const myDeploymentsCheckbox = getByText(renderedComponent, 'pipeline.myDeploymentsText')
    await act(async () => {
      fireEvent.click(myDeploymentsCheckbox!)
    })
    // Status
    const statusSelect = getByTestId(renderedComponent, 'status-select')
    await act(async () => {
      fireEvent.click(statusSelect!)
    })
    await waitFor(() => queryByAttribute('class', document.body, 'bp3-popover-content'))
    let portalDiv: HTMLElement = document.getElementsByClassName('bp3-portal')[0] as HTMLElement
    const firstStatusOption = getByText(portalDiv, 'pipeline.executionFilters.labels.Aborted')
    await act(async () => {
      fireEvent.click(firstStatusOption!)
    })

    await act(async () => {
      jest.runOnlyPendingTimers()
    })

    expect(getByTestId(renderedComponent, 'location')).toMatchInlineSnapshot(`
      <div
        data-testid="location"
      >
        /account/testAcc/cd/orgs/testOrg/projects/test/pipelines?myDeployments=true&status%5B0%5D=Aborted&page=1
      </div>
    `)

    // Pipelines
    const pipelineSelect = getByTestId(renderedComponent, 'pipeline-select')
    await act(async () => {
      fireEvent.click(pipelineSelect!)
    })
    portalDiv = document.getElementsByClassName('bp3-portal')[1] as HTMLElement
    const firstPipelineOption = getByText(portalDiv, 'pipeline1')
    await act(async () => {
      fireEvent.click(firstPipelineOption!)
    })

    await act(async () => {
      jest.runOnlyPendingTimers()
    })

    expect(getByTestId(renderedComponent, 'location')).toMatchInlineSnapshot(`
      <div
        data-testid="location"
      >
        /account/testAcc/cd/orgs/testOrg/projects/test/pipelines?myDeployments=true&status%5B0%5D=Aborted&page=1&pipelineIdentifier=pipeline1
      </div>
    `)
  })
})
