# Feature: Request History

As a user
I want to view my past requests
So that I can revisit, re-run, or analyse previous API calls

---

## Background

Given the app is loaded
And the sidebar is visible

---

## Scenario: History entry is created after sending a request

Given I send a request to a valid URL
When I open the History tab in the sidebar
Then the most recent entry shows the method, URL, status code, and duration of the request I just sent

---

## Scenario: Open a history entry into a new tab

Given the History tab is open with at least one entry
When I click on a history entry
Then the request opens in a new tab
And the tab is pre-populated with the method, URL, headers, and body from that history entry

---

## Scenario: Delete a single history entry

Given the History tab has at least one entry
When I right-click an entry and select "Delete"
Then that entry is removed from the history list

---

## Scenario: Clear all history

Given the History tab has multiple entries
When I navigate to Settings and click "Clear History"
And I confirm the action
Then all history entries are removed
And the history list is empty

---

## Scenario: History persists after page reload

Given I have sent several requests
When I reload the app
Then the history entries are still visible in the History tab
