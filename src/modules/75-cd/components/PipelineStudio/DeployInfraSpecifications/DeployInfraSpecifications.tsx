/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import YAML from 'yaml'
import { Accordion, Card, Container, RUNTIME_INPUT_VALUE, Text } from '@wings-software/uicore'
import { debounce, defaultTo, get, isEmpty, isNil, omit, set } from 'lodash-es'
import produce from 'immer'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import {
  getProvisionerExecutionStrategyYamlPromise,
  Infrastructure,
  K8sAzureInfrastructure,
  K8SDirectInfrastructure,
  K8sGcpInfrastructure,
  PipelineInfrastructure,
  StageElementConfig
} from 'services/cd-ng'
import StringWithTooltip from '@common/components/StringWithTooltip/StringWithTooltip'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import type {
  InfraProvisioningData,
  ProvisionersOptions
} from '@cd/components/PipelineSteps/InfraProvisioning/InfraProvisioning'
import type { GcpInfrastructureSpec } from '@cd/components/PipelineSteps/GcpInfrastructureSpec/GcpInfrastructureSpec'
import { useStrings } from 'framework/strings'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { StepWidget } from '@pipeline/components/AbstractSteps/StepWidget'
import DeployServiceErrors from '@cd/components/PipelineStudio/DeployServiceSpecifications/DeployServiceErrors'
import { DeployTabs } from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { useValidationErrors } from '@pipeline/components/PipelineStudio/PiplineHooks/useValidationErrors'
import type { DeploymentStageElementConfig, StageElementWrapper } from '@pipeline/utils/pipelineTypes'
import SelectInfrastructureType from '@cd/components/PipelineStudio/DeployInfraSpecifications/SelectInfrastructureType/SelectInfrastructureType'
import { Scope } from '@common/interfaces/SecretsInterface'
import type { AzureInfrastructureSpec } from '@cd/components/PipelineSteps/AzureInfrastructureStep/AzureInfrastructureStep'
import {
  detailsHeaderName,
  getCustomStepProps,
  getSelectedDeploymentType,
  isServerlessDeploymentType,
  ServerlessInfraTypes,
  StageType
} from '@pipeline/utils/stageHelpers'
import { InfraDeploymentType } from '@cd/components/PipelineSteps/PipelineStepsUtil'
import type { ServerlessAwsLambdaSpec } from '@cd/components/PipelineSteps/ServerlessAWSLambda/ServerlessAwsLambdaSpec'
import type { ServerlessGCPSpec } from '@cd/components/PipelineSteps/ServerlessGCP/ServerlessGCPSpec'
import type { ServerlessAzureSpec } from '@cd/components/PipelineSteps/ServerlessAzure/ServerlessAzureSpec'
import { cleanUpEmptyProvisioner, getInfrastructureDefaultValue } from './deployInfraHelper'
import stageCss from '../DeployStageSetupShell/DeployStage.module.scss'

export const deploymentTypeInfraTypeMap = {
  Kubernetes: InfraDeploymentType.KubernetesDirect,
  NativeHelm: InfraDeploymentType.KubernetesDirect,
  amazonEcs: InfraDeploymentType.KubernetesDirect,
  amazonAmi: InfraDeploymentType.KubernetesDirect,
  awsCodeDeploy: InfraDeploymentType.KubernetesDirect,
  WinRm: InfraDeploymentType.KubernetesDirect,
  awsLambda: InfraDeploymentType.KubernetesDirect,
  pcf: InfraDeploymentType.KubernetesDirect,
  Ssh: InfraDeploymentType.KubernetesDirect,
  ServerlessAwsLambda: InfraDeploymentType.ServerlessAwsLambda,
  ServerlessAzureFunctions: InfraDeploymentType.ServerlessAzureFunctions,
  ServerlessGoogleFunctions: InfraDeploymentType.ServerlessGoogleFunctions,
  AmazonSAM: InfraDeploymentType.AmazonSAM,
  AzureFunctions: InfraDeploymentType.AzureFunctions
}

type InfraTypes = K8SDirectInfrastructure | K8sGcpInfrastructure | ServerlessInfraTypes | K8sAzureInfrastructure

