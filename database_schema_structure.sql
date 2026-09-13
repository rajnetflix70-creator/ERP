-- ====================================================
-- SiteTrack Construction ERP - PostgreSQL Database Schema
-- Exported on: 2026-09-13T18:02:01.112Z
-- Total Tables: 49
-- ====================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------
-- Table: activity_logs
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  machine_id                   UUID                ,
  activity                     VARCHAR(255)         NOT NULL,
  site_name                    VARCHAR(200)        ,
  user_name                    VARCHAR(100)        ,
  details                      TEXT                ,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: attendance_records
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  user_id                      UUID                 NOT NULL,
  site_id                      UUID                ,
  attendance_date              DATE                 NOT NULL,
  check_in_at                  TIMESTAMPTZ         ,
  check_in_lat                 NUMERIC(10, 8)      ,
  check_in_lng                 NUMERIC(11, 8)      ,
  check_in_photo_url           TEXT                ,
  check_out_at                 TIMESTAMPTZ         ,
  check_out_lat                NUMERIC(10, 8)      ,
  check_out_lng                NUMERIC(11, 8)      ,
  check_out_photo_url          TEXT                ,
  status                       VARCHAR(255)         DEFAULT 'present'::character varying,
  overtime_hours               NUMERIC(5, 2)        DEFAULT '0'::numeric,
  remarks                      TEXT                ,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  project_id                   UUID                
);

-- ----------------------------------------------------
-- Table: audit_logs
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  user_id                      UUID                ,
  user_name                    VARCHAR(150)        ,
  user_role                    VARCHAR(50)         ,
  module                       VARCHAR(50)          NOT NULL,
  action                       VARCHAR(100)         NOT NULL,
  entity_type                  VARCHAR(50)         ,
  entity_id                    VARCHAR(100)        ,
  entity_number                VARCHAR(100)        ,
  details                      TEXT                ,
  ip_address                   VARCHAR(50)         ,
  status                       VARCHAR(20)          DEFAULT 'SUCCESS'::character varying,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------
