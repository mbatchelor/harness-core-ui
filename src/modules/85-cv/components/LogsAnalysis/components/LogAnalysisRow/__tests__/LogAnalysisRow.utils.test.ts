/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { getCorrectLogsData, onClickErrorTrackingRow } from '../LogAnalysisRow.utils'

describe('Unit tests for LogAnalysisRow utils', () => {
  test('Verify if onClickErrorTrackingRow is generated correctly', async () => {
    window.open = jest.fn()
    const errorRow =
      'Logged Error | log.error() called! | LoggedErrorService.LoggedErrorService() | EventCallable1.EventCallable1() | 9 | S1 | 6 | 1646750996'
    window.location.href = 'http://localhost/#/ng/'
    const accountId = 'abc'
    const projectIdentifier = 'def'
    const orgIdentifier = 'ghi'
    onClickErrorTrackingRow(errorRow, accountId, projectIdentifier, orgIdentifier)
    const url = `http://localhost/#/account/${accountId}/cv/orgs/${orgIdentifier}/projects/${projectIdentifier}/et/arc/arc?event=ewogICAgICAgICAgInNlcnZpY2VfaWQiOiAiUzEiLAogICAgICAgICAgInZpZXdwb3J0X3N0cmluZ3MiOnsKICAgICAgICAgICAgImZyb21fdGltZXN0YW1wIjoiMTY0Njc0NzM5NiIsCiAgICAgICAgICAgICJ0b190aW1lc3RhbXAiOiIxNjQ2NzUwOTk2IiwKICAgICAgICAgICAgInVudGlsX25vdyI6ZmFsc2UsCiAgICAgICAgICAgICJtYWNoaW5lX2hhc2hlcyI6W10sCiAgICAgICAgICAgICJhZ2VudF9oYXNoZXMiOltdLAogICAgICAgICAgICAiZGVwbG95bWVudF9oYXNoZXMiOltdLAogICAgICAgICAgICAicmVxdWVzdF9pZHMiOls2XQogICAgICAgICAgfQogICAgICAgICAgLCJ0aW1lc3RhbXAiOiIxNjQ2NzUwOTk2IgogICAgICAgIH0=`
    expect(window.open).toHaveBeenCalled()
    expect(window.open).toHaveBeenCalledWith(url)
  })
})

describe('getCorrectLogsData function', () => {
  test('should return correct data based on the isServicePage flag', () => {
    const result = getCorrectLogsData(null, {}, false, false, null, null, false)

    expect(result).toEqual({ logsData: {}, logsError: null, logsLoading: false })
  })
})
