/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import {
  Accordion,
  Formik,
  FormikForm,
  FormInput,
  getMultiTypeFromValue,
  MultiTypeInputType
} from '@wings-software/uicore'
import * as Yup from 'yup'
import type { FormikProps } from 'formik'
import cx from 'classnames'
import { useParams } from 'react-router-dom'
import { defaultTo, isEmpty } from 'lodash-es'
import { setFormikRef, StepFormikFowardRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import {
  ServiceNowApprovalData,
  ServiceNowApprovalStepModeProps,
  ServiceNowFormContentInterface,
  ServiceNowTicketTypeSelectOption,
  resetForm
} from '@pipeline/components/PipelineSteps/Steps/ServiceNowApproval/types'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { useDeepCompareEffect, useQueryParams } from '@common/hooks'
import type {
  AccountPathProps,
  GitQueryParams,
  PipelinePathProps,
  PipelineType
} from '@common/interfaces/RouteInterfaces'

import { getNameAndIdentifierSchema } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import {
  FormMultiTypeDurationField,
  getDurationValidationSchema
} from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { isApprovalStepFieldDisabled } from '@pipeline/components/PipelineSteps/Steps/Common/ApprovalCommons'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import { ApprovalRejectionCriteriaType } from '@pipeline/components/PipelineSteps/Steps/Common/types'
import {
  useGetServiceNowIssueCreateMetadata,
  useGetServiceNowTicketTypes,
  ServiceNowFieldNG,
  ServiceNowTicketTypeDTO
} from 'services/cd-ng'
import {
  getApprovalRejectionCriteriaForInitialValues,
  getGenuineValue
} from '@pipeline/components/PipelineSteps/Steps/ServiceNowApproval/helper'
import { StringKeys, useStrings } from 'framework/strings'
import { ConnectorRefSchema } from '@common/utils/Validation'
import { ServiceNowApprovalRejectionCriteria } from './ServiceNowApprovalRejectionCriteria'
import css from '@pipeline/components/PipelineSteps/Steps/ServiceNowApproval/ServiceNowApproval.module.scss'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

const fetchingTicketTypesPlaceholder: StringKeys = 'pipeline.serviceNowApprovalStep.fetchingTicketTypesPlaceholder'

function FormContent({
  formik,
  isNewStep,
  readonly,
  allowableTypes,
  stepViewType,
  refetchServiceNowTicketTypes,
  fetchingServiceNowTicketTypes,
  serviceNowTicketTypesResponse,
  serviceNowMetadataResponse,
  serviceNowTicketTypesFetchError,
  refetchServiceNowMetadata
}: ServiceNowFormContentInterface): JSX.Element {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const { accountId, projectIdentifier, orgIdentifier } =
    useParams<PipelineType<PipelinePathProps & AccountPathProps>>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const [ticketFieldList, setTicketFieldList] = useState<ServiceNowFieldNG[]>([])
  const [count, setCount] = React.useState(0)
  const [serviceNowTicketTypesOptions, setServiceNowTicketTypesOptions] = useState<ServiceNowTicketTypeSelectOption[]>(
    []
  )
  const [connectorValueType, setConnectorValueType] = useState<MultiTypeInputType>(MultiTypeInputType.FIXED)
  const commonParams = {
    accountIdentifier: accountId,
    projectIdentifier,
    orgIdentifier,
    repoIdentifier,
    branch
  }
  const connectorRefFixedValue = getGenuineValue(formik.values.spec.connectorRef)
  const ticketTypeKeyFixedValue =
    getMultiTypeFromValue(formik.values.spec.ticketType) === MultiTypeInputType.FIXED &&
    !isEmpty(formik.values.spec.ticketType)
      ? formik.values.spec.ticketType
      : undefined

  useEffect(() => {
    if (ticketTypeKeyFixedValue && serviceNowMetadataResponse?.data) {
      setTicketFieldList(serviceNowMetadataResponse?.data)
    }
  }, [serviceNowMetadataResponse?.data, ticketTypeKeyFixedValue])

  useEffect(() => {
    if (connectorRefFixedValue && connectorValueType === MultiTypeInputType.FIXED) {
      refetchServiceNowTicketTypes({
        queryParams: {
          ...commonParams,
          connectorRef: connectorRefFixedValue.toString()
        }
      })
    }
  }, [connectorRefFixedValue])

  useDeepCompareEffect(() => {
    if (ticketTypeKeyFixedValue && connectorRefFixedValue) {
      refetchServiceNowMetadata({
        queryParams: {
          ...commonParams,
          connectorRef: connectorRefFixedValue.toString(),
          ticketType: ticketTypeKeyFixedValue.toString()
        }
      })
      const approvalCriteria = getApprovalRejectionCriteriaForInitialValues(formik.values.spec.approvalCriteria)
      formik.setFieldValue('spec.approvalCriteria', approvalCriteria)
      const rejectionCriteria = getApprovalRejectionCriteriaForInitialValues(formik.values.spec.rejectionCriteria)
      formik.setFieldValue('spec.rejectionCriteria', rejectionCriteria)
    }
  }, [serviceNowTicketTypesOptions, ticketTypeKeyFixedValue])

  useEffect(() => {
    // Set ticket types
    let options: ServiceNowTicketTypeSelectOption[] = []
    const ticketTypesResponseList: ServiceNowTicketTypeDTO[] = serviceNowTicketTypesResponse?.data || []
    options = ticketTypesResponseList.map((ticketType: ServiceNowTicketTypeDTO) => ({
      label: defaultTo(ticketType.name, ''),
      value: defaultTo(ticketType.key, ''),
      key: defaultTo(ticketType.key, '')
    }))
    setServiceNowTicketTypesOptions(options)
  }, [serviceNowTicketTypesResponse?.data])

  return (
    <React.Fragment>
      {stepViewType !== StepViewType.Template && (
        <div className={cx(stepCss.formGroup, stepCss.lg)}>
          <FormInput.InputWithIdentifier
            inputLabel={getString('name')}
            isIdentifierEditable={isNewStep}
            inputGroupProps={{
              placeholder: getString('pipeline.stepNamePlaceholder'),
              disabled: isApprovalStepFieldDisabled(readonly)
            }}
          />
        </div>
      )}

      <div className={cx(stepCss.formGroup, stepCss.sm)}>
        <FormMultiTypeDurationField
          name="timeout"
          label={getString('pipelineSteps.timeoutLabel')}
          disabled={isApprovalStepFieldDisabled(readonly)}
          multiTypeDurationProps={{
            expressions,
            enableConfigureOptions: false,
            allowableTypes
          }}
        />
        {getMultiTypeFromValue(formik.values.timeout) === MultiTypeInputType.RUNTIME && (
          <ConfigureOptions
            value={defaultTo(formik.values.timeout, '')}
            type="String"
            variableName="timeout"
            showRequiredField={false}
            showDefaultField={false}
            showAdvanced={true}
            onChange={value => formik.setFieldValue('timeout', value)}
            isReadonly={readonly}
          />
        )}
      </div>

      <div className={stepCss.divider} />

      <div className={cx(stepCss.formGroup, stepCss.lg)}>
        <FormMultiTypeConnectorField
          name="spec.connectorRef"
          label={getString('pipeline.serviceNowApprovalStep.connectorRef')}
          width={390}
          className={css.connector}
          connectorLabelClass={css.connectorLabel}
          placeholder={getString('select')}
          accountIdentifier={accountId}
          projectIdentifier={projectIdentifier}
          orgIdentifier={orgIdentifier}
          multiTypeProps={{ expressions, allowableTypes }}
          setRefValue
          type="ServiceNow"
          enableConfigureOptions={false}
          selected={formik?.values?.spec.connectorRef as string}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onChange={(value: any, _unused, multiType) => {
            // Clear dependent fields
            setConnectorValueType(multiType)
            if (value?.record?.identifier !== connectorRefFixedValue) {
              resetForm(formik, 'connectorRef')
              setCount(count + 1)
              if (multiType !== MultiTypeInputType.FIXED) {
                setServiceNowTicketTypesOptions([])
                setTicketFieldList([])
              }
            }
          }}
          disabled={isApprovalStepFieldDisabled(readonly)}
          gitScope={{ repo: defaultTo(repoIdentifier, ''), branch, getDefaultFromOtherRepo: true }}
        />
        {getMultiTypeFromValue(formik.values.spec.connectorRef) === MultiTypeInputType.RUNTIME && (
          <ConfigureOptions
            style={{ marginTop: 14 }}
            value={formik.values.spec.connectorRef as string}
            type="String"
            variableName="spec.connectorRef"
            showRequiredField={false}
            showDefaultField={false}
            showAdvanced={true}
            onChange={value => formik.setFieldValue('spec.connectorRef', value)}
            isReadonly={readonly}
          />
        )}
      </div>
      <React.Fragment key={count}>
        <div className={cx(stepCss.formGroup, stepCss.lg)}>
          <FormInput.MultiTypeInput
            tooltipProps={{
              dataTooltipId: 'serviceNowApprovalTicketType'
            }}
            selectItems={
              fetchingServiceNowTicketTypes
                ? [{ label: getString(fetchingTicketTypesPlaceholder), value: '' }]
                : serviceNowTicketTypesOptions
            }
            label={getString('pipeline.serviceNowApprovalStep.ticketType')}
            name="spec.ticketType"
            placeholder={
              fetchingServiceNowTicketTypes
                ? getString(fetchingTicketTypesPlaceholder)
                : serviceNowTicketTypesFetchError?.message
                ? serviceNowTicketTypesFetchError?.message
                : getString('select')
            }
            useValue
            disabled={isApprovalStepFieldDisabled(readonly, fetchingServiceNowTicketTypes)}
            multiTypeInputProps={{
              selectProps: {
                addClearBtn: true,
                items: fetchingServiceNowTicketTypes
                  ? [{ label: getString(fetchingTicketTypesPlaceholder), value: '' }]
                  : serviceNowTicketTypesOptions
              },
              allowableTypes,
              expressions,
              onChange: (value: unknown, _valueType, type) => {
                // Clear dependent fields
                if (
                  type === MultiTypeInputType.FIXED &&
                  !isEmpty(value) &&
                  (value as ServiceNowTicketTypeSelectOption) !== ticketTypeKeyFixedValue
                ) {
                  resetForm(formik, 'ticketType')
                  setCount(count + 1)
                }
              }
            }}
          />
        </div>
        <div className={cx(stepCss.formGroup, stepCss.lg)}>
          <FormInput.MultiTextInput
            tooltipProps={{
              dataTooltipId: 'serviceNowApprovalTicketNumber'
            }}
            label={getString('pipeline.serviceNowApprovalStep.issueNumber')}
            name="spec.ticketNumber"
            placeholder={getString('pipeline.serviceNowApprovalStep.issueNumberPlaceholder')}
            disabled={isApprovalStepFieldDisabled(readonly)}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
          />
          {getMultiTypeFromValue(formik.values.spec.ticketNumber) === MultiTypeInputType.RUNTIME && (
            <ConfigureOptions
              value={formik.values.spec.ticketNumber}
              type="String"
              variableName="spec.ticketNumber"
              showRequiredField={false}
              showDefaultField={false}
              showAdvanced={true}
              onChange={value => formik.setFieldValue('spec.ticketNumber', value)}
              isReadonly={readonly}
            />
          )}
        </div>
        <ServiceNowApprovalRejectionCriteria
          fieldList={ticketFieldList}
          title={getString('pipeline.approvalCriteria.approvalCriteria')}
          isFetchingFields={false}
          mode="approvalCriteria"
          values={formik.values.spec.approvalCriteria}
          onChange={values => formik.setFieldValue('spec.approvalCriteria', values)}
          formik={formik}
          readonly={readonly}
        />
      </React.Fragment>
      <div className={stepCss.noLookDivider} />
      <Accordion className={stepCss.accordion}>
        <Accordion.Panel
          id="optional-config"
          summary={getString('common.optionalConfig')}
          details={
            <ServiceNowApprovalRejectionCriteria
              fieldList={ticketFieldList}
              title={getString('pipeline.approvalCriteria.rejectionCriteria')}
              isFetchingFields={false}
              mode="rejectionCriteria"
              values={formik.values.spec.rejectionCriteria}
              onChange={values => formik.setFieldValue('spec.rejectionCriteria', values)}
              formik={formik}
              readonly={readonly}
            />
          }
        />
      </Accordion>
    </React.Fragment>
  )
}
function ServiceNowApprovalStepMode(
  props: ServiceNowApprovalStepModeProps,
  formikRef: StepFormikFowardRef<ServiceNowApprovalData>
): JSX.Element {
  const { onUpdate, readonly, isNewStep, allowableTypes, stepViewType, onChange } = props
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } =
    useParams<PipelineType<PipelinePathProps & AccountPathProps & GitQueryParams>>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const commonParams = {
    accountIdentifier: accountId,
    projectIdentifier,
    orgIdentifier,
    branch,
    repoIdentifier
  }
  const {
    refetch: refetchServiceNowTicketTypes,
    data: serviceNowTicketTypesResponse,
    error: serviceNowTicketTypesFetchError,
    loading: fetchingServiceNowTicketTypes
  } = useGetServiceNowTicketTypes({
    lazy: true,
    queryParams: {
      ...commonParams,
      connectorRef: ''
    }
  })

  const {
    refetch: refetchServiceNowMetadata,
    data: serviceNowMetadataResponse,
    error: serviceNowMetadataFetchError,
    loading: fetchingServiceNowMetadata
  } = useGetServiceNowIssueCreateMetadata({
    lazy: true,
    queryParams: {
      ...commonParams,
      connectorRef: ''
    }
  })
  return (
    <Formik<ServiceNowApprovalData>
      onSubmit={values => onUpdate?.(values)}
      formName="serviceNowApproval"
      initialValues={props.initialValues}
      validate={data => {
        onChange?.(data)
      }}
      validationSchema={Yup.object().shape({
        ...getNameAndIdentifierSchema(getString, stepViewType),
        timeout: getDurationValidationSchema({ minimum: '10s' }).required(getString('validation.timeout10SecMinimum')),
        spec: Yup.object().shape({
          connectorRef: ConnectorRefSchema({
            requiredErrorMsg: getString('pipeline.serviceNowApprovalStep.validations.connectorRef')
          }),
          ticketType: Yup.string().required(getString('pipeline.serviceNowApprovalStep.validations.ticketType')),
          ticketNumber: Yup.string().required(getString('pipeline.serviceNowApprovalStep.validations.issueNumber')),
          approvalCriteria: Yup.object().shape({
            spec: Yup.object().when('type', {
              is: ApprovalRejectionCriteriaType.KeyValues,
              then: Yup.object().shape({
                conditions: Yup.array().required(
                  getString('pipeline.approvalCriteria.validations.approvalCriteriaCondition')
                )
              }),
              otherwise: Yup.object().shape({
                expression: Yup.string().trim().required(getString('pipeline.approvalCriteria.validations.expression'))
              })
            })
          })
        })
      })}
    >
      {(formik: FormikProps<ServiceNowApprovalData>) => {
        setFormikRef(formikRef, formik)
        return (
          <FormikForm>
            <FormContent
              formik={formik}
              allowableTypes={allowableTypes}
              stepViewType={stepViewType}
              readonly={readonly}
              isNewStep={isNewStep}
              refetchServiceNowTicketTypes={refetchServiceNowTicketTypes}
              fetchingServiceNowTicketTypes={fetchingServiceNowTicketTypes}
              serviceNowTicketTypesResponse={serviceNowTicketTypesResponse}
              serviceNowTicketTypesFetchError={serviceNowTicketTypesFetchError}
              refetchServiceNowMetadata={refetchServiceNowMetadata}
              fetchingServiceNowMetadata={fetchingServiceNowMetadata}
              serviceNowMetadataResponse={serviceNowMetadataResponse}
              serviceNowMetadataFetchError={serviceNowMetadataFetchError}
            />
          </FormikForm>
        )
      }}
    </Formik>
  )
}
const ServiceNowApprovalStepModeWithRef = React.forwardRef(ServiceNowApprovalStepMode)
export default ServiceNowApprovalStepModeWithRef
