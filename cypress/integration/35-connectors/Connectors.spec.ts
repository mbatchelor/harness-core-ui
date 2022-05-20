import {
  connectorsRoute,
  connectorsCatalogueAPI,
  delegatesListAPI,
  connectorsListAPI
} from '../../support/35-connectors/constants'
import { pageHeaderClassName } from '../../support/70-pipeline/constants'

describe('Connectors list', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.initializeRoute()
    cy.visit(connectorsRoute, {
      timeout: 30000
    })
  })

  it('Connector addition', () => {
    cy.intercept('GET', connectorsCatalogueAPI, { fixture: 'ng/api/connectors/catalogue.json' }).as(
      'connectorsCatalogue'
    )
    cy.wait(1000)
    cy.visitPageAssertion(pageHeaderClassName)
    cy.wait('@connectorsCatalogue')

    cy.contains('p', 'There are no connectors in your project').should('be.visible')
    cy.contains('span', 'Create a Connector').should('be.visible')
    cy.contains('span', 'Create a Connector').click()

    cy.contains('div', 'Cloud Providers').should('be.visible')
    cy.contains('section', 'GCP').should('be.visible')
    cy.contains('section', 'GCP').click()

    cy.contains('span', 'Google Cloud Provider').should('be.visible')

    // Overview step
    cy.contains('p', 'Overview').should('be.visible')
    cy.fillName('testConnector')
    cy.get('span[data-testid="description-edit"]').should('be.visible')
    cy.get('span[data-testid="description-edit"]').click()
    cy.get('span[data-testid="tags-edit"]').should('be.visible')
    cy.get('span[data-testid="tags-edit"]').click()

    cy.fillField('description', 'Test Connector Description')
    cy.contains('textarea', 'Test Connector Description').should('be.visible')
    cy.get('input[data-mentions]').clear().type('connTag').type('{enter}')
    cy.contains('span', 'connTag').should('be.visible')

    cy.contains('span', 'Continue').click()
    cy.wait(1000)

    // Details step
    cy.contains('p', 'Details').should('be.visible')

    cy.contains('p', `Use the credentials of a specific Harness Delegate (IAM role, service account, etc)`).click({
      force: true
    })

    cy.contains('span', 'Continue').click()
    cy.wait(1000)

    //Delegate step
    cy.contains('p', 'Delegates Setup').should('be.visible')

    cy.intercept('GET', delegatesListAPI, { fixture: 'ng/api/connectors/delegates.json' }).as('connectorsCatalogue')

    cy.wait(1000)

    cy.get('input[placeholder="Select or Enter Delegates"]').type('arpit').type('{enter}')
    cy.contains('span', 'Save and Continue').click()

    cy.contains('span', 'Connector created successfully').should('be.visible')

    cy.contains('span', 'Finish').click()
  })

  it('Connector deletion', () => {
    cy.intercept('POST', connectorsListAPI, { fixture: '/ng/api/connectors.json' }).as('connectorsList')

    cy.intercept('GET', connectorsCatalogueAPI, { fixture: 'ng/api/connectors/catalogue.json' }).as(
      'connectorsCatalogue'
    )
    cy.wait(1000)
    cy.visitPageAssertion(pageHeaderClassName)
    cy.wait('@connectorsList')
    cy.wait(1000)

    cy.contains('div', 'dynatrace').should('be.visible')

    cy.get('span[data-icon="Options"]').first().click({ force: true })
    cy.contains('div', 'Delete').should('be.visible')
    cy.contains('div', 'Delete').click()
    cy.contains('span', 'Delete').should('be.visible')
    cy.contains('span', 'Delete').click()

    cy.contains('span', 'Connector dynatrace deleted').should('be.visible')
  })
})
