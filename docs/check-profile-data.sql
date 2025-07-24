-- Check the actual column names in the database
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_preferences'
ORDER BY ordinal_position;

-- Check a sample of the data
SELECT * FROM user_preferences LIMIT 1;