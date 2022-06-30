/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { FontVariation, Layout, Text, Card, Icon } from '@harness/uicore'
import { Color } from '@harness/design-system'
import cx from 'classnames'
import css from './PipelineCard.module.scss'

interface PipelineCardProps {
  pipelineName: string
  pipelineDescription?: string
  isSelected: boolean
  onClick: () => void
}

const PipelineCard: React.FC<PipelineCardProps> = ({ pipelineName, pipelineDescription, isSelected, onClick }) => {
  return (
    <Card className={isSelected ? cx(css.cardActive, css.card) : css.card} onClick={onClick} role="listitem">
      <Layout.Vertical spacing="small">
        <Icon name="ff-solid" size={30} />
        <Text font={{ variation: FontVariation.BODY1 }}>{pipelineName}</Text>
        {pipelineDescription && (
          <Text font={{ variation: FontVariation.BODY2 }} color={Color.GREY_500}>
            {pipelineDescription}
          </Text>
        )}
      </Layout.Vertical>
    </Card>
  )
}

export default PipelineCard
