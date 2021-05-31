const express = require('express');
const app = express();
const morgan = require('morgan');
const busboy = require('connect-busboy');
const busboyBodyParser = require('busboy-body-parser');
const cors = require('cors');

// DATABASE
require('./database');

app.use(morgan('dev'));
app.use(busboy());
app.use(busboyBodyParser());
app.use(cors());
app.use(express.json());
app.use(cors());

app.set('port', 4200);

// ROUTES
app.use('/clinica', require('./src/routes/clinica.routes'));
app.use('/especialidade', require('./src/routes/especialidade.routes'));
app.use('/horario', require('./src/routes/horario.routes'));
app.use('/profissional', require('./src/routes/profissional.routes'));



app.listen(app.get('port'), function () {
  console.log('WebService, FUNCIONAL ' + app.get('port'));
});