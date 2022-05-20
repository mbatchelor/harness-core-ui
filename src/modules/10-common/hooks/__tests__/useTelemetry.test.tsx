/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { renderHook } from '@testing-library/react-hooks'
import React from 'react'
import { TestWrapper } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import type { ModuleLicenseDTO } from 'services/cd-ng'
import { Editions, ModuleLicenseType } from '@common/constants/SubscriptionTypes'
import { useTelemetry } from '../useTelemetry'

const identifyMock = jest.fn()
const trackMock = jest.fn()
const pageMock = jest.fn()
jest.mock('@common/hooks/useTelemetryInstance', () => {
  return {
    useTelemetryInstance: () => {
      return {
        identify: identifyMock,
        track: trackMock,
        page: pageMock,
        initialized: true
      }
    }
  }
})

describe('useTelemetry', () => {
  test('identifyUser', () => {
    const email = 'test@harness.io'
    const wrapper = ({ children }: React.PropsWithChildren<unknown>): React.ReactElement => (
      <TestWrapper path={routes.toProjects({ accountId: 'dummy' })} pathParams={{ accountId: 'dummy' }}>
        {children}
      </TestWrapper>
    )
    const { result } = renderHook(
      () =>
        useTelemetry({
          pageName: 'page'
        }),
      { wrapper }
    )
    result.current.identifyUser(email)
    result.current.trackEvent('event1', {})
    expect(identifyMock).toHaveBeenCalledWith({ properties: { hotjar_link: undefined }, userId: email })
    expect(trackMock).toHaveBeenCalledWith({
      event: 'event1',
      properties: { groupId: undefined, userId: '', source: 'NG UI' }
    })
    expect(pageMock).toHaveBeenCalledWith({
      name: 'page',
      category: '',
      properties: {
        userId: '',
        source: 'NG UI'
      }
    })
  })

  test('should include license properties if any', () => {
    const defaultLicenseStoreValues = {
      licenseInformation: {
        CD: {
          edition: Editions.ENTERPRISE,
          licenseType: ModuleLicenseType.PAID as ModuleLicenseDTO['licenseType']
        }
      }
    }
    const email = 'test@harness.io'
    const wrapper = ({ children }: React.PropsWithChildren<unknown>): React.ReactElement => (
      <TestWrapper
        path={routes.toCDHome({ accountId: 'dummy' })}
        pathParams={{ accountId: 'dummy' }}
        defaultLicenseStoreValues={defaultLicenseStoreValues}
      >
        {children}
      </TestWrapper>
    )
    const { result } = renderHook(
      () =>
        useTelemetry({
          pageName: 'page'
        }),
      { wrapper }
    )
    result.current.identifyUser(email)
    result.current.trackEvent('event2', {})
    expect(identifyMock).toHaveBeenCalledWith({ properties: { hotjar_link: undefined }, userId: email })
    expect(trackMock).toHaveBeenCalledWith({
      event: 'event2',
      properties: {
        source: 'NG UI',
        groupId: undefined,
        userId: '',
        licenseEdition: 'ENTERPRISE',
        licenseType: 'PAID',
        module: 'cd'
      }
    })
    expect(pageMock).toHaveBeenCalledWith({
      name: 'page',
      category: '',
      properties: {
        source: 'NG UI',
        userId: '',
        licenseEdition: 'ENTERPRISE',
        licenseType: 'PAID',
        module: 'cd'
      }
    })
  })
})
