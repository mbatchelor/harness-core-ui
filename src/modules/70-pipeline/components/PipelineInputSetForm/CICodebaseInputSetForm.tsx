/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react'
import { useParams } from 'react-router-dom'
import { get, isEmpty, isUndefined, set } from 'lodash-es'
import {
  FormInput,
  MultiTypeInputType,
  Container,
  Layout,
  Text,
  Radio,
  Icon,
  TextInput,
  RUNTIME_INPUT_VALUE,
  SelectOption
} from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { connect } from 'formik'
import { StringKeys, useStrings, UseStringsReturn } from 'framework/strings'
import { getIdentifierFromValue, getScopeFromValue } from '@common/components/EntityReference/EntityReference'
import { Scope } from '@common/interfaces/SecretsInterface'
import { Connectors } from '@connectors/constants'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { ConnectorInfoDTO, PipelineInfoConfig, useGetConnector } from 'services/cd-ng'
import { ConnectorRefWidthKeys, getPrCloneStrategyOptions, sslVerifyOptions } from '@pipeline/utils/constants'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { MultiTypeTextField } from '@common/components/MultiTypeText/MultiTypeText'
import { MultiTypeSelectField } from '@common/components/MultiTypeSelect/MultiTypeSelect'
import type { GitQueryParams } from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'
import { CodebaseTypes, getConnectorRefWidth, isRuntimeInput } from '@pipeline/utils/CIUtils'
import { StepViewType } from '../AbstractSteps/Step'
import css from './CICodebaseInputSetForm.module.scss'
export interface CICodebaseInputSetFormProps {
  path: string
  readonly?: boolean
  formik?: any
  template?: PipelineInfoConfig
  originalPipeline: PipelineInfoConfig
  viewType: StepViewType
  viewTypeMetadata?: Record<string, boolean>
}

type CodeBaseType = 'branch' | 'tag' | 'PR'

export enum ConnectionType {
  Repo = 'Repo',
  Account = 'Account',
  Region = 'Region' // awscodecommit
}

const inputNames = {
  branch: 'branch',
  tag: 'tag',
  PR: 'number'
}

const defaultValues = {
  branch: '<+trigger.branch>',
  tag: '<+trigger.tag>',
  PR: '<+trigger.prNumber>'
}

const placeholderValues = {
  branch: defaultValues['branch'],
  tag: defaultValues['tag'],
  PR: defaultValues['PR']
}

export interface ConnectorRefInterface {
  record?: { spec?: { type?: string; url?: string; connectionType?: string } }
}

const renderLabel = ({
  getString,
  tooltip,
  keyString
}: {
  getString: UseStringsReturn['getString']
  tooltip?: string
  keyString: StringKeys
}): JSX.Element => (
  <Layout.Horizontal className={css.inpLabel} style={{ display: 'flex', alignItems: 'baseline' }}>
    <Text
      color={Color.GREY_600}
      font={{ size: 'small', weight: 'semi-bold' }}
      tooltipProps={{ dataTooltipId: tooltip }}
    >
      {getString(keyString)}
    </Text>
    &nbsp;
  </Layout.Horizontal>
)

