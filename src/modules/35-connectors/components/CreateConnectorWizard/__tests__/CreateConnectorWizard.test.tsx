/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'

import { render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import { Connectors } from '@connectors/constants'
import { CreateConnectorWizard } from '../CreateConnectorWizard'

const commonProps = {
  accountId: 'accountId',
  orgIdentifier: 'orgId',
  projectIdentifier: 'projectId',
  connectorInfo: undefined,
  isEditMode: false,
  onClose: jest.fn(),
  onSuccess: jest.fn(),
  setIsEditMode: jest.fn()
}

describe('Create connector Wizard', () => {
  test('should open CreateConnectorWizard for custom', () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateConnectorWizard type={Connectors.CUSTOM} {...commonProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should open CreateConnectorWizard for k8', () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateConnectorWizard type={Connectors.KUBERNETES_CLUSTER} {...commonProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should open CreateConnectorWizard for Git', () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateConnectorWizard type={Connectors.GIT} {...commonProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should open CreateConnectorWizard for Github', () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateConnectorWizard type={Connectors.GITHUB} {...commonProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should open CreateConnectorWizard for Gitlab', () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateConnectorWizard type={Connectors.GITLAB} {...commonProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should open CreateConnectorWizard for BITBUCKET', () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateConnectorWizard type={Connectors.BITBUCKET} {...commonProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should open CreateConnectorWizard for VAULT', () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateConnectorWizard type={Connectors.VAULT} {...commonProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should open CreateConnectorWizard for GCP KMS', () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateConnectorWizard type={Connectors.GCP_KMS} {...commonProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should open CreateConnectorWizard for DOCKER', () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateConnectorWizard type={Connectors.DOCKER} {...commonProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should open CreateConnectorWizard for GCP', () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateConnectorWizard type={Connectors.GCP} {...commonProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should open CreateConnectorWizard for Nexus', () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateConnectorWizard type={Connectors.NEXUS} {...commonProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should open CreateConnectorWizard for Artifactory', () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateConnectorWizard type={Connectors.ARTIFACTORY} {...commonProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should open CreateConnectorWizard for Jira', () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateConnectorWizard type={Connectors.Jira} {...commonProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should open CreateConnectorWizard for App Dynamics', () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateConnectorWizard type={Connectors.APP_DYNAMICS} {...commonProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should open CreateConnectorWizard for Splunk', () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateConnectorWizard type={Connectors.SPLUNK} {...commonProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should open CreateConnectorWizard for Prometheus', () => {
    const { container } = render(
      <TestWrapper path="/account/:accountId/resources/connectors" pathParams={{ accountId: 'dummy' }}>
        <CreateConnectorWizard type={Connectors.PROMETHEUS} {...commonProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