export default function DeployInfraSpecifications(props: React.PropsWithChildren<unknown>): JSX.Element {
  const [initialInfrastructureDefinitionValues, setInitialInfrastructureDefinitionValues] =
    React.useState<Infrastructure>({})

  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const { getString } = useStrings()
  const { submitFormsForTab } = React.useContext(StageErrorContext)
  const { errorMap } = useValidationErrors()

  React.useEffect(() => {
    if (errorMap.size > 0) {
      submitFormsForTab(DeployTabs.INFRASTRUCTURE)
    }
  }, [errorMap])

  const {
    state: {
      originalPipeline,
      selectionState: { selectedStageId }
    },
    allowableTypes,
    isReadonly,
    scope,
    getStageFromPipeline,
    updateStage
  } = usePipelineContext()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounceUpdateStage = React.useCallback(
    debounce(
      (changedStage?: StageElementConfig) =>
        changedStage ? updateStage(changedStage) : /* instanbul ignore next */ Promise.resolve(),
      300
    ),
    [updateStage]
  )

  const { stage } = getStageFromPipeline<DeploymentStageElementConfig>(selectedStageId || '')

  const [selectedInfrastructureType, setSelectedInfrastructureType] = React.useState<string | undefined>()

  useEffect(() => {
    if (isEmpty(stage?.stage?.spec?.infrastructure) && stage?.stage?.type === StageType.DEPLOY) {
      const stageData = produce(stage, draft => {
        if (draft) {
          set(draft, 'stage.spec', {
            ...stage.stage?.spec,
            infrastructure: {
              environmentRef: getScopeBasedDefaultEnvironmentRef(),
              infrastructureDefinition: {},
              allowSimultaneousDeployments: false
            }
          })
        }
      })
      debounceUpdateStage(stageData?.stage)
    } else if (
      scope !== Scope.PROJECT &&
      stage?.stage?.spec?.infrastructure &&
      stage?.stage?.spec?.infrastructure?.environmentRef !== RUNTIME_INPUT_VALUE
    ) {
      const stageData = produce(stage, draft => {
        if (draft) {
          set(draft, 'stage.spec.infrastructure.environmentRef', RUNTIME_INPUT_VALUE)
        }
      })
      if (stageData?.stage) {
        debounceUpdateStage(stageData?.stage)
      }
    }
  }, [])

  const stageRef = React.useRef(stage)
  stageRef.current = stage

  const resetInfrastructureDefinition = (type?: string): void => {
    const stageData = produce(stage, draft => {
      const spec = get(draft, 'stage.spec', {})
      spec.infrastructure = {
        ...spec.infrastructure,
        infrastructureDefinition: {}
      }

      if (type) {
        spec.infrastructure.infrastructureDefinition.type = type
      }
    })

    const initialInfraDefValues = getInfrastructureDefaultValue(stageData, type)
    setInitialInfrastructureDefinitionValues(initialInfraDefValues)

    debounceUpdateStage(stageData?.stage)
    setProvisionerEnabled(false)
  }

  const getScopeBasedDefaultEnvironmentRef = React.useCallback(() => {
    return scope === Scope.PROJECT ? '' : RUNTIME_INPUT_VALUE
  }, [scope])

  const selectedDeploymentType = React.useMemo(() => {
    return getSelectedDeploymentType(
      stage,
      getStageFromPipeline,
      !!stage?.stage?.spec?.serviceConfig?.useFromStage?.stage
    )
  }, [stage, getStageFromPipeline])

  React.useEffect(() => {
    const type =
      stage?.stage?.spec?.infrastructure?.infrastructureDefinition?.type ||
      deploymentTypeInfraTypeMap[selectedDeploymentType]
    setSelectedInfrastructureType(type)
    const initialInfraDefValues = getInfrastructureDefaultValue(stage, type)
    setInitialInfrastructureDefinitionValues(initialInfraDefValues)
  }, [stage])

  const onUpdateInfrastructureDefinition = (extendedSpec: InfraTypes, type: string): void => {
    if (get(stageRef.current, 'stage.spec.infrastructure', null)) {
      const stageData = produce(stageRef.current, draft => {
        const infrastructure = get(draft, 'stage.spec.infrastructure', null)
        infrastructure.infrastructureDefinition = {
          ...infrastructure.infrastructureDefinition,
          type,
          spec: omit(extendedSpec, 'allowSimultaneousDeployments')
        }
        infrastructure.allowSimultaneousDeployments = extendedSpec.allowSimultaneousDeployments ?? false
      })
      debounceUpdateStage(stageData?.stage)
    }
  }

  const [provisionerEnabled, setProvisionerEnabled] = useState<boolean>(false)
  const [provisionerSnippetLoading, setProvisionerSnippetLoading] = useState<boolean>(false)
  const [provisionerType, setProvisionerType] = useState<ProvisionersOptions>('TERRAFORM')

  const isProvisionerEmpty = (stageData: StageElementWrapper): boolean => {
    const provisionerData = get(stageData, 'stage.spec.infrastructure.infrastructureDefinition.provisioner')
    return isEmpty(provisionerData?.steps) && isEmpty(provisionerData?.rollbackSteps)
  }

  // load and apply provisioner snippet to the stage
  useEffect(() => {
    if (stage && isProvisionerEmpty(stage) && provisionerEnabled) {
      setProvisionerSnippetLoading(true)
      getProvisionerExecutionStrategyYamlPromise({ queryParams: { provisionerType: provisionerType } }).then(res => {
        const provisionerSnippet = YAML.parse(defaultTo(res?.data, ''))
        if (stage && isProvisionerEmpty(stage) && provisionerSnippet) {
          const stageData = produce(stage, draft => {
            set(draft, 'stage.spec.infrastructure.infrastructureDefinition.provisioner', provisionerSnippet.provisioner)
          })

          if (stageData.stage) {
            updateStage(stageData.stage).then(() => {
              setProvisionerSnippetLoading(false)
            })
          }
        }
      })
    }
  }, [provisionerEnabled])

  useEffect(() => {
    setProvisionerEnabled(!isProvisionerEmpty(defaultTo(stage, {} as StageElementWrapper)))

    return () => {
      let isChanged
      const stageData = produce(stage, draft => {
        isChanged = cleanUpEmptyProvisioner(draft)
      })

      if (stageData?.stage && isChanged) {
        updateStage(stageData?.stage)
      }
    }
  }, [])

  const getProvisionerData = (stageData: StageElementWrapper): InfraProvisioningData => {
    let provisioner = get(stageData, 'stage.spec.infrastructure.infrastructureDefinition.provisioner')
    let originalProvisioner: InfraProvisioningData['originalProvisioner'] = undefined
    if (selectedStageId) {
      const originalStage = getStageFromPipeline(selectedStageId, originalPipeline).stage
      originalProvisioner = get(originalStage, 'stage.spec.infrastructure.infrastructureDefinition.provisioner')
    }

    provisioner = isNil(provisioner) ? {} : { ...provisioner }

    if (isNil(provisioner.steps)) {
      provisioner.steps = []
    }
    if (isNil(provisioner.rollbackSteps)) {
      provisioner.rollbackSteps = []
    }

    return {
      provisioner: { ...provisioner },
      provisionerEnabled,
      provisionerSnippetLoading,
      originalProvisioner: { ...originalProvisioner }
    }
  }

  const getClusterConfigurationStep = (type: string): React.ReactElement => {
    if (!stage?.stage) {
      return <div>Undefined deployment type</div>
    }
    switch (type) {
      case InfraDeploymentType.KubernetesDirect: {
        return (
          <StepWidget<K8SDirectInfrastructure>
            factory={factory}
            key={stage.stage.identifier}
            readonly={isReadonly}
            initialValues={initialInfrastructureDefinitionValues as K8SDirectInfrastructure}
            type={StepType.KubernetesDirect}
            stepViewType={StepViewType.Edit}
            allowableTypes={allowableTypes}
            onUpdate={value =>
              onUpdateInfrastructureDefinition(
                {
                  connectorRef: value.connectorRef,
                  namespace: value.namespace,
                  releaseName: value.releaseName,
                  allowSimultaneousDeployments: value.allowSimultaneousDeployments
                },
                InfraDeploymentType.KubernetesDirect
              )
            }
          />
        )
      }
      case InfraDeploymentType.KubernetesGcp: {
        return (
          <StepWidget<GcpInfrastructureSpec>
            factory={factory}
            key={stage.stage.identifier}
            readonly={isReadonly}
            initialValues={initialInfrastructureDefinitionValues as GcpInfrastructureSpec}
            type={StepType.KubernetesGcp}
            stepViewType={StepViewType.Edit}
            allowableTypes={allowableTypes}
            onUpdate={value =>
              onUpdateInfrastructureDefinition(
                {
                  connectorRef: value.connectorRef,
                  cluster: value.cluster,
                  namespace: value.namespace,
                  releaseName: value.releaseName,
                  allowSimultaneousDeployments: value.allowSimultaneousDeployments
                },
                InfraDeploymentType.KubernetesGcp
              )
            }
          />
        )
      }
      case InfraDeploymentType.KubernetesAzure: {
        return (
          <StepWidget<AzureInfrastructureSpec>
            factory={factory}
            key={stage?.stage?.identifier}
            readonly={isReadonly}
            initialValues={initialInfrastructureDefinitionValues as AzureInfrastructureSpec}
            type={StepType.KubernetesAzure}
            stepViewType={StepViewType.Edit}
            allowableTypes={allowableTypes}
            onUpdate={value =>
              onUpdateInfrastructureDefinition(
                {
                  connectorRef: value.connectorRef,
                  subscriptionId: value.subscriptionId,
                  resourceGroup: value.resourceGroup,
                  cluster: value.cluster,
                  namespace: value.namespace,
                  releaseName: value.releaseName,
                  allowSimultaneousDeployments: value.allowSimultaneousDeployments
                },
                InfraDeploymentType.KubernetesAzure
              )
            }
          />
        )
      }
      case 'ServerlessAwsLambda': {
        return (
          <StepWidget<ServerlessAwsLambdaSpec>
            factory={factory}
            key={stage.stage.identifier}
            readonly={isReadonly}
            initialValues={initialInfrastructureDefinitionValues as ServerlessAwsLambdaSpec}
            type={StepType.ServerlessAwsInfra}
            stepViewType={StepViewType.Edit}
            allowableTypes={allowableTypes}
            onUpdate={value =>
              onUpdateInfrastructureDefinition(
                {
                  connectorRef: value.connectorRef,
                  stage: value.stage,
                  region: value.region,
                  allowSimultaneousDeployments: value.allowSimultaneousDeployments
                },
                'ServerlessAwsLambda'
              )
            }
            customStepProps={getCustomStepProps('ServerlessAwsLambda', getString)}
          />
        )
      }
      case 'ServerlessGoogleFunctions': {
        return (
          <StepWidget<ServerlessGCPSpec>
            factory={factory}
            key={stage.stage.identifier}
            readonly={isReadonly}
            initialValues={initialInfrastructureDefinitionValues as ServerlessGCPSpec}
            type={StepType.ServerlessGCP}
            stepViewType={StepViewType.Edit}
            allowableTypes={allowableTypes}
            onUpdate={value =>
              onUpdateInfrastructureDefinition(
                {
                  connectorRef: value.connectorRef,
                  stage: value.stage,
                  allowSimultaneousDeployments: value.allowSimultaneousDeployments
                },
                'ServerlessGoogleFunctions'
              )
            }
            customStepProps={getCustomStepProps('ServerlessGoogleFunctions', getString)}
          />
        )
      }
      case 'ServerlessAzureFunctions': {
        return (
          <StepWidget<ServerlessAzureSpec>
            factory={factory}
            key={stage.stage.identifier}
            readonly={isReadonly}
            initialValues={initialInfrastructureDefinitionValues as ServerlessAzureSpec}
            type={StepType.ServerlessAzure}
            stepViewType={StepViewType.Edit}
            allowableTypes={allowableTypes}
            onUpdate={value =>
              onUpdateInfrastructureDefinition(
                {
                  connectorRef: value.connectorRef,
                  stage: value.stage,
                  allowSimultaneousDeployments: value.allowSimultaneousDeployments
                },
                'ServerlessAzureFunctions'
              )
            }
            customStepProps={getCustomStepProps('ServerlessAzureFunctions', getString)}
          />
        )
      }
      default: {
        return <div>{getString('cd.steps.common.undefinedType')}</div>
      }
    }
  }

  const updateEnvStep = React.useCallback(
    (value: PipelineInfrastructure) => {
      const stageData = produce(stage, draft => {
        const infraObj: PipelineInfrastructure = get(draft, 'stage.spec.infrastructure', {})
        if (value.environment?.identifier) {
          infraObj.environment = value.environment
          delete infraObj.environmentRef
        } else {
          infraObj.environmentRef = value.environmentRef
          delete infraObj.environment
        }
      })
      debounceUpdateStage(stageData?.stage)
    },
    [stage, debounceUpdateStage, stage?.stage?.spec?.infrastructure?.infrastructureDefinition]
  )

  return (
    <div className={stageCss.serviceOverrides} key="1">
      <DeployServiceErrors domRef={scrollRef as React.MutableRefObject<HTMLElement | undefined>} />
      <div className={stageCss.contentSection} ref={scrollRef}>
        <div className={stageCss.tabHeading} id="environment">
          {getString('environment')}
        </div>
        <Card className={stageCss.sectionCard}>
          <StepWidget
            type={StepType.DeployEnvironment}
            readonly={isReadonly || scope !== Scope.PROJECT}
            initialValues={{
              environment: get(stage, 'stage.spec.infrastructure.environment', {}),
              environmentRef:
                scope === Scope.PROJECT
                  ? get(stage, 'stage.spec.infrastructure.environmentRef', '')
                  : RUNTIME_INPUT_VALUE
            }}
            allowableTypes={allowableTypes}
            onUpdate={val => updateEnvStep(val)}
            factory={factory}
            stepViewType={StepViewType.Edit}
          />
        </Card>
        <div className={stageCss.tabHeading} id="infrastructureDefinition">
          <StringWithTooltip
            tooltipId="pipelineStep.infrastructureDefinition"
            stringId="pipelineSteps.deploy.infrastructure.infraDefinition"
          />
        </div>
        <Card className={stageCss.sectionCard}>
          {!isServerlessDeploymentType(selectedDeploymentType) && (
            <Text margin={{ bottom: 'medium' }} className={stageCss.info}>
              <StringWithTooltip
                tooltipId="pipelineStep.infrastructureDefinitionMethod"
                stringId="pipelineSteps.deploy.infrastructure.selectMethod"
              />
            </Text>
          )}
          <SelectInfrastructureType
            deploymentType={selectedDeploymentType}
            isReadonly={isReadonly}
            selectedInfrastructureType={selectedInfrastructureType}
            onChange={deploymentType => {
              setSelectedInfrastructureType(deploymentType)
              resetInfrastructureDefinition(deploymentType)
            }}
          />
        </Card>
        {selectedInfrastructureType && !isServerlessDeploymentType(selectedDeploymentType) ? (
          <Accordion className={stageCss.accordion} activeId="dynamicProvisioning">
            <Accordion.Panel
              id="dynamicProvisioning"
              addDomId={true}
              summary={<div className={stageCss.tabHeading}>{getString('cd.dynamicProvisioning')}</div>}
              details={
                <Card className={stageCss.sectionCard}>
                  <StepWidget<InfraProvisioningData>
                    factory={factory}
                    allowableTypes={allowableTypes}
                    readonly={isReadonly}
                    key={stage?.stage?.identifier}
                    initialValues={getProvisionerData(defaultTo(stage, {} as StageElementWrapper))}
                    type={StepType.InfraProvisioning}
                    stepViewType={StepViewType.Edit}
                    onUpdate={(value: InfraProvisioningData) => {
                      if (stage) {
                        const stageData = produce(stage, draft => {
                          set(
                            draft,
                            'stage.spec.infrastructure.infrastructureDefinition.provisioner',
                            value.provisioner
                          )
                          cleanUpEmptyProvisioner(draft)
                        })
                        if (stageData.stage) {
                          setProvisionerType(value.selectedProvisioner!)
                          updateStage(stageData.stage).then(() => {
                            setProvisionerEnabled(value.provisionerEnabled)
                          })
                        }
                      } else {
                        setProvisionerType(value.selectedProvisioner!)
                        setProvisionerEnabled(value.provisionerEnabled)
                      }
                    }}
                  />
                </Card>
              }
            />
          </Accordion>
        ) : null}
        <div className={stageCss.tabHeading} id="clusterDetails">
          {defaultTo(detailsHeaderName[selectedInfrastructureType || ''], getString('cd.steps.common.clusterDetails'))}
        </div>
        <Card className={stageCss.sectionCard}>{getClusterConfigurationStep(selectedInfrastructureType || '')}</Card>

        <Container margin={{ top: 'xxlarge' }}>{props.children}</Container>
      </div>
    </div>
  )
}
