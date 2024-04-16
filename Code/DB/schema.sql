-- IS727272 - DB setting

-- Schema
CREATE TABLE shortened_urls (
  hash VARCHAR(255) PRIMARY KEY,
  original_url VARCHAR(255) NOT NULL,
  short_url VARCHAR(255) NOT NULL,
  count INT DEFAULT 0,
  last_access TIMESTAMP,
  INDEX idx_original_url (original_url),
  INDEX idx_short_url (short_url)
);
-- Index are used for fast querying

-- Test insert
INSERT INTO shortened_urls (hash, original_url, short_url)
VALUES ('t35th45h', 'iteso.instructure.com', 'sh50rtURL12');

-- Test select
SELECT *
FROM shortened_urls;

-- Test update
UPDATE shortened_urls
SET count = count + 1
WHERE hash = '';

-- Test delete (apply to remove all test entries)
DELETE FROM shortened_urls;
