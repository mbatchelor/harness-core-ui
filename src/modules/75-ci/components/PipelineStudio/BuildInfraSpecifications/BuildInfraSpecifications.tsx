/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useState } from 'react'
import * as yup from 'yup'
import { v4 as nameSpace, v5 as uuid } from 'uuid'
import {
  Layout,
  Formik,
  FormikForm,
  FormInput,
  Text,
  Card,
  Accordion,
  ThumbnailSelect,
  IconName,
  Container,
  getMultiTypeFromValue,
  Icon,
  MultiTypeInputType
} from '@wings-software/uicore'
import { isEmpty, isUndefined, set, uniqBy, get } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { FontVariation } from '@harness/design-system'
import cx from 'classnames'
import { produce } from 'immer'
import type { FormikProps } from 'formik'
import Volumes, { VolumesInterface, VolumesTypes } from '@pipeline/components/Volumes/Volumes'
import MultiTypeCustomMap from '@common/components/MultiTypeCustomMap/MultiTypeCustomMap'
import MultiTypeMap from '@common/components/MultiTypeMap/MultiTypeMap'
import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { useStrings, UseStringsReturn } from 'framework/strings'
import type { StringsMap } from 'stringTypes'
import { loggerFor } from 'framework/logging/logging'
import { ModuleName } from 'framework/types/ModuleName'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import {
  getStageIndexFromPipeline,
  getFlattenedStages
} from '@pipeline/components/PipelineStudio/StageBuilder/StageBuilderUtil'
import { MultiTypeTextField } from '@common/components/MultiTypeText/MultiTypeText'
import { FormMultiTypeCheckboxField, Separator } from '@common/components'
import type {
  MultiTypeMapType,
  MultiTypeMapUIType,
  MapType,
  MultiTypeListType,
  MultiTypeListUIType
} from '@pipeline/components/PipelineSteps/Steps/StepsTypes'
import { useGitScope } from '@pipeline/utils/CIUtils'
import { MultiTypeList } from '@common/components/MultiTypeList/MultiTypeList'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import type { BuildStageElementConfig } from '@pipeline/utils/pipelineTypes'
import type { K8sDirectInfraYaml, UseFromStageInfraYaml, VmInfraYaml, VmPoolYaml } from 'services/ci'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { k8sLabelRegex, k8sAnnotationRegex } from '@common/utils/StringUtils'
import ErrorsStripBinded from '@pipeline/components/ErrorsStrip/ErrorsStripBinded'
import { BuildTabs } from '../CIPipelineStagesUtils'
import css from './BuildInfraSpecifications.module.scss'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

const logger = loggerFor(ModuleName.CD)
const k8sClusterKeyRef = 'connectors.title.k8sCluster'
const namespaceKeyRef = 'pipelineSteps.build.infraSpecifications.namespace'
const poolIdKeyRef = 'pipeline.buildInfra.poolId'

interface BuildInfraTypeItem {
  label: string
  icon: IconName
  value: K8sDirectInfraYaml['type']
  disabled?: boolean
}

interface KubernetesBuildInfraFormValues {
  connectorRef?: string
  namespace?: string
  serviceAccountName?: string
  runAsUser?: string
  initTimeout?: string
  useFromStage?: string
  annotations?: MultiTypeMapUIType
  labels?: MultiTypeMapUIType
  priorityClassName?: string
  volumes?: VolumesInterface
  automountServiceAccountToken?: boolean
  privileged?: boolean
  allowPrivilegeEscalation?: boolean
  addCapabilities?: MultiTypeListUIType
  dropCapabilities?: MultiTypeListUIType
  runAsNonRoot?: boolean
  readOnlyRootFilesystem?: boolean
  tolerations?: { effect?: string; key?: string; operator?: string; value?: string }[]
  nodeSelector?: MultiTypeMapUIType
}

interface ContainerSecurityContext {
  privileged?: boolean
  allowPrivilegeEscalation?: boolean
  capabilities?: { add?: string[]; drop?: string[] }
  runAsNonRoot?: boolean
  readOnlyRootFilesystem?: boolean
  runAsUser?: number
}
interface AWSVMInfraFormValues {
  poolId?: string
}

type BuildInfraFormValues = (KubernetesBuildInfraFormValues | AWSVMInfraFormValues) & {
  buildInfraType?: K8sDirectInfraYaml['type']
}

enum Modes {
  Propagate,
  NewConfiguration
}

type FieldValueType = yup.Ref | yup.Schema<any> | yup.MixedSchema<any>

const runAsUserStringKey = 'pipeline.stepCommonFields.runAsUser'
const priorityClassNameStringKey = 'pipeline.buildInfra.priorityClassName'

const getInitialMapValues: (value: MultiTypeMapType) => MultiTypeMapUIType = value => {
  const map =
    typeof value === 'string'
      ? value
      : Object.keys(value || {}).map(key => ({
          id: uuid('', nameSpace()),
          key: key,
          value: value[key]
        }))

  return map
}

const getInitialListValues: (value: MultiTypeListType) => MultiTypeListUIType = value =>
  typeof value === 'string'
    ? value
    : value
        ?.filter((path: string) => !!path)
        ?.map((_value: string) => ({
          id: uuid('', nameSpace()),
          value: _value
        })) || []

const validateUniqueList = ({
  value,
  getString,
  uniqueKey,
  stringKey
}: {
  value: string[] | unknown
  getString: UseStringsReturn['getString']
  uniqueKey?: string
  stringKey?: keyof StringsMap
}): any => {
  if (Array.isArray(value)) {
    return yup.array().test('valuesShouldBeUnique', getString(stringKey || 'validation.uniqueValues'), list => {
      if (!list) {
        return true
      }

      return uniqBy(list, uniqueKey || 'value').length === list.length
    })
  } else {
    return yup.string()
  }
}

const getMapValues: (value: MultiTypeMapUIType) => MultiTypeMapType = value => {
  const map: MapType = {}
  if (Array.isArray(value)) {
    value.forEach(mapValue => {
      if (mapValue.key) {
        map[mapValue.key] = mapValue.value
      }
    })
  }

  return typeof value === 'string' ? value : map
}

const testLabelKey = (value: string): boolean => {
  return (
    ['accountid', 'orgid', 'projectid', 'pipelineid', 'pipelineexecutionid', 'stageid', 'buildnumber'].indexOf(
      value.toLowerCase()
    ) === -1
  )
}

const getFieldSchema = (
  value: FieldValueType,
  regex: RegExp,
  getString?: UseStringsReturn['getString']
): Record<string, any> => {
  if (Array.isArray(value)) {
    return yup
      .array()
      .of(
        yup.object().shape(
          {
            key: yup.string().when('value', {
              is: val => val?.length,
              then: yup
                .string()
                .matches(regex, getString?.('validation.validKeyRegex'))
                .required(getString?.('validation.keyRequired'))
            }),
            value: yup.string().when('key', {
              is: val => val?.length,
              then: yup.string().required(getString?.('validation.valueRequired'))
            })
          },
          [['key', 'value']]
        )
      )
      .test('keysShouldBeUnique', getString?.('validation.uniqueKeys') || '', map => {
        if (!map) return true

        return uniqBy(map, 'key').length === map.length
      })
  } else {
    return yup.string()
  }
}

