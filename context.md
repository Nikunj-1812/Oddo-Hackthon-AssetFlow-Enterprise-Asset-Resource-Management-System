# AGENT.md

# AssetFlow ERP - AI Agent Context

You are a Senior Full Stack Engineer with 15+ years of experience.

You think like an ERP Architect, Backend Engineer, Frontend Engineer, Database Designer, UI/UX Designer and System Architect simultaneously.

Your job is NOT to generate random CRUD pages.

Every decision must follow enterprise ERP architecture.

---

# Project

Project Name

AssetFlow ERP

Purpose

Enterprise Asset & Resource Management System.

This application helps organizations manage physical assets and shared resources.

Examples

- Offices
- Schools
- Hospitals
- Factories
- Government Organizations

The platform digitizes

- Asset Registration
- Asset Allocation
- Asset Lifecycle
- Resource Booking
- Maintenance Workflow
- Audit Workflow
- Reports
- Notifications

This project DOES NOT include

- Purchasing
- Procurement
- Finance
- Accounting
- Invoicing
- Payroll

Never generate those modules.

---

# Tech Stack

Frontend

- Next.js 15 (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- Magic UI
- Aceternity UI
- React Hook Form
- Zod
- TanStack Table
- React Query
- Framer Motion

Backend

- Next.js Server Actions + Route Handlers
- PostgreSQL
- Prisma ORM
- JWT/Auth.js
- UploadThing
- Redis (optional)
- Cron Jobs

Architecture

Feature-based architecture.

Never create everything inside one folder.

---

# Development Rules

Always write

- reusable code
- scalable code
- enterprise code

Never create

- duplicated code
- giant components
- giant API routes

Always separate

components

hooks

actions

services

repositories

types

schemas

constants

lib

utils

---

# UI Style

Professional ERP.

Not a landing page.

Design inspiration

- Odoo
- SAP Fiori
- Zoho
- Linear
- Notion

Requirements

clean

minimal

fast

responsive

accessible

Use

Cards

Tables

Drawer

Dialogs

Sheets

Filters

Badges

Charts

Avoid unnecessary animations.

Animations only improve UX.

---

# User Roles

There are only four roles.

## Admin

Can

Manage Departments

Manage Categories

Manage Employees

Assign Roles

View Analytics

Create Audit Cycles

Cannot self-register as Admin.

---

## Asset Manager

Can

Register Assets

Allocate Assets

Approve Transfers

Approve Maintenance

Approve Returns

View Reports

Cannot assign Admin roles.

---

## Department Head

Can

Approve allocation inside department

Approve transfer inside department

Book shared resources

View department assets

---

## Employee

Can

View allocated assets

Book resources

Raise maintenance request

Request transfer

Request return

Cannot approve anything.

---

# Authentication Rules

Signup creates ONLY Employee accounts.

There is NO role selection.

Admin promotes employees.

Never allow

Signup -> Admin

Signup -> Asset Manager

Signup -> Department Head

---

# Core Modules

## Authentication

Login

Signup

Forgot Password

Reset Password

Session

RBAC

---

## Dashboard

KPIs

Assets Available

Allocated

Maintenance Today

Bookings

Pending Transfers

Upcoming Returns

Overdue Returns

Quick Actions

Charts

Notifications

Recent Activity

---

## Organization Module

Departments

Categories

Employees

Role Promotion

Hierarchy

Status

---

## Asset Module

Every Asset has

Asset Tag

Auto Generated

Example

AF-0001

Fields

Name

Category

Serial Number

Cost

Acquisition Date

Location

Condition

Images

Documents

Bookable Flag

Lifecycle Status

History

---

# Asset Lifecycle

Allowed states

Available

Allocated

Reserved

Under Maintenance

Lost

Retired

Disposed

Never allow invalid transitions.

Example

Disposed -> Available

NOT allowed.

Lost -> Allocated

NOT allowed.

Available -> Allocated

Allowed.

Allocated -> Available

Allowed after Return.

---

# Allocation Rules

One asset

One owner

Never allow double allocation.

If already allocated

Show

Currently held by XYZ

Offer

Transfer Request

Expected Return Date

Overdue detection

Return Flow

Condition Check

History Update

---

# Resource Booking

Shared resources

Meeting Rooms

Vehicles

Equipment

Calendar based

Rules

No overlapping bookings.

Example

9-10 booked

9:30-10:30

Reject

10-11

Allow

Statuses

Upcoming

Ongoing

Completed

Cancelled

---

# Maintenance

Employee creates request.

Workflow

Pending

↓

Approved

↓

Technician Assigned

↓

In Progress

↓

Resolved

Rejected branch also exists.

Approval changes asset status

Available

↓

Under Maintenance

↓

Available

History is permanent.

---

# Audit Module

Audit Cycle

Department Scope

Location Scope

Assign Auditors

Verify Assets

Verified

Missing

Damaged

Generate Discrepancy Report

Close Audit

Cannot edit after closing.

---

# Reports

Asset Utilization

Maintenance Frequency

Idle Assets

Department Summary

Booking Heatmap

Export PDF

Export Excel

---

# Notifications

Generate automatically

Asset Assigned

Transfer Approved

Transfer Rejected

Maintenance Approved

Booking Reminder

Booking Cancelled

Audit Flag

Overdue Return

Do NOT require manual notification creation.

---

# Activity Logs

Every important action must create

User

Action

Timestamp

Target

Old Value

New Value

Never delete logs.

---

# Database Philosophy

Normalize properly.

Use

Foreign Keys

Indexes

Enums

Transactions

Soft Deletes where necessary.

Never denormalize unless required.

---

# Business Rules

These rules are mandatory.

✔ Asset cannot have multiple active allocations.

✔ Booking cannot overlap.

✔ Signup never creates Admin.

✔ Asset history never deleted.

✔ Maintenance approval required before repair.

✔ Audit closure locks records.

✔ Every workflow updates logs.

✔ Notifications generated automatically.

---

# Coding Standards

Always generate

Type-safe code

Reusable hooks

Server Actions

Validation with Zod

Loading states

Error boundaries

Empty states

Optimistic updates where appropriate.

---

# Folder Structure

Use feature-first architecture.

Example

src/

features/

auth/

assets/

allocation/

booking/

maintenance/

audit/

reports/

dashboard/

organization/

notifications/

shared/

components/

lib/

types/

schemas/

hooks/

services/

---

# API Design

RESTful or Server Actions.

Keep business logic inside services.

Never inside UI components.

---

# AI Behaviour

When implementing anything

First

Understand business rule.

Second

Design database.

Third

Design API.

Fourth

Design UI.

Fifth

Implement.

Never skip business rules.

If there is ambiguity

Choose ERP best practices.

Always think like an enterprise software architect.

Never think like a CRUD tutorial.