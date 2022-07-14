/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { Connectors } from '@connectors/constants'
import { TestWrapper } from '@common/utils/testUtils'
import SplunkHealthSource from '../SplunkHealthSource'
import { data, mockedSplunkSampleData } from './SplunkHealthSource.mock'

const onNextMock = jest.fn().mockResolvedValue(jest.fn())
const onPrevious = jest.fn().mockResolvedValue(jest.fn())

jest.mock('@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs', () => ({
  ...(jest.requireActual('@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs') as any),
  get SetupSourceTabsContext() {
    return React.createContext({
      tabsInfo: [],
      sourceData: { sourceType: Connectors.SPLUNK },
      onNext: onNextMock,
      onPrevious: onPrevious
    })
  }
}))

jest.mock('services/cv', () => ({
  useGetSplunkSavedSearches: jest.fn().mockImplementation(() => ({
    data: [],
    refetch: jest.fn()
  })),
  useGetSplunkSampleData: jest.fn().mockImplementation(() => ({
    data: mockedSplunkSampleData,
    loading: false,
    error: null,
    refetch: jest.fn()
  }))
}))

describe('test splunkHealthsource', () => {
  test('check snapshot', () => {
    const { container } = render(
      <TestWrapper>
        <SplunkHealthSource data={data} onSubmit={jest.fn()} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
