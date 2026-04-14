# Feature: Tab Management

As a user
I want to manage multiple request tabs
So that I can work on multiple requests simultaneously

---

## Scenario: Open a new tab

Given the app is loaded
When I click the "+ New Request" button in the tab bar
Then a new untitled tab is opened
And the new tab becomes the active tab

---

## Scenario: Switch between tabs

Given I have two or more tabs open
When I click on an inactive tab
Then that tab becomes the active tab
And the request editor shows the content of the selected tab

---

## Scenario: Close a tab with no unsaved changes

Given I have a tab open with no changes
When I click the close (×) button on the tab
Then the tab is removed from the tab bar
And the adjacent tab becomes active

---

## Scenario: Close a dirty tab — discard changes

Given I have a tab open with unsaved changes (dirty state)
When I click the close (×) button on the tab
Then a confirmation dialog appears warning about unsaved changes
When I confirm discarding changes
Then the tab is closed

---

## Scenario: Close a dirty tab — cancel

Given I have a tab open with unsaved changes
When I click the close (×) button on the tab
And a confirmation dialog appears
When I cancel the dialog
Then the tab remains open with its changes intact

---

## Scenario: Close other tabs via context menu

Given I have three or more tabs open
When I right-click on one tab
And I select "Close Other Tabs"
Then all tabs except the right-clicked one are closed
And the remaining tab becomes active

---

## Scenario: Close all tabs via context menu

Given I have multiple tabs open
When I right-click on any tab
And I select "Close All Tabs"
Then all tabs are closed
And the tab bar is empty

---

## Scenario: Dirty indicator shown on modified tab

Given I have an open tab with a saved request
When I modify the URL or any request field
Then an orange dot (dirty indicator) appears on the tab

---

## Scenario: View all tabs via overflow dropdown

Given I have more tabs open than the tab bar can display
When I click the chevron (overflow) button on the right of the tab bar
Then a dropdown appears listing all open tabs
And I can click any tab name to switch to it

---

## Scenario: Search tabs in the overflow dropdown

Given the overflow dropdown is open with multiple tabs listed
When I type a keyword in the search box
Then only matching tabs are shown in the list
