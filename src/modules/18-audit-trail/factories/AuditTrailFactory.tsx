/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { IconProps } from '@harness/icons'
import type { Module } from '@common/interfaces/RouteInterfaces'
import type { ResourceDTO, ResourceScopeDTO } from 'services/audit'
import type { StringKeys } from 'framework/strings'

export type ResourceType = ResourceDTO['type']

export interface ResourceScope extends ResourceScopeDTO {
  accountIdentifier: string
}

interface ResourceHandler {
  moduleIcon: IconProps
  moduleLabel?: StringKeys
  resourceLabel: StringKeys
  resourceUrl?: (resource: ResourceDTO, resourceScope: ResourceScope, module?: Module) => string | undefined
}

class AuditTrailFactory {
  private readonly map: Map<ResourceType, ResourceHandler>

  constructor() {
    this.map = new Map()
  }

  registerResourceHandler(resourceType: ResourceType, handler: ResourceHandler): void {
    this.map.set(resourceType, handler)
  }

  getResourceHandler(resourceType: ResourceType): ResourceHandler | undefined {
    return this.map.get(resourceType)
  }

  getResourceTypeTolabelMap(): Record<ResourceType, StringKeys> {
    const obj = {} as Record<ResourceType, StringKeys>
    this.map.forEach((value, key) => {
      obj[key] = value.resourceLabel
    })
    return obj
  }
}

export default new AuditTrailFactory()
