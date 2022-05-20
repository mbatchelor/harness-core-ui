/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import qs, { IStringifyOptions } from 'qs'
import { EventSourcePolyfill } from 'event-source-polyfill'
import { useHistory, useParams } from 'react-router-dom'
import SessionToken from 'framework/utils/SessionToken'
import { returnUrlParams } from '@common/utils/routeUtils'
import { getLoginPageURL } from 'framework/utils/SessionUtils'
import routes from '@common/RouteDefinitions'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { useDeepCompareEffect } from './useDeepCompareEffect'

interface EventSourceListenerReturn {
  startListening: () => void
  stopListening: () => void
}

enum EventType {
  MESSAGE = 'message',
  OPEN = 'open',
  ERROR = 'error'
}

export type EventSourceEvent<T> = {
  onOpen?: () => void
  onError?: (event?: Event) => void
  onParseError?: (error?: Error) => void
  onMessage: (event: { data: T; event: Event }) => void
  options?: boolean | AddEventListenerOptions | EventListenerOptions
}

interface EventSourceListenerProps<T> {
  url: string
  event: EventSourceEvent<T>
  queryParams?: Record<string, unknown>
  queryParamStringifyOptions?: IStringifyOptions
  lazy?: boolean
}

export function useEventSourceListener<T = unknown>({
  url,
  event,
  lazy = false,
  queryParams,
  queryParamStringifyOptions
}: EventSourceListenerProps<T>): EventSourceListenerReturn {
  const [init, setInit] = useState<boolean>(false)
  const { accountId } = useParams<AccountPathProps>()
  const history = useHistory()
  const [forceStop, setForceStop] = React.useState(false)
  const [source, setSource] = useState<EventSource>()
  const { onMessage, onError, onOpen, onParseError, options } = event
  const token = SessionToken.getToken()

  const getRequestOptions = React.useCallback((): Partial<RequestInit> => {
    const headers: HeadersInit = {}

    if (token && token.length > 0) {
      headers.Authorization = `Bearer ${token}`
    }

    return { headers }
  }, [token])

  const getQueryParams = (params?: Record<string, unknown>): string => {
    return `?${qs.stringify({ ...params, routingId: accountId }, queryParamStringifyOptions)}`
  }

  const onMessageEventListener = (_event: Event & { data: string }): void => {
    let parsedData

    try {
      parsedData = JSON.parse(_event.data)
      onMessage({ data: parsedData, event: _event })
    } catch (e) {
      onParseError?.(e as Error)
    }
  }

  const onOpenEventListener = (): void => {
    onOpen?.()
  }

  const onErrorEventListener = (_event: Event): void => {
    onError?.(_event)
  }

  useDeepCompareEffect(() => {
    if (!token) {
      history.push({
        pathname: routes.toRedirect(),
        search: returnUrlParams(getLoginPageURL({ returnUrl: window.location.href }))
      })
    } else {
      setSource(new EventSourcePolyfill(`${url}${getQueryParams(queryParams)}`, getRequestOptions()))
    }
  }, [url, token, queryParams, accountId])

  const createListener = (_source: EventSource): void => {
    removeListener(_source)

    _source.addEventListener(EventType.MESSAGE, onMessageEventListener as EventListenerOrEventListenerObject, options)
    _source.addEventListener(EventType.OPEN, onOpenEventListener as EventListenerOrEventListenerObject, options)
    _source.addEventListener(EventType.ERROR, onErrorEventListener as EventListenerOrEventListenerObject, options)

    !init && setInit(false)
  }

  const removeListener = (_source: EventSource): void => {
    _source.removeEventListener(
      EventType.MESSAGE,
      onMessageEventListener as EventListenerOrEventListenerObject,
      options
    )
    _source.removeEventListener(EventType.OPEN, onOpenEventListener as EventListenerOrEventListenerObject, options)
    _source.removeEventListener(EventType.ERROR, onErrorEventListener as EventListenerOrEventListenerObject, options)
  }

  useEffect(() => {
    if (source && (init || !lazy) && !forceStop) {
      createListener(source)
    }

    return () => {
      if (source) {
        removeListener(source)
        source.close()
      }
    }
  }, [source])

  const startListening = React.useCallback(() => {
    if (source) {
      createListener(source)
      setForceStop(false)
    }
  }, [source])

  const stopListening = React.useCallback(() => {
    if (source) {
      removeListener(source)
      setForceStop(true)
    }
  }, [source])

  return { startListening, stopListening }
}
