/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { RulesMode } from '@ce/constants'
import COGatewayCumulativeAnalytics from '../COGatewayCumulativeAnalytics'

const testParams = { accountId: 'accountId', orgIdentifier: 'orgIdentifier', projectIdentifier: 'projectIdentifier' }

const mockedResponse = {
  days: [
    '2021-04-25T00:00:00Z',
    '2021-04-26T00:00:00Z',
    '2021-04-27T00:00:00Z',
    '2021-04-28T00:00:00Z',
    '2021-04-29T00:00:00Z',
    '2021-04-30T00:00:00Z',
    '2021-05-01T00:00:00Z',
    '2021-05-02T00:00:00Z',
    '2021-05-03T00:00:00Z',
    '2021-05-04T00:00:00Z',
    '2021-05-05T00:00:00Z',
    '2021-05-06T00:00:00Z',
    '2021-05-07T00:00:00Z',
    '2021-05-08T00:00:00Z',
    '2021-05-09T00:00:00Z',
    '2021-05-10T00:00:00Z',
    '2021-05-11T00:00:00Z',
    '2021-05-12T00:00:00Z',
    '2021-05-13T00:00:00Z',
    '2021-05-14T00:00:00Z',
    '2021-05-15T00:00:00Z',
    '2021-05-16T00:00:00Z',
    '2021-05-17T00:00:00Z',
    '2021-05-18T00:00:00Z',
    '2021-05-19T00:00:00Z',
    '2021-05-20T00:00:00Z',
    '2021-05-21T00:00:00Z',
    '2021-05-22T00:00:00Z',
    '2021-05-23T00:00:00Z',
    '2021-05-24T00:00:00Z'
  ],
  potential_cost: [
    0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952,
    0.5952, 0.5952, 0.5952, 0.5952, 0.7352672312729965, 0.8928, 0.8928, 0.8928, 0.8928, 0.8928, 0.8928, 0.8928, 0.8928,
    0.8928, 0.8928, 0.8928
  ],
  actual_cost: [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.004736388347555556, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
  ],
  savings: [
    0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952, 0.5952,
    0.5952, 0.5952, 0.5952, 0.5952, 0.730530842925441, 0.8928, 0.8928, 0.8928, 0.8928, 0.8928, 0.8928, 0.8928, 0.8928,
    0.8928, 0.8928, 0.8928
  ],
  total_potential: 21.269667231273,
  total_cost: 0.004736388347555556,
  total_savings: 21.264930842925445,
  savings_percent: 99.97773172332197
}

jest.mock('highcharts-react-official', () => () => <div />)

jest.mock('services/lw', () => ({
  useCumulativeServiceSavings: jest
    .fn()
    .mockImplementation(() => ({ data: { response: mockedResponse }, loading: false }))
}))

describe('Cumulative Analytics tests', () => {
  test('render component', () => {
    const { container } = render(
      <TestWrapper pathParams={testParams}>
        <COGatewayCumulativeAnalytics data={mockedResponse} loadingData={false} mode={RulesMode.ACTIVE} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
