/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useRef } from 'react'
import { defaultTo, noop } from 'lodash-es'
import * as Yup from 'yup'
import type { FormikContextType } from 'formik'
import { useParams } from 'react-router-dom'
import { Formik, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { PageSpinner } from '@common/components'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import type { ChangeSourceDTO } from 'services/cv'
import type { TemplateFormRef } from '@templates-library/components/TemplateStudio/TemplateStudio'
import { useDrawer } from '@cv/hooks/useDrawerHook/useDrawerHook'
import { ChangeSourceDrawer } from '@cv/pages/ChangeSource/ChangeSourceDrawer/ChangeSourceDrawer'
import SaveAndDiscardButton from '@cv/components/SaveAndDiscardButton/SaveAndDiscardButton'
import HealthSourceTableContainer from './components/HealthSourceTableContainer/HealthSourceTableContainer'
import type { MonitoredServiceForm } from './Service.types'
import MonitoredServiceOverview from './components/MonitoredServiceOverview/MonitoredServiceOverview'
import { onSave, updateMonitoredServiceDTOOnTypeChange } from './Service.utils'
import { getImperativeHandleRef, isUpdated } from '../../Configurations.utils'
import ChangeSourceTableContainer from './components/ChangeSourceTableContainer/ChangeSourceTableContainer'
import MonitoredServiceNotificationsContainer from './components/MonitoredServiceNotificationsContainer/MonitoredServiceNotificationsContainer'
import css from './Service.module.scss'

function Service(
  {
    value: initialValues,
    onSuccess,
    cachedInitialValues,
    setDBData,
    onDiscard,
    serviceTabformRef,
    onChangeMonitoredServiceType,
    isTemplate,
    updateTemplate
  }: {
    value: MonitoredServiceForm
    onSuccess: (val: any) => Promise<void>
    cachedInitialValues?: MonitoredServiceForm | null
    setDBData?: (val: MonitoredServiceForm) => void
    onDiscard?: () => void
    serviceTabformRef?: any
    onChangeMonitoredServiceType: (updatedValues: MonitoredServiceForm) => void
    isTemplate?: boolean
    updateTemplate?: (template: MonitoredServiceForm) => void
  },
  formikRef?: TemplateFormRef
): JSX.Element {
  const { getString } = useStrings()
  const { projectIdentifier, identifier } = useParams<ProjectPathProps & { identifier: string }>()
  const isEdit = !!identifier
  const ref = useRef<any | null>()

  React.useImperativeHandle(getImperativeHandleRef(isTemplate, formikRef), () => ({
    resetForm() {
      return ref?.current?.resetForm()
    },
    submitForm() {
      return ref?.current?.submitForm()
    },
    getErrors() {
      return defaultTo(ref?.current.errors, {})
    }
  }))

  const updateChangeSource = useCallback(
    (data: any, formik: FormikContextType<MonitoredServiceForm>): void => {
      formik.setFieldValue('sources', {
        ...formik.values?.sources,
        changeSources: data
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isEdit]
  )

  const createChangeSourceDrawerHeader = useCallback(() => {
    return (
      <>
        <Text
          className={css.breadCrumbLink}
          icon={'arrow-left'}
          iconProps={{ color: Color.PRIMARY_7, margin: { right: 'small' } }}
          color={Color.PRIMARY_7}
          onClick={() => hideDrawer()}
        >
          {getString('cv.healthSource.backtoMonitoredService')}
        </Text>
        <div className="ng-tooltip-native">
          <p>{isEdit ? getString('cv.changeSource.editChangeSource') : getString('cv.changeSource.addChangeSource')}</p>
        </div>
      </>
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit])

  const { showDrawer, hideDrawer } = useDrawer({
    createHeader: createChangeSourceDrawerHeader,
    createDrawerContent: props => <ChangeSourceDrawer {...props} />
  })

  const openChangeSourceDrawer = useCallback(
    async ({
      formik,
      onSuccessChangeSource
    }: {
      formik: FormikContextType<MonitoredServiceForm>
      onSuccessChangeSource: (data: ChangeSourceDTO[]) => void
    }) => {
      // has required fields
      if (formik?.values.environmentRef && formik?.values.serviceRef && formik?.values.name) {
        showDrawer({
          hideDrawer,
          tableData: formik?.values?.sources?.changeSources || [],
          onSuccess: onSuccessChangeSource,
          monitoredServiceType: formik.values.type
        })
      } else {
        formik.submitForm()
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  return (
    <Formik<MonitoredServiceForm>
      formName="MonitoredServiceForm"
      initialValues={cachedInitialValues || initialValues}
      onSubmit={noop}
      validationSchema={Yup.object().shape({
        name: Yup.string().nullable().required(getString('cv.monitoredServices.nameValidation')),
        type: Yup.string().nullable().required(getString('common.validation.typeIsRequired')),
        serviceRef: Yup.string().nullable().required(getString('cv.monitoredServices.serviceValidation')),
        environmentRef: Yup.string().nullable().required(getString('cv.monitoredServices.environmentValidation'))
      })}
      enableReinitialize
    >
      {formik => {
        serviceTabformRef.current = formik
        ref.current = formik
        const { serviceRef, environmentRef } = formik.values
        if (formik.dirty && !isTemplate) {
          setDBData?.(formik.values)
        }
        const onSuccessChangeSource = (data: ChangeSourceDTO[]): void => {
          updateChangeSource(data, formik)
          hideDrawer()
        }
        if (isTemplate && formik.dirty) {
          updateTemplate?.(formik.values)
        }

        return (
          <div>
            {isEdit && !(serviceRef && environmentRef) ? (
              <PageSpinner />
            ) : (
              <>
                {!isTemplate && (
                  <div className={css.saveDiscardButton}>
                    <SaveAndDiscardButton
                      isUpdated={isUpdated(formik.dirty, initialValues, cachedInitialValues)}
                      onSave={() => onSave({ formik, onSuccess })}
                      onDiscard={() => {
                        formik.resetForm()
                        onDiscard?.()
                      }}
                      RbacPermission={{
                        permission: PermissionIdentifier.EDIT_MONITORED_SERVICE,
                        resource: {
                          resourceType: ResourceType.MONITOREDSERVICE,
                          resourceIdentifier: projectIdentifier
                        }
                      }}
                    />
                  </div>
                )}
                <MonitoredServiceOverview
                  formikProps={formik}
                  isEdit={isEdit}
                  isTemplate={isTemplate}
                  onChangeMonitoredServiceType={type => {
                    if (type === formik.values.type) {
                      return
                    }
                    formik.setFieldValue('type', type)
                    onChangeMonitoredServiceType({
                      isEdit,
                      ...updateMonitoredServiceDTOOnTypeChange(type, formik.values)
                    })
                  }}
                />
                <Text color={Color.BLACK} className={css.sourceTableLabel}>
                  {getString('cv.healthSource.defineYourSource')}
                </Text>
                <ChangeSourceTableContainer
                  onEdit={values => {
                    showDrawer({ ...values, hideDrawer })
                  }}
                  onAddNewChangeSource={() => openChangeSourceDrawer({ formik, onSuccessChangeSource })}
                  value={formik?.values?.sources?.changeSources || []}
                  onSuccess={onSuccessChangeSource}
                />
                <HealthSourceTableContainer
                  healthSourceListFromAPI={initialValues.sources?.healthSources}
                  serviceFormFormik={formik}
                  isTemplate={isTemplate}
                />
                <MonitoredServiceNotificationsContainer
                  setFieldValue={formik?.setFieldValue}
                  notificationRuleRefs={formik?.values?.notificationRuleRefs}
                  identifier={formik?.values?.identifier}
                />
              </>
            )}
          </div>
        )
      }}
    </Formik>
  )
}

export default Service
export const ServiceWithRef = React.forwardRef(Service)
