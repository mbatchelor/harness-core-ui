/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { queryByText, render, fireEvent } from '@testing-library/react'
import { Provider } from 'urql'
import { fromValue } from 'wonka'
import { TestWrapper } from '@common/utils/testUtils'
import * as FeatureFlag from '@common/hooks/useFeatureFlag'
import AnomaliesFilter from '../AnomaliesFilter'

const params = {
  accountId: 'TEST_ACC',
  perspetiveId: 'perspectiveId',
  perspectiveName: 'sample perspective'
}

describe('test case for anomalies detection overview page', () => {
  test('should be able to render the overview dashboard', async () => {
    jest.spyOn(FeatureFlag, 'useFeatureFlag').mockReturnValue(true)
    const responseState = {
      executeQuery: () => {
        return fromValue({})
      }
    }

    const setFilters = jest.fn()
    const { container } = render(
      <TestWrapper pathParams={params}>
        <Provider value={responseState as any}>
          <AnomaliesFilter
            filters={{}}
            setFilters={setFilters}
            timeRange={{
              to: '2022-10-02',
              from: '2022-10-02'
            }}
            setTimeRange={jest.fn}
          />
        </Provider>
      </TestWrapper>
    )

    const cloudProvider = queryByText(container, 'ce.anomalyDetection.filters.groupByCloudProvidersPlaceholder')

    fireEvent.click(cloudProvider!)

    fireEvent.click(queryByText(container, 'GCP')!)

    expect(setFilters).toBeCalledWith('CLOUD_PROVIDER', 'IN', 'gcp')
  })
})
