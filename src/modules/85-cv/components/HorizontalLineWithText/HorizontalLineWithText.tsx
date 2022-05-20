import React from 'react'
import { Text } from '@harness/uicore'
import css from './HorizontalLineWithText.module.scss'

interface HorizontalLineWithTextProps {
  text: string
}

export default function HorizontalLineWithText(props: HorizontalLineWithTextProps): JSX.Element {
  const { text } = props
  return (
    <div className={css.separator}>
      <div className={css.line}></div>
      <Text className={css.separatorText}>{text}</Text>
      <div className={css.line}></div>
    </div>
  )
}
