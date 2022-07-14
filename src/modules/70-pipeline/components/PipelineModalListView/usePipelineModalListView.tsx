import { Dialog } from '@blueprintjs/core'
import { useModalHook } from '@harness/use-modal'
import React from 'react'
import { useParams } from 'react-router-dom'
import type { PipelineType, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import PipelineModalListView from './PipelineModalListView'

/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

export const usePipelineModalListView = () => {
  const { projectIdentifier, orgIdentifier, accountId } = useParams<PipelineType<ProjectPathProps>>()

  const [openPipelineListModal, hideModal] = useModalHook(
    () => (
      <Dialog isOpen enforceFocus={false} style={{ minWidth: 800, minHeight: 280, backgroundColor: 'var(--grey-50)' }}>
        <PipelineModalListView onClose={hideModal} />
      </Dialog>
    ),
    [projectIdentifier, orgIdentifier, accountId]
  )

  return openPipelineListModal
}
