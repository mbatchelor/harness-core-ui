/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Layout } from '@wings-software/uicore'

import { useParams } from 'react-router-dom'

import { useGetServiceV2 } from 'services/cd-ng'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'

import type { PipelineType } from '@common/interfaces/RouteInterfaces'
import { isServerlessDeploymentType } from '@pipeline/utils/stageHelpers'
import type { DeploymentStageElementConfig } from '@pipeline/utils/pipelineTypes'

import { ConfigFilesMap } from './ConfigFilesHelper'
import type { ConfigFilesSelectionProps, ConfigFileType } from './ConfigFilesInterface'
import ConfigFilesListView from './ConfigFilesListView/ConfigFilesListView'

export default function ConfigFilesSelection({
  isPropagating,
  deploymentType
}: ConfigFilesSelectionProps): JSX.Element {
  const {
    state: {
      pipeline,
      selectionState: { selectedStageId }
    },
    getStageFromPipeline,
    updateStage,
    isReadonly,
    allowableTypes
  } = usePipelineContext()

  const { stage } = getStageFromPipeline<DeploymentStageElementConfig>(selectedStageId || '')
  const [selectedConfig, setSelectedConfig] = useState<ConfigFileType>(ConfigFilesMap.Harness)

  const { accountId, orgIdentifier, projectIdentifier } = useParams<
    PipelineType<{
      orgIdentifier: string
      projectIdentifier: string
      accountId: string
    }>
  >()

  const { data: selectedServiceResponse } = useGetServiceV2({
    serviceIdentifier: (stage?.stage?.spec as any)?.service?.serviceRef,
    queryParams: { accountIdentifier: accountId, orgIdentifier: orgIdentifier, projectIdentifier: projectIdentifier },
    lazy: true
  })

  const handleSelect = (configFile: ConfigFileType) => {
    setSelectedConfig(configFile)
  }

  return (
    <Layout.Vertical>
      <ConfigFilesListView
        isPropagating={isPropagating}
        pipeline={pipeline}
        updateStage={updateStage}
        stage={stage}
        setSelectedConfig={handleSelect}
        selectedConfig={selectedConfig}
        isReadonly={isReadonly}
        deploymentType={deploymentType}
        allowableTypes={allowableTypes}
        allowOnlyOne={isServerlessDeploymentType(deploymentType)}
        selectedServiceResponse={selectedServiceResponse}
      />
    </Layout.Vertical>
  )
}
