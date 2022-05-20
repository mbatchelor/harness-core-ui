/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor, screen, fireEvent } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import * as cvService from 'services/cv'
import { LogAnalysisRow } from '../LogAnalysisRow'
import { mockedLogAnalysisData, mockLogsCall, mockServicePageLogsCall } from './LogAnalysisRow.mocks'
import type { LogAnalysisRowData, LogAnalysisRowProps } from '../LogAnalysisRow.types'
import * as utils from '../LogAnalysisRow.utils'

const WrapperComponent = (props: LogAnalysisRowProps): JSX.Element => {
  return (
    <TestWrapper
      path="account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier/pipeline/executions/:executionId/pipeline"
      pathParams={{
        accountId: '1234_accountId',
        projectIdentifier: '1234_project',
        orgIdentifier: '1234_ORG',
        executionId: 'Test_execution'
      }}
    >
      <LogAnalysisRow {...props} />
    </TestWrapper>
  )
}

const fetchLogsAnalysisData = jest.fn()
const fetchLogsAnalysisDataForServicePage = jest.fn()

jest.spyOn(cvService, 'useGetVerifyStepDeploymentLogAnalysisRadarChartResult').mockReturnValue({
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  data: mockLogsCall,
  refetch: fetchLogsAnalysisData
})

jest.spyOn(cvService, 'useGetAllRadarChartLogsData').mockReturnValue({
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  data: mockServicePageLogsCall,
  refetch: fetchLogsAnalysisDataForServicePage
})

describe('Unit tests for LogAnalysisRow', () => {
  const initialProps = {
    data: mockedLogAnalysisData.resource.content as LogAnalysisRowData[],
    goToPage: jest.fn()
  }

  test('Verify if Logs Record Table is rendered correctly', async () => {
    render(<WrapperComponent {...initialProps} />)
    // Verify if number of records returned by the api for the first page matches with the number of records shown in the Logs Table
    await waitFor(() =>
      expect(screen.getAllByTestId('logs-data-row')).toHaveLength(mockedLogAnalysisData.resource.content.length)
    )
  })

  test('Verify if clicking on the row opens the slider with complete details', () => {
    render(<WrapperComponent {...initialProps} />)
    const firstRow = screen.getAllByTestId('logs-data-row')[0]

    expect(screen.queryByTestId('LogAnalysis_detailsDrawer')).not.toBeInTheDocument()

    fireEvent.click(firstRow)

    expect(screen.getByTestId('LogAnalysis_detailsDrawer')).toBeInTheDocument()

    expect(screen.getAllByText('pipeline.verification.logs.eventType')).toHaveLength(2)
    expect(screen.getByText('cv.sampleMessage')).toBeInTheDocument()
  })

  test('Verify if clicking on an error row that it calls onClickErrorTrackingRow', async () => {
    const clickErrorTrackingSpy = jest.spyOn(utils, 'onClickErrorTrackingRow').mockReturnValue()

    render(<WrapperComponent isErrorTracking={true} {...initialProps} />)

    const firstRowError = screen.getAllByTestId('logs-data-row')[0]
    await waitFor(() => {
      fireEvent.click(firstRowError.childNodes[0].childNodes[0])
    })
    expect(clickErrorTrackingSpy).toHaveBeenCalled()
  })

  test('should open the drawer if correct selectedLog is passed as props', () => {
    const resetSelectedLog = jest.fn()
    const { rerender } = render(
      <TestWrapper>
        <LogAnalysisRow {...initialProps} resetSelectedLog={resetSelectedLog} />
      </TestWrapper>
    )

    expect(screen.queryByTestId('LogAnalysis_detailsDrawer')).not.toBeInTheDocument()

    rerender(
      <TestWrapper>
        <LogAnalysisRow {...initialProps} selectedLog="abc" resetSelectedLog={resetSelectedLog} />
      </TestWrapper>
    )

    expect(fetchLogsAnalysisData).not.toHaveBeenCalled()

    expect(screen.queryByTestId('LogAnalysis_detailsDrawer')).toBeInTheDocument()

    fireEvent.click(screen.getByTestId('DrawerClose_button'))

    expect(resetSelectedLog).toHaveBeenCalled()
    expect(screen.queryByTestId('LogAnalysis_detailsDrawer')).not.toBeInTheDocument()
  })

  test('should make API call to fetch logs data if the data is not already present', () => {
    const resetSelectedLog = jest.fn()

    render(<WrapperComponent {...initialProps} selectedLog="def" resetSelectedLog={resetSelectedLog} />)

    expect(fetchLogsAnalysisData).toHaveBeenCalledWith({
      queryParams: { accountId: '1234_accountId', clusterId: 'def' }
    })
    expect(screen.queryByTestId('LogAnalysis_detailsDrawer')).toBeInTheDocument()
  })

  test('should make service page API call to fetch logs data if the data is not already present', () => {
    const resetSelectedLog = jest.fn()

    const props = {
      ...initialProps,
      startTime: 33,
      endTime: 6786,
      monitoredServiceIdentifier: 'sdfs',
      isServicePage: true,
      selectedLog: 'tyu',
      resetSelectedLog
    }

    render(<WrapperComponent {...props} />)

    expect(fetchLogsAnalysisDataForServicePage).toHaveBeenCalledWith({
      queryParams: {
        accountId: '1234_accountId',
        clusterId: 'tyu',
        endTime: 6786,
        monitoredServiceIdentifier: 'sdfs',
        startTime: 33,
        orgIdentifier: '1234_ORG',
        projectIdentifier: '1234_project'
      }
    })

    expect(screen.queryByTestId('LogAnalysis_detailsDrawer')).toBeInTheDocument()
  })
})
