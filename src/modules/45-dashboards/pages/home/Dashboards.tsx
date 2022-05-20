/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useState } from 'react'
import cx from 'classnames'
import { Dialog, Container, Heading, Icon, Layout } from '@harness/uicore'
import { Color } from '@harness/design-system'
import { useModalHook } from '@harness/use-modal'
import { useStrings } from 'framework/strings'
import DashboardCard from '@dashboards/components/DashboardCard/DashboardCard'
import { DashboardLayoutViews, IDashboard } from '@dashboards/types/DashboardTypes'
import DashboardList from '@dashboards/components/DashboardList/DashboardList'
import CloneDashboardForm from './CloneDashboardForm'
import UpdateDashboardForm from './UpdateDashboardForm'
import css from './HomePage.module.scss'

export interface DashboardsProps {
  dashboards: IDashboard[]
  loading?: boolean
  deleteDashboard: (dashboardId: string) => void
  triggerRefresh: () => void
  view: DashboardLayoutViews
}

const Dashboards: React.FC<DashboardsProps> = ({
  dashboards,
  loading,
  deleteDashboard,
  triggerRefresh,
  view
}): React.ReactElement => {
  const [selectedDashboard, setSelectedDashboard] = useState<IDashboard>()

  const [showCloneModal, hideCloneModal] = useModalHook(
    () => (
      <Dialog isOpen={true} enforceFocus={false} onClose={hideCloneModal} className={cx(css.dashboardDialog)}>
        <CloneDashboardForm formData={selectedDashboard} hideModal={hideCloneModal} reloadDashboards={triggerRefresh} />
      </Dialog>
    ),
    [selectedDashboard]
  )

  const [showEditModal, hideEditModal] = useModalHook(
    () => (
      <Dialog isOpen={true} enforceFocus={false} onClose={hideEditModal} className={cx(css.dashboardDialog)}>
        <UpdateDashboardForm formData={selectedDashboard} hideModal={hideEditModal} reloadDashboards={triggerRefresh} />
      </Dialog>
    ),
    [selectedDashboard]
  )

  const { getString } = useStrings()

  const cloneDashboard = (dashboard: IDashboard): void => {
    setSelectedDashboard(dashboard)
    showCloneModal()
  }

  const editDashboard = (dashboard: IDashboard): void => {
    setSelectedDashboard(dashboard)
    showEditModal()
  }

  const hasDashboards: boolean = useMemo(() => {
    return !!dashboards?.length && dashboards.length > 0
  }, [dashboards])

  return (
    <>
      {hasDashboards && view === DashboardLayoutViews.GRID && (
        <Container className={css.masonry}>
          <Layout.Masonry
            gutter={25}
            items={dashboards}
            renderItem={(dashboard: IDashboard) => (
              <DashboardCard
                dashboard={dashboard}
                cloneDashboard={cloneDashboard}
                deleteDashboard={deleteDashboard}
                editDashboard={editDashboard}
              />
            )}
            keyOf={dashboard => dashboard.id}
          />
        </Container>
      )}

      {hasDashboards && view === DashboardLayoutViews.LIST && (
        <DashboardList
          dashboards={dashboards || []}
          cloneDashboard={cloneDashboard}
          deleteDashboard={deleteDashboard}
          editDashboard={editDashboard}
        />
      )}

      {!hasDashboards && !loading && (
        <Container height="calc(100vh - 226px)" flex={{ align: 'center-center' }}>
          <Layout.Vertical spacing="medium" width={470} flex={{ alignItems: 'center' }} margin={{ top: '-48px' }}>
            <Icon name="dashboard" color={Color.GREY_300} size={35} />
            <Heading level={2} font={{ align: 'center' }} color={Color.GREY_500}>
              {getString('dashboards.homePage.noDashboardsAvailable')}
            </Heading>
          </Layout.Vertical>
        </Container>
      )}
    </>
  )
}

export default Dashboards
