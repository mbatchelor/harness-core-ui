/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { defaultTo as _defaultTo, isBoolean } from 'lodash-es'
import { Layout, Tabs, Tab, Button, Container, Icon } from '@wings-software/uicore'
import { useParams, useHistory } from 'react-router-dom'
import { useToaster } from '@common/exports'
import COGatewayConfig from '@ce/components/COGatewayConfig/COGatewayConfig'
import COGatewayAccess from '@ce/components/COGatewayAccess/COGatewayAccess'
import COGatewayReview from '@ce/components/COGatewayReview/COGatewayReview'
import type { FixedScheduleClient, GatewayDetails } from '@ce/components/COCreateGateway/models'
import routes from '@common/RouteDefinitions'
import { Utils } from '@ce/common/Utils'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { useStrings } from 'framework/strings'
import {
  useSaveService,
  Service,
  useGetServices,
  useCreateStaticSchedules,
  useDeleteStaticSchedule,
  useToggleRuleMode
} from 'services/lw'
import { Breadcrumbs } from '@common/components/Breadcrumbs/Breadcrumbs'
import { ASRuleTabs } from '@ce/constants'
import { GatewayContextProvider } from '@ce/context/GatewayContext'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { USER_JOURNEY_EVENTS } from '@ce/TrackingEventsConstants'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { ConfigTabTitle, ReviewTabTitle, SetupAccessTabTitle } from './TabTitles'
import { getServiceObjectFromgatewayDetails, isPrimaryBtnDisable, trackPrimaryBtnClick } from './helper'
import css from './COGatewayDetails.module.scss'

