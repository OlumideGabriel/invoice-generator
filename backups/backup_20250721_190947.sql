--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5 (Homebrew)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255),
    address text,
    phone character varying(50),
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid,
    data json NOT NULL,
    issued_date date,
    due_date date,
    status character varying(50),
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    email character varying(255) NOT NULL,
    first_name character varying(255),
    last_name character varying(255),
    password_hash character varying(255),
    google_id character varying(255),
    is_guest boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alembic_version (version_num) FROM stdin;
ab574750c14b
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (id, user_id, name, email, address, phone, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, user_id, client_id, data, issued_date, due_date, status, created_at, updated_at) FROM stdin;
2375c538-448f-48dc-9bd6-bd0628f29989	6d6a5910-7621-406f-8f2e-b9099846328c	\N	{"invoice": {"invoice_number": "INV-2024-001", "invoice_date": "2024-07-19", "due_date": "2024-08-18", "status": "pending", "currency": "USD", "tax_rate": 8.5, "notes": "Payment due within 30 days. Late payments subject to 1.5% monthly service charge.", "terms": "Net 30"}, "company": {"name": "Tech Solutions Inc.", "address": {"street": "123 Business Ave", "city": "San Francisco", "state": "CA", "zip_code": "94105", "country": "United States"}, "contact": {"email": "billing@techsolutions.com", "phone": "+1 (555) 123-4567", "website": "www.techsolutions.com"}, "tax_id": "12-3456789"}, "client": {"name": "Acme Corporation", "contact_person": "John Smith", "address": {"street": "456 Corporate Blvd", "city": "New York", "state": "NY", "zip_code": "10001", "country": "United States"}, "contact": {"email": "john.smith@acmecorp.com", "phone": "+1 (555) 987-6543"}}, "items": [{"description": "Website Development - Frontend", "quantity": 40, "unit": "hours", "unit_price": 85.0, "total": 3400.0}, {"description": "Database Design and Implementation", "quantity": 20, "unit": "hours", "unit_price": 95.0, "total": 1900.0}], "totals": {"subtotal": 5300.0, "tax_amount": 450.5, "total": 5750.5}}	\N	\N	draft	2025-07-19 01:14:36.715384	2025-07-19 01:14:36.71539
941e2d43-cabe-4c13-84f6-7cce97efa64f	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Olumide", "to": "YJ", "items": [{"id": "mdbmn2k9c4pbyjzk60p", "name": "Web Design", "description": "", "quantity": 1, "unit_cost": 500, "showDesc": false}, {"id": "mdbmomomg4pwcar5ulu", "name": "Logo Creation", "description": "", "quantity": 1, "unit_cost": 50, "showDesc": false}], "invoice_number": "000345", "issued_date": "2025-07-20", "due_date": "2025-07-27", "payment_details": "2048637567\\nUBA", "terms": "70% upon completion", "tax_percent": 200, "discount_percent": 0, "shipping_amount": 5, "tax_type": "fixed", "discount_type": "percent", "show_tax": true, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/Kamara-Favicon.jpg"}	2025-07-20	2025-07-27	draft	2025-07-20 12:07:44.552504	2025-07-20 12:07:44.552509
b9d1f050-4d68-4924-a2a3-df58522a25fd	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Olumide", "to": "YJ", "items": [{"id": "mdbmn2k9c4pbyjzk60p", "name": "Web Design", "description": "", "quantity": 1, "unit_cost": 500, "showDesc": false}, {"id": "mdbmomomg4pwcar5ulu", "name": "Logo Creation", "description": "", "quantity": 1, "unit_cost": 50, "showDesc": false}], "invoice_number": "000345", "issued_date": "2025-07-20", "due_date": "2025-07-27", "payment_details": "2048637567\\nUBA", "terms": "70% upon completion", "tax_percent": 200, "discount_percent": 0, "shipping_amount": 5, "tax_type": "fixed", "discount_type": "percent", "show_tax": true, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/Kamara-Favicon.jpg"}	2025-07-20	2025-07-27	draft	2025-07-20 12:09:05.292544	2025-07-20 12:09:05.292548
8a905acf-ed38-4790-9229-390c819e7ce2	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Olumide", "to": "Gabriel", "items": [{"id": "mdbzi6sft8zbrglsrll", "name": "Web Development", "description": "", "quantity": 1, "unit_cost": 500, "showDesc": false}, {"id": "mdbzvfr3ivuavbwdnj", "name": "Logo Design", "description": "", "quantity": 1, "unit_cost": 1000, "showDesc": false}], "invoice_number": "000123", "issued_date": "2025-07-09", "due_date": "2025-07-23", "payment_details": "2048465423\\nUBA\\nOlumide Ogunseye", "terms": "70% deposit before project starts, and 30% after completion. ", "tax_percent": 7.5, "discount_percent": 0, "shipping_amount": 10, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/Kamara Logo@300x.png"}	2025-07-09	2025-07-23	draft	2025-07-20 18:13:18.473898	2025-07-20 18:13:18.473902
fb5fad82-da7d-44a3-bf0e-c6a82e6f2dad	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Logocart Designs", "to": "Blueage Marketing", "items": [{"id": "mdd2kgws0bhpwodw30h9", "name": "Website Revamp", "description": "", "quantity": 1, "unit_cost": 50000, "showDesc": false}, {"id": "mdd3yqxbxg6bnfshgle", "name": "SSL and Hosting Services", "description": "", "quantity": 1, "unit_cost": 120000, "showDesc": false}], "invoice_number": "000124", "issued_date": "2025-07-09", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA\\n", "terms": "70% Initial deposit before project starts, and 30% upon completion", "tax_percent": 10, "discount_percent": 0, "shipping_amount": 5000, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/logocart new logo3.png"}	2025-07-09	2025-07-28	draft	2025-07-21 13:02:17.700399	2025-07-21 13:02:17.700404
262c0138-c938-40c3-9401-ce22c15499ee	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Logocart Designs", "to": "Blueage Marketing", "items": [{"id": "mdd2kgws0bhpwodw30h9", "name": "Website Revamp", "description": "", "quantity": 1, "unit_cost": 50000, "showDesc": false}, {"id": "mdd3yqxbxg6bnfshgle", "name": "SSL and Hosting Services", "description": "", "quantity": 1, "unit_cost": 120000, "showDesc": false}], "invoice_number": "000124", "issued_date": "2025-07-09", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA\\n", "terms": "70% Initial deposit before project starts, and 30% upon completion", "tax_percent": 10, "discount_percent": 0, "shipping_amount": 5000, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/logocart new logo3.png"}	2025-07-09	2025-07-28	draft	2025-07-21 13:03:03.719528	2025-07-21 13:03:03.719538
044ae745-9e98-4fa1-b3a2-b71db5f5f17f	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Logocart Designs", "to": "Blueage Marketing", "items": [{"id": "mdd2kgws0bhpwodw30h9", "name": "Website Revamp", "description": "", "quantity": 1, "unit_cost": 50000, "showDesc": false}, {"id": "mdd3yqxbxg6bnfshgle", "name": "SSL and Hosting Services", "description": "", "quantity": 1, "unit_cost": 120000, "showDesc": false}], "invoice_number": "000124", "issued_date": "2025-07-09", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA\\n", "terms": "70% Initial deposit before project starts, and 30% upon completion", "tax_percent": 10, "discount_percent": 0, "shipping_amount": 5000, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/logocart new logo3.png"}	2025-07-09	2025-07-28	draft	2025-07-21 13:04:36.935632	2025-07-21 13:04:36.935636
7b2d811f-d388-46ce-8346-cc9dff0fccf7	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Logocart Designs", "to": "Blueage Marketing", "items": [{"id": "mdd2kgws0bhpwodw30h9", "name": "Website Revamp", "description": "", "quantity": 1, "unit_cost": 50000, "showDesc": false}, {"id": "mdd3yqxbxg6bnfshgle", "name": "SSL and Hosting Services", "description": "", "quantity": 1, "unit_cost": 120000, "showDesc": false}], "invoice_number": "000124", "issued_date": "2025-07-09", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA\\n", "terms": "70% Initial deposit before project starts, and 30% upon completion", "tax_percent": 10, "discount_percent": 0, "shipping_amount": 5000, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/logocart new logo3.png"}	2025-07-09	2025-07-28	draft	2025-07-21 13:05:42.101258	2025-07-21 13:05:42.101262
15b92537-5386-4b10-ac0e-70cab2ec4a30	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "hjhj", "to": "knmnk", "items": [{"id": "mddc2qrpmdfr4jxfq9n", "name": "nnmnnn", "description": "", "quantity": 1, "unit_cost": 0, "showDesc": false}], "invoice_number": "000789", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "hhjh", "terms": "jnjnjn", "tax_percent": 0, "discount_percent": 0, "shipping_amount": 70, "tax_type": "percent", "discount_type": "percent", "show_tax": false, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/illumina.png"}	2025-07-21	2025-07-28	draft	2025-07-21 17:09:59.558633	2025-07-21 17:09:59.55864
ab4d65d0-0b8d-4838-8f4f-4b321a125cb6	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Logocart Designs", "to": "Onenet Servers", "items": [{"id": "mdd2kgws0bhpwodw30h9", "name": "Website Revamp", "description": "", "quantity": 1, "unit_cost": 50000, "showDesc": false}, {"id": "mdd3yqxbxg6bnfshgle", "name": "SSL and Hosting Services", "description": "", "quantity": 1, "unit_cost": 120000, "showDesc": false}], "invoice_number": "000128", "issued_date": "2025-07-09", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA\\n", "terms": "70% Initial deposit before project starts, and 30% upon completion", "tax_percent": 10, "discount_percent": 0, "shipping_amount": 5000, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/logocart new logo3.png"}	2025-07-09	2025-07-28	draft	2025-07-21 13:23:48.910453	2025-07-21 13:23:48.910469
e539e93c-cba5-46e8-ba60-3ae4033fb1ef	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Logocart Designs", "to": "Onenet Servers", "items": [{"id": "mdd2kgws0bhpwodw30h9", "name": "Website Revamp", "description": "", "quantity": 1, "unit_cost": 50000, "showDesc": false}, {"id": "mdd3yqxbxg6bnfshgle", "name": "SSL and Hosting Services", "description": "", "quantity": 1, "unit_cost": 120000, "showDesc": false}], "invoice_number": "000129", "issued_date": "2025-07-09", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA\\n", "terms": "70% Initial deposit before project starts, and 30% upon completion", "tax_percent": 10, "discount_percent": 0, "shipping_amount": 5000, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/logocart new logo3.png"}	2025-07-09	2025-07-28	draft	2025-07-21 13:58:55.436548	2025-07-21 13:58:55.436562
e374c93d-166d-449e-a56b-0abe1336977f	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Logocart Designs", "to": "Onenet Servers", "items": [{"id": "mdd2kgws0bhpwodw30h9", "name": "Website Revamp", "description": "", "quantity": 1, "unit_cost": 50000, "showDesc": false}, {"id": "mdd3yqxbxg6bnfshgle", "name": "SSL and Hosting Services", "description": "", "quantity": 1, "unit_cost": 120000, "showDesc": false}], "invoice_number": "000130", "issued_date": "2025-07-09", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA\\n", "terms": "70% Initial deposit before project starts, and 30% upon completion", "tax_percent": 10, "discount_percent": 0, "shipping_amount": 5000, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/logocart new logo3.png"}	2025-07-09	2025-07-28	draft	2025-07-21 14:20:12.594265	2025-07-21 14:20:12.59428
9ae22413-2ab9-4a5c-aa89-f06fc9eccfb3	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Logocart Designs", "to": "Onenet Servers", "items": [{"id": "mdd2kgws0bhpwodw30h9", "name": "Website Revamp", "description": "", "quantity": 1, "unit_cost": 50000, "showDesc": false}, {"id": "mdd3yqxbxg6bnfshgle", "name": "SSL and Hosting Services", "description": "", "quantity": 1, "unit_cost": 120000, "showDesc": false}], "invoice_number": "000131", "issued_date": "2025-07-09", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA\\n", "terms": "70% Initial deposit before project starts, and 30% upon completion", "tax_percent": 10, "discount_percent": 0, "shipping_amount": 5000, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/logocart new logo3.png"}	2025-07-09	2025-07-28	draft	2025-07-21 14:21:55.144239	2025-07-21 14:21:55.144244
dcca5d53-20ac-4468-a35b-4dc112ba55b2	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Logocart Designs", "to": "Onenet Servers", "items": [{"id": "mdd2kgws0bhpwodw30h9", "name": "Website Revamp", "description": "Some more info for clarification", "quantity": 1, "unit_cost": 50000, "showDesc": false}, {"id": "mdd3yqxbxg6bnfshgle", "name": "SSL and Hosting Services", "description": "", "quantity": 1, "unit_cost": 120000, "showDesc": false}], "invoice_number": "000133", "issued_date": "2025-07-09", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA\\n", "terms": "70% Initial deposit before project starts, and 30% upon completion", "tax_percent": 10, "discount_percent": 0, "shipping_amount": 5000, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/logocart new logo3.png"}	2025-07-09	2025-07-28	draft	2025-07-21 14:28:04.475529	2025-07-21 14:28:04.475546
ee25339f-bc23-4290-bf1e-199ddfaab15d	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Logocart Designs", "to": "Onenet Servers", "items": [{"id": "mdd2kgws0bhpwodw30h9", "name": "Website Revamp", "description": "Some more info for clarification", "quantity": 1, "unit_cost": 50000, "showDesc": false}, {"id": "mdd3yqxbxg6bnfshgle", "name": "SSL and Hosting Services", "description": "", "quantity": 1, "unit_cost": 120000, "showDesc": false}], "invoice_number": "000134", "issued_date": "2025-07-09", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA\\n", "terms": "70% Initial deposit before project starts, and 30% upon completion", "tax_percent": 10, "discount_percent": 0, "shipping_amount": 5000, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/logocart new logo3.png"}	2025-07-09	2025-07-28	draft	2025-07-21 14:30:11.531624	2025-07-21 14:30:11.531635
5d0cff63-79ee-4754-9ead-19e518999f8c	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Logocart Designs", "to": "Onenet Servers", "items": [{"id": "mdd2kgws0bhpwodw30h9", "name": "Website Revamp", "description": "Some more info for clarification", "quantity": 1, "unit_cost": 50000, "showDesc": false}, {"id": "mdd3yqxbxg6bnfshgle", "name": "SSL and Hosting Services", "description": "", "quantity": 1, "unit_cost": 120000, "showDesc": false}], "invoice_number": "000135", "issued_date": "2025-07-09", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA\\n", "terms": "70% Initial deposit before project starts, and 30% upon completion", "tax_percent": 10, "discount_percent": 0, "shipping_amount": 5000, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/logocart new logo3.png"}	2025-07-09	2025-07-28	draft	2025-07-21 14:39:40.590587	2025-07-21 14:39:40.590599
ff83b781-7291-4894-8d5e-6b2b71fb9592	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Logocart Designs", "to": "Onenet Servers", "items": [{"id": "mdd2kgws0bhpwodw30h9", "name": "Website Revamp", "description": "Some more info for clarification", "quantity": 1, "unit_cost": 50000, "showDesc": false}, {"id": "mdd3yqxbxg6bnfshgle", "name": "SSL and Hosting Services", "description": "", "quantity": 1, "unit_cost": 120000, "showDesc": false}], "invoice_number": "000136", "issued_date": "2025-07-09", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA\\n", "terms": "70% Initial deposit before project starts, and 30% upon completion", "tax_percent": 10, "discount_percent": 0, "shipping_amount": 5000, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/logocart new logo3.png"}	2025-07-09	2025-07-28	draft	2025-07-21 14:41:54.376361	2025-07-21 14:41:54.376375
4e460e07-d8a8-4bee-ae14-37dba207ec1e	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Google Inc", "to": "Logocart", "items": [{"id": "mdd9dziulhf51umjf7", "name": "Pavement renewal", "description": "Breaking and reconstructing of the already revamped pavement", "quantity": 1, "unit_cost": 500, "showDesc": false}, {"id": "mdd9jb3awi36vsii8e", "name": "Website Renewal", "description": "", "quantity": 1, "unit_cost": 50, "showDesc": false}], "invoice_number": "000367", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA", "terms": "70% ", "tax_percent": 10, "discount_percent": 70, "shipping_amount": 69, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": true, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/google.png"}	2025-07-21	2025-07-28	draft	2025-07-21 15:36:52.766933	2025-07-21 15:36:52.766938
3497760f-b36a-4a49-8bf8-60dfdd321a71	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Google Inc", "to": "Logocart", "items": [{"id": "mdd9dziulhf51umjf7", "name": "Pavement renewal", "description": "Breaking and reconstructing of the already revamped pavement", "quantity": 1, "unit_cost": 500, "showDesc": false}, {"id": "mdd9jb3awi36vsii8e", "name": "Website Renewal", "description": "", "quantity": 1, "unit_cost": 50, "showDesc": false}], "invoice_number": "000368", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA", "terms": "70% ", "tax_percent": 10, "discount_percent": 70, "shipping_amount": 69, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": true, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/apple-logo.png"}	2025-07-21	2025-07-28	draft	2025-07-21 15:39:00.019634	2025-07-21 15:39:00.019641
dd908836-1a65-4925-a52d-aade2f45fa21	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Google Inc", "to": "Logocart", "items": [{"id": "mdd9dziulhf51umjf7", "name": "Pavement renewal", "description": "Breaking and reconstructing of the already revamped pavement", "quantity": 1, "unit_cost": 500, "showDesc": false}, {"id": "mdd9jb3awi36vsii8e", "name": "Website Renewal", "description": "", "quantity": 1, "unit_cost": 50, "showDesc": false}], "invoice_number": "000369", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA", "terms": "70% initial deposit", "tax_percent": 10, "discount_percent": 70, "shipping_amount": 69, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": true, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/Blueage-Logo.png"}	2025-07-21	2025-07-28	draft	2025-07-21 15:55:19.321555	2025-07-21 15:55:19.321587
869b5bc5-9d30-4859-8b64-c52d23a5ff01	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Google Inc", "to": "Logocart", "items": [{"id": "mdd9dziulhf51umjf7", "name": "Pavement renewal", "description": "Breaking and reconstructing of the already revamped pavement", "quantity": 1, "unit_cost": 500, "showDesc": false}, {"id": "mdd9jb3awi36vsii8e", "name": "Website Renewal", "description": "", "quantity": 1, "unit_cost": 50, "showDesc": false}], "invoice_number": "000370", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA", "terms": "70% initial deposit", "tax_percent": 10, "discount_percent": 70, "shipping_amount": 69, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": true, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/Blueage-Logo.png"}	2025-07-21	2025-07-28	draft	2025-07-21 16:00:28.072814	2025-07-21 16:00:28.072841
5feb834e-cdfa-47aa-8f0e-a18873457e40	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Google Inc", "to": "Logocart", "items": [{"id": "mdd9dziulhf51umjf7", "name": "Pavement renewal", "description": "Breaking and reconstructing of the already revamped pavement", "quantity": 1, "unit_cost": 500, "showDesc": false}, {"id": "mdd9jb3awi36vsii8e", "name": "Website Renewal", "description": "", "quantity": 1, "unit_cost": 50, "showDesc": false}], "invoice_number": "000371", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA", "terms": "70% initial deposit", "tax_percent": 10, "discount_percent": 70, "shipping_amount": 69, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": true, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/Blueage-Logo.png"}	2025-07-21	2025-07-28	draft	2025-07-21 16:01:13.037669	2025-07-21 16:01:13.037688
d9e2e502-d2da-4461-befa-cd7a1546b1d3	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Google Inc", "to": "Logocart", "items": [{"id": "mdd9dziulhf51umjf7", "name": "Pavement renewal", "description": "Breaking and reconstructing of the already revamped pavement", "quantity": 1, "unit_cost": 500, "showDesc": false}, {"id": "mdd9jb3awi36vsii8e", "name": "Website Renewal", "description": "", "quantity": 1, "unit_cost": 50, "showDesc": false}], "invoice_number": "000372", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA", "terms": "70% initial deposit", "tax_percent": 10, "discount_percent": 70, "shipping_amount": 69, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": true, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/logocart new logo3.png"}	2025-07-21	2025-07-28	draft	2025-07-21 16:03:10.347507	2025-07-21 16:03:10.34752
811cf143-a282-45f7-9bb7-dab2140d3f90	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Google Inc", "to": "Logocart", "items": [{"id": "mdd9dziulhf51umjf7", "name": "Pavement renewal", "description": "Breaking and reconstructing of the already revamped pavement", "quantity": 1, "unit_cost": 500, "showDesc": false}, {"id": "mdd9jb3awi36vsii8e", "name": "Website Renewal", "description": "", "quantity": 1, "unit_cost": 50, "showDesc": false}], "invoice_number": "000373", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA", "terms": "70% initial deposit", "tax_percent": 10, "discount_percent": 70, "shipping_amount": 69, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": true, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/logocart new logo3.png"}	2025-07-21	2025-07-28	draft	2025-07-21 16:04:00.842052	2025-07-21 16:04:00.842066
4415c9ae-408a-4502-ba7b-adf06d5a48c1	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Google Inc", "to": "Logocart", "items": [{"id": "mdd9dziulhf51umjf7", "name": "Pavement renewal", "description": "Breaking and reconstructing of the already revamped pavement", "quantity": 1, "unit_cost": 500, "showDesc": false}, {"id": "mdd9jb3awi36vsii8e", "name": "Website Renewal", "description": "", "quantity": 1, "unit_cost": 50, "showDesc": false}], "invoice_number": "000373", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA", "terms": "70% initial deposit", "tax_percent": 10, "discount_percent": 70, "shipping_amount": 69, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": true, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/logocart new logo3.png"}	2025-07-21	2025-07-28	draft	2025-07-21 16:13:13.296153	2025-07-21 16:13:13.296166
a4c3da48-cb4b-45b7-a51f-353f7c96f610	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Google Inc", "to": "Logocart", "items": [{"id": "mdd9dziulhf51umjf7", "name": "Pavement renewal", "description": "Breaking and reconstructing of the already revamped pavement", "quantity": 1, "unit_cost": 500, "showDesc": false}, {"id": "mdd9jb3awi36vsii8e", "name": "Website Renewal", "description": "", "quantity": 1, "unit_cost": 50, "showDesc": false}], "invoice_number": "000374", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA", "terms": "70% initial deposit", "tax_percent": 10, "discount_percent": 70, "shipping_amount": 69, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": true, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/logocart new logo3.png"}	2025-07-21	2025-07-28	draft	2025-07-21 16:16:01.729639	2025-07-21 16:16:01.729654
0311f569-00ed-4d1d-8525-2f4b874d3454	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Google Inc", "to": "Logocart", "items": [{"id": "mdd9dziulhf51umjf7", "name": "Pavement renewal", "description": "Breaking and reconstructing of the already revamped pavement", "quantity": 1, "unit_cost": 500, "showDesc": false}, {"id": "mdd9jb3awi36vsii8e", "name": "Website Renewal", "description": "", "quantity": 1, "unit_cost": 50, "showDesc": false}], "invoice_number": "000374", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA", "terms": "70% initial deposit", "tax_percent": 10, "discount_percent": 70, "shipping_amount": 69, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": true, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/logocart new logo3.png"}	2025-07-21	2025-07-28	draft	2025-07-21 16:19:09.745446	2025-07-21 16:19:09.745462
7e67d12d-a172-494b-a06c-7afd1edcf58c	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Google Inc", "to": "Logocart", "items": [{"id": "mdd9dziulhf51umjf7", "name": "Pavement renewal", "description": "Breaking and reconstructing of the already revamped pavement", "quantity": 1, "unit_cost": 500, "showDesc": false}, {"id": "mdd9jb3awi36vsii8e", "name": "Website Renewal", "description": "", "quantity": 1, "unit_cost": 50, "showDesc": false}], "invoice_number": "000374", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA", "terms": "70% initial deposit", "tax_percent": 10, "discount_percent": 70, "shipping_amount": 69, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": true, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/logocart new logo3.png"}	2025-07-21	2025-07-28	draft	2025-07-21 16:22:10.279464	2025-07-21 16:22:10.279478
3c7de965-fc4e-4cff-8957-8bbfbe6acffc	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Google Inc", "to": "Logocart", "items": [{"id": "mdd9dziulhf51umjf7", "name": "Pavement renewal", "description": "Breaking and reconstructing of the already revamped pavement", "quantity": 1, "unit_cost": 500, "showDesc": false}, {"id": "mdd9jb3awi36vsii8e", "name": "Website Renewal", "description": "", "quantity": 1, "unit_cost": 50, "showDesc": false}], "invoice_number": "000374", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA", "terms": "70% initial deposit", "tax_percent": 10, "discount_percent": 70, "shipping_amount": 69, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": true, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/logocart new logo3.png"}	2025-07-21	2025-07-28	draft	2025-07-21 16:22:41.263271	2025-07-21 16:22:41.263288
e407ba39-3ef0-44a8-a16f-0c4a67e76ccb	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "Google Inc", "to": "Logocart", "items": [{"id": "mdd9dziulhf51umjf7", "name": "Pavement renewal", "description": "Breaking and reconstructing of the already revamped pavement", "quantity": 1, "unit_cost": 500, "showDesc": false}, {"id": "mdd9jb3awi36vsii8e", "name": "Website Renewal", "description": "", "quantity": 1, "unit_cost": 50, "showDesc": false}], "invoice_number": "000374", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "2048465423\\nUBA", "terms": "70% initial deposit", "tax_percent": 10, "discount_percent": 70, "shipping_amount": 69, "tax_type": "percent", "discount_type": "percent", "show_tax": true, "show_discount": true, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/logocart new logo3.png"}	2025-07-21	2025-07-28	draft	2025-07-21 16:24:36.61255	2025-07-21 16:24:36.612562
a08d5059-1060-4eb5-b3fc-e4fe9d6ffa72	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "hjhj", "to": "knmnk", "items": [{"id": "mddc2qrpmdfr4jxfq9n", "name": "nnmnnn", "description": "", "quantity": 1, "unit_cost": 0, "showDesc": false}], "invoice_number": "000789", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "hhjh", "terms": "jnjnjn", "tax_percent": 0, "discount_percent": 0, "shipping_amount": 70, "tax_type": "percent", "discount_type": "percent", "show_tax": false, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/Blueage-Logo.png"}	2025-07-21	2025-07-28	draft	2025-07-21 16:47:32.459429	2025-07-21 16:47:32.459434
b589e4a7-b235-4c22-80d5-9b68a3159b30	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "hjhj", "to": "knmnk", "items": [{"id": "mddc2qrpmdfr4jxfq9n", "name": "nnmnnn", "description": "", "quantity": 1, "unit_cost": 0, "showDesc": false}], "invoice_number": "000789", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "hhjh", "terms": "jnjnjn", "tax_percent": 0, "discount_percent": 0, "shipping_amount": 70, "tax_type": "percent", "discount_type": "percent", "show_tax": false, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/Blueage-Logo.png"}	2025-07-21	2025-07-28	draft	2025-07-21 16:48:48.201149	2025-07-21 16:48:48.201189
16b5b4a7-727a-4996-a6bd-d708d5c50267	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "hjhj", "to": "knmnk", "items": [{"id": "mddc2qrpmdfr4jxfq9n", "name": "nnmnnn", "description": "", "quantity": 1, "unit_cost": 0, "showDesc": false}], "invoice_number": "000789", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "hhjh", "terms": "jnjnjn", "tax_percent": 0, "discount_percent": 0, "shipping_amount": 70, "tax_type": "percent", "discount_type": "percent", "show_tax": false, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/Blueage-Logo.png"}	2025-07-21	2025-07-28	draft	2025-07-21 16:49:48.674646	2025-07-21 16:49:48.674652
02aa7fbf-c6cb-4b5c-8e30-6d309c78401a	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "hjhj", "to": "knmnk", "items": [{"id": "mddc2qrpmdfr4jxfq9n", "name": "nnmnnn", "description": "", "quantity": 1, "unit_cost": 0, "showDesc": false}], "invoice_number": "000789", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "hhjh", "terms": "jnjnjn", "tax_percent": 0, "discount_percent": 0, "shipping_amount": 70, "tax_type": "percent", "discount_type": "percent", "show_tax": false, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/Blueage-Logo.png"}	2025-07-21	2025-07-28	draft	2025-07-21 16:51:28.148626	2025-07-21 16:51:28.148639
d18a5bbb-86c3-44a9-94af-87c75526671e	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "hjhj", "to": "knmnk", "items": [{"id": "mddc2qrpmdfr4jxfq9n", "name": "nnmnnn", "description": "", "quantity": 1, "unit_cost": 0, "showDesc": false}], "invoice_number": "000789", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "hhjh", "terms": "jnjnjn", "tax_percent": 0, "discount_percent": 0, "shipping_amount": 70, "tax_type": "percent", "discount_type": "percent", "show_tax": false, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/Blueage-Logo.png"}	2025-07-21	2025-07-28	draft	2025-07-21 16:52:49.690117	2025-07-21 16:52:49.690123
c384463f-17ac-4ea0-b703-cfef0ee9ae82	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "hjhj", "to": "knmnk", "items": [{"id": "mddc2qrpmdfr4jxfq9n", "name": "nnmnnn", "description": "", "quantity": 1, "unit_cost": 0, "showDesc": false}], "invoice_number": "000789", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "hhjh", "terms": "jnjnjn", "tax_percent": 0, "discount_percent": 0, "shipping_amount": 70, "tax_type": "percent", "discount_type": "percent", "show_tax": false, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/Blueage-Logo.png"}	2025-07-21	2025-07-28	draft	2025-07-21 16:53:33.582117	2025-07-21 16:53:33.582138
aecd474b-6ca6-4a71-b934-b13301c30fb3	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "hjhj", "to": "knmnk", "items": [{"id": "mddc2qrpmdfr4jxfq9n", "name": "nnmnnn", "description": "", "quantity": 1, "unit_cost": 0, "showDesc": false}], "invoice_number": "000789", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "hhjh", "terms": "jnjnjn", "tax_percent": 0, "discount_percent": 0, "shipping_amount": 70, "tax_type": "percent", "discount_type": "percent", "show_tax": false, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/Blueage-Logo.png"}	2025-07-21	2025-07-28	draft	2025-07-21 16:57:39.803856	2025-07-21 16:57:39.803869
8cea8862-9a4a-4a23-8c6d-dfdbe69e50df	57bdf55d-b652-40cd-bca8-7ed76302763c	\N	{"from": "hjhj", "to": "knmnk", "items": [{"id": "mddc2qrpmdfr4jxfq9n", "name": "nnmnnn", "description": "", "quantity": 1, "unit_cost": 0, "showDesc": false}], "invoice_number": "000789", "issued_date": "2025-07-21", "due_date": "2025-07-28", "payment_details": "hhjh", "terms": "jnjnjn", "tax_percent": 0, "discount_percent": 0, "shipping_amount": 70, "tax_type": "percent", "discount_type": "percent", "show_tax": false, "show_discount": false, "show_shipping": true, "logo_url": "http://localhost:5000/uploads/Blueage-Logo.png"}	2025-07-21	2025-07-28	draft	2025-07-21 17:08:07.669728	2025-07-21 17:08:07.669742
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, first_name, last_name, password_hash, google_id, is_guest, created_at, updated_at) FROM stdin;
57bdf55d-b652-40cd-bca8-7ed76302763c	talktoolumide@gmail.com	Olumide	Ogunseye	scrypt:32768:8:1$6hunUh097f2YGynj$6af514af56b6587f06e1c160ad8c67efcc6052684929ad021c6ee18bc76ec34084d2151bc5feeb25060d4bb1a854f085dccfb040bf635a41a2143974f7027ce1	\N	f	2025-07-17 18:01:27.235021	2025-07-17 18:01:27.235038
a30f8278-3fb0-4627-a41e-d85ecf1ba2fa	gabriel.oogunseye@gmail.com	Olumide	Gabriel	scrypt:32768:8:1$exs8MMmXC2rTshG3$d26af889e2a3aac66d47e8e0444525414c14a8f1cd5fc854f4964b1d3325c56922422514cd36a16e504d85fa89a33c14200a39eb366ab7ba6c4a690745a87a6e	\N	f	2025-07-17 19:27:49.971572	2025-07-17 19:27:49.971579
947143e5-fe5c-4601-b24f-578996b5bfc6	chukwuemekaobiakor@gmail.com	Chukwuemeka	Obiakor	scrypt:32768:8:1$e9koCQ6kLvc75HEt$b93efe02338640a376370cc8b1e925b82c4c8583de83dbc1d5c4ff1def09d69066770118adade8a3f9289defa8fc067ee28b034d378ac247e1f8d66ef13e5d99	\N	f	2025-07-18 21:58:04.588289	2025-07-18 21:58:04.589009
6d6a5910-7621-406f-8f2e-b9099846328c	johnmonday@gmail.com	Monday	John	scrypt:32768:8:1$h9g779Ho2q5ah5ng$61b9da4f2c80ac396dba02c8c3865dd0998344785c596e1d8c154e8052e2efa0d720a5cb68df4e4ce68439c45332f29be24860169fdc055f3bcb21ccb7786f22	\N	f	2025-07-19 00:25:17.72662	2025-07-19 00:25:17.726625
\.


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_google_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_google_id_key UNIQUE (google_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: clients clients_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;


--
-- Name: invoices invoices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

