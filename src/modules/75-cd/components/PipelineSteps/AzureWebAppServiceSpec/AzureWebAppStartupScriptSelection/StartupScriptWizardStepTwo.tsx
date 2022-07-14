/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback } from 'react'
import {
  Layout,
  Button,
  FormInput,
  Formik,
  getMultiTypeFromValue,
  MultiTypeInputType,
  Text,
  StepProps,
  ButtonVariation
} from '@wings-software/uicore'
import cx from 'classnames'
import { FontVariation } from '@harness/design-system'
import { Form } from 'formik'
import * as Yup from 'yup'

import { get, isEmpty, isUndefined, set } from 'lodash-es'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { Connectors } from '@connectors/constants'

import { useStrings } from 'framework/strings'
import type { ConnectorConfigDTO } from 'services/cd-ng'
import { GitRepoName } from '@pipeline/components/ManifestSelection/Manifesthelper'
import MultiConfigSelectField from './MultiConfigSelectField'
import {
  ConnectorTypes,
  gitFetchTypeList,
  GitFetchTypes,
  HarnessFileStore,
  StartupScriptDataType,
  StartupScriptWizardStepTwoProps,
  FILE_TYPE_VALUES
} from './StartupScriptInterface.types'
import css from './StartupScriptSelection.module.scss'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

