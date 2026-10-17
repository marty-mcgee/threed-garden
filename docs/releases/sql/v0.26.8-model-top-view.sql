-- Review/apply before deploying code that selects this column. Not executed by the agent.
ALTER TABLE threed_models ADD COLUMN IF NOT EXISTS image_top_view_url text;
-- threed_model_files.model_id links each uploaded image to its Model; file_type = 'top-view'.
