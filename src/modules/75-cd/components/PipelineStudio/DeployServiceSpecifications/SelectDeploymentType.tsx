/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Formik, FormikProps } from 'formik'
import { noop } from 'lodash-es'
import { Classes, PopoverInteractionKind } from '@blueprintjs/core'
import * as Yup from 'yup'
import { useParams } from 'react-router-dom'
import { Card, Dialog, HarnessDocTooltip, Icon, Layout, Popover, Text, Thumbnail, Utils } from '@wings-software/uicore'
import { useModalHook } from '@harness/use-modal'
import { Color, FontVariation } from '@harness/design-system'
import cx from 'classnames'
import { useStrings, UseStringsReturn } from 'framework/strings'
import { isCommunityPlan } from '@common/utils/utils'
import { StageErrorContext } from '@pipeline/context/StageErrorContext'
import { ServiceDeploymentType } from '@pipeline/utils/stageHelpers'
import { DeployTabs } from '@pipeline/components/PipelineStudio/CommonUtils/DeployStageSetupShellUtils'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import type { StringsMap } from 'framework/strings/StringsContext'
import { CDFirstGenTrial } from './CDFirstGenTrial'
import type { DeploymentTypeItem } from './DeploymentInterface'
import stageCss from '../DeployStageSetupShell/DeployStage.module.scss'
import deployServiceCsss from './DeployServiceSpecifications.module.scss'

export function getServiceDeploymentTypeSchema(
  getString: UseStringsReturn['getString']
): Yup.StringSchema<string | undefined> {
  return Yup.string()
    .oneOf(Object.values(ServiceDeploymentType))
    .required(getString('cd.pipelineSteps.serviceTab.deploymentTypeRequired'))
}

interface SelectServiceDeploymentTypeProps {
  selectedDeploymentType?: ServiceDeploymentType
  isReadonly: boolean
  handleDeploymentTypeChange: (deploymentType: ServiceDeploymentType) => void
}

interface CardListProps {
  items: DeploymentTypeItem[]
  isReadonly: boolean
  selectedValue?: string
  onChange: (deploymentType: ServiceDeploymentType) => void
  allowDisabledItemClick?: boolean
}

const CardList = ({
  items,
  isReadonly,
  selectedValue,
  onChange,
  allowDisabledItemClick
}: CardListProps): JSX.Element => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange(e.target.value as ServiceDeploymentType)
  }
  return (
    <Layout.Horizontal spacing={'medium'} className={stageCss.cardListContainer}>
      {items.map(item => {
        const itemContent = (
          <Thumbnail
            key={item.value}
            label={item.label}
            value={item.value}
            icon={item.icon}
            disabled={item.disabled || isReadonly}
            selected={item.value === selectedValue}
            onClick={handleChange}
          />
        )
        return (
          <Utils.WrapOptionalTooltip key={item.value} tooltipProps={item.tooltipProps} tooltip={item.tooltip}>
            {allowDisabledItemClick ? (
              <div onClick={() => onChange(item.value as ServiceDeploymentType)}>{itemContent}</div>
            ) : (
              itemContent
            )}
          </Utils.WrapOptionalTooltip>
        )
      })}
    </Layout.Horizontal>
  )
}

const getServerlessDeploymentTypes = (
  getString: (key: keyof StringsMap, vars?: Record<string, any> | undefined) => string,
  SERVERLESS_SUPPORT = false
): DeploymentTypeItem[] => {
  if (SERVERLESS_SUPPORT) {
    return [
      {
        label: getString('pipeline.serviceDeploymentTypes.serverlessAwsLambda'),
        icon: 'service-serverless-aws',
        value: ServiceDeploymentType.ServerlessAwsLambda
      }
      // Keeping these for now. If we do not support these in near future, we will remove these.
      //
      // {
      //   label: getString('pipeline.serviceDeploymentTypes.serverlessAzureFunctions'),
      //   icon: 'service-serverless-azure',
      //   value: ServiceDeploymentType.ServerlessAzureFunctions,
      //   disabled: true
      // },
      // {
      //   label: getString('pipeline.serviceDeploymentTypes.serverlessGoogleFunctions'),
      //   icon: 'service-serverless-gcp',
      //   value: ServiceDeploymentType.ServerlessGoogleFunctions,
      //   disabled: true
      // },
      // {
      //   label: getString('pipeline.serviceDeploymentTypes.awsSAM'),
      //   icon: 'service-aws-sam',
      //   value: ServiceDeploymentType.AmazonSAM,
      //   disabled: true
      // },
      // {
      //   label: getString('pipeline.serviceDeploymentTypes.azureFunctions'),
      //   icon: 'service-azure-functions',
      //   value: ServiceDeploymentType.AzureFunctions,
      //   disabled: true
      // }
    ]
  }
  return []
}

