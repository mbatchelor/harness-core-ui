/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'
import userEvent from '@testing-library/user-event'
import { TestWrapper } from '@common/utils/testUtils'
import * as cfServicesMock from 'services/cf'
import FlagPipelineTab, { FlagPipelineTabProps } from '../FlagPipelineTab'
import mockAvailablePipelines from './__data__/mockAvailablePipelines'

const renderComponent = (props: Partial<FlagPipelineTabProps> = {}): void => {
  render(
    <TestWrapper
      path="/account/:accountId/cf/orgs/:orgIdentifier/projects/:projectIdentifier/feature-flags/TEST_FLAG"
      pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      queryParams={{ tab: 'flag_pipeline', activeEnvironment: 'TEST_ENV' }}
    >
      <FlagPipelineTab flagIdentifier="TEST_FLAG" {...props} />
    </TestWrapper>
  )
}

describe('FlagPipelineTab', () => {
  const refetchMock = jest.fn()
  beforeAll(() => {
    jest.spyOn(cfServicesMock, 'useGetAvailableFeaturePipelines').mockReturnValue({
      data: {
        availablePipelines: mockAvailablePipelines
      },
      loading: false,
      refetch: refetchMock
    } as any)
  })

  test('it should let user select a flag pipeline when non configured', async () => {
    renderComponent()

    // assert empty state initially
    const addFlagPipelineButton = screen.getByRole('button', { name: 'cf.featureFlags.flagPipeline.noDataButtonText' })
    expect(screen.getByText('cf.featureFlags.flagPipeline.noDataMessage')).toBeInTheDocument()
    expect(addFlagPipelineButton).toBeInTheDocument()
    expect(screen.getByText('cf.featureFlags.flagPipeline.noDataDescription')).toBeInTheDocument()

    // assert drawer opens with correct text. Save button hidden initially
    userEvent.click(addFlagPipelineButton)
    expect(screen.getByText('cf.featureFlags.flagPipeline.drawerTitle')).toBeInTheDocument()
    expect(screen.getByText('cf.featureFlags.flagPipeline.drawerDescription')).toBeInTheDocument()
    expect(screen.getByText('cf.featureFlags.flagPipeline.drawerEnvText')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'cf.featureFlags.flagPipeline.drawerButtonText' })
    ).not.toBeInTheDocument()

    // assert correct number of pipelines and pipeline content is displayed
    await waitFor(() => {
      expect(screen.getAllByRole('listitem')).toHaveLength(mockAvailablePipelines.length)
      expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Pipeline 1Pipeline 1 description')
    })

    // select a pipeline
    const itemToSelect = screen.getAllByRole('listitem')[4]
    userEvent.click(itemToSelect)
    await waitFor(() => expect(itemToSelect).toHaveClass('cardActive'))

    const savePipelineButton = screen.getByRole('button', { name: 'cf.featureFlags.flagPipeline.drawerButtonText' })
    expect(savePipelineButton).toBeInTheDocument()
  })

  test('it should let user search for a flag pipeline', async () => {
    renderComponent()
    const addFlagPipelineButton = screen.getByRole('button', {
      name: 'cf.featureFlags.flagPipeline.noDataButtonText'
    })
    userEvent.click(addFlagPipelineButton)

    const searchInput = screen.getByPlaceholderText('Search')
    expect(searchInput).toBeInTheDocument()

    userEvent.type(searchInput, 'pipeline 1', { allAtOnce: true })

    await waitFor(() =>
      expect(refetchMock).toBeCalledWith({
        debounce: 500,
        queryParams: {
          accountIdentifier: 'dummy',
          environmentIdentifier: '',
          identifier: 'TEST_FLAG',
          orgIdentifier: 'dummy',
          pageNumber: 0,
          pageSize: 100,
          pipelineName: 'pipeline 1',
          projectIdentifier: 'dummy'
        }
      })
    )
  })

  test('it should close drawer when close icon clicked', async () => {
    renderComponent()
    const addFlagPipelineButton = screen.getByRole('button', {
      name: 'cf.featureFlags.flagPipeline.noDataButtonText'
    })

    userEvent.click(addFlagPipelineButton)

    const closeDrawerButton = screen.getByTestId('close-drawer-button')
    userEvent.click(closeDrawerButton)

    await waitFor(() => expect(screen.queryByText('cf.featureFlags.flagPipeline.drawerTitle')).not.toBeInTheDocument())
  })

  test('it should show loading spinner when available pipelines loading', async () => {
    jest.spyOn(cfServicesMock, 'useGetAvailableFeaturePipelines').mockReturnValue({
      data: {
        availablePipelines: mockAvailablePipelines
      },
      loading: true,
      refetch: jest.fn()
    } as any)

    renderComponent()
    const addFlagPipelineButton = screen.getByRole('button', {
      name: 'cf.featureFlags.flagPipeline.noDataButtonText'
    })
    userEvent.click(addFlagPipelineButton)

    await waitFor(() => expect(screen.getByText('Loading, please wait...')).toBeInTheDocument())
  })

  test.each([undefined, null, { availablePipelines: [] }])(
    'it should show correct message when availablePipelines object is %s',
    async data => {
      jest.spyOn(cfServicesMock, 'useGetAvailableFeaturePipelines').mockReturnValue({
        data,
        loading: false,
        refetch: jest.fn()
      } as any)

      renderComponent()
      const addFlagPipelineButton = screen.getByRole('button', {
        name: 'cf.featureFlags.flagPipeline.noDataButtonText'
      })
      userEvent.click(addFlagPipelineButton)

      await waitFor(() =>
        expect(screen.getByText('cf.featureFlags.flagPipeline.noAvailablePipelines')).toBeInTheDocument()
      )
    }
  )
})
