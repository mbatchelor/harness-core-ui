/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext, useMemo } from 'react'
import { omit } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { useToaster } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import {
  MonitoredServiceDTO,
  MonitoredServiceResponse,
  useSaveMonitoredService,
  useUpdateMonitoredService
} from 'services/cv'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import { BGColorWrapper } from '@cv/pages/health-source/common/StyledComponents'
import { SetupSourceTabsContext } from '@cv/components/CVSetupSourcesView/SetupSourceTabs/SetupSourceTabs'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { LoadSourceByType, createHealthsourceList } from './CustomiseHealthSource.utils'
import type { SourceDataInterface, UpdatedHealthSource } from '../../HealthSourceDrawerContent.types'
import { omitServiceEnvironmentKeys } from './CustomiseHealthSource.constant'

type ExcludedSourceDataKeys = 'isEdit' | 'serviceRef' | 'environmentRef' | 'monitoredServiceRef' | 'changeSources'

export default function CustomiseHealthSource({
  onSuccess,
  shouldRenderAtVerifyStep,
  isTemplate
}: {
  onSuccess: (data: MonitoredServiceResponse | UpdatedHealthSource) => void
  shouldRenderAtVerifyStep?: boolean
  isTemplate?: boolean
}): JSX.Element {
  const params = useParams<ProjectPathProps & { identifier: string }>()
  const { getString } = useStrings()
  const { showError, showSuccess } = useToaster()
  const { sourceData } = useContext(SetupSourceTabsContext)
  const { mutate: saveMonitoredService } = useSaveMonitoredService({
    queryParams: { accountId: params.accountId }
  })
  const { mutate: updateMonitoredService } = useUpdateMonitoredService({
    identifier: sourceData?.monitoredServiceRef?.identifier,
    queryParams: { accountId: params.accountId }
  })

  // Removing Service and Environment keys
  const filteredSourceData: Omit<SourceDataInterface, ExcludedSourceDataKeys> = useMemo(
    () => omit(sourceData, omitServiceEnvironmentKeys),
    [sourceData]
  )

  const isEdit = useMemo(
    () => params?.identifier || shouldRenderAtVerifyStep,
    [params?.identifier, shouldRenderAtVerifyStep]
  )

  const submitData = async (formdata: any, healthSourcePayload: UpdatedHealthSource): Promise<void> => {
    if (shouldRenderAtVerifyStep) {
      const healthSourceList = createHealthsourceList(formdata, healthSourcePayload)
      const { identifier, name, description = '', tags = {} } = formdata?.monitoredServiceRef || {}
      try {
        const payload: MonitoredServiceDTO = {
          orgIdentifier: params.orgIdentifier,
          projectIdentifier: params.projectIdentifier,
          serviceRef: sourceData.serviceRef,
          environmentRef: sourceData.environmentRef,
          ...(sourceData?.notificationRuleRefs && { notificationRuleRefs: sourceData?.notificationRuleRefs }),
          identifier: identifier?.trim(),
          name,
          description,
          tags,
          type: 'Application',
          sources: {
            healthSources: healthSourceList,
            changeSources: sourceData.changeSources
          }
        }
        // From verify step it will be always update call since monitored service will already be created.
        // This flow will be triggered only when user is adding health source to existing monitored service
        const postdatavalue = isEdit ? await updateMonitoredService(payload) : await saveMonitoredService(payload)
        postdatavalue?.resource && onSuccess(postdatavalue?.resource)
        showSuccess(
          isEdit
            ? getString('cv.monitoredServices.monitoredServiceUpdated')
            : getString('cv.monitoredServices.monitoredServiceCreated')
        )
      } catch (error) {
        showError(getErrorMessage(error))
      }
    } else {
      onSuccess(healthSourcePayload)
    }
  }

  return (
    <BGColorWrapper>
      <LoadSourceByType
        isTemplate={isTemplate}
        type={sourceData?.sourceType}
        data={filteredSourceData}
        onSubmit={submitData}
      />
    </BGColorWrapper>
  )
}
