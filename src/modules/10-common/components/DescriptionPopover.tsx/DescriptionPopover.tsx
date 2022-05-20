/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { IPopoverProps, PopoverInteractionKind } from '@blueprintjs/core'
import { Text, Popover, Icon, Container } from '@wings-software/uicore'
import type { IconProps } from '@harness/icons'
import React from 'react'
import { useStrings } from 'framework/strings'
import css from './DescriptionPopover.module.scss'

interface DescriptionPopoverProps {
  text: string
  className?: string
  popoverProps?: IPopoverProps
  iconProps?: Omit<IconProps, 'name'>
  target?: React.ReactElement
}

const DescriptionPopover: React.FC<DescriptionPopoverProps> = props => {
  const { text, popoverProps, iconProps, target } = props

  const { getString } = useStrings()
  return (
    <Popover interactionKind={PopoverInteractionKind.HOVER} {...popoverProps}>
      {target || <Icon name="description" {...iconProps} size={iconProps?.size || 18} />}
      <Container padding="medium">
        <Text font={{ size: 'normal', weight: 'bold' }}>{getString('description')}</Text>
        <Container className={css.descriptionPopover}>{text}</Container>
      </Container>
    </Popover>
  )
}

export default DescriptionPopover
