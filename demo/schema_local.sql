--
-- PostgreSQL database dump
--

\restrict WjpXKehG0iTU5N1S6Kevq6GP92xX3qhgN8fsgXKvTdJHCta0gpS4eywFmNWhlAk

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.12

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    action_type text NOT NULL,
    target_record_id integer,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: activity_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: activity_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;


--
-- Name: area; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.area (
    id integer NOT NULL,
    name text NOT NULL,
    capacity integer
);


--
-- Name: area_checklists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.area_checklists (
    id integer NOT NULL,
    record_id integer NOT NULL,
    area_id integer NOT NULL,
    is_checked boolean DEFAULT false NOT NULL,
    quantity smallint
);


--
-- Name: area_checklists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.area_checklists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: area_checklists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.area_checklists_id_seq OWNED BY public.area_checklists.id;


--
-- Name: area_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.area_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: area_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.area_id_seq OWNED BY public.area.id;


--
-- Name: bus_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bus_types (
    id integer NOT NULL,
    name text NOT NULL
);


--
-- Name: bus_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bus_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bus_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bus_types_id_seq OWNED BY public.bus_types.id;


--
-- Name: kpis__snapshot; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.kpis__snapshot (
    id integer NOT NULL,
    captured_at timestamp with time zone DEFAULT now() NOT NULL,
    total_buses integer,
    buses_needing_workshop integer,
    released_buses integer,
    serviced_buses integer,
    buses_in_bays integer,
    foreign_buses integer,
    buses_needing_wash integer,
    priority_units_completed integer,
    mechanics_count numeric(6,2),
    total_bay_capacity numeric(6,2),
    pct_needing_workshop numeric(6,4),
    pct_released numeric(6,4),
    workload_per_mechanic numeric(6,4),
    bay_utilization numeric(6,4),
    foreign_bus_flow numeric(6,4),
    pct_needing_wash numeric(6,4),
    priority_compliance numeric(6,4)
);


--
-- Name: kpis__snapshot_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.kpis__snapshot_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: kpis__snapshot_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.kpis__snapshot_id_seq OWNED BY public.kpis__snapshot.id;


--
-- Name: movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movements (
    id integer NOT NULL,
    record_id integer NOT NULL,
    area_id integer NOT NULL,
    serial_number integer NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    entry_time time without time zone,
    exit_time timestamp with time zone,
    is_completed boolean DEFAULT false NOT NULL,
    duration_days numeric(8,4),
    sheets_row integer,
    is_dirty boolean DEFAULT false NOT NULL,
    last_modified_by text DEFAULT 'sheets'::text NOT NULL,
    last_modified_at timestamp with time zone DEFAULT now() NOT NULL,
    sheets_synced_at timestamp with time zone
);


--
-- Name: movements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.movements_id_seq OWNED BY public.movements.id;


--
-- Name: nfc_tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.nfc_tags (
    id integer NOT NULL,
    tag_uid text NOT NULL,
    serial_number integer NOT NULL,
    assigned_at timestamp with time zone DEFAULT now(),
    assigned_by text
);


--
-- Name: nfc_tags_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.nfc_tags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: nfc_tags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.nfc_tags_id_seq OWNED BY public.nfc_tags.id;


--
-- Name: records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.records (
    id integer NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    serial_number integer NOT NULL,
    type_id integer,
    shift smallint,
    is_active boolean DEFAULT true NOT NULL,
    registration_time timestamp with time zone,
    location_text text,
    time_remaining numeric(6,2),
    progress numeric(5,2),
    sheets_row integer,
    is_dirty boolean DEFAULT false NOT NULL,
    last_modified_by text DEFAULT 'sheets'::text NOT NULL,
    last_modified_at timestamp with time zone DEFAULT now() NOT NULL,
    sheets_synced_at timestamp with time zone
);


