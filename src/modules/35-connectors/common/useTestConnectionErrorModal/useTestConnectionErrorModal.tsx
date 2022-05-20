/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Button, Container, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useModalHook } from '@harness/use-modal'
import { Dialog, IDialogProps } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import { ErrorHandler } from '@common/components/ErrorHandler/ErrorHandler'
import { removeErrorCode } from '@connectors/pages/connectors/utils/ConnectorUtils'
import type { ConnectorInfoDTO, ConnectorValidationResult, ResponseMessage } from 'services/cd-ng'
import type { ErrorMessage } from '@connectors/pages/connectors/views/ConnectorsListView'
import Suggestions from '../ErrorSuggestions/ErrorSuggestionsCe'
import css from './useTestConnectionErrorModal.module.scss'

export interface UseTestConnectionErrorModalProps {
  onClose?: () => void
  connectorInfo?: ConnectorInfoDTO
  showCustomErrorSuggestion?: boolean
}

export interface UseTestConnectionErrorModalReturn {
  openErrorModal: (error: ConnectorValidationResult) => void
  hideErrorModal: () => void
}
const modalProps: IDialogProps = {
  isOpen: true,
  enforceFocus: false,
  style: {
    width: 750,
    borderLeft: 0,
    paddingBottom: 0,
    position: 'relative',
    overflow: 'hidden'
  }
}

const useTestConnectionErrorModal = (props: UseTestConnectionErrorModalProps): UseTestConnectionErrorModalReturn => {
  const [error, setError] = useState<ErrorMessage>()

  const { getString } = useStrings()

  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog {...modalProps}>
        <Container height={'100%'} padding="xxlarge">
          <Text font={{ size: 'medium' }} color={Color.BLACK} margin={{ bottom: 'large' }}>
            {getString('errorDetails')}
          </Text>
          {error?.useErrorHandler ? (
            <ErrorHandler
              responseMessages={error.errors as ResponseMessage[]}
              errorHintsRenderer={
                props.showCustomErrorSuggestion
                  ? hints => (
                      <Suggestions
                        items={hints as ResponseMessage[]}
                        header={getString('common.errorHandler.tryTheseSuggestions')}
                        icon={'lightbulb'}
                        connectorType={props.connectorInfo?.type || ''}
                      />
                    )
                  : undefined
              }
            />
          ) : (
            <Container>
              <Text
                icon={'error'}
                iconProps={{ color: Color.RED_500 }}
                color={Color.GREY_900}
                lineClamp={1}
                font={{ size: 'small', weight: 'semi-bold' }}
                margin={{ top: 'small', bottom: 'small' }}
              >
                {error?.errorSummary}
              </Text>
              <div className={css.errorMsg}>
                <pre>{JSON.stringify({ errors: removeErrorCode(error?.errors) }, null, ' ')}</pre>
              </div>
            </Container>
          )}
        </Container>
        <Button
          minimal
          icon="cross"
          iconProps={{ size: 18 }}
          onClick={() => {
            props.onClose?.()
            hideModal()
          }}
          className={css.crossIcon}
        />
      </Dialog>
    ),
    [error]
  )

  return {
    openErrorModal: (_error: ConnectorValidationResult) => {
      setError(_error)
      showModal()
    },
    hideErrorModal: hideModal
  }
}

export default useTestConnectionErrorModal
