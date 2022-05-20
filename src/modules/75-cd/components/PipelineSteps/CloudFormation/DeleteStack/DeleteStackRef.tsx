/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import cx from 'classnames'
import * as Yup from 'yup'
import {
  Formik,
  FormInput,
  getMultiTypeFromValue,
  MultiTypeInputType,
  Color,
  Layout,
  Text,
  MultiSelectOption
} from '@harness/uicore'
import { map, isEmpty } from 'lodash-es'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { IdentifierSchemaWithOutName, NameSchema, ConnectorRefSchema } from '@common/utils/Validation'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { setFormikRef, StepFormikFowardRef } from '@pipeline/components/AbstractSteps/Step'
import { useListAwsRegions } from 'services/portal'
import { useGetIamRolesForAws } from 'services/cd-ng'
import { Connectors } from '@connectors/constants'
import { DeleteStackTypes, CloudFormationDeleteStackProps } from '../CloudFormationInterfaces.types'
import { isRuntime } from '../CloudFormationHelper'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import css from '../CloudFormation.module.scss'

export const CloudFormationDeleteStack = (
  { allowableTypes, isNewStep, readonly = false, initialValues, onUpdate, onChange }: CloudFormationDeleteStackProps,
  formikRef: StepFormikFowardRef
): JSX.Element => {
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { expressions } = useVariablesExpression()
  const [regions, setRegions] = useState<MultiSelectOption[]>([])
  const [awsRoles, setAwsRoles] = useState<MultiSelectOption[]>([])
  const [awsRef, setAwsRef] = useState<string>('')

  const { data: regionData, loading: regionLoading } = useListAwsRegions({
    queryParams: {
      accountId
    }
  })

  useEffect(() => {
    /* istanbul ignore next */
    if (regionData) {
      const regionValues = map(regionData?.resource, reg => ({ label: reg.name, value: reg.value }))
      setRegions(regionValues as MultiSelectOption[])
    }
  }, [regionData])

  const {
    data: roleData,
    refetch,
    loading: rolesLoading
  } = useGetIamRolesForAws({
    lazy: true,
    debounce: 500,
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier: orgIdentifier,
      projectIdentifier: projectIdentifier,
      awsConnectorRef: awsRef
    }
  })

  useEffect(() => {
    if (roleData) {
      const roles = []
      /* istanbul ignore next */
      for (const key in roleData?.data) {
        roles.push({ label: roleData?.data[key], value: key })
      }
      setAwsRoles(roles)
    }

    if (!roleData && !isEmpty(awsRef)) {
      refetch()
    }
  }, [roleData, awsRef])

  useEffect(() => {
    /* istanbul ignore next */
    if (initialValues?.spec?.configuration?.spec?.connectorRef) {
      setAwsRef(initialValues?.spec?.configuration?.spec?.connectorRef)
    }
  }, [initialValues])

  return (
    <Formik
      enableReinitialize={true}
      initialValues={initialValues}
      formName="cloudFormationDeleteStack"
      validate={values => {
        const payload = {
          ...values
        }
        /* istanbul ignore next */
        onChange?.(payload)
      }}
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
          configuration: Yup.object().shape({
            type: Yup.string(),
            spec: Yup.object()
              .when('type', {
                is: value => value === DeleteStackTypes.Inherited,
                then: Yup.object().shape({
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
                  })
                })
              })
              .when('type', {
                is: value => value === DeleteStackTypes.Inline,
                then: Yup.object().shape({
                  connectorRef: ConnectorRefSchema(),
                  region: Yup.string().required(getString('cd.cloudFormation.errors.region')),
                  stackName: Yup.string().required(getString('cd.cloudFormation.errors.stackName'))
                })
              })
          })
        })
      })}
    >
      {formik => {
        setFormikRef(formikRef, formik)
        const { values, setFieldValue } = formik
        const config = values?.spec?.configuration
        const provisionerIdentifier = config?.spec?.provisionerIdentifier
        const stackName = config?.spec?.stackName
        const stepType = config?.type
        const awsConnector = config?.spec?.connectorRef
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
            <div className={cx(stepCss.formGroup, stepCss.md)}>
              <FormInput.Select
                items={[
                  { label: 'Inherit From Create', value: 'Inherited' },
                  { label: 'Inline', value: 'Inline' }
                ]}
                name="spec.configuration.type"
                label={getString('pipelineSteps.configurationType')}
                placeholder={getString('pipelineSteps.configurationType')}
                disabled={readonly}
              />
            </div>
            {stepType === DeleteStackTypes.Inherited && (
              <div className={stepCss.formGroup}>
                <FormInput.MultiTextInput
                  name="spec.configuration.spec.provisionerIdentifier"
                  label={getString('pipelineSteps.provisionerIdentifier')}
                  multiTextInputProps={{ expressions, allowableTypes }}
                  disabled={readonly}
                  className={css.inputWidth}
                />
                {
                  /* istanbul ignore next */
                  isRuntime(provisionerIdentifier) && (
                    <ConfigureOptions
                      value={provisionerIdentifier as string}
                      type="String"
                      variableName="spec.configuration.spec.provisionerIdentifier"
                      showRequiredField={false}
                      showDefaultField={false}
                      showAdvanced={true}
                      isReadonly={readonly}
                      className={css.inputWidth}
                    />
                  )
                }
              </div>
            )}
            {
              /* istanbul ignore next */
              stepType === DeleteStackTypes.Inline && (
                <>
                  <div className={stepCss.formGroup}>
                    <FormMultiTypeConnectorField
                      label={<Text color={Color.GREY_900}>{getString('pipelineSteps.awsConnectorLabel')}</Text>}
                      type={Connectors.AWS}
                      name="spec.configuration.spec.connectorRef"
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
                        /* istanbul ignore next */
                        if (value?.record?.identifier !== awsConnector) {
                          setAwsRef(value?.record?.identifier as string)
                        }
                        /* istanbul ignore next */
                        setFieldValue('spec.configuration.spec.connectorRef', value?.record?.identifier || value)
                      }}
                    />
                  </div>
                  <Layout.Horizontal className={stepCss.formGroup}>
                    <FormInput.MultiTypeInput
                      label={getString('regionLabel')}
                      name="spec.configuration.spec.region"
                      disabled={readonly}
                      useValue
                      placeholder={regionLoading ? getString('loading') : getString('select')}
                      multiTypeInputProps={{
                        selectProps: {
                          allowCreatingNewItems: false,
                          items: regions || []
                        },
                        expressions,
                        allowableTypes,
                        width: 300
                      }}
                      selectItems={regions || []}
                    />
                  </Layout.Horizontal>
                  <Layout.Vertical className={css.addMarginBottom}>
                    <FormInput.MultiTypeInput
                      label={getString('connectors.awsKms.roleArnLabel')}
                      name="spec.configuration.spec.roleArn"
                      placeholder={rolesLoading ? getString('loading') : getString('select')}
                      multiTypeInputProps={{
                        selectProps: {
                          allowCreatingNewItems: false,
                          items: awsRoles || [],
                          addClearBtn: true
                        },
                        expressions,
                        allowableTypes,
                        width: 300
                      }}
                      disabled={readonly}
                      selectItems={awsRoles || []}
                      useValue
                      isOptional
                    />
                  </Layout.Vertical>
                  <div className={cx(stepCss.formGroup)}>
                    <FormInput.MultiTextInput
                      name="spec.configuration.spec.stackName"
                      label={getString('cd.cloudFormation.stackName')}
                      multiTextInputProps={{ expressions, allowableTypes }}
                      disabled={readonly}
                      className={css.inputWidth}
                    />
                    {
                      /* istanbul ignore next */
                      isRuntime(stackName) && (
                        <ConfigureOptions
                          value={stackName as string}
                          type="String"
                          variableName="spec.configuration.spec.stackName"
                          showRequiredField={false}
                          showDefaultField={false}
                          showAdvanced={true}
                          isReadonly={readonly}
                          className={css.inputWidth}
                        />
                      )
                    }
                  </div>
                </>
              )
            }
          </>
        )
      }}
    </Formik>
  )
}
