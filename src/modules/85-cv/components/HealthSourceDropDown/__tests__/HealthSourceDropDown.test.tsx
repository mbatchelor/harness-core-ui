/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { findByText, act, fireEvent, render, waitFor } from '@testing-library/react'
import { findPopoverContainer, TestWrapper } from '@common/utils/testUtils'
import type { StringKeys } from 'framework/strings'
import * as cvService from 'services/cv'
import { HealthSourceDropDown } from '../HealthSourceDropDown'
import { VerificationType } from '../HealthSourceDropDown.constants'
import { getDropdownOptions } from '../HealthSourceDropDown.utils'
import { mockedHealthSourcesData, mockedMultipleHealthSourcesData } from './HealthSourceDropDown.mock'

function getString(key: StringKeys): StringKeys {
  return key
}

describe('Unit tests for HealthSourceDropDown', () => {
  const dropdownData = {
    loading: false,
    error: null,
    data: null,
    verificationType: VerificationType.TIME_SERIES
  }

  test('Should return loading option when loading is true', async () => {
    const newDropdownData = { ...dropdownData, loading: true }
    expect(getDropdownOptions(newDropdownData, getString)).toEqual([{ value: '', label: 'loading' }])
  })

  test('Should return the health source option when loading is false and there is only one health source', async () => {
    const newDropdownData = {
      ...dropdownData,
      data: mockedHealthSourcesData as cvService.RestResponseSetHealthSourceDTO
    }
    expect(getDropdownOptions(newDropdownData, getString)).toEqual([
      {
        label: 'Appd Health source',
        value: 'Appd_Monitored_service/Appd_Health_source',
        icon: {
          name: 'service-appdynamics'
        }
      }
    ])
  })

  test('Should also return the All option whenever there are multiple health sources of same verificationType', async () => {
    const newDropdownData = {
      ...dropdownData,
      data: mockedMultipleHealthSourcesData as cvService.RestResponseSetHealthSourceDTO
    }
    expect(getDropdownOptions(newDropdownData, getString)).toEqual([
      {
        label: 'all',
        value: 'all'
      },
      {
        icon: {
          name: 'service-appdynamics'
        },
        label: 'Appd Health source',
        value: 'Appd_Monitored_service/Appd_Health_source'
      },
      {
        icon: {
          name: 'service-prometheus'
        },
        label: 'Prometheus Health source',
        value: 'Appd_Monitored_service/Prometheus_Health_source'
      }
    ])
  })

  test('should ensure that useGetAllHealthSourcesForMonitoredServiceIdentifier is called with monitoredServiceIdentifier', async () => {
    jest
      .spyOn(cvService, 'useGetAllHealthSourcesForMonitoredServiceIdentifier')
      .mockReturnValue({ data: mockedHealthSourcesData, error: null, loading: false } as any)
    render(
      <TestWrapper>
        <HealthSourceDropDown monitoredServiceIdentifier="monitored_service_identifier" onChange={jest.fn()} />
      </TestWrapper>
    )

    await waitFor(() =>
      expect(cvService.useGetAllHealthSourcesForMonitoredServiceIdentifier).toHaveBeenLastCalledWith({
        monitoredServiceIdentifier: 'monitored_service_identifier',
        queryParams: {
          accountId: undefined,
          orgIdentifier: undefined,
          projectIdentifier: undefined
        }
      })
    )
  })

  test('should ensure that useGetAllHealthSourcesForMonitoredServiceIdentifier is called with healthsource filter', async () => {
    const cloneMockedHealthSourcesData = { ...mockedHealthSourcesData }
    cloneMockedHealthSourcesData.resource.push({
      identifier: 'Appd_Monitored_service/Appd_Health_source_updated',
      name: 'Appd Health source updated',
      type: 'APP_DYNAMICS',
      verificationType: 'TIME_SERIES'
    })
    jest
      .spyOn(cvService, 'useGetAllHealthSourcesForMonitoredServiceIdentifier')
      .mockReturnValue({ data: cloneMockedHealthSourcesData, error: null, loading: false } as any)

    const onChange = jest.fn()
    const { container } = render(
      <TestWrapper>
        <HealthSourceDropDown monitoredServiceIdentifier="monitored_service_identifier" onChange={onChange} />
      </TestWrapper>
    )

    const healthSourceDropdown = container.querySelector('input[name="healthsources-select"]') as HTMLInputElement

    const selectCaret = container
      .querySelector(`[name="healthsources-select"] + [class*="bp3-input-action"]`)
      ?.querySelector('[data-icon="chevron-down"]')
    await waitFor(() => {
      fireEvent.click(selectCaret!)
    })

    const options = findPopoverContainer()?.querySelectorAll('.Select--menuItem')
    expect(options?.length).toEqual(3)
    expect(container).toMatchSnapshot()

    const typeToSelect = await findByText(container, 'Appd Health source updated')
    act(() => {
      fireEvent.click(typeToSelect)
    })

    expect(healthSourceDropdown.value).toBe('Appd Health source updated')

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('Appd_Monitored_service/Appd_Health_source_updated'))

    const selectCaretNewItem = container
      .querySelector(`[name="healthsources-select"] + [class*="bp3-input-action"]`)
      ?.querySelector('[data-icon="chevron-down"]')
    await waitFor(() => {
      fireEvent.click(selectCaretNewItem!)
    })

    const typeToSelectNewInput = await findByText(container, 'all')

    act(() => {
      fireEvent.click(typeToSelectNewInput)
    })
    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(''))
  })
})
