--
-- PostgreSQL database dump
--

\restrict tv9g5ioGDz2vRsbj8KnijWjT8aQy1SQWVCPZJOI91h4eSN607ovJS3jO8MBlsNP

-- Dumped from database version 15.14 (Debian 15.14-0+deb12u1)
-- Dumped by pg_dump version 18.1

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

DROP DATABASE kfmndb;
--
-- Name: kfmndb; Type: DATABASE; Schema: -; Owner: kfmnmaestro
--

CREATE DATABASE kfmndb WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.UTF-8';


ALTER DATABASE kfmndb OWNER TO kfmnmaestro;

\unrestrict tv9g5ioGDz2vRsbj8KnijWjT8aQy1SQWVCPZJOI91h4eSN607ovJS3jO8MBlsNP
\connect kfmndb
\restrict tv9g5ioGDz2vRsbj8KnijWjT8aQy1SQWVCPZJOI91h4eSN607ovJS3jO8MBlsNP

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
-- Name: kfmn; Type: SCHEMA; Schema: -; Owner: kfmnmaestro
--

CREATE SCHEMA kfmn;


ALTER SCHEMA kfmn OWNER TO kfmnmaestro;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: kfmnmaestro
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO kfmnmaestro;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: kfmnmaestro
--

COMMENT ON SCHEMA public IS '';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: cleanup_expired_sessions(); Type: FUNCTION; Schema: kfmn; Owner: kfmnmaestro
--

CREATE FUNCTION kfmn.cleanup_expired_sessions() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM kfmn.user_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION kfmn.cleanup_expired_sessions() OWNER TO kfmnmaestro;

--
-- Name: get_prayer_with_reactions(uuid, uuid); Type: FUNCTION; Schema: kfmn; Owner: kfmnmaestro
--

CREATE FUNCTION kfmn.get_prayer_with_reactions(prayer_uuid uuid, user_uuid uuid DEFAULT NULL::uuid) RETURNS TABLE(prayer_id uuid, user_id uuid, username character varying, display_name character varying, user_color character varying, user_avatar character varying, is_verified boolean, prayer_text text, created_at timestamp with time zone, emoji character varying, reaction_count bigint, user_reacted boolean, comment_count bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id as prayer_id,
        p.user_id,
        u.username,
        u.display_name,
        u.user_color,
        u.user_avatar,
        u.is_verified,
        p.prayer_text,
        p.created_at,
        r.emoji,
        COUNT(ru.id) as reaction_count,
        CASE WHEN user_uuid IS NOT NULL THEN
            EXISTS(SELECT 1 FROM kfmn.reaction_users ru2 WHERE ru2.reaction_id = r.id AND ru2.user_id = user_uuid)
        ELSE FALSE END as user_reacted,
        COUNT(rc.id) as comment_count
    FROM kfmn.prayers p
    JOIN kfmn.users u ON p.user_id = u.id
    LEFT JOIN kfmn.reactions r ON p.id = r.prayer_id
    LEFT JOIN kfmn.reaction_users ru ON r.id = ru.reaction_id
    LEFT JOIN kfmn.reaction_comments rc ON r.id = rc.reaction_id
    WHERE p.id = prayer_uuid
    GROUP BY p.id, p.user_id, u.username, u.display_name, u.user_color, u.user_avatar, u.is_verified, p.prayer_text, p.created_at, r.emoji, r.id
    ORDER BY r.emoji;
END;
$$;


ALTER FUNCTION kfmn.get_prayer_with_reactions(prayer_uuid uuid, user_uuid uuid) OWNER TO kfmnmaestro;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: kfmnmaestro
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO kfmnmaestro;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: prayers; Type: TABLE; Schema: kfmn; Owner: kfmnmaestro
--

CREATE TABLE kfmn.prayers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    prayer_text text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE kfmn.prayers OWNER TO kfmnmaestro;

--
-- Name: reaction_comments; Type: TABLE; Schema: kfmn; Owner: kfmnmaestro
--

CREATE TABLE kfmn.reaction_comments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    reaction_id uuid NOT NULL,
    user_id uuid NOT NULL,
    comment_text text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE kfmn.reaction_comments OWNER TO kfmnmaestro;

--
-- Name: reaction_users; Type: TABLE; Schema: kfmn; Owner: kfmnmaestro
--

CREATE TABLE kfmn.reaction_users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    reaction_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE kfmn.reaction_users OWNER TO kfmnmaestro;

--
-- Name: reactions; Type: TABLE; Schema: kfmn; Owner: kfmnmaestro
--

CREATE TABLE kfmn.reactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    prayer_id uuid NOT NULL,
    emoji character varying(10) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE kfmn.reactions OWNER TO kfmnmaestro;

--
-- Name: scheduled_calls; Type: TABLE; Schema: kfmn; Owner: kfmnmaestro
--

CREATE TABLE kfmn.scheduled_calls (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) DEFAULT 'Gemeinsames Gebet'::character varying NOT NULL,
    description text,
    scheduled_at timestamp with time zone NOT NULL,
    duration_minutes integer DEFAULT 60 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    meeting_url text
);


