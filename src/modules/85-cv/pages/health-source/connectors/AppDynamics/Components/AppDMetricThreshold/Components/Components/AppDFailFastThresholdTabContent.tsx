import React from 'react'
import { Container, Text } from '@harness/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'

export default function AppDFailFastThresholdTabContent(): JSX.Element {
  const { getString } = useStrings()

  return (
    <Container margin={{ top: 'large' }}>
      <Text color={Color.BLACK}>{getString('cv.monitoringSources.appD.failFastThresholdHint')}</Text>
    </Container>
  )
}
