-- Optional live catalog evidence for the full App schema audit.
-- Run the entire script manually. Returns one JSON document of schema metadata.
-- PostgreSQL 12+. Does not query business rows, role passwords, connection settings or sequence values.
-- Schema definitions can contain literals; review the metadata before sharing it.
-- Makes no schema/data changes. Includes all non-system schemas visible to this role.
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL statement_timeout = '30s';
SET LOCAL lock_timeout = '3s';
SET LOCAL search_path = pg_catalog;

WITH app_namespaces AS (
  SELECT oid, nspname FROM pg_namespace
  WHERE nspname <> 'information_schema' AND nspname !~ '^pg_'
), app_tables AS (
  SELECT c.*, n.nspname FROM pg_class c
  JOIN app_namespaces n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('r', 'p', 'f')
)
SELECT jsonb_build_object(
  'captured_at', transaction_timestamp(),
  'database', current_database(),
  'server_version', current_setting('server_version'),
  'max_identifier_length', current_setting('max_identifier_length'),
  'schemas', (SELECT coalesce(jsonb_agg(nspname ORDER BY nspname), '[]'::jsonb) FROM app_namespaces),
  'tables', (SELECT coalesce(jsonb_agg(jsonb_build_object(
    'schema', t.nspname, 'name', t.relname, 'kind', t.relkind,
    'row_security', t.relrowsecurity, 'force_row_security', t.relforcerowsecurity,
    'is_partition', t.relispartition,
    'partition_key', CASE WHEN t.relkind = 'p' THEN pg_get_partkeydef(t.oid) ELSE NULL END,
    'columns', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'position', a.attnum, 'name', a.attname, 'type', format_type(a.atttypid, a.atttypmod),
      'type_schema', tn.nspname, 'type_name', ty.typname,
      'array_element_type', et.typname, 'array_element_schema', en.nspname,
      'not_null', a.attnotnull, 'identity', a.attidentity, 'generated', a.attgenerated,
      'default', pg_get_expr(d.adbin, d.adrelid),
      'collation', CASE WHEN a.attcollation <> 0 THEN a.attcollation::regcollation::text ELSE NULL END
    ) ORDER BY a.attnum), '[]'::jsonb)
      FROM pg_attribute a JOIN pg_type ty ON ty.oid = a.atttypid
      JOIN pg_namespace tn ON tn.oid = ty.typnamespace
      LEFT JOIN pg_type et ON et.oid = ty.typelem
      LEFT JOIN pg_namespace en ON en.oid = et.typnamespace
      LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
      WHERE a.attrelid = t.oid AND a.attnum > 0 AND NOT a.attisdropped),
    'constraints', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'name', co.conname, 'kind', co.contype, 'definition', pg_get_constraintdef(co.oid, false),
      'validated', co.convalidated, 'deferrable', co.condeferrable, 'initially_deferred', co.condeferred,
      'local_columns', (SELECT jsonb_agg(a.attname ORDER BY k.position)
        FROM unnest(co.conkey) WITH ORDINALITY k(attnum, position)
        JOIN pg_attribute a ON a.attrelid = co.conrelid AND a.attnum = k.attnum),
      'target_schema', (SELECT ns.nspname FROM pg_class tc JOIN pg_namespace ns ON ns.oid = tc.relnamespace WHERE tc.oid = co.confrelid),
      'target_table', (SELECT tc.relname FROM pg_class tc WHERE tc.oid = co.confrelid),
      'target_columns', (SELECT jsonb_agg(a.attname ORDER BY k.position)
        FROM unnest(co.confkey) WITH ORDINALITY k(attnum, position)
        JOIN pg_attribute a ON a.attrelid = co.confrelid AND a.attnum = k.attnum)
    ) ORDER BY co.conname), '[]'::jsonb) FROM pg_constraint co WHERE co.conrelid = t.oid),
    'indexes', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'name', ic.relname, 'definition', pg_get_indexdef(i.indexrelid),
      'valid', i.indisvalid, 'ready', i.indisready,
      'unique', i.indisunique, 'primary', i.indisprimary,
      'predicate', pg_get_expr(i.indpred, i.indrelid)
    ) ORDER BY ic.relname), '[]'::jsonb)
      FROM pg_index i JOIN pg_class ic ON ic.oid = i.indexrelid WHERE i.indrelid = t.oid),
    'policies', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'name', p.polname, 'command', p.polcmd, 'permissive', p.polpermissive,
      'roles', (SELECT jsonb_agg(CASE WHEN r.role_oid = 0 THEN 'PUBLIC' ELSE pg_get_userbyid(r.role_oid)::text END ORDER BY r.role_oid)
        FROM unnest(p.polroles) r(role_oid)),
      'using', pg_get_expr(p.polqual, p.polrelid), 'with_check', pg_get_expr(p.polwithcheck, p.polrelid)
    ) ORDER BY p.polname), '[]'::jsonb) FROM pg_policy p WHERE p.polrelid = t.oid),
    'triggers', (SELECT coalesce(jsonb_agg(jsonb_build_object(
      'name', tr.tgname, 'enabled', tr.tgenabled, 'definition', pg_get_triggerdef(tr.oid, false)
    ) ORDER BY tr.tgname), '[]'::jsonb) FROM pg_trigger tr WHERE tr.tgrelid = t.oid AND NOT tr.tgisinternal)
  ) ORDER BY t.nspname, t.relname), '[]'::jsonb) FROM app_tables t),
  'enums', (SELECT coalesce(jsonb_agg(jsonb_build_object(
    'schema', n.nspname, 'name', t.typname,
    'values', (SELECT jsonb_agg(e.enumlabel ORDER BY e.enumsortorder) FROM pg_enum e WHERE e.enumtypid = t.oid)
  ) ORDER BY n.nspname, t.typname), '[]'::jsonb)
    FROM pg_type t JOIN app_namespaces n ON n.oid = t.typnamespace WHERE t.typtype = 'e'),
  'domains', (SELECT coalesce(jsonb_agg(jsonb_build_object(
    'schema', n.nspname, 'name', t.typname, 'base_type', format_type(t.typbasetype, t.typtypmod),
    'not_null', t.typnotnull, 'default', t.typdefault,
    'constraints', (SELECT jsonb_agg(pg_get_constraintdef(c.oid, false) ORDER BY c.conname) FROM pg_constraint c WHERE c.contypid = t.oid)
  ) ORDER BY n.nspname, t.typname), '[]'::jsonb)
    FROM pg_type t JOIN app_namespaces n ON n.oid = t.typnamespace WHERE t.typtype = 'd'),
  'sequences', (SELECT coalesce(jsonb_agg(jsonb_build_object(
    'schema', n.nspname, 'name', c.relname, 'type', format_type(s.seqtypid, NULL),
    'start', s.seqstart, 'increment', s.seqincrement, 'min', s.seqmin,
    'max', s.seqmax, 'cache', s.seqcache, 'cycle', s.seqcycle,
    'owned_by', (SELECT jsonb_agg(jsonb_build_object('schema', tn.nspname, 'table', tc.relname, 'column', a.attname))
      FROM pg_depend dep JOIN pg_class tc ON tc.oid = dep.refobjid
      JOIN pg_namespace tn ON tn.oid = tc.relnamespace
      JOIN pg_attribute a ON a.attrelid = tc.oid AND a.attnum = dep.refobjsubid
      WHERE dep.classid = 'pg_class'::regclass AND dep.objid = c.oid
        AND dep.refclassid = 'pg_class'::regclass AND dep.deptype IN ('a', 'i'))
  ) ORDER BY n.nspname, c.relname), '[]'::jsonb)
    FROM pg_sequence s JOIN pg_class c ON c.oid = s.seqrelid JOIN app_namespaces n ON n.oid = c.relnamespace),
  'views', (SELECT coalesce(jsonb_agg(jsonb_build_object(
    'schema', n.nspname, 'name', c.relname, 'kind', c.relkind, 'definition', pg_get_viewdef(c.oid, false)
  ) ORDER BY n.nspname, c.relname), '[]'::jsonb)
    FROM pg_class c JOIN app_namespaces n ON n.oid = c.relnamespace WHERE c.relkind IN ('v', 'm')),
  'routines', (SELECT coalesce(jsonb_agg(jsonb_build_object(
    'schema', n.nspname, 'name', p.proname, 'kind', p.prokind,
    'arguments', pg_get_function_identity_arguments(p.oid), 'returns', pg_get_function_result(p.oid),
    'security_definer', p.prosecdef, 'volatility', p.provolatile, 'language', l.lanname
  ) ORDER BY n.nspname, p.proname, p.oid), '[]'::jsonb)
    FROM pg_proc p JOIN app_namespaces n ON n.oid = p.pronamespace JOIN pg_language l ON l.oid = p.prolang),
  'extensions', (SELECT coalesce(jsonb_agg(jsonb_build_object('name', extname, 'version', extversion) ORDER BY extname), '[]'::jsonb) FROM pg_extension)
) AS schema_audit;

ROLLBACK;
