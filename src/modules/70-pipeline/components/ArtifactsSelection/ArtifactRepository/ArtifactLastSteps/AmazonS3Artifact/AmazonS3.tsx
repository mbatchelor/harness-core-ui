/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback } from 'react'
import { Form } from 'formik'
import { useParams } from 'react-router-dom'
import { defaultTo, get, memoize, merge } from 'lodash-es'
import * as Yup from 'yup'
import { Menu } from '@blueprintjs/core'

import {
  Button,
  ButtonVariation,
  FontVariation,
  Formik,
  FormInput,
  getMultiTypeFromValue,
  Layout,
  MultiTypeInputType,
  StepProps,
  Text
} from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { ConnectorConfigDTO, useGetBucketListForS3 } from 'services/cd-ng'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import useRBACError, { RBACError } from '@rbac/utils/useRBACError/useRBACError'
import type {
  AmazonS3ArtifactProps,
  AmazonS3InitialValuesType
} from '@pipeline/components/ArtifactsSelection/ArtifactInterface'
import { isServerlessDeploymentType } from '@pipeline/utils/stageHelpers'
import { ArtifactIdentifierValidation, ModalViewFor } from '@pipeline/components/ArtifactsSelection/ArtifactHelper'
import {
  defaultArtifactInitialValues,
  getConnectorIdValue
} from '@pipeline/components/ArtifactsSelection/ArtifactUtils'
import SideCarArtifactIdentifier from '../SideCarArtifactIdentifier'
import css from '../../ArtifactConnector.module.scss'

