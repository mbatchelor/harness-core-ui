/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Tabs } from '@harness/uicore'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { Page } from '@common/exports'
import { useStrings } from 'framework/strings'
import { isCommunityPlan } from '@common/utils/utils'
import { ServiceStoreContext, useServiceStore } from './common'

import { ServicesListPage } from './ServicesListPage/ServicesListPage'
import { ServicesDashboardPage } from './ServicesDashboardPage/ServicesDashboardPage'

import css from './Services.module.scss'

export const Services: React.FC = () => {
  const { view, setView, fetchDeploymentList } = useServiceStore()
  const { getString } = useStrings()
  const isCommunity = isCommunityPlan()

  return (
    <ServiceStoreContext.Provider
      value={{
        view,
        setView,
        fetchDeploymentList
      }}
    >
      <Page.Header title={getString('services')} breadcrumbs={<NGBreadcrumbs />} />
      {isCommunity ? (
        <ServicesListPage />
      ) : (
        <div className={css.tabs}>
          <Tabs
            id={'serviceLandingPageTabs'}
            defaultSelectedTabId={'dashboard'}
            tabList={[
              {
                id: 'dashboard',
                title: 'Dashboard',
                panel: <ServicesDashboardPage />
              },
              { id: 'manageServices', title: 'Manage Services', panel: <ServicesListPage /> }
            ]}
          />
        </div>
      )}
    </ServiceStoreContext.Provider>
  )
}
