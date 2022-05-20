/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { PageError, Tag } from '@wings-software/uicore'
import { defaultTo, get, merge } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { PageSpinner } from '@harness/uicore'
import { parse } from 'yaml'
import { useStageBuilderCanvasState } from '@pipeline/components/PipelineStudio/StageBuilder/useStageBuilderCanvasState'
import { CanvasWidget, createEngine } from '@pipeline/components/Diagram'
import { StageBuilderModel } from '@pipeline/components/PipelineStudio/StageBuilder/StageBuilderModel'
import type { PipelineInfoConfig } from 'services/cd-ng'
import { findAllByKey, usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { getTemplateTypesByRef } from '@pipeline/utils/templateUtils'
import { useStrings } from 'framework/strings'
import { useValidationErrors } from '@pipeline/components/PipelineStudio/PiplineHooks/useValidationErrors'
import { CanvasButtons } from '@pipeline/components/CanvasButtons/CanvasButtons'
import {
  getIdentifierFromValue,
  getScopeFromValue,
  getScopeBasedProjectPathParams
} from '@common/components/EntityReference/EntityReference'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useGetTemplate } from 'services/template-ng'
import css from './TemplatePipelineCanvas.module.scss'

export function TemplatePipelineCanvas(): React.ReactElement {
  const {
    state: { pipeline, templateTypes, gitDetails },
    stagesMap,
    setTemplateTypes
  } = usePipelineContext()
  const canvasRef = React.useRef<HTMLDivElement | null>(null)
  const { getString } = useStrings()
  const { errorMap } = useValidationErrors()
  const [resolvedPipeline, setResolvedPipeline] = React.useState<PipelineInfoConfig>()
  const templateScope = getScopeFromValue(defaultTo(pipeline.template?.templateRef, ''))
  const queryParams = useParams<ProjectPathProps>()

  const model = React.useMemo(() => new StageBuilderModel(), [])
  const engine = React.useMemo(() => createEngine({}), [])
  engine.setModel(model)

  const addUpdateGraph = () => {
    model.addUpdateGraph({
      data: resolvedPipeline || { name: '', identifier: '' },
      listeners: {
        nodeListeners: {},
        linkListeners: {}
      },
      zoomLevel: model.getZoomLevel(),
      stagesMap,
      getString,
      isReadonly: true,
      splitPaneSize: canvasRef.current?.offsetHeight,
      parentPath: 'pipeline.stages',
      errorMap,
      templateTypes
    })
  }

  addUpdateGraph()

  useStageBuilderCanvasState(engine, [])

  const {
    data: pipelineTemplateResponse,
    error: pipelineTemplateError,
    refetch: refetchPipelineTemplate,
    loading: pipelineTemplateLoading
  } = useGetTemplate({
    templateIdentifier: getIdentifierFromValue(defaultTo(pipeline.template?.templateRef, '')),
    queryParams: {
      ...getScopeBasedProjectPathParams(queryParams, templateScope),
      versionLabel: defaultTo(pipeline.template?.versionLabel, ''),
      repoIdentifier: gitDetails.repoIdentifier,
      branch: gitDetails.branch,
      getDefaultFromOtherRepo: true
    }
  })

  React.useEffect(() => {
    const templateRefs = findAllByKey('templateRef', resolvedPipeline)
    getTemplateTypesByRef(
      {
        accountIdentifier: queryParams.accountId,
        orgIdentifier: queryParams.orgIdentifier,
        projectIdentifier: queryParams.projectIdentifier,
        templateListType: 'Stable',
        repoIdentifier: gitDetails.repoIdentifier,
        branch: gitDetails.branch,
        getDefaultFromOtherRepo: true
      },
      templateRefs
    ).then(resp => {
      setTemplateTypes(merge(templateTypes, resp))
    })
  }, [JSON.stringify(resolvedPipeline)])

  React.useEffect(() => {
    if (pipelineTemplateResponse?.data?.yaml) {
      setResolvedPipeline(parse(pipelineTemplateResponse.data.yaml)?.template?.spec)
    }
  }, [pipelineTemplateResponse?.data?.yaml])

  return (
    <div className={css.canvas} ref={canvasRef}>
      {pipelineTemplateLoading && <PageSpinner />}
      {!pipelineTemplateLoading && pipelineTemplateError && (
        <PageError
          message={get(
            pipelineTemplateError,
            'data.error',
            get(pipelineTemplateError, 'data.message', pipelineTemplateError?.message)
          )}
          onClick={() => refetchPipelineTemplate()}
        />
      )}
      <Tag className={css.readOnlyTag}>READ ONLY</Tag>
      <CanvasWidget engine={engine} />
      <CanvasButtons tooltipPosition="left" engine={engine} callback={addUpdateGraph} />
    </div>
  )
}
