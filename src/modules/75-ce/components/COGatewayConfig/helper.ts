/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { isEmpty as _isEmpty, defaultTo } from 'lodash-es'
import type { Resource } from 'services/lw'
import type { GatewayDetails, InstanceDetails } from '@ce/components/COCreateGateway/models'
import { RESOURCES } from '@ce/constants'
import { Utils } from '@ce/common/Utils'

class InstanceData implements InstanceDetails {
  name: string
  id: string
  ipv4: string
  region: string
  type: string
  tags: string
  launch_time: string
  status: string
  vpc: string
  metadata: { [key: string]: any } | undefined
  constructor() {
    this.name = ''
    this.id = ''
    this.ipv4 = ''
    this.region = ''
    this.type = ''
    this.tags = ''
    this.launch_time = ''
    this.status = ''
    this.vpc = ''
  }

  setName(name: string) {
    this.name = name
    return this
  }

  setId(id: string) {
    this.id = id
    return this
  }

  setIp(ip: string) {
    this.ipv4 = ip
    return this
  }

  setRegion(region: string) {
    this.region = region
    return this
  }

  setType(type: string) {
    this.type = type
    return this
  }

  setTags(tags: string) {
    this.tags = tags
    return this
  }

  setLaunchTime(time: string) {
    this.launch_time = time
    return this
  }

  setStatus(status: string) {
    this.status = status
    return this
  }

  setVpc(vpc: string) {
    this.vpc = vpc
    return this
  }

  setMetadata(meta: { [key: string]: any }) {
    this.metadata = meta
    return this
  }
}

export const fromResourceToInstanceDetails = (item: Resource, resourceType: { isAzure: boolean; isGcp: boolean }) => {
  const ip = resourceType.isGcp ? defaultTo(item.ipv4, item.private_ipv4)?.[0] : item.ipv4?.[0]
  const instanceDetails = new InstanceData()
    .setName(item.name as string)
    .setId(item.id as string)
    .setIp(ip as string)
    .setRegion(item.region as string)
    .setType(item.type as string)
    .setLaunchTime(item.launch_time as string)
    .setStatus(item.status as string)
    .setVpc(item.metadata?.['vpcID'] as string)
  if (resourceType.isAzure) {
    instanceDetails.setMetadata({ resourceGroup: item.metadata?.resourceGroup })
  }
  if (resourceType.isGcp) {
    instanceDetails.setMetadata({
      availabilityZone: item.availability_zone,
      network_interfaces: item.metadata?.network_interfaces
    })
  }
  return instanceDetails
}

export const isFFEnabledForResource = (flag: string | undefined | null, featureFlagsMap: Record<string, boolean>) => {
  let enableStatus = true
  if (_isEmpty(flag)) {
    return enableStatus
  }
  if (!featureFlagsMap[flag as string]) {
    enableStatus = false
  }
  return enableStatus
}

export const isActiveStep = (stepEl: HTMLElement, parentEl: HTMLDivElement) => {
  const parentElVal = parentEl.getBoundingClientRect()
  const { top, bottom, height } = stepEl.getBoundingClientRect()
  return (
    (top > parentElVal.top || bottom - parentElVal.top > 100) &&
    (bottom <= parentElVal.bottom || (height >= parentElVal.height ? bottom > parentElVal.bottom : false))
  )
}

export const getSelectedResourceFromGatewayDetails = (gatewayDetails: GatewayDetails) => {
  const isGcpProvider = Utils.isProviderGcp(gatewayDetails.provider)
  return !_isEmpty(gatewayDetails.selectedInstances)
    ? RESOURCES.INSTANCES
    : isGcpProvider && !_isEmpty(gatewayDetails.routing?.instance?.scale_group)
    ? RESOURCES.IG
    : !_isEmpty(gatewayDetails.routing?.instance?.scale_group)
    ? RESOURCES.ASG
    : Utils.isK8sRule(gatewayDetails)
    ? RESOURCES.KUBERNETES
    : !_isEmpty(gatewayDetails.routing.container_svc)
    ? RESOURCES.ECS
    : !_isEmpty(gatewayDetails.routing.database)
    ? RESOURCES.RDS
    : null
}

export const getTitle = (selectedResource?: RESOURCES | null) => {
  let title = 'ce.co.autoStoppingRule.configuration.step3.title'
  if (selectedResource === RESOURCES.ASG) {
    title = 'ce.co.autoStoppingRule.configuration.step3.asgTitle'
  }
  if (selectedResource === RESOURCES.ECS) {
    title = 'ce.co.autoStoppingRule.configuration.step3.desiredTaskCount'
  }
  return title
}

export const getSubTitle = (selectedResource?: RESOURCES | null) => {
  let subStr = 'ce.co.autoStoppingRule.configuration.step3.subTitle'
  if (selectedResource === RESOURCES.ASG) {
    subStr = 'ce.co.autoStoppingRule.configuration.step3.asgSubTitle'
  }
  if (selectedResource === RESOURCES.ECS) {
    subStr = 'ce.co.autoStoppingRule.configuration.step3.ecsSubTitle'
  }
  return subStr
}
