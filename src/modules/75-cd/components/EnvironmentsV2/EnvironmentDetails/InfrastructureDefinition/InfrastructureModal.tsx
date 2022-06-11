/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo, get, merge, set } from 'lodash-es'
import type { FormikProps } from 'formik'
import { parse } from 'yaml'
import produce from 'immer'
import * as Yup from 'yup'

import {
  Button,
  ButtonVariation,
  Card,
  Container,
  Formik,
  getErrorInfoFromErrorObject,
  Layout,
  useToaster,
  VisualYamlSelectedView as SelectedView,
  VisualYamlToggle
} from '@harness/uicore'
import { Color } from '@harness/design-system'

import { useStrings } from 'framework/strings'
import {
  DeploymentStageConfig,
  InfrastructureConfig,
  InfrastructureDefinitionConfig,
  InfrastructureRequestDTORequestBody,
  PipelineInfoConfig,
  StageElementConfig,
  useCreateInfrastructure,
  useGetYamlSchema,
  useUpdateInfrastructure
} from 'services/cd-ng'

import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import YAMLBuilder from '@common/components/YAMLBuilder/YamlBuilder'
import { NameIdDescriptionTags } from '@common/components'
import type { EnvironmentPathProps, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import type { YamlBuilderHandlerBinding, YamlBuilderProps } from '@common/interfaces/YAMLBuilderProps'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import { IdentifierSchema, NameSchema } from '@common/utils/Validation'

import { DefaultPipeline } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineActions'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import { ServiceDeploymentType, StageType } from '@pipeline/utils/stageHelpers'
import type { DeploymentStageElementConfig } from '@pipeline/utils/pipelineTypes'

import DeployInfraDefinition from '@cd/components/PipelineStudio/DeployInfraSpecifications/DeployInfraDefinition/DeployInfraDefinition'
import { DefaultNewStageId, DefaultNewStageName } from '@cd/components/Services/utils/ServiceUtils'
import { getInfrastructureDefinitionValidationSchema } from '@cd/components/PipelineSteps/PipelineStepsUtil'
import SelectDeploymentType from '@cd/components/PipelineStudio/DeployServiceSpecifications/SelectDeploymentType'
import { InfrastructurePipelineProvider } from '@cd/context/InfrastructurePipelineContext'
import { useTemplateSelector } from '@templates-library/hooks/useTemplateSelector'
import css from './InfrastructureDefinition.module.scss'

const yamlBuilderReadOnlyModeProps: YamlBuilderProps = {
  fileName: `infrastructureDefinition.yaml`,
  entityType: 'Infrastructure',
  width: '100%',
  height: 600,
  showSnippetSection: false,
  yamlSanityConfig: {
    removeEmptyString: false,
    removeEmptyObject: false,
    removeEmptyArray: false
  }
}

export function InfrastructureModal({
  hideModal,
  refetch,
  infrastructureToEdit,
  setInfrastructureToEdit,
  envIdentifier
}: any) {
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const { getTemplate } = useTemplateSelector()

  const infrastructureDefinition = useMemo(() => {
    return (parse(defaultTo(infrastructureToEdit, '{}')) as InfrastructureConfig).infrastructureDefinition
  }, [infrastructureToEdit])

  const { type, spec, allowSimultaneousDeployments } = defaultTo(
    infrastructureDefinition,
    {}
  ) as InfrastructureDefinitionConfig

  const pipeline = React.useMemo(
    () =>
      produce({ ...DefaultPipeline }, draft => {
        set(
          draft,
          'stages[0].stage',
          merge({}, {} as DeploymentStageElementConfig, {
            name: DefaultNewStageName,
            identifier: DefaultNewStageId,
            type: StageType.DEPLOY,
            spec: {
              infrastructure: {
                infrastructureDefinition: {
                  ...(Boolean(type) && { type }),
                  ...(Boolean(type) && { spec })
                },
                allowSimultaneousDeployments: Boolean(allowSimultaneousDeployments)
              },
              serviceConfig: {
                serviceDefinition: {
                  type: ''
                }
              }
            }
          })
        )
      }),
    []
  )

  return (
    <InfrastructurePipelineProvider
      queryParams={{ accountIdentifier: accountId, orgIdentifier, projectIdentifier }}
      initialValue={pipeline as PipelineInfoConfig}
      isReadOnly={false}
      getTemplate={getTemplate}
    >
      <BootstrapDeployInfraDefinition
        hideModal={hideModal}
        refetch={refetch}
        infrastructureDefinition={infrastructureDefinition}
        setInfrastructureToEdit={setInfrastructureToEdit}
        envIdentifier={envIdentifier}
      />
    </InfrastructurePipelineProvider>
  )
}

function BootstrapDeployInfraDefinition({
  hideModal,
  refetch,
  infrastructureDefinition,
  setInfrastructureToEdit,
  envIdentifier
}: any) {
  const { accountId, orgIdentifier, projectIdentifier, environmentIdentifier } = useParams<
    ProjectPathProps & EnvironmentPathProps
  >()
  const {
    setSelection,
    state: {
      pipeline,
      selectionState: { selectedStageId }
    },
    getStageFromPipeline,
    updateStage
  } = usePipelineContext()
  const { getString } = useStrings()
  const { showSuccess, showError } = useToaster()

  const [selectedView, setSelectedView] = useState<SelectedView>(SelectedView.VISUAL)
  const [yamlHandler, setYamlHandler] = useState<YamlBuilderHandlerBinding | undefined>()
  const [isSavingInfrastructure, setIsSavingInfrastructure] = useState(false)
  const [selectedDeploymentType, setSelectedDeploymentType] = useState<ServiceDeploymentType | undefined>()
  const formikRef = useRef<FormikProps<InfrastructureConfig>>()
  const { stage } = getStageFromPipeline<DeploymentStageElementConfig>(selectedStageId || '')

  useEffect(() => {
    setSelection({
      stageId: 'stage_id'
    })
  }, [])

  const { data: environmentSchema } = useGetYamlSchema({
    queryParams: {
      entityType: 'Infrastructure',
      projectIdentifier,
      orgIdentifier,
      accountIdentifier: accountId,
      scope: getScopeFromDTO({ accountIdentifier: accountId, orgIdentifier, projectIdentifier })
    }
  })

  const handleModeSwitch = useCallback(
    /* istanbul ignore next */ (view: SelectedView) => {
      if (view === SelectedView.VISUAL) {
        const yaml = defaultTo(yamlHandler?.getLatestYaml(), '{}')
        const yamlVisual = parse(yaml).environment as InfrastructureConfig

        if (yamlHandler?.getYAMLValidationErrorMap()?.size) {
          showError(getString('common.validation.invalidYamlText'))
          return
        }

        if (yamlVisual) {
          formikRef.current?.setValues({
            ...yamlVisual
          })
        }
      }
      setSelectedView(view)
    },
    [yamlHandler?.getLatestYaml]
  )

  const cleanBeforeClose = () => {
    setInfrastructureToEdit?.()
    hideModal()
  }

  const { name, identifier, description, tags } = defaultTo(
    infrastructureDefinition,
    {}
  ) as InfrastructureDefinitionConfig

  const { mutate: updateInfrastructure } = useUpdateInfrastructure({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const { mutate: createInfrastructure } = useCreateInfrastructure({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const mutateFn = infrastructureDefinition ? updateInfrastructure : createInfrastructure

  const onSubmit = (values: InfrastructureDefinitionConfig) => {
    setIsSavingInfrastructure(true)
    const { name: newName, identifier: newIdentifier, description: newDescription, tags: newTags } = values
    const body: InfrastructureRequestDTORequestBody = {
      name: newName,
      identifier: newIdentifier,
      description: newDescription,
      tags: newTags,
      orgIdentifier,
      projectIdentifier,
      type: (pipeline.stages?.[0].stage?.spec as any)?.infrastructure?.infrastructureDefinition?.type,
      environmentRef: environmentIdentifier || envIdentifier
    }

    mutateFn({
      ...body,
      yaml: yamlStringify({
        infrastructureDefinition: {
          ...body,
          spec: (pipeline.stages?.[0].stage?.spec as DeploymentStageConfig)?.infrastructure?.infrastructureDefinition
            ?.spec,
          allowSimultaneousDeployments: (pipeline.stages?.[0].stage?.spec as DeploymentStageConfig)?.infrastructure
            ?.allowSimultaneousDeployments
        }
      })
    })
      .then(response => {
        if (response.status === 'SUCCESS') {
          showSuccess(
            getString('cd.infrastructure.created', {
              identifier: response.data?.infrastructure?.identifier
            })
          )
          setIsSavingInfrastructure(false)
          if (envIdentifier) {
            refetch({
              label: response.data?.infrastructure?.name,
              value: response.data?.infrastructure?.identifier
            })
          } else {
            refetch()
          }
          cleanBeforeClose()
        } else {
          throw response
        }
      })
      .catch(e => {
        setIsSavingInfrastructure(false)
        showError(getErrorInfoFromErrorObject(e))
      })
  }

  const handleDeploymentTypeChange = useCallback(
    (deploymentType: ServiceDeploymentType): void => {
      if (deploymentType !== selectedDeploymentType) {
        const stageData = produce(stage, draft => {
          const serviceDefinition = get(draft, 'stage.spec.serviceConfig.serviceDefinition', {})
          serviceDefinition.type = deploymentType
        })
        setSelectedDeploymentType(deploymentType)
        updateStage(stageData?.stage as StageElementConfig)
      }
    },
    [stage, updateStage]
  )

  return (
    <Formik<InfrastructureDefinitionConfig>
      initialValues={{
        name: defaultTo(name, ''),
        identifier: defaultTo(identifier, ''),
        description: defaultTo(description, ''),
        tags: defaultTo(tags, {}),
        type: 'KubernetesDirect',
        spec: {}
      }}
      formName={'Test'}
      onSubmit={onSubmit}
      validationSchema={Yup.object().shape({
        name: NameSchema({ requiredErrorMsg: getString('fieldRequired', { field: 'Name' }) }),
        identifier: IdentifierSchema(),
        spec: getInfrastructureDefinitionValidationSchema(selectedDeploymentType as any, getString)
      })}
    >
      {formikProps => {
        return (
          <Layout.Vertical padding={'xxlarge'} background={Color.FORM_BG}>
            <Layout.Horizontal padding={{ bottom: 'medium' }} flex={{ justifyContent: 'center' }} width={'100%'}>
              <VisualYamlToggle selectedView={selectedView} onChange={handleModeSwitch} />
            </Layout.Horizontal>
            <Container>
              {selectedView === SelectedView.VISUAL ? (
                <>
                  <Card className={css.nameIdCard}>
                    <NameIdDescriptionTags
                      formikProps={formikProps}
                      identifierProps={{
                        isIdentifierEditable: !infrastructureDefinition
                      }}
                    />
                  </Card>
                  {!infrastructureDefinition && (
                    <SelectDeploymentType
                      viewContext="setup"
                      selectedDeploymentType={selectedDeploymentType}
                      isReadonly={false}
                      handleDeploymentTypeChange={handleDeploymentTypeChange}
                    />
                  )}
                  {(selectedDeploymentType || infrastructureDefinition) && <DeployInfraDefinition />}
                </>
              ) : (
                <YAMLBuilder
                  {...yamlBuilderReadOnlyModeProps}
                  existingJSON={{
                    infrastructureDefinition: {
                      ...formikProps.values,
                      orgIdentifier,
                      projectIdentifier,
                      environmentRef: environmentIdentifier || envIdentifier,
                      type: (pipeline.stages?.[0].stage?.spec as DeploymentStageConfig)?.infrastructure
                        ?.infrastructureDefinition?.type,
                      spec: (pipeline.stages?.[0].stage?.spec as DeploymentStageConfig)?.infrastructure
                        ?.infrastructureDefinition?.spec,
                      allowSimultaneousDeployments: (pipeline.stages?.[0].stage?.spec as DeploymentStageConfig)
                        ?.infrastructure?.allowSimultaneousDeployments
                    } as InfrastructureDefinitionConfig
                  }}
                  schema={environmentSchema?.data}
                  bind={setYamlHandler}
                  showSnippetSection={false}
                />
              )}
            </Container>

            <Layout.Horizontal spacing={'medium'} margin={{ top: 'large' }}>
              <Button
                text={getString('save')}
                variation={ButtonVariation.PRIMARY}
                onClick={() => {
                  if (selectedView === SelectedView.YAML) {
                    const latestYaml = defaultTo(yamlHandler?.getLatestYaml(), /* istanbul ignore next */ '')
                    onSubmit(parse(latestYaml)?.infrastructureDefinition)
                  } else {
                    onSubmit({
                      ...formikProps.values,
                      orgIdentifier,
                      projectIdentifier,
                      environmentRef: environmentIdentifier || envIdentifier
                    } as InfrastructureDefinitionConfig)
                  }
                }}
                disabled={isSavingInfrastructure}
                loading={isSavingInfrastructure}
              />
              <Button
                text={getString('cancel')}
                variation={ButtonVariation.SECONDARY}
                onClick={cleanBeforeClose}
                disabled={isSavingInfrastructure}
              />
            </Layout.Horizontal>
          </Layout.Vertical>
        )
      }}
    </Formik>
  )
}
