/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useMemo, useState } from 'react'
import { noop } from 'lodash-es'
import { useParams } from 'react-router-dom'
import {
  Text,
  Button,
  Container,
  Formik,
  FormikForm,
  Layout,
  SelectOption,
  Utils,
  useToaster,
  MultiTypeInputType,
  getMultiTypeFromValue
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import {
  useGetAppDynamicsApplications,
  useGetAppDynamicsTiers,
  MetricPackDTO,
  AppdynamicsValidationResponse
} from 'services/cv'
import { Connectors } from '@connectors/constants'
import { useStrings } from 'framework/strings'
import CardWithOuterTitle from '@cv/pages/health-source/common/CardWithOuterTitle/CardWithOuterTitle'
import DrawerFooter from '@cv/pages/health-source/common/DrawerFooter/DrawerFooter'
import ValidationStatus from '@cv/pages/components/ValidationStatus/ValidationStatus'
import MetricsVerificationModal from '@cv/components/MetricsVerificationModal/MetricsVerificationModal'
import { StatusOfValidation } from '@cv/pages/components/ValidationStatus/ValidationStatus.constants'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import useGroupedSideNaveHook from '@cv/hooks/GroupedSideNaveHook/useGroupedSideNaveHook'
import { getOptions, validateMetrics, createMetricDataFormik } from '../MonitoredServiceConnector.utils'
import { HealthSoureSupportedConnectorTypes } from '../MonitoredServiceConnector.constants'
import {
  checkAppAndTierAreNotFixed,
  createAppDFormData,
  getAllowedTypes,
  initAppDCustomFormValue,
  initializeNonCustomFields,
  resetShowCustomMetric,
  setAppAndTierAsInputIfConnectorIsInput,
  setCustomFieldAndValidation,
  shouldMakeTierCall,
  showValidation,
  submitData,
  validateMapping
} from './AppDHealthSource.utils'
import type { AppDynamicsData, AppDynamicsFomikFormInterface } from './AppDHealthSource.types'
import MetricPackCustom from '../MetricPackCustom'
import CustomMetric from '../../common/CustomMetric/CustomMetric'
import AppDCustomMetricForm from './Components/AppDCustomMetricForm/AppDCustomMetricForm'
import AppDApplications from './Components/AppDApplications/AppDApplications'
import AppDynamicsTier from './Components/AppDynamicsTier/AppDynamicsTier'
import AppDMetricThreshold from './Components/AppDMetricThreshold/AppDMetricThreshold'
import css from './AppDHealthSource.module.scss'

export default function AppDMonitoredSource({
  data: appDynamicsData,
  onSubmit,
  onPrevious,
  isTemplate,
  expressions
}: {
  data: AppDynamicsData
  onSubmit: (healthSourcePayload: any) => void
  onPrevious: () => void
  isTemplate?: boolean
  expressions?: string[]
}): JSX.Element {
  const { getString } = useStrings()
  const { showError, clear } = useToaster()

  const [selectedMetricPacks, setSelectedMetricPacks] = useState<MetricPackDTO[]>([])
  const [validationResultData, setValidationResultData] = useState<AppdynamicsValidationResponse[]>()
  const [appDValidation, setAppDValidation] = useState<{
    status: string
    result: AppdynamicsValidationResponse[] | []
  }>({
    status: '',
    result: []
  })
  const [guidMap, setGuidMap] = useState(new Map())
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const connectorIdentifier = (appDynamicsData?.connectorRef?.value || appDynamicsData?.connectorRef) as string

  const isConnectorRuntimeOrExpression = getMultiTypeFromValue(connectorIdentifier) !== MultiTypeInputType.FIXED

  const {
    data: applicationsData,
    loading: applicationLoading,
    error: applicationError,
    refetch: refetchAppDApplication
  } = useGetAppDynamicsApplications({ lazy: true })

  useEffect(() => {
    if (!isConnectorRuntimeOrExpression) {
      refetchAppDApplication({
        queryParams: {
          accountId,
          connectorIdentifier,
          orgIdentifier,
          projectIdentifier,
          offset: 0,
          pageSize: 10000,
          filter: ''
        }
      })
    }
  }, [accountId, orgIdentifier, projectIdentifier, connectorIdentifier, refetchAppDApplication])

  const {
    data: tierData,
    loading: tierLoading,
    refetch: refetchTier,
    error: tierError
  } = useGetAppDynamicsTiers({
    lazy: true
  })

  useEffect(() => {
    if (shouldMakeTierCall(appDynamicsData?.applicationName)) {
      refetchTier({
        queryParams: {
          appName: appDynamicsData?.applicationName,
          accountId,
          connectorIdentifier,
          orgIdentifier,
          projectIdentifier,
          offset: 0,
          pageSize: 10000,
          filter: ''
        }
      })
    }
  }, [appDynamicsData?.applicationName])

  const onValidate = async (appName: string, tierName: string, metricObject: { [key: string]: any }): Promise<void> => {
    if (checkAppAndTierAreNotFixed(appName, tierName)) {
      return
    }
    setAppDValidation({ status: StatusOfValidation.IN_PROGRESS, result: [] })
    const filteredMetricPack = selectedMetricPacks.filter(item => metricObject[item.identifier as string])
    const guid = Utils.randomId()
    setGuidMap(oldMap => {
      oldMap.set(tierName, guid)
      return new Map(oldMap)
    })
    const { validationStatus, validationResult } = await validateMetrics(
      filteredMetricPack || [],
      {
        accountId,
        appName: appName,
        tierName: tierName,
        connectorIdentifier: connectorIdentifier,
        orgIdentifier,
        projectIdentifier,
        requestGuid: guid
      },
      HealthSoureSupportedConnectorTypes.APP_DYNAMICS
    )
    setAppDValidation({
      status: validationStatus as string,
      result: validationResult as AppdynamicsValidationResponse[]
    })
  }

  const applicationOptions: SelectOption[] = useMemo(
    () =>
      getOptions(
        applicationLoading,
        applicationsData?.data?.content,
        HealthSoureSupportedConnectorTypes.APP_DYNAMICS,
        getString
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [applicationLoading]
  )

  const tierOptions: SelectOption[] = useMemo(
    () => getOptions(tierLoading, tierData?.data?.content, HealthSoureSupportedConnectorTypes.APP_DYNAMICS, getString),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tierLoading]
  )

  useEffect(() => {
    if (
      appDynamicsData.isEdit &&
      selectedMetricPacks.length &&
      appDValidation.status !== StatusOfValidation.IN_PROGRESS
    ) {
      onValidate(
        appDynamicsData?.applicationName,
        appDynamicsData?.tierName,
        createMetricDataFormik(appDynamicsData?.metricPacks)
      )
    }
  }, [selectedMetricPacks, tierLoading, appDynamicsData.isEdit])

  const [showCustomMetric, setShowCustomMetric] = useState(!!Array.from(appDynamicsData?.mappedServicesAndEnvs)?.length)

  const {
    createdMetrics,
    mappedMetrics,
    selectedMetric,
    groupedCreatedMetrics,
    groupedCreatedMetricsList,
    setMappedMetrics,
    setCreatedMetrics,
    setGroupedCreatedMetrics
  } = useGroupedSideNaveHook({
    defaultCustomMetricName: getString('cv.monitoringSources.appD.defaultAppDMetricName'),
    initCustomMetricData: initAppDCustomFormValue(),
    mappedServicesAndEnvs: showCustomMetric ? appDynamicsData?.mappedServicesAndEnvs : new Map()
  })

  const [nonCustomFeilds, setNonCustomFeilds] = useState(initializeNonCustomFields(appDynamicsData))

  const initPayload = useMemo(
    () =>
      createAppDFormData(appDynamicsData, mappedMetrics, selectedMetric, nonCustomFeilds, showCustomMetric, isTemplate),
    [appDynamicsData, mappedMetrics, selectedMetric, nonCustomFeilds, showCustomMetric]
  )

  useEffect(() => {
    resetShowCustomMetric(selectedMetric, mappedMetrics, setShowCustomMetric)
  }, [mappedMetrics, selectedMetric])

  useEffect(() => {
    clear()
    tierError && showError(getErrorMessage(tierError))
    applicationError && showError(getErrorMessage(applicationError))
  }, [applicationError, tierError])

  const setAppDTierCustomField = (tierValue: string): void => {
    setNonCustomFeilds({
      ...nonCustomFeilds,
      appDTier: tierValue
    })
  }

  useEffect(() => {
    if (!appDynamicsData.isEdit) {
      setAppAndTierAsInputIfConnectorIsInput(isConnectorRuntimeOrExpression, nonCustomFeilds, setNonCustomFeilds)
    }
  }, [])

  return (
    <Formik<AppDynamicsFomikFormInterface>
      enableReinitialize
      formName={'appDHealthSourceform'}
      isInitialValid={(args: any) =>
        Object.keys(
          validateMapping({
            values: args.initialValues,
            createdMetrics: groupedCreatedMetricsList,
            selectedMetricIndex: groupedCreatedMetricsList.indexOf(selectedMetric),
            getString,
            mappedMetrics
          })
        ).length === 0
      }
      validate={values => {
        return validateMapping({
          values,
          createdMetrics: groupedCreatedMetricsList,
          selectedMetricIndex: groupedCreatedMetricsList.indexOf(selectedMetric),
          getString,
          mappedMetrics
        })
      }}
      initialValues={initPayload}
      onSubmit={noop}
    >
      {formik => {
        return (
          <FormikForm className={css.formFullheight}>
            <CardWithOuterTitle title={getString('cv.healthSource.connectors.AppDynamics.applicationsAndTiers')}>
              <Layout.Horizontal spacing={'large'} className={css.horizontalCenterAlign}>
                <Container margin={{ bottom: 'small' }} width={'300px'} color={Color.BLACK}>
                  <AppDApplications
                    allowedTypes={getAllowedTypes(isConnectorRuntimeOrExpression)}
                    applicationOptions={applicationOptions}
                    applicationLoading={applicationLoading}
                    applicationError={formik?.errors?.appdApplication}
                    connectorIdentifier={connectorIdentifier}
                    formikAppDynamicsValue={formik?.values?.appdApplication}
                    refetchTier={refetchTier}
                    setCustomFieldAndValidation={(value: string, validate = false) =>
                      setCustomFieldAndValidation(
                        value,
                        setNonCustomFeilds,
                        nonCustomFeilds,
                        setAppDValidation,
                        validate
                      )
                    }
                    isTemplate={isTemplate}
                    expressions={expressions}
                  />
                </Container>
                {!!formik.values.appdApplication && (
                  <Container margin={{ bottom: 'small' }} width={'300px'} color={Color.BLACK}>
                    <AppDynamicsTier
                      isTemplate={isTemplate}
                      expressions={expressions}
                      tierOptions={tierOptions}
                      tierLoading={tierLoading}
                      formikValues={formik?.values}
                      onValidate={onValidate}
                      tierError={formik?.errors?.appDTier}
                      setAppDTierCustomField={setAppDTierCustomField}
                    />
                  </Container>
                )}
                <Container width={'300px'} color={Color.BLACK}>
                  {showValidation(formik.values?.appDTier, formik?.values.appdApplication) && (
                    <ValidationStatus
                      validationStatus={appDValidation?.status as StatusOfValidation}
                      onClick={
                        appDValidation.result?.length ? () => setValidationResultData(appDValidation.result) : undefined
                      }
                      onRetry={() =>
                        onValidate(formik.values.appdApplication, formik.values.appDTier, formik.values.metricData)
                      }
                    />
                  )}
                </Container>
              </Layout.Horizontal>
            </CardWithOuterTitle>
            <CardWithOuterTitle title={getString('metricPacks')}>
              <Layout.Vertical>
                <Text color={Color.BLACK}>{getString('cv.healthSource.connectors.AppDynamics.metricPackLabel')}</Text>
                <Layout.Horizontal spacing={'large'} className={css.horizontalCenterAlign}>
                  <MetricPackCustom
                    setMetricDataValue={value => {
                      setNonCustomFeilds({
                        ...nonCustomFeilds,
                        metricData: value
                      })
                    }}
                    metricPackValue={formik.values.metricPacks}
                    metricDataValue={formik.values.metricData}
                    setSelectedMetricPacks={setSelectedMetricPacks}
                    connector={HealthSoureSupportedConnectorTypes.APP_DYNAMICS}
                    onChange={async metricValue => {
                      setNonCustomFeilds({
                        ...nonCustomFeilds,
                        metricData: metricValue
                      })
                      await onValidate(formik?.values?.appdApplication, formik?.values?.appDTier, metricValue)
                    }}
                  />
                  {validationResultData && (
                    <MetricsVerificationModal
                      verificationData={validationResultData}
                      guid={guidMap.get(formik?.values?.appDTier)}
                      onHide={setValidationResultData as () => void}
                      verificationType={Connectors.APP_DYNAMICS}
                    />
                  )}
                </Layout.Horizontal>
              </Layout.Vertical>
            </CardWithOuterTitle>
            {showCustomMetric ? (
              <>
                <CustomMetric
                  isValidInput={formik.isValid}
                  setMappedMetrics={setMappedMetrics}
                  selectedMetric={selectedMetric}
                  formikValues={formik.values}
                  mappedMetrics={mappedMetrics}
                  createdMetrics={createdMetrics}
                  groupedCreatedMetrics={groupedCreatedMetrics}
                  setCreatedMetrics={setCreatedMetrics}
                  setGroupedCreatedMetrics={setGroupedCreatedMetrics}
                  defaultMetricName={'appdMetric'}
                  tooptipMessage={getString('cv.monitoringSources.gcoLogs.addQueryTooltip')}
                  addFieldLabel={getString('cv.monitoringSources.addMetric')}
                  initCustomForm={initAppDCustomFormValue()}
                  shouldBeAbleToDeleteLastMetric
                >
                  <AppDCustomMetricForm
                    formikValues={formik.values}
                    formikSetField={formik.setFieldValue}
                    mappedMetrics={mappedMetrics}
                    selectedMetric={selectedMetric}
                    connectorIdentifier={connectorIdentifier}
                    isTemplate={isTemplate}
                  />
                </CustomMetric>
              </>
            ) : (
              <CardWithOuterTitle
                title={getString('cv.healthSource.connectors.customMetrics')}
                dataTooltipId={'customMetricsTitle'}
              >
                <Button
                  disabled={!(!!formik?.values?.appdApplication && !!formik?.values?.appDTier)}
                  icon="plus"
                  minimal
                  intent="primary"
                  onClick={() => setShowCustomMetric(true)}
                >
                  {getString('cv.monitoringSources.addMetric')}
                </Button>
              </CardWithOuterTitle>
            )}
            <AppDMetricThreshold formikValues={formik.values} />
            <DrawerFooter
              isSubmit
              onPrevious={onPrevious}
              onNext={() =>
                submitData(
                  formik,
                  mappedMetrics,
                  selectedMetric,
                  groupedCreatedMetricsList.indexOf(selectedMetric),
                  groupedCreatedMetricsList,
                  getString,
                  onSubmit
                )
              }
            />
          </FormikForm>
        )
      }}
    </Formik>
  )
}