ALTER TABLE kfmn.scheduled_calls OWNER TO kfmnmaestro;

--
-- Name: user_sessions; Type: TABLE; Schema: kfmn; Owner: kfmnmaestro
--

CREATE TABLE kfmn.user_sessions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    session_token character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_agent text,
    ip_address inet
);


ALTER TABLE kfmn.user_sessions OWNER TO kfmnmaestro;

--
-- Name: users; Type: TABLE; Schema: kfmn; Owner: kfmnmaestro
--

CREATE TABLE kfmn.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username character varying(50) NOT NULL,
    display_name character varying(100),
    email character varying(255),
    phone character varying(20),
    password_hash character varying(255) NOT NULL,
    user_color character varying(7) DEFAULT '#3b82f6'::character varying NOT NULL,
    user_avatar character varying(10) DEFAULT '🙏'::character varying NOT NULL,
    notifications_enabled boolean DEFAULT false NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    verification_token character varying(255),
    verification_expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE kfmn.users OWNER TO kfmnmaestro;

--
-- Data for Name: prayers; Type: TABLE DATA; Schema: kfmn; Owner: kfmnmaestro
--

COPY kfmn.prayers (id, user_id, prayer_text, created_at, updated_at) FROM stdin;
11437f61-f7de-444a-8b71-905b1153fe1b	abf359c4-c8b0-4b53-beb6-8bc58aa25d3f	hallo wie geht es?	2025-12-14 14:30:14.132814+01	2025-12-14 14:30:14.132814+01
6bece233-491d-4724-b9d4-12705621618a	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	bitte betet mit mir für den frieden der welt	2025-12-14 14:34:35.146693+01	2025-12-14 14:34:35.146693+01
a84a7e58-a8c5-4e3d-bd08-cdfc15cb2be5	1e047d84-16e5-4e32-be51-b17e70d7fa2a	Lasst uns für unsere verfolgten Brüder im Ausland beten.	2025-12-14 14:40:49.214681+01	2025-12-14 14:40:49.214681+01
a2e76510-113f-47ce-adce-b8a75f941a08	1e047d84-16e5-4e32-be51-b17e70d7fa2a	jo	2025-12-14 14:42:13.613714+01	2025-12-14 14:42:13.613714+01
7cc3cdba-8b71-4f74-a3b2-e9bc1250f8bd	1e047d84-16e5-4e32-be51-b17e70d7fa2a	bettet für die #welt	2025-12-14 14:43:16.741605+01	2025-12-14 14:43:16.741605+01
01fb3e89-de0a-453e-b5c9-105ddf3d74c7	9c369621-9690-4933-a90c-391124a0b836	Lasst uns danken für alle die guten Gaben, und den Frieden den wir genießen dürfen.	2025-12-14 14:56:45.928796+01	2025-12-14 14:56:45.928796+01
7660fc11-bcee-40f2-a4d0-59e5b84a9a82	9c369621-9690-4933-a90c-391124a0b836	Möge unser Herr bald wiederkommen 🕊️	2025-12-14 14:57:50.487559+01	2025-12-14 14:57:50.487559+01
d5cadb27-4d3d-4aaf-8cae-735bc0ae6b70	daf2bf57-6476-4ec4-b2d9-f920b97a477c	Liebe Kinder, denkt daran das nur der Glaube erettet. Aber ein Glaube ohne Werke ist ein toter Glaube. Betwn wir f	2025-12-14 15:06:16.072513+01	2025-12-14 15:06:16.072513+01
08cd976f-7bb7-4a92-aaa1-39f61b2a4a45	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	Lasst uns für die Obdachlosen im Winter beten dass sie ein warmes Dach über dem Kopf und genug Essen und Kleidung haben.	2025-12-15 13:21:46.627874+01	2025-12-15 13:21:46.627874+01
a65a9276-d3dc-488e-a6c6-38862fd50f9c	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	In der #welt ist viel falsch, beten wir das der Herr uns Gnädig ist und frieden und gesundheit und wohlstand allen Geben mag wenn sie umkehren.	2025-12-15 15:02:52.272293+01	2025-12-15 15:02:52.272293+01
000e92b5-d892-46bd-8569-d41da71a7ff7	1e047d84-16e5-4e32-be51-b17e70d7fa2a	Betet für meine Hände	2025-12-15 15:50:44.383336+01	2025-12-15 15:50:44.383336+01
\.


