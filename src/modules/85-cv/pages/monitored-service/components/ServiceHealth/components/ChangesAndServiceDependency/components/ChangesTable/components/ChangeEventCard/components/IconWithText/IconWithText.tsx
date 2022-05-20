import React from 'react'
import { Container, Icon, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'

import type { IconName } from '@blueprintjs/core'

export const IconWithText = ({ icon, text = '' }: { icon?: string; text?: string }) => {
  return (
    <>
      <Container flex margin={{ right: 'medium' }}>
        {icon && <Icon name={icon as unknown as IconName} size={15} margin={{ right: 'small' }} />}
        {text && (
          <Text font={{ size: 'small' }} color={Color.GREY_800}>
            {text}
          </Text>
        )}
      </Container>
    </>
  )
}
