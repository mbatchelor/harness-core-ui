/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { isEmpty as _isEmpty, defaultTo as _defaultTo } from 'lodash-es'
import { PageSpinner } from '@wings-software/uicore'
import COGatewayDetails from '@ce/components/COGatewayDetails/COGatewayDetails'
import type {
  GatewayDetails,
  Routing,
  InstanceDetails,
  Provider,
  ConnectionMetadata
} from '@ce/components/COCreateGateway/models'
import {
  HealthCheck,
  Service,
  ServiceDep,
  ServiceMetadata,
  useAllServiceResources,
  useListStaticSchedules,
  useRouteDetails
} from 'services/lw'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { allProviders, AS_RESOURCE_TYPE, ceConnectorTypes, GatewayKindType, PROVIDER_TYPES } from '@ce/constants'
import { Utils } from '@ce/common/Utils'
import { useGetConnector } from 'services/cd-ng'
import { resourceToInstanceObject } from './helper'

export const CECOEditGatewayPage: React.FC = () => {
  const { accountId, orgIdentifier, projectIdentifier, gatewayIdentifier } = useParams<
    ProjectPathProps & { gatewayIdentifier: string }
  >()

  const { data, loading } = useRouteDetails({
    account_id: accountId,
    rule_id: gatewayIdentifier as unknown as number,
    queryParams: {
      accountIdentifier: accountId
    }
  })
  const {
    data: resources,
    loading: resourcesLoading,
    refetch: fetchResources
  } = useAllServiceResources({
    account_id: accountId,
    rule_id: gatewayIdentifier as unknown as number,
    debounce: 300,
    lazy: true
  })

  const {
    data: staticSchedulesData,
    loading: staticSchedulesLoading,
    refetch: fetchStaticSchedules
  } = useListStaticSchedules({
    account_id: accountId,
    lazy: true
  })

  const {
    data: connectorData,
    loading: loadingConnectorData,
    error: connectorDataError,
    refetch: fetchConnectorData
  } = useGetConnector({
    identifier: '',
    lazy: true
  })

  const [gatewayDetails, setGatewayDetails] = useState<GatewayDetails>()

  const checkAndFetchSchedules = (_service: Service) => {
    if (_service.cloud_account_id && _isEmpty(staticSchedulesData)) {
      fetchStaticSchedules({
        queryParams: {
          accountIdentifier: accountId,
          cloud_account_id: _service.cloud_account_id,
          res_id: _defaultTo(_service.id, '').toString(),
          res_type: AS_RESOURCE_TYPE.rule
        }
      })
    }
  }

  useEffect(() => {
    if (loading) return
    const service = data?.response?.service as Service
    const deps = _defaultTo(data?.response?.deps as ServiceDep[], [])
    const hasAsg = !_isEmpty(service?.routing?.instance?.scale_group)
    const isK8sRule = service.kind === GatewayKindType.KUBERNETES

    checkAndFetchSchedules(service)

    // If there is an instance kind rule, then only fetch resources
    // don't fetch resources for ASG or K8s kind rule
    if (!isK8sRule && !hasAsg && !resources) {
      fetchResources()
      return
    }

    if (!connectorData && !connectorDataError && service?.cloud_account_id) {
      fetchConnectorData({
        pathParams: { identifier: service?.cloud_account_id },
        queryParams: { accountIdentifier: accountId }
      })
      return
    }

    const providerType = connectorData?.data?.connector?.type
      ? ceConnectorTypes[connectorData?.data?.connector?.type]
      : PROVIDER_TYPES.AWS.valueOf()

    const routing: Routing = {
      ...(service.routing as Routing),
      instance: { filterText: service.routing?.instance?.filter_text as string },
      lb: ''
    }
    let selectedInstances: InstanceDetails[] = []
    if (hasAsg) {
      routing.instance.scale_group = service.routing?.instance?.scale_group // eslint-disable-line
    } else if (isK8sRule) {
      routing.k8s = {
        RuleJson: service.routing?.k8s?.RuleJson as string,
        ConnectorID: service.metadata?.kubernetes_connector_id as string,
        Namespace: _defaultTo(service.routing?.k8s?.Namespace, 'default')
      }
    } else if (!_isEmpty(service.routing?.database)) {
      routing.database = service.routing?.database
    } else {
      const selectedResources = _defaultTo(resources?.response, [])
      selectedInstances = selectedResources.map(item => resourceToInstanceObject(providerType, item))
    }
    const gwDetails: GatewayDetails = {
      id: service.id,
      name: service.name,
      idleTimeMins: service.idle_time_mins as number,
      fullfilment: service.fulfilment as string,
      filter: service.routing?.instance?.filter_text as string,
      kind: service.kind,
      healthCheck: service.health_check as HealthCheck,
      hostName: service.host_name,
      routing,
      opts: {
        preservePrivateIP: service.opts?.preserve_private_ip as boolean,
        deleteCloudResources: service.opts?.delete_cloud_resources as boolean,
        alwaysUsePrivateIP: service.opts?.always_use_private_ip as boolean,
        access_details: service.opts?.access_details as ConnectionMetadata,
        hide_progress_page: service.opts?.hide_progress_page as boolean,
        dry_run: service.opts?.dry_run
      },
      provider: allProviders.find(provider => provider.value === providerType) as Provider,
      selectedInstances: selectedInstances,
      accessPointID: service.access_point_id as string,
      accountID: accountId,
      orgID: orgIdentifier,
      projectID: projectIdentifier,
      cloudAccount: {
        id: service.cloud_account_id,
        name: service.metadata?.cloud_provider_details?.name as string
      },
      metadata: service.metadata as ServiceMetadata,
      customDomains: service.custom_domains,
      deps: deps,
      schedules: staticSchedulesData?.response?.map(s => Utils.convertScheduleToClientSchedule(s)),
      ...(!_isEmpty(service.routing?.container_svc) && {
        // for just display purpose
        resourceMeta: {
          container_svc: service.routing?.container_svc
        }
      })
    }
    setGatewayDetails(gwDetails)
  }, [data, connectorData, staticSchedulesData, resources])

  const isLoading = loading || loadingConnectorData || staticSchedulesLoading || resourcesLoading

  return (
    <>
      {!isLoading && gatewayDetails ? (
        <COGatewayDetails
          gatewayDetails={gatewayDetails as GatewayDetails}
          setGatewayDetails={setGatewayDetails}
          previousTab={() => undefined}
          isEditFlow={true}
          originalRuleDetails={data?.response?.service}
        />
      ) : (
        <div style={{ position: 'relative', height: 'calc(100vh - 128px)' }}>
          <PageSpinner />
        </div>
      )}
    </>
  )
}

export default CECOEditGatewayPage
