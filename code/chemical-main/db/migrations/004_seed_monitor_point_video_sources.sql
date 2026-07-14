-- Bind public demo video files to seeded monitor_point records.
-- Existing deployments can rerun this migration safely.

UPDATE monitor_point
SET camera_url = '/gas_video/气体1.mp4',
    source_type = 'seeded_dom_sensor',
    quality_status = 'CONFIGURED'
WHERE id = 1;

UPDATE monitor_point
SET camera_url = '/gas_video/气体2.mp4',
    source_type = 'seeded_dom_sensor',
    quality_status = 'CONFIGURED'
WHERE id = 2;

UPDATE monitor_point
SET camera_url = '/gas_video/气体3.mp4',
    source_type = 'seeded_dom_sensor',
    quality_status = 'CONFIGURED'
WHERE id = 3;

UPDATE monitor_point
SET camera_url = '/gas_video/气体4.mp4',
    source_type = 'seeded_dom_sensor',
    quality_status = 'CONFIGURED'
WHERE id = 4;
