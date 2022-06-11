/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import cx from 'classnames'
import {
  Card,
  Checkbox,
  Container,
  Layout,
  RUNTIME_INPUT_VALUE,
  SelectOption,
  Text,
  useConfirmationDialog
} from '@wings-software/uicore'
import { Color, Intent } from '@harness/design-system'
import produce from 'immer'
import { debounce, defaultTo, find, get, isEmpty, set, unset } from 'lodash-es'
import { parse } from 'yaml'
import { Spinner } from '@blueprintjs/core'
import { StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { useStrings } from 'framework/strings'

import type { GitQueryParams, ProjectPathProps, ServicePathProps } from '@common/interfaces/RouteInterfaces'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import {
  NGServiceConfig,
  ServiceConfig,
  ServiceDefinition,
  ServiceResponseDTO,
  StageElementConfig,
  StageElementWrapperConfig,
  TemplateLinkConfig,
  useGetServiceList,
  useGetServiceV2
} from 'services/cd-ng'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import {
  getFlattenedStages,
  getStageIndexFromPipeline
} from '@pipeline/components/PipelineStudio/StageBuilder/StageBuilderUtil'
import { StepWidget } from '@pipeline/components/AbstractSteps/StepWidget'
import type { K8SDirectServiceStep } from '@cd/components/PipelineSteps/K8sServiceSpec/K8sServiceSpecInterface'
import DeployServiceErrors from '@cd/components/PipelineStudio/DeployServiceSpecifications/DeployServiceErrors'
import PropagateWidget, {
  setupMode
} from '@cd/components/PipelineStudio/DeployServiceSpecifications/PropagateWidget/PropagateWidget'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { useValidationErrors } from '@pipeline/components/PipelineStudio/PiplineHooks/useValidationErrors'
import {
  DeployTabs,
  getServiceEntityServiceRef,
  isEmptyServiceConfigPath
} from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'
import SelectDeploymentType from '@cd/components/PipelineStudio/DeployServiceSpecifications/SelectDeploymentType'
import type { DeploymentStageElementConfig } from '@pipeline/utils/pipelineTypes'
import { useDeepCompareEffect, useQueryParams } from '@common/hooks'
import {
  deleteStageData,
  doesStageContainOtherData,
  getStepTypeByDeploymentType,
  ServiceDeploymentType,
  StageType
} from '@pipeline/utils/stageHelpers'
import { Scope } from '@common/interfaces/SecretsInterface'
import {
  getIdentifierFromValue,
  getScopeBasedProjectPathParams,
  getScopeFromValue
} from '@common/components/EntityReference/EntityReference'
import { useGetTemplate } from 'services/template-ng'
import { Page } from '@common/exports'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { yamlParse } from '@common/utils/YamlHelperMethods'
import type { DeployServiceData } from '@cd/components/PipelineSteps/DeployServiceStep/DeployServiceInterface'
import { useCache } from '@common/hooks/useCache'
import { FeatureFlag } from '@common/featureFlags'
import stageCss from '../DeployStageSetupShell/DeployStage.module.scss'

export default function DeployServiceSpecifications(props: React.PropsWithChildren<unknown>): JSX.Element {
  const { getString } = useStrings()
  const isSvcEnvEntityEnabled = useFeatureFlag(FeatureFlag.NG_SVC_ENV_REDESIGN)
  const queryParams = useParams<ProjectPathProps & ServicePathProps>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()

  const {
    state: {
      pipeline,
      templateTypes,
      selectionState: { selectedStageId }
    },
    allowableTypes,
    isReadonly,
    scope,
    getStageFromPipeline,
    updateStage
  } = usePipelineContext()
  const scrollRef = React.useRef<HTMLDivElement | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debounceUpdateStage = useCallback(
    debounce(
      (changedStage?: StageElementConfig) =>
        changedStage ? updateStage(changedStage) : /* istanbul ignore next */ Promise.resolve(),
      300
    ),
    [updateStage]
  )
  const { stage } = getStageFromPipeline<DeploymentStageElementConfig>(selectedStageId || '')
  const getDeploymentType = (): ServiceDeploymentType => {
    return get(stage, 'stage.spec.serviceConfig.serviceDefinition.type')
  }

  const [setupModeType, setSetupMode] = useState('')
  const [checkedItems, setCheckedItems] = useState({
    overrideSetCheckbox: false
  })
  const [selectedPropagatedState, setSelectedPropagatedState] = useState<SelectOption>()
  const [serviceIdNameMap, setServiceIdNameMap] = useState<{ [key: string]: string }>()
  const [selectedDeploymentType, setSelectedDeploymentType] = useState<ServiceDeploymentType | undefined>(
    getDeploymentType()
  )
  const [previousStageList, setPreviousStageList] = useState<SelectOption[]>([])
  const [currStageData, setCurrStageData] = useState<DeploymentStageElementConfig | undefined>()
  const [templateToFetch, setTemplateToFetch] = useState<TemplateLinkConfig>()
  const [isReadonlyView, setIsReadOnlyView] = useState(false)

  const { index: stageIndex } = getStageIndexFromPipeline(pipeline, selectedStageId || '')
  const { stages } = getFlattenedStages(pipeline)
  const { submitFormsForTab } = useContext(StageErrorContext)
  const { errorMap } = useValidationErrors()
  const { setCache } = useCache()

  const memoizedQueryParam = useMemo(
    () => ({
      accountIdentifier: queryParams.accountId,
      orgIdentifier: queryParams.orgIdentifier,
      projectIdentifier: queryParams.projectIdentifier
    }),
    [queryParams]
  )
  const { data: selectedServiceResponse, refetch: refetchServiceData } = useGetServiceV2({
    serviceIdentifier: '',
    queryParams: memoizedQueryParam,
    lazy: true
  })

  useEffect(() => {
    //When service.serviceRef is present refetch serviceAPI to populate deployment type and service definition
    if (getServiceEntityServiceRef(stage?.stage)) {
      const stageServiceRef = (stage?.stage?.spec as any)?.service?.serviceRef
      refetchServiceData({
        pathParams: {
          serviceIdentifier: stageServiceRef
        },
        queryParams: memoizedQueryParam
      })
    } else {
      if (
        !stage?.stage?.spec?.serviceConfig?.serviceDefinition &&
        !stage?.stage?.spec?.serviceConfig?.useFromStage?.stage &&
        stage?.stage?.type === StageType.DEPLOY &&
        !isSvcEnvEntityEnabled
      ) {
        setDefaultServiceSchema()
      } else if (
        scope !== Scope.PROJECT &&
        stage?.stage?.spec?.serviceConfig &&
        stage?.stage?.spec?.serviceConfig?.serviceRef !== RUNTIME_INPUT_VALUE
      ) {
        const stageData = produce(stage, draft => {
          if (draft) {
            set(draft, 'stage.spec.serviceConfig.serviceRef', RUNTIME_INPUT_VALUE)
          }
        })
        if (stageData?.stage) {
          debounceUpdateStage(stageData?.stage)
        }
      }
    }
  }, [])

  //This is to refetch the service API and update stage on change of service from service select
  useEffect(() => {
    const serviceData = selectedServiceResponse?.data?.service as ServiceResponseDTO
    if (!isEmpty(serviceData?.yaml)) {
      const parsedYaml = yamlParse<NGServiceConfig>(defaultTo(serviceData.yaml, ''))
      const serviceInfo = parsedYaml.service?.serviceDefinition
      if (serviceInfo) {
        const stageData = produce(stage, draft => {
          if (draft) {
            set(draft, 'stage.spec.deploymentType', serviceInfo?.type)
            set(draft, 'stage.spec.service.serviceRef', parsedYaml.service?.identifier)
          }
        })
        if (stageData?.stage) {
          debounceUpdateStage(stageData?.stage)
        }
        //setting service data in cache to reuse it in manifests, artifacts, variables
        const serviceCacheId = `${pipeline.identifier}-${selectedStageId}-service`
        setCache(serviceCacheId, serviceInfo)

        setSelectedDeploymentType(serviceInfo.type as ServiceDeploymentType)
        setIsReadOnlyView(true)
      }
    } else {
      //If old service entity is selected back, the readonly view should be false and deployment type should be unselected
      setIsReadOnlyView(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServiceResponse])

  useEffect(() => {
    if (errorMap.size > 0) {
      submitFormsForTab(DeployTabs.SERVICE)
    }
  }, [errorMap])

  const { data: serviceResponse } = useGetServiceList({
    queryParams: {
      accountIdentifier: queryParams.accountId,
      orgIdentifier: queryParams.orgIdentifier,
      projectIdentifier: queryParams.projectIdentifier
    }
  })

  useEffect(() => {
    const serviceIdNameMapping: { [key: string]: string } = {}
    serviceResponse?.data?.content?.forEach(service => {
      if (service.service?.identifier) {
        serviceIdNameMapping[service.service?.identifier] = service.service?.name || ''
      }
    })
    setServiceIdNameMap(serviceIdNameMapping)
  }, [serviceResponse])

  useDeepCompareEffect(() => {
    if (stages && stages.length > 0) {
      const newPreviousStageList: SelectOption[] = []
      const currentStageType = stage?.stage?.type
      stages.forEach((item, index) => {
        if (index < stageIndex) {
          //If the new stage or stage template has new service entity(stage.spec.service.serviceRef), propogate from stage is not allowed.
          if (isSvcEnvEntityEnabled) {
            /* istanbul ignore else */
            if (
              (item.stage?.spec as any)?.service?.serviceRef ||
              (item.stage?.template && !stage?.stage?.spec?.serviceConfig?.useFromStage?.stage)
            ) {
              return
            }
          }

          if (item.stage?.template) {
            const stageType = get(templateTypes, item.stage.template.templateRef)
            if (currentStageType === stageType) {
              newPreviousStageList.push({
                label: `Stage [${item.stage?.name}] - [Template]`,
                value: item.stage?.identifier || ''
              })
            }
          } else if (
            currentStageType === item?.stage?.type &&
            !get(item.stage, `spec.serviceConfig.useFromStage.stage`)
          ) {
            let serviceName = (item.stage as DeploymentStageElementConfig)?.spec?.serviceConfig?.service?.name
            if (isEmpty(serviceName) && serviceIdNameMap) {
              serviceName =
                serviceIdNameMap[
                  (item.stage as DeploymentStageElementConfig)?.spec?.serviceConfig?.serviceRef as string
                ]
            }
            if (isEmpty(serviceName)) {
              serviceName = (item.stage as DeploymentStageElementConfig)?.spec?.serviceConfig?.serviceRef || ''
            }
            newPreviousStageList.push({
              label: `Stage [${item.stage?.name}] - Service [${serviceName}]`,
              value: item.stage?.identifier || ''
            })
          }
        }
      })
      setPreviousStageList(newPreviousStageList)
    }
  }, [stages, serviceIdNameMap])

  useEffect(() => {
    if (stageIndex === 0) {
      setSetupMode(setupMode.DIFFERENT)
    }
  }, [stageIndex])

  useEffect(() => {
    const useFromStage = stage?.stage?.spec?.serviceConfig?.useFromStage
    const stageOverrides = stage?.stage?.spec?.serviceConfig?.stageOverrides

    if (useFromStage) {
      setSetupMode(setupMode.PROPAGATE)
      if (previousStageList && previousStageList.length > 0) {
        const selectedIdentifier = useFromStage?.stage
        const selectedOption = previousStageList.find(v => v.value === selectedIdentifier)
        setSelectedPropagatedState(selectedOption)
        setCheckedItems({
          ...checkedItems,
          overrideSetCheckbox: !!stageOverrides
        })
      }
    } else {
      setSetupMode(setupMode.DIFFERENT)
      setSelectedPropagatedState({
        label: '',
        value: ''
      })
      setCheckedItems({
        ...checkedItems,
        overrideSetCheckbox: !!stageOverrides
      })
    }
  }, [stage?.stage?.spec, previousStageList])

  useEffect(() => {
    if (selectedPropagatedState && selectedPropagatedState.value) {
      const stageData = produce(stage, draft => {
        if (draft) {
          set(draft, 'stage.spec.serviceConfig.useFromStage', { stage: selectedPropagatedState.value })
        }
        if (draft?.stage?.spec?.serviceConfig?.serviceDefinition) {
          delete draft.stage.spec.serviceConfig.serviceDefinition
        }
        if (draft?.stage?.spec?.serviceConfig?.serviceRef !== undefined) {
          delete draft.stage.spec.serviceConfig.serviceRef
        }
      })
      debounceUpdateStage(stageData?.stage)
    }
  }, [selectedPropagatedState])

  const setDefaultServiceSchema = (): Promise<void> => {
    const stageData = produce(stage, draft => {
      if (draft) {
        set(draft, 'stage.spec', {
          ...stage?.stage?.spec,
          serviceConfig: {
            serviceRef: getScopeBasedDefaultServiceRef(),
            serviceDefinition: {
              spec: {
                variables: []
              }
            }
          }
        })
      }
    })

    return debounceUpdateStage(stageData?.stage)
  }

  const setStageOverrideSchema = (): Promise<void> => {
    const stageData = produce(stage, draft => {
      if (draft) {
        set(draft, 'stage.spec', {
          ...stage?.stage?.spec,
          serviceConfig: {
            ...stage?.stage?.spec?.serviceConfig,
            stageOverrides: {
              artifacts: {
                // primary: null,
                sidecars: []
              },
              manifests: [],
              variables: []
            }
          }
        })
      }
      if (draft?.stage?.spec?.serviceConfig?.serviceDefinition) {
        delete draft.stage.spec.serviceConfig.serviceDefinition
      }
    })

    return debounceUpdateStage(stageData?.stage)
  }

  const handleChange = (event: React.FormEvent<HTMLInputElement>): void => {
    const _isChecked = (event.target as HTMLInputElement).checked
    setCheckedItems({
      ...checkedItems,
      overrideSetCheckbox: _isChecked
    })
    if (_isChecked) {
      setStageOverrideSchema()
    } else {
      const stageData = produce(stage, draft => {
        if (stage?.stage?.spec?.serviceConfig?.stageOverrides) {
          unset(draft?.stage?.spec?.serviceConfig, 'stageOverrides')
        }
      })

      debounceUpdateStage(stageData?.stage)
    }
  }

  const updateService = useCallback(
    async (value: ServiceConfig) => {
      const stageData = produce(stage, draft => {
        const serviceObj = get(draft, 'stage.spec.serviceConfig', {})
        if (value.service) {
          serviceObj.service = value.service
          delete serviceObj.serviceRef
        } else {
          serviceObj.serviceRef = value.serviceRef
          delete serviceObj.service
        }
      })
      await debounceUpdateStage(stageData?.stage)

      if (isSvcEnvEntityEnabled && value.serviceRef) {
        refetchServiceData({
          pathParams: {
            serviceIdentifier: value.serviceRef
          },
          queryParams: memoizedQueryParam
        })
      }
    },
    [debounceUpdateStage, memoizedQueryParam, refetchServiceData, stage]
  )

  const handleDeploymentTypeChange = useCallback(
    (deploymentType: ServiceDeploymentType): void => {
      if (deploymentType !== selectedDeploymentType) {
        const stageData = produce(stage, draft => {
          const serviceDefinition = get(draft, 'stage.spec.serviceConfig.serviceDefinition', {})
          serviceDefinition.type = deploymentType
        })
        if (doesStageContainOtherData(stageData?.stage)) {
          setCurrStageData(stageData?.stage)
          openStageDataDeleteWarningDialog()
        } else {
          setSelectedDeploymentType(deploymentType)
          updateStage(stageData?.stage as StageElementConfig)
        }
      }
    },
    [stage, updateStage]
  )

  const {
    data: templateDetails,
    refetch: fetchTemplate,
    loading: templateDetailsLoading,
    error: templateDetailsError
  } = useGetTemplate({
    templateIdentifier: '',
    lazy: true
  })

  const fetchTemplateDetails = (templateData?: TemplateLinkConfig) => {
    if (templateData) {
      const templateScope = getScopeFromValue(templateData.templateRef)

      fetchTemplate({
        queryParams: {
          ...getScopeBasedProjectPathParams(queryParams, templateScope),
          repoIdentifier,
          branch,
          getDefaultFromOtherRepo: true,
          versionLabel: defaultTo(templateData?.versionLabel, '')
        },
        pathParams: {
          templateIdentifier: getIdentifierFromValue(templateData?.templateRef || '')
        }
      })
    }
  }

  useEffect(() => {
    if (!isEmpty(templateDetails?.data)) {
      const templateDeploymentType = get(
        parse(defaultTo(templateDetails?.data?.yaml, '')),
        'template.spec.spec.serviceConfig.serviceDefinition.type'
      )
      if (templateDeploymentType) {
        setSelectedDeploymentType(templateDeploymentType)
      }
    }
  }, [templateDetails?.data])

  // Fetches deployment type if current stage is propagated from template based stage
  useEffect(() => {
    if (selectedPropagatedState?.value && checkedItems.overrideSetCheckbox) {
      const stagePropagatedFrom = find(
        stages,
        stageData => stageData.stage?.identifier === selectedPropagatedState.value
      ) as StageElementWrapperConfig
      const isStagePropagatedFromTemplate = !isEmpty(stagePropagatedFrom.stage?.template?.templateRef)

      if (isStagePropagatedFromTemplate) {
        setTemplateToFetch((stagePropagatedFrom.stage as StageElementConfig).template)
        fetchTemplateDetails((stagePropagatedFrom.stage as StageElementConfig).template)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPropagatedState?.value, checkedItems.overrideSetCheckbox])

  const { openDialog: openStageDataDeleteWarningDialog } = useConfirmationDialog({
    cancelButtonText: getString('cancel'),
    contentText: getString('pipeline.stageDataDeleteWarningText'),
    titleText: getString('pipeline.stageDataDeleteWarningTitle'),
    confirmButtonText: getString('confirm'),
    intent: Intent.WARNING,
    onCloseDialog: async isConfirmed => {
      if (isConfirmed) {
        deleteStageData(currStageData)
        await debounceUpdateStage(currStageData)
        setSelectedDeploymentType(currStageData?.spec?.serviceConfig?.serviceDefinition?.type as ServiceDeploymentType)
      }
    }
  })

  const getScopeBasedDefaultServiceRef = React.useCallback(() => {
    return scope === Scope.PROJECT ? '' : RUNTIME_INPUT_VALUE
  }, [scope])

  /*************************************Service Entity Related code********************************************************/
  const getServiceEntityBasedServiceRef = React.useCallback(() => {
    const stageObj = get(stage, 'stage.spec', {})
    if (stageObj.serviceConfig) {
      return get(stage, 'stage.spec.serviceConfig.serviceRef', '')
    } else if (stageObj.service) {
      return get(stage, 'stage.spec.service.serviceRef', '')
    }
    return ''
  }, [stage])

  const getServiceEntityBasedService = React.useCallback(() => {
    const stageObj = get(stage, 'stage.spec', {})
    if (stageObj.serviceConfig) {
      return get(stage, 'stage.spec.serviceConfig.service', {})
    } else if (stageObj.service) {
      return get(stage, 'stage.spec.service.service', {})
    }
    return ''
  }, [stage])

  const getDeployServiceWidgetInitValues = React.useCallback((): DeployServiceData => {
    const initValues: DeployServiceData = {
      service: getServiceEntityBasedService(),
      isNewServiceEntity: isNewServiceEntity(),
      serviceRef: scope === Scope.PROJECT ? getServiceEntityBasedServiceRef() : RUNTIME_INPUT_VALUE
    }
    if (isNewServiceEntity()) {
      initValues.deploymentType = (stage?.stage?.spec as any).deploymentType
    }
    return initValues
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isNewServiceEntity = (): boolean => {
    return isSvcEnvEntityEnabled && isEmptyServiceConfigPath(stage?.stage as DeploymentStageElementConfig)
  }

  const shouldRenderDeployServiceStep = (): boolean => {
    if (!isNewServiceEntity()) {
      return true
    }
    return false
  }
  /*************************************Service Entity Related code********************************************************/

  return (
    <div className={stageCss.deployStage} ref={scrollRef}>
      <DeployServiceErrors domRef={scrollRef as React.MutableRefObject<HTMLElement | undefined>} />
      <div className={cx(stageCss.contentSection, stageCss.paddedSection)}>
        {previousStageList.length > 0 && (
          <Container margin={{ bottom: 'xlarge', left: 'xlarge' }}>
            <PropagateWidget
              setupModeType={setupModeType}
              selectedPropagatedState={selectedPropagatedState}
              previousStageList={previousStageList}
              isReadonly={isReadonly}
              setSetupMode={setSetupMode}
              setSelectedPropagatedState={setSelectedPropagatedState}
              initWithServiceDefinition={setDefaultServiceSchema}
            />
            {setupModeType === setupMode.PROPAGATE && selectedPropagatedState?.value && (
              <Container margin={{ top: 'large' }}>
                <Container padding={{ bottom: 'small' }} border={{ bottom: true }}>
                  <Text color={Color.GREY_800} font={{ weight: 'bold' }}>
                    {getString('cd.pipelineSteps.serviceTab.stageOverrides')}
                  </Text>
                </Container>
                <Checkbox
                  color={Color.GREY_500}
                  font={{ weight: 'semi-bold' }}
                  margin={{ top: 'medium' }}
                  label={getString('cd.pipelineSteps.serviceTab.overrideChanges')}
                  checked={checkedItems.overrideSetCheckbox}
                  onChange={handleChange}
                />
              </Container>
            )}
          </Container>
        )}
        {setupModeType === setupMode.DIFFERENT ? (
          <>
            <>
              <div className={stageCss.tabHeading}>{getString('cd.pipelineSteps.serviceTab.aboutYourService')}</div>
              <Card className={stageCss.sectionCard} id="aboutService">
                <StepWidget
                  type={StepType.DeployService}
                  readonly={isReadonly || scope !== Scope.PROJECT}
                  initialValues={getDeployServiceWidgetInitValues()}
                  allowableTypes={allowableTypes}
                  onUpdate={data => updateService(data)}
                  factory={factory}
                  stepViewType={StepViewType.Edit}
                />
              </Card>
            </>

            {(isReadonlyView || shouldRenderDeployServiceStep()) && (
              <>
                <div className={stageCss.tabHeading} id="serviceDefinition">
                  {getString('pipelineSteps.deploy.serviceSpecifications.serviceDefinition')}
                </div>
                <SelectDeploymentType
                  selectedDeploymentType={selectedDeploymentType}
                  viewContext="setup"
                  isReadonly={isReadonly || isReadonlyView}
                  handleDeploymentTypeChange={handleDeploymentTypeChange}
                />
                <Layout.Horizontal>
                  <StepWidget<K8SDirectServiceStep>
                    factory={factory}
                    readonly={isReadonly || isReadonlyView}
                    initialValues={{
                      stageIndex,
                      setupModeType,
                      deploymentType: selectedDeploymentType as ServiceDefinition['type'],
                      isReadonlyServiceMode: isReadonlyView
                    }}
                    allowableTypes={allowableTypes}
                    type={getStepTypeByDeploymentType(defaultTo(selectedDeploymentType, ''))}
                    stepViewType={StepViewType.Edit}
                  />
                </Layout.Horizontal>
              </>
            )}
          </>
        ) : (
          checkedItems.overrideSetCheckbox &&
          selectedPropagatedState?.value &&
          (templateDetailsLoading ? (
            <Card className={stageCss.sectionCard}>
              <Spinner size={Spinner.SIZE_SMALL} />
            </Card>
          ) : templateDetailsError ? (
            <Card className={stageCss.sectionCard}>
              <Page.Error
                message={(templateDetailsError?.data as Error)?.message}
                onClick={() => fetchTemplateDetails(templateToFetch)}
              />
            </Card>
          ) : (
            <StepWidget<K8SDirectServiceStep>
              factory={factory}
              readonly={isReadonly}
              initialValues={{
                stageIndex,
                setupModeType,
                deploymentType: selectedDeploymentType as ServiceDefinition['type']
              }}
              allowableTypes={allowableTypes}
              type={getStepTypeByDeploymentType(defaultTo(selectedDeploymentType, ''))}
              stepViewType={StepViewType.Edit}
            />
          ))
        )}
        {((setupModeType === setupMode.PROPAGATE && selectedPropagatedState?.value) ||
          setupModeType === setupMode.DIFFERENT) && <Container margin={{ top: 'xxlarge' }}>{props.children}</Container>}
      </div>
    </div>
  )
}