export function AmazonS3(props: StepProps<ConnectorConfigDTO> & AmazonS3ArtifactProps): React.ReactElement {
  const {
    context,
    handleSubmit,
    expressions,
    allowableTypes,
    prevStepData,
    initialValues,
    previousStep,
    artifactIdentifiers,
    isReadonly = false,
    selectedArtifact,
    selectedDeploymentType
  } = props

  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()

  const isServerlessDeploymentTypeSelected = isServerlessDeploymentType(selectedDeploymentType)
  const { getString } = useStrings()
  const { getRBACErrorMessage } = useRBACError()

  const schemaObject = {
    bucketName: Yup.mixed().required(getString('pipeline.manifestType.bucketNameRequired')),
    artifactPath: Yup.string().trim().required(getString('pipeline.artifactsSelection.validation.artifactPath')),
    filePathRegex: Yup.string()
      .trim()
      .required(
        getString('common.validation.fieldIsRequired', {
          name: getString('pipeline.artifactsSelection.filePathRegexPlaceholder')
        })
      )
  }
  const schemaObjectServerless = {
    bucketName: Yup.mixed().required(getString('pipeline.manifestType.bucketNameRequired')),
    artifactPath: Yup.string().trim().required(getString('pipeline.artifactsSelection.validation.artifactPath')),
    filePathRegex: Yup.string()
      .trim()
      .required(
        getString('common.validation.fieldIsRequired', {
          name: getString('pipeline.artifactsSelection.filePathRegexPlaceholder')
        })
      )
  }
  const sidecarSchema = Yup.object().shape({
    ...schemaObject,
    ...ArtifactIdentifierValidation(
      artifactIdentifiers,
      initialValues?.identifier,
      getString('pipeline.uniqueIdentifier')
    )
  })

  const primarySchema = Yup.object().shape(schemaObject)
  const primarySchemaServerless = Yup.object().shape(schemaObjectServerless)
  const sidecarSchemaServerless = Yup.object().shape({
    ...schemaObject,
    ...ArtifactIdentifierValidation(
      artifactIdentifiers,
      initialValues?.identifier,
      getString('pipeline.uniqueIdentifier')
    )
  })

  const submitFormData = (formData: AmazonS3InitialValuesType & { connectorId?: string }): void => {
    handleSubmit({ spec: formData })
  }

  const getValidationSchema = useCallback(() => {
    if (isServerlessDeploymentTypeSelected) {
      if (context === ModalViewFor.SIDECAR) {
        return sidecarSchemaServerless
      }
      return primarySchemaServerless
    }
    if (context === ModalViewFor.SIDECAR) {
      return sidecarSchema
    }
    return primarySchema
  }, [context, isServerlessDeploymentTypeSelected, primarySchema, primarySchemaServerless, sidecarSchema])

  const {
    data: bucketData,
    error,
    loading,
    refetch: refetchBuckets
  } = useGetBucketListForS3({
    lazy: true,
    debounce: 300
  })

  const fetchBuckets = (): void => {
    refetchBuckets({
      queryParams: {
        connectorRef: prevStepData?.connectorId?.value ?? prevStepData?.connectorId,
        accountIdentifier: accountId,
        projectIdentifier,
        orgIdentifier
      }
    })
  }

  const getSelectItems = useCallback(() => {
    return Object.keys(defaultTo(bucketData?.data, [])).map(bucket => ({
      value: bucket,
      label: bucket
    }))
  }, [bucketData?.data])

  const getBuckets = (): { label: string; value: string }[] => {
    if (loading) {
      return [{ label: 'Loading Buckets...', value: 'Loading Buckets...' }]
    }
    return getSelectItems()
  }

  const getInitialValues = useCallback((): AmazonS3InitialValuesType => {
    const specValues = get(initialValues, 'spec', null)
    if (selectedArtifact !== (initialValues as any)?.type || !specValues) {
      return defaultArtifactInitialValues(defaultTo(selectedArtifact, 'AmazonS3'))
    }
    if (context === ModalViewFor.SIDECAR && initialValues?.identifier) {
      merge(specValues, { identifier: initialValues?.identifier })
    }
    return specValues
  }, [context, initialValues, selectedArtifact])

  const itemRenderer = memoize((item: { label: string }, { handleClick }) => (
    <div key={item.label.toString()}>
      <Menu.Item
        text={
          <Layout.Horizontal spacing="small">
            <Text>{item.label}</Text>
          </Layout.Horizontal>
        }
        disabled={loading}
        onClick={handleClick}
      />
    </div>
  ))

  return (
    <Layout.Vertical spacing="medium" className={css.firstep}>
      <Text font={{ variation: FontVariation.H3 }} margin={{ bottom: 'medium' }}>
        {getString('pipeline.artifactsSelection.artifactDetails')}
      </Text>
      <Formik
        initialValues={getInitialValues()}
        formName="artifactoryArtifact"
        validationSchema={getValidationSchema()}
        onSubmit={formData => {
          submitFormData({
            ...prevStepData,
            ...formData,
            connectorId: getConnectorIdValue(prevStepData)
          })
        }}
      >
        {formik => (
          <Form>
            <div className={css.connectorForm}>
              {context === ModalViewFor.SIDECAR && <SideCarArtifactIdentifier />}

              <div className={css.imagePathContainer}>
                <FormInput.MultiTypeInput
                  selectItems={getBuckets()}
                  label={getString('pipeline.manifestType.bucketName')}
                  placeholder={getString('pipeline.manifestType.bucketPlaceHolder')}
                  name="bucketName"
                  multiTypeInputProps={{
                    expressions,
                    allowableTypes,
                    selectProps: {
                      noResults: (
                        <Text lineClamp={1}>
                          {getRBACErrorMessage(error as RBACError) || getString('pipeline.noBuckets')}
                        </Text>
                      ),
                      itemRenderer: itemRenderer,
                      items: getBuckets(),
                      allowCreatingNewItems: true
                    },
                    onFocus: () => {
                      if (!bucketData?.data) {
                        fetchBuckets()
                      }
                    }
                  }}
                />
                {getMultiTypeFromValue(formik.values.bucketName) === MultiTypeInputType.RUNTIME && (
                  <ConfigureOptions
                    style={{ alignSelf: 'center', marginBottom: 3 }}
                    value={formik.values?.bucketName as string}
                    type="String"
                    variableName="bucketName"
                    showRequiredField={false}
                    showDefaultField={false}
                    showAdvanced={true}
                    onChange={value => formik.setFieldValue('bucketName', value)}
                    isReadonly={isReadonly}
                  />
                )}
              </div>

              <div className={css.imagePathContainer}>
                <FormInput.MultiTextInput
                  label={getString('pipeline.artifactPathLabel')}
                  name="artifactPath"
                  placeholder={getString('pipeline.artifactsSelection.artifactPathPlaceholder')}
                  multiTextInputProps={{
                    expressions,
                    allowableTypes
                  }}
                />
                {getMultiTypeFromValue(formik.values.artifactPath) === MultiTypeInputType.RUNTIME && (
                  <div className={css.configureOptions}>
                    <ConfigureOptions
                      style={{ alignSelf: 'center' }}
                      value={formik.values?.artifactPath as string}
                      type={getString('string')}
                      variableName="artifactPath"
                      showRequiredField={false}
                      showDefaultField={false}
                      showAdvanced={true}
                      onChange={value => {
                        formik.setFieldValue('artifactPath', value)
                      }}
                      isReadonly={isReadonly}
                    />
                  </div>
                )}
              </div>

              <div className={css.imagePathContainer}>
                <FormInput.MultiTextInput
                  label={getString('pipeline.artifactsSelection.filePathRegexLabel')}
                  name="filePathRegex"
                  placeholder={getString('pipeline.artifactsSelection.filePathRegexPlaceholder')}
                  multiTextInputProps={{
                    expressions,
                    allowableTypes
                  }}
                />
                {getMultiTypeFromValue(formik.values.filePathRegex) === MultiTypeInputType.RUNTIME && (
                  <div className={css.configureOptions}>
                    <ConfigureOptions
                      style={{ alignSelf: 'center' }}
                      value={formik.values?.filePathRegex as string}
                      type={getString('string')}
                      variableName="filePathRegex"
                      showRequiredField={false}
                      showDefaultField={false}
                      showAdvanced={true}
                      onChange={value => {
                        formik.setFieldValue('filePathRegex', value)
                      }}
                      isReadonly={isReadonly}
                    />
                  </div>
                )}
              </div>
            </div>
            <Layout.Horizontal spacing="medium">
              <Button
                variation={ButtonVariation.SECONDARY}
                text={getString('back')}
                icon="chevron-left"
                onClick={() => previousStep?.(prevStepData)}
              />
              <Button
                variation={ButtonVariation.PRIMARY}
                type="submit"
                text={getString('submit')}
                rightIcon="chevron-right"
              />
            </Layout.Horizontal>
          </Form>
        )}
      </Formik>
    </Layout.Vertical>
  )
}
