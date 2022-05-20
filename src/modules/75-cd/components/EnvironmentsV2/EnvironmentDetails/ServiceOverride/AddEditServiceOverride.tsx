/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { FormikProps } from 'formik'
import { defaultTo } from 'lodash-es'

import {
  Button,
  Formik,
  Layout,
  FormInput,
  ButtonVariation,
  Dialog,
  SelectOption,
  Text,
  ButtonSize,
  Container,
  MultiTypeInputType
} from '@harness/uicore'

import { NGServiceConfig, NGServiceOverrides, useGetServiceList } from 'services/cd-ng'
import { useStrings } from 'framework/strings'

import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { yamlParse } from '@common/utils/YamlHelperMethods'

import MultiTypeSecretInput from '@secrets/components/MutiTypeSecretInput/MultiTypeSecretInput'

import type { AllNGVariables } from '@pipeline/utils/types'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'

import { getVariableTypeOptions, VariableType } from './ServiceOverrideUtils'

export interface VariableState {
  variable: AllNGVariables
  serviceRef: string
  index: number
}

export interface AddEditServiceOverrideProps {
  formName?: string

  selectedVariable: VariableState | null
  setSelectedVariable(variable: VariableState | null): void

  addService(service: NGServiceOverrides): void
  removeService(index: number): void
  updateService(index: number, service: NGServiceOverrides): void
  allowableTypes: MultiTypeInputType[]
  existingOverrides: NGServiceOverrides[]
}

export default function AddEditServiceOverride({
  selectedVariable,
  setSelectedVariable,
  addService,
  updateService,
  formName,
  allowableTypes,
  existingOverrides
}: AddEditServiceOverrideProps): React.ReactElement {
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const formikRef = useRef<FormikProps<NGServiceOverrides | undefined>>()
  const [availableVariables, setAvailableVariables] = useState<SelectOption[]>([])

  const isEdit = selectedVariable && typeof selectedVariable.index === 'number' && selectedVariable.index > -1

  function closeModal(): void {
    setSelectedVariable(null)
  }

  const actualFormName = formName || 'addEditServiceOverrideForm'

  const { data, loading: servicesLoading } = useGetServiceList({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    lazy: !!selectedVariable
  })

  const servicesAvailable = defaultTo(
    data?.data?.content?.map(item => ({
      label: defaultTo(item?.service?.name, ''),
      value: defaultTo(yamlParse(defaultTo(item.service?.yaml, '{}')), '')
    })),
    []
  )

  const handleServiceChange = (item: SelectOption) => {
    setAvailableVariables(
      defaultTo(
        (item?.value as NGServiceConfig)?.service?.serviceDefinition?.spec?.variables?.map(variable => ({
          label: variable.name || '',
          value: (variable as any).value,
          type: variable.type
        })),
        []
      )
    )
  }

  const handleVariableChange = (item: SelectOption) => {
    formikRef.current?.setFieldValue('name', (item as any).label)
    formikRef.current?.setFieldValue('type', (item as any).type)
    formikRef.current?.setFieldValue('value', (item as any).value)
  }

  return (
    <Dialog
      className={'padded-dialog'}
      isOpen={!!selectedVariable}
      enforceFocus={false}
      title={getString(isEdit ? 'common.editName' : 'common.addName', { name: getString('common.override') })}
      onClose={closeModal}
    >
      <Formik
        formName={actualFormName}
        initialValues={selectedVariable?.variable}
        onSubmit={values => {
          if (values && selectedVariable) {
            // TODO: Improve logic
            const matchingOverride = existingOverrides?.find(
              override => (values as any)?.serviceYaml?.service?.identifier === override.serviceRef
            )
            const matchingOverrideIndex = existingOverrides?.findIndex(
              override => (values as any)?.serviceYaml?.service?.identifier === override.serviceRef
            )
            if (matchingOverride) {
              const matchingVariable = matchingOverride.variables.find(variable => variable.name === values.name)
              const matchingVariableIndex = matchingOverride.variables.findIndex(
                variable => variable.name === values.name
              )

              if (matchingVariable) {
                const updatedVariables = matchingOverride.variables
                updatedVariables[matchingVariableIndex] = {
                  name: values?.name,
                  type: values?.type,
                  value: values?.value
                } as any
                updateService(matchingOverrideIndex, { ...matchingOverride, variables: updatedVariables })
              } else {
                updateService(matchingOverrideIndex, {
                  ...matchingOverride,
                  variables: [
                    ...matchingOverride.variables,
                    {
                      name: values?.name,
                      type: values?.type,
                      value: values?.value
                    } as any
                  ]
                })
              }
            } else {
              addService({
                serviceRef: (values as any)?.serviceYaml?.service?.identifier,
                variables: [
                  {
                    name: values?.name,
                    type: values?.type,
                    value: values?.value
                  }
                ] as any
              })
            }
            closeModal()
          }
        }}
      >
        {formikProps => {
          formikRef.current = formikProps as any
          return (
            <Container margin={{ left: 'small', right: 'small' }}>
              <FormInput.Select
                name="serviceYaml"
                items={servicesAvailable}
                label={getString('service')}
                placeholder={getString('common.selectName', { name: getString('service') })}
                disabled={servicesLoading}
                onChange={handleServiceChange}
              />
              <Text>{getString('cd.overrideType')}</Text>
              <Button
                disabled
                size={ButtonSize.SMALL}
                variation={ButtonVariation.SECONDARY}
                margin={{ top: 'small', bottom: 'medium' }}
              >
                {getString('variableLabel')}
              </Button>
              <FormInput.Select
                name="name"
                items={availableVariables}
                label={getString('variableNameLabel')}
                placeholder={getString('common.selectName', { name: getString('variableLabel') })}
                disabled={servicesLoading}
                onChange={handleVariableChange}
              />
              <FormInput.Select
                name="type"
                items={getVariableTypeOptions(getString)}
                label={getString('typeLabel')}
                placeholder={getString('common.selectName', { name: getString('service') })}
                disabled={servicesLoading}
              />
              {formikProps?.values?.type === VariableType.Secret ? (
                <MultiTypeSecretInput name={`value`} label={getString('cd.overrideValue')} disabled={servicesLoading} />
              ) : (
                <FormInput.MultiTextInput
                  className="variableInput"
                  name={`value`}
                  label={getString('cd.overrideValue')}
                  disabled={servicesLoading}
                  multiTextInputProps={{
                    defaultValueToReset: '',
                    expressions,
                    textProps: {
                      disabled: servicesLoading,
                      type: formikProps?.values?.type === VariableType.Number ? 'number' : 'text'
                    },
                    allowableTypes
                  }}
                />
              )}
              <Layout.Horizontal spacing="medium" padding={{ top: 'medium' }}>
                <Button
                  variation={ButtonVariation.PRIMARY}
                  text={getString('save')}
                  onClick={formikProps.submitForm}
                  data-testid="addVariableSave"
                />
                <Button
                  variation={ButtonVariation.TERTIARY}
                  text={getString('cancel')}
                  onClick={() => closeModal()}
                  data-testid="addVariableCancel"
                />
              </Layout.Horizontal>
            </Container>
          )
        }}
      </Formik>
    </Dialog>
  )
}