export default function SelectDeploymentType(props: SelectServiceDeploymentTypeProps): JSX.Element {
  const { selectedDeploymentType, isReadonly } = props
  const { getString } = useStrings()
  const formikRef = React.useRef<FormikProps<unknown> | null>(null)
  const { subscribeForm, unSubscribeForm } = React.useContext(StageErrorContext)
  const { SERVERLESS_SUPPORT } = useFeatureFlags()

  const { accountId } = useParams<{
    accountId: string
  }>()
  const [selectedDeploymentTypeInCG, setSelectedDeploymentTypeInCG] = React.useState('')

  // Supported in NG (Next Gen - The one for which you are coding right now)
  const ngSupportedDeploymentTypes: DeploymentTypeItem[] = React.useMemo(
    () => [
      {
        label: getString('pipeline.serviceDeploymentTypes.kubernetes'),
        icon: 'service-kubernetes',
        value: ServiceDeploymentType.Kubernetes
      },
      {
        label: getString('pipeline.nativeHelm'),
        icon: 'service-helm',
        value: ServiceDeploymentType.NativeHelm
      },
      ...getServerlessDeploymentTypes(getString, SERVERLESS_SUPPORT)
    ],
    [getString, SERVERLESS_SUPPORT]
  )

  // Suppported in CG (First Gen - Old Version of Harness App)
  const cgSupportedDeploymentTypes: DeploymentTypeItem[] = React.useMemo(
    () => [
      {
        label: getString('pipeline.serviceDeploymentTypes.amazonEcs'),
        icon: 'service-ecs',
        value: ServiceDeploymentType.amazonEcs
      },
      {
        label: getString('pipeline.serviceDeploymentTypes.amazonAmi'),
        icon: 'main-service-ami',
        value: ServiceDeploymentType.amazonAmi
      },
      {
        label: getString('pipeline.serviceDeploymentTypes.awsCodeDeploy'),
        icon: 'app-aws-code-deploy',
        value: ServiceDeploymentType.awsCodeDeploy
      },
      {
        label: getString('pipeline.serviceDeploymentTypes.winrm'),
        icon: 'command-winrm',
        value: ServiceDeploymentType.winrm
      },
      {
        label: getString('pipeline.serviceDeploymentTypes.awsLambda'),
        icon: 'app-aws-lambda',
        value: ServiceDeploymentType.awsLambda
      },
      {
        label: getString('pipeline.serviceDeploymentTypes.pcf'),
        icon: 'service-pivotal',
        value: ServiceDeploymentType.pcf
      },
      {
        label: getString('pipeline.serviceDeploymentTypes.ssh'),
        icon: 'secret-ssh',
        value: ServiceDeploymentType.ssh
      }
    ],
    [getString]
  )

  const [cgDeploymentTypes, setCgDeploymentTypes] = React.useState(cgSupportedDeploymentTypes)
  const [ngDeploymentTypes, setNgDeploymentTypes] = React.useState(ngSupportedDeploymentTypes)
  const isCommunity = isCommunityPlan()

  const [showCurrentGenSwitcherModal, hideCurrentGenSwitcherModal] = useModalHook(() => {
    return (
      <Dialog
        isOpen={true}
        enforceFocus={false}
        canEscapeKeyClose
        canOutsideClickClose
        onClose={hideCurrentGenSwitcherModal}
        isCloseButtonShown
        style={{
          width: 1200,
          height: 600,
          padding: 0
        }}
      >
        <CDFirstGenTrial
          selectedDeploymentType={cgDeploymentTypes.find(type => type.value === selectedDeploymentTypeInCG)}
          accountId={accountId}
        />
      </Dialog>
    )
  }, [selectedDeploymentTypeInCG])

  React.useEffect(() => {
    if (isCommunity) {
      cgSupportedDeploymentTypes.forEach(deploymentType => {
        deploymentType['disabled'] = true
      })
      setCgDeploymentTypes(cgSupportedDeploymentTypes)
    } else {
      setNgDeploymentTypes(ngSupportedDeploymentTypes)
      cgSupportedDeploymentTypes.forEach(deploymentType => {
        deploymentType['disabled'] = true
        deploymentType['tooltip'] = (
          <div
            className={cx(deployServiceCsss.tooltipContainer, deployServiceCsss.cursorPointer)}
            onClick={() => {
              setSelectedDeploymentTypeInCG(deploymentType.value)
              showCurrentGenSwitcherModal()
            }}
          >
            Use in Continuous Delivery First Generation
          </div>
        )
        deploymentType['tooltipProps'] = { isDark: true }
      })
      setCgDeploymentTypes(cgSupportedDeploymentTypes)
    }
  }, [])

  React.useEffect(() => {
    subscribeForm({ tab: DeployTabs.SERVICE, form: formikRef })
    return () => unSubscribeForm({ tab: DeployTabs.SERVICE, form: formikRef })
  }, [formikRef])

  const renderDeploymentTypes = React.useCallback((): JSX.Element => {
    if (!isCommunity) {
      const tooltipContent = (
        <article className={cx(deployServiceCsss.cdGenerationSelectionTooltip, deployServiceCsss.tooltipContainer)}>
          <section className={deployServiceCsss.cdGenerationSwitchContainer}>
            <div className={cx(deployServiceCsss.cdGenerationSwitcher, deployServiceCsss.cdGenerationSwitcherSelected)}>
              <div className={deployServiceCsss.newText}>NEW</div>
              <Icon className="infoCard.iconClassName" name="cd-solid" size={24} />
              {getString('common.purpose.cd.newGen.title')}
            </div>
            <div
              className={cx(deployServiceCsss.cdGenerationSwitcher, deployServiceCsss.cursorPointer)}
              onClick={() => {
                setSelectedDeploymentTypeInCG('')
                showCurrentGenSwitcherModal()
              }}
            >
              <Icon className={'infoCard.iconClassName'} name="command-approval" size={24} />
              {getString('common.purpose.cd.1stGen.title')}
            </div>
          </section>
          <section className={deployServiceCsss.cdGenerationContent}>
            <Text color={Color.GREY_0} font={{ variation: FontVariation.BODY }}>
              {getString('cd.cdSwitchToFirstGen.description4')}
            </Text>
            <a
              className={deployServiceCsss.learnMore}
              href="https://ngdocs.harness.io/article/1fjmm4by22"
              rel="noreferrer"
              target="_blank"
            >
              {getString('cd.cdSwitchToFirstGen.learnMoreAboutCD1stGen')}
            </a>
          </section>
        </article>
      )
      return (
        <Layout.Horizontal margin={{ top: 'medium' }}>
          <Layout.Vertical border={{ right: true }} margin={{ right: 'huge' }} padding={{ right: 'huge' }}>
            <div className={cx(stageCss.tabSubHeading, 'ng-tooltip-native')}>
              {getString('common.currentlyAvailable')}
            </div>
            <CardList
              items={ngDeploymentTypes}
              isReadonly={isReadonly}
              onChange={props.handleDeploymentTypeChange}
              selectedValue={selectedDeploymentType}
            />
          </Layout.Vertical>

          <Layout.Vertical>
            <Layout.Horizontal>
              <div className={deployServiceCsss.comingSoonBanner}>{getString('common.comingSoon')}</div>
              <div
                className={cx(stageCss.tabSubHeading, 'ng-tooltip-native')}
                data-tooltip-id="supportedInFirstGeneration"
              >
                {getString('common.currentlySupportedOn')}
                <a
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => {
                    setSelectedDeploymentTypeInCG('')
                    showCurrentGenSwitcherModal()
                  }}
                  style={{ paddingLeft: '4px' }}
                >
                  {getString('common.firstGeneration')}
                </a>
                <HarnessDocTooltip tooltipId="supportedInFirstGeneration" useStandAlone={true} />
              </div>
              <Popover
                position="auto"
                interactionKind={PopoverInteractionKind.HOVER}
                content={tooltipContent}
                className={Classes.DARK}
              >
                <span className={deployServiceCsss.tooltipIcon}>
                  <Icon size={12} name="tooltip-icon" color={Color.PRIMARY_7} />
                </span>
              </Popover>
            </Layout.Horizontal>
            <CardList
              items={cgDeploymentTypes}
              isReadonly={isReadonly}
              onChange={(deploymentType: string) => {
                setSelectedDeploymentTypeInCG(deploymentType)
                showCurrentGenSwitcherModal()
              }}
              selectedValue={selectedDeploymentType}
              allowDisabledItemClick={true}
            />
          </Layout.Vertical>
        </Layout.Horizontal>
      )
    }
    return (
      <CardList
        items={[...ngSupportedDeploymentTypes, ...cgDeploymentTypes]}
        isReadonly={isReadonly}
        onChange={props.handleDeploymentTypeChange}
        selectedValue={selectedDeploymentType}
      />
    )
  }, [cgDeploymentTypes, ngSupportedDeploymentTypes, getString, isReadonly, props.handleDeploymentTypeChange])

  return (
    <Formik<{ deploymentType: string }>
      onSubmit={noop}
      enableReinitialize={true}
      initialValues={{ deploymentType: selectedDeploymentType as string }}
      validationSchema={Yup.object().shape({
        deploymentType: getServiceDeploymentTypeSchema(getString)
      })}
    >
      {formik => {
        window.dispatchEvent(new CustomEvent('UPDATE_ERRORS_STRIP', { detail: DeployTabs.SERVICE }))
        formikRef.current = formik as FormikProps<unknown> | null
        return (
          <Card className={stageCss.sectionCard}>
            <div
              className={cx(stageCss.tabSubHeading, 'ng-tooltip-native')}
              data-tooltip-id="stageOverviewDeploymentType"
            >
              {getString('deploymentTypeText')}
              <HarnessDocTooltip tooltipId="stageOverviewDeploymentType" useStandAlone={true} />
            </div>
            {renderDeploymentTypes()}
          </Card>
        )
      }}
    </Formik>
  )
}
