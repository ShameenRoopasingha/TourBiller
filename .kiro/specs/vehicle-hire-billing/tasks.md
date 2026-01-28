# Implementation Plan: Vehicle Hire Billing System

## Overview

This implementation plan converts the vehicle hire billing system design into discrete coding tasks for a Next.js 15 application. Each task builds incrementally toward a complete, production-ready billing system with real-time calculations, professional invoice generation, and comprehensive testing.

## Tasks

- [x] 1. Project Setup and Core Infrastructure
  - Initialize Next.js 15 project with App Router and TypeScript
  - Configure Tailwind CSS and Shadcn UI components
  - Set up Prisma ORM with Supabase PostgreSQL connection
  - Configure environment variables and database connection
  - Set up testing framework (Jest, React Testing Library, Fast-check)
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 2. Database Schema and Validation
  - [x] 2.1 Create Prisma schema for Bill model
    - Define Bill model with all required fields and constraints
    - Configure auto-incrementing billNumber and CUID primary key
    - Set up database migrations and seed data
    - _Requirements: 2.4, 5.1_
  
  - [x] 2.2 Write property test for bill number uniqueness
    - **Property 1: Bill Number Uniqueness and Sequencing**
    - **Validates: Requirements 1.1**
  
  - [x] 2.3 Create Zod validation schemas
    - Define BillSchema with all validation rules
    - Implement cross-field validation (endMeter > startMeter)
    - Create shared validation utilities for client and server
    - _Requirements: 2.1, 2.2, 2.3, 2.5_
  
  - [x] 2.4 Write property test for validation schema consistency
    - **Property 5: Validation Schema Consistency**
    - **Validates: Requirements 2.5**

- [x] 3. Calculation Engine Implementation
  - [x] 3.1 Create calculation utility functions
    - Implement calculateTotalAmount function
    - Create calculateDistance and formatCurrency utilities
    - Handle edge cases and error conditions
    - _Requirements: 1.2, 1.3, 7.3, 7.4, 7.5_
  
  - [x] 3.2 Write property test for calculation correctness
    - **Property 2: Total Amount Calculation Correctness**
    - **Validates: Requirements 1.2, 1.3, 7.3, 7.4**
  
  - [x] 3.3 Create useCalculationEngine hook
    - Implement real-time calculation updates
    - Handle form state and field updates
    - Provide formatted currency display
    - _Requirements: 7.2, 7.5_
  
  - [x] 3.4 Write property test for currency formatting
    - **Property 16: Currency Formatting Consistency**
    - **Validates: Requirements 7.5**

- [ ] 4. Server Actions Implementation
  - [x] 4.1 Create createBill server action
    - Implement form data validation using Zod
    - Handle database persistence via Prisma
    - Generate unique bill numbers and return bill ID
    - Implement comprehensive error handling
    - _Requirements: 1.4, 1.5, 5.1, 5.2_
  
  - [x] 4.2 Write property test for valid bill persistence
    - **Property 3: Valid Bill Persistence**
    - **Validates: Requirements 1.4, 5.1**
  
  - [ ] 4.3 Write property test for invalid bill rejection
    - **Property 4: Invalid Bill Rejection**
    - **Validates: Requirements 1.5, 2.1, 2.2, 2.3**
  
  - [x] 4.4 Create getBills server action
    - Implement bill retrieval with search functionality
    - Add sorting and filtering capabilities
    - Handle database errors gracefully
    - _Requirements: 4.2, 4.4, 5.2, 5.5_
  
  - [ ] 4.5 Write property test for database error handling
    - **Property 13: Database Error Handling**
    - **Validates: Requirements 5.2, 5.5**

- [ ] 5. Checkpoint - Core Backend Complete
  - Ensure all server actions work correctly
  - Verify database operations and validation
  - Test calculation utilities thoroughly
  - Ask the user if questions arise

- [ ] 6. Bill Creation UI Components
  - [x] 6.1 Create BillCreator form component
    - Build form using React Hook Form and Shadcn UI
    - Integrate real-time calculations with useCalculationEngine
    - Implement client-side validation with Zod
    - Add loading states and error handling
    - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.2, 6.4_
  
  - [ ] 6.2 Write property test for form submission feedback
    - **Property 14: Form Submission Feedback**
    - **Validates: Requirements 6.2**
  
  - [ ] 6.3 Write property test for validation error display
    - **Property 15: Validation Error Display**
    - **Validates: Requirements 6.4**
  
  - [x] 6.4 Create bill creation page
    - Implement App Router page with BillCreator component
    - Add navigation and layout components
    - Integrate with server actions for form submission
    - _Requirements: 6.1, 8.1_

