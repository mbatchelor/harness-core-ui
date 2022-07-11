/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Layout, Tab, Tabs, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import {
  GetEnvArtifactDetailsByServiceIdQueryParams,
  GetEnvBuildInstanceCountQueryParams,
  useGetActiveServiceInstances,
  useGetEnvArtifactDetailsByServiceId
} from 'services/cd-ng'
import type { ProjectPathProps, ServicePathProps } from '@common/interfaces/RouteInterfaces'
import { ActiveServiceInstancesHeader } from './ActiveServiceInstancesHeader'
import { ActiveServiceInstancesContentV2, TableType } from './ActiveServiceInstancesContentV2'
import { DeploymentsV2 } from '../DeploymentView/DeploymentViewV2'
import InstancesDetailsDialog from './InstancesDetails/InstancesDetailsDialog'
// import { activeResponse } from './mockApi'
import css from './ActiveServiceInstances.module.scss'

export enum ServiceDetailTabs {
  ACTIVE = 'Active Service Instances',
  DEPLOYMENT = 'Deployments'
}

export const ActiveServiceInstancesV2: React.FC = () => {
  const { getString } = useStrings()
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState<boolean>(false)

  const { accountId, orgIdentifier, projectIdentifier, serviceId } = useParams<ProjectPathProps & ServicePathProps>()
  const queryParams: GetEnvBuildInstanceCountQueryParams = {
    accountIdentifier: accountId,
    orgIdentifier,
    projectIdentifier,
    serviceId
  }

  const {
    loading: activeInstanceLoading,
    data: activeInstanceData,
    error: activeInstanceError,
    refetch: activeInstanceRefetch
  } = useGetActiveServiceInstances({ queryParams })

  // const activeInstanceData = activeResponse
  // const activeInstanceLoading = false
  // const activeInstanceError = false
  // const activeInstanceRefetch = false

  const queryParamsDeployments: GetEnvArtifactDetailsByServiceIdQueryParams = {
    accountIdentifier: accountId,
    orgIdentifier,
    projectIdentifier,
    serviceId
  }

  const {
    data: deploymentData,
    loading: deploymentLoading,
    error: deploymentError,
    refetch: deploymentRefetch
  } = useGetEnvArtifactDetailsByServiceId({
    queryParams: queryParamsDeployments
  })

  /* istanbul ignore next */
  const isDeploymentTab = (): boolean => {
    return Boolean(
      activeInstanceData &&
        deploymentData &&
        !(activeInstanceData?.data?.instanceGroupedByArtifactList || []).length &&
        (deploymentData?.data?.environmentInfoByServiceId || []).length
    )
  }

  const [defaultTab, setDefaultTab] = useState(ServiceDetailTabs.ACTIVE)

  useEffect(() => {
    if (isDeploymentTab()) {
      setDefaultTab(ServiceDetailTabs.DEPLOYMENT)
    } else {
      setDefaultTab(ServiceDetailTabs.ACTIVE)
    }
  }, [deploymentData, activeInstanceData])

  const handleTabChange = (data: string): void => {
    setDefaultTab(data as ServiceDetailTabs)
  }

  const moreDetails = () => {
    return (
      <>
        <Text
          className={css.moreDetails}
          font={{ size: 'small', weight: 'semi-bold' }}
          color={Color.PRIMARY_7}
          onClick={() => setIsDetailsDialogOpen(true)}
        >
          {getString('cd.serviceDashboard.moreDetails')}
        </Text>
        <InstancesDetailsDialog
          data={activeInstanceData?.data?.instanceGroupedByArtifactList}
          isOpen={isDetailsDialogOpen}
          setIsOpen={setIsDetailsDialogOpen}
          isActiveInstance={defaultTab === ServiceDetailTabs.ACTIVE}
        />
      </>
    )
  }

  return (
    <Card className={css.activeServiceInstances}>
      <Layout.Vertical className={css.tabsStyle}>
        <Tabs id="ServiceDetailTabs" selectedTabId={defaultTab} onChange={handleTabChange}>
          <Tab
            id={ServiceDetailTabs.ACTIVE}
            title={getString('cd.serviceDashboard.activeServiceInstancesLabel')}
            panel={
              <>
                <ActiveServiceInstancesHeader />
                {moreDetails()}
                <ActiveServiceInstancesContentV2
                  tableType={TableType.PREVIEW}
                  loading={activeInstanceLoading}
                  data={activeInstanceData?.data?.instanceGroupedByArtifactList}
                  error={activeInstanceError}
                  refetch={activeInstanceRefetch}
                />
              </>
            }
          />
          <Tab
            id={ServiceDetailTabs.DEPLOYMENT}
            title={getString('deploymentsText')}
            panel={
              <>
                {moreDetails()}
                <DeploymentsV2
                  tableType={TableType.PREVIEW}
                  loading={deploymentLoading}
                  data={activeInstanceData?.data?.instanceGroupedByArtifactList}
                  error={deploymentError as any} //tododeploymenttab
                  refetch={deploymentRefetch as any}
                />
              </>
            }
          />
        </Tabs>
      </Layout.Vertical>
    </Card>
  )
}
