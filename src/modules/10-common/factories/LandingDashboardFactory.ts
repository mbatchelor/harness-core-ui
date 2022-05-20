/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type React from 'react'
import type { IconName } from '@wings-software/uicore'
import type { IconProps } from '@harness/icons'
import type { StringsMap } from 'framework/strings/StringsContext'
import type { ModuleName } from 'framework/types/ModuleName'

export interface ModuleDashboardHandler {
  icon?: IconName
  iconProps?: Omit<IconProps, 'name'>
  label?: keyof StringsMap
  moduleDashboardRenderer?: () => React.ReactElement
}

class LandingDashboardFactory {
  private readonly map: Map<ModuleName, ModuleDashboardHandler>

  constructor() {
    this.map = new Map()
  }

  registerModuleDashboardHandler(moduleName: ModuleName, handler: ModuleDashboardHandler): void {
    this.map.set(moduleName, handler)
  }

  getModuleDashboardHandler(moduleName: ModuleName): ModuleDashboardHandler | undefined {
    return this.map.get(moduleName)
  }
}

export default new LandingDashboardFactory()
