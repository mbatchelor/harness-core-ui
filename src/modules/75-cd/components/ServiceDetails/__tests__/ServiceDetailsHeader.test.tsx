/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import * as cdngServices from 'services/cd-ng'
import { ServiceDetailsHeader } from '../ServiceDetailsHeader/ServiceDetailsHeader'

describe('ServiceDetailsHeader', () => {
  test('should render ServiceDetailsHeader', () => {
    jest.spyOn(cdngServices, 'useGetServiceHeaderInfo').mockImplementation(() => {
      return {
        loading: false,
        error: false,
        data: {
          data: {
            createdAt: 1644648631847,
            lastModifiedAt: 1644648631847,
            description: 'dmeo',
            identifier: 'dmeo',
            name: 'dmeo'
          }
        },
        refetch: jest.fn()
      } as any
    })
    const { container } = render(
      <TestWrapper>
        <ServiceDetailsHeader />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
  test('render no data', () => {
    jest.spyOn(cdngServices, 'useGetServiceHeaderInfo').mockImplementation(() => {
      return { loading: false, error: false, data: [], refetch: jest.fn() } as any
    })
    const { container } = render(
      <TestWrapper>
        <ServiceDetailsHeader />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})

const responseData = {
  data: {
    createdAt: 1644648631847,
    lastModifiedAt: 1644648631847,
    description: 'dmeo',
    identifier: 'dmeo',
    name: 'dmeo',
    deploymentTypes: ['Kubernetes']
  }
}
const renderSetup = () => {
  jest.spyOn(cdngServices, 'useGetServiceHeaderInfo').mockImplementation(() => {
    return {
      loading: false,
      error: false,
      data: responseData,
      refetch: jest.fn()
    } as any
  })
  return render(
    <TestWrapper>
      <ServiceDetailsHeader />
    </TestWrapper>
  )
}
describe('DeploymentTypes in serviceDetailsHeader ', () => {
  test('render Kubernetes deployment type', () => {
    const { container } = renderSetup()
    expect(container.querySelector('[data-icon="service-kubernetes"]')).toBeTruthy()
  })

  test('render NativeHelm deployment type', () => {
    responseData.data.deploymentTypes = ['NativeHelm']
    const { container } = renderSetup()
    expect(container.querySelector('[data-icon="service-helm"]')).toBeTruthy()
  })

  test('render ServerlessAwsLambda deployment type', () => {
    responseData.data.deploymentTypes = ['ServerlessAwsLambda']
    const { container } = renderSetup()
    expect(container.querySelector('[data-icon="service-serverless"]')).toBeTruthy()
  })

  test('render Ssh deployment type', () => {
    responseData.data.deploymentTypes = ['Ssh']
    const { container } = renderSetup()
    expect(container.querySelector('[data-icon="secret-ssh"]')).toBeTruthy()
  })

  test('render WinRm deployment type', () => {
    responseData.data.deploymentTypes = ['WinRm']
    const { container } = renderSetup()
    expect(container.querySelector('[data-icon="command-winrm"]')).toBeTruthy()
  })

  test('render more than 2 deployments type', () => {
    responseData.data.deploymentTypes = ['Kubernetes', 'NativeHelm', 'ServerlessAwsLambda', 'Ssh', 'WinRm']
    const { container, getByText } = renderSetup()

    //first 2 types should be visible
    expect(container.querySelector('[data-icon="service-kubernetes"]')).toBeTruthy()
    expect(container.querySelector('[data-icon="service-helm"]')).toBeTruthy()

    // for the remaining type should show '+ remainingCount'
    const remainingTypes = responseData.data.deploymentTypes.length - 2
    expect(getByText(`+ ${remainingTypes}`)).toBeTruthy()
  })
})