--
-- Data for Name: reaction_comments; Type: TABLE DATA; Schema: kfmn; Owner: kfmnmaestro
--

COPY kfmn.reaction_comments (id, reaction_id, user_id, comment_text, created_at) FROM stdin;
15905729-ab34-4388-a4a1-0c8ad7567621	ef3b161e-eb56-4460-bdb5-bd0402e32ea8	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	hallo ihr Lieben	2025-12-14 14:35:16.171687+01
cdce73e9-cde8-4614-9660-cdb07f51abfa	73a3aecf-b7db-4d6f-bd9a-f70656b7d8c8	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	gerne	2025-12-14 14:39:20.778599+01
f8d87500-0349-4214-84ad-2e7392233b7a	7ce6d7d6-dc2a-45fb-9542-9dbba8f66071	1e047d84-16e5-4e32-be51-b17e70d7fa2a	ja!	2025-12-14 14:42:52.04948+01
278b5f45-34f2-4272-9649-8d166cbbcb48	0b60503d-3d8b-4e53-be8f-58fb7cfc6b0f	daf2bf57-6476-4ec4-b2d9-f920b97a477c	Amen	2025-12-14 15:04:20.765465+01
73944a25-1fc4-4225-9b04-30b453feb018	ab56802c-e77b-4f37-b7c1-f66739633559	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	gut	2025-12-14 15:55:04.196536+01
9688db08-7f66-4379-b6b3-12b0f47dd7b2	73a3aecf-b7db-4d6f-bd9a-f70656b7d8c8	daf2bf57-6476-4ec4-b2d9-f920b97a477c	juhu	2025-12-14 15:59:29.881241+01
63b9ed9d-0e2a-4fd2-a685-0a660bc1fb38	d56df115-edbd-42d1-b822-33c8f9252132	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	genau, das wird so oft übersehen.	2025-12-14 16:16:54.349288+01
25853157-3fe3-442f-a3d9-e201456b7c3d	918b117e-b868-434a-87d3-1aefe8b28c3b	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	Amen	2025-12-14 16:17:40.851775+01
2419b107-6634-4da6-8434-c0588d799e5d	804f07b0-fcf6-42c8-a690-6138f7460a43	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	hallo	2025-12-15 12:19:53.624627+01
1bcce952-3e67-49cb-b16f-3c754894b141	c685da39-9d0d-4683-aa49-38207db78494	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	das stimmt	2025-12-15 13:20:45.895888+01
1fa5b07b-8c3a-46d8-8f54-0af1c65fbe4e	78ce8e5a-e6a9-4822-bcf3-c30fbfee03b5	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	Amen	2025-12-15 13:26:09.458069+01
eca4c8c8-389c-41d9-8c86-591cc7401c0b	0ce6bf09-50cd-4d78-9a27-d8af31a24052	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	Mögen sie wieder kräftig werden	2025-12-15 19:06:27.424978+01
\.


--
-- Data for Name: reaction_users; Type: TABLE DATA; Schema: kfmn; Owner: kfmnmaestro
--

