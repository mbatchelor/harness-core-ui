/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import cx from 'classnames'
import * as Yup from 'yup'
import { FieldArray } from 'formik'
import {
  Accordion,
  Formik,
  FormInput,
  getMultiTypeFromValue,
  MultiTypeInputType,
  Color,
  Layout,
  Label,
  Text,
  MultiSelectOption,
  SelectOption,
  Button,
  Icon,
  useToaster
} from '@harness/uicore'
import { map, get, isEmpty } from 'lodash-es'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { IdentifierSchemaWithOutName, NameSchema, ConnectorRefSchema } from '@common/utils/Validation'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { setFormikRef, StepFormikFowardRef } from '@pipeline/components/AbstractSteps/Step'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { useListAwsRegions } from 'services/portal'
import { useCFCapabilitiesForAws, useCFStatesForAws, useGetIamRolesForAws } from 'services/cd-ng'
import { Connectors } from '@connectors/constants'
import { useQueryParams } from '@common/hooks'
import { TFMonaco } from '../../Common/Terraform/Editview/TFMonacoEditor'
import CFRemoteWizard from './RemoteFilesForm/CFRemoteWizard'
import { InlineParameterFile } from './InlineParameterFile'
import { Tags } from './TagsInput/Tags'
import type { Parameter, CloudFormationCreateStackProps } from '../CloudFormationInterfaces.types'
import { onDragStart, onDragEnd, onDragLeave, onDragOver, onDrop } from '../DragHelper'

import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from '../CloudFormation.module.scss'

enum TemplateTypes {
  Remote = 'Remote',
  S3URL = 'S3URL',
  Inline = 'Inline'
}

