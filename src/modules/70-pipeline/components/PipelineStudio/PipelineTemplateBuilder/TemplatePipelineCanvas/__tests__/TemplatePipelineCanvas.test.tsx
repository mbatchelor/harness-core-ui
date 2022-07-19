/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, waitFor } from '@testing-library/react'
import produce from 'immer'
import { set } from 'lodash-es'
import { TestWrapper } from '@common/utils/testUtils'
import { TemplatePipelineCanvas } from '@pipeline/components/PipelineStudio/PipelineTemplateBuilder/TemplatePipelineCanvas/TemplatePipelineCanvas'
import * as hooks from 'services/template-ng'
import { PipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import pipelineContextMock from '@pipeline/components/PipelineStudio/RightDrawer/__tests__/stateMock'
import {
  mockApprovalDataError,
  mockApprovalDataLoading
} from '@pipeline/components/execution/StepDetails/views/__tests__/mock'
import type { ResponseTemplateResponse } from 'services/template-ng'

export const mockPipelineTemplate: ResponseTemplateResponse = {
  status: 'SUCCESS',
  data: {
    accountId: 'px7xd_BFRCi-pfWPYXVjvw',
    description: '',
    identifier: 'Test_Pipeline_Template',
    lastUpdatedAt: 1637668359934,
    name: 'Test Pipeline Template',
    orgIdentifier: 'default',
    projectIdentifier: 'Yogesh_Test',
    stableTemplate: true,
    tags: {},
    templateEntityType: 'Pipeline',
    templateScope: 'project',
    version: 3,
    versionLabel: 'v1',
    yaml:
      'template:' +
      '\n    name: New Pipeline Template Name' +
      '\n    identifier: new_pipeline_template_name' +
      '\n    versionLabel: v2' +
      '\n    type: Pipeline' +
      '\n    projectIdentifier: Yogesh_Test' +
      '\n    orgIdentifier: default' +
      '\n    spec:' +
      '\n        stages:' +
      '\n            - stage:' +
      '\n                  name: Stage 1' +
      '\n                  identifier: Stage_1' +
      '\n                  description: ""' +
      '\n                  type: Deployment' +
      '\n                  spec:' +
      '\n                      serviceConfig:' +
      '\n                          serviceRef: <+input>' +
      '\n                          serviceDefinition:' +
      '\n                              type: Kubernetes' +
      '\n                              spec:' +
      '\n                                  variables:' +
      '\n                                      - name: var' +
      '\n                                        type: String' +
      '\n                                        value: <+input>' +
      '\n                      infrastructure:' +
      '\n                          environmentRef: Some_Environment' +
      '\n                          infrastructureDefinition:' +
      '\n                              type: KubernetesDirect' +
      '\n                              spec:' +
      '\n                                  connectorRef: account.testarpit' +
      '\n                                  namespace: default' +
      '\n                                  releaseName: release-<+INFRA_KEY>' +
      '\n                          allowSimultaneousDeployments: false' +
      '\n                      execution:' +
      '\n                          steps:' +
      '\n                              - step:' +
      '\n                                    type: ShellScript' +
      '\n                                    name: Step 1' +
      '\n                                    identifier: Step_1' +
      '\n                                    spec:' +
      '\n                                        shell: Bash' +
      '\n                                        onDelegate: true' +
      '\n                                        source:' +
      '\n                                            type: Inline' +
      '\n                                            spec:' +
      '\n                                                script: <+input>' +
      '\n                                        environmentVariables: []' +
      '\n                                        outputVariables: []' +
      '\n                                        executionTarget: {}' +
      '\n                                    timeout: 10m' +
      '\n                          rollbackSteps: []' +
      '\n                  tags: {}' +
      '\n                  failureStrategies:' +
      '\n                      - onFailure:' +
      '\n                            errors:' +
      '\n                                - AllErrors' +
      '\n                            action:' +
      '\n                                type: StageRollback' +
      '\n'
  }
}

const useGetTemplateMock = jest.spyOn(hooks, 'useGetTemplate').mockImplementation(
  () =>
    ({
      loading: false,
      refetch: jest.fn(),
      mutate: jest.fn(),
      cancel: jest.fn(),
      data: mockPipelineTemplate
    } as any)
)

jest.mock('@pipeline/utils/templateUtils', () => ({
  ...jest.requireActual('@pipeline/utils/templateUtils'),
  getTemplateTypesByRef: () =>
    Promise.resolve({
      templateTypes: { Test_Stage_Template: 'Deployment' },
      templateServiceData: { Test_Template_Stage_Type: 'Kubernetes' }
    })
}))

jest.mock('@pipeline/components/Diagram', () => ({
  ...jest.requireActual('@pipeline/components/Diagram'),
  CanvasWidget: () => {
    return <div className={'canvas-widget-mock'} />
  }
}))

jest.mock('@pipeline/components/CanvasButtons/CanvasButtons', () => ({
  ...jest.requireActual('@pipeline/components/CanvasButtons/CanvasButtons'),
  CanvasButtons: () => {
    return <div className={'canvas-buttons-mock'} />
  }
}))

const contextMock = produce(pipelineContextMock, draft => {
  set(draft, 'stage.pipeline', {
    name: 'Test Template Pipeline',
    identifier: 'Test_Template_Pipeline',
    template: {
      templateRef: 'Test_Pipeline_Template',
      versionLabe: 'v1'
    }
  })
})

describe('<TemplatePipelineCanvas/> tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should match snapshot', async () => {
    const { container } = render(
      <TestWrapper>
        <PipelineContext.Provider value={contextMock}>
          <TemplatePipelineCanvas />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
    await waitFor(() => expect(contextMock.setTemplateTypes).toBeCalledWith({ Test_Stage_Template: 'Deployment' }))
    await waitFor(() =>
      expect(contextMock.setTemplateServiceData).toBeCalledWith({ Test_Template_Stage_Type: 'Kubernetes' })
    )
  })

  test('should render loading view correctly', async () => {
    useGetTemplateMock.mockImplementation(() => mockApprovalDataLoading as any)
    const { container } = render(
      <TestWrapper>
        <PipelineContext.Provider value={contextMock}>
          <TemplatePipelineCanvas />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should render error view correctly', async () => {
    useGetTemplateMock.mockImplementation(() => mockApprovalDataError as any)
    const { container } = render(
      <TestWrapper>
        <PipelineContext.Provider value={contextMock}>
          <TemplatePipelineCanvas />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