interface COGatewayDetailsProps {
  previousTab: () => void
  gatewayDetails: GatewayDetails
  setGatewayDetails: (gwDetails: GatewayDetails) => void
  activeTab?: ASRuleTabs
  isEditFlow: boolean
  originalRuleDetails?: Service
}
const COGatewayDetails: React.FC<COGatewayDetailsProps> = props => {
  const { accountId, orgIdentifier, projectIdentifier } = useParams<{
    accountId: string
    orgIdentifier: string
    projectIdentifier: string
  }>()
  const history = useHistory()
  const { getString } = useStrings()
  const { showError, showSuccess } = useToaster()
  const { trackEvent } = useTelemetry()
  const { currentUserInfo } = useAppStore()
  const dryRunModeEnabled = useFeatureFlag(FeatureFlag.CCM_AS_DRY_RUN)

  const [selectedTabId, setSelectedTabId] = useState<string>(_defaultTo(props.activeTab, ASRuleTabs.CONFIGURATION))
  const [validConfig, setValidConfig] = useState<boolean>(false)
  const [validAccessSetup, setValidAccessSetup] = useState<boolean>(false)
  const [saveInProgress, setSaveInProgress] = useState<boolean>(false)
  const [activeConfigStep, setActiveConfigStep] = useState<{ count?: number; tabId?: string } | null>(null)
  const [serverNames, setServerNames] = useState<string[]>([])

  const tabs = [ASRuleTabs.CONFIGURATION, ASRuleTabs.SETUP_ACCESS, ASRuleTabs.REVIEW]

  const { data: servicesData, error } = useGetServices({
    account_id: accountId,
    queryParams: {
      accountIdentifier: accountId
    },
    debounce: 300
  })
  if (error) {
    showError('Faield to fetch services', undefined, 'ce.svc.fetch.error')
  }

  const { mutate: saveGateway } = useSaveService({
    account_id: accountId,
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const { mutate: createStaticSchesules } = useCreateStaticSchedules({
    account_id: accountId,
    queryParams: {
      accountIdentifier: accountId,
      cloud_account_id: props.gatewayDetails.cloudAccount.id
    }
  })

  const { mutate: deleteSchedule } = useDeleteStaticSchedule({
    account_id: accountId,
    queryParams: { accountIdentifier: accountId }
  })

  const { mutate: toggleMode } = useToggleRuleMode({
    account_id: accountId,
    rule_id: _defaultTo(props.originalRuleDetails?.id, 0),
    queryParams: { accountIdentifier: accountId }
  })

  const saveStaticSchedules = async (ruleId: number) => {
    const schedules = _defaultTo(
      props.gatewayDetails.schedules
        ?.filter(s => !s.isDeleted)
        ?.map(s =>
          Utils.convertScheduleClientToSchedule(s, {
            accountId,
            ruleId,
            userId: _defaultTo(currentUserInfo.uuid, '')
          })
        ),
      []
    )
    for (const sch of schedules) {
      /* eslint-disable-next-line no-await-in-loop */
      await saveSchedule(sch)
    }
  }

  const saveSchedule = async (data: FixedScheduleClient) => {
    try {
      await createStaticSchesules({ schedule: data })
    } catch (e) {
      showError(
        getString('ce.co.autoStoppingRule.configuration.step4.tabs.schedules.unsuccessfulDeletionMessage', {
          error: _defaultTo(e.data?.errors?.join('\n'), e.data?.message)
        })
      )
    }
  }

  const deleteStaticSchedules = async () => {
    const deletedSchedules = Utils.getConditionalResult(
      props.isEditFlow,
      _defaultTo(
        props.gatewayDetails.schedules?.filter(s => s.isDeleted),
        []
      ),
      []
    )
    for (const delSch of deletedSchedules) {
      /* eslint-disable-next-line no-await-in-loop */
      await triggerDeleteSchedule(delSch)
    }
  }

  const triggerDeleteSchedule = async (data: FixedScheduleClient) => {
    await deleteSchedule(data.id as number)
    showSuccess(
      getString('ce.co.autoStoppingRule.configuration.step4.tabs.schedules.successfullyDeletedSchedule', {
        name: data.name
      })
    )
  }

  const handlePostRuleSave = async (response?: Service) => {
    if (response) {
      await deleteStaticSchedules()
      await saveStaticSchedules(response?.id as number)
      history.push(
        routes.toCECORules({
          accountId
        })
      )
    }
  }

  const handleModeToggle = async (currRuleDetails: Service) => {
    if (
      dryRunModeEnabled &&
      props.isEditFlow &&
      isBoolean(currRuleDetails?.opts?.dry_run) &&
      currRuleDetails?.opts?.dry_run !== props.originalRuleDetails?.opts?.dry_run
    ) {
      await toggleMode({
        id: _defaultTo(props.originalRuleDetails?.id, 0)
      })
    }
  }

  const onSave = async (): Promise<void> => {
    try {
      setSaveInProgress(true)
      const gateway = getServiceObjectFromgatewayDetails(
        props.gatewayDetails,
        orgIdentifier,
        projectIdentifier,
        accountId,
        serverNames
      )
      handleModeToggle(gateway)
      const result = await saveGateway({ service: gateway, deps: props.gatewayDetails.deps, apply_now: false }) // eslint-disable-line
      // Rule creation is halted until the access point creation takes place successfully.
      // Informing the user regarding the same
      if (props.gatewayDetails.accessPointData?.status === 'submitted') {
        showSuccess('Rule will take effect once the load balancer creation is successful!!')
      }
      await handlePostRuleSave(result.response)
    } catch (e) {
      setSaveInProgress(false)
      showError(e.data?.errors?.join('\n') || e.data?.message || e.message, undefined, 'ce.savegw.error')
    }
  }
  const nextTab = (): void => {
    const tabIndex = tabs.findIndex(t => t == selectedTabId)
    if (tabIndex == tabs.length - 1) {
      trackEvent(USER_JOURNEY_EVENTS.SAVE_RULE_CLICK, {})
      onSave()
    } else if (tabIndex < tabs.length - 1) {
      setSelectedTabId(tabs[tabIndex + 1])
    }
  }
  const previousTab = (): void => {
    const tabIndex = tabs.findIndex(t => t == selectedTabId)
    if (tabIndex > 0) {
      setSelectedTabId(tabs[tabIndex - 1])
    } else {
      props.previousTab()
    }
  }
  const selectTab = (tabId: string) => {
    const tabIndex = tabs.findIndex(t => t == tabId)
    setSelectedTabId(tabs[tabIndex])
  }
  const getNextButtonText = (): string => {
    const tabIndex = tabs.findIndex(t => t == selectedTabId)
    return Utils.getConditionalResult(
      tabIndex === tabs.length - 1,
      getString('ce.co.autoStoppingRule.save'),
      getString('next')
    )
  }

  const handleReviewDetailsEdit = (tabDetails: {
    id: string
    metaData?: { activeStepCount?: number; activeStepTabId?: string }
  }) => {
    setSelectedTabId(tabDetails.id)
    const activeStepDetails: { count?: number; tabId?: string } = {}
    activeStepDetails['count'] = tabDetails.metaData?.activeStepCount
    activeStepDetails['tabId'] = tabDetails.metaData?.activeStepTabId
    setActiveConfigStep(activeStepDetails)
  }

  return (
    <Container style={{ overflow: 'scroll', maxHeight: '100vh', backgroundColor: 'var(--white)' }}>
      <Breadcrumbs
        className={css.breadCrumb}
        links={[
          {
            url: routes.toCECORules({ accountId }),
            label: getString('ce.co.breadCrumb.rules')
          },
          {
            url: '',
            label: props.gatewayDetails.name
          }
        ]}
      />
      <GatewayContextProvider isEditFlow={props.isEditFlow}>
        <Container className={css.detailsTab}>
          <Tabs id="tabsId1" selectedTabId={selectedTabId} onChange={selectTab}>
            <Tab
              id="configuration"
              disabled
              title={<ConfigTabTitle isValidConfig={validConfig} />}
              panel={
                <COGatewayConfig
                  gatewayDetails={props.gatewayDetails}
                  setGatewayDetails={props.setGatewayDetails}
                  valid={validConfig}
                  setValidity={setValidConfig}
                  activeStepDetails={activeConfigStep}
                  allServices={servicesData?.response as Service[]}
                />
              }
            />
            <Tab
              id="setupAccess"
              disabled
              title={<SetupAccessTabTitle isValidAccessSetup={validAccessSetup} />}
              panel={
                <COGatewayAccess
                  valid={validAccessSetup}
                  setValidity={setValidAccessSetup}
                  gatewayDetails={props.gatewayDetails}
                  setGatewayDetails={props.setGatewayDetails}
                  activeStepDetails={activeConfigStep}
                  allServices={servicesData?.response as Service[]}
                  serverNames={serverNames}
                  setServerNames={setServerNames}
                />
              }
            />
            <Tab
              id="review"
              disabled
              title={<ReviewTabTitle isValidConfig={validConfig} isValidAccessSetup={validAccessSetup} />}
              panel={
                <COGatewayReview
                  gatewayDetails={props.gatewayDetails}
                  onEdit={handleReviewDetailsEdit}
                  allServices={servicesData?.response as Service[]}
                  serverNames={serverNames}
                />
              }
            />
          </Tabs>
        </Container>
      </GatewayContextProvider>
      <Layout.Horizontal className={css.footer} spacing="medium">
        <Button
          text="Previous"
          icon="chevron-left"
          onClick={() => previousTab()}
          disabled={selectedTabId == tabs[0] && (props.gatewayDetails.id as number) != undefined}
        />
        <Button
          intent="primary"
          text={getNextButtonText()}
          icon="chevron-right"
          onClick={() => {
            trackPrimaryBtnClick(
              selectedTabId,
              {
                [ASRuleTabs.CONFIGURATION]: {},
                [ASRuleTabs.REVIEW]: {},
                [ASRuleTabs.SETUP_ACCESS]: props.gatewayDetails.opts.access_details
              },
              trackEvent
            )
            nextTab()
          }}
          disabled={isPrimaryBtnDisable(
            selectedTabId,
            { config: validConfig, setupAccess: validAccessSetup },
            saveInProgress
          )}
          loading={saveInProgress}
        />
        {saveInProgress ? <Icon name="spinner" size={24} color="blue500" style={{ alignSelf: 'center' }} /> : null}
      </Layout.Horizontal>
    </Container>
  )
}

export default COGatewayDetails