export default function BuildInfraSpecifications({ children }: React.PropsWithChildren<unknown>): JSX.Element {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const gitScope = useGitScope()
  const { CI_VM_INFRASTRUCTURE } = useFeatureFlags()

  const buildInfraTypes: BuildInfraTypeItem[] = [
    {
      label: getString('pipeline.serviceDeploymentTypes.kubernetes'),
      icon: 'service-kubernetes',
      value: 'KubernetesDirect'
    },
    {
      label: getString('ci.buildInfra.awsVMs'),
      icon: 'service-aws',
      value: 'VM'
    }
  ]

  const scrollRef = React.useRef<HTMLDivElement | null>(null)

  const { accountId, projectIdentifier, orgIdentifier } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()

  const {
    state: {
      pipeline,
      selectionState: { selectedStageId }
    },
    allowableTypes,
    isReadonly,
    updateStage,
    getStageFromPipeline
  } = usePipelineContext()

  const { stage } = getStageFromPipeline<BuildStageElementConfig>(selectedStageId || '')

  const [currentMode, setCurrentMode] = React.useState(() =>
    (stage?.stage?.spec?.infrastructure as UseFromStageInfraYaml)?.useFromStage
      ? Modes.Propagate
      : Modes.NewConfiguration
  )

  const { index: stageIndex } = getStageIndexFromPipeline(pipeline, selectedStageId || '')
  const { stages } = getFlattenedStages(pipeline)
  const { stage: propagatedStage } = getStageFromPipeline<BuildStageElementConfig>(
    (stage?.stage?.spec?.infrastructure as UseFromStageInfraYaml)?.useFromStage || ''
  )

  const [buildInfraType, setBuildInfraType] = useState<K8sDirectInfraYaml['type'] | undefined>(
    CI_VM_INFRASTRUCTURE ? undefined : 'KubernetesDirect'
  )

  React.useEffect(() => {
    if (CI_VM_INFRASTRUCTURE) {
      const stageBuildInfraType = (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.type
      const propagatedStageType = (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.type
      currentMode === Modes.NewConfiguration
        ? setBuildInfraType(stageBuildInfraType)
        : setBuildInfraType(propagatedStageType)
    }
  }, [stage, propagatedStage, currentMode])

  /* If a stage A propagates it's infra from another stage B and number of stages in the pipeline change due to deletion of propagated stage B, then infra for stage A needs to be reset */
  React.useEffect(() => {
    const stageData = stage?.stage
    const propagatedStageId = (stageData?.spec?.infrastructure as UseFromStageInfraYaml)?.useFromStage
    if (stageData && propagatedStageId) {
      if (!propagatedStage) {
        set(stageData, 'spec.infrastructure', {
          useFromStage: {}
        })
        setCurrentMode(Modes.NewConfiguration)
      }
    }
  }, [pipeline?.stages?.length])

  const otherBuildStagesWithInfraConfigurationOptions: { label: string; value: string }[] = []

  if (stages && stages.length > 0) {
    stages.forEach((item, index) => {
      if (
        index < stageIndex &&
        item.stage?.type === 'CI' &&
        ((item.stage as BuildStageElementConfig)?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
      ) {
        otherBuildStagesWithInfraConfigurationOptions.push({
          label: `Stage [${item.stage.name}]`,
          value: item.stage.identifier
        })
      }
    })
  }

  const getKubernetesInfraPayload = useMemo((): BuildInfraFormValues => {
    const autoServiceAccountToken = (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
      ?.automountServiceAccountToken
    return {
      namespace: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.namespace,
      serviceAccountName: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.serviceAccountName,
      volumes: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.volumes,
      runAsUser:
        ((stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.containerSecurityContext
          ?.runAsUser as unknown as string) ||
        ((stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.runAsUser as unknown as string), // migrate deprecated runAsUser
      initTimeout: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.initTimeout,
      annotations: getInitialMapValues(
        (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.annotations || {}
      ),
      labels: getInitialMapValues((stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.labels || {}),
      buildInfraType: 'KubernetesDirect',
      priorityClassName: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
        ?.priorityClassName as unknown as string,
      automountServiceAccountToken: typeof autoServiceAccountToken === 'undefined' ? true : autoServiceAccountToken,
      privileged: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.containerSecurityContext
        ?.privileged,
      allowPrivilegeEscalation: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
        ?.containerSecurityContext?.allowPrivilegeEscalation,
      addCapabilities: getInitialListValues(
        (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.containerSecurityContext?.capabilities?.add ||
          []
      ),
      dropCapabilities: getInitialListValues(
        (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.containerSecurityContext?.capabilities
          ?.drop || []
      ),
      runAsNonRoot: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.containerSecurityContext
        ?.runAsNonRoot,
      readOnlyRootFilesystem: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.containerSecurityContext
        ?.readOnlyRootFilesystem,
      tolerations: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.tolerations,
      nodeSelector: getInitialMapValues(
        (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.nodeSelector || {}
      )
    }
  }, [stage])

  const getInitialValues = useMemo((): BuildInfraFormValues => {
    const additionalDefaultFields: { automountServiceAccountToken?: boolean } = {}
    if (
      buildInfraType === 'KubernetesDirect' ||
      (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.type === 'KubernetesDirect'
    ) {
      additionalDefaultFields.automountServiceAccountToken = true
    }
    if (stage?.stage?.spec?.infrastructure) {
      if ((stage?.stage?.spec?.infrastructure as UseFromStageInfraYaml)?.useFromStage) {
        return {
          useFromStage: (stage?.stage?.spec?.infrastructure as UseFromStageInfraYaml)?.useFromStage,
          buildInfraType: undefined
        }
      } else {
        const infraType = (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.type
        if (infraType === 'KubernetesDirect') {
          const connectorId =
            ((stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.connectorRef as string) || ''
          if (!isEmpty(connectorId)) {
            return {
              connectorRef: (stage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.connectorRef,
              ...getKubernetesInfraPayload
            }
          } else {
            return {
              connectorRef: undefined,
              ...getKubernetesInfraPayload
            }
          }
        } else if (infraType === 'VM') {
          const identifier =
            ((stage?.stage?.spec?.infrastructure as VmInfraYaml)?.spec as VmPoolYaml)?.spec?.identifier || ''
          if (!isEmpty(identifier)) {
            return {
              poolId: identifier,
              buildInfraType: 'VM'
            }
          } else {
            return {
              poolId: '',
              buildInfraType: 'VM'
            }
          }
        }
        return {
          connectorRef: undefined,
          namespace: '',
          annotations: '',
          labels: '',
          buildInfraType: undefined,
          poolId: undefined,
          ...additionalDefaultFields
        }
      }
    }

    return {
      connectorRef: undefined,
      namespace: '',
      annotations: '',
      labels: '',
      buildInfraType: undefined,
      poolId: undefined,
      ...additionalDefaultFields
    }
  }, [stage])

  const { subscribeForm, unSubscribeForm } = React.useContext(StageErrorContext)

  const formikRef = React.useRef<FormikProps<unknown> | null>(null)

  React.useEffect(() => {
    subscribeForm({ tab: BuildTabs.INFRASTRUCTURE, form: formikRef })
    return () => unSubscribeForm({ tab: BuildTabs.INFRASTRUCTURE, form: formikRef })
  }, [])

  const handleValidate = (values: any): void => {
    if (stage) {
      const _buildInfraType = values.buildInfraType || buildInfraTypes[0].value
      const errors: { [key: string]: string } = {}
      const stageData = produce(stage, draft => {
        if (currentMode === Modes.Propagate && values.useFromStage) {
          set(draft, 'stage.spec.infrastructure', {
            useFromStage: values.useFromStage
          })
        } else {
          const filteredLabels = getMapValues(
            Array.isArray(values.labels) ? values.labels.filter((val: any) => testLabelKey(val.key)) : values.labels
          )
          const filteredTolerations = Array.isArray(values.tolerations)
            ? values.tolerations.map(
                (val: { effect?: string; key?: string; operator?: string; value?: string; id?: string }) => {
                  const newVal = val
                  delete newVal.id
                  return newVal
                }
              )
            : values.tolerations

          const filteredVolumes = Array.isArray(values.volumes)
            ? values.volumes.filter((volume: VolumesInterface) => volume.mountPath && volume.type)
            : values.volumes

          try {
            getDurationValidationSchema().validateSync(values.initTimeout)
          } catch (e) {
            errors.initTimeout = e.message
          }
          const additionalKubernetesFields: { containerSecurityContext?: ContainerSecurityContext } = {}
          if (_buildInfraType === 'KubernetesDirect') {
            const containerSecurityContext: ContainerSecurityContext = {
              capabilities: {}
            }
            if (typeof values.privileged !== 'undefined') {
              containerSecurityContext.privileged = values.privileged
            }

            if (typeof values.allowPrivilegeEscalation !== 'undefined') {
              containerSecurityContext.allowPrivilegeEscalation = values.allowPrivilegeEscalation
            }

            if (typeof values.runAsNonRoot !== 'undefined') {
              containerSecurityContext.runAsNonRoot = values.runAsNonRoot
            }

            if (typeof values.readOnlyRootFilesystem !== 'undefined') {
              containerSecurityContext.readOnlyRootFilesystem = values.readOnlyRootFilesystem
            }

            if (typeof values.runAsUser !== 'undefined') {
              containerSecurityContext.runAsUser = values.runAsUser
            }

            if (containerSecurityContext?.capabilities && values.addCapabilities && values.addCapabilities.length > 0) {
              containerSecurityContext.capabilities.add =
                typeof values.addCapabilities === 'string'
                  ? values.addCapabilities
                  : values.addCapabilities.map((listValue: { id: string; value: string }) => listValue.value)
            }
            if (
              containerSecurityContext?.capabilities &&
              values.dropCapabilities &&
              values.dropCapabilities.length > 0
            ) {
              containerSecurityContext.capabilities.drop =
                typeof values.dropCapabilities === 'string'
                  ? values.dropCapabilities
                  : values.dropCapabilities.map((listValue: { id: string; value: string }) => listValue.value)
            }
            if (containerSecurityContext.capabilities && isEmpty(containerSecurityContext.capabilities)) {
              delete containerSecurityContext.capabilities
            }
            if (!isEmpty(containerSecurityContext)) {
              additionalKubernetesFields.containerSecurityContext = containerSecurityContext
            }
          }
          set(
            draft,
            'stage.spec.infrastructure',
            _buildInfraType === 'KubernetesDirect'
              ? {
                  type: 'KubernetesDirect',
                  spec: {
                    connectorRef:
                      values?.connectorRef?.value ||
                      values?.connectorRef ||
                      (draft.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.connectorRef,
                    namespace: values.namespace,
                    ...(filteredVolumes?.length ? { volumes: filteredVolumes } : {}),
                    serviceAccountName: values.serviceAccountName,
                    runAsUser: values.runAsUser,
                    initTimeout: errors.initTimeout ? undefined : values.initTimeout,
                    annotations: getMapValues(values.annotations),
                    labels: !isEmpty(filteredLabels) ? filteredLabels : undefined,
                    automountServiceAccountToken: values.automountServiceAccountToken,
                    priorityClassName: values.priorityClassName,
                    ...(filteredTolerations?.length ? { tolerations: filteredTolerations } : {}),
                    nodeSelector: getMapValues(values.nodeSelector),
                    ...additionalKubernetesFields
                  }
                }
              : _buildInfraType === 'VM'
              ? {
                  type: 'VM',
                  spec: {
                    type: 'Pool',
                    spec: {
                      identifier: values.poolId
                    }
                  }
                }
              : { type: undefined, spec: {} }
          )

          if (
            !values.annotations ||
            !values.annotations.length ||
            (values.annotations.length === 1 && !values.annotations[0].key)
          ) {
            delete (draft.stage?.spec?.infrastructure as K8sDirectInfraYaml).spec.annotations
          }

          if (
            values.runAsUser &&
            (draft?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec?.containerSecurityContext?.runAsUser
          ) {
            // move deprecated runAsUser to containerSecurityContext
            delete (draft.stage?.spec?.infrastructure as K8sDirectInfraYaml).spec.runAsUser
          }
        }
      })

      if (stageData.stage) {
        updateStage(stageData.stage)
      }

      return values.labels?.reduce?.((acc: Record<string, string>, curr: any, index: number) => {
        if (!testLabelKey(curr.key)) {
          acc[`labels[${index}].key`] = curr.key + ' is not allowed.'
        }
        return acc
      }, errors)
    }
  }

  const renderTimeOutFields = React.useCallback((): React.ReactElement => {
    return (
      <>
        <Container className={css.bottomMargin7}>
          <FormMultiTypeDurationField
            name="initTimeout"
            multiTypeDurationProps={{ expressions, allowableTypes }}
            label={
              <Text
                font={{ variation: FontVariation.FORM_LABEL }}
                margin={{ bottom: 'xsmall' }}
                tooltipProps={{ dataTooltipId: 'timeout' }}
              >
                {getString('pipeline.infraSpecifications.initTimeout')}
              </Text>
            }
            disabled={isReadonly}
            style={{ width: 300 }}
          />
        </Container>
      </>
    )
  }, [])

  const renderCheckboxFields = React.useCallback(
    ({
      name,
      stringKey,
      tooltipId
    }: {
      name: string
      stringKey: keyof StringsMap
      tooltipId: string
    }): React.ReactElement => {
      return (
        <>
          <Container width={300}>
            <FormMultiTypeCheckboxField
              name={name}
              label={getString(stringKey)}
              multiTypeTextbox={{
                expressions,
                allowableTypes,
                disabled: isReadonly
              }}
              tooltipProps={{ dataTooltipId: tooltipId }}
              disabled={isReadonly}
            />
          </Container>
        </>
      )
    },
    []
  )

  const renderMultiTypeMap = React.useCallback(
    ({ fieldName, stringKey }: { fieldName: string; stringKey: keyof StringsMap }): React.ReactElement => (
      <Container className={cx(css.bottomMargin7, css.formGroup, { [css.md]: CI_VM_INFRASTRUCTURE })}>
        <MultiTypeMap
          appearance={'minimal'}
          cardStyle={{ width: '50%' }}
          name={fieldName}
          valueMultiTextInputProps={{ expressions, allowableTypes }}
          multiTypeFieldSelectorProps={{
            label: (
              <Text font={{ variation: FontVariation.FORM_LABEL }} margin={{ bottom: 'xsmall' }}>
                {getString(stringKey)}
              </Text>
            ),
            disableTypeSelection: true
          }}
          disabled={isReadonly}
        />
      </Container>
    ),
    []
  )

  const renderContainerSecurityContext = React.useCallback(
    ({ formik }: { formik: FormikProps<unknown> }): JSX.Element => {
      return (
        <>
          <Separator topSeparation={0} />
          <div className={css.tabSubHeading} id="containerSecurityContext">
            {getString('pipeline.buildInfra.containerSecurityContext')}
          </div>
          {renderCheckboxFields({
            name: 'privileged',
            stringKey: 'pipeline.buildInfra.privileged',
            tooltipId: 'privileged'
          })}
          {renderCheckboxFields({
            name: 'allowPrivilegeEscalation',
            stringKey: 'pipeline.buildInfra.allowPrivilegeEscalation',
            tooltipId: 'allowPrivilegeEscalation'
          })}
          <Container className={css.bottomMargin7} width={300}>
            <MultiTypeList
              name="addCapabilities"
              multiTextInputProps={{
                expressions,
                allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]
              }}
              formik={formik}
              multiTypeFieldSelectorProps={{
                label: (
                  <Text tooltipProps={{ dataTooltipId: 'addCapabilities' }}>
                    {getString('pipeline.buildInfra.addCapabilities')}
                  </Text>
                ),
                allowedTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME]
              }}
              disabled={isReadonly}
            />
          </Container>
          <Container width={300} className={css.bottomMargin7}>
            <MultiTypeList
              name="dropCapabilities"
              multiTextInputProps={{
                expressions,
                allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]
              }}
              formik={formik}
              multiTypeFieldSelectorProps={{
                label: (
                  <Text tooltipProps={{ dataTooltipId: 'dropCapabilities' }}>
                    {getString('pipeline.buildInfra.dropCapabilities')}
                  </Text>
                ),
                allowedTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION, MultiTypeInputType.RUNTIME]
              }}
              disabled={isReadonly}
            />
          </Container>
          {renderCheckboxFields({
            name: 'runAsNonRoot',
            stringKey: 'pipeline.buildInfra.runAsNonRoot',
            tooltipId: 'runAsNonRoot'
          })}
          {renderCheckboxFields({
            name: 'readOnlyRootFilesystem',
            stringKey: 'pipeline.buildInfra.readOnlyRootFilesystem',
            tooltipId: 'readOnlyRootFilesystem'
          })}
          <Container className={css.bottomMargin7}>
            <MultiTypeTextField
              label={
                <Text
                  font={{ variation: FontVariation.FORM_LABEL }}
                  margin={{ bottom: 'xsmall' }}
                  tooltipProps={{ dataTooltipId: 'runAsUser' }}
                >
                  {getString(runAsUserStringKey)}
                </Text>
              }
              name="runAsUser"
              style={{ width: 300, marginBottom: 'var(--spacing-xsmall)' }}
              multiTextInputProps={{
                multiTextInputProps: { expressions, allowableTypes },
                disabled: isReadonly,
                placeholder: '1000'
              }}
            />
          </Container>
          <Separator topSeparation={0} />
        </>
      )
    },
    []
  )

  const renderKubernetesBuildInfraAdvancedSection = React.useCallback(
    ({ showCardView = false, formik }: { formik: any; showCardView?: boolean }): React.ReactElement => {
      return (
        <Container padding={{ bottom: 'medium' }}>
          <Accordion activeId={''}>
            <Accordion.Panel
              id="advanced"
              addDomId={true}
              summary={
                <div
                  className={css.tabHeading}
                  id="advanced"
                  style={{ paddingLeft: 'var(--spacing-small)', marginBottom: 0 }}
                >
                  {getString('advancedTitle')}
                </div>
              }
              details={
                showCardView ? (
                  <Card disabled={isReadonly} className={css.sectionCard}>
                    {renderAccordianDetailSection({ formik })}
                  </Card>
                ) : (
                  renderAccordianDetailSection({ formik })
                )
              }
            />
          </Accordion>
        </Container>
      )
    },
    []
  )

  const renderPropagateKeyValuePairs = ({
    keyValue,
    stringKey
  }: {
    keyValue: string | string[] | any
    stringKey: keyof StringsMap
  }): JSX.Element | undefined =>
    keyValue && (
      <>
        <Text font={{ variation: FontVariation.FORM_LABEL }} margin={{ bottom: 'xsmall' }}>
          {getString(stringKey)}
        </Text>
        {typeof keyValue === 'string' ? (
          <Text className={css.bottomMargin3} color="black">
            {keyValue}
          </Text>
        ) : (
          <ul className={css.plainList}>
            {Object.entries(keyValue || {})?.map((entry: [string, unknown], idx: number) => (
              <li key={idx}>
                <Text color="black">
                  {entry[0]}:{entry[1]}
                </Text>
              </li>
            ))}
          </ul>
        )}
      </>
    )

  const renderPropagateList = ({
    value,
    stringKey
  }: {
    value: string | string[] | any
    stringKey: keyof StringsMap
  }): JSX.Element | undefined =>
    value && (
      <>
        <Text font={{ variation: FontVariation.FORM_LABEL }} margin={{ bottom: 'xsmall' }}>
          {getString(stringKey)}
        </Text>
        {typeof value === 'string' ? (
          <Text className={css.bottomMargin3} color="black">
            {value}
          </Text>
        ) : (
          <ul className={css.plainList}>
            {value?.map((str: string, idx: number) => (
              <li key={idx}>
                <Text color="black">{str}</Text>
              </li>
            ))}
          </ul>
        )}
      </>
    )

  const renderPropagateDynamicList = ({
    value,
    stringKey
  }: {
    value: string | string[] | any
    stringKey: keyof StringsMap
  }): JSX.Element | undefined =>
    value && (
      <>
        <Text font={{ variation: FontVariation.FORM_LABEL }} margin={{ bottom: 'xsmall' }}>
          {getString(stringKey)}
        </Text>
        {typeof value === 'string' ? (
          <Text margin={{ bottom: 'xsmall' }} color="black">
            {value}
          </Text>
        ) : (
          <ul className={css.plainList}>
            {value.map((row: { [key: string]: string | { spec: { [key: string]: string } } }[], idx: number) => {
              const entries = Object.entries(row)
              return (
                <li key={idx}>
                  <Text color="black" lineClamp={1} width={371}>
                    {entries.map(entry => {
                      if (typeof entry[1] === 'string' && entry[1] !== '') {
                        return `${entry[0]}:${entry[1]} `
                      } else if (entry[0] === 'spec' && typeof entry[1] === 'object') {
                        // special handling for Volumes
                        const nestedEntries = Object.entries(entry[1] || {})
                        return nestedEntries.map(nestedEntry =>
                          typeof entry[1] === 'string' && entry[1] !== '' ? `${nestedEntry[0]}:${nestedEntry[1]} ` : ''
                        )
                      } else {
                        return ''
                      }
                    })}
                  </Text>
                </li>
              )
            })}
          </ul>
        )}
      </>
    )

  const renderBuildInfraMainSection = React.useCallback((): React.ReactElement => {
    return buildInfraType === 'KubernetesDirect' ? (
      renderKubernetesBuildInfraForm()
    ) : buildInfraType === 'VM' ? (
      renderAWSVMBuildInfraForm()
    ) : (
      <></>
    )
  }, [buildInfraType])

  const renderAWSVMBuildInfraForm = React.useCallback((): React.ReactElement => {
    return (
      <MultiTypeTextField
        label={
          <Text
            tooltipProps={{ dataTooltipId: 'poolId' }}
            font={{ variation: FontVariation.FORM_LABEL }}
            margin={{ bottom: 'xsmall' }}
          >
            {getString('pipeline.buildInfra.poolId')}
          </Text>
        }
        name={'poolId'}
        style={{ width: 300 }}
        multiTextInputProps={{
          multiTextInputProps: { expressions, allowableTypes },
          disabled: isReadonly
        }}
      />
    )
  }, [])

  const renderKubernetesBuildInfraForm = React.useCallback((): React.ReactElement => {
    return (
      <>
        <Container className={css.bottomMargin3}>
          <FormMultiTypeConnectorField
            width={300}
            name="connectorRef"
            label={
              <Text font={{ variation: FontVariation.FORM_LABEL }} margin={{ bottom: 'xsmall' }}>
                {getString(k8sClusterKeyRef)}
              </Text>
            }
            placeholder={getString('pipelineSteps.build.infraSpecifications.kubernetesClusterPlaceholder')}
            accountIdentifier={accountId}
            projectIdentifier={projectIdentifier}
            orgIdentifier={orgIdentifier}
            gitScope={gitScope}
            multiTypeProps={{ expressions, disabled: isReadonly, allowableTypes }}
          />
        </Container>
        <div className={cx(css.fieldsGroup, css.withoutSpacing)}>
          <MultiTypeTextField
            label={
              <Text
                tooltipProps={{ dataTooltipId: 'namespace' }}
                font={{ variation: FontVariation.FORM_LABEL }}
                margin={{ bottom: 'xsmall' }}
              >
                {getString(namespaceKeyRef)}
              </Text>
            }
            name={'namespace'}
            style={{ width: 300 }}
            multiTextInputProps={{
              multiTextInputProps: { expressions, allowableTypes },
              disabled: isReadonly,
              placeholder: getString('pipeline.infraSpecifications.namespacePlaceholder')
            }}
          />
        </div>
      </>
    )
  }, [])

  const renderAccordianDetailSection = React.useCallback(({ formik }: { formik: any }): React.ReactElement => {
    const tolerationsValue = get(formik?.values, 'tolerations')
    return (
      <>
        <Container className={css.bottomMargin7}>
          <Volumes
            name="volumes"
            formik={formik}
            expressions={expressions}
            disabled={isReadonly}
            allowableTypes={[MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME]}
          />
        </Container>
        <Container className={css.bottomMargin4}>
          <MultiTypeTextField
            label={
              <Text
                font={{ variation: FontVariation.FORM_LABEL }}
                margin={{ bottom: 'xsmall' }}
                tooltipProps={{ dataTooltipId: 'serviceAccountName' }}
              >
                {getString('pipeline.infraSpecifications.serviceAccountName')}
              </Text>
            }
            name="serviceAccountName"
            style={{ width: 300 }}
            multiTextInputProps={{
              multiTextInputProps: { expressions, allowableTypes },
              disabled: isReadonly,
              placeholder: getString('pipeline.infraSpecifications.serviceAccountNamePlaceholder')
            }}
          />
        </Container>
        <Container width={300}>
          <FormMultiTypeCheckboxField
            name="automountServiceAccountToken"
            label={getString('pipeline.buildInfra.automountServiceAccountToken')}
            multiTypeTextbox={{
              expressions,
              allowableTypes,
              disabled: isReadonly
            }}
            tooltipProps={{ dataTooltipId: 'automountServiceAccountToken' }}
            disabled={isReadonly}
          />
        </Container>
        <Container className={css.bottomMargin7}>
          {renderMultiTypeMap({ fieldName: 'labels', stringKey: 'ci.labels' })}
        </Container>
        <Container className={css.bottomMargin7}>
          {renderMultiTypeMap({ fieldName: 'annotations', stringKey: 'ci.annotations' })}
        </Container>
        {renderContainerSecurityContext({ formik })}
        <Container className={css.bottomMargin7}>
          <MultiTypeTextField
            label={
              <Text
                font={{ variation: FontVariation.FORM_LABEL }}
                margin={{ bottom: 'xsmall' }}
                tooltipProps={{ dataTooltipId: 'priorityClassName' }}
              >
                {getString(priorityClassNameStringKey)}
              </Text>
            }
            name="priorityClassName"
            style={{ width: 300, marginBottom: 'var(--spacing-xsmall)' }}
            multiTextInputProps={{
              multiTextInputProps: { expressions, allowableTypes },
              disabled: isReadonly
            }}
          />
        </Container>
        <Container className={css.bottomMargin7}>
          {renderMultiTypeMap({
            fieldName: 'nodeSelector',
            stringKey: 'pipeline.buildInfra.nodeSelector'
          })}
        </Container>
        <Container className={css.bottomMargin7}>
          <Container
            className={cx(stepCss.formGroup, css.bottomMargin7)}
            {...(typeof tolerationsValue === 'string' &&
              getMultiTypeFromValue(tolerationsValue) === MultiTypeInputType.RUNTIME && { width: 300 })}
          >
            <MultiTypeCustomMap
              name="tolerations"
              appearance={'minimal'}
              cardStyle={{ width: '50%' }}
              valueMultiTextInputProps={{
                expressions,
                allowableTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION]
              }}
              formik={formik}
              multiTypeFieldSelectorProps={{
                label: (
                  <Text
                    font={{ variation: FontVariation.FORM_LABEL }}
                    margin={{ bottom: 'xsmall' }}
                    tooltipProps={{ dataTooltipId: 'tolerations' }}
                  >
                    {getString('pipeline.buildInfra.tolerations')}
                  </Text>
                ),
                allowedTypes: [MultiTypeInputType.FIXED, MultiTypeInputType.EXPRESSION, MultiTypeInputType.RUNTIME]
              }}
              disabled={isReadonly}
              multiTypeMapKeys={[
                { label: 'Effect', value: 'effect' },
                { label: 'Key', value: 'key' },
                { label: 'Operator', value: 'operator' },
                { label: 'Value', value: 'value' }
              ]}
              enableConfigureOptions={false}
            />
          </Container>
        </Container>
        {renderTimeOutFields()}
      </>
    )
  }, [])

  const getValidationSchema = React.useCallback(
    (): yup.Schema<unknown> =>
      buildInfraType === 'KubernetesDirect'
        ? yup.object().shape({
            connectorRef: yup
              .string()
              .nullable()
              .test(
                'connectorRef required only for New configuration',
                getString('fieldRequired', { field: getString(k8sClusterKeyRef) }) || '',
                function (connectorRef) {
                  if (isEmpty(connectorRef) && currentMode === Modes.NewConfiguration) {
                    return false
                  }
                  return true
                }
              ),
            namespace: yup
              .string()
              .nullable()
              .test(
                'namespace required only for New configuration',
                getString('fieldRequired', { field: getString(namespaceKeyRef) }) || '',
                function (namespace) {
                  if (isEmpty(namespace) && currentMode === Modes.NewConfiguration) {
                    return false
                  }
                  return true
                }
              ),
            useFromStage: yup
              .string()
              .nullable()
              .test(
                'useFromStage required only when Propagate from an existing stage',
                getString('pipeline.infraSpecifications.validation.requiredExistingStage') || '',
                function (useFromStage) {
                  if (isEmpty(useFromStage) && currentMode === Modes.Propagate) {
                    return false
                  }
                  return true
                }
              ),
            runAsUser: yup.string().test(
              'Must be a number and allows runtimeinput or expression',
              getString('pipeline.stepCommonFields.validation.mustBeANumber', {
                label: getString(runAsUserStringKey)
              }) || '',
              function (runAsUser) {
                if (isUndefined(runAsUser) || !runAsUser) {
                  return true
                } else if (runAsUser.startsWith('<+')) {
                  return true
                }
                return !isNaN(runAsUser)
              }
            ),
            volumes: yup
              .array()
              .test({
                test: value => !value || uniqBy(value, 'mountPath').length === value.length,
                message: getString('pipeline.ci.validations.mountPathUnique')
              })
              .test({
                test: value => {
                  const pattern = /^\d+(\.\d+)?$|^\d+(\.\d+)?(G|M|Gi|Mi)$|^$/
                  // invalid if size doesn't follow pattern or is an integer without units
                  const isSizeInvalid = value?.some(
                    (volume: VolumesInterface) =>
                      volume?.spec?.size &&
                      (!pattern.test(volume.spec.size) || !isNaN(volume.spec.size as unknown as number))
                  )
                  return !isSizeInvalid
                },
                message: getString('pipeline.ci.validations.invalidSize')
              })
              .test({
                test: value => {
                  const isPathMissing = value?.some(
                    (volume: VolumesInterface) => volume.type === VolumesTypes.HostPath && !volume.spec?.path
                  )
                  return !isPathMissing
                },
                message: getString('pipeline.ci.validations.pathRequiredForHostPath')
              })
              .test({
                test: value => {
                  const isTypeMissing = value?.some((volume: VolumesInterface) => volume.mountPath && !volume.type)
                  return !isTypeMissing
                },
                message: 'Type is required'
              }),
            annotations: yup.lazy(
              (value: FieldValueType) => getFieldSchema(value, k8sAnnotationRegex) as yup.Schema<FieldValueType>
            ),
            labels: yup.lazy(
              (value: FieldValueType) => getFieldSchema(value, k8sLabelRegex) as yup.Schema<FieldValueType>
            ),
            addCapabilities: yup.lazy(value => validateUniqueList({ value, getString })),
            dropCapabilities: yup.lazy(value => validateUniqueList({ value, getString })),
            tolerations: yup.lazy(value =>
              validateUniqueList({ value, getString, uniqueKey: 'key', stringKey: 'pipeline.ci.validations.keyUnique' })
            )
          })
        : buildInfraType === 'VM'
        ? yup.object().shape({
            useFromStage: yup
              .string()
              .nullable()
              .test(
                'useFromStage required only when Propagate from an existing stage',
                getString('pipeline.infraSpecifications.validation.requiredExistingStage') || '',
                function (useFromStage) {
                  if (isEmpty(useFromStage) && currentMode === Modes.Propagate) {
                    return false
                  }
                  return true
                }
              ),
            poolId: yup
              .string()
              .nullable()
              .test(
                'pool id required only for New configuration',
                getString('fieldRequired', { field: getString(poolIdKeyRef) }) || '',
                function (poolId) {
                  if (isEmpty(poolId) && currentMode === Modes.NewConfiguration) {
                    return false
                  }
                  return true
                }
              )
          })
        : yup.object().shape({
            buildInfraType: yup
              .string()
              .nullable()
              .test(
                'buildInfraType required only when Propagate from an existing stage',
                getString('ci.buildInfra.label') || '',
                function (buildInfra) {
                  return !isEmpty(buildInfra)
                }
              )
          }),
    [buildInfraType, currentMode]
  )

  return (
    <div className={css.wrapper}>
      <ErrorsStripBinded domRef={scrollRef as React.MutableRefObject<HTMLElement | undefined>} />
      <div className={css.contentSection} ref={scrollRef}>
        <Formik
          initialValues={getInitialValues}
          validationSchema={getValidationSchema()}
          validate={handleValidate}
          formName="ciBuildInfra"
          onSubmit={values => logger.info(JSON.stringify(values))}
        >
          {formik => {
            const { setFieldValue } = formik
            window.dispatchEvent(new CustomEvent('UPDATE_ERRORS_STRIP', { detail: BuildTabs.INFRASTRUCTURE }))
            formikRef.current = formik as FormikProps<unknown> | null
            return (
              <Layout.Vertical>
                <Text font={{ variation: FontVariation.H5 }} id="infrastructureDefinition">
                  {getString('pipelineSteps.build.infraSpecifications.whereToRun')}
                </Text>
                <FormikForm>
                  <Layout.Horizontal spacing="xxlarge">
                    <Layout.Vertical>
                      {otherBuildStagesWithInfraConfigurationOptions.length ? (
                        <>
                          <Card
                            disabled={isReadonly}
                            className={cx(css.sectionCard)}
                            {...(currentMode === Modes.Propagate && { ['data-testId']: 'propagate-stage-card' })}
                          >
                            <Layout.Horizontal spacing="xxlarge">
                              {/* Propagate section */}
                              <div
                                className={cx(css.card, { [css.active]: currentMode === Modes.Propagate })}
                                onClick={() => {
                                  setCurrentMode(Modes.Propagate)
                                }}
                              >
                                <Text className={css.cardTitle} color="black" margin={{ bottom: 'large' }}>
                                  {getString('pipelineSteps.build.infraSpecifications.propagate')}
                                </Text>
                                <FormInput.Select
                                  name="useFromStage"
                                  items={otherBuildStagesWithInfraConfigurationOptions}
                                  disabled={isReadonly}
                                />
                                {buildInfraType === 'KubernetesDirect' ? (
                                  <>
                                    {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                                      ?.connectorRef && (
                                      <>
                                        <Text
                                          font={{ variation: FontVariation.FORM_LABEL }}
                                          margin={{ bottom: 'xsmall' }}
                                        >
                                          {getString(k8sClusterKeyRef)}
                                        </Text>
                                        <Text color="black" margin={{ bottom: 'medium' }}>
                                          {
                                            (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                                              ?.connectorRef
                                          }
                                        </Text>
                                      </>
                                    )}
                                    {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                                      ?.namespace && (
                                      <>
                                        <Text
                                          font={{ variation: FontVariation.FORM_LABEL }}
                                          margin={{ bottom: 'xsmall' }}
                                          tooltipProps={{ dataTooltipId: 'namespace' }}
                                        >
                                          {getString(namespaceKeyRef)}
                                        </Text>
                                        <Text color="black">
                                          {
                                            (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                                              ?.namespace
                                          }
                                        </Text>
                                      </>
                                    )}

                                    <Accordion activeId={''}>
                                      <Accordion.Panel
                                        id="advanced"
                                        addDomId={true}
                                        summary={
                                          <div
                                            className={css.tabHeading}
                                            id="advanced"
                                            style={{ paddingLeft: 'var(--spacing-small)', marginBottom: 0 }}
                                          >
                                            {getString('advancedTitle')}
                                          </div>
                                        }
                                        details={
                                          <>
                                            {renderPropagateDynamicList({
                                              value: (
                                                propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml
                                              )?.spec?.volumes,
                                              stringKey: 'pipeline.buildInfra.volumes'
                                            })}
                                            {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                                              ?.serviceAccountName && (
                                              <>
                                                <Text
                                                  font={{ variation: FontVariation.FORM_LABEL }}
                                                  margin={{ bottom: 'xsmall' }}
                                                  tooltipProps={{ dataTooltipId: 'serviceAccountName' }}
                                                >
                                                  {getString('pipeline.infraSpecifications.serviceAccountName')}
                                                </Text>
                                                <Text color="black" margin={{ bottom: 'medium' }}>
                                                  {
                                                    (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)
                                                      ?.spec?.serviceAccountName
                                                  }
                                                </Text>
                                              </>
                                            )}
                                            {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                                              ?.runAsUser && (
                                              <>
                                                <Text
                                                  font={{ variation: FontVariation.FORM_LABEL }}
                                                  margin={{ bottom: 'xsmall' }}
                                                  tooltipProps={{ dataTooltipId: 'runAsUser' }}
                                                >
                                                  {getString(runAsUserStringKey)}
                                                </Text>
                                                <Text color="black" margin={{ bottom: 'medium' }}>
                                                  {
                                                    (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)
                                                      ?.spec?.runAsUser
                                                  }
                                                </Text>
                                              </>
                                            )}
                                            {renderPropagateKeyValuePairs({
                                              keyValue: (
                                                propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml
                                              )?.spec?.labels,
                                              stringKey: 'ci.labels'
                                            })}
                                            {renderPropagateKeyValuePairs({
                                              keyValue: (
                                                propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml
                                              )?.spec?.annotations,
                                              stringKey: 'ci.annotations'
                                            })}
                                            {typeof (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)
                                              ?.spec?.automountServiceAccountToken !== 'undefined' && (
                                              <>
                                                <Text
                                                  font={{ variation: FontVariation.FORM_LABEL }}
                                                  margin={{ bottom: 'xsmall' }}
                                                  tooltipProps={{ dataTooltipId: 'timeout' }}
                                                >
                                                  {getString('pipeline.buildInfra.automountServiceAccountToken')}
                                                </Text>
                                                <Text color="black" margin={{ bottom: 'medium' }}>
                                                  {`${
                                                    (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)
                                                      ?.spec?.automountServiceAccountToken
                                                  }`}
                                                </Text>
                                              </>
                                            )}
                                            {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                                              ?.priorityClassName && (
                                              <>
                                                <Text
                                                  font={{ variation: FontVariation.FORM_LABEL }}
                                                  margin={{ bottom: 'xsmall' }}
                                                  tooltipProps={{ dataTooltipId: 'timeout' }}
                                                >
                                                  {getString(priorityClassNameStringKey)}
                                                </Text>
                                                <Text color="black" margin={{ bottom: 'medium' }}>
                                                  {
                                                    (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)
                                                      ?.spec?.priorityClassName
                                                  }
                                                </Text>
                                              </>
                                            )}
                                            <div className={css.tabSubHeading} id="containerSecurityContext">
                                              {getString('pipeline.buildInfra.containerSecurityContext')}
                                            </div>
                                            {typeof (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)
                                              ?.spec?.containerSecurityContext?.privileged !== 'undefined' && (
                                              <>
                                                <Text
                                                  font={{ variation: FontVariation.FORM_LABEL }}
                                                  margin={{ bottom: 'xsmall' }}
                                                  tooltipProps={{ dataTooltipId: 'timeout' }}
                                                >
                                                  {getString('pipeline.buildInfra.privileged')}
                                                </Text>
                                                <Text color="black" margin={{ bottom: 'medium' }}>
                                                  {`${
                                                    (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)
                                                      ?.spec?.containerSecurityContext?.privileged
                                                  }`}
                                                </Text>
                                              </>
                                            )}
                                            {typeof (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)
                                              ?.spec?.containerSecurityContext?.allowPrivilegeEscalation !==
                                              'undefined' && (
                                              <>
                                                <Text
                                                  font={{ variation: FontVariation.FORM_LABEL }}
                                                  margin={{ bottom: 'xsmall' }}
                                                  tooltipProps={{ dataTooltipId: 'timeout' }}
                                                >
                                                  {getString('pipeline.buildInfra.allowPrivilegeEscalation')}
                                                </Text>
                                                <Text color="black" margin={{ bottom: 'medium' }}>
                                                  {`${
                                                    (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)
                                                      ?.spec?.containerSecurityContext?.allowPrivilegeEscalation
                                                  }`}
                                                </Text>
                                              </>
                                            )}
                                            {renderPropagateList({
                                              value: (
                                                propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml
                                              )?.spec?.containerSecurityContext?.capabilities?.add,
                                              stringKey: 'pipeline.buildInfra.addCapabilities'
                                            })}
                                            {renderPropagateList({
                                              value: (
                                                propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml
                                              )?.spec?.containerSecurityContext?.capabilities?.drop,
                                              stringKey: 'pipeline.buildInfra.dropCapabilities'
                                            })}
                                            {typeof (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)
                                              ?.spec?.containerSecurityContext?.runAsNonRoot !== 'undefined' && (
                                              <>
                                                <Text
                                                  font={{ variation: FontVariation.FORM_LABEL }}
                                                  margin={{ bottom: 'xsmall' }}
                                                  tooltipProps={{ dataTooltipId: 'timeout' }}
                                                >
                                                  {getString('pipeline.buildInfra.runAsNonRoot')}
                                                </Text>
                                                <Text color="black" margin={{ bottom: 'medium' }}>
                                                  {`${
                                                    (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)
                                                      ?.spec?.containerSecurityContext?.runAsNonRoot
                                                  }`}
                                                </Text>
                                              </>
                                            )}
                                            {typeof (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)
                                              ?.spec?.containerSecurityContext?.readOnlyRootFilesystem !==
                                              'undefined' && (
                                              <>
                                                <Text
                                                  font={{ variation: FontVariation.FORM_LABEL }}
                                                  margin={{ bottom: 'xsmall' }}
                                                  tooltipProps={{ dataTooltipId: 'timeout' }}
                                                >
                                                  {getString('pipeline.buildInfra.readOnlyRootFilesystem')}
                                                </Text>
                                                <Text color="black" margin={{ bottom: 'medium' }}>
                                                  {`${
                                                    (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)
                                                      ?.spec?.containerSecurityContext?.readOnlyRootFilesystem
                                                  }`}
                                                </Text>
                                              </>
                                            )}
                                            {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                                              ?.containerSecurityContext?.runAsUser && (
                                              <>
                                                <Text
                                                  font={{ variation: FontVariation.FORM_LABEL }}
                                                  margin={{ bottom: 'xsmall' }}
                                                  tooltipProps={{ dataTooltipId: 'timeout' }}
                                                >
                                                  {getString(runAsUserStringKey)}
                                                </Text>
                                                <Text color="black" margin={{ bottom: 'medium' }}>
                                                  {`${
                                                    (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)
                                                      ?.spec?.containerSecurityContext?.runAsUser
                                                  }`}
                                                </Text>
                                              </>
                                            )}
                                            {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                                              ?.priorityClassName && (
                                              <>
                                                <Text
                                                  font={{ variation: FontVariation.FORM_LABEL }}
                                                  margin={{ bottom: 'xsmall' }}
                                                  tooltipProps={{ dataTooltipId: 'timeout' }}
                                                >
                                                  {getString(priorityClassNameStringKey)}
                                                </Text>
                                                <Text color="black" margin={{ bottom: 'medium' }}>
                                                  {
                                                    (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)
                                                      ?.spec?.priorityClassName
                                                  }
                                                </Text>
                                              </>
                                            )}
                                            {renderPropagateKeyValuePairs({
                                              keyValue: (
                                                propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml
                                              )?.spec?.nodeSelector,
                                              stringKey: 'pipeline.buildInfra.nodeSelector'
                                            })}
                                            {renderPropagateDynamicList({
                                              value: (
                                                propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml
                                              )?.spec?.tolerations,
                                              stringKey: 'pipeline.buildInfra.tolerations'
                                            })}
                                            {(propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)?.spec
                                              ?.initTimeout && (
                                              <>
                                                <Text
                                                  font={{ variation: FontVariation.FORM_LABEL }}
                                                  margin={{ bottom: 'xsmall' }}
                                                  tooltipProps={{ dataTooltipId: 'timeout' }}
                                                >
                                                  {getString('pipeline.infraSpecifications.initTimeout')}
                                                </Text>
                                                <Text color="black" margin={{ bottom: 'medium' }}>
                                                  {
                                                    (propagatedStage?.stage?.spec?.infrastructure as K8sDirectInfraYaml)
                                                      ?.spec?.initTimeout
                                                  }
                                                </Text>
                                              </>
                                            )}
                                          </>
                                        }
                                      />
                                    </Accordion>
                                  </>
                                ) : buildInfraType === 'VM' &&
                                  ((propagatedStage?.stage?.spec?.infrastructure as VmInfraYaml)?.spec as VmPoolYaml)
                                    ?.spec?.identifier ? (
                                  <>
                                    <Text font={{ variation: FontVariation.FORM_LABEL }} margin={{ bottom: 'xsmall' }}>
                                      {getString(poolIdKeyRef)}
                                    </Text>
                                    <Text color="black" margin={{ bottom: 'medium' }}>
                                      {
                                        (
                                          (propagatedStage?.stage?.spec?.infrastructure as VmInfraYaml)
                                            ?.spec as VmPoolYaml
                                        )?.spec?.identifier
                                      }
                                    </Text>
                                  </>
                                ) : null}
                              </div>
                              {/* New configuration section */}
                              <div
                                className={cx(css.card, { [css.active]: currentMode === Modes.NewConfiguration })}
                                onClick={() => {
                                  if (currentMode === Modes.Propagate) {
                                    const newStageData = produce(stage, draft => {
                                      if (draft) {
                                        set(
                                          draft,
                                          'stage.spec.infrastructure',
                                          buildInfraType === 'KubernetesDirect'
                                            ? {
                                                type: 'KubernetesDirect',
                                                spec: {
                                                  connectorRef: '',
                                                  namespace: '',
                                                  annotations: {},
                                                  labels: {},
                                                  nodeSelector: {}
                                                }
                                              }
                                            : buildInfraType === 'VM'
                                            ? {
                                                type: 'VM',
                                                spec: {
                                                  identifier: ''
                                                }
                                              }
                                            : { type: undefined, spec: {} }
                                        )
                                      }
                                    })
                                    formik.setValues({
                                      ...formik.values,
                                      buildInfraType: buildInfraType,
                                      useFromStage: ''
                                    })
                                    if (newStageData?.stage) {
                                      updateStage(newStageData.stage)
                                    }
                                  }
                                  setCurrentMode(Modes.NewConfiguration)
                                }}
                              >
                                <>
                                  {CI_VM_INFRASTRUCTURE ? (
                                    <>
                                      <Text className={css.cardTitle} color="black" margin={{ bottom: 'large' }}>
                                        {getString('ci.buildInfra.useNewInfra')}
                                      </Text>
                                      <ThumbnailSelect
                                        name={'buildInfraType'}
                                        items={buildInfraTypes}
                                        isReadonly={isReadonly}
                                        onChange={val => {
                                          const infraType = val as K8sDirectInfraYaml['type']
                                          setFieldValue('buildInfraType', infraType)
                                          setBuildInfraType(val as K8sDirectInfraYaml['type'])
                                        }}
                                      />
                                    </>
                                  ) : (
                                    <Text className={css.cardTitle} color="black" margin={{ bottom: 'large' }}>
                                      {getString('pipelineSteps.build.infraSpecifications.newConfiguration')}
                                    </Text>
                                  )}
                                  {CI_VM_INFRASTRUCTURE ? null : (
                                    <>
                                      {renderKubernetesBuildInfraForm()}
                                      {renderKubernetesBuildInfraAdvancedSection({ formik })}
                                    </>
                                  )}
                                </>
                              </div>
                            </Layout.Horizontal>
                            {CI_VM_INFRASTRUCTURE && currentMode === Modes.NewConfiguration ? (
                              <>
                                {buildInfraType ? <Separator topSeparation={30} /> : null}
                                {renderBuildInfraMainSection()}
                              </>
                            ) : null}
                          </Card>
                          {CI_VM_INFRASTRUCTURE &&
                          currentMode === Modes.NewConfiguration &&
                          buildInfraType === 'KubernetesDirect'
                            ? renderKubernetesBuildInfraAdvancedSection({ showCardView: true, formik })
                            : null}
                        </>
                      ) : (
                        <>
                          <Card disabled={isReadonly} className={cx(css.sectionCard)}>
                            <Layout.Vertical spacing="small">
                              {CI_VM_INFRASTRUCTURE ? (
                                <>
                                  <Text font={{ variation: FontVariation.FORM_HELP }} padding={{ bottom: 'medium' }}>
                                    {getString('ci.buildInfra.selectInfra')}
                                  </Text>
                                  <ThumbnailSelect
                                    name={'buildInfraType'}
                                    items={buildInfraTypes}
                                    isReadonly={isReadonly}
                                    onChange={val => {
                                      const infraType = val as K8sDirectInfraYaml['type']
                                      setBuildInfraType(val as K8sDirectInfraYaml['type'])
                                      formik.setValues({
                                        ...formik.values,
                                        buildInfraType: infraType,
                                        automountServiceAccountToken:
                                          infraType === 'KubernetesDirect' ? true : undefined
                                      })
                                    }}
                                  />
                                </>
                              ) : null}
                              {CI_VM_INFRASTRUCTURE ? (
                                <>
                                  {buildInfraType ? <Separator topSeparation={10} /> : null}
                                  {renderBuildInfraMainSection()}
                                </>
                              ) : (
                                renderKubernetesBuildInfraForm()
                              )}
                            </Layout.Vertical>
                          </Card>
                          {buildInfraType === 'KubernetesDirect'
                            ? renderKubernetesBuildInfraAdvancedSection({ showCardView: true, formik })
                            : null}
                        </>
                      )}
                    </Layout.Vertical>
                    {CI_VM_INFRASTRUCTURE ? (
                      <Container className={css.helptext} margin={{ top: 'medium' }} padding="large">
                        <Layout.Horizontal spacing="xsmall" flex={{ justifyContent: 'start' }}>
                          <Icon name="info-messaging" size={20} />
                          <Text font={{ variation: FontVariation.H5 }}>
                            {getString('ci.buildInfra.infrastructureTypesLabel')}
                          </Text>
                        </Layout.Horizontal>
                        <>
                          <Text font={{ variation: FontVariation.BODY2 }} padding={{ top: 'xlarge', bottom: 'xsmall' }}>
                            {getString('ci.buildInfra.k8sLabel')}
                          </Text>
                          <Text font={{ variation: FontVariation.SMALL }}>
                            {getString('ci.buildInfra.kubernetesHelpText')}
                          </Text>
                        </>
                        <Separator />
                        <>
                          <Text font={{ variation: FontVariation.BODY2 }} padding={{ bottom: 'xsmall' }}>
                            {getString('ci.buildInfra.vmLabel')}
                          </Text>
                          <Text font={{ variation: FontVariation.SMALL }}>
                            {getString('ci.buildInfra.awsHelpText')}
                          </Text>
                        </>
                        {/* <Container padding={{ top: 'medium' }}>
                          <Link to="/">{getString('learnMore')}</Link>
                        </Container> */}
                      </Container>
                    ) : null}
                  </Layout.Horizontal>
                </FormikForm>
              </Layout.Vertical>
            )
          }}
        </Formik>
        {children}
      </div>
    </div>
  )
}
