/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { TemplateFormRef } from '@templates-library/components/TemplateStudio/TemplateStudio'
import StageBuilder from '@pipeline/components/PipelineStudio/StageBuilder/StageBuilder'
import { RightBar as PipelineStudioRightBar } from '@pipeline/components/PipelineStudio/RightBar/RightBar'
import { TemplateDrawer } from '@templates-library/components/TemplateDrawer/TemplateDrawer'
import { RightDrawer } from '@templates-library/components/TemplateStudio/RightDrawer/RightDrawer'
import { useSaveTemplateListener } from '@pipeline/components/PipelineStudio/hooks/useSaveTemplateListener'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { TemplateContext } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import { DrawerTypes } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateActions'

const PipelineTemplateCanvas = (_props: unknown, _formikRef: TemplateFormRef): JSX.Element => {
  const {
    state: {
      templateView: {
        isDrawerOpened,
        drawerData: { type }
      }
    }
  } = React.useContext(TemplateContext)
  const { setSelection } = usePipelineContext()

  React.useEffect(() => {
    if (isDrawerOpened && type === DrawerTypes.TemplateVariables) {
      setSelection({ stageId: undefined, stepId: undefined, sectionId: undefined })
    }
  }, [isDrawerOpened])

  useSaveTemplateListener()

  return (
    <>
      <StageBuilder />
      <PipelineStudioRightBar />
      <TemplateDrawer />
      <RightDrawer />
    </>
  )
}

export const PipelineTemplateCanvasWithRef = React.forwardRef(PipelineTemplateCanvas)
