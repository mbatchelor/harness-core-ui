/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { ButtonVariation, ButtonGroup, Button, Layout } from '@harness/uicore'
import cx from 'classnames'
import { useStrings } from 'framework/strings'
import { ZOOM_INC_DEC_LEVEL } from './constants'
import css from './GraphActions.module.scss'

interface GraphActionProps {
  setGraphScale: (data: number) => void
  graphScale: number
  handleScaleToFit: () => void
  resetGraphState: () => void
  graphActionsLayout?: 'horizontal' | 'vertical'
}
function GraphActions({
  setGraphScale,
  graphScale,
  handleScaleToFit,
  resetGraphState,
  graphActionsLayout
}: GraphActionProps): React.ReactElement {
  const { getString } = useStrings()
  const renderButtons = (): React.ReactElement => (
    <>
      <ButtonGroup>
        <Button
          variation={ButtonVariation.TERTIARY}
          icon="canvas-position"
          tooltip={getString('canvasButtons.zoomToFit')}
          onClick={handleScaleToFit}
        />
      </ButtonGroup>
      <ButtonGroup>
        <Button
          variation={ButtonVariation.TERTIARY}
          icon="canvas-selector"
          tooltip={getString('reset')}
          onClick={resetGraphState}
        />
      </ButtonGroup>
      <span className={graphActionsLayout === 'vertical' ? css.verticalButtons : ''}>
        <ButtonGroup>
          <Button
            variation={ButtonVariation.TERTIARY}
            icon="zoom-in"
            tooltip={getString('canvasButtons.zoomIn')}
            onClick={e => {
              e.stopPropagation()
              Number(graphScale.toFixed(1)) < 2 && setGraphScale(graphScale + ZOOM_INC_DEC_LEVEL)
            }}
          />
          <Button
            variation={ButtonVariation.TERTIARY}
            icon="zoom-out"
            tooltip={getString('canvasButtons.zoomOut')}
            onClick={e => {
              e.stopPropagation()
              Number(graphScale.toFixed(1)) > 0.3 && setGraphScale(graphScale - ZOOM_INC_DEC_LEVEL)
            }}
          />
        </ButtonGroup>
      </span>
    </>
  )

  return (
    <span className={cx(css.canvasButtons, 'graphActions')}>
      {graphActionsLayout === 'horizontal' ? (
        <Layout.Horizontal spacing="medium" id="button-group">
          {renderButtons()}
        </Layout.Horizontal>
      ) : (
        <Layout.Vertical spacing="medium" id="button-group">
          {renderButtons()}
        </Layout.Vertical>
      )}
    </span>
  )
}
export default GraphActions