--
-- Name: records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.records_id_seq OWNED BY public.records.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name text NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: shift_closures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shift_closures (
    id integer NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    shift smallint NOT NULL,
    closed_by integer,
    records_snapshot jsonb,
    movements_snapshot jsonb,
    archived_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: shift_closures_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.shift_closures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: shift_closures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.shift_closures_id_seq OWNED BY public.shift_closures.id;


--
-- Name: sync_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sync_logs (
    id integer NOT NULL,
    sheet text NOT NULL,
    direction text NOT NULL,
    errors jsonb,
    started_at timestamp with time zone NOT NULL,
    finished_at timestamp with time zone NOT NULL,
    success boolean NOT NULL
);


--
-- Name: sync_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sync_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sync_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sync_logs_id_seq OWNED BY public.sync_logs.id;


--
-- Name: times; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.times (
    id integer NOT NULL,
    serial_number integer NOT NULL,
    entry_time time without time zone,
    is_completed boolean DEFAULT false,
    exit_time_num numeric(15,6),
    entry_time_num numeric(15,6),
    duration_days numeric(8,4),
    is_dirty boolean DEFAULT false NOT NULL,
    last_modified_by text DEFAULT 'sheets'::text NOT NULL,
    last_modified_at timestamp with time zone DEFAULT now() NOT NULL,
    sheets_synced_at timestamp with time zone,
    sheets_row integer
);


--
-- Name: times_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.times_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: times_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.times_id_seq OWNED BY public.times.id;


--
-- Name: trips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trips (
    id integer NOT NULL,
    date date DEFAULT CURRENT_DATE NOT NULL,
    serial_number integer NOT NULL,
    type_id integer,
    scheduled_time time without time zone,
    departure_time time without time zone,
    needs_reception smallint DEFAULT 0,
    needs_drainage smallint DEFAULT 0,
    needs_diesel smallint DEFAULT 0,
    needs_adblue smallint DEFAULT 0,
    needs_ext_wash smallint DEFAULT 0,
    needs_int_wash smallint DEFAULT 0,
    needs_workshop smallint DEFAULT 0,
    sheets_row integer,
    is_dirty boolean DEFAULT false NOT NULL,
    last_modified_by text DEFAULT 'sheets'::text NOT NULL,
    last_modified_at timestamp with time zone DEFAULT now() NOT NULL,
    sheets_synced_at timestamp with time zone,
    driver_name text,
    origin_terminal text,
    destination_terminal text,
    notes text
);


--
-- Name: trips_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trips_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trips_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trips_id_seq OWNED BY public.trips.id;


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_sessions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    login_time timestamp with time zone DEFAULT now() NOT NULL,
    logout_time timestamp with time zone,
    is_on_time boolean
);


--
-- Name: user_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_sessions_id_seq OWNED BY public.user_sessions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    role_id integer NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    shift_start_time time without time zone,
    shift_end_time time without time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    assigned_area_id integer
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: workshop_details; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workshop_details (
    id integer NOT NULL,
    movement_id integer NOT NULL,
    tires boolean DEFAULT false,
    preventive_maintenance boolean DEFAULT false,
    alignment_pit boolean DEFAULT false,
    air_conditioning boolean DEFAULT false,
    engine boolean DEFAULT false,
    electrical boolean DEFAULT false,
    vans boolean DEFAULT false,
    upholstery boolean DEFAULT false,
    bodywork_peripherals boolean DEFAULT false,
    paint_peripherals boolean DEFAULT false,
    paint_pinflo boolean DEFAULT false,
    bodywork_pinflo boolean DEFAULT false,
    progress_percentage numeric(5,2),
    transmission_and_brakes boolean DEFAULT false
);


--
-- Name: workshop_details_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.workshop_details_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: workshop_details_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.workshop_details_id_seq OWNED BY public.workshop_details.id;


--
-- Name: activity_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);


--
-- Name: area id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.area ALTER COLUMN id SET DEFAULT nextval('public.area_id_seq'::regclass);


--
-- Name: area_checklists id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.area_checklists ALTER COLUMN id SET DEFAULT nextval('public.area_checklists_id_seq'::regclass);


--
-- Name: bus_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bus_types ALTER COLUMN id SET DEFAULT nextval('public.bus_types_id_seq'::regclass);


--
-- Name: kpis__snapshot id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpis__snapshot ALTER COLUMN id SET DEFAULT nextval('public.kpis__snapshot_id_seq'::regclass);


--
-- Name: movements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movements ALTER COLUMN id SET DEFAULT nextval('public.movements_id_seq'::regclass);


--
-- Name: nfc_tags id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfc_tags ALTER COLUMN id SET DEFAULT nextval('public.nfc_tags_id_seq'::regclass);


