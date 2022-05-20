/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor, screen } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import type { LogData } from 'services/cv'
import { LogAnalysisRiskAndJiraModal } from '../LogAnalysisRiskAndJiraModal'
import type { LogAnalysisRiskAndJiraModalProps } from '../LogAnalysisRiskAndJiraModal.types'

const WrapperComponent = (props: LogAnalysisRiskAndJiraModalProps): JSX.Element => {
  return (
    <TestWrapper>
      <LogAnalysisRiskAndJiraModal {...props} />
    </TestWrapper>
  )
}

describe('Unit tests for LogAnalysisRiskAndJiraModal', () => {
  const initialProps: LogAnalysisRiskAndJiraModalProps = {
    onHide: jest.fn(),
    rowData: {
      clusterType: 'UNKNOWN' as LogData['tag'],
      count: 14,
      message: 'Sample event text',
      messageFrequency: [
        { name: 'testData', type: 'column', color: 'var(--red-400)', data: [14, 10, 8, 20, 4, 5, 5, 4, 5] }
      ],
      riskStatus: 'NO_DATA'
    },
    isDataLoading: false
  }
  test('Verify if all the fields are rendered correctly inside LogAnalysisRiskAndJiraModal', async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { getByText } = render(<WrapperComponent {...initialProps} />)

    await waitFor(() => {
      expect(getByText('instanceFieldOptions.instanceHolder')).toBeInTheDocument()
      expect(getByText('Unknown')).toBeInTheDocument()

      expect(getByText(initialProps.rowData.count.toString())).toBeInTheDocument()

      expect(getByText('pipeline.verification.logs.sampleEvent')).not.toBeNull()
      expect(getByText('Sample event text')).toBeInTheDocument()
    })
  })

  test('should verify loading UI is shown if the data is loading', () => {
    render(<WrapperComponent {...initialProps} isDataLoading />)

    expect(screen.getByTestId('LogAnalysisRiskAndJiraModal_loader')).toBeInTheDocument()
  })

  test('should verify error UI is shown if the API call fails', () => {
    const errorObj = {
      message: 'Failed to fetch: Failed to fetch',
      data: 'Failed to fetch'
    }

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    render(<WrapperComponent {...initialProps} logsError={errorObj} rowData={{} as LogAnalysisRowData} />)

    expect(screen.getByTestId('LogAnalysisRiskAndJiraModal_error')).toBeInTheDocument()
  })

  test('should not show error when data is available', () => {
    const errorObj = {
      message: 'Failed to fetch: Failed to fetch',
      data: 'Failed to fetch'
    }

    render(<WrapperComponent {...initialProps} logsError={errorObj} />)

    expect(screen.queryByTestId('LogAnalysisRiskAndJiraModal_error')).not.toBeInTheDocument()
  })
})
