/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { TabId } from '@blueprintjs/core'
import type { FormikProps } from 'formik'
import { isEqual } from 'lodash-es'
import type { MutateMethod } from 'restful-react'
import type {
  MonitoredServiceDTO,
  RestResponseMonitoredServiceResponse,
  SaveMonitoredServiceQueryParams,
  UpdateMonitoredServicePathParams,
  UpdateMonitoredServiceQueryParams
} from 'services/cv'
import type { UseStringsReturn } from 'framework/strings'
import { CVObjectStoreNames } from '@cv/hooks/IndexedDBHook/IndexedDBHook'
import type { TemplateFormRef } from '@templates-library/components/TemplateStudio/TemplateStudio'
import type { MonitoredServiceForm } from './components/Service/Service.types'

export const isUpdated = (
  dirty: boolean,
  value: MonitoredServiceForm,
  cachedInitialValues: MonitoredServiceForm | null | undefined
): boolean => {
  if (dirty) {
    return true
  } else if (cachedInitialValues) {
    return !isEqual(cachedInitialValues, value)
  } else {
    return false
  }
}

export const determineUnSaveState = ({
  cachedInitialValues,
  initialValues,
  selectedTabID,
  isExactPath,
  serviceTabformRef,
  dependencyTabformRef,
  overrideBlockNavigation,
  getString
}: {
  cachedInitialValues: MonitoredServiceForm | null
  initialValues: MonitoredServiceForm
  selectedTabID: string
  overrideBlockNavigation: boolean
  isExactPath: boolean
  serviceTabformRef: React.MutableRefObject<FormikProps<MonitoredServiceForm> | null>
  dependencyTabformRef: React.MutableRefObject<FormikProps<MonitoredServiceForm> | null>
  getString: UseStringsReturn['getString']
}): boolean => {
  if (overrideBlockNavigation) {
    return false
  } else if (isExactPath) {
    return false
  } else if (!cachedInitialValues) {
    if (selectedTabID === getString('pipelines-studio.dependenciesGroupTitle')) {
      return !!dependencyTabformRef?.current?.dirty
    }
    return !!serviceTabformRef?.current?.dirty
  } else {
    return !isEqual(cachedInitialValues, initialValues)
  }
}

export const onTabChange = async ({
  nextTab,
  getString,
  selectedTabID,
  dbInstance,
  serviceTabformRef,
  dependencyTabformRef,
  setselectedTabID,
  setCachedInitialValue
}: {
  nextTab: TabId
  selectedTabID: string
  dbInstance: any
  serviceTabformRef: React.MutableRefObject<FormikProps<MonitoredServiceForm> | null>
  dependencyTabformRef: React.MutableRefObject<FormikProps<MonitoredServiceForm> | null>
  setselectedTabID: (value: React.SetStateAction<string>) => void
  setCachedInitialValue: (value: React.SetStateAction<MonitoredServiceForm | null>) => void
  getString: UseStringsReturn['getString']
}): Promise<void> => {
  //TODO:  This is temporary fix, need to be fixed in dependency tab
  if (selectedTabID !== getString('service')) {
    setselectedTabID(nextTab as string)
  }
  const tabRef = selectedTabID === getString('service') ? serviceTabformRef : dependencyTabformRef
  const validResponse = await tabRef?.current?.validateForm()
  if (validResponse && !Object.keys(validResponse).length) {
    setselectedTabID(nextTab as string)
    const data = await dbInstance?.get(CVObjectStoreNames.MONITORED_SERVICE, 'monitoredService')
    setCachedInitialValue(data?.currentData)
  } else {
    tabRef?.current?.submitForm()
  }
}
export interface ExtendedMonitoredServiceDTO extends MonitoredServiceDTO {
  environmentRefList?: string[]
}

export const onSubmit = async ({
  formikValues,
  identifier,
  orgIdentifier,
  projectIdentifier,
  cachedInitialValues,
  updateMonitoredService,
  saveMonitoredService,
  fetchMonitoredService,
  setOverrideBlockNavigation
}: {
  formikValues: MonitoredServiceForm
  identifier: string
  orgIdentifier: string
  projectIdentifier: string
  cachedInitialValues: MonitoredServiceForm | null
  updateMonitoredService: MutateMethod<
    RestResponseMonitoredServiceResponse,
    ExtendedMonitoredServiceDTO,
    UpdateMonitoredServiceQueryParams,
    UpdateMonitoredServicePathParams
  >
  saveMonitoredService: MutateMethod<
    RestResponseMonitoredServiceResponse,
    ExtendedMonitoredServiceDTO,
    SaveMonitoredServiceQueryParams,
    void
  >
  fetchMonitoredService: () => void
  setOverrideBlockNavigation: (value: React.SetStateAction<boolean>) => void
}): Promise<void> => {
  const {
    serviceRef,
    environmentRef,
    identifier: monitoredServiceId,
    name,
    description,
    tags,
    sources = {},
    dependencies = [],
    type,
    notificationRuleRefs
  } = formikValues
  const payload: ExtendedMonitoredServiceDTO = {
    orgIdentifier,
    projectIdentifier,
    serviceRef,
    environmentRef,
    identifier: monitoredServiceId,
    notificationRuleRefs,
    name,
    description,
    tags,
    sources,
    dependencies: cachedInitialValues?.dependencies || dependencies,
    type
  }
  if (Array.isArray(environmentRef)) {
    payload.environmentRef = environmentRef?.[0]
    payload.environmentRefList = environmentRef
  }
  if (identifier) {
    await updateMonitoredService(payload)
    fetchMonitoredService()
  } else {
    await saveMonitoredService(payload)
    setOverrideBlockNavigation(true)
  }
}

export const getImperativeHandleRef = (isTemplate?: boolean, formikRef?: TemplateFormRef): TemplateFormRef => {
  const defaultRef = { current: {} } as TemplateFormRef
  if (!isTemplate || !formikRef) {
    return defaultRef
  }
  return isTemplate ? formikRef : defaultRef
}
