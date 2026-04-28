--
-- PostgreSQL database dump
--

\restrict WdOxJpGCOD3WaUdn58rLdryvrOWH9wN97gLe26n5qCnhQDzIUQwDXtefQxh3lCE

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

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
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_users (id, email, password_hash, name, created_at) FROM stdin;
1	admin@snackmaster.io	$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi	SnackMaster Admin	2026-04-14 15:31:53.679337
\.


--
-- Data for Name: form_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.form_configs (id, type, label, is_enabled, fields, display_order, updated_at) FROM stdin;
3	feedback	Weekly Feedback	t	[{"name": "rating", "type": "star_rating", "label": "Overall Rating", "required": true}, {"name": "comment", "type": "textarea", "label": "Your Comments", "required": false, "placeholder": "Share your thoughts..."}]	3	2026-04-14 15:31:53.679337
4	suggestion	Suggest a Product	t	[{"name": "product", "type": "text", "label": "Product Name / Type", "required": true, "placeholder": "e.g. Lay's Classic Salted, Green Tea"}, {"name": "preference", "type": "like_dislike", "label": "Would you buy this?", "required": true}, {"name": "comments", "type": "textarea", "label": "Additional Comments", "required": false, "placeholder": "Tell us more about why you want this product..."}]	4	2026-04-14 15:31:53.679337
1	complaint	Report a Problem	t	[{"name": "name", "type": "text", "label": "Your Name", "required": true, "placeholder": "Enter your name"}, {"name": "phone", "type": "tel", "label": "Phone Number", "required": false, "placeholder": "Optional - for follow-up"}, {"name": "issue_type", "type": "select", "label": "Issue Type", "options": ["Not dispensing product", "Payment deducted but no product", "Product stuck", "Machine not working", "Poor quality", "Wrong product", "Others"], "required": true}, {"name": "description", "type": "textarea", "label": "Describe the Issue", "required": false, "placeholder": "Tell us more about the problem..."}]	1	2026-04-17 17:03:03.998658
5	rating	Rate Our Service	t	[{"name": "service", "type": "star_rating", "label": "Service Quality", "required": true}, {"name": "refill_timing", "type": "star_rating", "label": "Refill Timing", "required": true}, {"name": "product_availability", "type": "star_rating", "label": "Product Availability", "required": true}, {"name": "cleanliness", "type": "star_rating", "label": "Cleanliness", "required": true}, {"name": "comment", "type": "textarea", "label": "Additional Comments", "required": false, "placeholder": "Any other feedback?"}]	5	2026-04-20 15:59:38.987816
6	test_form	Test Form	t	[{"name": "name", "type": "text", "label": "your name", "required": true, "placeholder": "Enter your name"}, {"name": "your number", "type": "number", "label": "number", "options": ["9834"], "required": true, "placeholder": "enter your number "}]	0	2026-04-23 15:10:49.711152
2	refund	Request a Refund	t	[{"name": "name", "type": "text", "label": "Your Name", "required": true, "placeholder": "Enter your full name"}, {"name": "phone", "type": "tel", "label": "Phone Number", "required": true, "placeholder": "Required for refund processing"}, {"name": "amount", "type": "number", "label": "Amount Paid (₹)", "required": true, "placeholder": "e.g. 30"}, {"name": "description", "type": "textarea", "label": "What Happened?", "required": false, "placeholder": "Briefly describe the issue..."}]	2	2026-04-23 14:43:26.750116
\.


