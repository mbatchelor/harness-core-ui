/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React, { useCallback, useState } from 'react'
import { Dialog } from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import { defaultTo } from 'lodash-es'
import { String } from 'framework/strings'
import type { ScopeSelector } from 'services/resourcegroups'
import ResourceScopeForm from './views/ResourceScopeForm'

export interface UseResourceScopeModalProps {
  onSuccess: (scopes: ScopeSelector[]) => void
  onCloseModal?: () => void
}

export interface UseResourceScopeModalReturn {
  openResourceScopeModal: (scopes?: ScopeSelector[]) => void
  closeResourceScopeModal: () => void
}

export const useResourceScopeModal = ({ onSuccess }: UseResourceScopeModalProps): UseResourceScopeModalReturn => {
  const [scopes, setScopes] = useState<ScopeSelector[]>([])
  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog
        isOpen={true}
        title={<String stringID="rbac.resourceScope.select" />}
        enforceFocus={false}
        onClose={hideModal}
        style={{ width: 900 }}
      >
        <ResourceScopeForm
          scopes={scopes}
          onSubmit={_scopes => {
            onSuccess(_scopes)
            hideModal()
          }}
          onCancel={hideModal}
        />
      </Dialog>
    ),
    [scopes, onSuccess]
  )
  const open = useCallback(
    (_scopes?: ScopeSelector[]) => {
      setScopes(defaultTo(_scopes, []))
      showModal()
    },
    [showModal]
  )

  return {
    openResourceScopeModal: open,
    closeResourceScopeModal: hideModal
  }
}
