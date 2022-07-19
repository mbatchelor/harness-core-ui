/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { isEmpty, map, get } from 'lodash-es'
import cx from 'classnames'
import {
  FormInput,
  FormikForm,
  Text,
  Color,
  MultiSelectOption,
  MultiSelectTypeInput,
  Label,
  Layout,
  useToaster
} from '@harness/uicore'
import { connect, FormikContextType } from 'formik'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { FormMultiTypeDurationField } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { Connectors } from '@connectors/constants'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { useListAwsRegions } from 'services/portal'
import { useCFCapabilitiesForAws, useCFStatesForAws, useGetIamRolesForAws } from 'services/cd-ng'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { TFMonaco } from '../../../Common/Terraform/Editview/TFMonacoEditor'
import TemplateFileInputs from './TemplateFile'
import ParameterFileInputs from './ParameterInputs'
import OverrideParameterFileInputs from './OverrideParameterFileInputs'
import TagsInputs from './TagsInputs'
import type { CreateStackData, CreateStackProps, Tags } from '../../CloudFormationInterfaces.types'
import { isRuntime } from '../../CloudFormationHelper'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

function CreateStackInputStepRef<T extends CreateStackData = CreateStackData>(
  props: CreateStackProps<T> & { formik?: FormikContextType<any> }
): React.ReactElement {
  const { inputSetData, readonly, path, allowableTypes, formik, allValues } = props
  const { getString } = useStrings()
  const { showError } = useToaster()
  const { expressions } = useVariablesExpression()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const [regions, setRegions] = useState<MultiSelectOption[]>([])
  const [awsRoles, setAwsRoles] = useState<MultiSelectOption[]>([])
  const [awsStatuses, setAwsStates] = useState<MultiSelectOption[]>([])
  const [capabilities, setCapabilities] = useState<MultiSelectOption[]>([])
  const [selectedCapabilities, setSelectedCapabilities] = useState<MultiSelectOption[]>([])
  const [selectedStackStatus, setSelectedStackStatus] = useState<MultiSelectOption[]>([])
  const [awsRef, setAwsRef] = useState(get(allValues, 'spec.configuration.connectorRef'))

  useEffect(() => {
    /* istanbul ignore next */
    if (selectedCapabilities.length > 0) {
      formik?.setFieldValue(
        `${path}.spec.configuration.capabilities`,
        map(selectedCapabilities, cap => cap.value)
      )
    }
  }, [selectedCapabilities])

  useEffect(() => {
    /* istanbul ignore next */
    if (selectedStackStatus.length > 0) {
      formik?.setFieldValue(
        `${path}.spec.configuration.skipOnStackStatuses`,
        map(selectedStackStatus, status => status.value)
      )
    }
  }, [selectedStackStatus])

  const capabilitiesRequired = isRuntime(inputSetData?.template?.spec?.configuration?.capabilities as string)
  const { data: capabilitiesData, refetch: getAwsCapabilities } = useCFCapabilitiesForAws({ lazy: true })

  useEffect(() => {
    if (capabilitiesData) {
      const capabilitiesValues = map(capabilitiesData?.data, cap => ({ label: cap, value: cap }))
      setCapabilities(capabilitiesValues as MultiSelectOption[])
    }

    /* istanbul ignore next */
    if (!capabilitiesData && capabilitiesRequired) {
      getAwsCapabilities()
    }
  }, [capabilitiesData, capabilitiesRequired])

  const awsStatusRequired = isRuntime(inputSetData?.template?.spec?.configuration?.skipOnStackStatuses as string)
  const { data: awsStatusData, refetch: getAwsStatuses } = useCFStatesForAws({ lazy: true })

  useEffect(() => {
    if (awsStatusData) {
      const awsStatesValues = map(awsStatusData?.data, cap => ({ label: cap, value: cap }))
      setAwsStates(awsStatesValues as MultiSelectOption[])
    }

    /* istanbul ignore next */
    if (!awsStatusData && awsStatusRequired) {
      getAwsStatuses()
    }
  }, [awsStatusData, awsStatusRequired])

  const {
    data: regionData,
    loading: regionsLoading,
    refetch: getRegions,
    error
  } = useListAwsRegions({
    lazy: true,
    queryParams: {
      accountId
    }
  })

  useEffect(() => {
    if (error) {
      /* istanbul ignore next */
      showError(error?.message)
    }
  }, [error])

  const regionRequired = isRuntime(inputSetData?.template?.spec?.configuration?.region as string)
  useEffect(() => {
    if (regionData) {
      const regionValues = map(regionData?.resource, reg => ({ label: reg.name, value: reg.value }))
      setRegions(regionValues as MultiSelectOption[])
    }

    if (!regionData && regionRequired) {
      /* istanbul ignore next */
      getRegions()
    }
  }, [regionData, regionRequired])

  const {
    data: roleData,
    refetch: getRoles,
    loading: rolesLoading
  } = useGetIamRolesForAws({
    lazy: true,
    debounce: 500,
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier: orgIdentifier,
      projectIdentifier: projectIdentifier,
      awsConnectorRef: awsRef as string
    }
  })

  const roleRequired = isRuntime(inputSetData?.template?.spec?.configuration?.roleArn as string)
  useEffect(() => {
    if (roleData) {
      const roles = []
      for (const key in roleData?.data) {
        roles.push({ label: roleData?.data[key], value: key })
      }
      setAwsRoles(roles)
    }
    /* istanbul ignore next */
    if (!roleData && roleRequired && awsRef) {
      getRoles()
    }
  }, [roleData, roleRequired, awsRef])

  return (
    <FormikForm>
      {
        /* istanbul ignore next */
        isRuntime(inputSetData?.template?.timeout as string) && (
          <div className={cx(stepCss.formGroup, stepCss.sm)}>
            <FormMultiTypeDurationField
              label={getString('pipelineSteps.timeoutLabel')}
              name={`${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}timeout`}
              disabled={readonly}
              multiTypeDurationProps={{
                enableConfigureOptions: false,
                allowableTypes,
                expressions,
                disabled: readonly
              }}
            />
          </div>
        )
      }
      {isRuntime(inputSetData?.template?.spec?.provisionerIdentifier as string) && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <FormInput.MultiTextInput
            name={`${path}.spec.provisionerIdentifier`}
            label={getString('pipelineSteps.provisionerIdentifier')}
            disabled={readonly}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
            data-testid={`${path}.spec.provisionerIdentifier`}
          />
        </div>
      )}
      {isRuntime(inputSetData?.template?.spec?.configuration?.connectorRef as string) && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <FormMultiTypeConnectorField
            label={<Text color={Color.GREY_900}>{getString('pipelineSteps.awsConnectorLabel')}</Text>}
            type={Connectors.AWS}
            name={`${path}.spec.configuration.connectorRef`}
            placeholder={getString('select')}
            accountIdentifier={accountId}
            projectIdentifier={projectIdentifier}
            orgIdentifier={orgIdentifier}
            style={{ marginBottom: 10 }}
            multiTypeProps={{ expressions, allowableTypes }}
            disabled={readonly}
            width={300}
            setRefValue
            onChange={(value: any, _unused, _notUsed) => {
              /* istanbul ignore next */
              setAwsRef(value?.record?.identifier || value)
              /* istanbul ignore next */
              formik?.setFieldValue(`${path}.spec.configuration.connectorRef`, value?.record?.identifier || value)
            }}
          />
        </div>
      )}
      {isRuntime(inputSetData?.template?.spec?.configuration?.region as string) && (
        <div className={cx(stepCss.formGroup, stepCss.sm)}>
          <FormInput.MultiTypeInput
            label={getString('regionLabel')}
            name={`${path}.spec.configuration.region`}
            placeholder={getString(regionsLoading ? 'common.loading' : 'pipeline.regionPlaceholder')}
            disabled={readonly}
            useValue
            multiTypeInputProps={{
              selectProps: {
                allowCreatingNewItems: true,
                items: regions ? regions : []
              },
              expressions,
              allowableTypes
            }}
            selectItems={regions ? regions : []}
          />
        </div>
      )}
      {inputSetData?.template?.spec?.configuration?.templateFile && <TemplateFileInputs {...props} />}
      {inputSetData?.template?.spec?.configuration?.parameters && <ParameterFileInputs {...props} />}
      {inputSetData?.template?.spec?.configuration?.parameterOverrides && <OverrideParameterFileInputs {...props} />}
      {isRuntime(inputSetData?.template?.spec?.configuration?.stackName as string) && (
        <div className={cx(stepCss.formGroup, stepCss.md)}>
          <FormInput.MultiTextInput
            name={`${path}.spec.configuration.stackName`}
            label={getString('cd.cloudFormation.stackName')}
            disabled={readonly}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
          />
        </div>
      )}
      {isRuntime(inputSetData?.template?.spec?.configuration?.roleArn as string) && (
        <div className={cx(stepCss.formGroup, stepCss.sm)}>
          <FormInput.MultiTypeInput
            label={getString('connectors.awsKms.roleArnLabel')}
            name={`${path}.spec.configuration.roleArn`}
            disabled={readonly}
            useValue
            placeholder={getString(rolesLoading ? 'common.loading' : 'select')}
            multiTypeInputProps={{
              selectProps: {
                allowCreatingNewItems: false,
                items: awsRoles
              },
              expressions,
              allowableTypes
            }}
            selectItems={awsRoles}
          />
        </div>
      )}
      {
        /* istanbul ignore next */
        isRuntime(inputSetData?.template?.spec?.configuration?.capabilities as string) && (
          <Layout.Vertical>
            <Label style={{ color: Color.GREY_900 }}>{getString('cd.cloudFormation.specifyCapabilities')}</Label>
            <MultiSelectTypeInput
              name={`${path}.spec.configuration.capabilities`}
              disabled={readonly}
              multiSelectProps={{
                items: capabilities,
                allowCreatingNewItems: false
              }}
              width={500}
              value={selectedCapabilities}
              onChange={values => {
                /* istanbul ignore next */
                setSelectedCapabilities(values as MultiSelectOption[])
              }}
              data-testid={`${path}.spec.configuration.capabilities`}
            />
          </Layout.Vertical>
        )
      }
      {inputSetData?.template?.spec?.configuration?.tags?.type === 'Remote' && <TagsInputs {...props} />}
      {
        /* istanbul ignore next */
        isRuntime((inputSetData?.template?.spec?.configuration?.tags as Tags)?.spec?.content) && (
          <div className={cx(stepCss.formGroup, stepCss.md)}>
            <MultiTypeFieldSelector
              name={`${path}.spec.configuration.tags.spec.content`}
              label={getString('tagsLabel')}
              defaultValueToReset=""
              allowedTypes={allowableTypes}
              skipRenderValueInExpressionLabel
              disabled={readonly}
              expressionRender={() => {
                /* istanbul ignore next */
                return (
                  <TFMonaco
                    name={`${path}.spec.configuration.tags.spec.content`}
                    formik={formik!}
                    expressions={expressions}
                    title={getString('tagsLabel')}
                  />
                )
              }}
            >
              <TFMonaco
                name={`${path}.spec.configuration.tags.spec.content`}
                formik={formik!}
                expressions={expressions}
                title={getString('tagsLabel')}
              />
            </MultiTypeFieldSelector>
          </div>
        )
      }
      {
        /* istanbul ignore next */
        isRuntime(inputSetData?.template?.spec?.configuration?.skipOnStackStatuses as string) && (
          <Layout.Vertical>
            <Label style={{ color: Color.GREY_900 }}>{getString('cd.cloudFormation.continueStatus')}</Label>
            <MultiSelectTypeInput
              name={`${path}.spec.configuration.skipOnStackStatuses`}
              disabled={readonly}
              multiSelectProps={{
                items: awsStatuses,
                allowCreatingNewItems: false
              }}
              width={500}
              value={selectedStackStatus}
              onChange={values => {
                /* istanbul ignore next */
                setSelectedStackStatus(values as MultiSelectOption[])
              }}
              data-testid={`${path}.spec.configuration.skipOnStackStatuses`}
            />
          </Layout.Vertical>
        )
      }
    </FormikForm>
  )
}

const CreateStackInputStep = connect(CreateStackInputStepRef)
export default CreateStackInputStep