COPY kfmn.reaction_users (id, reaction_id, user_id, created_at) FROM stdin;
3487a27f-bf6e-4ee9-b41d-c5480145a930	59fcedcb-8e05-4bf9-bb5e-1f2a0574d715	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	2025-12-14 14:35:06.802858+01
a47c5810-6aaf-4830-a888-bb3b1b20b92b	ef3b161e-eb56-4460-bdb5-bd0402e32ea8	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	2025-12-14 14:35:16.171687+01
cf268f82-b118-4c22-b233-722ea8ae027a	dccaa681-d55a-4279-848e-6dda31f12342	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	2025-12-14 14:39:15.113365+01
d84a2281-4fa8-4acc-8d8d-8e715111c925	73a3aecf-b7db-4d6f-bd9a-f70656b7d8c8	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	2025-12-14 14:39:20.778599+01
59f61941-350b-482b-89ca-865ab65dc783	7ce6d7d6-dc2a-45fb-9542-9dbba8f66071	1e047d84-16e5-4e32-be51-b17e70d7fa2a	2025-12-14 14:42:52.04948+01
5a40eb06-1282-4ebc-bb34-2fb63de6e296	98c3a565-b5ac-4601-9ff9-69c9781af188	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	2025-12-14 14:55:06.547224+01
a4074407-d491-4aac-ab9e-bfcf845503b7	bb39db64-b4ce-4eae-8e06-2f45db4849fc	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	2025-12-14 14:57:12.000491+01
1df5c712-6d86-4bbe-8033-927949beaffb	b6a0bfec-1879-4ff7-8e2d-3b653ab5fac5	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	2025-12-14 14:57:14.731678+01
6786546b-7c86-4acc-a7b4-fb7335dd8608	026e7e7c-41df-4531-bc47-e35f5613ebba	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	2025-12-14 14:57:18.008598+01
9134109f-a029-4e82-972c-a8a196d6b0f1	891497a5-eef1-4c2a-8f34-cb8be6a09b00	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	2025-12-14 14:59:17.510382+01
c9f1f4bb-5faf-48fa-8463-007cc47e4ae3	0b60503d-3d8b-4e53-be8f-58fb7cfc6b0f	daf2bf57-6476-4ec4-b2d9-f920b97a477c	2025-12-14 15:04:20.765465+01
a7679e42-f429-46bd-9a8b-13630f07ad08	7ce6d7d6-dc2a-45fb-9542-9dbba8f66071	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	2025-12-14 15:54:31.112692+01
2af30faf-94ed-47c7-a2ed-fd0eff4e3a5c	ab56802c-e77b-4f37-b7c1-f66739633559	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	2025-12-14 15:55:04.196536+01
71335424-29b0-4914-9d34-6d797a33f4be	73a3aecf-b7db-4d6f-bd9a-f70656b7d8c8	daf2bf57-6476-4ec4-b2d9-f920b97a477c	2025-12-14 15:59:29.881241+01
410e04fb-37f1-4589-880d-27cbe5a9c88d	d56df115-edbd-42d1-b822-33c8f9252132	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	2025-12-14 16:16:54.349288+01
f17d3950-1c42-4419-a94b-f441ed26c6b2	918b117e-b868-434a-87d3-1aefe8b28c3b	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	2025-12-14 16:17:40.851775+01
00a70616-6314-4c1e-aafa-95b4c66376df	804f07b0-fcf6-42c8-a690-6138f7460a43	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	2025-12-15 12:19:53.624627+01
efa5aac4-7011-4482-8d91-c6c241696d1e	c187e73a-6840-4650-ad0e-49c846edfacb	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	2025-12-15 13:20:34.429044+01
2d633fea-ffd1-4e78-aa74-7d33b8f805b9	c685da39-9d0d-4683-aa49-38207db78494	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	2025-12-15 13:20:45.895888+01
6918d52e-7435-4e27-b7ea-c3914bda00bb	78ce8e5a-e6a9-4822-bcf3-c30fbfee03b5	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	2025-12-15 13:26:09.458069+01
7153ca67-f5f8-42df-8190-c9587e9a1859	382ade53-8b4f-4783-ae7c-43b5ae951cfb	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	2025-12-15 15:51:19.32998+01
8be96a7e-9f81-4954-b48e-c56c5602a143	0ce6bf09-50cd-4d78-9a27-d8af31a24052	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	2025-12-15 19:06:27.424978+01
\.


--
-- Data for Name: reactions; Type: TABLE DATA; Schema: kfmn; Owner: kfmnmaestro
--