--
-- Data for Name: machines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.machines (id, machine_code, location, area, status, created_at, name, qr_code_url, deleted_at) FROM stdin;
4	2632	WIPRO GOPANPALLY 1	GROUND FLOOR	active	2026-04-14 15:31:53.679337	\N	\N	\N
5	2633	WIPRO GOPANPALLY 2	GROUND FLOOR	active	2026-04-14 15:31:53.679337	\N	\N	\N
6	2634	WIPRO GOPANPALLY 3	GROUND FLOOR	active	2026-04-14 15:31:53.679337	\N	\N	\N
7	2642	WIPRO MANIKONDA 1	9TH FLOOR	active	2026-04-14 15:31:53.679337	\N	\N	\N
8	2643	WIPRO MANIKONDA 2	3RD FLOOR	active	2026-04-14 15:31:53.679337	\N	\N	\N
9	2644	WIPRO MANIKONDA 3	GROUND FLOOR	active	2026-04-14 15:31:53.679337	\N	\N	\N
10	2645	WIPRO MANIKONDA 6	GROUND FLOOR	active	2026-04-14 15:31:53.679337	\N	\N	\N
11	4772	DRAPER STARTUP HOUSE	GACHIBOWLI	active	2026-04-14 15:31:53.679337	\N	\N	\N
12	VV00006	HOTEL SAYINN	GROUND FLOOR	active	2026-04-14 15:31:53.679337	\N	\N	\N
13	vv00001	BOB	BANK OF BARODA GACHIBOWLI	active	2026-04-14 15:31:53.679337	\N	\N	\N
14	vv00002	IIRM	IIRM FINANCIAL DIST	active	2026-04-14 15:31:53.679337	\N	\N	\N
15	vv00003	UOH	UNIVERSITY OF HYDERABAD GACHIBOWLI	active	2026-04-14 15:31:53.679337	\N	\N	\N
16	0001	hyd	gops	inactive	2026-04-23 09:11:32.298	vicky	/qr-codes/0001.png	2026-04-23 09:11:46.766
2	2144	WIPRO MANIKONDA 5	GROUND FLOOR	active	2026-04-14 15:31:53.679337	daalchini	/qr-codes/2144.png	\N
3	2145	WIPRO MANIKONDA 4	GROUND FLOOR	active	2026-04-14 15:31:53.679337	\N	/qr-codes/2145.png	\N
1	2143	WIPRO GOPANPALLY	GROUND FLOOR	active	2026-04-14 15:31:53.679337	daalchini	/qr-codes/2143.png	\N
\.


--
-- Data for Name: submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.submissions (id, machine_id, type, data, status, whatsapp_status, notes, created_at, updated_at, admin_notes, refund_status, admin_remarks) FROM stdin;
1	1	complaint	{"name": "test user", "issue_type": "Machine not working"}	pending	not_contacted	\N	2026-04-17 10:56:28.395	2026-04-17 10:56:28.398	\N	pending	\N
3	1	refund	{"name": "v", "phone": "v", "amount": "20", "description": "fghj"}	completed	done	\N	2026-04-17 11:23:36.618	2026-04-17 17:02:12.214567	\N	pending	\N
2	1	refund	{"name": "vicky", "phone": "9346133622", "amount": "30", "description": "stuck"}	completed	not_contacted	\N	2026-04-17 11:21:01.807	2026-04-17 17:08:27.07191	\N	pending	\N
4	1	rating	{"comment": "nah", "service": 5, "cleanliness": 4, "refill_timing": 4, "product_availability": 5}	pending	not_contacted	\N	2026-04-20 10:05:52.972	2026-04-20 10:05:52.976	\N	pending	\N
5	1	refund	{"name": "zdfh", "phone": "dfgcbnh", "amount": "20", "description": "hgj"}	pending	not_contacted	\N	2026-04-20 10:55:26.579	2026-04-20 10:55:26.586	\N	pending	\N
\.


--
-- Data for Name: weekly_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.weekly_config (id, title, start_date, end_date, is_active, created_at, updated_at) FROM stdin;
1	Mar 31 – Apr 6, 2025	2025-03-31	2025-04-06	t	2026-04-14 15:31:53.679337	2026-04-14 15:31:53.679337
\.


--
-- Name: admin_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.admin_users_id_seq', 1, true);


--
-- Name: form_configs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.form_configs_id_seq', 6, true);


--
-- Name: machines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.machines_id_seq', 16, true);


--
-- Name: submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.submissions_id_seq', 5, true);


--
-- Name: weekly_config_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.weekly_config_id_seq', 1, true);


--
-- PostgreSQL database dump complete
--

\unrestrict WdOxJpGCOD3WaUdn58rLdryvrOWH9wN97gLe26n5qCnhQDzIUQwDXtefQxh3lCE

