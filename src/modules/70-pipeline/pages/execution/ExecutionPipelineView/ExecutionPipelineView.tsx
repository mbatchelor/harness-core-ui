/*
 * Copyright 2020 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useExecutionContext } from '@pipeline/context/ExecutionContext'
import type { ExecutionPathProps, PipelineType } from '@common/interfaces/RouteInterfaces'
import { useGetPipeline } from 'services/pipeline-ng'
import { PreferenceScope, usePreferenceStore } from 'framework/PreferenceStore/PreferenceStoreContext'
import { SavedExecutionViewTypes } from '@pipeline/components/LogsContent/LogsContent'
import ExecutionGraphView from './ExecutionGraphView/ExecutionGraphView'
import ExecutionLogView from './ExecutionLogView/ExecutionLogView'

export default function ExecutionPipelineView(): React.ReactElement {
  const { orgIdentifier, projectIdentifier, accountId, pipelineIdentifier } =
    useParams<PipelineType<ExecutionPathProps>>()

  const { pipelineExecutionDetail, setIsPipelineInvalid } = useExecutionContext()

  const { pipelineExecutionSummary = {} } = pipelineExecutionDetail || {}

  const repoIdentifier = pipelineExecutionSummary?.gitDetails?.repoIdentifier
  const branch = pipelineExecutionSummary?.gitDetails?.branch

  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const { preference: savedExecutionView } = usePreferenceStore<string | undefined>(
    PreferenceScope.USER,
    'executionViewType'
  )
  const initialSelectedView = savedExecutionView || SavedExecutionViewTypes.GRAPH
  const view = queryParams.get('view')
  const isLogView =
    view === SavedExecutionViewTypes.LOG || (!view && initialSelectedView === SavedExecutionViewTypes.LOG)

  // Get pipeline data to check if it is valid
  const { data: pipelineResponse } = useGetPipeline({
    pipelineIdentifier,
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      repoIdentifier,
      branch,
      getTemplatesResolvedPipeline: true
    }
  })
  useEffect(() => {
    setIsPipelineInvalid?.(pipelineResponse?.data?.entityValidityDetails?.valid === false)
  }, [pipelineResponse, setIsPipelineInvalid])

  if (isLogView) {
    return <ExecutionLogView />
  }

  return <ExecutionGraphView />
}
