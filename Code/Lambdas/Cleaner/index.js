const mysql = require('mysql2');

// DB connection details
    const dbConfig = {
    host: process.env.DB_ENDPOINT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// Run server validating DB connection first
const db = mysql.createConnection(dbConfig);

// Current date
const now = new Date();
const current_date = now.toISOString().split('T').join(' ').split('.')[0]
    

const handler = (event) => {
    // Cleanup
    db.query(
        'DELETE FROM shortened_urls WHERE last_access <= NOW() - INTERVAL 1 MONTH',
        function (error, results, fields) {
            console.log(results);
        }
    );
    
    const response = {
      statusCode: 200,
      body: JSON.stringify('Cleanup done.'),
    };
    return response;
  };

module.exports = { handler };
