/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import produce from 'immer'
import { set } from 'lodash-es'
import { TestWrapper } from '@common/utils/testUtils'
import { PipelineTemplateCanvasWithRef } from '@templates-library/components/TemplateStudio/PipelineTemplateCanvas/PipelineTemplateCanvas'
import { PipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import pipelineContextMock from '@pipeline/components/PipelineStudio/RightDrawer/__tests__/stateMock'
import { getTemplateContextMock } from '@templates-library/components/TemplateStudio/__tests__/stateMock'
import { TemplateType } from '@templates-library/utils/templatesUtils'
import { TemplateContext } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import { DrawerTypes } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateActions'

jest.mock('@pipeline/components/PipelineStudio/StageBuilder/StageBuilder', () => () => {
  return <div className="stage-builder-mock" />
})

jest.mock('@pipeline/components/PipelineStudio/RightBar/RightBar', () => ({
  ...jest.requireActual('@pipeline/components/PipelineStudio/RightBar/RightBar'),
  RightBar: () => {
    return <div className="pipeline-studio-right-bar-mock" />
  }
}))

jest.mock('@templates-library/components/TemplateDrawer/TemplateDrawer', () => ({
  ...jest.requireActual('@templates-library/components/TemplateDrawer/TemplateDrawer'),
  TemplateDrawer: () => {
    return <div className="template-drawer-mock" />
  }
}))

jest.mock('@templates-library/components/TemplateStudio/RightDrawer/RightDrawer', () => ({
  ...jest.requireActual('@templates-library/components/TemplateStudio/RightDrawer/RightDrawer'),
  RightDrawer: () => {
    return <div className="right-drawer-mock" />
  }
}))

describe('<PipelineTemplateCanvasWrapper/> tests', () => {
  test('should match snapshot', () => {
    const { container } = render(
      <TestWrapper>
        <PipelineTemplateCanvasWithRef />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('should unselect stage when pipeline drawer is opened', () => {
    const templateContextMock = produce(getTemplateContextMock(TemplateType.Pipeline), draft => {
      set(draft, 'state.templateView.isDrawerOpened', true)
      set(draft, 'state.templateView.drawerData.type', DrawerTypes.TemplateVariables)
    })
    render(
      <TestWrapper>
        <TemplateContext.Provider value={templateContextMock}>
          <PipelineContext.Provider value={pipelineContextMock}>
            <PipelineTemplateCanvasWithRef />
          </PipelineContext.Provider>
        </TemplateContext.Provider>
      </TestWrapper>
    )
    expect(pipelineContextMock.setSelection).toBeCalledWith({
      sectionId: undefined,
      stageId: undefined,
      stepId: undefined
    })
  })
})