COPY kfmn.reactions (id, prayer_id, emoji, created_at) FROM stdin;
59fcedcb-8e05-4bf9-bb5e-1f2a0574d715	11437f61-f7de-444a-8b71-905b1153fe1b	❤️	2025-12-14 14:35:06.802858+01
ef3b161e-eb56-4460-bdb5-bd0402e32ea8	11437f61-f7de-444a-8b71-905b1153fe1b	🌟	2025-12-14 14:35:16.171687+01
dccaa681-d55a-4279-848e-6dda31f12342	6bece233-491d-4724-b9d4-12705621618a	🎉	2025-12-14 14:39:15.113365+01
73a3aecf-b7db-4d6f-bd9a-f70656b7d8c8	6bece233-491d-4724-b9d4-12705621618a	🤗	2025-12-14 14:39:20.778599+01
7ce6d7d6-dc2a-45fb-9542-9dbba8f66071	6bece233-491d-4724-b9d4-12705621618a	🕊️	2025-12-14 14:42:52.04948+01
98c3a565-b5ac-4601-9ff9-69c9781af188	7cc3cdba-8b71-4f74-a3b2-e9bc1250f8bd	❤️	2025-12-14 14:55:06.547224+01
bb39db64-b4ce-4eae-8e06-2f45db4849fc	01fb3e89-de0a-453e-b5c9-105ddf3d74c7	🙏	2025-12-14 14:57:12.000491+01
b6a0bfec-1879-4ff7-8e2d-3b653ab5fac5	a2e76510-113f-47ce-adce-b8a75f941a08	🙏	2025-12-14 14:57:14.731678+01
026e7e7c-41df-4531-bc47-e35f5613ebba	a84a7e58-a8c5-4e3d-bd08-cdfc15cb2be5	🙏	2025-12-14 14:57:18.008598+01
891497a5-eef1-4c2a-8f34-cb8be6a09b00	7660fc11-bcee-40f2-a4d0-59e5b84a9a82	🕊️	2025-12-14 14:59:17.510382+01
0b60503d-3d8b-4e53-be8f-58fb7cfc6b0f	7660fc11-bcee-40f2-a4d0-59e5b84a9a82	🙏	2025-12-14 15:04:20.765465+01
ab56802c-e77b-4f37-b7c1-f66739633559	11437f61-f7de-444a-8b71-905b1153fe1b	💪	2025-12-14 15:55:04.196536+01
d56df115-edbd-42d1-b822-33c8f9252132	01fb3e89-de0a-453e-b5c9-105ddf3d74c7	💬	2025-12-14 16:16:54.349288+01
918b117e-b868-434a-87d3-1aefe8b28c3b	01fb3e89-de0a-453e-b5c9-105ddf3d74c7	🕊️	2025-12-14 16:17:40.851775+01
804f07b0-fcf6-42c8-a690-6138f7460a43	a84a7e58-a8c5-4e3d-bd08-cdfc15cb2be5	💪	2025-12-15 12:19:53.624627+01
c187e73a-6840-4650-ad0e-49c846edfacb	d5cadb27-4d3d-4aaf-8cae-735bc0ae6b70	🎉	2025-12-15 13:20:34.429044+01
c685da39-9d0d-4683-aa49-38207db78494	d5cadb27-4d3d-4aaf-8cae-735bc0ae6b70	💬	2025-12-15 13:20:45.895888+01
78ce8e5a-e6a9-4822-bcf3-c30fbfee03b5	08cd976f-7bb7-4a92-aaa1-39f61b2a4a45	🙏	2025-12-15 13:26:09.458069+01
382ade53-8b4f-4783-ae7c-43b5ae951cfb	000e92b5-d892-46bd-8569-d41da71a7ff7	🙏	2025-12-15 15:51:19.32998+01
0ce6bf09-50cd-4d78-9a27-d8af31a24052	000e92b5-d892-46bd-8569-d41da71a7ff7	💪	2025-12-15 19:06:27.424978+01
\.


--
-- Data for Name: scheduled_calls; Type: TABLE DATA; Schema: kfmn; Owner: kfmnmaestro
--

COPY kfmn.scheduled_calls (id, title, description, scheduled_at, duration_minutes, is_active, created_by, created_at, updated_at, meeting_url) FROM stdin;
19015246-5b5b-40b0-a426-e060377257a9	Gemeinsames Gebet	Abendgebet um Heilung und Stärke	2025-12-15 19:30:00+01	90	t	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	2025-12-14 16:09:15.647389+01	2025-12-15 19:21:12.141318+01	https://app.zoom.us/wc/89987874267/join?fromPWA=1&pwd=GPEe8QwBd6XqFv89Ry9SgSH3Ro5IhI.1&_x_zm_rtaid=yPAvzvEFTRaLGN80jP_RPQ.1765822786591.e9c413d9d9deb89469b70768fc69b787&_x_zm_rhtaid=403
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: kfmn; Owner: kfmnmaestro
--

