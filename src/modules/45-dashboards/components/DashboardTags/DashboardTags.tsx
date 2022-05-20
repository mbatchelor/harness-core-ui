/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container } from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { DashboardTag, DashboardType, IDashboard } from '@dashboards/types/DashboardTypes'
import moduleTagCss from '@dashboards/common/ModuleTags.module.scss'

export interface DashboardTagProps {
  dashboard?: IDashboard
}

const DashboardTags: React.FC<DashboardTagProps> = ({ dashboard }) => {
  const { getString } = useStrings()
  return (
    <Container className={moduleTagCss.predefinedTags}>
      {dashboard?.type === DashboardType.SHARED && (
        <section key={`harness-tag-${dashboard.id}`} className={moduleTagCss.harnessTag}>
          {getString('dashboards.modules.harness')}
        </section>
      )}
      {dashboard?.data_source.map((tag: DashboardTag | string) => {
        if (tag === DashboardTag.CE) {
          return (
            <section key={`tag-${DashboardTag.CE.toLowerCase()}-${dashboard.id}`} className={moduleTagCss.ceTag}>
              {getString('common.purpose.ce.cloudCost')}
            </section>
          )
        }
        if (tag === DashboardTag.CI) {
          return (
            <section key={`tag-${DashboardTag.CI.toLowerCase()}-${dashboard.id}`} className={moduleTagCss.ciTag}>
              {getString('buildsText')}
            </section>
          )
        }
        if (tag === DashboardTag.CD) {
          return (
            <section key={`tag-${DashboardTag.CD.toLowerCase()}-${dashboard.id}`} className={moduleTagCss.cdTag}>
              {getString('deploymentsText')}
            </section>
          )
        }
        if (tag === DashboardTag.CF) {
          return (
            <section key={`tag-${DashboardTag.CF.toLowerCase()}-${dashboard.id}`} className={moduleTagCss.cfTag}>
              {getString('common.purpose.cf.continuous')}
            </section>
          )
        }
        if (tag === DashboardTag.CG_CD) {
          return (
            <section key={`tag-${DashboardTag.CG_CD.toLowerCase()}-${dashboard.id}`} className={moduleTagCss.cgCdTag}>
              {getString('dashboards.modules.cgDeployments')}
            </section>
          )
        }
        return <></>
      })}
      {dashboard?.description &&
        dashboard.type === DashboardType.ACCOUNT &&
        dashboard?.description
          .split(',')
          .filter((tag: string) => !!tag)
          .map((tag: string) => {
            return (
              <section className={moduleTagCss.customTag} key={`custom-tag-${tag.toLowerCase()}-${dashboard.id}`}>
                {tag}
              </section>
            )
          })}
    </Container>
  )
}

export default DashboardTags