export const handleCIConnectorRefOnChange = ({
  value,
  connectorRefType,
  setConnectionType,
  setConnectorUrl,
  setFieldValue,
  setIsConnectorExpression,
  codeBaseInputFieldFormName
}: {
  value: ConnectorRefInterface | undefined
  connectorRefType: MultiTypeInputType
  setConnectionType: Dispatch<SetStateAction<string>>
  setConnectorUrl: Dispatch<SetStateAction<string>>
  setFieldValue: (field: string, value: unknown) => void
  setIsConnectorExpression?: Dispatch<SetStateAction<boolean>> // used in inputset form
  codeBaseInputFieldFormName?: { [key: string]: string } // only used when setting nested values in input set
}): void => {
  const newConnectorRef = value as ConnectorRefInterface
  if (connectorRefType === MultiTypeInputType.FIXED) {
    const connectionType = newConnectorRef?.record?.spec?.type
    if (connectionType === ConnectionType.Account) {
      setConnectionType(ConnectionType.Account)
      setConnectorUrl(newConnectorRef.record?.spec?.url || '')
      setFieldValue(codeBaseInputFieldFormName?.repoName || 'repoName', '')
    } else if (connectionType === ConnectionType.Repo || connectionType === ConnectionType.Region) {
      setConnectionType(connectionType)
      setConnectorUrl(newConnectorRef.record?.spec?.url || '')
      //  clear repoName from yaml so it is not required
      setFieldValue(codeBaseInputFieldFormName?.repoName || 'repoName', undefined)
    } else {
      setConnectionType('')
      setConnectorUrl('')
      setFieldValue(codeBaseInputFieldFormName?.repoName || 'repoName', '')
    }
    setIsConnectorExpression?.(false)
  } else if (connectorRefType === MultiTypeInputType.EXPRESSION) {
    setConnectionType('')
    setConnectorUrl('')
    setIsConnectorExpression?.(true)
  } else {
    setConnectionType('')
    setConnectorUrl('')
    setIsConnectorExpression?.(false)

    setFieldValue(
      codeBaseInputFieldFormName?.repoName || 'repoName',
      connectorRefType === MultiTypeInputType.RUNTIME ? RUNTIME_INPUT_VALUE : ''
    )
  }
}
const getViewType = ({
  viewType,
  viewTypeMetadata
}: {
  viewType: StepViewType
  viewTypeMetadata?: Record<string, boolean>
}): StepViewType | string => {
  if (viewTypeMetadata?.isTemplateBuilder) {
    return ConnectorRefWidthKeys.TemplateBuilder
  } else if (viewTypeMetadata?.isTemplateDetailDrawer) {
    return ConnectorRefWidthKeys.TemplateDetailDrawer
  } else if (viewTypeMetadata?.isTrigger) {
    return ConnectorRefWidthKeys.Trigger
  } else if (viewType === StepViewType.DeploymentForm) {
    return ConnectorRefWidthKeys.DefaultView // override current DeploymentForm width
  }
  return viewType
}
function CICodebaseInputSetFormInternal({
  path,
  readonly,
  formik,
  template,
  originalPipeline,
  viewType,
  viewTypeMetadata
}: CICodebaseInputSetFormProps): JSX.Element {
  const { triggerIdentifier, accountId, projectIdentifier, orgIdentifier } = useParams<Record<string, string>>()
  const [isInputTouched, setIsInputTouched] = useState(false)
  const [connectorType, setConnectorType] = useState<ConnectorInfoDTO['type']>()
  const [connectorId, setConnectorId] = useState<string>('')
  const [connectorRef, setConnectorRef] = useState<string>('')
  const connectorWidth = getConnectorRefWidth(getViewType({ viewType, viewTypeMetadata }))
  const [connectionType, setConnectionType] = React.useState('')
  const [connectorUrl, setConnectorUrl] = React.useState('')
  const templateInputsProperties = (template?.template?.templateInputs as any)?.properties
  const isConnectorRuntimeInput = (template?.properties || templateInputsProperties)?.ci?.codebase?.connectorRef
  const isDepthRuntimeInput = (template?.properties || templateInputsProperties)?.ci?.codebase?.depth
  const isSslVerifyRuntimeInput = (template?.properties || templateInputsProperties)?.ci?.codebase?.sslVerify
  const isPrCloneStrategyRuntimeInput = (template?.properties || templateInputsProperties)?.ci?.codebase
    ?.prCloneStrategy
  const isRepoNameRuntimeInput = (template?.properties || templateInputsProperties)?.ci?.codebase?.repoName
  const isCpuLimitRuntimeInput = (template?.properties || templateInputsProperties)?.ci?.codebase?.resources?.limits
    ?.cpu
  const isMemoryLimitRuntimeInput = (template?.properties || templateInputsProperties)?.ci?.codebase?.resources?.limits
    ?.memory
  const isDeploymentForm = viewType === StepViewType.DeploymentForm
  const showSetContainerResources = isCpuLimitRuntimeInput || isMemoryLimitRuntimeInput
  const [isConnectorExpression, setIsConnectorExpression] = useState<boolean>(false)
  const containerWidth = viewTypeMetadata?.isTemplateDetailDrawer ? '100%' : '50%' // drawer view is much smaller 50% would cut out
  const showBuildAsDisabledTextField = viewTypeMetadata?.isTemplateBuilder || viewTypeMetadata?.isTemplateDetailDrawer // should disable when template is applied to pipeline
  const savedValues = useRef<Record<string, string>>({
    branch: '',
    tag: '',
    PR: ''
  })
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()

  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const formattedPath = isEmpty(path) ? '' : `${path}.`
  const buildPath = `${formattedPath}properties.ci.codebase.build`
  const buildSpecPath = `${formattedPath}properties.ci.codebase.build.spec`
  const codeBaseTypePath = `${formattedPath}properties.ci.codebase.build.type`
  const prCloneStrategyOptions = getPrCloneStrategyOptions(getString)
  const [codeBaseType, setCodeBaseType] = useState<CodeBaseType>(get(formik?.values, codeBaseTypePath))

  const radioLabels = {
    branch: getString('gitBranch'),
    tag: getString('gitTag'),
    PR: getString('pipeline.gitPullRequest')
  }
  const codebaseTypeError = get(formik?.errors, codeBaseTypePath)

  const inputLabels = {
    branch: getString('common.branchName'),
    tag: getString('common.tagName'),
    PR: getString('pipeline.ciCodebase.pullRequestNumber')
  }

  const codeBaseInputFieldFormName = {
    branch: `${formattedPath}properties.ci.codebase.build.spec.branch`,
    tag: `${formattedPath}properties.ci.codebase.build.spec.tag`,
    PR: `${formattedPath}properties.ci.codebase.build.spec.number`,
    connectorRef: `${formattedPath}properties.ci.codebase.connectorRef`,
    repoName: `${formattedPath}properties.ci.codebase.repoName`,
    depth: `${formattedPath}properties.ci.codebase.depth`,
    sslVerify: `${formattedPath}properties.ci.codebase.sslVerify`,
    prCloneStrategy: `${formattedPath}properties.ci.codebase.prCloneStrategy`,
    memoryLimit: `${formattedPath}properties.ci.codebase.resources.limits.memory`,
    cpuLimit: `${formattedPath}properties.ci.codebase.resources.limits.cpu`
  }

  const codeBaseInputDefaultValue = {
    depth: 50,
    sslVerify: true,
    prCloneStrategy: prCloneStrategyOptions?.[0]?.value,
    memoryLimit: '500Mi',
    cpuLimit: '400m',
    build: { spec: {} }
  }

  const {
    data: connectorDetails,
    loading: loadingConnectorDetails,
    refetch: getConnectorDetails
  } = useGetConnector({
    identifier: connectorId,
    lazy: true
  })

  useEffect(() => {
    if (connectorId) {
      const connectorScope = getScopeFromValue(connectorRef)
      getConnectorDetails({
        pathParams: {
          identifier: connectorId
        },
        queryParams: {
          accountIdentifier: accountId,
          orgIdentifier: connectorScope === Scope.ORG || connectorScope === Scope.PROJECT ? orgIdentifier : undefined,
          projectIdentifier: connectorScope === Scope.PROJECT ? projectIdentifier : undefined
        }
      })
    }
  }, [connectorId])

  useEffect(() => {
    if (!loadingConnectorDetails && !isUndefined(connectorDetails)) {
      setConnectorType(get(connectorDetails, 'data.connector.type', '') as ConnectorInfoDTO['type'])
    }

    if (connectorDetails?.data?.connector) {
      setConnectionType(
        connectorDetails?.data?.connector?.type === Connectors.GIT
          ? connectorDetails?.data?.connector.spec.connectionType
          : connectorDetails?.data?.connector.spec.type
      )
      setConnectorUrl(connectorDetails?.data?.connector.spec.url)
      if (
        connectorDetails?.data?.connector?.spec?.type === ConnectionType.Repo ||
        connectorDetails?.data?.connector?.spec?.type === ConnectionType.Region
      ) {
        formik.setFieldValue(codeBaseInputFieldFormName.repoName, undefined)
      }
    }
  }, [loadingConnectorDetails, connectorDetails])

  useEffect(() => {
    const type = get(formik?.values, codeBaseTypePath) as CodeBaseType
    if (type) {
      setCodeBaseType(type)
    }
    const typeOfConnector = get(formik?.values, 'connectorRef.connector.type', '') as ConnectorInfoDTO['type']
    if (typeOfConnector) {
      setConnectorType(typeOfConnector)
    } else {
      let ctrRef = get(originalPipeline, 'properties.ci.codebase.connectorRef') as string
      if (isConnectorExpression) {
        return
      }
      if (isRuntimeInput(ctrRef)) {
        ctrRef = get(formik?.values, codeBaseInputFieldFormName.connectorRef, '')
      }

      setConnectorRef(ctrRef)
      setConnectorId(getIdentifierFromValue(ctrRef))
    }
  }, [formik?.values])

  useEffect(() => {
    if (
      (viewType === StepViewType.InputSet && formik?.values?.pipeline?.identifier) ||
      (viewType === StepViewType.DeploymentForm && formik?.values?.identifier)
    ) {
      const newInitialValues = { ...formik.values }
      // TriggerForm does not instantiate each runtime input with empty string yet but we want default values there
      const codeBaseSpecPathValue = get(newInitialValues, buildSpecPath)
      if (!codeBaseSpecPathValue && isDeploymentForm) {
        // only deployment form as it instantiates build with ''
        set(newInitialValues, buildPath, codeBaseInputDefaultValue.build)
      }
      if (isDepthRuntimeInput && !get(newInitialValues, codeBaseInputFieldFormName.depth)) {
        set(newInitialValues, codeBaseInputFieldFormName.depth, codeBaseInputDefaultValue.depth)
      }
      if (isSslVerifyRuntimeInput && typeof get(newInitialValues, codeBaseInputFieldFormName.sslVerify) !== 'boolean') {
        set(newInitialValues, codeBaseInputFieldFormName.sslVerify, codeBaseInputDefaultValue.sslVerify)
      }
      if (isPrCloneStrategyRuntimeInput && !get(newInitialValues, codeBaseInputFieldFormName.prCloneStrategy)) {
        set(newInitialValues, codeBaseInputFieldFormName.prCloneStrategy, codeBaseInputDefaultValue.prCloneStrategy)
      }
      if (isMemoryLimitRuntimeInput && !get(newInitialValues, codeBaseInputFieldFormName.memoryLimit)) {
        set(newInitialValues, codeBaseInputFieldFormName.memoryLimit, codeBaseInputDefaultValue.memoryLimit)
      }
      if (isCpuLimitRuntimeInput && !get(newInitialValues, codeBaseInputFieldFormName.cpuLimit)) {
        set(newInitialValues, codeBaseInputFieldFormName.cpuLimit, codeBaseInputDefaultValue.cpuLimit)
      }
      formik?.setValues(newInitialValues)
    }
  }, [formik?.values?.pipeline?.identifier, formik?.values?.identifier])

  useEffect(() => {
    // OnEdit Case, persists saved ciCodebase build spec
    if (codeBaseType) {
      savedValues.current = Object.assign(savedValues.current, {
        [codeBaseType]: get(
          formik?.values,
          `${formattedPath}properties.ci.codebase.build.spec.${inputNames[codeBaseType]}`,
          ''
        )
      })
      formik?.setFieldValue(buildSpecPath, { [inputNames[codeBaseType]]: savedValues.current[codeBaseType] })
    }
  }, [codeBaseType])

  const handleTypeChange = (newType: CodeBaseType): void => {
    formik?.setFieldValue(`${formattedPath}properties.ci.codebase.build`, '')
    formik?.setFieldValue(codeBaseTypePath, newType)

    if (!isInputTouched && triggerIdentifier) {
      formik?.setFieldValue(buildSpecPath, { [inputNames[newType]]: defaultValues[newType] })
    } else {
      formik?.setFieldValue(buildSpecPath, { [inputNames[newType]]: savedValues.current[newType] })
    }
  }
  const renderCodeBaseTypeInput = (type: CodeBaseType): JSX.Element => {
    return (
      <Container>
        <FormInput.MultiTextInput
          label={<Text font={{ variation: FontVariation.FORM_LABEL }}>{inputLabels[type]}</Text>}
          name={codeBaseInputFieldFormName[type]}
          multiTextInputProps={{
            expressions,
            allowableTypes: [MultiTypeInputType.EXPRESSION, MultiTypeInputType.FIXED]
          }}
          placeholder={triggerIdentifier ? placeholderValues[type] : ''}
          disabled={readonly}
          onChange={() => setIsInputTouched(true)}
        />
      </Container>
    )
  }
  return (
    <Layout.Vertical spacing="small">
      {loadingConnectorDetails ? (
        <Container flex={{ justifyContent: 'center' }}>
          <Icon name="steps-spinner" size={25} />
        </Container>
      ) : (
        <>
          {isConnectorRuntimeInput && (
            <Container width={containerWidth}>
              <FormMultiTypeConnectorField
                name={codeBaseInputFieldFormName.connectorRef}
                width={connectorWidth}
                error={formik?.errors?.connectorRef}
                type={[
                  Connectors.GIT,
                  Connectors.GITHUB,
                  Connectors.GITLAB,
                  Connectors.BITBUCKET,
                  Connectors.AWS_CODECOMMIT
                ]}
                label={<Text font={{ variation: FontVariation.FORM_LABEL }}>{getString('connector')}</Text>}
                placeholder={loadingConnectorDetails ? getString('loading') : getString('connectors.selectConnector')}
                accountIdentifier={accountId}
                projectIdentifier={projectIdentifier}
                orgIdentifier={orgIdentifier}
                gitScope={{ repo: repoIdentifier || '', branch, getDefaultFromOtherRepo: true }}
                setRefValue={true}
                multiTypeProps={{
                  expressions,
                  disabled: readonly,
                  allowableTypes: [MultiTypeInputType.FIXED]
                }}
                onChange={(value, _valueType, connectorRefType) =>
                  handleCIConnectorRefOnChange({
                    value: value as ConnectorRefInterface,
                    connectorRefType,
                    setConnectionType,
                    setConnectorUrl,
                    setFieldValue: formik?.setFieldValue as (field: string, value: any) => void,
                    codeBaseInputFieldFormName,
                    setIsConnectorExpression
                  })
                }
              />
            </Container>
          )}
          {isRepoNameRuntimeInput &&
            (!isRuntimeInput(formik?.values.connectorRef) && connectionType === ConnectionType.Repo ? (
              <Container width={containerWidth}>
                <Text
                  font={{ variation: FontVariation.FORM_LABEL }}
                  margin={{ bottom: 'xsmall' }}
                  tooltipProps={{ dataTooltipId: 'rightBarForm_repoName' }}
                >
                  {getString('common.repositoryName')}
                </Text>
                <TextInput
                  name={codeBaseInputFieldFormName.repoName}
                  value={connectorUrl}
                  style={{ flexGrow: 1 }}
                  disabled
                />
              </Container>
            ) : (
              <>
                <Container width={containerWidth}>
                  <MultiTypeTextField
                    label={
                      <Text
                        className={css.inpLabel}
                        font={{ variation: FontVariation.FORM_LABEL }}
                        tooltipProps={{ dataTooltipId: 'rightBarForm_repoName' }}
                      >
                        {getString('common.repositoryName')}
                      </Text>
                    }
                    name={codeBaseInputFieldFormName.repoName}
                    multiTextInputProps={{
                      multiTextInputProps: {
                        expressions,
                        allowableTypes: [MultiTypeInputType.FIXED]
                      },
                      disabled: readonly
                    }}
                  />
                </Container>
                {!isRuntimeInput(formik?.values.connectorRef) &&
                !isRuntimeInput(formik?.values.repoName) &&
                connectorUrl?.length > 0 ? (
                  <div className={css.predefinedValue}>
                    <Text lineClamp={1} width={connectorWidth ? connectorWidth : '460px'}>
                      {(connectorUrl[connectorUrl.length - 1] === '/' ? connectorUrl : connectorUrl + '/') +
                        get(formik?.values, codeBaseInputFieldFormName.repoName, '')}
                    </Text>
                  </div>
                ) : null}
              </>
            ))}
          {(!isConnectorRuntimeInput ||
            (isConnectorRuntimeInput && get(formik?.values, codeBaseInputFieldFormName.connectorRef))) && (
            <>
              <Text
                color={Color.GREY_600}
                font={{ size: 'small', weight: 'semi-bold' }}
                tooltipProps={{ dataTooltipId: 'ciCodebaseBuildType' }}
              >
                {getString('filters.executions.buildType')}
              </Text>
              {showBuildAsDisabledTextField ? (
                <Container
                  width={viewTypeMetadata?.isTemplateBuilder ? '361px' : containerWidth}
                  className={css.bottomMargin3}
                >
                  <FormInput.MultiTextInput
                    name={buildPath}
                    label=""
                    // value="<+input>"
                    multiTextInputProps={{
                      expressions,
                      allowableTypes: [MultiTypeInputType.FIXED]
                    }}
                    disabled={true}
                    style={{ marginBottom: 0, flexGrow: 1 }}
                  />
                </Container>
              ) : (
                <Layout.Horizontal
                  flex={{ justifyContent: 'start' }}
                  padding={{ top: 'small', left: 'xsmall', bottom: 'xsmall' }}
                  margin={{ left: 'large' }}
                >
                  <Radio
                    label={radioLabels['branch']}
                    width={110}
                    onClick={() => handleTypeChange('branch')}
                    checked={codeBaseType === CodebaseTypes.branch}
                    disabled={readonly}
                    font={{ variation: FontVariation.FORM_LABEL }}
                    key="branch-radio-option"
                  />
                  <Radio
                    label={radioLabels['tag']}
                    width={90}
                    margin={{ left: 'huge' }}
                    onClick={() => handleTypeChange('tag')}
                    checked={codeBaseType === CodebaseTypes.tag}
                    disabled={readonly}
                    font={{ variation: FontVariation.FORM_LABEL }}
                    key="tag-radio-option"
                  />
                  {connectorType !== 'Codecommit' ? (
                    <Radio
                      label={radioLabels['PR']}
                      width={110}
                      margin={{ left: 'huge' }}
                      onClick={() => handleTypeChange('PR')}
                      checked={codeBaseType === CodebaseTypes.PR}
                      disabled={readonly}
                      font={{ variation: FontVariation.FORM_LABEL }}
                      key="pr-radio-option"
                    />
                  ) : null}
                </Layout.Horizontal>
              )}
              {codebaseTypeError && (formik.submitCount > 0 || viewTypeMetadata?.isTrigger) && (
                <Text color={Color.RED_600}>{codebaseTypeError}</Text>
              )}
              <Container width={containerWidth}>
                {codeBaseType === CodebaseTypes.branch ? renderCodeBaseTypeInput('branch') : null}
                {codeBaseType === CodebaseTypes.tag ? renderCodeBaseTypeInput('tag') : null}
                {codeBaseType === CodebaseTypes.PR ? renderCodeBaseTypeInput('PR') : null}
              </Container>
            </>
          )}
          {(isDepthRuntimeInput ||
            isSslVerifyRuntimeInput ||
            isPrCloneStrategyRuntimeInput ||
            showSetContainerResources) && (
            <Text
              color={Color.GREY_600}
              font={{ size: 'small', weight: 'semi-bold' }}
              tooltipProps={{ dataTooltipId: 'advanced' }}
            >
              {getString('advancedTitle')}
            </Text>
          )}
          {isDepthRuntimeInput && (
            <Container width={containerWidth} className={css.bottomMargin3}>
              <MultiTypeTextField
                label={
                  <Layout.Horizontal className={css.inpLabel} style={{ display: 'flex', alignItems: 'baseline' }}>
                    <Text font={{ variation: FontVariation.FORM_LABEL }} tooltipProps={{ dataTooltipId: 'depth' }}>
                      {getString('pipeline.depth')}
                    </Text>
                    &nbsp;
                  </Layout.Horizontal>
                }
                name={codeBaseInputFieldFormName.depth}
                multiTextInputProps={{
                  multiTextInputProps: {
                    expressions,
                    allowableTypes: [MultiTypeInputType.FIXED],
                    textProps: { type: 'number' }
                  },
                  disabled: readonly
                }}
              />
            </Container>
          )}
          {isSslVerifyRuntimeInput && (
            <Container width={containerWidth} className={css.bottomMargin3}>
              <MultiTypeSelectField
                name={codeBaseInputFieldFormName.sslVerify}
                label={renderLabel({
                  getString,
                  tooltip: 'sslVerify',
                  keyString: 'pipeline.sslVerify'
                })}
                multiTypeInputProps={{
                  selectItems: sslVerifyOptions as unknown as SelectOption[],
                  placeholder: getString('select'),
                  multiTypeInputProps: {
                    expressions,
                    selectProps: {
                      addClearBtn: true,
                      items: sslVerifyOptions as unknown as SelectOption[]
                    },
                    allowableTypes: [MultiTypeInputType.FIXED]
                  },
                  disabled: readonly
                }}
                useValue
                disabled={readonly}
              />
            </Container>
          )}
          {isPrCloneStrategyRuntimeInput && (
            <Container width={containerWidth} className={css.bottomMargin3}>
              <MultiTypeSelectField
                name={codeBaseInputFieldFormName.prCloneStrategy}
                label={renderLabel({
                  getString,
                  tooltip: 'prCloneStrategy',
                  keyString: 'pipeline.ciCodebase.prCloneStrategy'
                })}
                multiTypeInputProps={{
                  selectItems: prCloneStrategyOptions,
                  placeholder: getString('select'),
                  multiTypeInputProps: {
                    expressions,
                    selectProps: { addClearBtn: true, items: prCloneStrategyOptions },
                    allowableTypes: [MultiTypeInputType.FIXED]
                  },
                  disabled: readonly
                }}
                useValue
                disabled={readonly}
              />
            </Container>
          )}
          {showSetContainerResources && (
            <Layout.Vertical width={containerWidth} className={css.bottomMargin3} spacing="medium">
              <Text
                color={Color.GREY_600}
                font={{ size: 'small', weight: 'semi-bold' }}
                tooltipProps={{ dataTooltipId: 'setContainerResources' }}
              >
                {getString('pipelineSteps.setContainerResources')}
              </Text>
              <Layout.Horizontal spacing="small">
                {isMemoryLimitRuntimeInput && (
                  <MultiTypeTextField
                    name={codeBaseInputFieldFormName.memoryLimit}
                    label={
                      <Layout.Horizontal style={{ display: 'flex', alignItems: 'baseline' }}>
                        <Text
                          className={css.inpLabel}
                          color={Color.GREY_600}
                          font={{ size: 'small', weight: 'semi-bold' }}
                          tooltipProps={{ dataTooltipId: 'limitMemory' }}
                        >
                          {getString('pipelineSteps.limitMemoryLabel')}
                        </Text>
                        &nbsp;
                      </Layout.Horizontal>
                    }
                    multiTextInputProps={{
                      multiTextInputProps: {
                        expressions,
                        allowableTypes: [MultiTypeInputType.FIXED]
                      },
                      disabled: readonly
                    }}
                    configureOptionsProps={{ variableName: 'spec.limit.memory' }}
                    style={{ flexGrow: 1, flexBasis: '50%' }}
                  />
                )}

                {isCpuLimitRuntimeInput && (
                  <MultiTypeTextField
                    name={codeBaseInputFieldFormName.cpuLimit}
                    label={
                      <Layout.Horizontal style={{ display: 'flex', alignItems: 'baseline' }}>
                        <Text
                          className={css.inpLabel}
                          color={Color.GREY_600}
                          font={{ size: 'small', weight: 'semi-bold' }}
                          tooltipProps={{ dataTooltipId: 'limitCPULabel' }}
                        >
                          {getString('pipelineSteps.limitCPULabel')}
                        </Text>
                        &nbsp;
                      </Layout.Horizontal>
                    }
                    multiTextInputProps={{
                      multiTextInputProps: {
                        expressions,
                        allowableTypes: [MultiTypeInputType.FIXED]
                      },
                      disabled: readonly
                    }}
                    configureOptionsProps={{ variableName: 'spec.limit.cpu' }}
                    style={{ flexGrow: 1, flexBasis: '50%' }}
                  />
                )}
              </Layout.Horizontal>
            </Layout.Vertical>
          )}
        </>
      )}
    </Layout.Vertical>
  )
}

export const CICodebaseInputSetForm = connect(CICodebaseInputSetFormInternal)
