# Feature: Collections

As a user
I want to organise my requests into collections
So that I can manage and reuse them easily

---

## Background

Given the app is loaded
And the Collections panel is visible in the sidebar

---

## Scenario: Create a new collection

When I click the "Create" dropdown and select "New Collection"
Then a new collection appears in the sidebar with a default name in edit mode
When I type a name and press Enter
Then the collection is saved with the given name

---

## Scenario: Rename a collection

Given a collection named "My API" exists in the sidebar
When I right-click on the collection
And I select "Rename"
Then the collection name becomes editable
When I type a new name and press Enter
Then the collection is updated with the new name

---

## Scenario: Delete a collection

Given a collection exists in the sidebar
When I right-click on the collection
And I select "Delete"
Then a confirmation dialog appears
When I confirm deletion
Then the collection and all its requests are removed from the sidebar

---

## Scenario: Save a new request to a collection

Given I have a configured request in an open tab
When I click the Save button (or press Cmd/Ctrl+S)
And the Save Request modal appears
And I enter a request name
And I select an existing collection
And I click Save
Then the request appears inside the selected collection in the sidebar
And the tab is no longer dirty

---

## Scenario: Save a request to a new collection from the save modal

Given the Save Request modal is open
When I enter a request name
And I click "New Collection" and provide a collection name
And I save
Then the new collection is created
And the request is saved inside it

---

## Scenario: Open a saved request from the sidebar

Given a collection with at least one saved request is visible in the sidebar
When I click on the request name
Then the request opens in a new tab
And the tab shows the request's name, method, and URL

---

## Scenario: Update a saved request

Given a saved request is open in an active tab
When I modify the URL or any field
Then the tab shows the dirty indicator
When I press Cmd/Ctrl+S
Then the changes are saved to the collection
And the dirty indicator disappears

---

## Scenario: Delete a request from a collection

Given a collection has at least one saved request
When I right-click on the request in the sidebar
And I select "Delete"
Then a confirmation dialog appears
When I confirm deletion
Then the request is removed from the collection
And if the request was open in a tab, the tab is also closed

---

## Scenario: Collection is collapsed and expanded

Given a collection is visible in the sidebar
When I click the collection header to collapse it
Then the requests inside are hidden
When I click again to expand
Then the requests are visible again