COPY kfmn.user_sessions (id, user_id, session_token, expires_at, created_at, user_agent, ip_address) FROM stdin;
bd4fbf05-0f9f-4cde-98e6-9f2fdf797a3d	abf359c4-c8b0-4b53-beb6-8bc58aa25d3f	d05f24a46cde431b27e2c3d8c3d15d9b2196931caef27f40e090be75f240e883	2026-01-13 14:29:17+01	2025-12-14 14:29:17.290485+01	curl/8.7.1	45.94.211.152
f26d5fdb-cd28-4c2b-acb3-1f645d7a4668	abf359c4-c8b0-4b53-beb6-8bc58aa25d3f	2a828998dfb6babe693c845cd1e9b223a1e7654af3ca481b850c11281f784491	2026-01-13 14:29:56+01	2025-12-14 14:29:56.912236+01	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	45.94.211.152
ed318bb1-3b00-42cf-959c-21ad176d2189	1e047d84-16e5-4e32-be51-b17e70d7fa2a	479641b0c766ae7759bbbc5d2e3cc2f2b95dc92c9f32f12663cda7f28d9de79b	2026-01-13 14:40:31+01	2025-12-14 14:40:31.206617+01	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	45.94.211.152
3f03cbe4-0bea-4467-a015-3c64539b4a33	9c369621-9690-4933-a90c-391124a0b836	f8fdc31d9d409cb649d6b987e57f42518e867e6a17fc09148ff5ebbad895a18c	2026-01-13 14:55:59+01	2025-12-14 14:55:59.670312+01	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	45.94.211.152
59477203-4b2b-4c59-a8f1-3a538c955ecd	daf2bf57-6476-4ec4-b2d9-f920b97a477c	5cd4cdee27bca5f517f71b60e75ab52d37b6431c7aab9bc143d9c732a29c848b	2026-01-13 15:03:58+01	2025-12-14 15:03:58.658707+01	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1	45.94.211.152
377154ba-6510-4e7c-b969-acdd70a56b37	daf2bf57-6476-4ec4-b2d9-f920b97a477c	0f6513af4c2822fac073580ef42fb202804485ac3e48e0d82b66685c349f8e2c	2026-01-13 15:59:18+01	2025-12-14 15:59:18.714312+01	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	45.94.211.152
164c21ae-6ada-476f-b595-9a27425d3f1b	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	f4b5a74880da074d82601ea38d9875ecc23b7ab795e4287c23f167711baea7c5	2026-01-14 14:01:07+01	2025-12-15 15:01:07.452565+01	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	127.0.0.1
f7ea14ed-5d38-452e-b8e6-d15bd8a3754c	1e047d84-16e5-4e32-be51-b17e70d7fa2a	ac1df99fc101cadf3344c2357772da4386340613e2826ddf1c66a1e29f38874c	2026-01-14 15:49:41+01	2025-12-15 15:49:41.335969+01	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1	45.94.211.152
3dbdb0b6-bc2a-4991-a0b8-7bb667b430dc	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	1708ab228eb7f8a62664a502064d45070add99739c326627fad7fa5556652d3c	2026-01-14 15:50:23+01	2025-12-15 15:50:23.261996+01	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36	45.94.211.152
85c8fe0c-cf93-4cfc-a1f6-43a61a255bff	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	5c88660b42376d6e517ee0c48c2e668ffa7741ff4aa9b09dc659a0d297ac0f93	2026-01-14 16:05:09+01	2025-12-15 16:05:09.298453+01	Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.7 Mobile/15E148 Safari/604.1	45.94.211.152
4f4c23db-10fc-4fca-9832-d0140070742e	6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	40e38e40c13260b257081d152f8195e0cb12a2f5ce70c3f63fa19d58b438025b	2026-01-17 18:07:42+01	2025-12-18 18:07:42.404601+01	Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36	45.94.211.152
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: kfmn; Owner: kfmnmaestro
--

COPY kfmn.users (id, username, display_name, email, phone, password_hash, user_color, user_avatar, notifications_enabled, is_verified, verification_token, verification_expires_at, created_at, updated_at) FROM stdin;
abf359c4-c8b0-4b53-beb6-8bc58aa25d3f	testuser_5088	Test User	test@example.com	\N	$argon2id$v=19$m=65536,t=4,p=1$QkZKN21UME02c2pBZmpZZA$KumDCC3zwcKL0/9HBurtD83d7NwQfnF5zIISRjVfC7s	#3b82f6	🙏	t	t	\N	\N	2025-12-14 14:29:17.284933+01	2025-12-14 14:29:17.284933+01
6cca8a44-a3c4-4b7b-ab5d-4de3b815ccc3	chris	Christoph	\N	\N	$argon2id$v=19$m=65536,t=4,p=1$OE94dzcvdW1mMms2TUovcA$RbpHKIjemZ4PGu/URAT7u4ZzSCQQogZjAuybSL71nSw	#3b82f6	❤️	f	t	\N	\N	2025-12-14 14:34:12.372871+01	2025-12-14 14:34:12.372871+01
1e047d84-16e5-4e32-be51-b17e70d7fa2a	ina	Ina Maria	\N	\N	$argon2id$v=19$m=65536,t=4,p=1$VlZRcXVtYkdzSWk4UWRZVg$M+0imN8+Ufw16V7qihbkITZX5aabs6QU1KHqCX0d5Fk	#ef4444	❤️	f	t	\N	\N	2025-12-14 14:40:31.192831+01	2025-12-14 14:40:31.192831+01
9c369621-9690-4933-a90c-391124a0b836	anna	Anna Belle	chris@scharfmedia.de	\N	$argon2id$v=19$m=65536,t=4,p=1$bHZmdlhiNlhvaVhEbXF2Ng$NC8FLJoqQaBtEMMrBAAaQqk0TTCklaLtqZWnAp+p/2w	#ec4899	🌟	f	t	\N	\N	2025-12-14 14:55:59.660238+01	2025-12-14 14:55:59.660238+01
daf2bf57-6476-4ec4-b2d9-f920b97a477c	abraham	Vater Abraham	\N	017623840181	$argon2id$v=19$m=65536,t=4,p=1$S0JsVUwuZTRkenpoQmdFaQ$hqlxZYEHOGFbxuio3D75EDYBheYpiNCusPISDz0nZ74	#f59e0b	🌟	t	f	c7970683f800437e2286278804b73ee5	2025-12-15 15:03:58+01	2025-12-14 15:03:58.645152+01	2025-12-14 15:03:58.645152+01
\.


