/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { findAllByText, findByText, fireEvent, render } from '@testing-library/react'
import { MultiTypeInputType } from '@wings-software/uicore'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import type { ManifestConfig } from 'services/cd-ng'
import { ManifestWizard } from '../ManifestWizard/ManifestWizard'
import type { ManifestStepInitData } from '../ManifestInterface'
import HelmWithGIT from '../ManifestWizardSteps/HelmWithGIT/HelmWithGIT'

jest.mock('services/cd-ng', () => ({
  useGetConnector: jest.fn().mockImplementation(() => ({ data: {} }))
}))
describe('ManifestSelection tests', () => {
  test(`renders without crashing`, () => {
    const { container } = render(
      <TestWrapper>
        <ManifestWizard
          handleConnectorViewChange={jest.fn()}
          handleStoreChange={jest.fn()}
          initialValues={{} as ManifestStepInitData}
          types={[]}
          expressions={[]}
          lastSteps={[]}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          isReadonly={false}
          manifestStoreTypes={[]}
          labels={{
            firstStepName: 'first step',
            secondStepName: 'second step'
          }}
          selectedManifest={'K8sManifest'}
          changeManifestType={jest.fn()}
          newConnectorView={false}
          iconsProps={{ name: 'info' }}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
  test(`can change artifact input type  without crashing`, async () => {
    const initialValues = {
      identifier: '',
      branch: 'branch name',
      commitId: undefined,
      connectorRef: 'connectorRef',
      gitFetchType: 'Branch',
      paths: ['temp'],
      store: 'Git',
      selectedManifest: 'K8sManifest'
    }
    const { container } = render(
      <TestWrapper>
        <ManifestWizard
          handleConnectorViewChange={jest.fn()}
          handleStoreChange={jest.fn()}
          initialValues={initialValues as ManifestStepInitData}
          types={[]}
          expressions={[]}
          lastSteps={[]}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          isReadonly={false}
          manifestStoreTypes={['Git', 'Github', 'GitLab', 'Bitbucket']}
          labels={{
            firstStepName: 'first step',
            secondStepName: 'second step'
          }}
          selectedManifest={'K8sManifest'}
          changeManifestType={jest.fn()}
          newConnectorView={false}
          iconsProps={{ name: 'info' }}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test(`renders correctly with differnet manifest types`, () => {
    const initialValues = {
      connectorRef: undefined,
      store: ''
    }
    const { container } = render(
      <TestWrapper>
        <ManifestWizard
          handleConnectorViewChange={jest.fn()}
          handleStoreChange={jest.fn()}
          initialValues={initialValues as ManifestStepInitData}
          types={['K8sManifest', 'HelmChart']}
          expressions={[]}
          lastSteps={[]}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          isReadonly={false}
          manifestStoreTypes={['Git', 'Github', 'GitLab', 'Bitbucket']}
          labels={{
            firstStepName: 'first step',
            secondStepName: 'second step'
          }}
          selectedManifest={'K8sManifest'}
          changeManifestType={jest.fn()}
          newConnectorView={false}
          iconsProps={{ name: 'info' }}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test(`new connector view works correctly`, async () => {
    const initialValues = {
      connectorRef: undefined,
      store: ''
    }

    const { container } = render(
      <TestWrapper>
        <ManifestWizard
          handleConnectorViewChange={jest.fn()}
          handleStoreChange={jest.fn()}
          initialValues={initialValues as ManifestStepInitData}
          types={['K8sManifest', 'HelmChart']}
          expressions={[]}
          lastSteps={[]}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          isReadonly={false}
          manifestStoreTypes={['Git', 'Github', 'GitLab', 'Bitbucket']}
          labels={{
            firstStepName: 'Specify Manifest Type',
            secondStepName: 'Specify Manifest Store'
          }}
          selectedManifest={'K8sManifest'}
          changeManifestType={jest.fn()}
          newConnectorView={true}
          iconsProps={{ name: 'info' }}
        />
      </TestWrapper>
    )
    const manifestLabel = await findByText(container, 'Specify Manifest Type')
    expect(manifestLabel).toBeDefined()
    const K8smanifestType = await findAllByText(container, 'pipeline.manifestTypeLabels.K8sManifest')
    expect(K8smanifestType).toBeDefined()

    const changeText = await findByText(container, 'Change')
    fireEvent.click(changeText)

    const HelmmanifestType = await findByText(container, 'pipeline.manifestTypeLabels.HelmChartLabel')
    expect(HelmmanifestType).toBeDefined()
    fireEvent.click(HelmmanifestType)

    const continueButton = await findByText(container, 'continue')
    expect(continueButton).toBeDefined()
    fireEvent.click(continueButton)

    const manifeststoreLabel = await findByText(container, 'Specify Manifest Store')
    expect(manifeststoreLabel).toBeDefined()

    const manifestSourceLabel = await findByText(container, 'pipeline.manifestType.manifestSource')
    expect(manifestSourceLabel).toBeDefined()

    const gitConnector = await findByText(container, 'pipeline.manifestType.gitConnectorLabel')
    expect(gitConnector).toBeDefined()
    const gitconnectorCard = container.getElementsByClassName('Thumbnail--squareCardContainer')[0]
    fireEvent.click(gitconnectorCard)
    const newConnectorLabel = await findByText(container, 'newLabel pipeline.manifestType.gitConnectorLabel connector')
    expect(newConnectorLabel).toBeDefined()
    const newConnectorBtn = container.getElementsByClassName('addNewManifest')[0]
    expect(newConnectorBtn).toBeDefined()
    fireEvent.click(newConnectorLabel)
    const nextStepButton = await findByText(container, 'continue')
    expect(nextStepButton).toBeDefined()
    fireEvent.click(nextStepButton)

    expect(container).toMatchSnapshot()
  })

  test(`new connector view works inside select dialog correctly`, async () => {
    const initialValues = {
      connectorRef: undefined,
      store: ''
    }

    const { container } = render(
      <TestWrapper>
        <ManifestWizard
          handleConnectorViewChange={jest.fn()}
          handleStoreChange={jest.fn()}
          initialValues={initialValues as ManifestStepInitData}
          types={['K8sManifest', 'HelmChart']}
          expressions={[]}
          lastSteps={[]}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          isReadonly={false}
          manifestStoreTypes={['Git', 'Github', 'GitLab', 'Bitbucket']}
          labels={{
            firstStepName: 'Specify Manifest Type',
            secondStepName: 'Specify Manifest Store'
          }}
          selectedManifest={'K8sManifest'}
          changeManifestType={jest.fn()}
          newConnectorView={true}
          iconsProps={{ name: 'info' }}
        />
      </TestWrapper>
    )
    const manifestLabel = await findByText(container, 'Specify Manifest Type')
    expect(manifestLabel).toBeDefined()
    const K8smanifestType = await findAllByText(container, 'pipeline.manifestTypeLabels.K8sManifest')
    expect(K8smanifestType).toBeDefined()

    const changeText = await findByText(container, 'Change')
    fireEvent.click(changeText)

    const HelmmanifestType = await findByText(container, 'pipeline.manifestTypeLabels.HelmChartLabel')
    expect(HelmmanifestType).toBeDefined()
    fireEvent.click(HelmmanifestType)

    const continueButton = await findByText(container, 'continue')
    expect(continueButton).toBeDefined()
    fireEvent.click(continueButton)

    const manifeststoreLabel = await findByText(container, 'Specify Manifest Store')
    expect(manifeststoreLabel).toBeDefined()

    const manifestSourceLabel = await findByText(container, 'pipeline.manifestType.manifestSource')
    expect(manifestSourceLabel).toBeDefined()

    const gitConnector = await findByText(container, 'pipeline.manifestType.gitConnectorLabel')
    expect(gitConnector).toBeDefined()
    const gitconnectorCard = container.getElementsByClassName('Thumbnail--squareCardContainer')[0]
    fireEvent.click(gitconnectorCard)
    expect(container).toMatchSnapshot()
    const newConnectorLabel = await findByText(container, 'select pipeline.manifestType.gitConnectorLabel connector')
    expect(newConnectorLabel).toBeDefined()
    fireEvent.click(newConnectorLabel)
    const connectorDialog = findDialogContainer()
    expect(connectorDialog).toBeTruthy()

    if (connectorDialog) {
      const nextStepButton = await findByText(
        connectorDialog,
        '+ newLabel pipeline.manifestType.gitConnectorLabel connector'
      )
      expect(nextStepButton).toBeDefined()
    }
  })

  test(`last step data without initial values`, async () => {
    const initialValues = {
      connectorRef: '',
      store: ''
    }
    const laststepProps = {
      name: 'Manifest Details',
      expressions: [''],
      allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
      stepName: 'Manifest Details Step',
      initialValues: null as unknown as ManifestConfig,
      handleSubmit: jest.fn(),
      selectedManifest: 'K8sManifest',
      manifestIdsList: []
    }
    const { container } = render(
      <TestWrapper>
        <ManifestWizard
          handleConnectorViewChange={jest.fn()}
          handleStoreChange={jest.fn()}
          initialValues={initialValues as ManifestStepInitData}
          types={['K8sManifest', 'HelmChart']}
          expressions={[]}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          isReadonly={false}
          manifestStoreTypes={['Git', 'Github', 'GitLab', 'Bitbucket']}
          labels={{
            firstStepName: 'Specify Manifest Type',
            secondStepName: 'Specify Manifest Store'
          }}
          selectedManifest={'K8sManifest'}
          changeManifestType={jest.fn()}
          newConnectorView={true}
          iconsProps={{ name: 'info' }}
          lastSteps={[<HelmWithGIT {...laststepProps} key={'key'} />]}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test(`last step data with proper initial values`, async () => {
    const initialValues = {
      connectorRef: '',
      store: ''
    }
    const laststepProps = {
      name: 'Manifest Details',
      expressions: [''],
      allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
      stepName: 'Manifest Details Step',
      manifestIdsList: [],
      initialValues: {
        identifier: 'id',
        type: 'K8sManifest',
        spec: {
          skipResourceVersioning: false,
          store: {
            type: 'Git',
            spec: {
              connectorRef: 'connectorRef',
              gitFetchType: 'Branch',
              branch: 'master',
              repoName: 'repoName',
              commidId: undefined
            }
          }
        }
      } as ManifestConfig,
      handleSubmit: jest.fn(),
      selectedManifest: 'K8sManifest'
    }
    const { container } = render(
      <TestWrapper>
        <ManifestWizard
          handleConnectorViewChange={jest.fn()}
          handleStoreChange={jest.fn()}
          initialValues={initialValues as ManifestStepInitData}
          types={['K8sManifest', 'HelmChart']}
          expressions={[]}
          allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]}
          isReadonly={false}
          manifestStoreTypes={['Git', 'Github', 'GitLab', 'Bitbucket']}
          labels={{
            firstStepName: 'Specify Manifest Type',
            secondStepName: 'Specify Manifest Store'
          }}
          selectedManifest={'K8sManifest'}
          changeManifestType={jest.fn()}
          newConnectorView={true}
          iconsProps={{ name: 'info' }}
          lastSteps={[<HelmWithGIT {...laststepProps} key={'key'} />]}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })
})
