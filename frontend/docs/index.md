---
layout: home

hero:
  name: ENIC MIS
  text: Documentation
  tagline: User manual and technical reference for the ENIC Management Information System — built by ENIC Interns.
  actions:
    - theme: brand
      text: User Manual →
      link: /user-manual/introduction
    - theme: alt
      text: Technical Docs
      link: /technical/architecture

features:
  - icon: 📂
    title: Data Cleaning Tool
    details: Upload, clean, filter, and export Philippine government hospital claims data (T3/T4 files). Handles up to 500,000 rows without freezing the UI.
  - icon: 👥
    title: User Management
    details: Full user lifecycle — create, approve, deactivate. 9 roles with granular per-page privilege control.
  - icon: 📋
    title: Activity Logging
    details: Comprehensive audit trail covering authentication events, privilege changes, and account management actions.
  - icon: ⚡
    title: Web Worker Architecture
    details: All data processing runs off the main thread in a Web Worker. The UI stays responsive no matter the file size.
---
