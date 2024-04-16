const mysql = require('mysql2');

// Detalles conexi�n BD
    const dbConfig = {
    host: process.env.DB_ENDPOINT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// Validar conexi�n a BD
const db = mysql.createConnection(dbConfig);

// Fecha actual
const now = new Date();
const current_date = now.toISOString().split('T').join(' ').split('.')[0]
    

const handler = (event) => {
    // Limpiador
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
