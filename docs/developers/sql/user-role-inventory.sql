-- Optional read-only inventory for the App Users role editor. No account changes.
SELECT role, is_active, count(*) AS account_count
FROM public."user"
GROUP BY role, is_active
ORDER BY role NULLS FIRST, is_active NULLS FIRST;

SELECT count(*) AS expected_legacy_count
FROM public."user" WHERE role = 'user';

-- Review these individually; do not silently map unknown/null roles to Admin.
SELECT id, role, is_active FROM public."user"
WHERE role IS NULL OR role NOT IN ('user', 'admin', 'super_admin');

SELECT id, is_active FROM public."user" WHERE role = 'super_admin';
