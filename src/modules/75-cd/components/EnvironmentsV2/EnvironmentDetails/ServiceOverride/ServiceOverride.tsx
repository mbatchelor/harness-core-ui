/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useRef, useState } from 'react'
import { debounce } from 'lodash-es'
import { Formik, FieldArray, FormikProps } from 'formik'
import cx from 'classnames'
import * as Yup from 'yup'

import {
  Button,
  FormInput,
  MultiTypeInputType,
  getMultiTypeFromValue,
  ButtonSize,
  ButtonVariation,
  Text,
  Layout,
  Card,
  Container
} from '@harness/uicore'
import { FontVariation, Color } from '@harness/design-system'

import type { NGServiceOverrides } from 'services/cd-ng'
import { String, useStrings } from 'framework/strings'
import type { UseStringsReturn } from 'framework/strings'

import { TextInputWithCopyBtn } from '@common/components/TextInputWithCopyBtn/TextInputWithCopyBtn'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'

import MultiTypeSecretInput from '@secrets/components/MutiTypeSecretInput/MultiTypeSecretInput'

import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { getVariablesValidationField } from '@pipeline/components/PipelineSteps/AdvancedSteps/FailureStrategyPanel/validation'

import { VariableType, labelStringMap } from './ServiceOverrideUtils'
import AddEditServiceOverride, { VariableState } from './AddEditServiceOverride'

import css from './ServiceOverrides.module.scss'

export interface ServiceOverrideVariablesData {
  serviceOverrides: any[]
  canAddOverride?: boolean
}

export interface ServiceOverrideProps {
  formName?: string
  initialValues: ServiceOverrideVariablesData
  allowableTypes: MultiTypeInputType[]
  readonly?: boolean
  onUpdate?: (data: ServiceOverrideVariablesData) => void
}

const getValidationSchema = (getString: UseStringsReturn['getString']): Yup.Schema<unknown> =>
  Yup.object().shape({
    ...getVariablesValidationField(getString)
  })

