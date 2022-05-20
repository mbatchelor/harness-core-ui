/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  Button,
  ButtonSize,
  ButtonVariation,
  Formik,
  FormInput,
  getMultiTypeFromValue,
  Dialog,
  Layout,
  MultiTypeInputType,
  SelectOption
} from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import * as Yup from 'yup'
import { defaultTo, isEmpty, isNil, noop, omit } from 'lodash-es'
import { useParams } from 'react-router-dom'
import type { FormikProps } from 'formik'
import { ServiceRequestDTO, ServiceYaml, useGetServiceList } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import type { PipelineType } from '@common/interfaces/RouteInterfaces'
import { useToaster } from '@common/exports'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'

import { usePermission } from '@rbac/hooks/usePermission'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { DeployTabs } from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'
import { getServiceRefSchema } from '@cd/components/PipelineSteps/PipelineStepsUtil'
import type { DeployServiceData, DeployServiceProps, DeployServiceState } from './DeployServiceInterface'
import { flexStart, isEditService } from './DeployServiceUtils'
import { NewEditServiceModal } from './NewEditServiceModal'
import css from './DeployServiceStep.module.scss'

export const DeployServiceWidget: React.FC<DeployServiceProps> = ({
  initialValues,
  onUpdate,
  readonly,
  allowableTypes,
  serviceLabel
}): JSX.Element => {
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<
    PipelineType<{
      orgIdentifier: string
      projectIdentifier: string
      pipelineIdentifier: string
      accountId: string
    }>
  >()

  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const {
    data: serviceResponse,
    error,
    loading
  } = useGetServiceList({
    queryParams: { accountIdentifier: accountId, orgIdentifier, projectIdentifier }
  })

  const { expressions } = useVariablesExpression()

  const [services, setService] = React.useState<ServiceYaml[]>()
  const [selectOptions, setSelectOptions] = React.useState<SelectOption[]>()

  const [state, setState] = React.useState<DeployServiceState>({ isEdit: false, isService: false })

  const updateServicesList = (value: ServiceRequestDTO): void => {
    formikRef.current?.setValues({ serviceRef: value.identifier, ...(state.isService && { service: {} }) })
    if (!isNil(services)) {
      const newService = {
        description: value.description,
        identifier: defaultTo(value.identifier, ''),
        name: value.name || '',
        tags: value.tags
      }
      const newServicesList = [...services]
      const existingIndex = newServicesList.findIndex(item => item.identifier === value.identifier)
      if (existingIndex >= 0) {
        newServicesList.splice(existingIndex, 1, newService)
      } else {
        newServicesList.unshift(newService)
      }
      setService(newServicesList)
    }
  }

  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        onClose={onClose}
        title={state.isEdit ? getString('editService') : getString('newService')}
      >
        <NewEditServiceModal
          data={{
            name: defaultTo(state.data?.name, ''),
            identifier: defaultTo(state.data?.identifier, ''),
            orgIdentifier,
            projectIdentifier,
            ...state.data
          }}
          isEdit={state.isEdit}
          isService={state.isService}
          onCreateOrUpdate={value => {
            updateServicesList(value)
            onClose.call(null)
          }}
          closeModal={onClose}
        />
      </Dialog>
    ),
    [state]
  )

  const onClose = React.useCallback(() => {
    setState({ isEdit: false, isService: false })
    hideModal()
  }, [hideModal])

  React.useEffect(() => {
    if (!isNil(selectOptions) && initialValues.serviceRef) {
      if (getMultiTypeFromValue(initialValues.serviceRef) === MultiTypeInputType.FIXED) {
        const doesExist = selectOptions.filter(service => service.value === initialValues.serviceRef).length > 0
        if (!doesExist) {
          if (!readonly) {
            formikRef.current?.setFieldValue('serviceRef', '')
          } else {
            const options = [...selectOptions]
            options.push({
              label: initialValues.serviceRef,
              value: initialValues.serviceRef
            })
            setSelectOptions(options)
          }
        }
      }
    }
  }, [selectOptions])

  React.useEffect(() => {
    if (!isNil(services)) {
      setSelectOptions(
        services.map(service => {
          return { label: service.name, value: service.identifier }
        })
      )
    }
  }, [services])

  React.useEffect(() => {
    if (!loading) {
      const serviceList: ServiceYaml[] = []
      if (serviceResponse?.data?.content?.length) {
        serviceResponse.data.content.forEach(service => {
          serviceList.push({
            description: service.service?.description,
            identifier: service.service?.identifier || '',
            name: service.service?.name || '',
            tags: service.service?.tags
          })
        })
      }
      if (initialValues.service) {
        const identifier = initialValues.service.identifier
        const isExist = serviceList.filter(service => service.identifier === identifier).length > 0
        if (initialValues.service && identifier && !isExist) {
          serviceList.push({
            description: initialValues.service?.description,
            identifier: initialValues.service?.identifier || '',
            name: initialValues.service?.name || '',
            tags: initialValues.service?.tags
          })
        }
      }
      setService(serviceList)
    }
  }, [loading, serviceResponse, serviceResponse?.data?.content?.length])

  if (error?.message) {
    showError(getRBACErrorMessage(error), undefined, 'cd.svc.list.error')
  }

  const [canEdit] = usePermission({
    resource: {
      resourceType: ResourceType.SERVICE,
      resourceIdentifier: services ? (services[0]?.identifier as string) : ''
    },
    permissions: [PermissionIdentifier.EDIT_SERVICE],
    options: {
      skipCondition: ({ resourceIdentifier }) => !resourceIdentifier
    }
  })

  const [canCreate] = usePermission({
    resource: {
      resourceType: ResourceType.SERVICE
    },
    permissions: [PermissionIdentifier.EDIT_SERVICE]
  })

  const { subscribeForm, unSubscribeForm } = React.useContext(StageErrorContext)

  const formikRef = React.useRef<FormikProps<unknown> | null>(null)

  React.useEffect(() => {
    subscribeForm({ tab: DeployTabs.SERVICE, form: formikRef })
    return () => unSubscribeForm({ tab: DeployTabs.SERVICE, form: formikRef })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const serviceRef = initialValues?.service?.identifier || initialValues?.serviceRef

  const [type, setType] = React.useState<MultiTypeInputType>(getMultiTypeFromValue(serviceRef))

  return (
    <>
      <Formik<DeployServiceData>
        formName="deployServiceStepForm"
        onSubmit={noop}
        validate={values => {
          if (!isEmpty(values.service)) {
            onUpdate?.({ ...omit(values, 'serviceRef') })
          } else {
            onUpdate?.({ ...omit(values, 'service'), serviceRef: values.serviceRef })
          }
        }}
        initialValues={{
          ...initialValues,
          ...{ serviceRef }
        }}
        validationSchema={Yup.object().shape({
          serviceRef: getServiceRefSchema(getString)
        })}
      >
        {formik => {
          window.dispatchEvent(new CustomEvent('UPDATE_ERRORS_STRIP', { detail: DeployTabs.SERVICE }))
          formikRef.current = formik as FormikProps<unknown> | null
          const { values, setFieldValue } = formik
          return (
            <Layout.Horizontal
              className={css.formRow}
              spacing="medium"
              flex={{ alignItems: flexStart, justifyContent: flexStart }}
            >
              <FormInput.MultiTypeInput
                tooltipProps={{ dataTooltipId: 'specifyYourService' }}
                label={serviceLabel ? serviceLabel : getString('cd.pipelineSteps.serviceTab.specifyYourService')}
                name="serviceRef"
                useValue
                disabled={readonly || (type === MultiTypeInputType.FIXED && loading)}
                placeholder={loading ? getString('loading') : getString('cd.pipelineSteps.serviceTab.selectService')}
                multiTypeInputProps={{
                  onTypeChange: setType,
                  width: 300,
                  expressions,
                  onChange: val => {
                    if (values.service?.identifier && (val as SelectOption).value !== values.service.identifier) {
                      setService(services?.filter(service => service.identifier !== values.service?.identifier))
                      setFieldValue('service', undefined)
                    }
                  },
                  selectProps: {
                    disabled: loading,
                    addClearBtn: true && !readonly,
                    items: selectOptions || []
                  },
                  allowableTypes
                }}
                selectItems={selectOptions || []}
              />
              {type === MultiTypeInputType.FIXED ? (
                <Button
                  size={ButtonSize.SMALL}
                  variation={ButtonVariation.LINK}
                  disabled={readonly || (isEditService(values) ? !canEdit : !canCreate)}
                  onClick={() => {
                    const isEdit = isEditService(values)
                    if (isEdit) {
                      if (values.service?.identifier) {
                        setState({
                          isEdit,
                          formik,
                          isService: true,
                          data: values.service
                        })
                      } else {
                        setState({
                          isEdit,
                          formik,
                          isService: false,
                          data: services?.find(service => service.identifier === values.serviceRef)
                        })
                      }
                    } else {
                      setState({
                        isEdit: false,
                        formik,
                        isService: false
                      })
                    }
                    showModal()
                  }}
                  text={
                    isEditService(values)
                      ? getString('editService')
                      : getString('cd.pipelineSteps.serviceTab.plusNewService')
                  }
                  id={isEditService(initialValues) ? 'edit-service' : 'add-new-service'}
                />
              ) : null}
            </Layout.Horizontal>
          )
        }}
      </Formik>
    </>
  )
}
