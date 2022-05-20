/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import { HelpPanel } from '@harness/help-panel'
import { CONNECTOR_MODAL_MIN_WIDTH } from '@connectors/constants'
import css from './CreateConnectorWizard.module.scss'

interface HelpPanelOptions {
  referenceId: string
  contentWidth: number
}

interface ConnectorWizardOptions {
  helpPanel?: HelpPanelOptions
}

interface ConnectorWizardContextProps {
  setWizardOptions: (options: ConnectorWizardOptions) => void
}

const ConnectorWizardContext = React.createContext<ConnectorWizardContextProps>({
  setWizardOptions: /* istanbul ignore next */ (_: ConnectorWizardOptions) => void 0
})

export const ConnectorWizardContextProvider: React.FC = props => {
  const [wizardOptions, setWizardOptions] = useState<ConnectorWizardOptions>({})

  const setOptions = (options: ConnectorWizardOptions) => {
    setWizardOptions(options)
  }

  const { helpPanel } = wizardOptions

  const getHelpPanelMinWidth = () => {
    const diffWidth = CONNECTOR_MODAL_MIN_WIDTH - (helpPanel?.contentWidth || 0)
    return diffWidth > 50 ? diffWidth : 50
  }

  const renderContent = () => {
    return helpPanel ? (
      <div className={css.contentContainer} style={{ width: helpPanel.contentWidth }}>
        {props.children}
      </div>
    ) : (
      props.children
    )
  }

  return (
    <ConnectorWizardContext.Provider
      value={{
        setWizardOptions: setOptions
      }}
    >
      <div className={css.createConnectorWizard}>
        {renderContent()}
        {helpPanel ? (
          <div className={css.helpPanelContainer}>
            <div style={{ minWidth: getHelpPanelMinWidth(), height: 560 }}>
              <HelpPanel referenceId={helpPanel.referenceId} />
            </div>
          </div>
        ) : undefined}
      </div>
    </ConnectorWizardContext.Provider>
  )
}

export const useConnectorWizard = (options: ConnectorWizardOptions) => {
  const { setWizardOptions } = React.useContext(ConnectorWizardContext)

  useEffect(() => {
    setWizardOptions(options)
  }, [])
}
