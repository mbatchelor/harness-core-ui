/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { DeserializeEvent } from '@projectstorm/react-canvas-core'
import type { IconName } from '@wings-software/uicore'
import type { IconProps } from '@harness/icons'
import { DiagramType, PortName } from '../../Constants'
import { DefaultNodeModelOptions, DefaultNodeModel } from '../DefaultNodeModel'
import type { DefaultLinkModelGenerics } from '../../link/DefaultLinkModel'
import { DefaultPortModel } from '../../port/DefaultPortModel'

export interface GroupNodeModelOptions
  extends Omit<DefaultNodeModelOptions, 'icon | iconProps | secondaryIconStyle | secondaryIconProps | secondaryIcon '> {
  icons: Array<IconName>
  parallelNodes: Array<string>
  iconPropsAr?: Array<IconProps>
}

export interface GroupNodeModelGenerics extends DefaultLinkModelGenerics {
  OPTIONS: GroupNodeModelOptions
}

export class GroupNodeModel extends DefaultNodeModel<GroupNodeModelGenerics> {
  constructor(name: string)
  constructor(options?: GroupNodeModelOptions)
  constructor(options: any = {}) {
    if (typeof options === 'string') {
      options = {
        name: options
      }
    }
    super({
      type: DiagramType.GroupNode,
      icons: [],
      iconPropsAr: [],
      ...options
    })
    this.addPort(
      new DefaultPortModel({
        in: true,
        name: PortName.In
      })
    )
    this.addPort(
      new DefaultPortModel({
        in: false,
        name: PortName.Out
      })
    )
  }

  deserialize(event: DeserializeEvent<this>): void {
    super.deserialize(event)
    this.options.icons = [...event.data.icons]
    this.options.iconPropsAr = [...event.data.iconPropsAr]
  }

  serialize(): any {
    return {
      ...super.serialize(),
      icons: this.options.icons,
      iconPropsAr: this.options.iconPropsAr
    }
  }
}
