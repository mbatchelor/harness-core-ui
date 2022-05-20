/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { cloneDeep, defaultTo, get, isEmpty, merge, set } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { produce } from 'immer'
import { useQueryParams } from '@common/hooks'
import { ServicePipelineProvider } from '@cd/components/ServiceEnvironmentPipelineContext/ServicePipelineContext'
import type { GitQueryParams, ProjectPathProps, ServicePathProps } from '@common/interfaces/RouteInterfaces'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { usePermission } from '@rbac/hooks/usePermission'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { PipelineContextType } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { DefaultNewPipelineId } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineActions'
import { sanitize } from '@common/utils/JSONUtils'
import { yamlParse } from '@common/utils/YamlHelperMethods'
import type { NGServiceConfig, PipelineInfoConfig, ServiceResponseDTO } from 'services/cd-ng'
import {
  initialServiceState,
  DefaultNewStageName,
  DefaultNewStageId,
  setNameIDDescription
} from '../../utils/ServiceUtils'
import ServiceStudioDetails from '../ServiceStudioDetails'

interface ServiceConfigurationWrapperProps {
  serviceResponse: ServiceResponseDTO
}

function ServiceConfigurationWrapper({ serviceResponse }: ServiceConfigurationWrapperProps): React.ReactElement {
  const { accountId, orgIdentifier, projectIdentifier, serviceId } = useParams<ProjectPathProps & ServicePathProps>()
  const { branch, repoIdentifier } = useQueryParams<GitQueryParams>()

  const [isEdit] = usePermission({
    resource: {
      resourceType: ResourceType.SERVICE,
      resourceIdentifier: serviceId
    },
    permissions: [PermissionIdentifier.EDIT_SERVICE],
    options: {
      skipCondition: ({ resourceIdentifier }) => !resourceIdentifier
    }
  })
  const isReadonly = !isEdit

  const serviceYaml = React.useMemo(
    () => yamlParse<NGServiceConfig>(defaultTo(serviceResponse.yaml, '')),
    [serviceResponse.yaml]
  )
  const serviceData = merge(serviceYaml, initialServiceState)

  const currentPipeline = React.useMemo(() => {
    const defaultPipeline = {
      name: serviceResponse.name,
      identifier: defaultTo(serviceResponse.identifier, DefaultNewPipelineId),
      description: serviceResponse.description,
      tags: serviceResponse.tags
    }
    return produce({ ...defaultPipeline }, draft => {
      if (!isEmpty(serviceData.service.serviceDefinition)) {
        set(draft, 'stages[0].stage.name', DefaultNewStageName)
        set(draft, 'stages[0].stage.identifier', DefaultNewStageId)
        set(
          draft,
          'stages[0].stage.spec.serviceConfig.serviceDefinition',
          cloneDeep(serviceData.service.serviceDefinition)
        )
        set(draft, 'stages[0].stage.spec.serviceConfig.serviceRef', serviceResponse.identifier)
      }
    })
  }, [serviceData, serviceResponse])

  const [currentService, setCurrentService] = React.useState(serviceData)

  const onUpdatePipeline = async (pipelineConfig: PipelineInfoConfig): Promise<void> => {
    const stage = get(pipelineConfig, 'stages[0].stage.spec.serviceConfig.serviceDefinition')
    sanitize(stage, { removeEmptyArray: false, removeEmptyObject: false, removeEmptyString: false })

    setNameIDDescription(serviceData.service, pipelineConfig)
    set(serviceData, 'service.serviceDefinition', stage)
    setCurrentService(serviceData)
  }

  return (
    <ServicePipelineProvider
      queryParams={{ accountIdentifier: accountId, orgIdentifier, projectIdentifier, repoIdentifier, branch }}
      initialValue={currentPipeline as PipelineInfoConfig}
      onUpdatePipeline={onUpdatePipeline}
      serviceIdentifier={serviceId}
      contextType={PipelineContextType.Pipeline}
      isReadOnly={isReadonly}
    >
      <ServiceStudioDetails serviceData={currentService} />
    </ServicePipelineProvider>
  )
}

export default ServiceConfigurationWrapper
