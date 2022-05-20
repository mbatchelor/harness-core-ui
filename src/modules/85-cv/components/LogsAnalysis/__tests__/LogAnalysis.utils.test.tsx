/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { StringKeys } from 'framework/strings'
import { getClusterTypes, getLogAnalysisTableData } from '../LogAnalysis.utils'
import { LogEvents } from '../LogAnalysis.types'
import { mockedLogsData, mockedLogsTableData } from './LogAnalysis.mocks'

function getString(key: StringKeys): StringKeys {
  return key
}

describe('Unit tests for LogAnalysis utils', () => {
  test('Verify if getClusterTypes gives correct results', async () => {
    expect(getClusterTypes(getString)).toEqual([
      { label: 'cv.known', value: LogEvents.KNOWN },
      { label: 'cv.unknown', value: LogEvents.UNKNOWN },
      { label: 'cv.unexpected', value: LogEvents.UNEXPECTED }
    ])
  })

  test('Verify if getLogAnalysisTableData method gives the correct logs analysis Table data', async () => {
    expect(getLogAnalysisTableData(mockedLogsData)).toEqual(mockedLogsTableData)
  })
})
