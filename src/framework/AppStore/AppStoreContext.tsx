/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect } from 'react'
import { useParams, useHistory } from 'react-router-dom'

import { fromPairs, defaultTo } from 'lodash-es'

// useToaster not imported from '@common/exports' to prevent circular dependency
import { PageSpinner, useToaster } from '@harness/uicore'

import { useQueryParams } from '@common/hooks'
import {
  Project,
  getProjectPromise,
  useGetCurrentUserInfo,
  UserInfo,
  isGitSyncEnabledPromise,
  GitEnabledDTO,
  Organization,
  useGetOrganization,
  Error
} from 'services/cd-ng'
import { useGetFeatureFlags } from 'services/portal'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import type { FeatureFlag } from '@common/featureFlags'
import { useTelemetryInstance } from '@common/hooks/useTelemetryInstance'
import { PreferenceScope, usePreferenceStore } from 'framework/PreferenceStore/PreferenceStoreContext'
import routes from '@common/RouteDefinitions'

export type FeatureFlagMap = Partial<Record<FeatureFlag, boolean>>

/**
 * Application Store - essential application-level states which are shareable
 * across Framework and Modules. These states are writeable within Frameworks.
 * Modules are allowed to read only.
 */
export interface AppStoreContextProps {
  readonly selectedProject?: Project
  readonly selectedOrg?: Organization
  readonly isGitSyncEnabled?: boolean
  readonly connectivityMode?: GitEnabledDTO['connectivityMode'] //'MANAGER' | 'DELEGATE'
  readonly currentUserInfo: UserInfo
  /** feature flags */
  readonly featureFlags: FeatureFlagMap

  updateAppStore(
    data: Partial<
      Pick<
        AppStoreContextProps,
        'selectedOrg' | 'selectedProject' | 'isGitSyncEnabled' | 'connectivityMode' | 'currentUserInfo'
      >
    >
  ): void
}

export interface SavedProjectDetails {
  projectIdentifier: string
  orgIdentifier: string
}

export const AppStoreContext = React.createContext<AppStoreContextProps>({
  featureFlags: {},
  currentUserInfo: { uuid: '' },
  isGitSyncEnabled: false,
  connectivityMode: undefined,
  updateAppStore: () => void 0
})

export function useAppStore(): AppStoreContextProps {
  return React.useContext(AppStoreContext)
}

const getIdentifiersFromSavedProj = (savedProject: SavedProjectDetails): SavedProjectDetails => {
  return {
    projectIdentifier: defaultTo(savedProject?.projectIdentifier, ''),
    orgIdentifier: defaultTo(savedProject?.orgIdentifier, '')
  }
}

