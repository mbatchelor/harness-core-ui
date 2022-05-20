/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Views } from '@wings-software/uicore'
import { TemplatesGridView } from '@templates-library/pages/TemplatesPage/views/TemplatesGridView/TemplatesGridView'
import type { PageTemplateSummaryResponse, TemplateSummaryResponse } from 'services/template-ng'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { TemplatesListView } from '@templates-library/pages/TemplatesPage/views/TemplatesListView/TemplatesListView'

export interface TemplatesViewProps {
  data: PageTemplateSummaryResponse
  selectedTemplate?: TemplateSummaryResponse
  gotoPage: (pageNumber: number) => void
  onSelect: (template: TemplateSummaryResponse) => void
  onPreview?: (template: TemplateSummaryResponse) => void
  onOpenEdit?: (template: TemplateSummaryResponse) => void
  onOpenSettings?: (templateIdentifier: string) => void
  onDelete?: (template: TemplateSummaryResponse) => void
}

export default function TemplatesView(props: TemplatesViewProps & { view: Views }): React.ReactElement {
  const { view, ...rest } = props
  const { isGitSyncEnabled } = useAppStore()

  const content = React.useMemo(
    () => (view === Views.GRID ? <TemplatesGridView {...rest} /> : <TemplatesListView {...rest} />),
    [view, rest]
  )

  if (isGitSyncEnabled) {
    return <GitSyncStoreProvider>{content}</GitSyncStoreProvider>
  } else {
    return <>{content}</>
  }
}