--
-- Name: prayers prayers_pkey; Type: CONSTRAINT; Schema: kfmn; Owner: kfmnmaestro
--

ALTER TABLE ONLY kfmn.prayers
    ADD CONSTRAINT prayers_pkey PRIMARY KEY (id);


--
-- Name: reaction_comments reaction_comments_pkey; Type: CONSTRAINT; Schema: kfmn; Owner: kfmnmaestro
--

ALTER TABLE ONLY kfmn.reaction_comments
    ADD CONSTRAINT reaction_comments_pkey PRIMARY KEY (id);


--
-- Name: reaction_users reaction_users_pkey; Type: CONSTRAINT; Schema: kfmn; Owner: kfmnmaestro
--

ALTER TABLE ONLY kfmn.reaction_users
    ADD CONSTRAINT reaction_users_pkey PRIMARY KEY (id);


--
-- Name: reaction_users reaction_users_reaction_id_user_id_key; Type: CONSTRAINT; Schema: kfmn; Owner: kfmnmaestro
--

ALTER TABLE ONLY kfmn.reaction_users
    ADD CONSTRAINT reaction_users_reaction_id_user_id_key UNIQUE (reaction_id, user_id);


--
-- Name: reactions reactions_pkey; Type: CONSTRAINT; Schema: kfmn; Owner: kfmnmaestro
--

ALTER TABLE ONLY kfmn.reactions
    ADD CONSTRAINT reactions_pkey PRIMARY KEY (id);


--
-- Name: reactions reactions_prayer_id_emoji_key; Type: CONSTRAINT; Schema: kfmn; Owner: kfmnmaestro
--

ALTER TABLE ONLY kfmn.reactions
    ADD CONSTRAINT reactions_prayer_id_emoji_key UNIQUE (prayer_id, emoji);


--
-- Name: scheduled_calls scheduled_calls_pkey; Type: CONSTRAINT; Schema: kfmn; Owner: kfmnmaestro
--

ALTER TABLE ONLY kfmn.scheduled_calls
    ADD CONSTRAINT scheduled_calls_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: kfmn; Owner: kfmnmaestro
--

ALTER TABLE ONLY kfmn.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_session_token_key; Type: CONSTRAINT; Schema: kfmn; Owner: kfmnmaestro
--

ALTER TABLE ONLY kfmn.user_sessions
    ADD CONSTRAINT user_sessions_session_token_key UNIQUE (session_token);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: kfmn; Owner: kfmnmaestro
--

ALTER TABLE ONLY kfmn.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: kfmn; Owner: kfmnmaestro
--

ALTER TABLE ONLY kfmn.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: kfmn; Owner: kfmnmaestro
--

ALTER TABLE ONLY kfmn.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: kfmn; Owner: kfmnmaestro
--

ALTER TABLE ONLY kfmn.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: idx_prayers_created_at; Type: INDEX; Schema: kfmn; Owner: kfmnmaestro
--

CREATE INDEX idx_prayers_created_at ON kfmn.prayers USING btree (created_at DESC);


--
-- Name: idx_prayers_user_id; Type: INDEX; Schema: kfmn; Owner: kfmnmaestro
--

CREATE INDEX idx_prayers_user_id ON kfmn.prayers USING btree (user_id);


--
-- Name: idx_reaction_comments_reaction_id; Type: INDEX; Schema: kfmn; Owner: kfmnmaestro
--

CREATE INDEX idx_reaction_comments_reaction_id ON kfmn.reaction_comments USING btree (reaction_id);


--
-- Name: idx_reaction_users_reaction_id; Type: INDEX; Schema: kfmn; Owner: kfmnmaestro
--

CREATE INDEX idx_reaction_users_reaction_id ON kfmn.reaction_users USING btree (reaction_id);


--
-- Name: idx_reaction_users_user_id; Type: INDEX; Schema: kfmn; Owner: kfmnmaestro
--

CREATE INDEX idx_reaction_users_user_id ON kfmn.reaction_users USING btree (user_id);


--
-- Name: idx_reactions_prayer_id; Type: INDEX; Schema: kfmn; Owner: kfmnmaestro
--

CREATE INDEX idx_reactions_prayer_id ON kfmn.reactions USING btree (prayer_id);


--
-- Name: idx_scheduled_calls_scheduled_at; Type: INDEX; Schema: kfmn; Owner: kfmnmaestro
--

CREATE INDEX idx_scheduled_calls_scheduled_at ON kfmn.scheduled_calls USING btree (scheduled_at);


--
-- Name: idx_user_sessions_expires_at; Type: INDEX; Schema: kfmn; Owner: kfmnmaestro
--