export const CreateStack = (
  { allowableTypes, isNewStep, readonly = false, initialValues, onUpdate, onChange }: CloudFormationCreateStackProps,
  formikRef: StepFormikFowardRef
): JSX.Element => {
  const { getString } = useStrings()
  const { getRBACErrorMessage } = useRBACError()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { expressions } = useVariablesExpression()
  const [showModal, setShowModal] = useState(false)
  const [showInlineParams, setInlineParams] = useState(false)
  const [paramIndex, setParamIndex] = useState<number | undefined>()
  const [regions, setRegions] = useState<MultiSelectOption[]>([])
  const [capabilities, setCapabilities] = useState<SelectOption[]>([])
  const [awsStates, setAwsStates] = useState<SelectOption[]>([])
  const [awsRoles, setAwsRoles] = useState<MultiSelectOption[]>([])
  const [awsRef, setAwsRef] = useState<string>(initialValues?.spec?.configuration?.connectorRef)
  const { showError } = useToaster()
  const templateFile = getString('cd.cloudFormation.templateFile')
  const {
    data: regionData,
    loading: regionLoading,
    error: regionError
  } = useListAwsRegions({
    queryParams: {
      accountId
    }
  })
  const query = useQueryParams()
  const sectionId = (query as any).sectionId || ''

  useEffect(() => {
    if (regionData && !regions.length) {
      const regionValues = map(regionData.resource, reg => ({ label: reg.name, value: reg.value }))
      setRegions(regionValues as MultiSelectOption[])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionData])

  const { data: capabilitiesData, loading: capabilitiesLoading, error: capabilitiesError } = useCFCapabilitiesForAws({})

  useEffect(() => {
    if (capabilitiesData && !capabilities.length) {
      const capabilitiesValues = map(capabilitiesData.data, cap => ({ label: cap, value: cap }))
      setCapabilities(capabilitiesValues as SelectOption[])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [capabilitiesData])

  const { data: awsStatesData, loading: statesLoading, error: statesError } = useCFStatesForAws({})

  useEffect(() => {
    if (awsStatesData && !awsStates.length) {
      const awsStatesValues = map(awsStatesData.data, cap => ({ label: cap, value: cap }))
      setAwsStates(awsStatesValues as SelectOption[])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [awsStatesData])

  const queryParams = useMemo(() => {
    return {
      accountIdentifier: accountId,
      orgIdentifier: orgIdentifier,
      projectIdentifier: projectIdentifier,
      awsConnectorRef: awsRef
    }
  }, [accountId, orgIdentifier, projectIdentifier, awsRef])

  const {
    data: roleData,
    refetch,
    loading: rolesLoading,
    error: rolesError
  } = useGetIamRolesForAws({
    lazy: true,
    debounce: 500,
    queryParams
  })

  useEffect(() => {
    if (regionError) {
      showError(getRBACErrorMessage(regionError as any))
    }
    if (capabilitiesError) {
      showError(getRBACErrorMessage(capabilitiesError))
    }
    if (statesError) {
      showError(getRBACErrorMessage(statesError))
    }
    if (rolesError) {
      showError(getRBACErrorMessage(rolesError))
    }
    /*  eslint-disable-next-line react-hooks/exhaustive-deps  */
  }, [regionError, capabilitiesError, statesError, rolesError])

  /* istanbul ignore next */
  useEffect(() => {
    if (roleData) {
      const roles = []
      for (const key in roleData.data) {
        roles.push({ label: roleData?.data[key], value: key })
      }
      setAwsRoles(roles)
    }
    if (!roleData && !isEmpty(awsRef) && getMultiTypeFromValue(awsRef) === MultiTypeInputType.FIXED) {
      refetch()
    }
  }, [roleData, awsRef])

  /* istanbul ignore next */
  const onSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    setFieldValue: (field: string, value: any) => void
  ): void => {
    const fieldName = 'spec.configuration.templateFile'
    if (e.target.value === TemplateTypes.Inline) {
      setFieldValue(fieldName, {
        type: TemplateTypes.Inline,
        spec: {
          templateBody: ''
        }
      })
    } else if (e.target.value === TemplateTypes.Remote) {
      setFieldValue(fieldName, {
        type: TemplateTypes.Remote,
        spec: {
          store: {
            spec: {
              connectorRef: undefined
            }
          }
        }
      })
    } else {
      setFieldValue(fieldName, {
        type: TemplateTypes.S3URL,
        spec: {
          templateUrl: ''
        }
      })
    }
  }

  return (
    <Formik
      enableReinitialize={true}
      initialValues={initialValues}
      formName={`cloudFormationCreateStack-${sectionId}`}
      validate={values => {
        const payload = {
          ...values
        }
        /* istanbul ignore next */
        onChange?.(payload)
      }}
      validateOnChange={false}
      validateOnBlur={false}
      onSubmit={values => {
        const payload = {
          ...values
        }
        /* istanbul ignore next */
        onUpdate?.(payload)
      }}
      validationSchema={Yup.object().shape({
        name: NameSchema({ requiredErrorMsg: getString('pipelineSteps.stepNameRequired') }),
        timeout: getDurationValidationSchema({ minimum: '10s' }).required(getString('validation.timeout10SecMinimum')),
        spec: Yup.object().shape({
          provisionerIdentifier: Yup.lazy((value): Yup.Schema<unknown> => {
            /* istanbul ignore next */
            if (getMultiTypeFromValue(value as string) === MultiTypeInputType.FIXED) {
              return IdentifierSchemaWithOutName(getString, {
                requiredErrorMsg: getString('common.validation.provisionerIdentifierIsRequired'),
                regexErrorMsg: getString('common.validation.provisionerIdentifierPatternIsNotValid')
              })
            }
            /* istanbul ignore next */
            return Yup.string().required(getString('common.validation.provisionerIdentifierIsRequired'))
          }),
          configuration: Yup.object().shape({
            connectorRef: ConnectorRefSchema(),
            region: Yup.string().required(getString('cd.cloudFormation.errors.region')),
            stackName: Yup.string().required(getString('cd.cloudFormation.errors.stackName')),
            templateFile: Yup.object().shape({
              type: Yup.string(),
              spec: Yup.object()
                .when('type', {
                  is: value => value === TemplateTypes.Inline,
                  then: Yup.object().shape({
                    templateBody: Yup.string().required(getString('cd.cloudFormation.errors.templateBody'))
                  })
                })
                .when('type', {
                  is: value => value === TemplateTypes.S3URL,
                  then: Yup.object().shape({
                    templateUrl: Yup.string().required(getString('cd.cloudFormation.errors.awsURL'))
                  })
                })
                .when('type', {
                  is: value => value === TemplateTypes.Remote,
                  then: Yup.object().shape({
                    store: Yup.object({
                      spec: Yup.object().shape({
                        connectorRef: Yup.string().required(getString('cd.cloudFormation.errors.templateRequired'))
                      })
                    })
                  })
                })
            })
          })
        })
      })}
    >
      {formik => {
        setFormikRef(formikRef, formik)
        const { values, setFieldValue, errors } = formik
        const config = values.spec.configuration
        const awsConnector = config?.connectorRef
        const templateFileType = config?.templateFile?.type
        const inlineTemplateFile = config?.templateFile?.spec?.templateBody
        const remoteTemplateFile = config?.templateFile?.spec?.store?.spec
        const templateUrl = config?.templateFile?.spec?.templateUrl
        const remoteParameterFiles = config?.parameters || []
        const awsRegion = config?.region
        const parameterOverrides = config?.parameterOverrides || []
        const templateError = get(errors, 'spec.configuration.templateFile.spec.store.spec.connectorRef')
        return (
          <>
            <div className={cx(stepCss.formGroup, stepCss.lg)}>
              <FormInput.InputWithIdentifier
                inputLabel={getString('name')}
                isIdentifierEditable={isNewStep}
                inputGroupProps={{
                  disabled: readonly
                }}
              />
            </div>
            <div className={cx(stepCss.formGroup, stepCss.sm)}>
              <FormMultiTypeDurationField
                name="timeout"
                label={getString('pipelineSteps.timeoutLabel')}
                multiTypeDurationProps={{ enableConfigureOptions: false, expressions, allowableTypes }}
                disabled={readonly}
              />
            </div>
            <div className={css.divider} />
            <div className={stepCss.formGroup}>
              <FormInput.MultiTextInput
                name="spec.provisionerIdentifier"
                label={getString('pipelineSteps.provisionerIdentifier')}
                multiTextInputProps={{ expressions, allowableTypes }}
                disabled={readonly}
                className={css.inputWidth}
              />
              {
                /* istanbul ignore next */
                getMultiTypeFromValue(values.spec?.provisionerIdentifier) === MultiTypeInputType.RUNTIME && (
                  <ConfigureOptions
                    value={values.spec?.provisionerIdentifier as string}
                    type="String"
                    variableName="spec.provisionerIdentifier"
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    /* istanbul ignore next */
                    onChange={value => {
                      setFieldValue('spec.provisionerIdentifier', value)
                    }}
                    isReadonly={readonly}
                    className={css.inputWidth}
                  />
                )
              }
            </div>
            <div className={stepCss.formGroup}>
              <FormMultiTypeConnectorField
                label={<Text color={Color.GREY_900}>{getString('pipelineSteps.awsConnectorLabel')}</Text>}
                type={Connectors.AWS}
                name="spec.configuration.connectorRef"
                placeholder={getString('select')}
                accountIdentifier={accountId}
                projectIdentifier={projectIdentifier}
                orgIdentifier={orgIdentifier}
                style={{ marginBottom: 10 }}
                multiTypeProps={{ expressions, allowableTypes }}
                disabled={readonly}
                width={300}
                setRefValue
                onChange={(value: any, _unused, _multiType) => {
                  const scope = value?.scope
                  let newConnectorRef: string
                  if (scope === 'org' || scope === 'account') {
                    newConnectorRef = `${scope}.${value?.record?.identifier}`
                  } else if (getMultiTypeFromValue(value) === MultiTypeInputType.RUNTIME) {
                    newConnectorRef = value
                  } else {
                    newConnectorRef = value?.record?.identifier
                  }
                  /* istanbul ignore next */
                  if (value?.record?.identifier !== awsRef) {
                    setAwsRef(newConnectorRef)
                  }
                  /* istanbul ignore next */
                  setFieldValue('spec.configuration.connectorRef', newConnectorRef)
                }}
              />
            </div>
            <Layout.Vertical className={css.addMarginBottom}>
              <Layout.Horizontal className={stepCss.formGroup}>
                <FormInput.MultiTypeInput
                  label={getString('regionLabel')}
                  name="spec.configuration.region"
                  disabled={readonly}
                  useValue
                  multiTypeInputProps={{
                    selectProps: {
                      allowCreatingNewItems: false,
                      items: regions
                    },
                    expressions,
                    allowableTypes,
                    width: 300
                  }}
                  selectItems={regions}
                  placeholder={regionLoading ? getString('loading') : getString('select')}
                />
              </Layout.Horizontal>
            </Layout.Vertical>
            <div className={css.divider} />
            <Layout.Horizontal flex={{ alignItems: 'flex-start' }}>
              {(templateFileType === TemplateTypes.Remote || templateFileType === TemplateTypes.S3URL) && (
                <Layout.Vertical>
                  <Label
                    data-tooltip-id={'cloudFormationTemplate'}
                    style={{ color: Color.GREY_900 }}
                    className={css.configLabel}
                  >
                    {templateFile}
                  </Label>
                </Layout.Vertical>
              )}
              <div className={css.templateSelect}>
                <select
                  className={css.templateDropdown}
                  name="spec.configuration.templateFile.type"
                  disabled={readonly}
                  value={templateFileType}
                  onChange={e => {
                    /* istanbul ignore next */
                    onSelectChange(e, setFieldValue)
                  }}
                  data-testid="templateOptions"
                >
                  <option value={TemplateTypes.Remote}>{getString('remote')}</option>
                  <option value={TemplateTypes.Inline}>{getString('inline')}</option>
                  <option value={TemplateTypes.S3URL}>{getString('cd.cloudFormation.awsURL')}</option>
                </select>
              </div>
            </Layout.Horizontal>
            {templateFileType === TemplateTypes.Remote && (
              <div
                className={cx(css.configFile, css.configField, css.addMarginTop, css.addMarginBottom)}
                onClick={() => {
                  /* istanbul ignore next */
                  setShowModal(true)
                }}
                data-testid="remoteTemplate"
              >
                <>
                  <a className={css.configPlaceHolder}>
                    {
                      /* istanbul ignore next */
                      getMultiTypeFromValue(remoteTemplateFile?.paths) === MultiTypeInputType.RUNTIME
                        ? `/${remoteTemplateFile?.paths}`
                        : remoteTemplateFile?.paths?.[0]
                        ? remoteTemplateFile?.paths?.[0]
                        : getString('cd.cloudFormation.specifyTemplateFile')
                    }
                  </a>
                  <Button
                    minimal
                    icon="Edit"
                    withoutBoxShadow
                    iconProps={{ size: 16 }}
                    data-name="config-edit"
                    withoutCurrentColor={true}
                  />
                </>
              </div>
            )}
            {templateFileType === TemplateTypes.Inline && (
              <>
                <MultiTypeFieldSelector
                  name="spec.configuration.templateFile.spec.templateBody"
                  label={
                    <Text data-tooltip-id={'cloudFormationTemplate'} style={{ color: 'rgb(11, 11, 13)' }}>
                      {templateFile}
                    </Text>
                  }
                  defaultValueToReset=""
                  allowedTypes={allowableTypes}
                  skipRenderValueInExpressionLabel
                  disabled={readonly}
                  expressionRender={() => {
                    /* istanbul ignore next */
                    return (
                      <TFMonaco
                        name="spec.configuration.templateFile.spec.templateBody"
                        formik={formik}
                        title={templateFile}
                        expressions={expressions}
                      />
                    )
                  }}
                >
                  <TFMonaco
                    name="spec.configuration.templateFile.spec.templateBody"
                    formik={formik}
                    title={templateFile}
                    expressions={expressions}
                  />
                </MultiTypeFieldSelector>
                {
                  /* istanbul ignore next */
                  getMultiTypeFromValue(inlineTemplateFile) === MultiTypeInputType.RUNTIME && (
                    <ConfigureOptions
                      value={inlineTemplateFile}
                      type="String"
                      variableName="spec.configuration.templateFile.spec.templateBody"
                      showRequiredField={false}
                      showDefaultField={false}
                      showAdvanced={true}
                      onChange={value => {
                        setFieldValue('spec.configuration.templateFile.spec.templateBody', value)
                      }}
                      isReadonly={readonly}
                    />
                  )
                }
              </>
            )}
            {templateFileType === TemplateTypes.S3URL && (
              <FormInput.Text
                name={'spec.configuration.templateFile.spec.templateUrl'}
                label={''}
                placeholder="http://www.test.com"
                className={css.addMarginTop}
              />
            )}
            {templateFileType === TemplateTypes.Remote && templateError && (
              <Text
                icon="circle-cross"
                iconProps={{ size: 12 }}
                className={cx(css.formikError, css.addMarginTop, css.addMarginBottom)}
                intent="danger"
              >
                {templateError}
              </Text>
            )}
            <div className={cx(stepCss.formGroup, stepCss.md)}>
              <FormInput.MultiTextInput
                name="spec.configuration.stackName"
                label={getString('cd.cloudFormation.stackName')}
                multiTextInputProps={{ expressions, allowableTypes }}
                disabled={readonly}
                className={css.inputWidth}
              />
              {
                /* istanbul ignore next */
                getMultiTypeFromValue(values.spec?.stackName) === MultiTypeInputType.RUNTIME && (
                  <ConfigureOptions
                    value={values?.spec?.stackName}
                    type="String"
                    variableName="spec.configuration.stackName"
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    onChange={value => {
                      setFieldValue('spec.configuration.stackName', value)
                    }}
                    isReadonly={readonly}
                    className={css.inputWidth}
                  />
                )
              }
            </div>
            <Accordion className={stepCss.accordion}>
              <Accordion.Panel
                id="cloudformationOptionalConfig"
                summary={getString('common.optionalConfig')}
                details={
                  <div className={css.optionalDetails}>
                    <Layout.Vertical>
                      <Label
                        data-tooltip-id={'cloudFormationParameterFiles'}
                        style={{ color: Color.GREY_900 }}
                        className={css.configLabel}
                      >
                        {getString('optionalField', { name: getString('cd.cloudFormation.parameterFiles') })}
                      </Label>
                      {remoteParameterFiles && (
                        <FieldArray
                          name={'spec.configuration.parameters'}
                          render={arrayHelpers => (
                            <>
                              {map(remoteParameterFiles, (param: Parameter, index: number) => (
                                <Layout.Horizontal
                                  key={`${param}-${index}`}
                                  flex={{ distribution: 'space-between' }}
                                  style={{ alignItems: 'end' }}
                                >
                                  <Layout.Horizontal
                                    spacing="medium"
                                    style={{ alignItems: 'baseline' }}
                                    className={css.formContainer}
                                    key={`${param}-${index}`}
                                    draggable={true}
                                    onDragEnd={onDragEnd}
                                    onDragOver={onDragOver}
                                    onDragLeave={onDragLeave}
                                    onDragStart={event => {
                                      /* istanbul ignore next */
                                      onDragStart(event, index)
                                    }}
                                    onDrop={event => {
                                      /* istanbul ignore next */
                                      onDrop(event, arrayHelpers, index)
                                    }}
                                  >
                                    <Icon name="drag-handle-vertical" className={css.drag} />
                                    <Text width={12}>{`${index + 1}.`}</Text>
                                    <div className={css.configField}>
                                      <Text font="normal" lineClamp={1} width={200}>
                                        {param?.identifier}
                                      </Text>
                                      <Button
                                        minimal
                                        icon="Edit"
                                        withoutBoxShadow
                                        iconProps={{ size: 16 }}
                                        onClick={() => {
                                          /* istanbul ignore next */
                                          setParamIndex(index)
                                          /* istanbul ignore next */
                                          setShowModal(true)
                                        }}
                                        data-name="config-edit"
                                        withoutCurrentColor={true}
                                      />
                                    </div>
                                    <Button
                                      minimal
                                      icon="main-trash"
                                      data-testid={`remove-param-${index}`}
                                      onClick={() => arrayHelpers.remove(index)}
                                    />
                                  </Layout.Horizontal>
                                </Layout.Horizontal>
                              ))}
                            </>
                          )}
                        />
                      )}
                      <Layout.Horizontal className={cx(css.configFile, css.addMarginBottom, stepCss.topPadding3)}>
                        <a
                          data-testid="remoteParamFiles"
                          className={css.configPlaceHolder}
                          data-name="config-edit"
                          onClick={() => {
                            setParamIndex(remoteParameterFiles.length)
                            setShowModal(true)
                          }}
                        >
                          + {getString('add')}
                        </a>
                      </Layout.Horizontal>
                    </Layout.Vertical>
                    <Layout.Vertical className={css.addMarginBottom}>
                      <Label
                        data-tooltip-id={'cloudFormationParameterOverrides'}
                        style={{ color: Color.GREY_900 }}
                        className={css.configLabel}
                      >
                        {getString('optionalField', { name: getString('cd.cloudFormation.inlineParameterFiles') })}
                      </Label>
                      <div className={cx(css.configFile, css.addMarginBottom)}>
                        <div className={css.configField}>
                          <a
                            data-testid="inlineParamFiles"
                            className={cx(css.configPlaceHolder, css.truncate)}
                            data-name="config-edit"
                            onClick={() => setInlineParams(true)}
                          >
                            {parameterOverrides?.length
                              ? `${JSON.stringify(parameterOverrides)}`
                              : getString('cd.cloudFormation.specifyInlineParameterFiles')}
                          </a>
                        </div>
                      </div>
                    </Layout.Vertical>
                    <Layout.Vertical>
                      <FormInput.MultiTypeInput
                        label={getString('optionalField', { name: getString('connectors.awsKms.roleArnLabel') })}
                        name="spec.configuration.roleArn"
                        placeholder={getString(rolesLoading ? 'common.loading' : 'select')}
                        disabled={readonly}
                        useValue
                        multiTypeInputProps={{
                          selectProps: {
                            addClearBtn: true,
                            allowCreatingNewItems: false,
                            items: awsRoles
                          },
                          expressions,
                          allowableTypes,
                          width: 300
                        }}
                        selectItems={awsRoles}
                        style={{ color: 'rgb(11, 11, 13)' }}
                      />
                    </Layout.Vertical>
                    <MultiTypeFieldSelector
                      name="spec.configuration.capabilities"
                      label={
                        <Text style={{ color: 'rgb(11, 11, 13)' }}>
                          {getString('optionalField', { name: getString('cd.cloudFormation.specifyCapabilities') })}
                        </Text>
                      }
                      defaultValueToReset=""
                      allowedTypes={allowableTypes.filter(item => item !== MultiTypeInputType.EXPRESSION)}
                      skipRenderValueInExpressionLabel
                      disabled={readonly}
                    >
                      <FormInput.MultiSelect
                        className={css.selectInputs}
                        label=""
                        name="spec.configuration.capabilities"
                        items={capabilities}
                        placeholder={capabilitiesLoading ? getString('loading') : ''}
                        multiSelectProps={{
                          allowCreatingNewItems: false
                        }}
                        disabled={readonly}
                      />
                    </MultiTypeFieldSelector>

                    <div className={css.divider} />
                    <Tags formik={formik} allowableTypes={allowableTypes} readonly={readonly} regions={regions} />
                    <MultiTypeFieldSelector
                      name="spec.configuration.skipOnStackStatuses"
                      label={
                        <Text style={{ color: 'rgb(11, 11, 13)' }}>
                          {getString('optionalField', { name: getString('cd.cloudFormation.continueStatus') })}
                        </Text>
                      }
                      defaultValueToReset=""
                      allowedTypes={allowableTypes.filter(item => item !== MultiTypeInputType.EXPRESSION)}
                      skipRenderValueInExpressionLabel
                      disabled={readonly}
                    >
                      <FormInput.MultiSelect
                        className={css.selectInputs}
                        label=""
                        name="spec.configuration.skipOnStackStatuses"
                        items={awsStates}
                        placeholder={statesLoading ? getString('loading') : ''}
                        multiSelectProps={{
                          allowCreatingNewItems: false
                        }}
                        disabled={readonly}
                      />
                    </MultiTypeFieldSelector>
                  </div>
                }
              />
            </Accordion>
            <CFRemoteWizard
              readonly={readonly}
              allowableTypes={allowableTypes}
              showModal={showModal}
              onClose={() => {
                setParamIndex(undefined)
                setShowModal(false)
              }}
              initialValues={values}
              setFieldValue={setFieldValue}
              index={paramIndex}
              regions={regions}
            />
            <InlineParameterFile
              initialValues={parameterOverrides}
              isOpen={showInlineParams}
              onClose={() => {
                setInlineParams(false)
              }}
              onSubmit={inlineValues => {
                /* istanbul ignore next */
                setFieldValue('spec.configuration.parameterOverrides', inlineValues?.parameterOverrides)
                /* istanbul ignore next */
                setInlineParams(false)
              }}
              readonly={readonly}
              allowableTypes={allowableTypes}
              awsConnectorRef={awsConnector}
              type={templateFileType}
              region={awsRegion}
              body={inlineTemplateFile || templateUrl}
              git={
                templateFileType === TemplateTypes.Remote
                  ? {
                      gitConnectorRef: remoteTemplateFile?.connectorRef?.value || remoteTemplateFile?.connectorRef,
                      isBranch: remoteTemplateFile?.gitFetchType === 'Branch',
                      filePath: remoteTemplateFile?.paths?.[0],
                      branch: remoteTemplateFile?.branch,
                      commitId: remoteTemplateFile?.commitId,
                      repoName: remoteTemplateFile?.repoName
                    }
                  : undefined
              }
            />
          </>
        )
      }}
    </Formik>
  )
}
