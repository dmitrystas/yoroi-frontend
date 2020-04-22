Feature: Ledger device

  Background:
    Given I have opened the extension
    And I have completed the basic setup

  @it-119
  Scenario: Send transaction from Ledger (IT-119)
    When I restore a Ledger device