/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { noop } from 'lodash-es'
import { TestWrapper } from '@common/utils/testUtils'
import { ServicesList } from '@cd/components/Services/ServicesList/ServicesList'
import { serviceDetails } from '@cd/mock'
import type { ServiceDetailsDTO } from 'services/cd-ng'

jest.mock('highcharts-react-official', () => () => <></>)

describe('ServicesList', () => {
  test('render', () => {
    const { container } = render(
      <TestWrapper
        path="account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier/services"
        pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
      >
        <ServicesList
          loading={false}
          error={false}
          data={serviceDetails.data.serviceDeploymentDetailsList as unknown as ServiceDetailsDTO[]}
          refetch={noop}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})

const renderSetup = (data: ServiceDetailsDTO[]) => {
  return render(
    <TestWrapper
      path="account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier/services"
      pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
    >
      <ServicesList loading={false} error={false} data={data} refetch={noop} />
    </TestWrapper>
  )
}

describe('DeploymentType in ServicesList ', () => {
  test('render Kubernetes deployment type', () => {
    const responseData = serviceDetails.data.serviceDeploymentDetailsList as unknown as ServiceDetailsDTO[]
    const { container } = renderSetup(responseData)
    expect(container.querySelector('[data-icon="service-kubernetes"]')).toBeTruthy()
  })

  test('render NativeHelm deployment type', () => {
    const responseData = serviceDetails.data.serviceDeploymentDetailsList as unknown as ServiceDetailsDTO[]
    responseData[1].deploymentTypeList = ['NativeHelm']
    const { container } = renderSetup(responseData)
    expect(container.querySelector('[data-icon="service-helm"]')).toBeTruthy()
  })

  test('render ServerlessAwsLambda deployment type', () => {
    const responseData = serviceDetails.data.serviceDeploymentDetailsList as unknown as ServiceDetailsDTO[]
    responseData[1].deploymentTypeList = ['ServerlessAwsLambda']
    const { container } = renderSetup(responseData)
    expect(container.querySelector('[data-icon="service-serverless"]')).toBeTruthy()
  })

  test('render Ssh deployment type', () => {
    const responseData = serviceDetails.data.serviceDeploymentDetailsList as unknown as ServiceDetailsDTO[]
    responseData[1].deploymentTypeList = ['Ssh']
    const { container } = renderSetup(responseData)
    expect(container.querySelector('[data-icon="secret-ssh"]')).toBeTruthy()
  })

  test('render WinRm deployment type', () => {
    const responseData = serviceDetails.data.serviceDeploymentDetailsList as unknown as ServiceDetailsDTO[]
    responseData[1].deploymentTypeList = ['WinRm']
    const { container } = renderSetup(responseData)
    expect(container.querySelector('[data-icon="command-winrm"]')).toBeTruthy()
  })

  test('render more than 2 deployments type', () => {
    const responseData = serviceDetails.data.serviceDeploymentDetailsList as unknown as ServiceDetailsDTO[]
    responseData[1].deploymentTypeList = ['Kubernetes', 'NativeHelm', 'ServerlessAwsLambda', 'Ssh', 'WinRm']
    const { container, getByText } = renderSetup(responseData)

    //first 2 types should be visible
    expect(container.querySelector('[data-icon="service-kubernetes"]')).toBeTruthy()
    expect(container.querySelector('[data-icon="service-helm"]')).toBeTruthy()

    // for the remaining type should show '+ remainingCount'
    const remainingTypes = responseData[1].deploymentTypeList.length - 2
    expect(getByText(`+ ${remainingTypes}`)).toBeTruthy()
  })
})