-- Table: bill_of_quantities
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bill_of_quantities (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  project_id                   UUID                 NOT NULL,
  item_code                    VARCHAR(50)          NOT NULL,
  description                  TEXT                 NOT NULL,
  unit                         VARCHAR(20)          NOT NULL,
  agreed_rate                  NUMERIC(12, 2)       NOT NULL,
  planned_qty                  NUMERIC(10, 2)       NOT NULL,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: breakdown_records
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.breakdown_records (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  machine_id                   UUID                 NOT NULL,
  breakdown_date               DATE                 NOT NULL,
  site_id                      UUID                ,
  operator_id                  UUID                ,
  breakdown_type               VARCHAR(100)        ,
  problem_description          TEXT                 NOT NULL,
  priority                     VARCHAR(20)          DEFAULT 'Medium'::character varying,
  reported_by                  VARCHAR(100)        ,
  assigned_technician          VARCHAR(100)        ,
  repair_start                 TIMESTAMPTZ         ,
  repair_end                   TIMESTAMPTZ         ,
  downtime_hours               NUMERIC(8, 2)        DEFAULT '0'::numeric,
  repair_cost                  NUMERIC(12, 2)       DEFAULT '0'::numeric,
  resolution                   TEXT                ,
  status                       VARCHAR(30)          DEFAULT 'Open'::character varying,
  remarks                      TEXT                ,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: clients
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  name                         VARCHAR(200)         NOT NULL,
  contact_person               VARCHAR(100)        ,
  mobile                       VARCHAR(50)         ,
  email                        VARCHAR(100)        ,
  address                      TEXT                ,
  trn_number                   VARCHAR(50)         ,
  is_active                    BOOLEAN              DEFAULT true,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: daily_progress_logs
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_progress_logs (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  work_package_id              UUID                 NOT NULL,
  project_id                   UUID                 NOT NULL,
  logged_by                    UUID                ,
  log_date                     DATE                 NOT NULL,
  work_description             TEXT                 NOT NULL,
  qty_completed                NUMERIC(10, 2)      ,
  qty_unit                     VARCHAR(30)         ,
  completion_pct               NUMERIC(5, 2)       ,
  status_after                 VARCHAR(30)         ,
  issues_encountered           TEXT                ,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: employee_wages
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.employee_wages (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  user_id                      UUID                 NOT NULL,
  daily_rate                   NUMERIC(10, 2)       DEFAULT '0'::numeric,
  ot_rate_per_hour             NUMERIC(10, 2)       DEFAULT '0'::numeric,
  effective_from               DATE                 NOT NULL,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: equipment_categories
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.equipment_categories (
  id                           INTEGER              DEFAULT nextval('equipment_categories_id_seq'::regclass) NOT NULL,
  name                         VARCHAR(255)         NOT NULL,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: equipment_daily_logs
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.equipment_daily_logs (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  machine_id                   UUID                 NOT NULL,
  log_date                     DATE                 NOT NULL,
  location_name                VARCHAR(200)         NOT NULL,
  logged_by                    UUID                ,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  operator_id                  UUID                ,
  start_meter                  NUMERIC(10, 2)       DEFAULT '0'::numeric,
  end_meter                    NUMERIC(10, 2)       DEFAULT '0'::numeric,
  total_hours                  NUMERIC(8, 2)        DEFAULT '0'::numeric,
  working_hours                NUMERIC(8, 2)        DEFAULT '0'::numeric,
  idle_hours                   NUMERIC(8, 2)        DEFAULT '0'::numeric,
  fuel_used                    NUMERIC(8, 2)        DEFAULT '0'::numeric,
  work_description             TEXT                ,
  remarks                      TEXT                
);

-- ----------------------------------------------------
-- Table: equipment_documents
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.equipment_documents (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  machine_id                   UUID                 NOT NULL,
  document_type                VARCHAR(50)          NOT NULL,
  document_number              VARCHAR(100)        ,
  issue_date                   DATE                ,
  expiry_date                  DATE                 NOT NULL,
  file_url                     VARCHAR(255)        ,
  status                       VARCHAR(30)          DEFAULT 'Valid'::character varying,
  notes                        TEXT                ,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: equipment_items
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.equipment_items (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  name                         VARCHAR(255)         NOT NULL,
  asset_code                   VARCHAR(255)        ,
  category_id                  INTEGER             ,
  item_type                    VARCHAR(255)         NOT NULL,
  unit                         VARCHAR(255)         NOT NULL,
  reorder_level                NUMERIC(8, 2)        DEFAULT '0'::numeric,
  total_quantity               NUMERIC(8, 2)        DEFAULT '0'::numeric NOT NULL,
  notes                        TEXT                ,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: equipment_machines
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.equipment_machines (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  machine_type                 VARCHAR(50)          NOT NULL,
  brand                        VARCHAR(100)        ,
  machine_no                   VARCHAR(100)        ,
  jack_no                      VARCHAR(100)        ,
  pump_no                      VARCHAR(100)        ,
  pressure_gauge_no            VARCHAR(100)        ,
  motor_no                     VARCHAR(100)        ,
  current_site_id              UUID                ,
  current_location_name        VARCHAR(200)        ,
  condition_remarks            TEXT                ,
  status                       VARCHAR(30)          DEFAULT 'available'::character varying,
  is_active                    BOOLEAN              DEFAULT true,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  calibration_cert_no          VARCHAR(100)        ,
  calibration_expiry_date      DATE                ,
  paired_set_code              VARCHAR(50)         ,
  last_service_date            DATE                ,
  equipment_code               VARCHAR(50)         ,
  equipment_name               VARCHAR(150)        ,
  make                         VARCHAR(100)        ,
  model                        VARCHAR(100)        ,
  registration_no              VARCHAR(100)        ,
  ownership                    VARCHAR(30)          DEFAULT 'owned'::character varying,
  vendor_id                    UUID                ,
  purchase_cost                NUMERIC(12, 2)      ,
  rental_cost                  NUMERIC(12, 2)      ,
  rental_start_date            DATE                ,
  rental_end_date              DATE                ,
  engine_number                VARCHAR(100)        ,
  chassis_number               VARCHAR(100)        ,
  capacity                     VARCHAR(100)        ,
  fuel_type                    VARCHAR(50)         ,
  year_manufacture             INTEGER             ,
  meter_type                   VARCHAR(30)          DEFAULT 'hours'::character varying,
  current_meter                NUMERIC(10, 2)       DEFAULT '0'::numeric,
  current_operator_id          UUID                ,
  last_maintenance_date        DATE                ,
  next_maintenance_date        DATE                
);

-- ----------------------------------------------------
-- Table: equipment_movements
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.equipment_movements (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  machine_id                   UUID                 NOT NULL,
  from_site_id                 UUID                ,
  to_site_id                   UUID                ,
  from_location_name           VARCHAR(200)        ,
  to_location_name             VARCHAR(200)        ,
  transfer_date                DATE                 NOT NULL,
  transfer_reason              TEXT                ,
  meter_reading                NUMERIC(10, 2)       DEFAULT '0'::numeric,
  transport_details            VARCHAR(255)        ,
  handover_person              VARCHAR(100)        ,
  receiving_person             VARCHAR(100)        ,
  status                       VARCHAR(50)          DEFAULT 'Transfer Requested'::character varying,
  requested_by                 UUID                ,
  remarks                      TEXT                ,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: equipment_site_allocations
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.equipment_site_allocations (
  id                           INTEGER              DEFAULT nextval('equipment_site_allocations_id_seq'::regclass) NOT NULL,
  equipment_item_id            UUID                 NOT NULL,
  site_id                      UUID                 NOT NULL,
  quantity                     NUMERIC(8, 2)        DEFAULT '0'::numeric NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------
-- Table: grn_records
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.grn_records (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  po_id                        UUID                 NOT NULL,
  po_line_item_id              UUID                 NOT NULL,
  received_by                  UUID                 NOT NULL,
  received_date                DATE                 NOT NULL,
  qty_received                 NUMERIC(10, 2)       NOT NULL,
  remarks                      TEXT                ,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: invoice_line_items
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoice_line_items (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  invoice_id                   UUID                 NOT NULL,
  boq_item_id                  UUID                ,
  description                  TEXT                 NOT NULL,
  qty                          NUMERIC(10, 2)       NOT NULL,
  unit_price                   NUMERIC(12, 2)       NOT NULL,
  vat_rate                     NUMERIC(5, 2)        DEFAULT '5'::numeric,
  amount                       NUMERIC(14, 2)       NOT NULL
);

-- ----------------------------------------------------
-- Table: invoices
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.invoices (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  invoice_number               VARCHAR(50)          NOT NULL,
  project_id                   UUID                ,
  client_id                    UUID                 NOT NULL,
  invoice_date                 DATE                 NOT NULL,
  period_from                  DATE                ,
  period_to                    DATE                ,
  subtotal                     NUMERIC(14, 2)       DEFAULT '0'::numeric,
  vat_amount                   NUMERIC(14, 2)       DEFAULT '0'::numeric,
  total_amount                 NUMERIC(14, 2)       DEFAULT '0'::numeric,
  status                       VARCHAR(20)          DEFAULT 'draft'::character varying,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: knex_migrations
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knex_migrations (
  id                           INTEGER              DEFAULT nextval('knex_migrations_id_seq'::regclass) NOT NULL,
  name                         VARCHAR(255)        ,
  batch                        INTEGER             ,
  migration_time               TIMESTAMPTZ         
);

-- ----------------------------------------------------
-- Table: knex_migrations_lock
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.knex_migrations_lock (
  index                        INTEGER              DEFAULT nextval('knex_migrations_lock_index_seq'::regclass) NOT NULL,
  is_locked                    INTEGER             
);

-- ----------------------------------------------------
-- Table: maintenance_records
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  machine_id                   UUID                 NOT NULL,
  maintenance_type             VARCHAR(50)          NOT NULL,
  service_date                 DATE                 NOT NULL,
  meter_reading                NUMERIC(10, 2)       DEFAULT '0'::numeric,
  problem_description          TEXT                ,
  work_performed               TEXT                ,
  vendor_id                    UUID                ,
  technician                   VARCHAR(100)        ,
  parts_used                   TEXT                ,
  labor_cost                   NUMERIC(12, 2)       DEFAULT '0'::numeric,
  parts_cost                   NUMERIC(12, 2)       DEFAULT '0'::numeric,
  total_cost                   NUMERIC(12, 2)       DEFAULT '0'::numeric,
  next_service_date            DATE                ,
  next_service_meter           NUMERIC(10, 2)      ,
  status                       VARCHAR(30)          DEFAULT 'Completed'::character varying,
  remarks                      TEXT                ,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: material_consumption
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.material_consumption (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  material_id                  UUID                 NOT NULL,
  project_id                   UUID                ,
  site_id                      UUID                ,
  work_package_id              UUID                ,
  material_request_id          UUID                ,
  qty_consumed                 NUMERIC(12, 2)       NOT NULL,
  consumption_date             DATE                 NOT NULL,
  logged_by                    UUID                ,
  notes                        TEXT                ,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: material_requests
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.material_requests (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  mr_number                    VARCHAR(30)          NOT NULL,
  project_id                   UUID                ,
  site_id                      UUID                ,
  requested_by                 UUID                ,
  material_id                  UUID                 NOT NULL,
  qty_requested                NUMERIC(12, 2)       NOT NULL,
  date_needed                  DATE                ,
  purpose                      VARCHAR(300)        ,
  priority                     VARCHAR(20)          DEFAULT 'normal'::character varying,
  status                       VARCHAR(30)          DEFAULT 'pending'::character varying,
  approved_by                  UUID                ,
  approved_at                  TIMESTAMPTZ         ,
  approval_notes               TEXT                ,
  qty_issued                   NUMERIC(12, 2)      ,
  issued_at                    TIMESTAMPTZ         ,
  issued_by                    UUID                ,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: materials
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.materials (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  material_code                VARCHAR(50)          NOT NULL,
  name                         VARCHAR(200)         NOT NULL,
  unit_of_measure              VARCHAR(30)          NOT NULL,
  category                     VARCHAR(60)          NOT NULL,
  standard_rate                NUMERIC(12, 2)       DEFAULT '0'::numeric,
  description                  TEXT                ,
  reorder_level                NUMERIC(10, 2)       DEFAULT '0'::numeric,
  is_active                    BOOLEAN              DEFAULT true,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: notifications
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  title                        VARCHAR(150)         NOT NULL,
  message                      TEXT                 NOT NULL,
  type                         VARCHAR(50)          NOT NULL,
  is_read                      BOOLEAN              DEFAULT false,
  target_user_id               UUID                ,
  link                         VARCHAR(255)        ,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: operators
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.operators (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  employee_id                  VARCHAR(50)          NOT NULL,
  name                         VARCHAR(150)         NOT NULL,
  mobile                       VARCHAR(50)         ,
  license_number               VARCHAR(100)        ,
  license_type                 VARCHAR(100)        ,
  license_expiry               DATE                ,
  assigned_machine_id          UUID                ,
  status                       VARCHAR(30)          DEFAULT 'active'::character varying,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: otp_codes
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id                           INTEGER              DEFAULT nextval('otp_codes_id_seq'::regclass) NOT NULL,
  mobile_number                VARCHAR(255)         NOT NULL,
  code_hash                    VARCHAR(255)         NOT NULL,
  expires_at                   TIMESTAMPTZ          NOT NULL,
  is_used                      BOOLEAN              DEFAULT false,
  attempt_count                INTEGER              DEFAULT 0,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: payments_received
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments_received (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  invoice_id                   UUID                 NOT NULL,
  amount_received              NUMERIC(14, 2)       NOT NULL,
  payment_date                 DATE                 NOT NULL,
  payment_mode                 VARCHAR(50)         ,
  reference_no                 VARCHAR(100)        ,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: payroll_summaries
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payroll_summaries (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  user_id                      UUID                 NOT NULL,
  period_month                 VARCHAR(10)          NOT NULL,
  total_days_present           NUMERIC(5, 2)        DEFAULT '0'::numeric,
  total_ot_hours               NUMERIC(5, 2)        DEFAULT '0'::numeric,
  gross_pay                    NUMERIC(12, 2)       DEFAULT '0'::numeric,
  deductions                   NUMERIC(12, 2)       DEFAULT '0'::numeric,
  net_pay                      NUMERIC(12, 2)       DEFAULT '0'::numeric,
  generated_at                 TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------
-- Table: po_line_items
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.po_line_items (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  po_id                        UUID                 NOT NULL,
  material_id                  UUID                 NOT NULL,
  qty_ordered                  NUMERIC(10, 2)       NOT NULL,
  unit_price                   NUMERIC(10, 2)       NOT NULL,
  total                        NUMERIC(12, 2)       NOT NULL
);

-- ----------------------------------------------------
-- Table: pr_line_items
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pr_line_items (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  pr_id                        UUID                 NOT NULL,
  material_id                  UUID                 NOT NULL,
  qty_required                 NUMERIC(10, 2)       NOT NULL
);

-- ----------------------------------------------------
-- Table: projects
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  folder_no                    VARCHAR(20)         ,
  ak_job_no                    VARCHAR(30)         ,
  project_name                 TEXT                 NOT NULL,
  area_sqft                    NUMERIC(12, 2)      ,
  emirate                      VARCHAR(50)         ,
  supervisor_names             TEXT                ,
  supervisors_assigned         INTEGER              DEFAULT 0,
  supervisors_required         INTEGER              DEFAULT 0,
  technicians_required         INTEGER              DEFAULT 0,
  supervisors_available_march  INTEGER              DEFAULT 0,
  status                       VARCHAR(30)          DEFAULT 'pending'::character varying,
  has_stressing_machine        BOOLEAN              DEFAULT false,
  has_onion_machine            BOOLEAN              DEFAULT false,
  has_gun_machine              BOOLEAN              DEFAULT false,
  has_grouting_machine         BOOLEAN              DEFAULT false,
  notes                        TEXT                ,
  is_active                    BOOLEAN              DEFAULT true,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  site_id                      UUID                ,
  client_name                  VARCHAR(200)        ,
  start_date                   DATE                ,
  planned_end_date             DATE                ,
  actual_end_date              DATE                ,
  completion_pct               NUMERIC(5, 2)        DEFAULT '0'::numeric,
  priority                     VARCHAR(20)          DEFAULT 'medium'::character varying,
  client_id                    UUID                ,
  budget                       NUMERIC(15, 2)       DEFAULT '0'::numeric,
  currency                     VARCHAR(10)          DEFAULT 'AED'::character varying,
  location                     VARCHAR(255)        ,
  engineer                     VARCHAR(255)        ,
  lead_engineer                VARCHAR(255)        ,
  manager                      VARCHAR(255)        
);

-- ----------------------------------------------------
-- Table: purchase_orders
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  po_number                    VARCHAR(50)          NOT NULL,
  vendor_id                    UUID                 NOT NULL,
  pr_id                        UUID                ,
  raised_by                    UUID                 NOT NULL,
  approved_by                  UUID                ,
  status                       VARCHAR(20)          DEFAULT 'draft'::character varying,
  po_date                      DATE                 NOT NULL,
  total_amount                 NUMERIC(12, 2)       DEFAULT '0'::numeric,
  delivery_site_id             UUID                ,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: purchase_requests
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.purchase_requests (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  pr_number                    VARCHAR(50)          NOT NULL,
  project_id                   UUID                ,
  site_id                      UUID                ,
  requested_by                 UUID                 NOT NULL,
  status                       VARCHAR(20)          DEFAULT 'pending'::character varying,
  priority                     VARCHAR(20)          DEFAULT 'medium'::character varying,
  approved_by                  UUID                ,
  date_needed                  DATE                 NOT NULL,
  remarks                      TEXT                ,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: roles
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
  id                           INTEGER              DEFAULT nextval('roles_id_seq'::regclass) NOT NULL,
  name                         VARCHAR(255)         NOT NULL,
  description                  VARCHAR(255)        ,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: site_assignments
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_assignments (
  id                           INTEGER              DEFAULT nextval('site_assignments_id_seq'::regclass) NOT NULL,
  user_id                      UUID                 NOT NULL,
  site_id                      UUID                 NOT NULL,
  assigned_from                DATE                 NOT NULL,
  assigned_to                  DATE                ,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: site_material_stock
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_material_stock (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  material_id                  UUID                 NOT NULL,
  site_id                      UUID                ,
  project_id                   UUID                ,
  opening_qty                  NUMERIC(12, 2)       DEFAULT '0'::numeric,
  received_qty                 NUMERIC(12, 2)       DEFAULT '0'::numeric,
  issued_qty                   NUMERIC(12, 2)       DEFAULT '0'::numeric,
  returned_qty                 NUMERIC(12, 2)       DEFAULT '0'::numeric,
  balance_qty                  NUMERIC(12, 2)       DEFAULT '0'::numeric,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: sites
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sites (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  name                         VARCHAR(255)         NOT NULL,
  code                         VARCHAR(255)         NOT NULL,
  emirate                      VARCHAR(255)         NOT NULL,
  address                      TEXT                ,
  latitude                     NUMERIC(10, 8)       DEFAULT 0,
  longitude                    NUMERIC(11, 8)       DEFAULT 0,
  geofence_radius_meters       INTEGER              DEFAULT 300 NOT NULL,
  supervisor_id                UUID                ,
  is_active                    BOOLEAN              DEFAULT true,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  engineer                     VARCHAR(255)        ,
  manager                      VARCHAR(255)        ,
  location                     VARCHAR(255)         DEFAULT 'Dubai'::character varying,
  budget                       NUMERIC(15, 2)       DEFAULT 0,
  currency                     VARCHAR(10)          DEFAULT 'AED'::character varying,
  start_date                   DATE                ,
  expected_completion          DATE                ,
  planned_end_date             DATE                ,
  completion_pct               NUMERIC(5, 2)        DEFAULT 0
);

-- ----------------------------------------------------
-- Table: stock_transactions
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stock_transactions (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  equipment_item_id            UUID                 NOT NULL,
  from_site_id                 UUID                ,
  to_site_id                   UUID                ,
  transaction_type             VARCHAR(255)         NOT NULL,
  quantity                     NUMERIC(8, 2)        NOT NULL,
  handled_by                   UUID                 NOT NULL,
  issued_to_user_id            UUID                ,
  remarks                      TEXT                ,
  transaction_date             TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: store_brands
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_brands (
  id                           INTEGER              DEFAULT nextval('store_brands_id_seq'::regclass) NOT NULL,
  name                         VARCHAR(255)         NOT NULL,
  short_name                   VARCHAR(255)         NOT NULL,
  status                       TEXT                 DEFAULT 'Active'::text,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: store_categories
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_categories (
  id                           INTEGER              DEFAULT nextval('store_categories_id_seq'::regclass) NOT NULL,
  name                         VARCHAR(255)         NOT NULL,
  short_name                   VARCHAR(255)         NOT NULL,
  status                       TEXT                 DEFAULT 'Active'::text,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: store_materials
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_materials (
  id                           INTEGER              DEFAULT nextval('store_materials_id_seq'::regclass) NOT NULL,
  category_id                  INTEGER             ,
  brand_id                     INTEGER             ,
  name                         VARCHAR(255)         NOT NULL,
  quantity                     NUMERIC(14, 2)       DEFAULT '0'::numeric,
  unit                         VARCHAR(255)         DEFAULT 'pcs'::character varying,
  min_quantity                 NUMERIC(14, 2)       DEFAULT '0'::numeric,
  allow_exceed_qty             BOOLEAN              DEFAULT true,
  status                       TEXT                 DEFAULT 'Active'::text,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: store_po_items
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_po_items (
  id                           INTEGER              DEFAULT nextval('store_po_items_id_seq'::regclass) NOT NULL,
  po_id                        INTEGER             ,
  material_id                  INTEGER             ,
  quantity                     NUMERIC(14, 2)       NOT NULL,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: store_purchase_orders
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_purchase_orders (
  id                           INTEGER              DEFAULT nextval('store_purchase_orders_id_seq'::regclass) NOT NULL,
  po_number                    VARCHAR(255)         NOT NULL,
  supplier_name                VARCHAR(255)         NOT NULL,
  po_date                      DATE                 NOT NULL,
  mtc_file_url                 VARCHAR(255)        ,
  status                       TEXT                 DEFAULT 'Pending'::text,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: store_purchase_returns
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_purchase_returns (
  id                           INTEGER              DEFAULT nextval('store_purchase_returns_id_seq'::regclass) NOT NULL,
  project_id                   INTEGER             ,
  return_number                VARCHAR(255)         NOT NULL,
  return_date                  DATE                 NOT NULL,
  reason                       VARCHAR(255)        ,
  status                       TEXT                 DEFAULT 'Pending'::text,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: store_return_items
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.store_return_items (
  id                           INTEGER              DEFAULT nextval('store_return_items_id_seq'::regclass) NOT NULL,
  return_id                    INTEGER             ,
  material_id                  INTEGER             ,
  quantity                     NUMERIC(14, 2)       NOT NULL,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: users
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  full_name                    VARCHAR(255)         NOT NULL,
  email                        VARCHAR(255)        ,
  mobile_number                VARCHAR(255)        ,
  password_hash                VARCHAR(255)        ,
  google_id                    VARCHAR(255)        ,
  role_id                      INTEGER             ,
  is_active                    BOOLEAN              DEFAULT true,
  mobile_verified              BOOLEAN              DEFAULT false,
  email_verified               BOOLEAN              DEFAULT false,
  preferred_language           VARCHAR(2)           DEFAULT 'en'::character varying,
  avatar_url                   TEXT                ,
  last_login_at                TIMESTAMPTZ         ,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- ----------------------------------------------------
-- Table: vendors
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vendors (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  vendor_name                  VARCHAR(150)         NOT NULL,
  vendor_type                  VARCHAR(50)          NOT NULL,
  contact_person               VARCHAR(100)        ,
  mobile                       VARCHAR(50)         ,
  email                        VARCHAR(100)        ,
  address                      TEXT                ,
  equipment_service            VARCHAR(200)        ,
  status                       VARCHAR(30)          DEFAULT 'active'::character varying,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  trn_number                   VARCHAR(50)         ,
  bank_name                    VARCHAR(100)        ,
  bank_account                 VARCHAR(100)        ,
  credit_days                  INTEGER              DEFAULT 30,
  vendor_category              VARCHAR(50)          DEFAULT 'equipment'::character varying,
  is_active                    BOOLEAN              DEFAULT true
);

-- ----------------------------------------------------
-- Table: work_packages
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.work_packages (
  id                           UUID                 DEFAULT uuid_generate_v4() NOT NULL,
  project_id                   UUID                 NOT NULL,
  site_id                      UUID                ,
  title                        VARCHAR(200)         NOT NULL,
  description                  TEXT                ,
  status                       VARCHAR(30)          DEFAULT 'not_started'::character varying,
  priority                     VARCHAR(20)          DEFAULT 'medium'::character varying,
  assigned_to                  UUID                ,
  planned_start                DATE                ,
  planned_end                  DATE                ,
  actual_start                 DATE                ,
  actual_end                   DATE                ,
  completion_pct               NUMERIC(5, 2)        DEFAULT '0'::numeric,
  blocked_reason               TEXT                ,
  created_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at                   TIMESTAMPTZ          DEFAULT CURRENT_TIMESTAMP NOT NULL
);

