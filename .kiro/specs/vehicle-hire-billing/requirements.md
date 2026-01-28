# Requirements Document

## Introduction

A modern, high-performance vehicle hire billing system built with Next.js 15 that enables efficient creation, management, and printing of professional vehicle hire invoices. The system provides real-time calculation capabilities, database persistence, and a clean dashboard for bill management.

## Glossary

- **Billing_System**: The complete vehicle hire billing application
- **Bill**: A single invoice record containing vehicle hire charges and customer information
- **Bill_Creator**: The interface component for creating new bills
- **Dashboard**: The main interface showing searchable table of all bills
- **Print_Generator**: The component responsible for generating PDF/printable invoices
- **Database**: Supabase PostgreSQL database accessed via Prisma ORM
- **Server_Action**: Next.js server-side function for database operations
- **Calculation_Engine**: The utility/hook that performs real-time bill calculations

## Requirements

### Requirement 1: Bill Creation and Management

**User Story:** As a billing operator, I want to create vehicle hire bills with automatic calculations, so that I can generate accurate invoices efficiently.

#### Acceptance Criteria

1. WHEN a user creates a new bill, THE Billing_System SHALL generate a unique billNumber starting from 1 and auto-incrementing
2. WHEN a user enters startMeter and endMeter values, THE Calculation_Engine SHALL calculate the distance automatically
3. WHEN any billing field changes, THE Calculation_Engine SHALL recalculate totalAmount as ((endMeter - startMeter) * hireRate) + waitingCharge + gatePass + packageCharge
4. WHEN a user submits a valid bill, THE Server_Action SHALL save it to the Database and return the generated ID
5. WHEN a user submits an invalid bill, THE Billing_System SHALL display validation errors and prevent submission

### Requirement 2: Data Validation and Integrity

**User Story:** As a system administrator, I want all bill data to be validated and consistent, so that the system maintains data integrity.

#### Acceptance Criteria

1. THE Billing_System SHALL validate all required fields (vehicleNo, customerName, route, startMeter, endMeter, hireRate) before submission
2. WHEN endMeter is less than startMeter, THE Billing_System SHALL reject the input and display an error message
3. WHEN numeric fields contain non-numeric values, THE Billing_System SHALL reject the input and display validation errors
4. THE Database SHALL enforce proper data types and constraints for all bill fields
5. THE Billing_System SHALL use Zod schemas for both client-side and server-side validation

### Requirement 3: Professional Invoice Generation

**User Story:** As a billing operator, I want to generate professional PDF invoices, so that I can provide customers with proper documentation.

#### Acceptance Criteria

1. WHEN a bill is created successfully, THE Print_Generator SHALL be immediately available for the new bill
2. WHEN a user requests to print a bill, THE Print_Generator SHALL generate a professional invoice layout with company header
3. THE Print_Generator SHALL display all bill details in a clean table format with bold total section
4. THE Print_Generator SHALL use modern typography (Inter or Geist fonts) with white background and sharp borders
5. THE Print_Generator SHALL support both PDF generation and direct printing using react-to-print

### Requirement 4: Bill Management Dashboard

**User Story:** As a billing operator, I want to view and search through all previous bills, so that I can manage billing history efficiently.

#### Acceptance Criteria

1. WHEN a user accesses the dashboard, THE Dashboard SHALL display all bills in a searchable table format
2. WHEN a user searches for bills, THE Dashboard SHALL filter results based on vehicleNo, customerName, or billNumber
3. WHEN a user clicks on a bill row, THE Dashboard SHALL allow viewing the complete bill details
4. THE Dashboard SHALL display bills in descending order by creation date (newest first)
5. THE Dashboard SHALL use Shadcn DataTable component for consistent UI experience

### Requirement 5: Database Operations and Performance

**User Story:** As a system user, I want fast and reliable database operations, so that the system performs efficiently.

#### Acceptance Criteria

1. WHEN a bill is saved, THE Server_Action SHALL persist it to Supabase PostgreSQL via Prisma ORM
2. WHEN database operations fail, THE Server_Action SHALL return appropriate error messages to the client
3. THE Database SHALL maintain referential integrity and proper indexing for performance
4. WHEN loading the dashboard, THE Billing_System SHALL retrieve bills efficiently with proper pagination if needed
5. THE Billing_System SHALL handle database connection errors gracefully and inform users appropriately

### Requirement 6: User Interface and Experience

**User Story:** As a user, I want a modern, intuitive interface, so that I can operate the system efficiently.

#### Acceptance Criteria

1. THE Billing_System SHALL provide a clean, professional SaaS-style interface using Tailwind CSS and Shadcn UI
2. WHEN forms are submitted, THE Billing_System SHALL provide immediate feedback and loading states
3. THE Billing_System SHALL be fully responsive and work on desktop, tablet, and mobile devices
4. WHEN validation errors occur, THE Billing_System SHALL display clear, actionable error messages
5. THE Billing_System SHALL maintain consistent design patterns throughout all components

### Requirement 7: Real-time Calculations

**User Story:** As a billing operator, I want automatic calculation updates, so that I can see totals immediately as I enter data.

#### Acceptance Criteria

1. WHEN any calculation input changes, THE Calculation_Engine SHALL update totalAmount within 100ms
2. THE Calculation_Engine SHALL handle edge cases like empty fields or zero values gracefully
3. WHEN hireRate or distance changes, THE Calculation_Engine SHALL recalculate the base charge immediately
4. WHEN extra charges (waiting, gatePass, package) change, THE Calculation_Engine SHALL update the total immediately
5. THE Calculation_Engine SHALL display calculated values with proper currency formatting

### Requirement 8: System Architecture and Performance

**User Story:** As a system architect, I want a well-structured, performant application, so that it scales and maintains efficiently.

#### Acceptance Criteria

1. THE Billing_System SHALL use Next.js 15 App Router with TypeScript for type safety
2. THE Billing_System SHALL implement Server Actions for all database mutations
3. THE Billing_System SHALL use React Hook Form for efficient form state management
4. THE Billing_System SHALL implement proper error boundaries and error handling
5. THE Billing_System SHALL achieve fast page load times and smooth user interactions