CREATE INDEX idx_user_sessions_expires_at ON kfmn.user_sessions USING btree (expires_at);


--
-- Name: idx_user_sessions_token; Type: INDEX; Schema: kfmn; Owner: kfmnmaestro
--

CREATE INDEX idx_user_sessions_token ON kfmn.user_sessions USING btree (session_token);


--
-- Name: idx_users_email; Type: INDEX; Schema: kfmn; Owner: kfmnmaestro
--

CREATE INDEX idx_users_email ON kfmn.users USING btree (email);


--
-- Name: idx_users_phone; Type: INDEX; Schema: kfmn; Owner: kfmnmaestro
--

CREATE INDEX idx_users_phone ON kfmn.users USING btree (phone);


--
-- Name: idx_users_username; Type: INDEX; Schema: kfmn; Owner: kfmnmaestro
--

CREATE INDEX idx_users_username ON kfmn.users USING btree (username);


--
-- Name: prayers update_prayers_updated_at; Type: TRIGGER; Schema: kfmn; Owner: kfmnmaestro
--

CREATE TRIGGER update_prayers_updated_at BEFORE UPDATE ON kfmn.prayers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: scheduled_calls update_scheduled_calls_updated_at; Type: TRIGGER; Schema: kfmn; Owner: kfmnmaestro
--

CREATE TRIGGER update_scheduled_calls_updated_at BEFORE UPDATE ON kfmn.scheduled_calls FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: kfmn; Owner: kfmnmaestro
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON kfmn.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: prayers prayers_user_id_fkey; Type: FK CONSTRAINT; Schema: kfmn; Owner: kfmnmaestro
--

ALTER TABLE ONLY kfmn.prayers
    ADD CONSTRAINT prayers_user_id_fkey FOREIGN KEY (user_id) REFERENCES kfmn.users(id) ON DELETE CASCADE;


--
-- Name: reaction_comments reaction_comments_reaction_id_fkey; Type: FK CONSTRAINT; Schema: kfmn; Owner: kfmnmaestro
--

ALTER TABLE ONLY kfmn.reaction_comments
    ADD CONSTRAINT reaction_comments_reaction_id_fkey FOREIGN KEY (reaction_id) REFERENCES kfmn.reactions(id) ON DELETE CASCADE;


--
-- Name: reaction_comments reaction_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: kfmn; Owner: kfmnmaestro
--

ALTER TABLE ONLY kfmn.reaction_comments
    ADD CONSTRAINT reaction_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES kfmn.users(id) ON DELETE CASCADE;


--
-- Name: reaction_users reaction_users_reaction_id_fkey; Type: FK CONSTRAINT; Schema: kfmn; Owner: kfmnmaestro
--

ALTER TABLE ONLY kfmn.reaction_users
    ADD CONSTRAINT reaction_users_reaction_id_fkey FOREIGN KEY (reaction_id) REFERENCES kfmn.reactions(id) ON DELETE CASCADE;


--
-- Name: reaction_users reaction_users_user_id_fkey; Type: FK CONSTRAINT; Schema: kfmn; Owner: kfmnmaestro
--

ALTER TABLE ONLY kfmn.reaction_users
    ADD CONSTRAINT reaction_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES kfmn.users(id) ON DELETE CASCADE;


--
-- Name: reactions reactions_prayer_id_fkey; Type: FK CONSTRAINT; Schema: kfmn; Owner: kfmnmaestro
--

ALTER TABLE ONLY kfmn.reactions
    ADD CONSTRAINT reactions_prayer_id_fkey FOREIGN KEY (prayer_id) REFERENCES kfmn.prayers(id) ON DELETE CASCADE;


--
-- Name: scheduled_calls scheduled_calls_created_by_fkey; Type: FK CONSTRAINT; Schema: kfmn; Owner: kfmnmaestro
--

ALTER TABLE ONLY kfmn.scheduled_calls
    ADD CONSTRAINT scheduled_calls_created_by_fkey FOREIGN KEY (created_by) REFERENCES kfmn.users(id);


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: kfmn; Owner: kfmnmaestro
--

ALTER TABLE ONLY kfmn.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES kfmn.users(id) ON DELETE CASCADE;


--
-- Name: DATABASE kfmndb; Type: ACL; Schema: -; Owner: kfmnmaestro
--

REVOKE CONNECT,TEMPORARY ON DATABASE kfmndb FROM PUBLIC;
GRANT TEMPORARY ON DATABASE kfmndb TO PUBLIC;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: kfmnmaestro
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict tv9g5ioGDz2vRsbj8KnijWjT8aQy1SQWVCPZJOI91h4eSN607ovJS3jO8MBlsNP

