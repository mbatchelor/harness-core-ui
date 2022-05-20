/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Dialog, IDialogProps } from '@blueprintjs/core'
import { Button } from '@wings-software/uicore'

interface ResourceSelectionModalProps {
  onClose?: () => void
  closeBtnTestId?: string
}

const modalProps: IDialogProps = {
  isOpen: true,
  enforceFocus: false,
  style: {
    width: 1000,
    minHeight: 350,
    padding: 40,
    position: 'relative',
    overflow: 'hidden',
    background: 'var(--primary-bg)'
  }
}
const ResourceSelectionModal: React.FC<ResourceSelectionModalProps> = props => {
  return (
    <Dialog {...modalProps}>
      {props.children}
      <Button
        minimal
        icon="cross"
        iconProps={{ size: 18 }}
        onClick={props.onClose}
        style={{ position: 'absolute', right: 'var(--spacing-large)', top: 'var(--spacing-large)' }}
        data-testid={props.closeBtnTestId}
      />
    </Dialog>
  )
}

export default ResourceSelectionModal
