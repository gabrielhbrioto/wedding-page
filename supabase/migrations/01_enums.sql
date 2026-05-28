-- =====================================================
-- SITE DE CASAMENTO - DDL COMPLETO (VERSÃO FINAL MVP)
-- PostgreSQL / Supabase Compatible
-- =====================================================

create extension if not exists pgcrypto;

-- =====================================================
-- 1. ENUMS
-- =====================================================

create type invite_type as enum (
  'CERIMONIA',
  'CERIMONIA_JANTAR',
  'VIP'
);

create type member_status as enum (
  'CERIMONIA_E_JANTAR',
  'SOMENTE_CERIMONIA',
  'AUSENTE'
);

create type rsvp_status as enum (
  'PENDENTE',
  'RESPONDIDO'
);

-- =====================================================
