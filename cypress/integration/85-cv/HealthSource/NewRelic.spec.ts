/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import {
  monitoredServiceListCall,
  monitoredServiceListResponse,
  newRelicServiceResponse,
  newrelicURL,
  parseSampleDataResponse,
  parseSampleDataURL
} from '../../../support/85-cv/monitoredService/constants'
import {
  metricPackCall,
  metricPackResponse,
  applicationCall,
  applicationResponse,
  metricDataCall,
  metricDataResponse,
  sampleDataResponse,
  sampleDataCall
} from '../../../support/85-cv/monitoredService/health-sources/NewRelic/constants'
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

  it('Add new NewRelic monitored service ', () => {
    cy.intercept('GET', applicationCall, applicationResponse).as('ApplicationCall')
    cy.intercept('GET', metricPackCall, metricPackResponse).as('MetricPackCall')
    cy.intercept('GET', metricDataCall, metricDataResponse).as('MetricDataCall')

    cy.addNewMonitoredServiceWithServiceAndEnv()

    // Fill Define HealthSource Tab with NewRelic
    cy.populateDefineHealthSource(Connectors.NEW_RELIC, 'NewRelicConn', 'NewRelic HS')
    cy.contains('span', 'Next').click()

    // Fill Customise HealthSource Tab for NewRelic
    cy.wait('@ApplicationCall')
    cy.wait('@MetricPackCall')
    cy.wait(1000)

    cy.get('input[name="metricData.Performance"]').should('not.be.checked')

    // Validation
    cy.contains('span', 'Submit').click({ force: true })

    cy.contains('span', 'Please select application').should('be.visible')
    cy.contains('span', 'Plese select metric packs').should('be.visible')

    cy.get('input[name="metricData.Performance"]').check({ force: true })
    cy.contains('span', 'Plese select metric packs').should('not.exist')

    cy.get('input[name="newRelicApplication"]').click()
    cy.contains('p', 'My Application').click({ force: true })
    cy.contains('span', 'Please select applications').should('not.exist')

    cy.contains('span', 'Submit').click({ force: true })

    cy.contains('div', 'NewRelic HS').click({ force: true })
    cy.contains('span', 'Next').click()

    cy.get('input[name="newRelicApplication"]').should('have.value', 'My Application')
    cy.get('input[name="metricData.Performance"]').should('be.checked')
    cy.contains('span', 'Submit').click({ force: true })

    // Creating the monitored service.
    cy.findByRole('button', { name: /Save/i }).click()
    cy.findByText('Monitored Service created').should('be.visible')
  })

  it('Add new NewRelic monitored service with custom metric', () => {
    cy.intercept('GET', applicationCall, applicationResponse).as('ApplicationCall')
    cy.intercept('GET', metricPackCall, metricPackResponse).as('MetricPackCall')
    cy.intercept('GET', metricDataCall, metricDataResponse).as('MetricDataCall')
    cy.intercept('GET', sampleDataCall, sampleDataResponse).as('SampleDataCall')

    cy.addNewMonitoredServiceWithServiceAndEnv()

    // Fill Define HealthSource Tab with NewRelic
    cy.populateDefineHealthSource(Connectors.NEW_RELIC, 'NewRelicConn', 'NewRelic HS')
    cy.contains('span', 'Next').click()

    // Fill Customise HealthSource Tab for NewRelic
    cy.wait('@ApplicationCall')
    cy.wait('@MetricPackCall')

    cy.get('input[name="newRelicApplication"]').click()
    cy.contains('p', 'My Application').click({ force: true })
    cy.get('input[name="metricData.Performance"]').check({ force: true })

    cy.contains('span', 'Add Metric').click()

    // Custom validation
    cy.contains('span', 'Submit').click({ force: true })
    cy.contains('span', 'Group Name is required').scrollIntoView().should('be.visible')

    cy.get('input[name="groupName"]').click()
    cy.contains('p', '+ Add New').click({ force: true })
    cy.get('.bp3-overlay input[name="name"]').type('group 1')
    cy.get('.bp3-overlay button[type="submit"]').click({ force: true })

    cy.contains('div', 'Query Specifications and mapping').click({ force: true })
    cy.get('textarea[name="query"]')
      .click({ force: true })
      .type(
        "SELECT average(`apm.service.transaction.duration`) FROM Metric WHERE appName = 'My Application' TIMESERIES"
      )
    cy.contains('span', 'Fetch records').click()

    cy.contains('div', 'Metric values and charts').click({ force: true })

    cy.contains('span', 'Select path for Metric value').click({ force: true })
    cy.wait(1000)
    cy.get('[class*="JsonSelector-module_selectableKey"]').first().click({ force: true })

    cy.contains('span', 'Select path for timestamp field').click({ force: true })
    cy.wait(1000)
    cy.get('[class*="JsonSelector-module_selectableKey"]').first().click({ force: true })

    cy.contains('div', 'Assign').click({ force: true })
    cy.get('input[name="sli"]').click({ force: true })

    cy.contains('span', 'Submit').click({ force: true })

    // Open again
    cy.contains('div', 'NewRelic HS').click({ force: true })
    cy.wait(1000)
    cy.contains('span', 'Next').click({ force: true })

    // Delete all custom metric
    cy.get('span[data-icon="main-delete"]').click({ multiple: true })
    cy.findByRole('button', { name: /Add Metric/i }).should('be.visible')

    cy.contains('span', 'Submit').click({ force: true })

    // Creating the monitored service.
    cy.findByRole('button', { name: /Save/i }).click()
    cy.findByText('Monitored Service created').should('be.visible')

    cy.intercept('GET', newrelicURL, newRelicServiceResponse).as('newrelicServiceCall')
    cy.intercept('POST', parseSampleDataURL, parseSampleDataResponse).as('parseSampleDataCall')

    cy.findByText(/service-1/i).click()

    cy.wait('@newrelicServiceCall')

    cy.findByText(/Configurations/i).click({ force: true })

    cy.get('.TableV2--clickable').scrollIntoView().click()

    cy.findByText(/Customize Health Source/i).click()

    cy.wait('@SampleDataCall').then(interception => {
      expect(interception.request.url).contains(
        'nrql=SELECT%20average%28%60apm.service.transaction.duration%60%29%20FROM%20Metric%20WHERE%20appName%20%3D%20%27My%20Application%27%20TIMESERIES'
      )
    })

    cy.findByText(/Metric values and charts/i).click()
    cy.findByRole('button', { name: /Build Chart/i }).click()

    cy.wait('@parseSampleDataCall')
  })
})
