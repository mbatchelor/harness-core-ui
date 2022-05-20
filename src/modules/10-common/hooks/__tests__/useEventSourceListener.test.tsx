/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { fireEvent, render, act } from '@testing-library/react'
import React from 'react'
import SessionToken from 'framework/utils/SessionToken'
import routes from '@common/RouteDefinitions'
import { TestWrapper } from '@common/utils/testUtils'
import { useEventSourceListener } from '../useEventSourceListener'

const addEventListener = jest.fn()
const removeEventListener = jest.fn()
const eventSource: EventSource = {
  url: 'test-url',
  readyState: 0,
  withCredentials: false,
  close: jest.fn(),
  onerror: jest.fn(),
  onmessage: jest.fn(),
  onopen: jest.fn(),
  removeEventListener,
  addEventListener,
  dispatchEvent: jest.fn(),
  CLOSED: 2,
  CONNECTING: 0,
  OPEN: 1
}

jest.mock('event-source-polyfill', () => ({
  EventSourcePolyfill: jest.fn().mockImplementation(() => eventSource)
}))

const Wrapped = ({ lazy = false }: { lazy?: boolean }): React.ReactElement => {
  const [message, setMessage] = React.useState<string>('')

  const { startListening, stopListening } = useEventSourceListener<string>({
    url: 'test-url',
    queryParams: {
      projectid: 'projectid',
      orgid: 'orgid',
      orgmd: ['a', 'b']
    },
    queryParamStringifyOptions: {
      arrayFormat: 'repeat'
    },
    lazy,
    event: { onMessage: event => setMessage(event.data) }
  })

  return (
    <div>
      <p>{message}</p>
      <button onClick={startListening}>Start Streaming</button>
      <button onClick={stopListening}>Stop Streaming</button>
    </div>
  )
}

describe('use Event Source Stream', () => {
  test('Redirect to login if there is no token', async () => {
    const { getByTestId } = render(
      <TestWrapper path={routes.toProjects({ accountId: 'dummy' })} pathParams={{ accountId: 'dummy' }}>
        <Wrapped />
      </TestWrapper>
    )
    expect(getByTestId('location').innerHTML.includes(routes.toRedirect())).toBeTruthy()
  })
  test('On Mount listeners should be added', async () => {
    jest.spyOn(SessionToken, 'getToken').mockReturnValue('token')

    render(
      <TestWrapper path={routes.toProjects({ accountId: 'dummy' })} pathParams={{ accountId: 'dummy' }}>
        <Wrapped />
      </TestWrapper>
    )
    expect(removeEventListener).toHaveBeenCalledTimes(3)
    expect(addEventListener).toHaveBeenCalledTimes(3)
  })
  test('Lazy streaming', async () => {
    jest.spyOn(SessionToken, 'getToken').mockReturnValue('token')
    jest.clearAllMocks()

    const { getByText } = render(
      <TestWrapper path={routes.toProjects({ accountId: 'dummy' })} pathParams={{ accountId: 'dummy' }}>
        <Wrapped lazy={true} />
      </TestWrapper>
    )
    expect(addEventListener).toHaveBeenCalledTimes(0)
    jest.clearAllMocks()

    const startStreaming = getByText('Start Streaming')
    expect(startStreaming).toBeTruthy()
    act(() => {
      fireEvent.click(startStreaming)
    })
    expect(removeEventListener).toHaveBeenCalledTimes(3)
    expect(addEventListener).toHaveBeenCalledTimes(3)
    jest.clearAllMocks()

    const stopStreaming = getByText('Stop Streaming')
    expect(stopStreaming).toBeTruthy()
    act(() => {
      fireEvent.click(stopStreaming)
    })
    expect(addEventListener).toHaveBeenCalledTimes(0)
    expect(removeEventListener).toHaveBeenCalledTimes(3)
  })
})
