/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { useModalHook } from '@harness/use-modal'
import { Dialog } from '@blueprintjs/core'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import CreateEditVariable from '@variables/components/CreateEditVariable/CreateEditVariable'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import type { VariableDTO, VariableRequestDTO } from 'services/cd-ng'
import css from '@variables/components/CreateEditVariable/CreateEditVariable.module.scss'

export interface UseCreateUpdateVariableModalProps {
  onSuccess?: ((data: VariableDTO) => void) | (() => void)
}

export interface UseCreateUpdateVariableModalReturn {
  openCreateUpdateVariableModal: (variable?: VariableRequestDTO) => void
  closeCreateUpdateVariableModal: () => void
}

const useCreateEditVariableModal = (props: UseCreateUpdateVariableModalProps): UseCreateUpdateVariableModalReturn => {
  const [variable, setVariable] = useState<VariableDTO>()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { getString } = useStrings()
  const handleSuccess = (data: VariableDTO) => {
    hideModal()
    props.onSuccess?.(data)
  }
  const [showModal, hideModal] = useModalHook(
    () => (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        style={{ minHeight: 550 }}
        onClose={() => {
          hideModal()
        }}
        title={variable ? getString('variables.editVar') : getString('common.addVariable')}
        className={css.variableDialog}
      >
        <CreateEditVariable
          accountId={accountId}
          orgIdentifier={(variable ? variable.orgIdentifier : orgIdentifier) as string}
          projectIdentifier={(variable ? variable.projectIdentifier : projectIdentifier) as string}
          onSuccess={handleSuccess}
          closeModal={hideModal}
          variable={variable}
        />
      </Dialog>
    ),
    [variable]
  )

  return {
    openCreateUpdateVariableModal: (_variable: VariableRequestDTO | undefined) => {
      setVariable(_variable?.variable)
      showModal()
    },
    closeCreateUpdateVariableModal: hideModal
  }
}

export default useCreateEditVariableModal
