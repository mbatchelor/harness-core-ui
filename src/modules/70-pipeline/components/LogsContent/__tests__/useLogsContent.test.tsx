/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { renderHook, act } from '@testing-library/react-hooks'

import { TestWrapper } from '@common/utils/testUtils'
import { logBlobPromise } from 'services/logs'
import { useLogsContent } from '../useLogsContent'

const startStream = jest.fn()
const closeStream = jest.fn()
jest.mock('services/logs', () => ({
  useGetToken: jest.fn(() => ({ data: 'logs_token' })),
  logBlobPromise: jest.fn(() => Promise.resolve({}))
}))

jest.mock('../useLogsStream.ts', () => ({ useLogsStream: jest.fn(() => ({ startStream, closeStream })) }))

describe('useLogsContent tests', () => {
  beforeEach(() => {
    startStream.mockReset()
  })
  test('fetches blob data', () => {
    ;(logBlobPromise as jest.Mock).mockImplementation(() => Promise.resolve('{}'))
    const { result } = renderHook(useLogsContent, { wrapper: TestWrapper })

    act(() => {
      result.current.actions.createSections({
        node: {
          status: 'Success',
          executableResponses: [
            {
              task: { logKeys: ['logKey1'] } as any
            }
          ]
        },
        getSectionName: (i: number) => `Section ${i}`,
        selectedStage: '',
        selectedStep: ''
      })
    })

    expect(logBlobPromise).toHaveBeenCalledWith(
      {
        queryParams: { 'X-Harness-Token': '', accountID: undefined, key: 'logKey1' },
        requestOptions: { headers: { 'X-Harness-Token': 'logs_token' } }
      },
      expect.any(AbortSignal)
    )
  })

  test('fetches stream data', () => {
    const { result } = renderHook(useLogsContent, { wrapper: TestWrapper })

    act(() => {
      act(() => {
        result.current.actions.createSections({
          node: {
            status: 'Running',
            executableResponses: [
              {
                task: { logKeys: ['logKey1'] } as any
              }
            ]
          },
          getSectionName: (i: number) => `Section ${i}`,
          selectedStage: '',
          selectedStep: ''
        })
      })
    })

    expect(startStream).toHaveBeenCalledWith({
      queryParams: { accountId: undefined, key: 'logKey1' },
      headers: { Authorization: '', 'X-Harness-Token': 'logs_token' },
      key: 'logKey1'
    })
  })
})
