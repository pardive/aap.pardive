# /unknown Page

_Last updated: 2025-10-04T18:11:52.324Z_

# Product Documentation for Create Segment Page

## Purpose
The Create Segment page allows users to define and create custom segments based on selected data sources and specific criteria. This feature enhances data management by enabling tailored data grouping.

## What the User Sees (UI)
- **Page Title:** "Create Segment" displayed prominently.
- **Description Text:** A brief explanation of the purpose of the page.
- **Source picker UI:** An area for users to select sources like Contacts and Data Tables displayed as chips.
- **Criteria builder UI:** A section for users to define grouping conditions and criteria.
- **Buttons:** 
  - **Cancel**: Option to discard changes and exit.
  - **Save Segment**: Option to save the newly created segment.

## Inputs & Submit Behavior
- **Inputs**: 
  - Users can select multiple data sources using the source picker.
  - Users can build complex criteria using the criteria builder.
- **Submit Behavior**: 
  - Clicking "Save Segment" will submit the selected sources and criteria to be processed.
  - Clicking "Cancel" will reset the form and exit the page without saving any changes.

## Data Flow (Client/Server/APIs/Storage)
- **Client Side**: Users interact with the UI elements to select sources and define criteria.
- **Server Side**: Upon clicking "Save Segment", the data is sent to the server via an API call for processing.
- **APIs**: The API handles the incoming data, stores the new segment configuration, and responds with a confirmation or error message.
- **Storage**: The created segments are stored in the database for future retrieval and management.

## How to Test Checklist
- [ ] The Create Segment page displays the title and description correctly.
- [ ] The source picker is functional, allowing multiple selections.
- [ ] The criteria builder allows users to create and modify criteria.
- [ ] The "Save Segment" button submits data and receives a confirmation response.
- [ ] The "Cancel" button clears any selections and exits correctly.
- [ ] Test with different data sources and criteria to ensure all combinations work.
- [ ] Verify that created segments appear in the database and can be retrieved later.