function StartupScriptWizardStepTwo({
  stepName,
  expressions,
  allowableTypes,
  initialValues,
  handleSubmit,
  prevStepData,
  previousStep,
  isReadonly = false
}: StepProps<ConnectorConfigDTO> & StartupScriptWizardStepTwoProps): React.ReactElement {
  const { getString } = useStrings()

  const gitConnectionType: string = prevStepData?.store === Connectors.GIT ? 'connectionType' : 'type'
  const connectionType =
    prevStepData?.connectorRef?.connector?.spec?.[gitConnectionType] === GitRepoName.Repo ||
    prevStepData?.urlType === GitRepoName.Repo
      ? GitRepoName.Repo
      : GitRepoName.Account

  const getInitialValues = useCallback((): StartupScriptDataType => {
    const specValues = get(initialValues, 'spec', null)

    if (specValues) {
      return {
        ...specValues,
        branch: specValues.branch,
        commitId: specValues.commitId,
        repoName: specValues.repoName,
        gitFetchType: specValues.gitFetchType,
        paths:
          typeof specValues.paths === 'string' || isUndefined(specValues.paths) ? specValues.paths : specValues.paths[0]
      }
    }
    return {
      branch: undefined,
      commitId: undefined,
      gitFetchType: 'Branch',
      paths: undefined,
      repoName: undefined
    }
  }, [])

  const getHarnessStoreInitialValues = (): HarnessFileStore => {
    const specValues = get(initialValues, 'spec', null)

    if (specValues) {
      if (specValues?.files?.length) {
        if (
          getMultiTypeFromValue(specValues.files, [MultiTypeInputType.RUNTIME, MultiTypeInputType.FIXED], true) ===
          MultiTypeInputType.RUNTIME
        ) {
          return {
            fileType: FILE_TYPE_VALUES.FILE_STORE,
            file: specValues?.files
          }
        }
        return {
          fileType: FILE_TYPE_VALUES.FILE_STORE,
          file: specValues?.files[0]
        }
      } else {
        if (
          getMultiTypeFromValue(specValues.files, [MultiTypeInputType.RUNTIME, MultiTypeInputType.FIXED], true) ===
          MultiTypeInputType.RUNTIME
        ) {
          return {
            fileType: FILE_TYPE_VALUES.ENCRYPTED,
            file: specValues?.secretFiles
          }
        }
        return {
          fileType: FILE_TYPE_VALUES.ENCRYPTED,
          file: specValues.secretFiles[0]
        }
      }
    }
    return {
      fileType: FILE_TYPE_VALUES.FILE_STORE,
      file: ''
    }
  }

  const submitFormData = (formData: StartupScriptDataType & { store?: string; connectorRef?: string }): void => {
    const startupScript = {
      type: formData?.store as ConnectorTypes,
      spec: {
        connectorRef: formData?.connectorRef,
        gitFetchType: formData?.gitFetchType,
        paths:
          /* istanbul ignore next */ getMultiTypeFromValue(formData.paths) === MultiTypeInputType.RUNTIME
            ? formData?.paths
            : [formData?.paths]
      }
    }

    if (connectionType === GitRepoName.Account) {
      set(startupScript, 'spec.repoName', formData?.repoName)
    }

    if (startupScript?.spec) {
      if (formData?.gitFetchType === 'Branch') {
        set(startupScript, 'spec.branch', formData?.branch)
      } else if (formData?.gitFetchType === 'Commit') {
        set(startupScript, 'spec.commitId', formData?.commitId)
      }
    }
    handleSubmit(startupScript)
  }
  const submitHarnessFormData = (formData: HarnessFileStore & { store?: string }): void => {
    if (formData.fileType === 'fileStore') {
      const startupScript = {
        type: formData?.store as ConnectorTypes,
        spec: {
          files: [formData?.file]
        }
      }
      if (formData.file === '<+input>') {
        set(startupScript, 'spec.files', formData.file)
      }
      handleSubmit(startupScript)
    } else {
      const startupScript = {
        type: formData?.store as ConnectorTypes,
        spec: {
          secretFiles: [formData?.file]
        }
      }
      if (formData.file === '<+input>') {
        set(startupScript, 'spec.secretFiles', formData.file)
      }
      handleSubmit(startupScript)
    }
  }

  if (prevStepData?.store === 'Harness') {
    return (
      <Layout.Vertical height={'inherit'} spacing="medium" className={css.optionsViewContainer}>
        <Text font={{ variation: FontVariation.H3 }} margin={{ bottom: 'medium' }}>
          {stepName}
        </Text>
        <Formik
          initialValues={getHarnessStoreInitialValues()}
          formName="startupScriptDetails"
          validationSchema={Yup.object().shape({
            file: Yup.lazy(() => Yup.string().required())
          })}
          onSubmit={formData => {
            submitHarnessFormData({
              ...prevStepData,
              ...formData
            })
          }}
        >
          {formikProps => {
            return (
              <Form>
                <Layout.Vertical
                  flex={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
                  className={cx(css.startupScriptForm, css.startupScriptWizard)}
                >
                  <div className={css.startupScriptWizard}>
                    <FormInput.RadioGroup
                      name="fileType"
                      className={css.selectFileType}
                      radioGroup={{ inline: true }}
                      label={getString('pipeline.startupScript.selectFileType')}
                      onChange={() => {
                        formikProps.setFieldValue('file', '')
                      }}
                      items={[
                        {
                          label: 'Plain Text',
                          value: FILE_TYPE_VALUES.FILE_STORE
                        },
                        { label: getString('encrypted'), value: FILE_TYPE_VALUES.ENCRYPTED }
                      ]}
                    />
                    <MultiConfigSelectField
                      name="file"
                      fileType={formikProps.values.fileType as string}
                      formik={formikProps}
                      expressions={expressions}
                      values={formikProps.values.file as string}
                      multiTypeFieldSelectorProps={{
                        disableTypeSelection: false,
                        label: (
                          <Text style={{ display: 'flex', alignItems: 'center', color: 'rgb(11, 11, 13)' }}>
                            {formikProps.values.fileType === FILE_TYPE_VALUES.FILE_STORE
                              ? getString('fileFolderPathText')
                              : getString('encrypted')}
                          </Text>
                        )
                      }}
                    />
                  </div>

                  <Layout.Horizontal spacing="medium" className={css.saveBtn}>
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
                </Layout.Vertical>
              </Form>
            )
          }}
        </Formik>
      </Layout.Vertical>
    )
  }

  return (
    <Layout.Vertical height={'inherit'} spacing="medium" className={css.optionsViewContainer}>
      <Text font={{ variation: FontVariation.H3 }} margin={{ bottom: 'medium' }}>
        {stepName}
      </Text>

      <Formik
        initialValues={getInitialValues()}
        formName="startupScriptDetails"
        validationSchema={Yup.object().shape({
          branch: Yup.string().when('gitFetchType', {
            is: 'Branch',
            then: Yup.string().trim().required(getString('validation.branchName'))
          }),
          commitId: Yup.string().when('gitFetchType', {
            is: 'Commit',
            then: Yup.string().trim().required(getString('validation.commitId'))
          }),
          paths: Yup.string()
            .trim()
            .required(
              getString('common.validation.fieldIsRequired', {
                name: getString('pipeline.startupScript.scriptFilePath')
              })
            ),
          repoName: Yup.string().test('repoName', getString('common.validation.repositoryName'), value => {
            if (connectionType === GitRepoName.Repo) {
              return true
            }
            return !isEmpty(value) && value?.length > 0
          })
        })}
        onSubmit={formData => {
          submitFormData({
            ...prevStepData,
            ...formData,
            connectorRef: prevStepData?.connectorRef
              ? getMultiTypeFromValue(prevStepData?.connectorRef) !== MultiTypeInputType.FIXED
                ? prevStepData?.connectorRef
                : prevStepData?.connectorRef?.value
              : /* istanbul ignore next */ prevStepData?.identifier
              ? prevStepData?.identifier
              : ''
          })
        }}
      >
        {(formik: { setFieldValue: (a: string, b: string) => void; values: StartupScriptDataType }) => {
          return (
            <Form>
              <Layout.Vertical
                flex={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
                className={cx(css.startupScriptForm, css.startupScriptWizard)}
              >
                <div className={css.startupScriptWizard}>
                  {!!(connectionType === GitRepoName.Account) && (
                    <div className={cx(stepCss.formGroup, stepCss.md)}>
                      <FormInput.MultiTextInput
                        multiTextInputProps={{ expressions, allowableTypes }}
                        label={getString('common.repositoryName')}
                        placeholder={getString('common.repositoryName')}
                        name="repoName"
                      />

                      {getMultiTypeFromValue(formik.values?.repoName) === MultiTypeInputType.RUNTIME && (
                        <ConfigureOptions
                          value={formik.values?.repoName as string}
                          type="String"
                          variableName="repoName"
                          showRequiredField={false}
                          showDefaultField={false}
                          showAdvanced={true}
                          onChange={/* istanbul ignore next */ value => formik.setFieldValue('repoName', value)}
                          isReadonly={isReadonly}
                        />
                      )}
                    </div>
                  )}
                  <div className={cx(stepCss.formGroup, stepCss.md)}>
                    <FormInput.Select
                      name="gitFetchType"
                      label={getString('pipeline.manifestType.gitFetchTypeLabel')}
                      items={gitFetchTypeList}
                    />
                  </div>
                  {formik.values?.gitFetchType === GitFetchTypes.Branch && (
                    <div className={cx(stepCss.formGroup, stepCss.md)}>
                      <FormInput.MultiTextInput
                        multiTextInputProps={{ expressions, allowableTypes }}
                        label={getString('pipelineSteps.deploy.inputSet.branch')}
                        placeholder={getString('pipeline.manifestType.branchPlaceholder')}
                        name="branch"
                      />

                      {getMultiTypeFromValue(formik.values?.branch) === MultiTypeInputType.RUNTIME && (
                        <ConfigureOptions
                          value={formik.values?.branch as string}
                          type="String"
                          variableName="branch"
                          showRequiredField={false}
                          showDefaultField={false}
                          showAdvanced={true}
                          onChange={/* istanbul ignore next */ value => formik.setFieldValue('branch', value)}
                          isReadonly={isReadonly}
                        />
                      )}
                    </div>
                  )}

                  {formik.values?.gitFetchType === GitFetchTypes.Commit && (
                    <div className={cx(stepCss.formGroup, stepCss.md)}>
                      <FormInput.MultiTextInput
                        multiTextInputProps={{ expressions, allowableTypes }}
                        label={getString('pipeline.manifestType.commitId')}
                        placeholder={getString('pipeline.manifestType.commitPlaceholder')}
                        name="commitId"
                      />

                      {getMultiTypeFromValue(formik.values?.commitId) === MultiTypeInputType.RUNTIME && (
                        <ConfigureOptions
                          value={formik.values?.commitId as string}
                          type="String"
                          variableName="commitId"
                          showRequiredField={false}
                          showDefaultField={false}
                          showAdvanced={true}
                          onChange={/* istanbul ignore next */ value => formik.setFieldValue('commitId', value)}
                          isReadonly={isReadonly}
                        />
                      )}
                    </div>
                  )}
                  <div className={cx(stepCss.formGroup, stepCss.md)}>
                    <FormInput.MultiTextInput
                      label={getString('pipeline.startupScript.scriptFilePath')}
                      placeholder={getString('pipeline.startupScript.scriptFilePath')}
                      name={'paths'}
                      multiTextInputProps={{ expressions, allowableTypes }}
                    />
                    {getMultiTypeFromValue(formik.values?.paths as string) === MultiTypeInputType.RUNTIME && (
                      <ConfigureOptions
                        style={{ alignSelf: 'center', marginTop: 1 }}
                        value={formik.values?.paths as string}
                        type="String"
                        variableName={'paths'}
                        showRequiredField={false}
                        showDefaultField={false}
                        showAdvanced={true}
                        onChange={
                          /* istanbul ignore next */ value => {
                            formik.setFieldValue('paths', value)
                          }
                        }
                        isReadonly={isReadonly}
                      />
                    )}
                  </div>
                </div>

                <Layout.Horizontal spacing="medium" className={css.saveBtn}>
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
              </Layout.Vertical>
            </Form>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}

export default StartupScriptWizardStepTwo
