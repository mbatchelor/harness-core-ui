/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo as _defaultTo, isEmpty as _isEmpty, values as _values } from 'lodash-es'
import { Button, Container, Heading, Layout, Select, SelectOption, Text, useToaster } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { Dialog, IDialogProps } from '@blueprintjs/core'
import { useModalHook } from '@harness/use-modal'
import { Utils } from '@ce/common/Utils'
import { useGatewayContext } from '@ce/context/GatewayContext'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { useStrings } from 'framework/strings'
import { AccessPoint, AccessPointCore, useAccessPointResources, useListAccessPoints } from 'services/lw'
import { useTelemetry } from '@common/hooks/useTelemetry'
import type { AccessPointScreenMode } from '@ce/types'
import type { GatewayDetails } from '../COCreateGateway/models'
import LoadBalancerDnsConfig from './LoadBalancerDnsConfig'
import AzureAPConfig from '../COAccessPointList/AzureAPConfig'
import {
  getAccessPointFetchQueryParams,
  getApSelectionList,
  getDummyResource,
  getSupportedResourcesQueryParams,
  getLoadBalancerToEdit,
  getMatchingLoadBalancer,
  getLinkedAccessPoint,
  isValidLoadBalancer
} from './helper'
import GCPAccessPointConfig from '../AccessPoint/GCPAccessPoint/GCPAccessPointConfig'
import css from './COGatewayAccess.module.scss'

interface LoadBalancerSelectionProps {
  gatewayDetails: GatewayDetails
  setGatewayDetails: (details: GatewayDetails) => void
}

interface UseLoadBalancerProps {
  gatewayDetails: GatewayDetails
  loadBalancer: AccessPoint
  handleClose: (clearStatus?: boolean) => void
  mode: AccessPointScreenMode
  handleSave: (lb: AccessPoint) => void
}

const modalPropsLight: IDialogProps = {
  isOpen: true,
  enforceFocus: false,
  style: {
    width: 860,
    padding: 40,
    position: 'relative',
    minHeight: 500
  }
}

const useLoadBalancerModal = (
  { gatewayDetails, loadBalancer, handleClose, mode, handleSave }: UseLoadBalancerProps,
  deps: any[] = []
) => {
  const isAwsProvider = Utils.isProviderAws(gatewayDetails.provider)
  const isAzureProvider = Utils.isProviderAzure(gatewayDetails.provider)
  const isGcpProvider = Utils.isProviderGcp(gatewayDetails.provider)

  const [openLoadBalancerModal, hideLoadBalancerModal] = useModalHook(() => {
    const onClose = (clearStatus = false) => {
      handleClose(clearStatus)
      hideLoadBalancerModal()
    }
    return (
      <Dialog onClose={hideLoadBalancerModal} {...modalPropsLight}>
        {isAwsProvider && (
          <LoadBalancerDnsConfig
            loadBalancer={loadBalancer}
            cloudAccountId={gatewayDetails.cloudAccount.id}
            onClose={onClose}
            mode={mode}
            onSave={handleSave}
          />
        )}
        {isAzureProvider && (
          <AzureAPConfig
            cloudAccountId={gatewayDetails.cloudAccount.id}
            onSave={handleSave}
            mode={mode}
            onClose={onClose}
            loadBalancer={loadBalancer}
          />
        )}
        {isGcpProvider && (
          <GCPAccessPointConfig
            cloudAccountId={gatewayDetails.cloudAccount.id}
            onSave={handleSave}
            mode={mode}
            onClose={onClose}
            loadBalancer={loadBalancer}
          />
        )}
        <Button
          minimal
          icon="cross"
          iconProps={{ size: 18 }}
          onClick={() => {
            onClose(true)
          }}
          style={{ position: 'absolute', right: 'var(--spacing-large)', top: 'var(--spacing-large)' }}
          data-testid={'close-instance-modal'}
        />
      </Dialog>
    )
  }, deps)
  return {
    openLoadBalancerModal
  }
}

