/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { ReactElement, useState, useEffect } from 'react'
import { Layout, PageError } from '@wings-software/uicore'
import { useParams, useLocation } from 'react-router-dom'
import { GetFeatureFlagQueryParams, useGetFeatureFlag } from 'services/cf'
import { useGovernance } from '@cf/hooks/useGovernance'
import { getErrorMessage } from '@cf/utils/CFUtils'
import { ContainerSpinner } from '@common/components/ContainerSpinner/ContainerSpinner'
import { useStrings } from 'framework/strings'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import FlagActivation from '@cf/components/FlagActivation/FlagActivation'
import FlagActivationDetails from '@cf/components/FlagActivation/FlagActivationDetails'
import useActiveEnvironment from '@cf/hooks/useActiveEnvironment'
import GitSyncActions from '@cf/components/GitSyncActions/GitSyncActions'
import { useFFGitSyncContext } from '@cf/contexts/ff-git-sync-context/FFGitSyncContext'
import css from './FeatureFlagsDetailPage.module.scss'

const FeatureFlagsDetailPage: React.FC = () => {
  const { getString } = useStrings()
  const [skipLoading, setSkipLoading] = useState(false)
  const {
    orgIdentifier,
    projectIdentifier,
    featureFlagIdentifier,
    accountId: accountIdentifier
  } = useParams<Record<string, string>>()
  const { activeEnvironment: environmentIdentifier } = useActiveEnvironment()
  const location = useLocation<{ governanceMetadata: any }>()

  const { handleError: handleGovernanceError, isGovernanceError } = useGovernance()
  const [governanceMetadata, setGovernanceMetadata] = useState(location?.state?.governanceMetadata)

  useDocumentTitle(getString('featureFlagsText'))

  const queryParams = {
    projectIdentifier,
    environmentIdentifier,
    accountIdentifier,
    orgIdentifier
  } as GetFeatureFlagQueryParams

  const {
    data: featureFlag,
    loading,
    error,
    refetch
  } = useGetFeatureFlag({
    identifier: featureFlagIdentifier as string,
    queryParams
  })

  useEffect(() => {
    if (isGovernanceError({ details: { governanceMetadata: governanceMetadata } })) {
      handleGovernanceError({ details: { governanceMetadata: governanceMetadata } })
    }
  }, [governanceMetadata])

  const gitSync = useFFGitSyncContext()

  if (loading && !skipLoading) {
    return <ContainerSpinner className={css.spinner} />
  }

  if (error) {
    return (
      <PageError
        message={getErrorMessage(error)}
        onClick={() => {
          refetch()
        }}
      />
    )
  }

  const refetchFlag = async (): Promise<void> => {
    setSkipLoading(true)
    await refetch({
      queryParams: {
        ...queryParams,
        environmentIdentifier
      }
    }).finally(() => {
      setSkipLoading(false)
    })
  }

  const GitSyncActionsComponent = (): ReactElement => <GitSyncActions />

  return (
    <div className={css.pageLayout}>
      <section>
        <Layout.Vertical className={css.flagActivationDetailsLayout}>
          {featureFlag && (
            <FlagActivationDetails
              featureFlag={featureFlag}
              refetchFlag={refetch}
              gitSyncActionsComponent={gitSync?.isGitSyncActionsEnabled ? <GitSyncActionsComponent /> : undefined}
              gitSync={gitSync}
              setGovernanceMetadata={setGovernanceMetadata}
            />
          )}
        </Layout.Vertical>
      </section>
      <section>
        {featureFlag && (
          <FlagActivation
            refetchFlag={refetchFlag}
            refetchFlagLoading={loading}
            gitSync={gitSync}
            projectIdentifier={projectIdentifier as string}
            flagData={featureFlag}
          />
        )}
      </section>
    </div>
  )
}

export default FeatureFlagsDetailPage