--
-- Name: records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.records ALTER COLUMN id SET DEFAULT nextval('public.records_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: shift_closures id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_closures ALTER COLUMN id SET DEFAULT nextval('public.shift_closures_id_seq'::regclass);


--
-- Name: sync_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_logs ALTER COLUMN id SET DEFAULT nextval('public.sync_logs_id_seq'::regclass);


--
-- Name: times id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.times ALTER COLUMN id SET DEFAULT nextval('public.times_id_seq'::regclass);


--
-- Name: trips id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips ALTER COLUMN id SET DEFAULT nextval('public.trips_id_seq'::regclass);


--
-- Name: user_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: workshop_details id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshop_details ALTER COLUMN id SET DEFAULT nextval('public.workshop_details_id_seq'::regclass);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: area_checklists area_checklists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.area_checklists
    ADD CONSTRAINT area_checklists_pkey PRIMARY KEY (id);


--
-- Name: area_checklists area_checklists_record_id_area_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.area_checklists
    ADD CONSTRAINT area_checklists_record_id_area_id_key UNIQUE (record_id, area_id);


--
-- Name: area area_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.area
    ADD CONSTRAINT area_name_key UNIQUE (name);


--
-- Name: area area_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.area
    ADD CONSTRAINT area_name_unique UNIQUE (name);


--
-- Name: area area_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.area
    ADD CONSTRAINT area_pkey PRIMARY KEY (id);


--
-- Name: bus_types bus_types_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bus_types
    ADD CONSTRAINT bus_types_name_key UNIQUE (name);


--
-- Name: bus_types bus_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bus_types
    ADD CONSTRAINT bus_types_pkey PRIMARY KEY (id);


--
-- Name: kpis__snapshot kpis__snapshot_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.kpis__snapshot
    ADD CONSTRAINT kpis__snapshot_pkey PRIMARY KEY (id);


--
-- Name: movements movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movements
    ADD CONSTRAINT movements_pkey PRIMARY KEY (id);


--
-- Name: nfc_tags nfc_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfc_tags
    ADD CONSTRAINT nfc_tags_pkey PRIMARY KEY (id);


--
-- Name: nfc_tags nfc_tags_tag_uid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.nfc_tags
    ADD CONSTRAINT nfc_tags_tag_uid_key UNIQUE (tag_uid);


--
-- Name: records records_date_serial_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.records
    ADD CONSTRAINT records_date_serial_number_key UNIQUE (date, serial_number);


--
-- Name: records records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.records
    ADD CONSTRAINT records_pkey PRIMARY KEY (id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: shift_closures shift_closures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shift_closures
    ADD CONSTRAINT shift_closures_pkey PRIMARY KEY (id);


--
-- Name: sync_logs sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sync_logs
    ADD CONSTRAINT sync_logs_pkey PRIMARY KEY (id);


--
-- Name: times times_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.times
    ADD CONSTRAINT times_pkey PRIMARY KEY (id);


--
-- Name: times times_serial_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.times
    ADD CONSTRAINT times_serial_number_key UNIQUE (serial_number);


--
-- Name: trips trips_date_serial_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_date_serial_number_key UNIQUE (date, serial_number);


--
-- Name: trips trips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: workshop_details workshop_details_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshop_details
    ADD CONSTRAINT workshop_details_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: area_checklists area_checklists_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.area_checklists
    ADD CONSTRAINT area_checklists_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.area(id);


--
-- Name: area_checklists area_checklists_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.area_checklists
    ADD CONSTRAINT area_checklists_record_id_fkey FOREIGN KEY (record_id) REFERENCES public.records(id) ON DELETE CASCADE;


--
-- Name: movements movements_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movements
    ADD CONSTRAINT movements_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.area(id);


--
-- Name: movements movements_record_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movements
    ADD CONSTRAINT movements_record_id_fkey FOREIGN KEY (record_id) REFERENCES public.records(id);


--
-- Name: records records_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.records
    ADD CONSTRAINT records_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.bus_types(id);


--
-- Name: trips trips_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.bus_types(id);


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: users users_assigned_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_assigned_area_id_fkey FOREIGN KEY (assigned_area_id) REFERENCES public.area(id);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: workshop_details workshop_details_movement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workshop_details
    ADD CONSTRAINT workshop_details_movement_id_fkey FOREIGN KEY (movement_id) REFERENCES public.movements(id) ON DELETE CASCADE;


--
-- Name: activity_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: area; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.area ENABLE ROW LEVEL SECURITY;

--
-- Name: area_checklists; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.area_checklists ENABLE ROW LEVEL SECURITY;

--
-- Name: bus_types; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bus_types ENABLE ROW LEVEL SECURITY;

--
-- Name: kpis__snapshot; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.kpis__snapshot ENABLE ROW LEVEL SECURITY;

--
-- Name: movements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

--
-- Name: nfc_tags; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.nfc_tags ENABLE ROW LEVEL SECURITY;

--
-- Name: records; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;

--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: shift_closures; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.shift_closures ENABLE ROW LEVEL SECURITY;

--
-- Name: sync_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: times; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.times ENABLE ROW LEVEL SECURITY;

--
-- Name: trips; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

--
-- Name: user_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: workshop_details; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.workshop_details ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict WjpXKehG0iTU5N1S6Kevq6GP92xX3qhgN8fsgXKvTdJHCta0gpS4eywFmNWhlAk

