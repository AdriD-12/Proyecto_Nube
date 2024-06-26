// Modulos
const path = require('path');
const axios = require('axios');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser')
const { engine } = require('express-handlebars');

// Variables de entorno
dotenv.config();

// Servidor
const app = express();
const port = process.env.PORT || 3000;

// Motor de renderizaci�n
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

// Archivos estaticos
const assetsUrl = path.join(__dirname, 'public');
app.use('/assets', express.static(assetsUrl));

// Utileria para peticiones JSON
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Detalles de conexi�n BD
const dbConfig = {
    host: process.env.DB_ENDPOINT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// Validar conexi�n a BD
const db = mysql.createConnection(dbConfig);

// Rutas
app.get('', (req, res) => {
    const url = path.join(__dirname, 'public', 'index.html');
    res.sendFile(url);
});

app.get('/home', (req, res) => {
    res.redirect('/');
});

app.get('/about', (req, res) => {
    const url = path.join(__dirname, 'public', 'about.html');
    res.sendFile(url);
});

app.post('/short-url', (req, res) => {
    original_url = req.body.url;

    if (!original_url)
        return res.status(400).render('general_error', {
            reason: 'URL no proporcionada'
        });

    // Lambda para remover protocolo
    console.log("URL destino:", process.env.API_GATEWAY_LAMBDA_ENDPOINT);
    axios.post(`${process.env.API_GATEWAY_LAMBDA_ENDPOINT}/removeHead`, {
        url: original_url
    })
    .then(function (response) {
        body = response.data.body;
        headless_url = JSON.parse(body).headless;
        
        // Lambda para hash
        axios.post(`${process.env.API_GATEWAY_LAMBDA_ENDPOINT}/hashURL`, {
            url: headless_url
        })
        .then(function (response) {
	    console.log(response);
            body = JSON.parse(response.data.body);
            hashed_url = body.hash;

            if (!hashed_url)
                return res.status(400).render('general_error', {
                    reason: 'Formato de URL inv�lido'
                });

            // Buscar si existe la URL
            db.query('SELECT * FROM shortened_urls WHERE hash = ? LIMIT 1', hashed_url,
                function (error, results, fiels) {
                    if (error) return;

                    // Aviso que ya existe
                    if (results.length == 1) {
                        return res.status(200).render('url_result', {
                            deploy_url: process.env.DEPLOY_URL,
                            short_url: results[0].short_url
                        });
                    }

                    // Agregar en la tabla 
                    axios.post(`${process.env.API_GATEWAY_LAMBDA_ENDPOINT}/shortenURL`, {
                        url: headless_url
                    })
                    .then(function (response) {
                        body = response.data.body;
                        short_url = JSON.parse(body).short_url; // Versi�n corta URL

                        db.query(
                            'INSERT INTO shortened_urls (hash, original_url, short_url) VALUES (?, ?, ?)',
                            [hashed_url, headless_url, short_url],
                            function (error, results, fields) {
                                if (error) throw error;

                                // Regresa vista de la URL acortada
                                return res.status(200).render('url_result', {
                                    deploy_url: process.env.DEPLOY_URL,
                                    short_url: short_url
                                });
                        });
                    })
                    .catch(function (error) {
                        console.log(error);
                        return res.status(503).render('general_error', {
                            reason: 'Error desconocido'
                        });
                    });
                }
            );
        })
        .catch(function (error) {
            console.log(error);
            return res.status(503).render('general_error', {
                reason: 'Error desconocido'
            });
        });
    })
    .catch(function (error) {
        console.log(error);
        return res.status(503).render('general_error', {
            reason: 'Error desconocido'
        });
    });
});

app.get('/:short_form', (req, res) => {
    url_portion = req.params.short_form;

    db.query(
        'SELECT * FROM shortened_urls WHERE short_url = ? LIMIT 1',
        [url_portion],
        function (error, results, fields) {
            if (error) // No se encontro la URL acortada
                return res.status(404).render('general_error', {
                    non_shorter: true,
                    reason: 'URL a�n no acortada'
                });
                
            // Redirigue a destino
            res.redirect(`//${results[0].original_url}`);
            
            // Actualiza las metricas
            hash_key = results[0].hash;
            now = new Date();
            current_date = now.toISOString().split('T').join(' ').split('.')[0]
            
            db.query(
                'UPDATE shortened_urls SET count = count + 1, last_access = ? WHERE hash = ?',
                [current_date, hash_key],
                function (error, results, fields) {
                    if (error) {
                        console.log(`No se pudo actualizar las m�tricas de ${hash_key}`);
                        return;
                    }
                }
            );
        }
    );
});

db.connect((err) => {
    if (err) {
        console.error('Error al conectarse a la base de datos:', err);
        return;
    }
    
    app.listen(port, () => {
        console.log('Conexi�n exit�sa a la base de datos');
        console.log(`App corriendo en el puerto ${port}`);
    });
})
