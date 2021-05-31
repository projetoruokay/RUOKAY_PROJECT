//Efetuando a conexão com o MongoDB

const mongoose = require('mongoose');

const URI = 'mongodb+srv://ruokay:ruokay.usjt21@cluster0.otjpn.mongodb.net/RUOKAY?retryWrites=true&w=majority';

const env = process.env.NODE_ENV || 'dev';
let options = {};

mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

mongoose
  .connect(URI, options)
  .then(() => console.log('Conexão com o Banco de Dados, FUNCIONAL !!!'))
  .catch((err) => console.log(err));

