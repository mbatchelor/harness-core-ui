import {
  monitoredServiceListCall,
  monitoredServiceListResponse
} from '../../../support/85-cv/monitoredService/constants'
import { metricPackResponse } from '../../../support/85-cv/monitoredService/health-sources/AppDynamics/constants'
import {
  dashboardDetailsAPI,
  dashboardDetailsResponse,
  dashboardsAPI,
  dashboardsResponse,
  logSampleDataAPI,
  logSampleDataResponse,
  metricPackAPI,
  monitoredService,
  sampleDataAPI,
  sampleDataResponse
} from '../../../support/85-cv/monitoredService/health-sources/GoogleCloudOperations/constants'
import { errorResponse } from '../../../support/85-cv/slos/constants'
import { Connectors } from '../../../utils/connctors-utils'

describe.skip('Health Source - Google Cloud Operations', () => {
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

  it('should be able to add GCO Health Source with manual query', () => {
    cy.addNewMonitoredServiceWithServiceAndEnv()
    cy.populateDefineHealthSource(Connectors.GCP, 'gcp-qa-target', 'Google Cloud Operations')

    cy.contains('span', 'product is a required field').should('be.visible')
    cy.get('input[name="product"]').click({ force: true })
    cy.contains('p', 'Cloud Metrics').click()
    cy.contains('span', 'product is a required field').should('not.exist')

    cy.intercept('GET', dashboardsAPI, errorResponse).as('dashboardsErrorResponse')

    cy.contains('span', 'Next').click()

    cy.wait('@dashboardsErrorResponse')
    cy.contains('p', 'Oops, something went wrong on our end. Please contact Harness Support.').should('be.visible')

    cy.intercept('GET', dashboardsAPI, dashboardsResponse).as('dashboardsResponse')

    cy.findByRole('button', { name: /Retry/i }).click()

    cy.wait('@dashboardsResponse')
    cy.contains('p', '+ Manually input query').click()

    cy.intercept('GET', metricPackAPI, metricPackResponse)

    cy.contains('h4', 'Add your Google Cloud Operations query').should('be.visible')
    cy.fillField('metricName', 'GCO Metric')
    cy.findByRole('button', { name: /Submit/i }).click()

    cy.contains('h3', 'Query Specifications').should('be.visible')

    cy.findByRole('button', { name: /Submit/i }).click()

    cy.contains('span', 'Tags are required.').should('be.visible')
    cy.findByPlaceholderText('Type and press enter to create a tag').type('GCO')

    cy.fillField('query', '{}')
    cy.contains('span', 'Tags are required.').should('not.exist')

    cy.intercept('POST', sampleDataAPI, errorResponse)
    cy.findByRole('button', { name: /Fetch records/i }).click()
    cy.contains('p', 'Oops, something went wrong on our end. Please contact Harness Support.').should('exist')

    cy.intercept('POST', sampleDataAPI, sampleDataResponse).as('sampleDataResponse')
    cy.findByRole('button', { name: /Retry/i }).click()
    cy.contains('p', 'Oops, something went wrong on our end. Please contact Harness Support.').should('not.exist')

    cy.wait('@sampleDataResponse')

    cy.contains('span', 'One selection is required.').should('be.visible')
    cy.get('input[name="sli"]').click({ force: true })
    cy.contains('span', 'One selection is required.').should('not.exist')

    cy.get('input[name="continuousVerification"]').click({ force: true })
    cy.get('input[name="healthScore"]').click({ force: true })

    cy.contains('span', 'Risk Category is required.').should('exist')
    cy.contains('label', 'Errors').click()
    cy.contains('span', 'Risk Category is required.').should('not.exist')

    cy.contains('span', 'One selection is required.').should('exist')
    cy.get('input[name="higherBaselineDeviation"]').click({ force: true })
    cy.contains('span', 'One selection is required.').should('not.exist')

    cy.contains('span', 'Service Instance Identifier is required.').should('exist')
    cy.fillField('serviceInstanceField', 'gco_service')
    cy.contains('span', 'Service Instance Identifier is required.').should('not.exist')

    cy.findByRole('button', { name: /Submit/i }).click()

    // Creating the monitored service.
    cy.findByRole('button', { name: /Save/i }).click()
    cy.findByText('Monitored Service created').should('be.visible')
  })

  it('should be able to add GCO Health Source with existing dashboard', () => {
    cy.addNewMonitoredServiceWithServiceAndEnv()
    cy.populateDefineHealthSource(Connectors.GCP, 'gcp-qa-target', 'Google Cloud Operations')

    cy.contains('span', 'product is a required field').should('be.visible')
    cy.get('input[name="product"]').click({ force: true })
    cy.contains('p', 'Cloud Metrics').click()
    cy.contains('span', 'product is a required field').should('not.exist')

    cy.intercept('GET', dashboardsAPI, errorResponse).as('dashboardsErrorResponse')

    cy.contains('span', 'Next').click()

    cy.wait('@dashboardsErrorResponse')
    cy.contains('p', 'Oops, something went wrong on our end. Please contact Harness Support.').should('be.visible')

    cy.intercept('GET', dashboardsAPI, dashboardsResponse).as('dashboardsResponse')

    cy.findByRole('button', { name: /Retry/i }).click()

    cy.wait('@dashboardsResponse')
    cy.contains('p', 'TestDashboard').click()

    cy.intercept('GET', metricPackAPI, metricPackResponse)
    cy.intercept('GET', dashboardDetailsAPI, dashboardDetailsResponse)

    cy.findAllByRole('button', { name: /Next/g }).last().click()

    cy.contains('h3', 'Query Specifications').should('be.visible')

    cy.intercept('POST', sampleDataAPI, sampleDataResponse).as('sampleDataResponse')
    cy.findByRole('button', { name: /Fetch records/i }).click()

    cy.wait('@sampleDataResponse')
    cy.findByRole('button', { name: /Submit/i }).click()

    cy.contains('span', 'One selection is required.').should('be.visible')
    cy.get('input[name="sli"]').click({ force: true })
    cy.contains('span', 'One selection is required.').should('not.exist')

    cy.get('input[name="continuousVerification"]').click({ force: true })
    cy.get('input[name="healthScore"]').click({ force: true })

    cy.contains('span', 'Risk Category is required.').should('exist')
    cy.contains('label', 'Errors').click()
    cy.contains('span', 'Risk Category is required.').should('not.exist')

    cy.contains('span', 'One selection is required.').should('exist')
    cy.get('input[name="higherBaselineDeviation"]').click({ force: true })
    cy.contains('span', 'One selection is required.').should('not.exist')

    cy.contains('span', 'Service Instance Identifier is required.').should('exist')
    cy.fillField('serviceInstanceField', 'gco_service')
    cy.contains('span', 'Service Instance Identifier is required.').should('not.exist')

    cy.findByRole('button', { name: /Submit/i }).click()

    // Creating the monitored service.
    cy.findByRole('button', { name: /Save/i }).click()
    cy.findByText('Monitored Service created').should('be.visible')
  })

  it('should be able to add GCO Health Source with Cloud Logs', () => {
    cy.addNewMonitoredServiceWithServiceAndEnv()
    cy.populateDefineHealthSource(Connectors.GCP, 'gcp-qa-target', 'Google Cloud Operations')

    cy.contains('span', 'product is a required field').should('be.visible')
    cy.get('input[name="product"]').click({ force: true })
    cy.contains('p', 'Cloud Logs').click()
    cy.contains('span', 'product is a required field').should('not.exist')

    cy.intercept('GET', dashboardsAPI, errorResponse).as('dashboardsErrorResponse')

    cy.findByRole('button', { name: /Next/i }).click()

    cy.contains('h2', 'Query Specifications and Mappings').should('be.visible')

    cy.findByRole('button', { name: /Submit/i }).click()

    cy.contains('span', 'Query is required.').should('be.visible')
    cy.fillField('query', '{}')
    cy.contains('span', 'Query is required.').should('not.exist')

    cy.contains('p', 'Submit query to see records from Stackdriver Logs').should('be.visible')

    cy.intercept('POST', logSampleDataAPI, errorResponse)
    cy.findByRole('button', { name: /Fetch records/i }).click()

    cy.contains('p', 'Oops, something went wrong on our end. Please contact Harness Support.').should('exist')

    cy.intercept('POST', logSampleDataAPI, logSampleDataResponse)
    cy.findByRole('button', { name: /Retry/i }).click()

    cy.contains('p', 'Oops, something went wrong on our end. Please contact Harness Support.').should('not.exist')

    cy.contains('span', 'Service Instance is required.').should('be.visible')
    cy.findByRole('button', { name: /Select path for service instance/i }).click()
    cy.contains('p', 'Select path for service instance').should('be.visible')
    cy.contains('span', 'logName').click()
    cy.contains('span', 'Service Instance is required.').should('not.exist')

    cy.contains('span', 'Message Identifier is required.').should('be.visible')
    cy.findByRole('button', { name: /Select path for message identifier/i }).click()
    cy.contains('p', 'Select path for message identifier').should('be.visible')
    cy.contains('span', 'cluster_name').click()
    cy.contains('span', 'Message Identifier is required.').should('not.exist')

    cy.findByRole('button', { name: /Add Query/i }).click()

    cy.fillField('query', '{}')
    cy.intercept('POST', logSampleDataAPI, logSampleDataResponse)
    cy.findByRole('button', { name: /Fetch records/i }).click()

    cy.contains('p', 'Submit query to see records from Stackdriver Logs').should('not.exist')

    cy.findByRole('button', { name: /Select path for service instance/i }).click()
    cy.contains('p', 'Select path for service instance').should('be.visible')
    cy.contains('span', 'logName').click()

    cy.findByRole('button', { name: /Select path for message identifier/i }).click()
    cy.contains('p', 'Select path for message identifier').should('be.visible')
    cy.contains('span', 'cluster_name').click()

    cy.findByRole('button', { name: /Submit/i }).click()

    // Creating the monitored service.
    cy.findByRole('button', { name: /Save/i }).click()
    cy.findByText('Monitored Service created').should('be.visible')
  })

  it('should be able to edit an existing GCO health source', () => {
    cy.intercept('GET', '/cv/api/monitored-service/service1_env1?*', monitoredService)

    cy.wait(2000)

    cy.get('span[data-icon="Options"]').click()
    cy.contains('div', 'Edit service').click()

    cy.contains('div', 'Google Cloud Operations').click()

    cy.intercept('POST', logSampleDataAPI, logSampleDataResponse)
    cy.findByRole('button', { name: /Next/i }).click()

    cy.findByRole('button', { name: /Submit/i }).click()

    // Creating the monitored service.
    cy.findByRole('button', { name: /Save/i }).click()
    cy.findByText('Monitored Service updated').should('be.visible')
  })

  it('should be able to edit an existing GCO health source with a Dashboard query', () => {
    cy.intercept('GET', '/cv/api/monitored-service/service1_env1?*', monitoredService)

    cy.wait(2000)

    cy.get('span[data-icon="Options"]').click()
    cy.contains('div', 'Edit service').click()

    cy.contains('div', 'GCO Dashboard').click()

    cy.intercept('GET', dashboardsAPI, dashboardsResponse).as('dashboardsResponse')

    cy.findByRole('button', { name: /Next/i }).click()

    cy.intercept('GET', dashboardDetailsAPI, dashboardDetailsResponse)

    cy.wait('@dashboardsResponse')
    cy.findAllByRole('button', { name: /Next/g }).last().click()
    cy.get('textarea[name="query"]').should('not.be.empty')

    cy.findByRole('button', { name: /Submit/i }).click()

    cy.contains('div', 'GCO Metric').click()
    cy.get('.Card--selected [data-icon="service-stackdriver"]').should('be.visible')

    cy.findByRole('button', { name: /Next/i }).click()

    cy.get('textarea[name="query"]').should('not.be.empty')
  })
})
