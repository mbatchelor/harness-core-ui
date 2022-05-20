/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Layout, Toggle, Tabs, Tab } from '@wings-software/uicore'
import { defaultTo as _defaultTo } from 'lodash-es'
import { AdvancedConfigTabs, CONFIG_STEP_IDS, RESOURCES } from '@ce/constants'
import { useStrings } from 'framework/strings'
import { Utils } from '@ce/common/Utils'
import type {
  ASRuleCreationActiveStep,
  FixedScheduleClient,
  GatewayDetails
} from '@ce/components/COCreateGateway/models'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import type { Service } from 'services/lw'
import COGatewayConfigStep from '../../COGatewayConfigStep'
import RuleDependency from './RuleDependency'
import FixedSchedules from './FixedSchedules'

interface AdvancedConfigurationProps {
  selectedResource: RESOURCES
  totalStepsCount: number
  gatewayDetails: GatewayDetails
  setGatewayDetails: (details: GatewayDetails) => void
  allServices: Service[]
  activeStepDetails?: ASRuleCreationActiveStep | null
}

const AdvancedConfiguration: React.FC<AdvancedConfigurationProps> = props => {
  const { getString } = useStrings()
  const dryRunModeEnabled = useFeatureFlag(FeatureFlag.CCM_AS_DRY_RUN)

  const [selectedTab, setSelectedTab] = useState<AdvancedConfigTabs>(
    props.activeStepDetails?.count === 4 && props.activeStepDetails?.tabId
      ? (props.activeStepDetails?.tabId as AdvancedConfigTabs)
      : AdvancedConfigTabs.deps
  )

  const isK8sSelected = props.selectedResource === RESOURCES.KUBERNETES
  const isEcsSelected = props.selectedResource === RESOURCES.ECS
  const isAwsProvider = Utils.isProviderAws(props.gatewayDetails.provider)

  const handleTabChange = (id: string) => {
    setSelectedTab(id as AdvancedConfigTabs)
  }

  /* istanbul ignore next */
  const handledFixedSchedulesAddition = (schedules: FixedScheduleClient[]) => {
    props.setGatewayDetails({ ...props.gatewayDetails, schedules })
  }

  return (
    <COGatewayConfigStep
      count={props.totalStepsCount}
      title={`${getString('ce.co.autoStoppingRule.configuration.step4.setup')} ${getString(
        'ce.co.autoStoppingRule.configuration.step4.advancedConfiguration'
      )}`}
      subTitle={getString('ce.co.gatewayConfig.advancedConfigDescription')}
      totalStepsCount={props.totalStepsCount}
      id={CONFIG_STEP_IDS[3]}
      dataTooltip={{
        titleId: isAwsProvider ? 'awsSetupAdvancedConfig' : /* istanbul ignore next */ 'azureSetupAdvancedConfig'
      }}
    >
      <Layout.Vertical spacing="medium">
        <Layout.Horizontal spacing={'large'}>
          {(isK8sSelected || isEcsSelected) && (
            <Toggle
              label={getString('ce.co.autoStoppingRule.review.hideProgressPage')}
              checked={props.gatewayDetails.opts.hide_progress_page}
              onToggle={isToggled => {
                props.setGatewayDetails({
                  ...props.gatewayDetails,
                  opts: { ...props.gatewayDetails.opts, hide_progress_page: isToggled }
                })
              }}
              data-testid={'progressPageViewToggle'}
            />
          )}
          {dryRunModeEnabled && (
            <Toggle
              label={getString('ce.co.dryRunMode')}
              checked={props.gatewayDetails.opts.dry_run}
              onToggle={isToggled => {
                props.setGatewayDetails({
                  ...props.gatewayDetails,
                  opts: { ...props.gatewayDetails.opts, dry_run: isToggled }
                })
              }}
              data-testid={'dryRunToggle'}
            />
          )}
        </Layout.Horizontal>
        <Tabs id="advancedConfigTabs" selectedTabId={selectedTab} onChange={handleTabChange}>
          <Tab
            id={AdvancedConfigTabs.deps}
            title={getString('ce.co.autoStoppingRule.configuration.step4.tabs.deps.title')}
            panel={
              <RuleDependency
                gatewayDetails={props.gatewayDetails}
                setGatewayDetails={props.setGatewayDetails}
                allServices={props.allServices}
              />
            }
          />
          <Tab
            id={AdvancedConfigTabs.schedules}
            title={getString('ce.co.autoStoppingRule.configuration.step4.tabs.schedules.title')}
            panel={
              <FixedSchedules
                schedules={_defaultTo(props.gatewayDetails.schedules, [])}
                addSchedules={handledFixedSchedulesAddition}
              />
            }
          />
        </Tabs>
      </Layout.Vertical>
    </COGatewayConfigStep>
  )
}

export default AdvancedConfiguration
