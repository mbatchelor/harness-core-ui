/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import {
  dataforMS,
  monitoredServiceListCall,
  monitoredServiceListResponse
} from '../../../support/85-cv/monitoredService/constants'
import {
  applicationCall,
  applicationsResponse,
  metricPackCall,
  metricPackResponse,
  tiersCall,
  tiersResponse,
  basePathCall,
  basePathResponse,
  metricStructureCall,
  metricStructureResponse
} from '../../../support/85-cv/monitoredService/health-sources/AppDynamics/constants'
import { Connectors } from '../../../utils/connctors-utils'

describe('Create empty monitored service', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      return false
    })
    cy.login('test', 'test')
    cy.intercept('GET', monitoredServiceListCall, monitoredServiceListResponse)
    cy.intercept(
      'GET',
      '/cv/api/monitored-service/count-of-services?routingId=accountId&accountId=accountId&orgIdentifier=default&projectIdentifier=project1',
      { allServicesCount: 1, servicesAtRiskCount: 0 }
    )
    cy.visitChangeIntelligence()
  })

  it('Add new AppDynamics monitored service ', () => {
    cy.intercept('GET', applicationCall, applicationsResponse).as('ApplicationCall')
    cy.intercept('GET', metricPackCall, metricPackResponse).as('MetricPackCall')
    cy.intercept('GET', tiersCall, tiersResponse).as('TierCall')
    cy.intercept('GET', basePathCall, basePathResponse).as('basePathCall')
    cy.intercept('GET', metricStructureCall, metricStructureResponse).as('metricStructureCall')

    cy.addNewMonitoredServiceWithServiceAndEnv()

    // Fill Define HealthSource Tab with AppDynamics
    cy.populateDefineHealthSource(Connectors.APP_DYNAMICS, 'appdtest', 'AppD')
    cy.contains('span', 'Next').click({ force: true })

    // Fill Customise HealthSource Tab for AppDynamics
    cy.wait('@ApplicationCall')
    cy.wait('@MetricPackCall')
    cy.wait(1000)

    cy.get('input[name="metricData.Errors"]').should('be.checked')
    cy.get('input[name="metricData.Performance"]').should('be.checked')

    // Validation
    cy.contains('span', 'Submit').click({ force: true })

    cy.contains('span', 'Please select applications').should('be.visible')

    cy.get('input[name="metricData.Errors"]').uncheck({ force: true })
    cy.get('input[name="metricData.Performance"]').uncheck({ force: true })
    cy.contains('span', 'Submit').click({ force: true })
    cy.contains('span', 'Plese select metric packs').should('be.visible')
    cy.get('input[name="metricData.Errors"]').check({ force: true })
    cy.get('input[name="metricData.Performance"]').check({ force: true })
    cy.contains('span', 'Plese select metric packs').should('not.exist')

    cy.get('input[name="appdApplication"]').click()
    cy.contains('p', 'cv-app').click({ force: true })

    // Validation
    cy.contains('span', 'Please select applications').should('not.exist')
    cy.contains('span', 'Submit').click({ force: true })
    cy.contains('span', 'Please select tier').should('be.visible')

    cy.wait('@TierCall')
    cy.get('input[name="appDTier"]').click()
    cy.contains('p', 'docker-tier').click({ force: true })

    cy.contains('span', 'Submit').click({ force: true })

    cy.contains('div', 'AppD').click({ force: true })
    cy.wait(1000)
    cy.contains('span', 'Next').click({ force: true })

    cy.get('input[name="appDTier"]').should('have.value', 'docker-tier')
    cy.get('input[name="appdApplication"]').should('have.value', 'cv-app')
    cy.contains('span', 'Submit').click({ force: true })

    // Creating the monitored service.
    cy.findByRole('button', { name: /Save/i }).click()
    cy.findByText('Monitored Service created').should('be.visible')
  })

  it('Add new AppDynamics monitored service with custom metric', () => {
    cy.intercept('GET', applicationCall, applicationsResponse).as('ApplicationCall')
    cy.intercept('GET', metricPackCall, metricPackResponse).as('MetricPackCall')
    cy.intercept('GET', tiersCall, tiersResponse).as('TierCall')
    cy.intercept('GET', basePathCall, basePathResponse).as('basePathCall')
    cy.intercept('GET', metricStructureCall, metricStructureResponse).as('metricStructureCall')

    cy.addNewMonitoredServiceWithServiceAndEnv()

    // Fill Define HealthSource Tab with AppDynamics
    cy.populateDefineHealthSource(Connectors.APP_DYNAMICS, 'appdtest', 'AppD')
    cy.contains('span', 'Next').click({ force: true })

    // Fill Customise HealthSource Tab for AppDynamics
    cy.wait('@ApplicationCall')
    cy.wait('@MetricPackCall')

    cy.get('input[name="appdApplication"]').click()
    cy.contains('p', 'cv-app').click({ force: true })

    cy.wait('@TierCall')
    cy.get('input[name="appDTier"]').click()
    cy.contains('p', 'docker-tier').click({ force: true })

    // Adding custom metric should make metric pack oprional
    cy.get('input[name="metricData.Errors"]').uncheck({ force: true })
    cy.get('input[name="metricData.Performance"]').uncheck({ force: true })
    cy.contains('span', 'Submit').click({ force: true })
    cy.contains('span', 'Plese select metric packs').should('be.visible')
    cy.contains('span', 'Add Metric').click()
    cy.contains('span', 'Plese select metric packs').should('not.exist')

    cy.contains('div', 'Assign').click({ force: true })

    // Custom validation
    cy.contains('span', 'Submit').click({ force: true })
    cy.contains('span', 'Group Name is required').should('be.visible')
    cy.contains('span', 'Please select base path').scrollIntoView().should('be.visible')
    cy.contains('span', 'One selection is required.').scrollIntoView().should('be.visible')

    cy.get('input[name="groupName"]').click()
    cy.contains('p', '+ Add New').click({ force: true })
    cy.get('.bp3-overlay input[name="name"]').type('group 1')
    cy.get('.bp3-overlay button[type="submit"]').click({ force: true })

    cy.get('input[name="basePath"]').click()
    cy.contains('p', 'Overall Application Performance').click({ force: true })

    cy.get('input[name="metricPathDropdown"]').click()
    cy.contains('p', 'Calls per Minute').click({ force: true })

    cy.get('input[name="sli"]').click({ force: true })

    cy.contains('span', 'Submit').click({ force: true })

    cy.contains('div', 'AppD').click({ force: true })
    cy.contains('span', 'Next').click({})

    cy.get('input[name="appDTier"]').should('have.value', 'docker-tier')
    cy.get('input[name="appdApplication"]').should('have.value', 'cv-app')
    cy.get('input[name="groupName"]').should('have.value', 'group 1')
    cy.get('input[name="metricName"]').should('have.value', 'appdMetric')
    cy.get('input[name="basePath"]').should('have.value', 'Overall Application Performance')
    cy.get('input[name="metricPathDropdown"]').should('have.value', 'Calls per Minute')
    cy.contains('p', 'Overall Application Performance | docker-tier | Calls per Minute')
      .scrollIntoView()
      .should('be.visible')
    cy.contains('span', 'Submit').click({ force: true })

    // Creating the monitored service.
    cy.findByRole('button', { name: /Save/i }).click()
    cy.findByText('Monitored Service created').should('be.visible')
  })

  it('Add new AppDynamics monitored service with multiple custom metric', () => {
    cy.intercept('GET', applicationCall, applicationsResponse).as('ApplicationCall')
    cy.intercept('GET', metricPackCall, metricPackResponse).as('MetricPackCall')
    cy.intercept('GET', tiersCall, tiersResponse).as('TierCall')
    cy.intercept('GET', basePathCall, basePathResponse).as('basePathCall')
    cy.intercept('GET', metricStructureCall, metricStructureResponse).as('metricStructureCall')

    cy.addNewMonitoredServiceWithServiceAndEnv()

    // Fill Define HealthSource Tab with AppDynamics
    cy.populateDefineHealthSource(Connectors.APP_DYNAMICS, 'appdtest', 'AppD')
    cy.wait(1000)
    cy.contains('span', 'Next').click({ force: true })

    // Fill Customise HealthSource Tab for AppDynamics
    cy.wait('@ApplicationCall')
    cy.wait('@MetricPackCall')

    cy.get('input[name="appdApplication"]').click()
    cy.contains('p', 'cv-app').click({ force: true })

    cy.wait('@TierCall')
    cy.get('input[name="appDTier"]').click()
    cy.contains('p', 'docker-tier').click({ force: true })

    // Adding custom metric should make metric pack oprional
    cy.get('input[name="metricData.Errors"]').uncheck({ force: true })
    cy.get('input[name="metricData.Performance"]').uncheck({ force: true })
    cy.contains('span', 'Submit').click({ force: true })
    cy.contains('span', 'Plese select metric packs').should('be.visible')
    cy.contains('span', 'Add Metric').click()
    cy.contains('span', 'Plese select metric packs').should('not.exist')

    cy.contains('div', 'Assign').click({ force: true })

    // Custom validation
    cy.contains('span', 'Submit').click({ force: true })
    cy.contains('span', 'Group Name is required').should('be.visible')
    cy.contains('span', 'Please select base path').scrollIntoView().should('be.visible')
    cy.contains('span', 'One selection is required.').scrollIntoView().should('be.visible')

    cy.get('input[name="groupName"]').click()
    cy.contains('p', '+ Add New').click({ force: true })
    cy.get('.bp3-overlay input[name="name"]').type('group 1')
    cy.get('.bp3-overlay button[type="submit"]').click({ force: true })

    cy.get('input[name="basePath"]').click()
    cy.contains('p', 'Overall Application Performance').click({ force: true })

    cy.get('input[name="metricPathDropdown"]').click()
    cy.contains('p', 'Calls per Minute').click({ force: true })

    cy.get('input[name="sli"]').click({ force: true })

    // Add 2nd Metric
    cy.contains('span', 'Add Metric').click({ force: true })

    // validate duplicate name and metric identifier
    cy.get('input[name="metricName"]').clear().type('appdMetric')
    cy.contains('span', 'Submit').click({ force: true })
    cy.contains('span', 'Metric name must be unique').should('be.visible')
    cy.get('input[name="metricName"]').clear().type('appdMetric 2')
    cy.get('.InputWithIdentifier--txtNameContainer [data-icon="Edit"]').click({ force: true })
    cy.get('input.bp3-editable-text-input').click({ force: true }).clear().type('appdMetric', { force: true })
    cy.contains('span', 'Submit').click({ force: true })
    cy.contains('span', 'Metric identifier must be unique').should('be.visible')
    cy.get('.InputWithIdentifier--txtNameContainer [data-icon="Edit"]').click({ force: true })
    cy.get('input.bp3-editable-text-input').click({ force: true }).clear().type('appdMetric_2', { force: true })
    cy.contains('span', 'Submit').click({ force: true })
    cy.contains('span', 'Metric identifier must be unique').should('not.exist')

    cy.get('input[name="groupName"]').click()
    cy.contains('p', '+ Add New').click({ force: true })
    cy.get('.bp3-overlay input[name="name"]').type('group 1')

    cy.get('.bp3-overlay button[type="submit"]').click({ force: true })
    cy.contains('span', 'group 1 already exists. Provide a unique name').should('be.visible')
    cy.get('.bp3-overlay input[name="name"]').clear().type('group 2')
    cy.get('.bp3-overlay button[type="submit"]').click({ force: true })

    cy.get('input[name="basePath"]').click()
    cy.contains('p', 'Overall Application Performance').click({ force: true })

    cy.get('input[name="metricPathDropdown"]').click()
    cy.contains('p', 'Calls per Minute').click({ force: true })
    cy.contains('div', 'Assign').scrollIntoView().click({ force: true })
    cy.get('input[name="sli"]').click({ force: true })

    cy.contains('span', 'Submit').click({ force: true })

    cy.contains('div', 'AppD').click({ force: true })
    cy.wait(1000)
    cy.contains('span', 'Next').click({ force: true })

    cy.get('input[name="appDTier"]').should('have.value', 'docker-tier')
    cy.get('input[name="appdApplication"]').should('have.value', 'cv-app')
    cy.get('input[name="groupName"]').should('have.value', 'group 1')
    cy.get('input[name="metricName"]').should('have.value', 'appdMetric')
    cy.get('input[name="basePath"]').should('have.value', 'Overall Application Performance')
    cy.get('input[name="metricPathDropdown"]').should('have.value', 'Calls per Minute')
    cy.contains('p', 'Overall Application Performance | docker-tier | Calls per Minute')
      .scrollIntoView()
      .should('be.visible')
    cy.contains('span', 'Submit').click({ force: true })
    cy.get('span[data-icon="Options"]').click()
    cy.contains('div', 'Delete').click()
    cy.get('.ConfirmationDialog--dialog button[type="button"]').first().click()

    // Creating the monitored service.
    cy.findByRole('button', { name: /Save/i }).click()
    cy.findByText('Monitored Service created').should('be.visible')
  })

  it('should populate AppDynamics healthsource edit mode', () => {
    cy.intercept('GET', '/cv/api/monitored-service/service1_env1?*', dataforMS).as('monitoredServiceCall')
    cy.intercept('GET', applicationCall, applicationsResponse).as('ApplicationCall')
    cy.intercept('GET', metricPackCall, metricPackResponse).as('MetricPackCall')
    cy.intercept('GET', tiersCall, tiersResponse).as('TierCall')
    cy.intercept('GET', basePathCall, basePathResponse).as('basePathCall')
    cy.intercept('GET', metricStructureCall, metricStructureResponse).as('metricStructureCall')

    cy.wait(2000)

    cy.get('span[data-icon="Options"]').click()
    cy.contains('div', 'Edit service').click()

    cy.wait('@monitoredServiceCall')

    cy.contains('div', 'AppD Edit Mode').click({ force: true })
    cy.wait(1000)
    cy.contains('span', 'Next').click({ force: true })

    cy.wait('@ApplicationCall')
    cy.wait('@MetricPackCall')
    cy.wait(1000)

    cy.get('input[name="appDTier"]').should('have.value', 'docker-tier')
    cy.get('input[name="appdApplication"]').should('have.value', 'cv-app')
    cy.get('input[name="groupName"]').should('have.value', 'Group 1')
    cy.get('input[name="metricName"]').should('have.value', 'appdMetric 101')
    cy.get('input[name="basePath"]').should('have.value', 'Overall Application Performance')
    cy.get('input[name="metricPathDropdown"]').should('have.value', 'Calls per Minute')
    cy.contains('p', 'Overall Application Performance | docker-tier | Calls per Minute')
      .scrollIntoView()
      .should('be.visible')

    cy.contains('p', 'appdMetric 10').click()

    cy.get('input[name="groupName"]').should('have.value', 'Group 2')
    cy.get('input[name="metricName"]').should('have.value', 'appdMetric 10')
    cy.get('input[name="basePath"]').should('have.value', 'Overall Application Performance')
    cy.get('input[name="metricPathDropdown"]').should('have.value', 'Calls per Minute')
    cy.contains('p', 'Overall Application Performance | docker-tier | Calls per Minute')
      .scrollIntoView()
      .should('be.visible')

    // Update values and verify
    cy.get('input[name="metricName"]').scrollIntoView().type(' updated')
    cy.get('input[name="metricPathDropdown"]').click()
    cy.contains('p', 'Calls per Minute').click({ force: true })

    cy.contains('span', 'Submit').click({ force: true })

    cy.contains('div', 'AppD').click({ force: true })
    cy.wait(1000)
    cy.contains('span', 'Next').click({ force: true })

    cy.wait('@ApplicationCall')
    cy.wait('@MetricPackCall')
    cy.wait(1000)

    cy.contains('p', 'appdMetric 10 updated').click()
    cy.get('input[name="metricName"]').should('have.value', 'appdMetric 10 updated')
    cy.get('input[name="metricPathDropdown"]').should('have.value', 'Calls per Minute')
    cy.contains('p', 'Overall Application Performance | docker-tier | Calls per Minute')
      .scrollIntoView()
      .should('be.visible')

    // Setting empty metric name doesn't rest form
    cy.get('input[name="metricName"]').clear()
    cy.get('input[name="metricName"]').should('have.value', '')
    cy.get('input[name="groupName"]').should('have.value', 'Group 2')
    cy.get('input[name="basePath"]').should('have.value', 'Overall Application Performance')
    cy.get('input[name="metricPathDropdown"]').should('have.value', 'Calls per Minute')
    cy.contains('p', 'Overall Application Performance | docker-tier | Calls per Minute')
      .scrollIntoView()
      .should('be.visible')
    cy.get('input[name="metricName"]').type('appdMetric 10 updated')

    cy.contains('span', 'Add Metric').click({ force: true })

    // delete metric and verify
    cy.get('input[name="metricName"]').scrollIntoView().clear().type('delete me')
    cy.get('span[data-icon="main-delete"]').first().click()
    cy.contains('p', 'delete me').should('not.exist')
    cy.contains('span', 'Add Metric').click({ force: true })
    cy.get('input[name="metricName"]').scrollIntoView().clear().type('delete me')
    cy.contains('p', 'appdMetric 10 updated').click()
    cy.get('span[data-icon="main-delete"]').first().click()
    cy.contains('p', 'delete me').should('not.exist')

    // Dupllicate check
    cy.contains('span', 'Add Metric').click({ force: true })
    cy.get('input[name="metricName"]').clear().type('appdMetric 101')
    cy.get('input[name="groupName"]').click()
    cy.contains('span', 'Metric name must be unique').should('be.visible')
    cy.contains('p', 'appdMetric 101').click()
    cy.get('input[name="groupName"]').should('have.value', 'Group 1')
    cy.contains('p', 'appdMetric 10').click()
    cy.get('input[name="metricName"]').should('have.value', 'appdMetric 10')

    // Delete all custom metric
    cy.get('span[data-icon="main-delete"]').click({ multiple: true })
    cy.findByRole('button', { name: /Add Metric/i }).should('be.visible')
  })
})
