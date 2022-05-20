/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { screen, render, fireEvent, waitFor } from '@testing-library/react'
import { healthSourceMock } from '@cv/pages/monitored-service/components/ServiceHealth/components/MetricsAndLogs/__tests__/MetricsAndLogs.mock'
import { TestWrapper } from '@common/utils/testUtils'
import LogFilters from '../../LogFilters/LogFilters'
import type { LogFiltersProps } from '../../LogFilters/LogFilters.types'

jest.mock('services/cv', () => ({
  useGetAllHealthSourcesForMonitoredServiceIdentifier: jest.fn().mockImplementation(() => {
    return { data: healthSourceMock, error: null, loading: false }
  })
}))

const onFilterChange = jest.fn()
const onHealthSouceChange = jest.fn()

const initialProps: LogFiltersProps = {
  clusterTypeFilters: ['KNOWN_EVENT', 'UNEXPECTED_FREQUENCY', 'UNKNOWN_EVENT'],
  monitoredServiceIdentifier: 'abc',
  onFilterChange,
  onHealthSouceChange,
  selectedHealthSources: []
}

const WrapperComponent = (): JSX.Element => {
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
      <LogFilters {...initialProps} />
    </TestWrapper>
  )
}

describe('LogFilters', () => {
  test('Should test filters are calling the callbacks correctly', async () => {
    render(<WrapperComponent />)

    expect((screen.getByTestId('cv.known') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByTestId('cv.unknown') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByTestId('cv.unexpectedFrequency') as HTMLInputElement).checked).toBe(true)

    fireEvent.click(screen.getByTestId('cv.known'))

    expect(onFilterChange).toHaveBeenCalledWith(false, 'KNOWN_EVENT')

    fireEvent.click(screen.getByTestId('cv.unknown'))

    expect(onFilterChange).toHaveBeenNthCalledWith(2, false, 'UNKNOWN_EVENT')

    fireEvent.click(screen.getByTestId('cv.unexpectedFrequency'))

    expect(onFilterChange).toHaveBeenNthCalledWith(3, false, 'UNEXPECTED_FREQUENCY')

    fireEvent.click(screen.getByTestId('cv.unexpectedFrequency'))

    expect(onFilterChange).toHaveBeenNthCalledWith(4, true, 'UNEXPECTED_FREQUENCY')

    fireEvent.click(screen.getByTestId(/HealthSource_MultiSelect_DropDown/))
    await waitFor(() => expect(document.querySelector('[class*="menuItem"]')).not.toBeNull())

    fireEvent.click(screen.getByText(/custommetric/))

    expect(onHealthSouceChange).toHaveBeenCalledWith([
      { icon: { name: 'service-custom-connector' }, label: 'custommetric', value: 'service_prod/custommetric' }
    ])
  })
})
