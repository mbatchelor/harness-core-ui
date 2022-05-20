/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, getByText, queryByText, render, waitFor } from '@testing-library/react'
import produce from 'immer'
import { set } from 'lodash-es'
import { findDialogContainer, findPopoverContainer, TestWrapper } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import { accountPathProps, pipelineModuleParams, pipelinePathProps } from '@common/utils/routeUtils'
import * as useFeaturesMock from '@common/hooks/useFeatures'
import { PipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import pipelineContextMock from '@pipeline/components/PipelineStudio/RightDrawer/__tests__/stateMock'
import type { ResponseTemplateResponse } from 'services/template-ng'
import * as templateServices from 'services/template-ng'
import { TemplateBar, TemplateBarProps } from '../TemplateBar'

export const stepTemplate: ResponseTemplateResponse = {
  status: 'SUCCESS',
  data: {
    accountId: 'px7xd_BFRCi-pfWPYXVjvw',
    childType: 'Http',
    description: '',
    identifier: 'Test_Http_Template',
    lastUpdatedAt: 1637668359934,
    name: 'Test Http Template',
    orgIdentifier: 'default',
    projectIdentifier: 'Yogesh_Test',
    stableTemplate: true,
    tags: {},
    templateEntityType: 'Step',
    templateScope: 'project',
    version: 3,
    versionLabel: 'v1',
    yaml:
      'template:' +
      '\n    name: Test Http Template' +
      '\n    identifier: Test_Http_Template' +
      '\n    versionLabel: v1' +
      '\n    type: Step' +
      '\n    projectIdentifier: Yogesh_Test' +
      '\n    orgIdentifier: default' +
      '\n    description: null' +
      '\n    tags: {}' +
      '\n    spec:' +
      '\n        type: Http' +
      '\n        timeout: 1m 40s' +
      '\n        spec:' +
      '\n            url: <+input>' +
      '\n            method: GET' +
      '\n            headers: []' +
      '\n            outputVariables: []' +
      '\n            requestBody: <+input>' +
      '\n'
  }
}

const useGetTemplate = jest
  .spyOn(templateServices, 'useGetTemplate')
  .mockImplementation(() => ({ data: stepTemplate, refetch: jest.fn(), error: null, loading: false } as any))

const baseProps: TemplateBarProps = {
  templateLinkConfig: {
    templateRef: 'Test_Http_Template',
    versionLabel: 'v1'
  },
  onOpenTemplateSelector: jest.fn(),
  onRemoveTemplate: jest.fn()
}

const PATH = routes.toPipelineStudio({ ...accountPathProps, ...pipelinePathProps, ...pipelineModuleParams })
const PATH_PARAMS = {
  pipelineIdentifier: 'Test_Pipeline',
  accountId: 'px7xd_BFRCi-pfWPYXVjvw',
  orgIdentifier: 'default',
  projectIdentifier: 'Yogesh_Test',
  module: 'cd'
}

describe('<TemplateBar /> tests', () => {
  beforeAll(() => {
    jest.clearAllMocks()
  })

  test('should call onOpenTemplateSelector when change template is clicked', async () => {
    const { container } = render(
      <TestWrapper>
        <TemplateBar {...baseProps} />
      </TestWrapper>
    )
    const optionsBtn = container.querySelector('.bp3-icon-more') as HTMLElement
    await act(async () => {
      fireEvent.click(optionsBtn)
    })
    const menuContainer = document.body.querySelector('.bp3-menu') as HTMLElement
    await waitFor(() => expect(menuContainer).not.toBeNull())
    fireEvent.click(menuContainer)
    const popover = findPopoverContainer()
    const changeBtn = getByText(popover as HTMLElement, 'pipeline.changeTemplateLabel')
    await act(async () => {
      fireEvent.click(changeBtn)
    })
    expect(baseProps.onOpenTemplateSelector).toBeCalled()
  })

  test('should call onRemoveTemplate when remove template is clicked', async () => {
    const { container } = render(
      <TestWrapper>
        <TemplateBar {...baseProps} />
      </TestWrapper>
    )
    const optionsBtn = container.querySelector('.bp3-icon-more') as HTMLElement
    await act(async () => {
      fireEvent.click(optionsBtn)
    })
    const menuContainer = document.body.querySelector('.bp3-menu') as HTMLElement
    await waitFor(() => expect(menuContainer).not.toBeNull())
    fireEvent.click(menuContainer)
    const popover = findPopoverContainer()
    const removeBtn = getByText(popover as HTMLElement, 'pipeline.removeTemplateLabel')
    await act(async () => {
      fireEvent.click(removeBtn)
    })
    const submitBtn = getByText(findDialogContainer() as HTMLElement, 'common.remove')
    await act(async () => {
      fireEvent.click(submitBtn)
    })
    expect(baseProps.onRemoveTemplate).toBeCalled()
  })

  test('should open template in new tab when openTemplateInNewTabLabel is clicked', async () => {
    window.open = jest.fn()
    const { container } = render(
      <TestWrapper path={PATH} pathParams={PATH_PARAMS}>
        <TemplateBar {...baseProps} />
      </TestWrapper>
    )
    const optionsBtn = container.querySelector('.bp3-icon-more') as HTMLElement
    await act(async () => {
      fireEvent.click(optionsBtn)
    })
    const menuContainer = document.body.querySelector('.bp3-menu') as HTMLElement
    await waitFor(() => expect(menuContainer).not.toBeNull())
    fireEvent.click(menuContainer)
    const popover = findPopoverContainer()
    const openTemplateInNewTabBtn = getByText(popover as HTMLElement, 'pipeline.openTemplateInNewTabLabel')
    act(() => {
      fireEvent.click(openTemplateInNewTabBtn)
    })
    expect(window.open).toBeCalledWith(
      expect.stringContaining(
        '/account/px7xd_BFRCi-pfWPYXVjvw/cd/orgs/default/projects/Yogesh_Test/setup/resources/template-studio/Step/template/Test_Http_Template/?versionLabel=v1'
      ),
      '_blank'
    )
  })

  test('should open template preview dialog when previewTemplateLabel is clicked', async () => {
    const { container } = render(
      <TestWrapper>
        <TemplateBar {...baseProps} />
      </TestWrapper>
    )
    const optionsBtn = container.querySelector('.bp3-icon-more') as HTMLElement
    await act(async () => {
      fireEvent.click(optionsBtn)
    })
    const menuContainer = document.body.querySelector('.bp3-menu') as HTMLElement
    await waitFor(() => expect(menuContainer).not.toBeNull())
    fireEvent.click(menuContainer)
    const popover = findPopoverContainer()
    const previewTemplateBtn = getByText(popover as HTMLElement, 'pipeline.previewTemplateLabel')
    act(() => {
      fireEvent.click(previewTemplateBtn)
    })
    expect(findDialogContainer()).toBeDefined()
  })

  test('should hide change and remove option when feature is disabled', async () => {
    jest.spyOn(useFeaturesMock, 'useFeature').mockReturnValue({ enabled: false })
    const { container } = render(
      <TestWrapper>
        <TemplateBar {...baseProps} />
      </TestWrapper>
    )
    const optionsBtn = container.querySelector('.bp3-icon-more') as HTMLElement
    await act(async () => {
      fireEvent.click(optionsBtn)
    })
    const menuContainer = document.body.querySelector('.bp3-menu') as HTMLElement
    await waitFor(() => expect(menuContainer).not.toBeNull())
    fireEvent.click(menuContainer)
    const popover = findPopoverContainer() as HTMLElement
    expect(queryByText(popover, 'pipeline.changeTemplateLabel')).toBeNull()
    expect(queryByText(popover, 'pipeline.removeTemplateLabel')).toBeNull()
  })

  test('should hide change and remove option in read only mode', async () => {
    const contextMock = produce(pipelineContextMock, draft => {
      set(draft, 'isReadonly', true)
    })
    const { container } = render(
      <TestWrapper>
        <PipelineContext.Provider value={contextMock}>
          <TemplateBar {...baseProps} />
        </PipelineContext.Provider>
      </TestWrapper>
    )
    const optionsBtn = container.querySelector('.bp3-icon-more') as HTMLElement
    await act(async () => {
      fireEvent.click(optionsBtn)
    })
    const menuContainer = document.body.querySelector('.bp3-menu') as HTMLElement
    await waitFor(() => expect(menuContainer).not.toBeNull())
    fireEvent.click(menuContainer)
    const popover = findPopoverContainer() as HTMLElement
    expect(queryByText(popover, 'pipeline.changeTemplateLabel')).toBeNull()
    expect(queryByText(popover, 'pipeline.removeTemplateLabel')).toBeNull()
  })

  test('should match snapshot in loading', async () => {
    useGetTemplate.mockImplementation(() => ({ data: null, loading: true } as any))
    const { container } = render(
      <TestWrapper>
        <TemplateBar {...baseProps} />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })
})
