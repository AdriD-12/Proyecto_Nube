-- Esquema
CREATE TABLE shortened_urls (
  hash VARCHAR(255) PRIMARY KEY,
  original_url VARCHAR(255) NOT NULL,
  short_url VARCHAR(255) NOT NULL,
  count INT DEFAULT 0,
  last_access TIMESTAMP,
  INDEX idx_original_url (original_url),
  INDEX idx_short_url (short_url)
);

-- Insert de prueba
INSERT INTO shortened_urls (hash, original_url, short_url)
VALUES ('t35th45h', 'iteso.instructure.com', 'sh50rtURL12');

-- Prueba select
SELECT *
FROM shortened_urls;

-- Prueba update
UPDATE shortened_urls
SET count = count + 1
WHERE hash = '';

-- Prueba delete
DELETE FROM shortened_urls;