const getRedirectionUrl = (accountId: string, source: string | undefined): string => {
  const baseUrl = window.location.pathname.replace(/\/ng\//, '/')
  const dashboardUrl = `${baseUrl}#/account/${accountId}/dashboard`
  const onboardingUrl = `${baseUrl}#/account/${accountId}/onboarding`
  return source === 'signup' ? onboardingUrl : dashboardUrl
}

const LOCAL_FF_PREFERENCE_STORE_ENABLED = false

export function AppStoreProvider(props: React.PropsWithChildren<unknown>): React.ReactElement {
  const { showError } = useToaster()
  const history = useHistory()

  const {
    accountId,
    projectIdentifier: projectIdentifierFromPath,
    orgIdentifier: orgIdentifierFromPath
  } = useParams<ProjectPathProps>()
  let projectIdentifier = projectIdentifierFromPath
  let orgIdentifier = orgIdentifierFromPath

  const {
    preference: savedProject,
    setPreference: setSavedProject,
    clearPreference: clearSavedProject,
    updatePreferenceStore
  } = usePreferenceStore<SavedProjectDetails>(PreferenceScope.USER, 'savedProject')

  const [state, setState] = React.useState<Omit<AppStoreContextProps, 'updateAppStore' | 'strings'>>({
    featureFlags: {},
    currentUserInfo: { uuid: '' },
    isGitSyncEnabled: false,
    connectivityMode: undefined
  })

  if (!projectIdentifier && !orgIdentifier && LOCAL_FF_PREFERENCE_STORE_ENABLED) {
    const identifiersFromSavedProj = getIdentifiersFromSavedProj(savedProject)
    projectIdentifier = identifiersFromSavedProj.projectIdentifier
    orgIdentifier = identifiersFromSavedProj.orgIdentifier
  }

  const { data: featureFlags, loading: featureFlagsLoading } = useGetFeatureFlags({
    accountId,
    pathParams: { accountId }
  })

  const { refetch: refetchOrg, data: orgDetails } = useGetOrganization({
    identifier: orgIdentifier,
    queryParams: {
      accountIdentifier: accountId
    },
    lazy: true
  })
  const { data: userInfo, loading: userInfoLoading } = useGetCurrentUserInfo({
    queryParams: { accountIdentifier: accountId }
  })

  const { source } = useQueryParams<{ source?: string }>()

  const showErrorAndRedirect = (getProjectResponse: Error): void => {
    if (projectIdentifierFromPath && orgIdentifierFromPath) {
      showError(getProjectResponse?.message)

      // send the user to Projects Listing
      history.push(routes.toProjects({ accountId }))
    }
  }

  useEffect(() => {
    // don't redirect on local because it goes into infinite loop
    // because there may be no current gen to go to
    const currentAccount = userInfo?.data?.accounts?.find(account => account.uuid === accountId)
    if (!__DEV__ && currentAccount && !currentAccount.nextGenEnabled) {
      window.location.href = getRedirectionUrl(accountId, source)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo?.data?.accounts])

  // here we don't use hook useTelemetry to avoid circular dependencies
  const telemetry = useTelemetryInstance()
  useEffect(() => {
    if (userInfo?.data?.email && telemetry.initialized) {
      telemetry.identify({ userId: userInfo?.data?.email })
    }
    updatePreferenceStore({ currentUserInfo: userInfo?.data })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo?.data?.email, telemetry])

  // update feature flags in context
  useEffect(() => {
    // TODO: Handle better if fetching feature flags fails
    if (featureFlags) {
      const featureFlagsMap = fromPairs(
        featureFlags?.resource?.map(flag => {
          return [flag.name, !!flag.enabled]
        })
      )

      setState(prevState => ({
        ...prevState,
        featureFlags: featureFlagsMap as FeatureFlagMap
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureFlags])

  // update gitSyncEnabled when selectedProject changes
  useEffect(() => {
    // For gitSync, using path params instead of project/org from PreferenceFramework
    if (projectIdentifierFromPath) {
      isGitSyncEnabledPromise({
        queryParams: {
          accountIdentifier: accountId,
          orgIdentifier: orgIdentifierFromPath,
          projectIdentifier: projectIdentifierFromPath
        }
      }).then((response: GitEnabledDTO) => {
        setState(prevState => ({
          ...prevState,
          isGitSyncEnabled: !!response?.gitSyncEnabled,
          connectivityMode: response?.connectivityMode
        }))
      })
    } else {
      setState(prevState => ({
        ...prevState,
        isGitSyncEnabled: false,
        connectivityMode: undefined
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedProject, projectIdentifierFromPath, orgIdentifierFromPath, state.isGitSyncEnabled])

  // set selectedOrg when orgDetails are fetched
  useEffect(() => {
    setState(prevState => ({
      ...prevState,
      selectedOrg: orgDetails?.data?.organization
    }))
  }, [orgDetails?.data?.organization])

  // When projectIdentifier in URL changes, fetch projectDetails, and update selectedProject & savedProject-preference
  useEffect(() => {
    if (projectIdentifier && orgIdentifier) {
      getProjectPromise({
        identifier: projectIdentifier,
        queryParams: {
          accountIdentifier: accountId,
          orgIdentifier
        }
      }).then(response => {
        const project = response?.data?.project

        if (project) {
          setState(prevState => ({
            ...prevState,
            selectedProject: project
          }))
          if (LOCAL_FF_PREFERENCE_STORE_ENABLED) {
            setSavedProject({ projectIdentifier, orgIdentifier })
          }
        } else {
          // if no project was fetched, clear preference
          if (LOCAL_FF_PREFERENCE_STORE_ENABLED) {
            clearSavedProject()
          }
          setState(prevState => ({
            ...prevState,
            selectedOrg: undefined,
            selectedProject: undefined
          }))
          // if user is on a URL with projectId and orgId in path, show toast error & redirect
          showErrorAndRedirect(response as Error)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectIdentifier, orgIdentifier])
  // update selectedOrg when orgidentifier in url changes
  useEffect(() => {
    if (orgIdentifier) {
      refetchOrg()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgIdentifier])
  // clear selectedProject selectedOrg when accountId changes
  useEffect(() => {
    setState(prevState => ({
      ...prevState,
      selectedProject: undefined,
      selectedOrg: undefined
    }))
  }, [accountId])

  React.useEffect(() => {
    if (userInfo?.data) {
      const user = userInfo.data
      setState(prevState => ({
        ...prevState,
        currentUserInfo: user
      }))
    }
    //TODO: Logout if we don't have userInfo???
  }, [userInfo?.data])

  function updateAppStore(
    data: Partial<
      Pick<
        AppStoreContextProps,
        'selectedOrg' | 'selectedProject' | 'isGitSyncEnabled' | 'connectivityMode' | 'currentUserInfo'
      >
    >
  ): void {
    setState(prevState => ({
      ...prevState,
      selectedOrg: data.selectedOrg,
      selectedProject: data.selectedProject,
      isGitSyncEnabled: defaultTo(data.isGitSyncEnabled, prevState?.isGitSyncEnabled),
      connectivityMode: defaultTo(data.connectivityMode, prevState?.connectivityMode),
      currentUserInfo: defaultTo(data.currentUserInfo, prevState?.currentUserInfo)
    }))
  }

  return (
    <AppStoreContext.Provider
      value={{
        ...state,
        updateAppStore
      }}
    >
      {featureFlagsLoading || userInfoLoading ? <PageSpinner /> : props.children}
    </AppStoreContext.Provider>
  )
}
