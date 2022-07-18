/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useMemo } from 'react'
import * as Yup from 'yup'
import { useParams } from 'react-router-dom'
import { map, isEmpty, find } from 'lodash-es'
import {
  Layout,
  Button,
  Formik,
  ButtonVariation,
  Select,
  FormInput,
  Text,
  useToaster,
  MultiSelectOption,
  MultiTypeInputType,
  PageSpinner
} from '@harness/uicore'
import { Form, FieldArray } from 'formik'
import { Classes, Dialog } from '@blueprintjs/core'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { useStrings } from 'framework/strings'
import { useCFParametersForAws } from 'services/cd-ng'
import css from '../CloudFormation.module.scss'

interface GitDetails {
  gitConnectorRef: string
  commitId?: string
  filePath?: string
  isBranch: boolean
  branch?: string
  repoName?: string
}

interface ParameterOverride {
  name: string
  value: string
}

interface InlineParameterFileProps {
  onClose: () => void
  onSubmit: (values: any) => void
  isOpen: boolean
  initialValues: any
  awsConnectorRef: string
  type: string
  region: string
  body: string
  git?: GitDetails
  readonly?: boolean
  allowableTypes?: MultiTypeInputType[]
}

enum RequestTypes {
  Remote = 'git',
  S3URL = 's3',
  Inline = 'body'
}

export const InlineParameterFile = ({
  initialValues,
  onSubmit,
  onClose,
  isOpen,
  awsConnectorRef,
  type,
  region,
  body,
  git,
  readonly,
  allowableTypes
}: InlineParameterFileProps): JSX.Element => {
  const { getString } = useStrings()
  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const { expressions } = useVariablesExpression()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const [remoteParams, setRemoteParams] = useState<MultiSelectOption[]>()
  const queryParams = useMemo(() => {
    return {
      accountIdentifier: accountId,
      orgIdentifier: orgIdentifier,
      projectIdentifier: projectIdentifier,
      awsConnectorRef: awsConnectorRef,
      type: RequestTypes[type as keyof typeof RequestTypes],
      region: region,
      ...git
    }
  }, [accountId, orgIdentifier, projectIdentifier, type, region, awsConnectorRef, git])
  const { mutate: getParamsFromAWS, loading } = useCFParametersForAws({
    queryParams: queryParams
  })

  const getParameters = async (): Promise<void> => {
    if (isEmpty(awsConnectorRef) || isEmpty(type) || isEmpty(region)) {
      showError(getString('cd.cloudFormation.errors.getParam'))
    } else {
      try {
        const result = await getParamsFromAWS(git ? '' : body)
        if (result?.data) {
          setRemoteParams(map(result?.data, param => ({ label: param.paramKey!, value: param.paramKey! })))
        }
      } catch (err: any) {
        showError(getRBACErrorMessage(err))
      }
    }
  }

  return (
    <Dialog
      isOpen={isOpen}
      enforceFocus={false}
      title={
        <Layout.Horizontal flex={{ alignItems: 'center', justifyContent: 'center' }}>
          <Text font="medium" style={{ color: 'rgb(11, 11, 13)' }}>
            {getString('cd.cloudFormation.inlineParameterFiles')}
          </Text>
        </Layout.Horizontal>
      }
      isCloseButtonShown
      onClose={onClose}
      className={Classes.DIALOG}
    >
      {loading && <PageSpinner />}
      <Layout.Vertical padding="xxlarge">
        <Formik
          formName="inlineParameterFileForm"
          initialValues={{ parameterOverrides: initialValues }}
          onSubmit={onSubmit}
          validationSchema={Yup.object().shape({
            parameterOverrides: Yup.array().of(
              Yup.object().shape({
                name: Yup.string().required(getString('validation.nameRequired')),
                value: Yup.string().required(getString('validation.valueRequired'))
              })
            )
          })}
          enableReinitialize
        >
          {({ values, setFieldValue }) => {
            const params =
              values?.parameterOverrides?.length > 0 ? values?.parameterOverrides : [{ name: '', value: '' }]
            return (
              <Form>
                <Layout.Horizontal flex={{ alignItems: 'flex-start', justifyContent: 'flex-start' }}>
                  <Layout.Vertical className={css.overrideSelect}>
                    <Text style={{ color: 'rgb(11, 11, 13)', fontWeight: 'bold' }}>
                      {getString('connectors.parameters')} ({params.length})
                    </Text>
                  </Layout.Vertical>
                  <Layout.Vertical>
                    <a onClick={getParameters} className={css.configPlaceHolder}>
                      {getString('cd.cloudFormation.retrieveNames')}
                    </a>
                  </Layout.Vertical>
                </Layout.Horizontal>
                <Layout.Horizontal
                  className={css.overridesInputHeader}
                  flex={{ alignItems: 'flex-start', justifyContent: 'flex-start' }}
                >
                  <Layout.Vertical className={css.overrideSelect}>
                    <Text style={{ color: 'rgb(11, 11, 13)' }}>{getString('name')}</Text>
                  </Layout.Vertical>
                  <Layout.Vertical>
                    <Text style={{ color: 'rgb(11, 11, 13)' }}>{getString('valueLabel')}</Text>
                  </Layout.Vertical>
                </Layout.Horizontal>
                <FieldArray
                  name="parameterOverrides"
                  render={arrayHelpers => (
                    <>
                      {map(params, (param: ParameterOverride, index: number) => (
                        <Layout.Horizontal
                          spacing="medium"
                          className={css.formContainer}
                          key={`${param}-${index}`}
                          draggable={false}
                        >
                          <Select
                            onChange={({ value }) => {
                              /* istanbul ignore next */
                              setFieldValue(`parameterOverrides[${index}].name`, value)
                            }}
                            items={remoteParams || []}
                            allowCreatingNewItems
                            className={css.overrideSelect}
                            name={`parameterOverrides[${index}].name`}
                            value={
                              find(remoteParams, ['value', param.name]) || { label: param.name, value: param.name }
                            }
                            data-testid="test"
                          />
                          <FormInput.MultiTextInput
                            name={`parameterOverrides[${index}].value`}
                            label={''}
                            multiTextInputProps={{ expressions, allowableTypes }}
                            disabled={readonly}
                          />
                          <Button
                            minimal
                            icon="main-trash"
                            data-testid={`remove-header-${index}`}
                            onClick={() => arrayHelpers.remove(index)}
                          />
                        </Layout.Horizontal>
                      ))}
                      <Button
                        icon="plus"
                        variation={ButtonVariation.LINK}
                        data-testid="add-header"
                        onClick={() => arrayHelpers.push({ name: '', value: '' })}
                      >
                        {getString('add')}
                      </Button>
                    </>
                  )}
                />
                <Layout.Horizontal spacing={'medium'} margin={{ top: 'huge' }}>
                  <Button
                    type="submit"
                    variation={ButtonVariation.PRIMARY}
                    text={getString('submit')}
                    rightIcon="chevron-right"
                    data-testid="submit"
                  />
                  <Button
                    data-testid="inlineParamClose"
                    onClick={onClose}
                    variation={ButtonVariation.TERTIARY}
                    text={getString('cancel')}
                  />
                </Layout.Horizontal>
              </Form>
            )
          }}
        </Formik>
      </Layout.Vertical>
    </Dialog>
  )
}
