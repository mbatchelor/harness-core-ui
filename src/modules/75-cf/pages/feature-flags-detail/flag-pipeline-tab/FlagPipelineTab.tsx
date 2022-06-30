/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Container } from '@harness/uicore'
import { NoData } from '@cf/components/NoData/NoData'
import imageUrl from '@cf/images/pipeline_flags_empty_state.svg'
import { useStrings } from 'framework/strings'
import AvailablePipelinesDrawer from './components/available-pipelines-drawer/AvailablePipelinesDrawer'

export interface FlagPipelineTabProps {
  flagIdentifier: string
}

const FlagPipelineTab: React.FC<FlagPipelineTabProps> = ({ flagIdentifier }) => {
  const { getString } = useStrings()

  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  return (
    <>
      <Container width="100%" height="100%" flex={{ align: 'center-center' }}>
        <NoData
          message={getString('cf.featureFlags.flagPipeline.noDataMessage')}
          buttonText={getString('cf.featureFlags.flagPipeline.noDataButtonText')}
          description={getString('cf.featureFlags.flagPipeline.noDataDescription')}
          imageURL={imageUrl}
          onClick={() => setIsDrawerOpen(true)}
          imgWidth={650}
        />
      </Container>
      <AvailablePipelinesDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        flagIdentifier={flagIdentifier}
      />
    </>
  )
}

export default FlagPipelineTab
