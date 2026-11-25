BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
ALTER TABLE multimedia_media ALTER COLUMN album_id DROP NOT NULL;
ALTER TABLE multimedia_media DROP CONSTRAINT multimedia_media_album_id_multimedia_albums_id_fk;
ALTER TABLE multimedia_media ADD CONSTRAINT multimedia_media_album_id_multimedia_albums_id_fk
  FOREIGN KEY (album_id) REFERENCES multimedia_albums(id) ON DELETE SET NULL;
CREATE TABLE multimedia_media_projects (
  media_id integer NOT NULL REFERENCES multimedia_media(id) ON DELETE CASCADE,
  project_id integer NOT NULL REFERENCES project(id) ON DELETE CASCADE,
  CONSTRAINT multimedia_media_projects_pair UNIQUE (media_id, project_id)
);
CREATE INDEX multimedia_media_projects_project_idx ON multimedia_media_projects(project_id);
COMMIT;
