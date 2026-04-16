# Smart Inventory & Supply Chain Management System - PRD

## Original Problem Statement
Build a fully functional, interactive Smart Inventory & Supply Chain Management System with 3 role-based dashboards (Farmer, Warehouse, Retailer), MongoDB persistence, cross-role data flow, and distinct visual themes per role.

## Architecture
- **Frontend**: React + Tailwind CSS + Recharts + Lucide React + Shadcn/UI
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB

## User Personas
1. **Farmer** - Manages crop listings, pricing, harvest tracking
2. **Warehouse Operator** - Monitors facility, processes shipments, manages storage
3. **Retailer** - Places orders, tracks inventory, records sales

## Core Requirements
- Role switcher (no auth) for instant view switching
- Cross-role data flow: Farmer adds produce → Retailer orders → Warehouse processes
- Role-specific color themes (green/dark-blue/orange)
- MongoDB-backed persistence with auto-seeded demo data
- Recharts PieChart for Retailer demand insights
- IoT simulation for Warehouse environment monitoring

## What's Been Implemented (Feb 2026)
- [x] Full backend API: inventory CRUD, orders, sales, alerts, IoT, dashboard metrics, profiles, seed data
- [x] Farmer Dashboard: metrics, produce listing CRUD, harvest timeline, notifications/history, bar chart
- [x] Warehouse Dashboard: capacity metrics, IoT monitoring (4 zones), stock pipeline (Awaiting/Processing/Dispatched), space allocation grid, quality grading, alerts
- [x] Retailer Dashboard: sales metrics, PieChart demand insights, order management with browse & place, inventory view (shelves/transit/pending), sales tracking with record form
- [x] Profile page for all roles with edit capability
- [x] Cross-role data flow verified end-to-end
- [x] Role-specific themes: Farmer (green/light), Warehouse (blue/dark), Retailer (orange/light)
- [x] Typography: Manrope headings, IBM Plex Sans body

## Prioritized Backlog
- P1: Real-time WebSocket updates for cross-role sync
- P1: Search and filter on inventory/orders tables
- P2: Export reports (CSV/PDF)
- P2: Mobile responsive sidebar (hamburger menu)
- P2: Date range filtering for sales analytics
- P3: Multi-language support
- P3: Dark mode toggle for Farmer/Retailer views