const LoadBalancerSelection: React.FC<LoadBalancerSelectionProps> = ({ gatewayDetails, setGatewayDetails }) => {
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()
  const { isEditFlow } = useGatewayContext()
  const { showError } = useToaster()
  const { trackEvent } = useTelemetry()
  const isAwsProvider = Utils.isProviderAws(gatewayDetails.provider)
  const isAzureProvider = Utils.isProviderAzure(gatewayDetails.provider)
  const isGcpProvider = Utils.isProviderGcp(gatewayDetails.provider)

  const [apCoreList, setApCoreList] = useState<SelectOption[]>([])
  const [selectedApCore, setSelectedApCore] = useState<SelectOption>()
  const [apCoreResponseList, setApCoreResponseList] = useState<AccessPointCore[]>([])
  const [selectedLoadBalancer, setSelectedLoadBalancer] = useState<AccessPointCore>()
  const [accessPoint, setAccessPoint] = useState<AccessPoint>()
  const [isCreateMode, setIsCreateMode] = useState<boolean>(false)

  const {
    data: accessPoints,
    loading: accessPointsLoading,
    refetch: refetchAccessPoints
  } = useListAccessPoints({
    account_id: accountId,
    queryParams: getAccessPointFetchQueryParams(
      { gatewayDetails: gatewayDetails, accountId },
      { isAwsProvider, isGcpProvider }
    )
  })

  const {
    data: apCoresResponse,
    loading: apCoresLoading,
    refetch: apCoresRefetch
  } = useAccessPointResources({
    account_id: accountId,
    queryParams: getSupportedResourcesQueryParams({ gatewayDetails: gatewayDetails, accountId }, { isGcpProvider })
  })

  useEffect(() => {
    if (accessPoints?.response?.length === 0) {
      return
    }
    if (gatewayDetails.accessPointID) {
      const targetAp = accessPoints?.response?.find(_ap => _ap.id === gatewayDetails.accessPointID)
      if (targetAp) {
        setAccessPoint(targetAp)
      }
    }
  }, [accessPoints?.response])

  useEffect(() => {
    const submittedAccessPoints = accessPoints?.response?.filter(_item => _item.status === 'submitted')
    if (apCoresResponse?.response?.length === 0 && _isEmpty(submittedAccessPoints)) {
      return
    }

    const apCoresResponseMap: Record<string, AccessPointCore> = {}
    apCoresResponse?.response?.forEach(_item => {
      apCoresResponseMap[_item.details?.name as string] = _item
    })

    submittedAccessPoints?.forEach(_item => {
      apCoresResponseMap[_item.name as string] = getDummyResource(_item, { isAwsProvider, isAzureProvider })
    })
    setApCoreResponseList(_values(apCoresResponseMap))
  }, [apCoresResponse?.response, accessPoints?.response])

  useEffect(() => {
    const loaded = getApSelectionList(apCoreResponseList, { isAwsProvider, isAzureProvider, isGcpProvider })
    setApCoreList(loaded)
  }, [apCoreResponseList])

  useEffect(() => {
    const resourceId = isAwsProvider
      ? accessPoint?.metadata?.albArn
      : _defaultTo(accessPoint?.metadata?.app_gateway_id, accessPoint?.id) // handled case for "submitted" state access points
    const selectedResource = resourceId && apCoreList.find(_item => _item.value === resourceId)
    if (selectedResource) {
      setSelectedApCore(selectedResource)
    }
  }, [accessPoint, apCoreList])

  useEffect(() => {
    if (!accessPoint || !accessPoint.id) {
      return
    }
    const updatedGatewayDetails = {
      ...gatewayDetails,
      accessPointID: accessPoint.id,
      accessPointData: accessPoint
    }
    setGatewayDetails(updatedGatewayDetails)
    // setGeneratedHostName(generateHostName(accessPoint.host_name as string))
  }, [accessPoint])

  const { openLoadBalancerModal } = useLoadBalancerModal(
    {
      gatewayDetails: gatewayDetails,
      mode: Utils.getConditionalResult(isCreateMode, 'create', 'import'),
      loadBalancer: getLoadBalancerToEdit(
        {
          lbDetails: selectedLoadBalancer,
          gatewayDetails: gatewayDetails,
          accountId
        },
        { isAwsProvider, isAzureProvider, isCreateMode, isGcpProvider }
      ),
      handleClose: clearStatus => {
        if (clearStatus && !isCreateMode) {
          clearAPData()
        }
        if (isCreateMode) {
          setIsCreateMode(false)
        }
      },
      handleSave: savedLb => {
        setAccessPoint(savedLb)
        if (isCreateMode) {
          setIsCreateMode(false)
        }
        if (isAwsProvider) {
          apCoresRefetch()
        }
        if (isAzureProvider || isGcpProvider) {
          refetchAccessPoints()
        }
      }
    },
    [selectedLoadBalancer, isCreateMode]
  )

  const updateLoadBalancerDetails = (_accessPointDetails?: AccessPoint) => {
    const updatedGatewayDetails = {
      ...gatewayDetails,
      accessPointID: _defaultTo(_accessPointDetails?.id, ''),
      accessPointData: _accessPointDetails
      // hostName: generateHostName(_accessPointDetails?.host_name || '')
    }
    setGatewayDetails(updatedGatewayDetails)
    // setGeneratedHostName(updatedGatewayDetails.hostName || getString('ce.co.dnsSetup.autoURL'))
  }

  const clearAPData = () => {
    setSelectedApCore({ label: '', value: '' })
    updateLoadBalancerDetails()
    setSelectedLoadBalancer(undefined)
  }

  const handleLoadBalancerUpdation = (lb: AccessPointCore) => {
    let linkedAccessPoint = getLinkedAccessPoint(_defaultTo(accessPoints?.response, []), isAwsProvider, lb)
    if (!linkedAccessPoint) {
      linkedAccessPoint = accessPoint
    }

    // Use only those Access Points which are not in errored state.
    if (linkedAccessPoint?.status === 'errored') {
      showError(getString('ce.co.autoStoppingRule.setupAccess.erroredAccessPointSelectionText'))
      clearAPData()
    } else {
      updateLoadBalancerDetails(linkedAccessPoint)
    }
  }

  const handleLoadBalancerSelection = (item: SelectOption) => {
    setSelectedApCore(item)
    const matchedLb = getMatchingLoadBalancer(item, apCoreResponseList, { isAwsProvider })
    setSelectedLoadBalancer(matchedLb)
    if (
      isValidLoadBalancer(matchedLb as AccessPointCore, _defaultTo(accessPoints?.response, []), accessPoint, {
        isAwsProvider,
        isAzureProvider,
        isGcpProvider
      })
    ) {
      handleLoadBalancerUpdation(matchedLb as AccessPointCore)
    } else {
      isCreateMode && setIsCreateMode(false)
      openLoadBalancerModal()
    }
  }

  const handleCreateNewLb = () => {
    setIsCreateMode(true)
    trackEvent('MadeNewAccessPoint', {})
    openLoadBalancerModal()
  }

  return (
    <Container className={css.dnsLinkContainer}>
      <Heading level={3} font={{ weight: 'bold' }} className={css.header}>
        {getString(
          Utils.getConditionalResult(
            isAwsProvider || isGcpProvider,
            'ce.co.autoStoppingRule.setupAccess.selectLb',
            'ce.co.autoStoppingRule.setupAccess.selectAppGateway'
          )
        )}
      </Heading>
      <Layout.Horizontal className={css.selectLoadBalancerContainer}>
        {/* <img src={loadBalancerSvg} className={css.helperImage} /> */}
        <div>
          <Text className={css.helpText}>{getString('ce.co.autoStoppingRule.setupAccess.selectLbHelpText')}</Text>
          <Layout.Horizontal flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
            <Select
              name="accessPoint"
              // label={getString('ce.co.autoStoppingRule.setupAccess.chooseLbText')}
              items={apCoreList}
              onChange={e => {
                // formik.setFieldValue('accessPoint', e.value)
                handleLoadBalancerSelection(e)
                trackEvent('SelectingAccessPoint', {})
              }}
              value={selectedApCore}
              disabled={isEditFlow || accessPointsLoading || apCoresLoading}
              className={css.loadBalancerSelector}
            />
            {!isEditFlow && _isEmpty(gatewayDetails.routing.container_svc) && (
              <Text color={Color.PRIMARY_6} onClick={handleCreateNewLb} style={{ cursor: 'pointer' }}>
                {`+${Utils.getConditionalResult(
                  isAwsProvider || isGcpProvider,
                  getString('ce.co.accessPoint.new'),
                  getString('ce.co.accessPoint.newAppGateway')
                )}`}
              </Text>
            )}
          </Layout.Horizontal>
        </div>
      </Layout.Horizontal>
    </Container>
  )
}

export default LoadBalancerSelection
