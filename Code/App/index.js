// IS727272 - Server code
// Modules
const path = require('path');
const axios = require('axios');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const express = require('express');
const bodyParser = require('body-parser')
const { engine } = require('express-handlebars');

// Environment variables loading
dotenv.config();

// Server
const app = express();
const port = process.env.PORT || 3000;

// Render engine
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

// Static files
const assetsUrl = path.join(__dirname, 'public');
app.use('/assets', express.static(assetsUrl));

// Parse request correctly
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// DB connection details
const dbConfig = {
    host: process.env.DB_ENDPOINT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// Run server validating DB connection first
const db = mysql.createConnection(dbConfig);

// Routes
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
            reason: 'URL not provided'
        });

    // Remove head from original URL
    axios.post(`${process.env.API_GATEWAY_LAMBDA_ENDPOINT}/remove-head`, {
        url: original_url
    })
    .then(function (response) {
        body = response.data.body;
        headless_url = JSON.parse(body).headless;
        
        // Hash headless URL
        axios.post(`${process.env.API_GATEWAY_LAMBDA_ENDPOINT}/hash-url`, {
            url: headless_url
        })
        .then(function (response) {
            body = JSON.parse(response.data.body);
            hashed_url = body.hash;

            if (!hashed_url)
                return res.status(400).render('general_error', {
                    reason: 'Invalid URL form'
                });

            // Search if hash exists in database
            db.query('SELECT * FROM shortened_urls WHERE hash = ? LIMIT 1', hashed_url,
                function (error, results, fiels) {
                    if (error) return;

                    // URL already shortened
                    if (results.length == 1) {
                        return res.status(200).render('url_result', {
                            deploy_url: process.env.DEPLOY_URL,
                            short_url: results[0].short_url
                        });
                    }

                    // Shorten URL and insert into table
                    axios.post(`${process.env.API_GATEWAY_LAMBDA_ENDPOINT}/shorten-url`, {
                        url: headless_url
                    })
                    .then(function (response) {
                        body = response.data.body;
                        short_url = JSON.parse(body).short_url; // Short form

                        db.query(
                            'INSERT INTO shortened_urls (hash, original_url, short_url) VALUES (?, ?, ?)',
                            [hashed_url, headless_url, short_url],
                            function (error, results, fields) {
                                if (error) throw error;

                                // Return short link view
                                return res.status(200).render('url_result', {
                                    deploy_url: process.env.DEPLOY_URL,
                                    short_url: short_url
                                });
                        });
                    })
                    .catch(function (error) {
                        console.log(error);
                        return res.status(503).render('general_error', {
                            reason: 'Unknown error'
                        });
                    });
                }
            );
        })
        .catch(function (error) {
            console.log(error);
            return res.status(503).render('general_error', {
                reason: 'Unknown error'
            });
        });
    })
    .catch(function (error) {
        console.log(error);
        return res.status(503).render('general_error', {
            reason: 'Unknown error'
        });
    });
});

app.get('/:short_form', (req, res) => {
    url_portion = req.params.short_form;

    db.query(
        'SELECT * FROM shortened_urls WHERE short_url = ? LIMIT 1',
        [url_portion],
        function (error, results, fields) {
            if (error) // Shortened URL not found
                return res.status(404).render('general_error', {
                    non_shorter: true,
                    reason: 'URL not yet shortened'
                });
                
            // Redirect to destination first
            res.redirect(`//${results[0].original_url}`);
            
            // Update metrics
            hash_key = results[0].hash;
            now = new Date();
            current_date = now.toISOString().split('T').join(' ').split('.')[0]
            
            db.query(
                'UPDATE shortened_urls SET count = count + 1, last_access = ? WHERE hash = ?',
                [current_date, hash_key],
                function (error, results, fields) {
                    if (error) {
                        console.log(`Couldn't update metrics of entry ${hash_key}`);
                        return;
                    }
                }
            );
        }
    );
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    
    app.listen(port, () => {
        console.log('Connected to database');
        console.log(`App running on port ${port}`);
    });
})
