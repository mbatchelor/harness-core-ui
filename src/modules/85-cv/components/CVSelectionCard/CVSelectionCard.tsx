/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Card, Icon, CardBody, Container, Layout, Text, CardProps } from '@wings-software/uicore'
import cx from 'classnames'
import { Color } from '@harness/design-system'
import type { IconProps } from '@harness/icons'
import css from './CVSelectionCard.module.scss'

export interface CVSelectionCardProps {
  isSelected?: boolean
  iconProps: IconProps
  className?: string
  renderLabelOutsideCard?: boolean
  isLarge?: boolean
  onCardSelect?: (isSelected: boolean) => void
  cardLabel?: string
  cardProps?: CardProps
  cardLabelClassname?: string
}

export interface CVSelectionCardGroupProps {
  cards: Omit<CVSelectionCardProps[], 'onCardSelect'>
  defaultSelectedCardIndex?: number
  className?: string
  onCardSelect?: (isSelected: boolean, selectedCardIndex: number) => void
}

export function CVSelectionCard(props: CVSelectionCardProps): JSX.Element {
  const { isSelected, iconProps, onCardSelect, cardLabel, renderLabelOutsideCard, className, isLarge } = props
  const isSelectable = isSelected && !props.cardProps?.disabled
  return (
    <Layout.Vertical spacing="small" className={className}>
      <Card
        {...props.cardProps}
        selected={isSelectable}
        interactive={true}
        className={cx(
          css.selectionCard,
          isSelectable ? css.selectedCard : undefined,
          isLarge ? css.largeCard : undefined
        )}
        onClick={() => {
          if (!props.cardProps?.disabled) {
            onCardSelect?.(!isSelected)
          }
        }}
      >
        {isSelectable ? (
          <div className={css.triangle}>
            <Icon name="tick" size={14} className={css.tick} color={Color.WHITE} />
          </div>
        ) : null}
        <CardBody.Icon
          className={cx({ [css.cardIconSelected]: isSelectable })}
          icon={iconProps.name}
          iconSize={iconProps.size}
          {...iconProps}
        />
        {!renderLabelOutsideCard && Boolean(cardLabel) && (
          <Text color={Color.BLACK} className={css.cardLabel}>
            {cardLabel}
          </Text>
        )}
      </Card>
      {renderLabelOutsideCard && Boolean(cardLabel) && (
        <Text color={Color.BLACK} className={css.cardLabel}>
          {cardLabel}
        </Text>
      )}
    </Layout.Vertical>
  )
}

export function CVSelectionCardGroup(props: CVSelectionCardGroupProps): JSX.Element {
  const { cards, defaultSelectedCardIndex, className, onCardSelect } = props
  const [selectedCardIndex, setSelectedCardIndex] = useState(defaultSelectedCardIndex || -1)
  return (
    <Container className={className}>
      {cards?.map((cardProps, index) => (
        <CVSelectionCard
          {...cardProps}
          key={index}
          isSelected={index === selectedCardIndex}
          onCardSelect={isSelected => {
            setSelectedCardIndex(isSelected ? index : -1)
            onCardSelect?.(isSelected, index)
          }}
        />
      ))}
    </Container>
  )
}
