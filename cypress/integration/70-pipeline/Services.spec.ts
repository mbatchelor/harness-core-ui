import {
  servicesRoute,
  servicesCall,
  servicesUpsertCall,
  servicesUpdateList,
  pageHeaderClassName
} from '../../support/70-pipeline/constants'

describe('Services for Pipeline', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.initializeRoute()
    cy.visit(servicesRoute, {
      timeout: 30000
    })
  })

  it('Service Addition & YAML/visual parity', () => {
    cy.intercept('GET', servicesCall, { fixture: 'ng/api/servicesV2/service.empty.json' }).as('emptyServicesList')
    cy.wait(1000)
    cy.visitPageAssertion(pageHeaderClassName)
    cy.contains('div', 'Manage Service').should('be.visible')
    cy.contains('div', 'Manage Service').click()
    cy.wait('@emptyServicesList')
    cy.wait(500)
    cy.contains('span', 'New Service').should('be.visible')
    cy.contains('span', 'New Service').click()
    cy.matchImageSnapshot('New Service Modal')

    cy.fillName('testService')
    cy.get('span[data-testid="description-edit"]').should('be.visible')
    cy.get('span[data-testid="description-edit"]').click()
    cy.get('span[data-testid="tags-edit"]').should('be.visible')
    cy.get('span[data-testid="tags-edit"]').click()

    cy.fillField('description', 'Test Service Description')
    cy.contains('textarea', 'Test Service Description').should('be.visible')
    cy.get('input[data-mentions]').clear().type('serviceTag').type('{enter}')
    cy.contains('span', 'serviceTag').should('be.visible')

    // // YAML assertion
    cy.get('[data-name="toggle-option-two"]').click()

    cy.contains('span', 'testService').should('be.visible')
    cy.contains('span', 'Test Service Description').should('be.visible')
    cy.contains('span', 'serviceTag').should('be.visible')

    // // Saving
    cy.contains('span', 'Save').click()
    cy.wait(1000)
    cy.contains('span', 'Service created successfully').should('be.visible')
  })

  it('Services Assertion and Edit', () => {
    cy.intercept('GET', servicesCall, { fixture: 'ng/api/servicesV2/batch.post.json' }).as('servicesList')
    cy.wait(1000)
    cy.visitPageAssertion(pageHeaderClassName)
    cy.contains('div', 'Manage Service').should('be.visible')
    cy.contains('div', 'Manage Service').click()
    cy.wait('@servicesList')
    cy.wait(500)

    cy.contains('p', 'testService').should('be.visible')
    cy.contains('p', 'Test Service Description').should('be.visible')

    cy.get('span[data-icon="main-tags"]').should('be.visible')
    cy.get('span[data-icon="main-tags"]').trigger('mouseover')
    cy.contains('p', 'TAGS').should('be.visible')
    cy.contains('span', 'serviceTag').should('be.visible')
    cy.get('span[data-icon="main-tags"]').trigger('mouseout').wait(500)

    cy.get('span[icon="grid-view"]').click()
    cy.get('span[data-icon="Options"]').should('be.visible')
    cy.get('span[data-icon="Options"]').click()
    cy.contains('div', 'Edit').should('be.visible').click({ force: true })

    //edit values
    cy.wait(1000)
    cy.fillName('NewtestService')

    // YAML assertion
    cy.get('[data-name="toggle-option-two"]').click()

    cy.contains('span', 'NewtestService').should('be.visible')
    cy.contains('span', 'Test Service Description').should('be.visible')
    cy.contains('span', 'serviceTag').should('be.visible')

    //upsert call
    cy.intercept('GET', servicesUpsertCall, { fixture: 'ng/api/servicesV2/servicesUpdate.json' })
    cy.intercept('GET', servicesCall, { fixture: 'ng/api/servicesV2/batch.post.update.json' }).as('serviceListUpdate')
    cy.contains('span', 'Save').click()

    //Updated list
    cy.wait('@serviceListUpdate')

    //check if list updated
    cy.contains('p', 'NewtestService').should('be.visible')
    cy.contains('span', 'Service updated successfully').should('be.visible')
  })

  it('Services Assertion and Deletion', () => {
    cy.intercept('GET', servicesCall, { fixture: 'ng/api/servicesV2/batch.post.json' }).as('servicesList')
    cy.wait(1000)
    cy.visitPageAssertion(pageHeaderClassName)
    cy.contains('div', 'Manage Service').should('be.visible')
    cy.contains('div', 'Manage Service').click()
    cy.wait('@servicesList')
    cy.wait(500)

    cy.contains('p', 'testService').should('be.visible')
    cy.contains('p', 'Test Service Description').should('be.visible')

    cy.get('span[data-icon="main-tags"]').should('be.visible')
    cy.get('span[data-icon="main-tags"]').trigger('mouseover')
    cy.contains('p', 'TAGS').should('be.visible')
    cy.contains('span', 'serviceTag').should('be.visible')
    cy.get('span[data-icon="main-tags"]').trigger('mouseout').wait(500)

    cy.get('span[icon="grid-view"]').click()
    cy.get('span[data-icon="Options"]').should('be.visible')
    cy.get('span[data-icon="Options"]').click()
    cy.contains('div', 'Delete').should('be.visible').click({ force: true })

    cy.contains('span', 'Confirm').should('be.visible')
    cy.contains('span', 'Confirm').click()
    cy.wait(1000)
    cy.contains('span', 'Service deleted').should('be.visible')
  })
})