export function ServiceOverride({
  initialValues,
  onUpdate,
  readonly,
  formName,
  allowableTypes
}: ServiceOverrideProps): React.ReactElement {
  const formikRef = useRef<FormikProps<unknown> | null>(null)
  const { expressions } = useVariablesExpression()
  const { getString } = useStrings()

  const [selectedVariable, setSelectedVariable] = useState<VariableState | null>(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdate = React.useCallback(
    debounce((data: ServiceOverrideVariablesData) => onUpdate?.(data), 500),
    [onUpdate]
  )

  function addFirst(): void {
    setSelectedVariable({
      serviceRef: '',
      variable: { name: '', type: 'String', value: '' },
      index: -1
    })
  }

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={data => onUpdate?.(data)}
      validate={debouncedUpdate}
      validationSchema={getValidationSchema(getString)}
    >
      {formik => {
        const { values, setFieldValue } = formik
        formikRef.current = formik as FormikProps<unknown> | null
        return (
          <>
            <Layout.Horizontal flex={{ justifyContent: 'space-between' }}>
              <Text color={Color.GREY_700} margin={{ bottom: 'small' }} font={{ weight: 'bold' }}>
                {getString('cd.serviceOverrides')}
              </Text>
              <Button
                size={ButtonSize.SMALL}
                variation={ButtonVariation.LINK}
                onClick={addFirst}
                text={getString('common.plusNewName', { name: getString('common.override') })}
              />
            </Layout.Horizontal>
            <Text>{getString('cd.serviceOverridesHelperText')}</Text>
            <FieldArray name="serviceOverrides">
              {({ push, replace, remove }) => {
                function handlePush(service: NGServiceOverrides) {
                  push(service)
                }

                function handleReplace(index: number, service: NGServiceOverrides) {
                  replace(index, service)
                }

                function handleRemove(index: number) {
                  remove(index)
                }

                return (
                  <div className={css.serviceOverrides}>
                    <AddEditServiceOverride
                      formName={formName}
                      selectedVariable={selectedVariable}
                      setSelectedVariable={setSelectedVariable}
                      addService={handlePush}
                      removeService={handleRemove}
                      updateService={handleReplace}
                      allowableTypes={allowableTypes}
                      existingOverrides={values.serviceOverrides}
                    />
                    {values?.serviceOverrides?.map((override, overrideIndex) => {
                      function addNew(): void {
                        setSelectedVariable({
                          serviceRef: override.serviceRef,
                          variable: { name: '', type: 'String', value: '' },
                          index: -1
                        })
                      }

                      return (
                        <Container key={override.serviceRef}>
                          <Text
                            color={Color.BLACK}
                            font={{ variation: FontVariation.UPPERCASED, weight: 'bold' }}
                            margin={{ bottom: 'small' }}
                          >
                            {override.serviceRef}
                          </Text>
                          <Card style={{ width: '100%' }}>
                            {(override?.variables as any)?.length > 0 ? (
                              <div className={cx(css.tableRow, css.headerRow)}>
                                <Text font={{ variation: FontVariation.TABLE_HEADERS }}>
                                  {getString('cd.configurationVariable')}
                                </Text>
                                <Text font={{ variation: FontVariation.TABLE_HEADERS }}>{getString('typeLabel')}</Text>
                                <Text font={{ variation: FontVariation.TABLE_HEADERS }}>
                                  {getString('cd.overrideValue')}
                                </Text>
                              </div>
                            ) : null}

                            {override?.variables?.map?.((variable: any, index: any) => {
                              return (
                                <div key={`${override.serviceRef}-${variable.name}`} className={css.tableRow}>
                                  <TextInputWithCopyBtn
                                    name={`serviceOverrides[${overrideIndex}]variables[${index}].name`}
                                    label=""
                                    disabled={true}
                                  />
                                  <String
                                    className={css.valueString}
                                    stringID={labelStringMap[variable.type as VariableType]}
                                    data-testid={`serviceOverrides[${overrideIndex}]variables[${index}].type`}
                                  />
                                  <div
                                    className={css.valueColumn}
                                    data-type={getMultiTypeFromValue(variable.value as string)}
                                  >
                                    {variable.type === VariableType.Secret ? (
                                      <MultiTypeSecretInput
                                        name={`serviceOverrides[${overrideIndex}]variables[${index}].value`}
                                        label=""
                                        disabled={readonly}
                                      />
                                    ) : (
                                      <FormInput.MultiTextInput
                                        className="variableInput"
                                        name={`serviceOverrides[${overrideIndex}]variables[${index}].value`}
                                        label=""
                                        disabled={readonly}
                                        multiTextInputProps={{
                                          defaultValueToReset: '',
                                          expressions,
                                          textProps: {
                                            disabled: !initialValues.canAddOverride || readonly,
                                            type: variable.type === VariableType.Number ? 'number' : 'text'
                                          },
                                          allowableTypes
                                        }}
                                      />
                                    )}
                                    {getMultiTypeFromValue(variable.value as string) === MultiTypeInputType.RUNTIME ? (
                                      <ConfigureOptions
                                        value={variable.value as string}
                                        defaultValue={variable.default}
                                        type={variable.type || /* istanbul ignore next */ 'String'}
                                        variableName={variable.name || /* istanbul ignore next */ ''}
                                        onChange={(value, defaultValue) => {
                                          setFieldValue(
                                            `serviceOverrides[${overrideIndex}]variables[${index}].value`,
                                            value
                                          )
                                          setFieldValue(
                                            `serviceOverrides[${overrideIndex}]variables[${index}].default`,
                                            defaultValue
                                          )
                                        }}
                                        isReadonly={readonly}
                                      />
                                    ) : null}
                                    <div className={css.actionButtons}>
                                      {initialValues.canAddOverride ? (
                                        <React.Fragment>
                                          <Button
                                            icon="Edit"
                                            disabled={readonly}
                                            tooltip={
                                              <String className={css.tooltip} stringID="common.editVariableType" />
                                            }
                                            data-testid={`edit-variable-${index}`}
                                            onClick={() => setSelectedVariable({ variable, index, serviceRef: '' })}
                                            minimal
                                          />
                                          <Button
                                            icon="main-trash"
                                            disabled={readonly}
                                            data-testid={`delete-variable-${index}`}
                                            tooltip={
                                              <String className={css.tooltip} stringID="common.removeThisVariable" />
                                            }
                                            onClick={() => handleRemove(index)}
                                            minimal
                                          />
                                        </React.Fragment>
                                      ) : /* istanbul ignore next */ null}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}

                            {values.canAddOverride && (
                              <Button
                                size={ButtonSize.SMALL}
                                variation={ButtonVariation.LINK}
                                onClick={addNew}
                                text={getString('common.plusAddName', { name: getString('common.override') })}
                              />
                            )}
                          </Card>
                        </Container>
                      )
                    })}
                  </div>
                )
              }}
            </FieldArray>
          </>
        )
      }}
    </Formik>
  )
}
