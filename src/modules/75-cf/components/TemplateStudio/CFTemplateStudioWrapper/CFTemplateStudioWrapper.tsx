/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import { TemplateStudio } from '@templates-library/components/TemplateStudio/TemplateStudio'
import { TemplateProvider } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import type {
  GitQueryParams,
  ModulePathParams,
  TemplateStudioPathProps,
  TemplateStudioQueryParams
} from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import { getCFPipelineStages } from '@cf/pages/pipeline-studio/CFPipelineStudio'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { useStrings } from 'framework/strings'

export const CFTemplateStudioWrapper: React.FC = (): JSX.Element => {
  const { accountId, projectIdentifier, orgIdentifier, templateIdentifier, templateType } = useParams<
    TemplateStudioPathProps & ModulePathParams
  >()
  const { versionLabel, repoIdentifier, branch } = useQueryParams<TemplateStudioQueryParams & GitQueryParams>()
  const { getString } = useStrings()
  const { licenseInformation } = useLicenseStore()
  const { CING_ENABLED, CDNG_ENABLED, CFNG_ENABLED, SECURITY_STAGE } = useFeatureFlags()
  return (
    <TemplateProvider
      queryParams={{ accountIdentifier: accountId, orgIdentifier, projectIdentifier, repoIdentifier, branch }}
      templateIdentifier={templateIdentifier}
      versionLabel={versionLabel}
      templateType={templateType}
      renderPipelineStage={args =>
        getCFPipelineStages({
          args,
          getString,
          isCIEnabled: licenseInformation['CI'] && CING_ENABLED,
          isCDEnabled: licenseInformation['CD'] && CDNG_ENABLED,
          isCFEnabled: licenseInformation['CF'] && CFNG_ENABLED,
          isSTOEnabled: SECURITY_STAGE,
          isApprovalStageEnabled: true
        })
      }
    >
      <GitSyncStoreProvider>
        <TemplateStudio />
      </GitSyncStoreProvider>
    </TemplateProvider>
  )
}