- [ ] 7. Dashboard and Bill Management
  - [ ] 7.1 Create Dashboard component with DataTable
    - Implement searchable bill table using Shadcn DataTable
    - Add search functionality for vehicleNo, customerName, billNumber
    - Implement sorting by creation date (newest first)
    - Add bill detail viewing capabilities
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ] 7.2 Write property test for dashboard search functionality
    - **Property 10: Dashboard Search Functionality**
    - **Validates: Requirements 4.2**
  
  - [ ] 7.3 Write property test for bill detail access
    - **Property 11: Bill Detail Access**
    - **Validates: Requirements 4.3**
  
  - [ ] 7.4 Write property test for dashboard sorting
    - **Property 12: Dashboard Sorting Order**
    - **Validates: Requirements 4.4**
  
  - [ ] 7.5 Create dashboard page
    - Implement App Router page with Dashboard component
    - Integrate with getBills server action
    - Add responsive design for mobile devices
    - _Requirements: 6.3, 8.1_

- [ ] 8. Professional Invoice Generation
  - [ ] 8.1 Create PrintableInvoice component
    - Design professional invoice layout with company header
    - Implement clean table format with bold total section
    - Use modern typography (Inter/Geist fonts) and styling
    - Ensure print-friendly CSS with proper page breaks
    - _Requirements: 3.2, 3.3, 3.4_
  
  - [ ] 8.2 Write property test for invoice content completeness
    - **Property 8: Invoice Content Completeness**
    - **Validates: Requirements 3.2, 3.3**
  
  - [ ] 8.3 Integrate react-to-print functionality
    - Set up PDF generation and direct printing capabilities
    - Create print trigger buttons and handlers
    - Implement print preview functionality
    - Handle print errors and edge cases
    - _Requirements: 3.5_
  
  - [ ] 8.4 Write property test for print mode support
    - **Property 9: Print Mode Support**
    - **Validates: Requirements 3.5**
  
  - [ ] 8.5 Create print page and routing
    - Implement dedicated print route for invoices
    - Add print availability after bill creation
    - Integrate with bill creation workflow
    - _Requirements: 3.1_
  
  - [ ] 8.6 Write property test for print availability
    - **Property 7: Print Availability After Creation**
    - **Validates: Requirements 3.1**

- [ ] 9. Error Handling and Boundaries
  - [ ] 9.1 Implement error boundary components
    - Create BillingErrorBoundary for React error catching
    - Add fallback UI components for error states
    - Implement error logging and monitoring
    - _Requirements: 8.4_
  
  - [ ] 9.2 Write property test for error boundary protection
    - **Property 17: Error Boundary Protection**
    - **Validates: Requirements 8.4**
  
  - [ ] 9.3 Add comprehensive error handling
    - Implement network error handling in components
    - Add retry mechanisms for failed operations
    - Create user-friendly error messages
    - Handle edge cases in calculations and forms
    - _Requirements: 5.5, 6.4, 7.2_

- [ ] 10. Database Constraints and Performance
  - [ ] 10.1 Implement database constraints
    - Add proper indexes for performance
    - Set up referential integrity constraints
    - Configure connection pooling and optimization
    - _Requirements: 2.4, 5.3_
  
  - [ ] 10.2 Write property test for database constraint enforcement
    - **Property 6: Database Constraint Enforcement**
    - **Validates: Requirements 2.4**
  
  - [ ] 10.3 Optimize database queries
    - Add pagination for large bill collections
    - Implement efficient search queries
    - Add database query monitoring
    - _Requirements: 5.4_

- [ ] 11. Final Integration and Polish
  - [ ] 11.1 Complete application routing
    - Set up all App Router pages and navigation
    - Implement breadcrumbs and navigation components
    - Add responsive design for all screen sizes
    - _Requirements: 6.3, 8.1_
  
  - [ ] 11.2 Add final UI polish
    - Implement consistent design patterns
    - Add loading states and transitions
    - Optimize bundle size and performance
    - _Requirements: 6.1, 6.5, 8.5_
  
  - [ ] 11.3 Write integration tests
    - Test complete bill creation workflow
    - Test dashboard search and filtering
    - Test print generation end-to-end
    - Test error handling across components

- [ ] 12. Final Checkpoint - Complete System Test
  - Run all property-based tests (minimum 100 iterations each)
  - Verify all requirements are met and functional
  - Test responsive design on multiple devices
  - Ensure all tests pass, ask the user if questions arise

## Notes

- All tasks are required for comprehensive implementation
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Checkpoints ensure incremental validation and user feedback
- All property tests must be tagged with: **Feature: vehicle-hire-billing, Property {number}: {property_text}**