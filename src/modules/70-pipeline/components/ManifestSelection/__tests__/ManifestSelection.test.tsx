/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, findByText, fireEvent, findAllByText, waitFor } from '@testing-library/react'
import { MultiTypeInputType } from '@wings-software/uicore'
import type { ServiceDefinition } from 'services/cd-ng'
import { TestWrapper } from '@common/utils/testUtils'
import {
  PipelineContext,
  PipelineContextInterface
} from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import ManifestSelection from '../ManifestSelection'
import ManifestListView from '../ManifestListView/ManifestListView'
import pipelineContextMock from './pipeline_mock.json'
import connectorsData from './connectors_mock.json'

const fetchConnectors = (): Promise<unknown> => Promise.resolve(connectorsData)

jest.mock('@common/components/YAMLBuilder/YamlBuilder')

jest.mock('services/cd-ng', () => ({
  useGetConnectorListV2: jest.fn().mockImplementation(() => ({ mutate: fetchConnectors }))
}))

const getContextValue = (): PipelineContextInterface => {
  return {
    ...pipelineContextMock,
    getStageFromPipeline: jest.fn(() => {
      return { stage: pipelineContextMock.state.pipeline.stages[0], parent: undefined }
    })
  } as any
}

describe('ManifestSelection tests', () => {
  test(`renders without crashing`, () => {
    const { container } = render(
      <TestWrapper>
        <ManifestSelection deploymentType="Kubernetes" />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test(`renders add Manifest option without crashing`, async () => {
    const { container } = render(
      <TestWrapper>
        <PipelineContext.Provider value={getContextValue()}>
          <ManifestSelection deploymentType="Kubernetes" />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    const addFileButton = await findByText(container, 'pipelineSteps.serviceTab.manifestList.addManifest')
    expect(addFileButton).toBeDefined()
    fireEvent.click(addFileButton)
    const portal = document.getElementsByClassName('bp3-dialog')[0]
    const manifestLabel = await waitFor(() =>
      findByText(portal as HTMLElement, 'pipeline.manifestType.manifestRepoType')
    )
    expect(manifestLabel).toBeDefined()
    const closeButton = portal.querySelector("button[class*='crossIcon']") as Element
    fireEvent.click(closeButton)
    expect(container).toMatchSnapshot()
  })

  test(`renders Manifest Wizard popover`, async () => {
    const { container } = render(
      <TestWrapper>
        <PipelineContext.Provider value={getContextValue()}>
          <ManifestSelection deploymentType="Kubernetes" />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    const addFileButton = await findByText(container, 'pipelineSteps.serviceTab.manifestList.addManifest')
    expect(addFileButton).toBeDefined()
    fireEvent.click(addFileButton)
    const portal = document.getElementsByClassName('bp3-dialog')[0]
    const manifestLabel = await waitFor(() =>
      findByText(portal as HTMLElement, 'pipeline.manifestType.manifestRepoType')
    )
    expect(manifestLabel).toBeDefined()
    const manifestTypes = await waitFor(() =>
      findAllByText(portal as HTMLElement, 'pipeline.manifestTypeLabels.K8sManifest')
    )
    expect(manifestTypes).toBeDefined()
    fireEvent.click(manifestTypes[0])
    const continueButton = await findByText(portal as HTMLElement, 'continue')
    expect(continueButton).toBeDefined()
  })

  test(`renders manifest selection when isForOverrideSets is true`, async () => {
    const { container } = render(
      <TestWrapper>
        <PipelineContext.Provider value={getContextValue()}>
          <ManifestSelection deploymentType="Kubernetes" />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    const addFileButton = await findByText(container, 'pipelineSteps.serviceTab.manifestList.addManifest')
    expect(addFileButton).toBeDefined()

    const listOfManifests =
      pipelineContextMock.state.pipeline.stages[0].stage.spec.serviceConfig.serviceDefinition.spec.manifestOverrideSets.map(
        elem => elem.overrideSets.overrideSet.manifests
      )[0]
    expect(listOfManifests.length).toEqual(4)
  })

  test(`renders manifest selection when isForPredefinedSets is true`, async () => {
    const { container } = render(
      <TestWrapper>
        <PipelineContext.Provider value={getContextValue()}>
          <ManifestSelection deploymentType="Kubernetes" />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    const addFileButton = await findByText(container, 'pipelineSteps.serviceTab.manifestList.addManifest')
    expect(addFileButton).toBeDefined()
    fireEvent.click(addFileButton)
    const portal = document.getElementsByClassName('bp3-dialog')[0]
    const manifestLabel = await waitFor(() =>
      findByText(portal as HTMLElement, 'pipeline.manifestType.manifestRepoType')
    )
    expect(manifestLabel).toBeDefined()
  })

  test(`renders manifest selection when overrideSetIdentifier and identifierName has some value`, async () => {
    const { container } = render(
      <TestWrapper>
        <PipelineContext.Provider value={getContextValue()}>
          <ManifestSelection deploymentType="Kubernetes" isPropagating={false} />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test(`renders manifest selection when isPropagating is true`, async () => {
    const { container } = render(
      <TestWrapper>
        <PipelineContext.Provider value={getContextValue()}>
          <ManifestSelection deploymentType="Kubernetes" isPropagating={true} />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    const addFileButton = await findByText(container, 'pipelineSteps.serviceTab.manifestList.addManifest')
    expect(addFileButton).toBeDefined()
    fireEvent.click(addFileButton)
    const portal = document.getElementsByClassName('bp3-dialog')[0]
    const manifestLabel = await waitFor(() =>
      findByText(portal as HTMLElement, 'pipeline.manifestType.manifestRepoType')
    )
    expect(manifestLabel).toBeDefined()
  })

  test(`renders Manifest Listview without crashing`, () => {
    const props = {
      isPropagating: false,
      pipeline: pipelineContextMock.state.pipeline,
      updateStage: jest.fn(),
      stage: pipelineContextMock.state.pipeline.stages[0],
      isForOverrideSets: false,
      identifierName: '',
      connectors: undefined,
      refetchConnectors: jest.fn(),
      isReadonly: false,
      listOfManifests: [],
      deploymentType: 'Kubernetes' as ServiceDefinition['type'],
      allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
    }
    const { container } = render(
      <TestWrapper>
        <ManifestListView {...props} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test(`renders Manifest Listview with connectors Data`, () => {
    const props = {
      isPropagating: false,
      pipeline: pipelineContextMock.state.pipeline,
      updateStage: jest.fn(),
      stage: pipelineContextMock.state.pipeline.stages[0],
      isForOverrideSets: false,
      identifierName: '',
      isForPredefinedSets: false,
      connectors: connectorsData.data as any,
      refetchConnectors: jest.fn(),
      isReadonly: false,
      listOfManifests: [],
      deploymentType: 'Kubernetes' as ServiceDefinition['type'],
      allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
    }
    const { container } = render(
      <TestWrapper>
        <ManifestListView {...props} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test(`renders Manifest Listview with overrideSetIdentifier, isPropagating, isForOverrideSets`, () => {
    const props = {
      isPropagating: true,
      pipeline: pipelineContextMock.state.pipeline,
      updateStage: jest.fn(),
      stage: pipelineContextMock.state.pipeline.stages[0],
      isForOverrideSets: true,
      identifierName: '',
      isForPredefinedSets: false,
      connectors: connectorsData.data as any,
      refetchConnectors: jest.fn(),
      isReadonly: false,
      listOfManifests: [],
      deploymentType: 'Kubernetes' as ServiceDefinition['type'],
      allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
    }
    const { container } = render(
      <TestWrapper>
        <ManifestListView {...props} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test(`delete manifest list works correctly`, async () => {
    const props = {
      isPropagating: false,
      pipeline: pipelineContextMock.state.pipeline,
      updateStage: jest.fn(),
      stage: pipelineContextMock.state.pipeline.stages[0],
      isForOverrideSets: false,
      identifierName: '',
      isForPredefinedSets: false,
      connectors: connectorsData.data as any,
      refetchConnectors: jest.fn(),
      isReadonly: false,
      deploymentType: 'Kubernetes' as ServiceDefinition['type'],
      allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
      listOfManifests: [
        {
          manifest: {
            identifier: 'idtest',
            type: 'K8sManifest',
            spec: {
              store: {
                type: 'Git',
                spec: {
                  connectorRef: 'account.Rohan_Github_ALL_HANDS',
                  gitFetchType: 'Branch',
                  paths: ['path'],
                  branch: 'master'
                }
              },
              skipResourceVersioning: false
            }
          }
        }
      ]
    }
    const { container } = render(
      <TestWrapper>
        <ManifestListView {...props} />
      </TestWrapper>
    )

    const deleteManifestBtn = container.querySelector('[data-icon="main-trash"]') as Element
    expect(deleteManifestBtn).toBeDefined()
    fireEvent.click(deleteManifestBtn)

    expect(container).toMatchSnapshot()
  })

  test(`edit manifest list works correctly`, async () => {
    const props = {
      isPropagating: false,
      pipeline: pipelineContextMock.state.pipeline,
      updateStage: jest.fn(),
      stage: pipelineContextMock.state.pipeline.stages[0],
      identifierName: '',
      connectors: connectorsData.data as any,
      refetchConnectors: jest.fn(),
      isReadonly: false,
      deploymentType: 'Kubernetes' as ServiceDefinition['type'],
      allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION],
      listOfManifests: [
        {
          manifest: {
            identifier: 'id77',
            type: 'Kustomize',
            spec: {
              store: {
                type: 'Bitbucket',
                spec: {
                  connectorRef: 'account.Testbitbucke',
                  gitFetchType: 'Branch',
                  folderPath: 'test',
                  branch: 'master'
                }
              },
              pluginPath: 'path',
              skipResourceVersioning: false
            }
          }
        }
      ]
    }
    const { container } = render(
      <TestWrapper>
        <ManifestListView {...props} />
      </TestWrapper>
    )

    const editManifestBtn = container.querySelectorAll('[data-icon="Edit"]')[0]
    expect(editManifestBtn).toBeDefined()
    fireEvent.click(editManifestBtn)
    const portal = document.getElementsByClassName('bp3-dialog')[0]
    const manifestLabel = await waitFor(() =>
      findByText(portal as HTMLElement, 'pipeline.manifestType.manifestRepoType')
    )
    expect(manifestLabel).toBeDefined()
    const closeButton = portal.querySelector("button[class*='crossIcon']") as Element
    fireEvent.click(closeButton)
    expect(container).toMatchSnapshot()
  })

  test(`manifest listview when isForOverrideSets is true`, async () => {
    const props = {
      isPropagating: false,
      pipeline: pipelineContextMock.state.pipeline,
      updateStage: jest.fn(),
      stage: pipelineContextMock.state.pipeline.stages[0],
      isForOverrideSets: true,
      identifierName: '',
      connectors: connectorsData.data as any,
      refetchConnectors: jest.fn(),
      isReadonly: false,
      listOfManifests: [],
      deploymentType: 'Kubernetes' as ServiceDefinition['type'],
      allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME, MultiTypeInputType.EXPRESSION]
    }

    const listOfManifests = props.stage.stage.spec.serviceConfig.serviceDefinition.spec.manifestOverrideSets
    const { container } = render(
      <TestWrapper>
        <ManifestListView {...props} listOfManifests={listOfManifests} />
      </TestWrapper>
    )

    const editManifestBtn = container.querySelectorAll('[data-icon="Edit"]')[0]
    expect(editManifestBtn).toBeDefined()
    fireEvent.click(editManifestBtn)
    const portal = document.getElementsByClassName('bp3-dialog')[0]
    const manifestLabel = await waitFor(() =>
      findByText(portal as HTMLElement, 'pipeline.manifestType.manifestRepoType')
    )
    expect(manifestLabel).toBeDefined()
  })
})
