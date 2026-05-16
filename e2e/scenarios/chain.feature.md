# Feature: Chain

As a user
I want to orchestrate multiple API requests in a sequential chain
So that I can test complex workflows and data flows between dependent requests

---

## Background

Given the app is loaded at the home page

---

## Scenario: Create a standalone chain via the Create New dropdown

When I click the Create New dropdown
And I select "Chain"
Then a name input appears in the Chains section of the sidebar
When I type a name and press Enter
Then the new chain appears in the sidebar
And I am navigated to the chain page showing that name in the breadcrumb

---

## Scenario: Chain list shows empty state when no chains exist

Given no standalone chains exist
When the app loads
Then the Chains section in the sidebar shows a "no chains" empty state

---

## Scenario: Rename a standalone chain from the sidebar

Given a standalone chain named "My Chain" exists in the sidebar
When I hover the chain item and open its more menu
And I select "Rename"
Then the chain name becomes an editable input
When I type a new name and press Enter
Then the chain is updated with the new name in the sidebar

---

## Scenario: Delete a standalone chain from the sidebar

Given a standalone chain exists in the sidebar
When I hover the chain item and open its more menu
And I select "Delete"
Then the chain is immediately removed from the sidebar

---

## Scenario: Navigating to a chain page with no APIs shows an empty state

Given a standalone chain with no API nodes exists
When I am on the chain page
Then I see "No APIs in this chain"
And an "Add API" button is visible

---

## Scenario: Chain page header shows the chain title in the breadcrumb

Given a standalone chain named "Auth Flow" exists
When I am on the chain page
Then the page breadcrumb shows "Auth Flow"

---

## Scenario: Run Chain button is disabled when the chain has no requests

Given I am on a chain page with no API nodes
When the page loads
Then the "Run Chain" button is present but disabled

---

## Scenario: Clear edges button is always visible in the chain header

Given I am on any chain page
When the page loads
Then the "Clear edges" button is visible in the header

---

## Scenario: Open the API picker dialog from the empty state

Given I am on a chain page with no API nodes
When I click the "Add API" button
Then the "Add API Request" dialog opens

---

## Scenario: API picker dialog has Collections and History tabs

Given the API picker dialog is open
When I view the dialog
Then I see a "Collections" tab
And I see a "History" tab

---

## Scenario: API picker Collections tab shows empty state when no collections exist

Given no collections exist
And the API picker dialog is open on the Collections tab
When I view the tab
Then I see a "No collections yet" message

---

## Scenario: API picker History tab shows empty state when no history exists

Given no history entries exist
And the API picker dialog is open
When I click the "History" tab
Then I see a "No history yet" message

---

## Scenario: Dismiss the API picker without adding anything

Given the API picker dialog is open
When I press Escape
Then the dialog closes
And no node is added to the chain

---

## Scenario: Add an API from a collection to the chain

Given a collection with a saved request exists
And I am on a chain page with no API nodes
When I open the API picker
And I click a request in the Collections tab
Then the dialog closes
And the chain header shows "1 request"
And the "Run Chain" button becomes enabled

---

## Scenario: Add multiple API nodes and verify request count updates

Given a chain with one API node
When I open the API picker and add a second request
Then the chain header shows "2 requests"
When I open the API picker and add a third request
Then the chain header shows "3 requests"

---

## Scenario: Run a chain with a single API node and see the response

Given a chain with one API node pointing to a reachable endpoint
When I click "Run Chain"
Then the node shows a loading/running state
And the node panel shows the response status and body after completion
And the chain run summary shows 1 passed, 0 failed

---

## Scenario: Run a chain with multiple API nodes sequentially

Given a chain with three API nodes connected in sequence
When I click "Run Chain"
Then each node executes in order
And each node displays its own response status
And the chain run summary shows the total pass/fail counts

---

## Scenario: Pass response data from one node to the next via variable binding

Given a chain with two API nodes
And the first node extracts a value from its response into a variable "authToken"
And the second node uses "{{authToken}}" in its Authorization header
When I click "Run Chain"
Then the second node's request is sent with the resolved Authorization header value
And the second node shows a successful response

---

## Scenario: Add a Condition block between two API nodes

Given a chain with two API nodes
When I add a Condition block between them
Then the condition block appears on the canvas between the two nodes
And the condition block has a configurable expression input
And two output edges appear: one labeled "True" and one labeled "False"

---

## Scenario: Condition block routes to the success branch when the expression is true

Given a chain with a Condition block whose expression evaluates to true at runtime
And the True branch leads to a second API node
When I click "Run Chain"
Then the Condition block shows a "True" result badge
And the second API node on the True branch executes
And the False branch node is skipped

---

## Scenario: Condition block routes to the failure branch when the expression is false

Given a chain with a Condition block whose expression evaluates to false at runtime
And the False branch leads to a third API node
When I click "Run Chain"
Then the Condition block shows a "False" result badge
And the third API node on the False branch executes
And the True branch node is skipped

---

## Scenario: Add a Delay block and verify it pauses execution

Given a chain with two API nodes
When I add a Delay block between them and set the delay to 2000 ms
Then the Delay block appears on the canvas with "2000 ms" displayed
When I click "Run Chain"
Then execution pauses at the Delay block for approximately 2 seconds before proceeding to the next node

---

## Scenario: Add a Display block and verify it shows a message

Given a chain with one API node followed by a Display block
And the Display block is configured with the message "Request complete"
When I click "Run Chain"
Then after the API node completes, the Display block activates
And the canvas or panel shows the message "Request complete"

---

## Scenario: Display block shows a dynamic value from a previous node's response

Given a chain with one API node followed by a Display block
And the Display block message is set to "Status: {{node1.response.status}}"
When I click "Run Chain"
Then the Display block renders the actual response status from node1 in its message

---

## Scenario: API node shows a failure state when the request returns an error status

Given a chain with an API node whose endpoint returns a 4xx or 5xx status
When I click "Run Chain"
Then the API node shows a failure/error badge
And the chain run summary reflects 0 passed, 1 failed

---

## Scenario: Success branch of an API node connects to the next step on 2xx

Given a chain where the first API node's success edge connects to a second API node
And the first API node returns a 2xx response
When I click "Run Chain"
Then the second API node executes
And both nodes show success states

---

## Scenario: Failure branch of an API node connects to an alternate node on error

Given a chain where the first API node has a failure edge connecting to a fallback API node
And the first API node returns a 5xx response
When I click "Run Chain"
Then the failure edge is traversed
And the fallback API node executes
And the main success-path node is skipped

---

## Scenario: Clear edges removes all connections but keeps nodes on the canvas

Given a chain with three connected nodes
When I click "Clear edges" in the header
Then all edges between nodes are removed
And all three nodes remain on the canvas
And the "Run Chain" button becomes disabled (no valid path)

---

## Scenario: Reorder nodes by reconnecting edges and verify new execution order

Given a chain with nodes A → B → C
When I delete the edge between A and B
And I connect A → C → B instead
Then clicking "Run Chain" executes in the order A, C, B

---

## Scenario: Chain with a mix of block types runs end to end

Given a chain: API node → Condition block → (True) Delay block → Display block
When I click "Run Chain" and the condition evaluates to true
Then all four blocks execute in sequence
And each block shows its completed state
And the chain run summary shows the full execution path
